export interface Patrimonio {
  id?: string;
  codigo: string;
  descricao: string;
  categoria?: string;
  setor?: string;
  localizacao?: string;
  responsavel?: string;
  numero_serie?: string;
  status: 'Ativo' | 'Em Manutenção' | 'Inativo' | 'Baixado' | 'Avariado' | string;
  condicao?: string;
  ultima_conferencia_at?: string;
  observacoes?: string;
  created_at?: string;
}

export type NewPatrimonioInput = Omit<Patrimonio, 'id' | 'created_at'>;

export interface HistoricoEvento {
  id?: string;
  patrimonio_codigo: string;
  tipo: 'cadastro' | 'edicao' | 'conferencia' | 'baixa' | 'movimentacao' | string;
  titulo: string;
  descricao?: string;
  setor_anterior?: string;
  setor_novo?: string;
  responsavel?: string;
  criado_em?: string;
}

export type UserRole = 'admin' | 'operador';

export interface SetorResumo {
  setor: string;
  total: number;
  ativos: number;
  manutencao: number;
  baixados: number;
  itens: Patrimonio[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}



