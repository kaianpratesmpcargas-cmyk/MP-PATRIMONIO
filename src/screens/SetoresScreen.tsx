import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Search, 
  Printer
} from 'lucide-react';

import { getPatrimoniosGroupedBySetor } from '../services/patrimonioService';
import type { Patrimonio, UserRole } from '../types/patrimonio';
import { PrintModal } from '../components/PrintModal';
import { StatusBadge } from '../components/UIComponents';

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
  const [selectedSetor, setSelectedSetor] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [printModalItem, setPrintModalItem] = useState<Patrimonio | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await getPatrimoniosGroupedBySetor();
      setSetoresData(result.setores);
      setTotalGeral(result.totalGeral);
    } catch (err) {
      console.error('Erro ao carregar dados de setores:', err);
    }
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
    <div className="space-y-6">
      <button
        onClick={selectedSetor ? () => setSelectedSetor(null) : onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#171717] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{selectedSetor ? 'Voltar para todos os setores' : 'Voltar ao início'}</span>
      </button>

      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#171717]">
            {selectedSetor ? `Setor: ${selectedSetor}` : 'Distribuição de Ativos por Setor'}
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {selectedSetor
              ? `Listagem dos ${activeSetorObj?.total || 0} patrimônios alocados neste setor`
              : `Total de ${totalGeral} bens distribuídos em ${setoresData.length} departamentos cadastrados`}
          </p>
        </div>

        {selectedSetor && (
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Filtrar neste setor..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs bg-white"
            />
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        )}
      </div>

      {!selectedSetor && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setoresData.map((setor) => (
            <div
              key={setor.nome}
              onClick={() => setSelectedSetor(setor.nome)}
              className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs hover:border-[#FFC400] hover:shadow-sm transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-[#171717] shrink-0">
                    <Building2 className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#171717] truncate">{setor.nome}</h3>
                    <span className="text-xs text-[#6B7280] font-semibold">{setor.total} patrimônios</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E5E7EB] text-center text-xs">
                <div className="p-1.5 bg-[#00A878]/10 rounded">
                  <span className="text-[10px] text-[#6B7280] block font-semibold">Ativos</span>
                  <span className="font-bold text-[#00A878]">{setor.ativos}</span>
                </div>
                <div className="p-1.5 bg-amber-50 rounded">
                  <span className="text-[10px] text-amber-800 block font-semibold">Manutenção</span>
                  <span className="font-bold text-amber-600">{setor.manutencao}</span>
                </div>
                <div className="p-1.5 bg-neutral-100 rounded">
                  <span className="text-[10px] text-[#6B7280] block font-semibold">Baixas</span>
                  <span className="font-bold text-[#6B7280]">{setor.baixados}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSetor && activeSetorObj && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F7F8] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredSetorItens.map((item) => (
                  <tr key={item.codigo} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#171717]">{item.codigo}</td>
                    <td className="py-3 px-4 font-semibold text-[#171717] max-w-[200px] truncate">{item.descricao}</td>
                    <td className="py-3 px-4 text-[#6B7280]">{item.localizacao || '—'}</td>
                    <td className="py-3 px-4 text-[#6B7280]">{item.responsavel || '—'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => onConsultar(item.codigo)}
                        className="text-xs font-bold text-[#171717] hover:underline cursor-pointer"
                      >
                        Ver detalhes
                      </button>
                      <button
                        onClick={() => setPrintModalItem(item)}
                        className="text-xs text-[#6B7280] hover:text-[#171717] cursor-pointer"
                        title="Imprimir etiqueta"
                      >
                        <Printer className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {printModalItem && (
        <PrintModal
          isOpen={Boolean(printModalItem)}
          onClose={() => setPrintModalItem(null)}
          item={printModalItem}
        />
      )}
    </div>
  );
};
