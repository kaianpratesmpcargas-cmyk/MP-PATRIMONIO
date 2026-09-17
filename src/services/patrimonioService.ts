import { getSupabase } from './supabase';
import type { Patrimonio, NewPatrimonioInput } from '../types/patrimonio';
import { getLabelConfig } from './configService';

const LOCAL_STORAGE_PATRIMONIOS_KEY = 'mp_patrimonios_local';
const LOCAL_STORAGE_HISTORICO_KEY = 'mp_historico_local';

const INITIAL_MOCK_PATRIMONIOS: Patrimonio[] = [
  {
    id: 'mock-1',
    codigo: 'MP-000001',
    descricao: 'Notebook Dell Latitude 5420 Core i7 16GB SSD 512GB',
    categoria: 'TI / Informática',
    setor: 'Tecnologia da Informação',
    localizacao: 'Bancada 01 - Matriz',
    responsavel: 'Carlos Silva',
    numero_serie: 'BR5420X991',
    status: 'Ativo',
    condicao: 'Excelente',
    observacoes: 'Equipamento entregue com carregador e mochila.',
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
  {
    id: 'mock-2',
    codigo: 'MP-000002',
    descricao: 'Monitor LG UltraWide 29" IPS Full HD',
    categoria: 'TI / Informática',
    setor: 'Tecnologia da Informação',
    localizacao: 'Mesa TI - Posição 02',
    responsavel: 'Carlos Silva',
    numero_serie: 'LG29WK600-99',
    status: 'Ativo',
    condicao: 'Bom',
    observacoes: 'Acompanha cabo HDMI e fonte bivolt.',
    created_at: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
  },
  {
    id: 'mock-3',
    codigo: 'MP-000003',
    descricao: 'Cadeira Presidente Ergonômica Giratória Couro Preto',
    categoria: 'Mobiliário',
    setor: 'Diretoria',
    localizacao: 'Gabinete 01',
    responsavel: 'Roberto Santos',
    numero_serie: 'CAD-PRES-092',
    status: 'Ativo',
    condicao: 'Excelente',
    observacoes: 'Regulagem 3D e apoio de cabeça.',
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 'mock-4',
    codigo: 'MP-000004',
    descricao: 'Impressora Térmica de Etiquetas Zebra ZD220',
    categoria: 'Logística / Automação',
    setor: 'Expedição / Galpão',
    localizacao: 'Doca Principal',
    responsavel: 'Marcos Souza',
    numero_serie: 'ZBR220-44910',
    status: 'Ativo',
    condicao: 'Bom',
    observacoes: 'Configurada para ribbon 110mm x 74m.',
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: 'mock-5',
    codigo: 'MP-000005',
    descricao: 'Paleteira Hidráulica Manual Capacidade 2.500kg',
    categoria: 'Operações / Logística',
    setor: 'Operações / Pátio',
    localizacao: 'Doca 02 - Triagem',
    responsavel: 'Fernando Lima',
    numero_serie: 'PAL-MAN-250',
    status: 'Em Manutenção',
    condicao: 'Avariado / Revisão',
    observacoes: 'Troca do retentor hidráulico solicitada.',
    created_at: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
  },
];

function getLocalPatrimonios(): Patrimonio[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PATRIMONIOS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_PATRIMONIOS_KEY, JSON.stringify(INITIAL_MOCK_PATRIMONIOS));
      return INITIAL_MOCK_PATRIMONIOS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler patrimônios do LocalStorage:', e);
    return INITIAL_MOCK_PATRIMONIOS;
  }
}

function saveLocalPatrimonios(list: Patrimonio[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PATRIMONIOS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao salvar patrimônios no LocalStorage:', e);
  }
}

