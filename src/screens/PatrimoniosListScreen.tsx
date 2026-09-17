import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Printer, 
  Plus, 
  FileSpreadsheet, 
  CheckSquare, 
  Square, 
  Eye, 
  FileText,
  Loader2
} from 'lucide-react';
import { getAllPatrimonios, searchPatrimonios } from '../services/patrimonioService';
import { exportPatrimoniosToExcel } from '../services/excelService';
import type { Patrimonio } from '../types/patrimonio';
import { PrintModal } from '../components/PrintModal';
import { BatchPrintModal } from '../components/BatchPrintModal';
import { TermoResponsabilidadeModal } from '../components/TermoResponsabilidadeModal';
import { StatusBadge, EmptyState } from '../components/UIComponents';
import { useToast } from '../components/Toast';

interface PatrimoniosListScreenProps {
  onBack: () => void;
  onConsultar: (codigo: string) => void;
  onNavigateToNew: () => void;
}

export const PatrimoniosListScreen: React.FC<PatrimoniosListScreenProps> = ({
  onConsultar,
  onNavigateToNew,
}) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<Patrimonio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  // Modais
  const [selectedForPrint, setSelectedForPrint] = useState<Patrimonio | null>(null);
  const [selectedForTermo, setSelectedForTermo] = useState<Patrimonio | null>(null);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [batchPrintItems, setBatchPrintItems] = useState<Patrimonio[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPatrimonios(1000);
      setItems(data);
      setSelectedCodes(new Set());
    } catch (err) {
      console.error('Erro ao carregar lista:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await searchPatrimonios(searchTerm);
      setItems(data);
      setSelectedCodes(new Set());
    } catch (err) {
      console.error('Erro na pesquisa:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (codigo: string) => {
    const next = new Set(selectedCodes);
    if (next.has(codigo)) {
      next.delete(codigo);
    } else {
      next.add(codigo);
    }
    setSelectedCodes(next);
  };

  const handleToggleSelectAll = () => {
    if (selectedCodes.size === items.length && items.length > 0) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(items.map((i) => i.codigo)));
    }
  };

  const handlePrintSelected = () => {
    const selectedList = items.filter((item) => selectedCodes.has(item.codigo));
    if (selectedList.length > 0) {
      setBatchPrintItems(selectedList);
      setIsBatchPrintOpen(true);
    }
  };

  const handleExportExcel = () => {
    try {
      exportPatrimoniosToExcel(items);
      showToast('✓ Planilha Excel gerada com sucesso!', 'success');
    } catch (err) {
      showToast('Erro ao exportar planilha.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#171717]">
            Inventário Geral de Patrimônios
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Total de <strong>{items.length}</strong> bens registrados no sistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCodes.size > 0 && (
            <button
              onClick={handlePrintSelected}
              className="px-3.5 py-2 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir {selectedCodes.size} selecionados</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00A878]" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={onNavigateToNew}
            className="px-3.5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FFC400]" />
            <span>+ Novo Patrimônio</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Pesquisar por código, descrição, setor, responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white"
          />
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Filtrar
        </button>
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              loadItems();
            }}
            className="px-3 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Limpar
          </button>
        )}
      </form>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#FFC400]" />
            <span>Carregando inventário...</span>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum patrimônio cadastrado"
            description="Cadastre seu primeiro bem no sistema ou importe uma planilha existente."
            actionLabel="+ Novo Patrimônio"
            onAction={onNavigateToNew}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F7F8] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="cursor-pointer text-[#6B7280] hover:text-[#171717]"
                    >
                      {selectedCodes.size === items.length && items.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#111111]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Descrição do Bem</th>
                  <th className="py-3 px-3">Categoria</th>
                  <th className="py-3 px-3">Setor</th>
                  <th className="py-3 px-3">Localização</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {items.map((item) => {
                  const isSelected = selectedCodes.has(item.codigo);

                  return (
                    <tr
                      key={item.codigo}
                      className={`transition-colors ${
                        isSelected ? 'bg-amber-50/40' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.codigo)}
                          className="cursor-pointer text-[#6B7280] hover:text-[#171717]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#111111]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#171717]">{item.codigo}</td>
                      <td className="py-3 px-3 font-semibold text-[#171717] max-w-[200px] truncate">{item.descricao}</td>
                      <td className="py-3 px-3 text-[#6B7280]">{item.categoria || '—'}</td>
                      <td className="py-3 px-3 text-[#171717] font-medium">{item.setor || '—'}</td>
                      <td className="py-3 px-3 text-[#6B7280]">{item.localizacao || '—'}</td>
                      <td className="py-3 px-3 text-[#6B7280]">{item.responsavel || '—'}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onConsultar(item.codigo)}
                          className="p-1.5 rounded hover:bg-neutral-200 text-[#171717] font-semibold text-xs cursor-pointer"
                          title="Ver detalhes"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => setSelectedForPrint(item)}
                          className="p-1.5 rounded hover:bg-neutral-200 text-[#6B7280] hover:text-[#171717] cursor-pointer"
                          title="Imprimir etiqueta"
                        >
                          <Printer className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => setSelectedForTermo(item)}
                          className="p-1.5 rounded hover:bg-neutral-200 text-[#00A878] cursor-pointer"
                          title="Termo de Entrega / Comprovante"
                        >
                          <FileText className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedForPrint && (
        <PrintModal
          isOpen={Boolean(selectedForPrint)}
          onClose={() => setSelectedForPrint(null)}
          item={selectedForPrint}
        />
      )}

      {isBatchPrintOpen && batchPrintItems.length > 0 && (
        <BatchPrintModal
          isOpen={isBatchPrintOpen}
          onClose={() => setIsBatchPrintOpen(false)}
          items={batchPrintItems}
        />
      )}

      {selectedForTermo && (
        <TermoResponsabilidadeModal
          isOpen={Boolean(selectedForTermo)}
          onClose={() => setSelectedForTermo(null)}
          patrimonio={selectedForTermo}
        />
      )}
    </div>
  );
};
