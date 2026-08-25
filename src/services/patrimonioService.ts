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