function getLocalHistorico(): any[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORICO_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistorico(evento: any): void {
  try {
    const list = getLocalHistorico();
    list.unshift({
      id: 'hist-' + Date.now(),
      ...evento,
      criado_em: new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_STORAGE_HISTORICO_KEY, JSON.stringify(list.slice(0, 200)));
  } catch (e) {
    console.warn('Erro ao salvar historico local:', e);
  }
}

export function formatCodeInput(input: string): string {
  const clean = input.trim();
  if (!clean) return '';

  const prefix = (getLabelConfig().codigoPrefixo || 'MP').toUpperCase();

  if (/^(MP|PAT)-\d+$/i.test(clean)) {
    const parts = clean.split('-');
    const currentPrefix = parts[0].toUpperCase();
    const numPart = parts[1];
    return `${currentPrefix}-${numPart.padStart(6, '0')}`;
  }

  if (/^[A-Za-z]+-\d+$/.test(clean)) {
    const parts = clean.split('-');
    return `${parts[0].toUpperCase()}-${parts[1].padStart(6, '0')}`;
  }

  if (/^\d+$/.test(clean)) {
    return `${prefix}-${clean.padStart(6, '0')}`;
  }

  return clean.toUpperCase();
}

export async function getNextPatrimonioCode(): Promise<string> {
  const prefix = (getLabelConfig().codigoPrefixo || 'MP').toUpperCase();
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: rpcCode, error: rpcError } = await supabase.rpc('get_next_code');
      if (!rpcError && rpcCode) {
        const match = rpcCode.match(/\d+/);
        if (match) {
          return `${prefix}-${match[0].padStart(6, '0')}`;
        }
        return rpcCode;
      }

      const { data, error } = await supabase
        .from('patrimonios')
        .select('codigo')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
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
      }
    } catch (err) {
      console.warn('Fallback no cálculo de código Supabase:', err);
    }
  }

  const localList = getLocalPatrimonios();
  let maxNum = 0;
  for (const item of localList) {
    if (item.codigo) {
      const match = item.codigo.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `${prefix}-${nextNum.toString().padStart(6, '0')}`;
}

export async function createPatrimonio(item: NewPatrimonioInput): Promise<Patrimonio> {
  let finalCodigo = item.codigo ? formatCodeInput(item.codigo) : '';
  if (!finalCodigo) {
    finalCodigo = await getNextPatrimonioCode();
  }

  const payload: Patrimonio = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'pat-' + Date.now(),
    codigo: finalCodigo,
    descricao: item.descricao.trim(),
    categoria: item.categoria?.trim() || undefined,
    setor: item.setor?.trim() || undefined,
    localizacao: item.localizacao?.trim() || undefined,
    responsavel: item.responsavel?.trim() || undefined,
    numero_serie: item.numero_serie?.trim() || undefined,
    status: item.status || 'Ativo',
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('patrimonios')
        .insert([{
          codigo: payload.codigo,
          descricao: payload.descricao,
          categoria: payload.categoria || null,
          setor: payload.setor || null,
          localizacao: payload.localizacao || null,
          responsavel: payload.responsavel || null,
          numero_serie: payload.numero_serie || null,
          status: payload.status,
        }])
        .select()
        .single();

      if (!error && data) {
        try {
          await registrarHistorico({
            patrimonio_codigo: finalCodigo,
            tipo: 'cadastro',
            titulo: 'Cadastrado no Sistema',
            descricao: `Patrimônio criado com status "${payload.status}"`,
            setor_novo: payload.setor,
            responsavel: payload.responsavel,
          });
        } catch {}
        return data as Patrimonio;
      }
    } catch (e) {
      console.warn('Falha ao salvar no Supabase, salvando localmente:', e);
    }
  }

  const localList = getLocalPatrimonios();
  if (localList.some(p => p.codigo.toLowerCase() === finalCodigo.toLowerCase())) {
    throw new Error(`O código ${finalCodigo} já está em uso por outro patrimônio.`);
  }
  localList.unshift(payload);
  saveLocalPatrimonios(localList);

  await registrarHistorico({
    patrimonio_codigo: finalCodigo,
    tipo: 'cadastro',
    titulo: 'Cadastrado no Sistema (Modo Local)',
    descricao: `Patrimônio criado com status "${payload.status}"`,
    setor_novo: payload.setor,
    responsavel: payload.responsavel,
  });

  return payload;
}

