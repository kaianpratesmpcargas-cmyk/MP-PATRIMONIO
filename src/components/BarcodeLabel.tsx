import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { getLabelConfig } from '../services/configService';
import type { LabelConfig } from '../types/config';
import type { Patrimonio } from '../types/patrimonio';

export interface BarcodeLabelProps {
  item?: Patrimonio | { id?: string; codigo: string; descricao: string; setor?: string; localizacao?: string };
  codigo?: string;
  descricao?: string;
  setor?: string;
  localizacao?: string;
  className?: string;
  isPrintVersion?: boolean;
  showCutLine?: boolean;
  configOverride?: Partial<LabelConfig>;
  customConfig?: LabelConfig;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({
  item,
  codigo: directCodigo,
  descricao: directDescricao,
  setor: directSetor,
  localizacao: directLocalizacao,
  className = '',
  isPrintVersion = false,
  showCutLine,
  configOverride,
  customConfig,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const baseConfig = customConfig || getLabelConfig();
  const config = { ...baseConfig, ...configOverride };

  const codigo = directCodigo || item?.codigo || '';
  const descricao = directDescricao || item?.descricao || '';
  const setor = directSetor || item?.setor || '';
  const localizacao = directLocalizacao || item?.localizacao || '';

  const isCutLineActive = showCutLine !== undefined ? showCutLine : config.mostrarLinhaCorte;

  useEffect(() => {
    if (svgRef.current && codigo) {
      try {
        JsBarcode(svgRef.current, codigo, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.8,
          height: 38,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        console.error('Erro ao gerar código de barras no BarcodeLabel:', err);
      }
    }
  }, [codigo]);

  return (
    <div
      className={`print-card-item relative bg-white text-black border-2 border-black rounded-lg p-2.5 flex flex-col justify-between select-none shadow-xs ${className}`}
      style={{
        width: '320px',
        height: '180px',
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
      }}
    >
      {/* 1. TOPO DA ETIQUETA COM IDENTIDADE MP CARGAS */}
      <div className="flex items-center justify-between border-b-2 border-black pb-1.5 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="bg-[#FFC400] text-[#111111] font-black text-xs px-2 py-0.5 rounded border border-black shrink-0">
            {config.simboloTexto || 'MP'}
          </div>
          <div className="min-w-0">
            <span className="font-black text-xs tracking-tight block truncate uppercase leading-none text-black">
              {config.empresaNome || 'MP CARGAS'}
            </span>
            <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider leading-none">
              {config.subtitulo || 'PATRIMÔNIO'}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="font-mono font-black text-sm tracking-tight block text-black leading-none">
            {codigo}
          </span>
        </div>
      </div>

      {/* 2. DESCRIÇÃO E LOCALIZAÇÃO */}
      <div className="flex-1 flex flex-col justify-center my-0.5">
        <p className="font-bold text-[11px] leading-tight text-black line-clamp-2 uppercase">
          {descricao || 'SEM DESCRIÇÃO'}
        </p>

        {(setor || localizacao) && (
          <p className="text-[9px] text-neutral-700 font-semibold truncate mt-0.5">
            {[setor, localizacao].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>

      {/* 3. CÓDIGO DE BARRAS CENTRALIZADO */}
      <div className="flex flex-col items-center justify-center pt-1 border-t border-neutral-300">
        <svg ref={svgRef} className="max-w-full h-8 object-contain" />
        <span className="font-mono font-bold text-[10px] tracking-widest text-black">
          {codigo}
        </span>
      </div>

      {/* Linha de Corte Opcional */}
      {isCutLineActive && isPrintVersion && (
        <div className="absolute -inset-1 border border-dashed border-neutral-400 pointer-events-none rounded" />
      )}
    </div>
  );
};
