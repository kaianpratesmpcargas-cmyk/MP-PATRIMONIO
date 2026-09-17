import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BarcodeLabel } from './BarcodeLabel';
import { Printer, X, Scissors, Layers } from 'lucide-react';
import type { Patrimonio } from '../types/patrimonio';


interface BatchPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Patrimonio[];
}

export const BatchPrintModal: React.FC<BatchPrintModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [showCutLine, setShowCutLine] = useState<boolean>(true);
  const [columns, setColumns] = useState<number>(2);

  if (!isOpen || items.length === 0) return null;

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const printRoot = document.getElementById('mp-print-root');

  return (
    <>
      {/* Modal de Pré-visualização na Tela */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs no-print">
        <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 border border-gray-200 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[90vh]">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFD100] flex items-center justify-center text-black shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 leading-tight">
                  Impressão em Lote ({items.length} {items.length === 1 ? 'etiqueta' : 'etiquetas'})
                </h3>
                <p className="text-xs text-gray-500">
                  Todas as etiquetas serão impressas de uma vez em folhas A4 ou rolo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Opções Rápidas */}
          <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-gray-50 px-4 rounded-xl border border-gray-200 my-3 shrink-0">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCutLine}
                  onChange={(e) => setShowCutLine(e.target.checked)}
                  className="w-4 h-4 accent-black cursor-pointer"
                />
                <Scissors className="w-3.5 h-3.5" />
                Linhas de Corte (para folha A4)
              </label>

              <div className="flex items-center gap-1.5 pl-3 border-l border-gray-300">
                <span className="font-bold text-gray-700">Colunas:</span>
                <button
                  type="button"
                  onClick={() => setColumns(1)}
                  className={`px-2 py-0.5 rounded font-bold ${
                    columns === 1 ? 'bg-black text-[#FFD100]' : 'bg-white border text-gray-700'
                  }`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setColumns(2)}
                  className={`px-2 py-0.5 rounded font-bold ${
                    columns === 2 ? 'bg-black text-[#FFD100]' : 'bg-white border text-gray-700'
                  }`}
                >
                  2 (Padrão A4)
                </button>
              </div>
            </div>

            <div className="text-gray-500 font-semibold">
              Total a imprimir: <strong className="text-black">{items.length}</strong>
            </div>
          </div>

          {/* Lista de Pré-visualização com Scroll */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-100 rounded-2xl border border-gray-300 my-2">
            <div className={`grid gap-4 ${columns === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {items.map((item) => (
                <div key={item.id || item.codigo} className="flex justify-center">
                  <BarcodeLabel
                    codigo={item.codigo}
                    descricao={item.descricao}
                    setor={item.setor}
                    localizacao={item.localizacao}
                    showCutLine={showCutLine}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handlePrint}
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-base py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              IMPRIMIR TODAS ({items.length} ETIQUETAS)
            </button>
            <button
              onClick={onClose}
              className="sm:w-28 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm py-3 px-4 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Exclusivo de Impressão via Portal em #mp-print-root */}
      {printRoot &&
        createPortal(
          <div className="w-full bg-white p-2">
            <div
              className={`grid gap-2 ${
                columns === 1 ? 'grid-cols-1' : 'grid-cols-2'
              }`}
              style={{
                pageBreakInside: 'auto',
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id || item.codigo}
                  className="print-card-item flex justify-center p-1"
                  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                >
                  <BarcodeLabel
                    codigo={item.codigo}
                    descricao={item.descricao}
                    setor={item.setor}
                    localizacao={item.localizacao}
                    isPrintVersion={true}
                    showCutLine={showCutLine}
                  />
                </div>
              ))}
            </div>
          </div>,
          printRoot
        )}
    </>
  );
};
