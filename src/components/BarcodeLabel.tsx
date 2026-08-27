import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { getLabelConfig } from '../services/configService';
import type { LabelConfig } from '../types/config';

interface BarcodeLabelProps {
  codigo: string;
  descricao: string;
  setor?: string;
  localizacao?: string;
  className?: string;
  isPrintVersion?: boolean;
  showCutLine?: boolean;
  configOverride?: Partial<LabelConfig>;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({
  codigo,
  descricao,
  setor,
  localizacao,
  className = '',
  isPrintVersion = false,
  showCutLine,
  configOverride,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const baseConfig = getLabelConfig();
  const config = { ...baseConfig, ...configOverride };

  const isCutLineActive = showCutLine !== undefined ? showCutLine : config.mostrarLinhaCorte;

  useEffect(() => {
    if (svgRef.current && codigo) {
      try {
        JsBarcode(svgRef.current, codigo, {
          format: 'CODE128',
          lineColor: '#000000',
          width: isPrintVersion ? 1.9 : 1.6,
          height: isPrintVersion ? 44 : 38,
          displayValue: false, // Código já impresso em fonte grande
          margin: 0,
          background: '#ffffff',
        });
      } catch (err) {
        console.error('Erro ao renderizar código de barras:', err);
      }
    }
  }, [codigo, isPrintVersion]);

  // Determina as dimensões e classes de acordo com o tamanho selecionado
  const getDimensionStyles = () => {
    if (!isPrintVersion) {
      return 'w-full max-w-[340px] p-3 shadow-md';
    }

    switch (config.tamanho) {
      case 'termica_50x30':
        return 'w-[50mm] h-[30mm] p-1.5 shadow-none text-[8px]';
      case 'termica_60x40':
        return 'w-[60mm] h-[40mm] p-2 shadow-none';
      case 'termica_100x50':
        return 'w-[100mm] h-[50mm] p-3 shadow-none';
      case 'compacto':
        return 'w-[70mm] h-[40mm] p-2 shadow-none';
      case 'padrao':
      default:
        return 'w-[85mm] h-[48mm] p-2.5 shadow-none';
    }
  };

  const getCutLineWidth = () => {
    switch (config.tamanho) {
      case 'termica_50x30':
        return 'w-[50mm]';
      case 'termica_60x40':
        return 'w-[60mm]';
      case 'termica_100x50':
        return 'w-[100mm]';
      case 'compacto':
        return 'w-[70mm]';
      default:
        return 'w-[85mm]';
    }
  };

  const isThermal = config.tamanho.startsWith('termica_');
  const showCutLineFinal = isThermal ? false : isCutLineActive;

  return (
    <div className={`flex flex-col items-center ${showCutLineFinal ? 'p-1.5' : 'p-0.5'}`}>
      {/* Guia de Corte com Tesoura para Impressão em Papel Sulfite A4 */}
      {showCutLineFinal && (
        <div className={`${getCutLineWidth()} flex items-center justify-between text-[9px] text-gray-500 font-mono mb-1 select-none`}>
          <span>✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</span>
        </div>
      )}

      {/* Cartão Físico da Etiqueta */}
      <div
        className={`bg-white text-black border-2 border-black rounded-md flex flex-col justify-between select-none ${getDimensionStyles()} ${className}`}
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#000000',
          borderColor: '#000000',
        }}
      >
        {/* Cabeçalho da Etiqueta com Símbolo [MP] em destaque */}
        <div className="w-full bg-black text-white px-1.5 py-0.5 rounded-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Símbolo MP */}
            <span className="bg-white text-black font-black text-[10px] px-1 py-0.5 rounded-xs tracking-tighter leading-none">
              {config.simboloTexto || 'MP'}
            </span>
            {/* Nome da Empresa */}
            <span className="font-black text-[11px] tracking-wider uppercase">
              {config.empresaNome || 'MP CARGAS'}
            </span>
          </div>

          {/* Subtítulo / Rótulo */}
          <span className="text-[8px] font-bold tracking-tight uppercase text-gray-200">
            {config.subtitulo || 'PATRIMÔNIO'}
          </span>
        </div>

        {/* Código do Patrimônio em Destaque */}
        <div className="text-center my-0.5">
          <span className={`font-mono font-black tracking-widest text-black ${
            config.tamanho === 'termica_50x30' ? 'text-lg' : 'text-2xl'
          }`}>
            {codigo || 'MP-000000'}
          </span>
        </div>

        {/* Código de Barras Code 128 */}
        <div className="w-full flex items-center justify-center my-0.5 overflow-hidden bg-white">
          <svg ref={svgRef} className="max-w-full h-auto"></svg>
        </div>

        {/* Rodapé: Descrição e Informações Adicionais */}
        <div className="w-full border-t-2 border-black pt-0.5 mt-0.5 text-center">
          <p className="font-black text-[11px] uppercase text-black leading-tight truncate">
            {descricao || 'DESCRIÇÃO DO PATRIMÔNIO'}
          </p>
          {config.mostrarSetorLocal && (setor || localizacao) && (
            <p className="text-[8px] font-bold text-black uppercase mt-0.5 truncate">
              {[setor, localizacao].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
      </div>

      {showCutLineFinal && (
        <div className={`${getCutLineWidth()} flex items-center justify-between text-[9px] text-gray-500 font-mono mt-1 select-none`}>
          <span>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</span>
        </div>
      )}
    </div>
  );
};



