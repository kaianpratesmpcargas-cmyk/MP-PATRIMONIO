import { useState, useEffect } from 'react';
import { Search, Printer, ArrowLeft, Eye, RefreshCw, Plus, Package, CheckSquare, Square, Layers } from 'lucide-react';
import { getAllPatrimonios, searchPatrimonios } from '../services/patrimonioService';
import type { Patrimonio } from '../types/patrimonio';
import { PrintModal } from '../components/PrintModal';
import { BatchPrintModal } from '../components/BatchPrintModal';

interface PatrimoniosListScreenProps {
  onBack: () => void;
  onConsultar: (codigo: string) => void;
  onNavigateToNew: () => void;
}

export const PatrimoniosListScreen: React.FC<PatrimoniosListScreenProps> = ({
  onBack,
  onConsultar,
  onNavigateToNew,
}) => {
  const [items, setItems] = useState<Patrimonio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedForPrint, setSelectedForPrint] = useState<Patrimonio | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [batchPrintItems, setBatchPrintItems] = useState<Patrimonio[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPatrimonios();
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

  const handleClearSearch = async () => {
    setSearchTerm('');
    setIsLoading(true);
    try {
      const data = await getAllPatrimonios();
      setItems(data);
      setSelectedCodes(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Seleção de itens
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

  const handlePrintAllCurrent = () => {
    if (items.length > 0) {
      setBatchPrintItems(items);
      setIsBatchPrintOpen(true);
    }
  };

  const isAllSelected = items.length > 0 && selectedCodes.size === items.length;

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
      {/* Barra Superior de Ações */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer no-print"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Início
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {items.length > 0 && (
            <button
              onClick={handlePrintAllCurrent}
              className="bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#FFD100]" />
              Imprimir Todos ({items.length})
            </button>
          )}

          <button
            onClick={onNavigateToNew}
            className="bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-sm py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Novo Patrimônio
          </button>
        </div>
      </div>

      {/* Cartão da Tabela */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-20">
        {/* Topo do Cartão com Campo de Busca */}
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900">
              Patrimônios Cadastrados
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Lista centralizada de todos os itens da MP CARGAS
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, descrição ou nº de série..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-white"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>

            <button
              type="submit"
              className="bg-black hover:bg-gray-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Buscar
            </button>

            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </form>
        </div>

        {/* Conteúdo da Tabela */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-500">
            <RefreshCw className="w-8 h-8 text-[#FFD100] animate-spin" />
            <p className="text-sm font-medium">Carregando dados do Supabase...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-base text-gray-800">Nenhum patrimônio encontrado</p>
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm
                ? 'Tente pesquisar por outro termo ou código.'
                : 'Cadastre o primeiro item clicando em "+ Novo Patrimônio".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="p-1 text-gray-600 hover:text-black cursor-pointer"
                      title={isAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-black" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 sm:px-6">Código</th>
                  <th className="py-3.5 px-4">Descrição</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Setor</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Localização</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {items.map((item) => {
                  const isSelected = selectedCodes.has(item.codigo);
                  return (
                    <tr
                      key={item.id || item.codigo}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#FFD100]/15 font-medium' : 'hover:bg-amber-50/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.codigo)}
                          className="w-4 h-4 accent-black cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 font-mono font-black text-black">
                        {item.codigo}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900 max-w-xs truncate">
                        {item.descricao}
                        {item.numero_serie && (
                          <span className="block text-[11px] font-normal text-gray-400 font-mono">
                            SN: {item.numero_serie}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 hidden md:table-cell">
                        {item.setor || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 hidden lg:table-cell">
                        {item.localizacao || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            item.status === 'Ativo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Em Manutenção'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onConsultar(item.codigo)}
                            title="Consultar"
                            className="bg-gray-100 hover:bg-black hover:text-white text-gray-800 text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Consultar</span>
                          </button>

                          <button
                            onClick={() => setSelectedForPrint(item)}
                            title="Imprimir etiqueta"
                            className="bg-[#FFD100] hover:bg-[#E5BC00] text-black text-xs font-black py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Imprimir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Barra Flutuante de Ação em Lote quando itens forem selecionados */}
      {selectedCodes.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#111111] text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-[#FFD100] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2">
            <span className="bg-[#FFD100] text-black font-black text-xs px-2 py-0.5 rounded-md">
              {selectedCodes.size}
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-200">
              {selectedCodes.size === 1 ? 'item selecionado' : 'itens selecionados'}
            </span>
          </div>

          <button
            onClick={handlePrintSelected}
            className="bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-xs sm:text-sm py-2 px-4 rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            IMPRIMIR SELECIONADOS ({selectedCodes.size})
          </button>

          <button
            onClick={() => setSelectedCodes(new Set())}
            className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
          >
            Limpar
          </button>
        </div>
      )}

      {/* Modal de Impressão Individual */}
      {selectedForPrint && (
        <PrintModal
          isOpen={Boolean(selectedForPrint)}
          onClose={() => setSelectedForPrint(null)}
          codigo={selectedForPrint.codigo}
          descricao={selectedForPrint.descricao}
          setor={selectedForPrint.setor}
          localizacao={selectedForPrint.localizacao}
        />
      )}

      {/* Modal de Impressão em Lote */}
      <BatchPrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        items={batchPrintItems}
      />
    </div>
  );
};


