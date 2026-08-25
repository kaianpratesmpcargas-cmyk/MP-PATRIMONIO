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

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

