export interface LabelConfig {
  empresaNome: string;
  simboloTexto: string;
  subtitulo: string;
  codigoPrefixo: string;
  mostrarSetorLocal: boolean;
  mostrarLinhaCorte: boolean;
  tamanho: 'padrao' | 'compacto';
  copiasPadrao: number;
}

export const DEFAULT_LABEL_CONFIG: LabelConfig = {
  empresaNome: 'MP CARGAS',
  simboloTexto: 'MP',
  subtitulo: 'PATRIMÔNIO',
  codigoPrefixo: 'MP',
  mostrarSetorLocal: true,
  mostrarLinhaCorte: true,
  tamanho: 'padrao',
  copiasPadrao: 1,
};

