import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BarcodeLabel } from './BarcodeLabel';
import { Printer, X } from 'lucide-react';
import type { Patrimonio } from '../types/patrimonio';

export interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: Patrimonio | null;
  codigo?: string;
  descricao?: string;
  setor?: string;
  localizacao?: string;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  item,
  codigo: directCodigo,
  descricao: directDescricao,
  setor: directSetor,
  localizacao: directLocalizacao,
}) => {
  const [copiesCount, setCopiesCount] = useState<number>(1);
  const [showCutLine, setShowCutLine] = useState<boolean>(true);

  if (!isOpen) return null;

  const codigo = directCodigo || item?.codigo || '';
  const descricao = directDescricao || item?.descricao || '';
  const setor = directSetor || item?.setor || '';
  const localizacao = directLocalizacao || item?.localizacao || '';

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const printTargetElement = typeof document !== 'undefined' ? document.getElementById('mp-print-root') : null;

  return (
    <>
      {/* Modal na Tela */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-[#111111]" />
              <h3 className="text-sm font-bold text-[#171717]">Imprimir Etiqueta de Patrimônio</h3>
            </div>
            <button onClick={onClose} className="text-[#6B7280] hover:text-[#171717] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pré-visualização */}
          <div className="flex justify-center p-4 bg-[#F7F7F8] rounded-lg border border-[#E5E7EB]">
            <BarcodeLabel
              codigo={codigo}
              descricao={descricao}
              setor={setor}
              localizacao={localizacao}
            />
          </div>

          {/* Controles de Impressão */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#171717]">Quantidade de Cópias:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={copiesCount}
                onChange={(e) => setCopiesCount(parseInt(e.target.value, 10) || 1)}
                className="w-20 px-2 py-1 rounded border border-[#E5E7EB] font-bold text-center"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="font-semibold text-[#171717]">Mostrar Linha de Corte:</label>
              <input
                type="checkbox"
                checked={showCutLine}
                onChange={(e) => setShowCutLine(e.target.checked)}
                className="rounded text-[#FFC400]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* Renderização no Elemento Exclusivo de Impressão */}
      {printTargetElement &&
        createPortal(
          <div className="grid grid-cols-2 gap-4 p-4">
            {Array.from({ length: copiesCount }).map((_, idx) => (
              <BarcodeLabel
                key={idx}
                codigo={codigo}
                descricao={descricao}
                setor={setor}
                localizacao={localizacao}
                isPrintVersion={true}
                showCutLine={showCutLine}
              />
            ))}
          </div>,
          printTargetElement
        )}
    </>
  );
};
