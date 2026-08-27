import { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  ChevronRight, 
  Package, 
  Printer, 
  RotateCcw, 
  Boxes, 
  Truck, 
  Wrench, 
  Laptop 
} from 'lucide-react';

import { getPatrimoniosGroupedBySetor } from '../services/patrimonioService';
import type { Patrimonio, UserRole } from '../types/patrimonio';
import { PrintModal } from '../components/PrintModal';

interface SetoresScreenProps {
  onBack: () => void;
  onConsultar: (codigo: string) => void;
  userRole?: UserRole;
}

export const SetoresScreen: React.FC<SetoresScreenProps> = ({
  onBack,
  onConsultar,
}) => {
  const [setoresData, setSetoresData] = useState<{
    nome: string;
    total: number;
    ativos: number;
    manutencao: number;
    baixados: number;
    itens: Patrimonio[];
  }[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [printModalItem, setPrintModalItem] = useState<Patrimonio | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getPatrimoniosGroupedBySetor();
      setSetoresData(result.setores);
      setTotalGeral(result.totalGeral);
    } catch (err) {
      console.error('Erro ao carregar dados de setores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSetorIcon = (nome: string) => {
    const n = nome.toLowerCase();
    if (n.includes('ti') || n.includes('informatica') || n.includes('comput')) return <Laptop className="w-6 h-6" />;
    if (n.includes('caminh') || n.includes('frota') || n.includes('patio') || n.includes('transp')) return <Truck className="w-6 h-6" />;
    if (n.includes('manuten') || n.includes('oficina')) return <Wrench className="w-6 h-6" />;
    if (n.includes('almo') || n.includes('estoq') || n.includes('deposi')) return <Boxes className="w-6 h-6" />;
    return <Building2 className="w-6 h-6" />;
  };

  const activeSetorObj = setoresData.find((s) => s.nome === selectedSetor);

  const filteredSetorItens = activeSetorObj
    ? activeSetorObj.itens.filter(
        (i) =>
          i.codigo.toLowerCase().includes(filterSearch.toLowerCase()) ||
          i.descricao.toLowerCase().includes(filterSearch.toLowerCase()) ||
          (i.localizacao && i.localizacao.toLowerCase().includes(filterSearch.toLowerCase())) ||
          (i.responsavel && i.responsavel.toLowerCase().includes(filterSearch.toLowerCase()))
      )
    : [];

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
      {/* Botão Voltar */}
      <button
        onClick={selectedSetor ? () => setSelectedSetor(null) : onBack}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {selectedSetor ? 'Voltar para Todos os Setores' : 'Voltar para Início'}
      </button>

      {/* Topo do Painel */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFD100] text-black flex items-center justify-center shadow-md shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Painel Visual de Setores & Galpões
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Visualize e audite todos os patrimônios distribuídos por local e base da MP CARGAS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-2xl shrink-0">
            <div className="text-center px-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Setores</span>
              <span className="text-xl font-black text-black font-mono">{setoresData.length}</span>
            </div>
            <div className="text-center px-3 border-l border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Total Geral</span>
              <span className="text-xl font-black text-black font-mono">{totalGeral}</span>
            </div>
          </div>
        </div>

        {/* MODO 1: LISTA DE BLOCOS DE SETORES */}
        {!selectedSetor && (
          <div className="mt-6">
            {isLoading ? (
              <div className="py-16 text-center text-gray-400">
                <RotateCcw className="w-8 h-8 mx-auto mb-2 animate-spin text-[#FFD100]" />
                <p className="text-sm font-bold">Carregando setores e salas...</p>
              </div>
            ) : setoresData.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-bold text-gray-600">Nenhum patrimônio cadastrado ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {setoresData.map((setor) => (
                  <div
                    key={setor.nome}
                    onClick={() => setSelectedSetor(setor.nome)}
                    className="group bg-gray-50 hover:bg-white p-5 rounded-3xl border-2 border-gray-200 hover:border-black hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-white group-hover:bg-[#FFD100] text-black flex items-center justify-center shadow-sm border border-gray-200 transition-colors">
                          {getSetorIcon(setor.nome)}
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-black text-black font-mono">
                            {setor.total}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block leading-none">
                            itens
                          </span>
                        </div>
                      </div>

                      <h3 className="font-black text-lg text-gray-900 mb-1 group-hover:text-black transition-colors truncate">
                        {setor.nome}
                      </h3>
                    </div>

                    {/* Breakdown de Status */}
                    <div className="mt-4 pt-3 border-t border-gray-200/80">
                      <div className="flex items-center justify-between text-xs font-bold mb-2">
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {setor.ativos} OK
                        </span>
                        {setor.manutencao > 0 && (
                          <span className="text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {setor.manutencao} Manut.
                          </span>
                        )}
                        {setor.baixados > 0 && (
                          <span className="text-red-700 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            {setor.baixados} Baixas
                          </span>
                        )}
                      </div>

                      <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${(setor.ativos / setor.total) * 100}%` }}
                          className="bg-emerald-500 h-full"
                        ></div>
                        <div
                          style={{ width: `${(setor.manutencao / setor.total) * 100}%` }}
                          className="bg-amber-400 h-full"
                        ></div>
                        <div
                          style={{ width: `${(setor.baixados / setor.total) * 100}%` }}
                          className="bg-red-500 h-full"
                        ></div>
                      </div>

                      <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-gray-500 group-hover:text-black mt-3 transition-colors">
                        <span>Ver todos os itens</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODO 2: VISUALIZAÇÃO DOS ITENS DO SETOR ESPECÍFICO */}
        {selectedSetor && activeSetorObj && (
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4">
              <div>
                <span className="text-xs font-black uppercase text-gray-500 tracking-wider block">
                  Setor Selecionado
                </span>
                <h2 className="text-2xl font-black text-black">
                  {activeSetorObj.nome}
                </h2>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Filtrar neste setor..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FFD100]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="divide-y divide-gray-100 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
              {filteredSetorItens.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-xs font-bold">Nenhum item encontrado com esse filtro.</p>
                </div>
              ) : (
                filteredSetorItens.map((item) => (
                  <div
                    key={item.id || item.codigo}
                    className="p-4 hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black text-[#FFD100] flex items-center justify-center font-mono font-black text-xs shrink-0">
                        MP
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-black">
                            {item.codigo}
                          </span>
                          <span className="font-bold text-xs text-gray-900">
                            {item.descricao}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          {item.localizacao && <span>📍 {item.localizacao}</span>}
                          {item.responsavel && <span>👤 {item.responsavel}</span>}
                          {item.numero_serie && <span className="font-mono">SN: {item.numero_serie}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          item.status === 'Ativo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'Em Manutenção'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>

                      <button
                        onClick={() => setPrintModalItem(item)}
                        title="Imprimir Etiqueta"
                        className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onConsultar(item.codigo)}
                        className="bg-black hover:bg-gray-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Impressão Rápida */}
      {printModalItem && (
        <PrintModal
          isOpen={Boolean(printModalItem)}
          onClose={() => setPrintModalItem(null)}
          codigo={printModalItem.codigo}
          descricao={printModalItem.descricao}
          setor={printModalItem.setor}
          localizacao={printModalItem.localizacao}
        />
      )}
    </div>
  );
};
