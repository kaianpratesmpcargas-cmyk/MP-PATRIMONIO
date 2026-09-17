export type LabelTamanho = 'padrao' | 'compacto' | 'termica_50x30' | 'termica_60x40' | 'termica_100x50';

export interface LabelConfig {
  empresaNome: string;
  simboloTexto: string;
  subtitulo: string;
  codigoPrefixo: string;
  mostrarSetorLocal: boolean;
  mostrarLinhaCorte: boolean;
  tamanho: LabelTamanho;
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


