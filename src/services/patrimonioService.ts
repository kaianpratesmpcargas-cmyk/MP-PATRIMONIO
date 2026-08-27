import { getSupabase } from './supabase';
import type { Patrimonio, NewPatrimonioInput } from '../types/patrimonio';
import { getLabelConfig } from './configService';

/**
 * Normaliza o código para busca flexível (ex: 'mp-123' -> 'MP-000123', 'pat-123' -> 'PAT-000123' ou '123' -> 'MP-000123')
 */
export function formatCodeInput(input: string): string {
  const clean = input.trim();
  if (!clean) return '';

  const prefix = (getLabelConfig().codigoPrefixo || 'MP').toUpperCase();

  // Se já estiver no formato MP-XXXXXX ou PAT-XXXXXX
  if (/^(MP|PAT)-\d+$/i.test(clean)) {
    const parts = clean.split('-');
    const currentPrefix = parts[0].toUpperCase();
    const numPart = parts[1];
    return `${currentPrefix}-${numPart.padStart(6, '0')}`;
  }

  // Se for qualquer outro PREFIXO-NUMERO
  if (/^[A-Za-z]+-\d+$/.test(clean)) {
    const parts = clean.split('-');
    return `${parts[0].toUpperCase()}-${parts[1].padStart(6, '0')}`;
  }

  // Se for apenas números (ex: 125 ou 000125)
  if (/^\d+$/.test(clean)) {
    return `${prefix}-${clean.padStart(6, '0')}`;
  }

  return clean.toUpperCase();
}

/**
 * Obtém o próximo código sequencial de patrimônio (MP-000001, MP-000002...)
 */
export async function getNextPatrimonioCode(): Promise<string> {
  const prefix = (getLabelConfig().codigoPrefixo || 'MP').toUpperCase();
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não está configurado.');
  }

  try {
    // Tenta executar a função RPC caso esteja criada no banco
    const { data: rpcCode, error: rpcError } = await supabase.rpc('get_next_code');
    if (!rpcError && rpcCode) {
      // Se retornou código mas com prefixo antigo, ajusta com o número
      const match = rpcCode.match(/\d+/);
      if (match) {
        return `${prefix}-${match[0].padStart(6, '0')}`;
      }
      return rpcCode;
    }

    // Fallback: Busca os últimos cadastrados para calcular o maior número
    const { data, error } = await supabase
      .from('patrimonios')
      .select('codigo')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!data || data.length === 0) {
      return `${prefix}-000001`;
    }

    let maxNum = 0;
    for (const row of data) {
      if (row.codigo) {
        const match = row.codigo.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }

    const nextNum = maxNum + 1;
    return `${prefix}-${nextNum.toString().padStart(6, '0')}`;
  } catch (err) {
    console.warn('Fallback no cálculo do próximo código:', err);
    return `${prefix}-000001`;
  }
}


/**
 * Cadastra um novo patrimônio no Supabase
 */
export async function createPatrimonio(item: NewPatrimonioInput): Promise<Patrimonio> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não conectado. Configure a URL e a chave de acesso.');
  }

  let finalCodigo = item.codigo ? formatCodeInput(item.codigo) : '';
  if (!finalCodigo) {
    finalCodigo = await getNextPatrimonioCode();
  }

  const payload = {
    codigo: finalCodigo,
    descricao: item.descricao.trim(),
    categoria: item.categoria?.trim() || null,
    setor: item.setor?.trim() || null,
    localizacao: item.localizacao?.trim() || null,
    responsavel: item.responsavel?.trim() || null,
    numero_serie: item.numero_serie?.trim() || null,
    status: item.status || 'Ativo',
  };

  const { data, error } = await supabase
    .from('patrimonios')
    .insert([payload])
    .select()
    .single();

  if (error) {
    if (error.code === '23505' || error.message.includes('unique')) {
      throw new Error(`O código ${finalCodigo} já está em uso por outro patrimônio.`);
    }
    throw new Error(error.message || 'Erro ao salvar no banco central');
  }

  // Registra no histórico
  try {
    await registrarHistorico({
      patrimonio_codigo: finalCodigo,
      tipo: 'cadastro',
      titulo: 'Cadastrado no Sistema',
      descricao: `Patrimônio criado com status "${payload.status}"`,
      setor_novo: payload.setor || undefined,
      responsavel: payload.responsavel || undefined,
    });
  } catch {
    // Silently continue
  }

  return data as Patrimonio;
}


