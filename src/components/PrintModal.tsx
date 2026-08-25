import { useState } from 'react';
import { createPortal } from 'react-dom';
import { BarcodeLabel } from './BarcodeLabel';
import { Printer, X, Scissors, Layers } from 'lucide-react';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  codigo: string;
  descricao: string;
  setor?: string;
  localizacao?: string;
  autoPrint?: boolean;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  codigo,
  descricao,
  setor,
  localizacao,
}) => {
  const [copiesCount, setCopiesCount] = useState<number>(1);
  const [showCutLine, setShowCutLine] = useState<boolean>(true);

  if (!isOpen) return null;

  const handlePrint = () => {
    // Dá um breve respiro para o DOM de impressão estar 100% atualizado
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const printRoot = document.getElementById('mp-print-root');

  return (
    <>
      {/* Modal na Tela (Escondido durante impressão via CSS #root) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs no-print">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 animate-in fade-in zoom-in duration-150">
          {/* Cabeçalho do Modal */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFD100] flex items-center justify-center text-black shadow-sm">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 leading-tight">
                  Imprimir Etiqueta
                </h3>
                <p className="text-xs text-gray-500">
                  Compatível com impressora Brother, laser, jato de tinta e térmica
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

          {/* Pré-visualização da Etiqueta Preto e Branco */}
          <div className="flex flex-col items-center justify-center bg-gray-100 p-5 rounded-2xl border border-gray-200 mb-4">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Pré-visualização da Etiqueta
            </span>
            <BarcodeLabel
              codigo={codigo}
              descricao={descricao}
              setor={setor}
              localizacao={localizacao}
              showCutLine={showCutLine}
            />
          </div>

          {/* Opções de Impressão */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-800">
                  Quantidade de Etiquetas por Folha:
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg p-1">
                {[1, 2, 4, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopiesCount(num)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      copiesCount === num
                        ? 'bg-black text-[#FFD100]'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-bold text-gray-800">
                  Linha de Corte (para papel comum A4):
                </span>
              </div>
              <input
                type="checkbox"
                checked={showCutLine}
                onChange={(e) => setShowCutLine(e.target.checked)}
                className="w-4 h-4 accent-black cursor-pointer"
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-base py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5" />
              IMPRIMIR AGORA
            </button>
            <button
              onClick={onClose}
              className="sm:w-28 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm py-3 px-4 rounded-xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Exclusivo de Impressão Renderizado via Portal diretamente em #mp-print-root */}
      {printRoot &&
        createPortal(
          <div className="w-full flex flex-col items-center justify-center p-4 bg-white">
            <div
              className={`grid gap-4 ${
                copiesCount === 1
                  ? 'grid-cols-1'
                  : copiesCount === 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-2'
              }`}
            >
              {Array.from({ length: copiesCount }).map((_, idx) => (
                <div key={idx} className="print-card-item p-1">
                  <BarcodeLabel
                    codigo={codigo}
                    descricao={descricao}
                    setor={setor}
                    localizacao={localizacao}
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