export async function getPatrimonioByCodigo(codigo: string): Promise<Patrimonio | null> {
  const formattedCode = formatCodeInput(codigo);
  const rawCode = codigo.trim().toUpperCase();

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('patrimonios')
        .select('*')
        .or(`codigo.ilike.${formattedCode},codigo.ilike.${rawCode}`)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as Patrimonio;
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase, buscando localmente:', e);
    }
  }

  const localList = getLocalPatrimonios();
  const match = localList.find(
    (item) =>
      item.codigo.toUpperCase() === formattedCode.toUpperCase() ||
      item.codigo.toUpperCase() === rawCode
  );

  return match || null;
}

export async function searchPatrimonios(term: string): Promise<Patrimonio[]> {
  const cleanTerm = term.trim();
  if (!cleanTerm) {
    return getAllPatrimonios();
  }

  const formattedCode = formatCodeInput(cleanTerm);
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('patrimonios')
        .select('*')
        .or(
          `codigo.ilike.%${cleanTerm}%,codigo.ilike.%${formattedCode}%,descricao.ilike.%${cleanTerm}%,responsavel.ilike.%${cleanTerm}%,setor.ilike.%${cleanTerm}%,localizacao.ilike.%${cleanTerm}%,categoria.ilike.%${cleanTerm}%,numero_serie.ilike.%${cleanTerm}%`
        )
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        return data as Patrimonio[];
      }
    } catch (e) {
      console.warn('Erro ao buscar Supabase, buscando localmente:', e);
    }
  }

  const localList = getLocalPatrimonios();
  const termLower = cleanTerm.toLowerCase();
  const codeLower = formattedCode.toLowerCase();

  return localList.filter((item) => {
    return (
      (item.codigo && item.codigo.toLowerCase().includes(termLower)) ||
      (item.codigo && item.codigo.toLowerCase().includes(codeLower)) ||
      (item.descricao && item.descricao.toLowerCase().includes(termLower)) ||
      (item.responsavel && item.responsavel.toLowerCase().includes(termLower)) ||
      (item.setor && item.setor.toLowerCase().includes(termLower)) ||
      (item.localizacao && item.localizacao.toLowerCase().includes(termLower)) ||
      (item.categoria && item.categoria.toLowerCase().includes(termLower)) ||
      (item.numero_serie && item.numero_serie.toLowerCase().includes(termLower))
    );
  });
}

export async function getAllPatrimonios(limit: number = 200): Promise<Patrimonio[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('patrimonios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        return data as Patrimonio[];
      }
    } catch (e) {
      console.warn('Erro ao listar Supabase, carregando localmente:', e);
    }
  }

  const localList = getLocalPatrimonios();
  return localList.slice(0, limit);
}

