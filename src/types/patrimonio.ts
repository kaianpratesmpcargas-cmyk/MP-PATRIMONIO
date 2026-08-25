export interface Patrimonio {
  id?: string;
  codigo: string;
  descricao: string;
  categoria?: string;
  setor?: string;
  localizacao?: string;
  responsavel?: string;
  numero_serie?: string;
  status: 'Ativo' | 'Em Manutenção' | 'Inativo' | 'Baixado' | string;
  created_at?: string;
}

export type NewPatrimonioInput = Omit<Patrimonio, 'id' | 'created_at'>;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