/**
 * Busca um patrimônio exatamente pelo código
 */
export async function getPatrimonioByCodigo(codigo: string): Promise<Patrimonio | null> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não conectado.');
  }

  const formattedCode = formatCodeInput(codigo);
  const rawCode = codigo.trim();

  // Busca pelo código formatado ou pelo código cru digitado
  const { data, error } = await supabase
    .from('patrimonios')
    .select('*')
    .or(`codigo.ilike.${formattedCode},codigo.ilike.${rawCode}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as Patrimonio) || null;
}

/**
 * Pesquisa patrimônios por termo (código, descrição ou número de série)
 */
export async function searchPatrimonios(term: string): Promise<Patrimonio[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não conectado.');
  }

  const cleanTerm = term.trim();
  if (!cleanTerm) {
    return getAllPatrimonios();
  }

  const formattedCode = formatCodeInput(cleanTerm);

  const { data, error } = await supabase
    .from('patrimonios')
    .select('*')
    .or(`codigo.ilike.%${cleanTerm}%,codigo.ilike.%${formattedCode}%,descricao.ilike.%${cleanTerm}%,numero_serie.ilike.%${cleanTerm}%`)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  return (data as Patrimonio[]) || [];
}

/**
 * Lista todos os patrimônios cadastrados
 */
export async function getAllPatrimonios(limit: number = 200): Promise<Patrimonio[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não conectado.');
  }

  const { data, error } = await supabase
    .from('patrimonios')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data as Patrimonio[]) || [];
}

/**
 * Retorna a contagem total de itens no banco
 */
export async function getTotalPatrimoniosCount(): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('patrimonios')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Erro ao contar patrimônios:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Cria múltiplos patrimônios em lote com numeração sequencial
 */
export async function createPatrimoniosBatch(
  count: number,
  baseData: {
    descricao: string;
    categoria?: string;
    setor?: string;
    localizacao?: string;
    responsavel?: string;
    status?: string;
  }
): Promise<Patrimonio[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não conectado.');
  }

  const prefix = (getLabelConfig().codigoPrefixo || 'MP').toUpperCase();

  // Obtém o código inicial
  const firstCode = await getNextPatrimonioCode();
  const match = firstCode.match(/\d+/);
  const startNum = match ? parseInt(match[0], 10) : 1;

  const recordsToInsert = [];
  for (let i = 0; i < count; i++) {
    const currentNum = startNum + i;
    const currentCode = `${prefix}-${currentNum.toString().padStart(6, '0')}`;

    recordsToInsert.push({
      codigo: currentCode,
      descricao: baseData.descricao.trim(),
      categoria: baseData.categoria?.trim() || null,
      setor: baseData.setor?.trim() || null,
      localizacao: baseData.localizacao?.trim() || null,
      responsavel: baseData.responsavel?.trim() || null,
      status: baseData.status || 'Ativo',
    });
  }

  const { data, error } = await supabase
    .from('patrimonios')
    .insert(recordsToInsert)
    .select();

  if (error) {
    throw new Error(error.message || 'Erro ao cadastrar patrimônios em lote.');
  }

  return (data as Patrimonio[]) || [];
}

/**
 * Atualiza o status, condição e registra a data de conferência de um patrimônio
 */
export async function updatePatrimonioConferencia(
  codigo: string,
  data: {
    status: string;
    condicao?: string;
    observacoes?: string;
    setor?: string;
    localizacao?: string;
    responsavel?: string;
  }
): Promise<Patrimonio> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não conectado.');
  }

  const formattedCode = formatCodeInput(codigo);
  const nowIso = new Date().toISOString();

  const payload: any = {
    status: data.status,
    ultima_conferencia_at: nowIso,
  };

  if (data.condicao !== undefined) payload.condicao = data.condicao;
  if (data.observacoes !== undefined) payload.observacoes = data.observacoes;
  if (data.setor !== undefined) payload.setor = data.setor;
  if (data.localizacao !== undefined) payload.localizacao = data.localizacao;
  if (data.responsavel !== undefined) payload.responsavel = data.responsavel;

  const { data: updated, error } = await supabase
    .from('patrimonios')
    .update(payload)
    .ilike('codigo', formattedCode)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Erro ao registrar conferência do patrimônio.');
  }

  // Registra no histórico de movimentação
  try {
    let tituloEvento = 'Conferência Realizada';
    if (data.status === 'Baixado' || data.status === 'Avariado') {
      tituloEvento = `Baixa Registrada (${data.status})`;
    } else if (data.status === 'Em Manutenção') {
      tituloEvento = 'Encaminhado para Manutenção';
    } else if (data.condicao) {
      tituloEvento = `Conferido: ${data.condicao}`;
    }

    await registrarHistorico({
      patrimonio_codigo: formattedCode,
      tipo: data.status === 'Baixado' ? 'baixa' : 'conferencia',
      titulo: tituloEvento,
      descricao: data.observacoes || `Status atualizado para "${data.status}"`,
      setor_novo: data.setor || updated.setor,
      responsavel: data.responsavel || updated.responsavel,
    });
  } catch (histErr) {
    console.warn('Não foi possível gravar log no histórico:', histErr);
  }

  return updated as Patrimonio;
}

/**
 * Atualiza os dados de cadastro de um patrimônio (Edição/Correção)
 */
export async function updatePatrimonio(
  codigo: string,
  updates: {
    descricao: string;
    categoria?: string;
    setor?: string;
    localizacao?: string;
    responsavel?: string;
    numero_serie?: string;
    status?: string;
    condicao?: string;
    observacoes?: string;
  }
): Promise<Patrimonio> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não conectado.');
  }

  const formattedCode = formatCodeInput(codigo);

  // Busca dados anteriores para comparar se houve movimentação de setor
  const { data: itemAntigo } = await supabase
    .from('patrimonios')
    .select('setor, localizacao, status')
    .ilike('codigo', formattedCode)
    .maybeSingle();

  const payload: any = {
    descricao: updates.descricao.trim(),
    categoria: updates.categoria?.trim() || null,
    setor: updates.setor?.trim() || null,
    localizacao: updates.localizacao?.trim() || null,
    responsavel: updates.responsavel?.trim() || null,
    numero_serie: updates.numero_serie?.trim() || null,
    status: updates.status || 'Ativo',
  };

  if (updates.condicao !== undefined) payload.condicao = updates.condicao;
  if (updates.observacoes !== undefined) payload.observacoes = updates.observacoes;

  const { data: updated, error } = await supabase
    .from('patrimonios')
    .update(payload)
    .ilike('codigo', formattedCode)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Erro ao atualizar dados do patrimônio.');
  }

  // Registra no histórico
  try {
    const mudouSetor = itemAntigo && itemAntigo.setor !== payload.setor;
    const mudouStatus = itemAntigo && itemAntigo.status !== payload.status;

    let titulo = 'Cadastro Editado';
    let tipo = 'edicao';

    if (mudouSetor) {
      titulo = `Transferido de Setor (${itemAntigo?.setor || 'Sem setor'} ➔ ${payload.setor || 'Sem setor'})`;
      tipo = 'movimentacao';
    } else if (mudouStatus) {
      titulo = `Status alterado para "${payload.status}"`;
    }

    await registrarHistorico({
      patrimonio_codigo: formattedCode,
      tipo,
      titulo,
      descricao: updates.observacoes || (mudouSetor ? `Item alocado em ${payload.localizacao || 'novo local'}` : 'Dados do patrimônio corrigidos'),
      setor_anterior: itemAntigo?.setor,
      setor_novo: payload.setor,
      responsavel: payload.responsavel,
    });
  } catch (histErr) {
    console.warn('Erro ao salvar histórico de edição:', histErr);
  }

  return updated as Patrimonio;
}

/**
 * Registra um evento no histórico/linha do tempo do patrimônio
 */
export async function registrarHistorico(evento: {
  patrimonio_codigo: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  setor_anterior?: string;
  setor_novo?: string;
  responsavel?: string;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('historico_patrimonio').insert([
      {
        patrimonio_codigo: formatCodeInput(evento.patrimonio_codigo),
        tipo: evento.tipo,
        titulo: evento.titulo,
        descricao: evento.descricao || null,
        setor_anterior: evento.setor_anterior || null,
        setor_novo: evento.setor_novo || null,
        responsavel: evento.responsavel || null,
      },
    ]);
  } catch (err) {
    console.warn('Aviso: Tabela historico_patrimonio ainda não criada ou inacessível:', err);
  }
}

/**
 * Busca o histórico de movimentações e auditorias de um patrimônio
 */
export async function getHistoricoPatrimonio(codigo: string): Promise<any[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const formattedCode = formatCodeInput(codigo);

  try {
    const { data, error } = await supabase
      .from('historico_patrimonio')
      .select('*')
      .ilike('patrimonio_codigo', formattedCode)
      .order('criado_em', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Aviso ao carregar histórico:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('Falha na busca de histórico:', err);
    return [];
  }
}

/**
 * Agrupa todos os patrimônios por Setor para o Painel Visual de Setores e Salas
 */
export async function getPatrimoniosGroupedBySetor(): Promise<{
  setores: {
    nome: string;
    total: number;
    ativos: number;
    manutencao: number;
    baixados: number;
    itens: Patrimonio[];
  }[];
  totalGeral: number;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase não conectado.');
  }

  const { data, error } = await supabase
    .from('patrimonios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Erro ao carregar setores.');
  }

  const allItens: Patrimonio[] = data || [];
  const mapSetores = new Map<string, Patrimonio[]>();

  for (const item of allItens) {
    const setorNome = (item.setor && item.setor.trim()) ? item.setor.trim() : 'Sem Setor Definido';
    if (!mapSetores.has(setorNome)) {
      mapSetores.set(setorNome, []);
    }
    mapSetores.get(setorNome)!.push(item);
  }

  const setoresResumo = Array.from(mapSetores.entries()).map(([nome, itens]) => {
    return {
      nome,
      total: itens.length,
      ativos: itens.filter((i) => i.status === 'Ativo').length,
      manutencao: itens.filter((i) => i.status === 'Em Manutenção').length,
      baixados: itens.filter((i) => i.status === 'Baixado' || i.status === 'Avariado').length,
      itens,
    };
  });

  // Ordena por quantidade de itens (decrescente)
  setoresResumo.sort((a, b) => b.total - a.total);

  return {
    setores: setoresResumo,
    totalGeral: allItens.length,
  };
}

/**
 * Gera o link do WhatsApp para envio do Comprovante de Entrega do Patrimônio
 */
export function generateWhatsAppComprovanteLink(item: Patrimonio, telefoneDestinatario?: string): string {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const horaHoje = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const saudacaoNome = item.responsavel && item.responsavel.trim() 
    ? `Olá *${item.responsavel.trim()}*,` 
    : 'Olá,';

  const localizacaoTexto = [item.setor, item.localizacao].filter(Boolean).join(' • ') || 'Não especificado';

  const texto = 
`${saudacaoNome}

📦 *COMPROVANTE DE ENTREGA DE PATRIMÔNIO*
🏢 *MP CARGAS — LOGÍSTICA & TRANSPORTES*
━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ *Código:* *${item.codigo}*
📋 *Descrição:* *${item.descricao}*
📍 *Setor / Local:* ${localizacaoTexto}
${item.numero_serie ? `🔢 *Nº de Série:* ${item.numero_serie}\n` : ''}⚡ *Status:* *${item.status || 'Ativo'}*
📅 *Data:* ${dataHoje} às ${horaHoje}

━━━━━━━━━━━━━━━━━━━━━━━━━━
_Confirmo a entrega e guarda do equipamento acima sob minha responsabilidade._
_Em caso de avaria, manutenção ou transferência de setor, comunique a coordenação da MP CARGAS._`;

  const textoEncoded = encodeURIComponent(texto);

  if (telefoneDestinatario && telefoneDestinatario.trim()) {
    const numLimpo = telefoneDestinatario.replace(/\D/g, '');
    const numFinal = numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`;
    return `https://wa.me/${numFinal}?text=${textoEncoded}`;
  }

  return `https://wa.me/?text=${textoEncoded}`;
}