export async function getTotalPatrimoniosCount(): Promise<number> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { count, error } = await supabase
        .from('patrimonios')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        return count;
      }
    } catch (e) {
      console.warn('Erro ao contar no Supabase:', e);
    }
  }

  return getLocalPatrimonios().length;
}

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
  const prefix = (getLabelConfig().codigoPrefixo || 'MP').toUpperCase();
  const firstCode = await getNextPatrimonioCode();
  const match = firstCode.match(/\d+/);
  const startNum = match ? parseInt(match[0], 10) : 1;

  const recordsToInsert: Patrimonio[] = [];
  for (let i = 0; i < count; i++) {
    const currentNum = startNum + i;
    const currentCode = `${prefix}-${currentNum.toString().padStart(6, '0')}`;

    recordsToInsert.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pat-batch-${Date.now()}-${i}`,
      codigo: currentCode,
      descricao: baseData.descricao.trim(),
      categoria: baseData.categoria?.trim() || undefined,
      setor: baseData.setor?.trim() || undefined,
      localizacao: baseData.localizacao?.trim() || undefined,
      responsavel: baseData.responsavel?.trim() || undefined,
      status: baseData.status || 'Ativo',
      created_at: new Date().toISOString(),
    });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('patrimonios')
        .insert(recordsToInsert.map(r => ({
          codigo: r.codigo,
          descricao: r.descricao,
          categoria: r.categoria || null,
          setor: r.setor || null,
          localizacao: r.localizacao || null,
          responsavel: r.responsavel || null,
          status: r.status,
        })))
        .select();

      if (!error && data) {
        return data as Patrimonio[];
      }
    } catch (e) {
      console.warn('Erro ao salvar lote no Supabase, salvando local:', e);
    }
  }

  const localList = getLocalPatrimonios();
  localList.unshift(...recordsToInsert);
  saveLocalPatrimonios(localList);

  return recordsToInsert;
}

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
  const formattedCode = formatCodeInput(codigo);
  const nowIso = new Date().toISOString();

  const supabase = getSupabase();
  if (supabase) {
    try {
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

      if (!error && updated) {
        try {
          await registrarHistorico({
            patrimonio_codigo: formattedCode,
            tipo: data.status === 'Baixado' ? 'baixa' : 'conferencia',
            titulo: data.status === 'Baixado' ? 'Baixa Registrada' : `Conferência: ${data.status}`,
            descricao: data.observacoes || `Status atualizado para "${data.status}"`,
            setor_novo: data.setor || updated.setor,
            responsavel: data.responsavel || updated.responsavel,
          });
        } catch {}
        return updated as Patrimonio;
      }
    } catch (e) {
      console.warn('Erro no Supabase, atualizando local:', e);
    }
  }

  const localList = getLocalPatrimonios();
  const index = localList.findIndex((p) => p.codigo.toUpperCase() === formattedCode.toUpperCase());
  if (index === -1) {
    throw new Error(`Patrimônio com código ${formattedCode} não encontrado.`);
  }

  const existing = localList[index];
  const updated: Patrimonio = {
    ...existing,
    status: data.status,
    condicao: data.condicao !== undefined ? data.condicao : existing.condicao,
    observacoes: data.observacoes !== undefined ? data.observacoes : existing.observacoes,
    setor: data.setor !== undefined ? data.setor : existing.setor,
    localizacao: data.localizacao !== undefined ? data.localizacao : existing.localizacao,
    responsavel: data.responsavel !== undefined ? data.responsavel : existing.responsavel,
    ultima_conferencia_at: nowIso,
  };

  localList[index] = updated;
  saveLocalPatrimonios(localList);

  await registrarHistorico({
    patrimonio_codigo: formattedCode,
    tipo: data.status === 'Baixado' ? 'baixa' : 'conferencia',
    titulo: data.status === 'Baixado' ? 'Baixa Registrada' : `Conferência: ${data.status}`,
    descricao: data.observacoes || `Status atualizado para "${data.status}"`,
    setor_novo: updated.setor,
    responsavel: updated.responsavel,
  });

  return updated;
}

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
  const formattedCode = formatCodeInput(codigo);

  const supabase = getSupabase();
  if (supabase) {
    try {
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

      if (!error && updated) {
        return updated as Patrimonio;
      }
    } catch (e) {
      console.warn('Erro ao atualizar no Supabase, salvando local:', e);
    }
  }

  const localList = getLocalPatrimonios();
  const index = localList.findIndex((p) => p.codigo.toUpperCase() === formattedCode.toUpperCase());
  if (index === -1) {
    throw new Error(`Patrimônio ${formattedCode} não encontrado.`);
  }

  const existing = localList[index];
  const updated: Patrimonio = {
    ...existing,
    descricao: updates.descricao.trim(),
    categoria: updates.categoria?.trim() || undefined,
    setor: updates.setor?.trim() || undefined,
    localizacao: updates.localizacao?.trim() || undefined,
    responsavel: updates.responsavel?.trim() || undefined,
    numero_serie: updates.numero_serie?.trim() || undefined,
    status: updates.status || existing.status,
    condicao: updates.condicao !== undefined ? updates.condicao : existing.condicao,
    observacoes: updates.observacoes !== undefined ? updates.observacoes : existing.observacoes,
  };

  localList[index] = updated;
  saveLocalPatrimonios(localList);

  await registrarHistorico({
    patrimonio_codigo: formattedCode,
    tipo: 'edicao',
    titulo: 'Cadastro Editado (Modo Local)',
    descricao: updates.observacoes || 'Dados do patrimônio atualizados',
    setor_novo: updated.setor,
    responsavel: updated.responsavel,
  });

  return updated;
}

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
  if (supabase) {
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
      return;
    } catch {}
  }

  saveLocalHistorico({
    patrimonio_codigo: formatCodeInput(evento.patrimonio_codigo),
    tipo: evento.tipo,
    titulo: evento.titulo,
    descricao: evento.descricao || null,
    setor_anterior: evento.setor_anterior || null,
    setor_novo: evento.setor_novo || null,
    responsavel: evento.responsavel || null,
  });
}

export async function getHistoricoPatrimonio(codigo: string): Promise<any[]> {
  const formattedCode = formatCodeInput(codigo);
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('historico_patrimonio')
        .select('*')
        .ilike('patrimonio_codigo', formattedCode)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {}
  }

  const localHist = getLocalHistorico();
  return localHist.filter((h) => h.patrimonio_codigo === formattedCode);
}

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
  const allItens = await getAllPatrimonios(1000);
  const mapSetores = new Map<string, Patrimonio[]>();

  for (const item of allItens) {
    const setorNome = item.setor && item.setor.trim() ? item.setor.trim() : 'Sem Setor Definido';
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

  setoresResumo.sort((a, b) => b.total - a.total);

  return {
    setores: setoresResumo,
    totalGeral: allItens.length,
  };
}

export function generateWhatsAppComprovanteLink(item: Patrimonio, telefoneDestinatario?: string): string {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const horaHoje = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const saudacaoNome =
    item.responsavel && item.responsavel.trim() ? `Olá *${item.responsavel.trim()}*,` : 'Olá,';

  const localizacaoTexto = [item.setor, item.localizacao].filter(Boolean).join(' • ') || 'Não especificado';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mpcargas.vercel.app';
  const comprovanteUrl = `${baseUrl}/?comprovante=${encodeURIComponent(item.codigo)}`;

  const texto = `${saudacaoNome}

📦 *COMPROVANTE DE ENTREGA DE PATRIMÔNIO*
🏢 *MP CARGAS — LOGÍSTICA & TRANSPORTES*
━━━━━━━━━━━━━━━━━━━━━━━━━━

🏷️ *Código:* *${item.codigo}*
📋 *Descrição:* *${item.descricao}*
📍 *Setor / Local:* ${localizacaoTexto}
${item.numero_serie ? `🔢 *Nº de Série:* ${item.numero_serie}\n` : ''}⚡ *Status:* *${item.status || 'Ativo'}*
📅 *Data:* ${dataHoje} às ${horaHoje}

📄 *Acessar Termo Oficial / Baixar PDF:*
👉 ${comprovanteUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━
_Confirmo a entrega e guarda do equipamento sob minha responsabilidade._
_Em caso de avaria ou transferência, comunique a coordenação da MP CARGAS._`;

  const textoEncoded = encodeURIComponent(texto);

  if (telefoneDestinatario && telefoneDestinatario.trim()) {
    const numLimpo = telefoneDestinatario.replace(/\D/g, '');
    const numFinal = numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`;
    return `https://wa.me/${numFinal}?text=${textoEncoded}`;
  }

  return `https://wa.me/?text=${textoEncoded}`;
}
