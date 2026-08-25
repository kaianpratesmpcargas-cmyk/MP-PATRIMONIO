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

  return (
    <div className={`flex flex-col items-center ${isCutLineActive ? 'p-1.5' : ''}`}>
      {/* Guia de Corte com Tesoura para Impressão em Papel Sulfite A4 */}
      {isCutLineActive && (
        <div className="w-[85mm] flex items-center justify-between text-[9px] text-gray-500 font-mono mb-1 select-none">
          <span>✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</span>
        </div>
      )}

      {/* Cartão Físico da Etiqueta */}
      <div
        className={`bg-white text-black border-2 border-black rounded-md flex flex-col justify-between select-none ${
          isPrintVersion
            ? config.tamanho === 'compacto'
              ? 'w-[70mm] h-[40mm] p-2 shadow-none'
              : 'w-[85mm] h-[48mm] p-2.5 shadow-none'
            : 'w-full max-w-[340px] p-3 shadow-md'
        } ${className}`}
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#000000',
          borderColor: '#000000',
        }}
      >
        {/* Cabeçalho da Etiqueta com Símbolo [MP] em destaque */}
        <div className="w-full bg-black text-white px-2 py-1 rounded-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {/* Símbolo MP */}
            <span className="bg-white text-black font-black text-[11px] px-1 py-0.5 rounded-xs tracking-tighter leading-none">
              {config.simboloTexto || 'MP'}
            </span>
            {/* Nome da Empresa */}
            <span className="font-black text-xs tracking-wider uppercase">
              {config.empresaNome || 'MP CARGAS'}
            </span>
          </div>

          {/* Subtítulo / Rótulo */}
          <span className="text-[9px] font-bold tracking-tight uppercase text-gray-200">
            {config.subtitulo || 'PATRIMÔNIO'}
          </span>
        </div>

        {/* Código do Patrimônio em Destaque */}
        <div className="text-center my-0.5">
          <span className="font-mono font-black text-2xl tracking-widest text-black">
            {codigo || 'PAT-000000'}
          </span>
        </div>

        {/* Código de Barras Code 128 */}
        <div className="w-full flex items-center justify-center my-0.5 overflow-hidden bg-white">
          <svg ref={svgRef} className="max-w-full h-auto"></svg>
        </div>

        {/* Rodapé: Descrição e Informações Adicionais */}
        <div className="w-full border-t-2 border-black pt-1 mt-0.5 text-center">
          <p className="font-black text-xs uppercase text-black leading-tight truncate">
            {descricao || 'DESCRIÇÃO DO PATRIMÔNIO'}
          </p>
          {config.mostrarSetorLocal && (setor || localizacao) && (
            <p className="text-[9px] font-bold text-black uppercase mt-0.5 truncate">
              {[setor, localizacao].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>
      </div>

      {isCutLineActive && (
        <div className="w-[85mm] flex items-center justify-between text-[9px] text-gray-500 font-mono mt-1 select-none">
          <span>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</span>
        </div>
      )}
    </div>
  );
};


