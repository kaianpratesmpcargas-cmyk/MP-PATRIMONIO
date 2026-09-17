import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Camera, 
  ClipboardCheck, 
  Building2, 
  ArrowRight,
  Clock,
  Boxes,
  CheckCircle2,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { getAllPatrimonios, getPatrimoniosGroupedBySetor } from '../services/patrimonioService';
import type { Patrimonio, UserRole } from '../types/patrimonio';
import type { ScreenId } from '../components/Sidebar';

interface HomeScreenProps {
  onNavigate: (screen: ScreenId) => void;
  userRole?: UserRole;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, userRole = 'admin' }) => {
  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([]);
  const [setoresData, setSetoresData] = useState<{ nome: string; total: number; ativos: number; percentual: number }[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const all = await getAllPatrimonios(500);
      setPatrimonios(all);

      const total = all.length;
      const grouped = await getPatrimoniosGroupedBySetor();
      const topSetores = grouped.setores.slice(0, 5).map((s) => ({
        nome: s.nome,
        total: s.total,
        ativos: s.ativos,
        percentual: total > 0 ? Math.round((s.total / total) * 100) : 0,
      }));
      setSetoresData(topSetores);

      const mockRecent = all.slice(0, 4).map((p, idx) => ({
        codigo: p.codigo,
        titulo: idx === 0 ? 'Patrimônio cadastrado' : idx === 1 ? 'Conferência realizada' : 'Transferido para setor',
        tempo: idx === 0 ? 'há 5 minutos' : idx === 1 ? 'há 25 minutos' : idx === 2 ? 'há 1 hora' : 'ontem',
        descricao: p.descricao,
        status: p.status,
      }));
      setRecentEvents(mockRecent);
    } catch (err) {
      console.error('Erro ao carregar dados do Dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalGeral = patrimonios.length;
  const ativos = patrimonios.filter((p) => (p.status || 'Ativo').toLowerCase() === 'ativo').length;
  const emManutencao = patrimonios.filter((p) => (p.status || '').toLowerCase().includes('manuten')).length;
  const pendentes = patrimonios.filter((p) => (p.status || '').toLowerCase().includes('baix') || (p.status || '').toLowerCase().includes('avari') || (p.status || '').toLowerCase().includes('pendente')).length;

  return (
    <div className="space-y-6">
      {/* 1. CARDS DE MÉTRICAS PRINCIPAIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Patrimônios</span>
            <Boxes className="w-4 h-4 text-[#6B7280]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#171717]">
              {isLoading ? '...' : totalGeral}
            </span>
            <span className="text-xs text-[#6B7280]">bens registrados</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-[#00A878] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Ativos</span>
            <CheckCircle2 className="w-4 h-4 text-[#00A878]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#171717]">
              {isLoading ? '...' : ativos}
            </span>
            <span className="text-xs font-semibold text-[#00A878]">
              {totalGeral > 0 ? `${Math.round((ativos / totalGeral) * 100)}%` : '100%'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Em Manutenção</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#171717]">
              {isLoading ? '...' : emManutencao}
            </span>
            <span className="text-xs text-amber-600 font-semibold">
              {emManutencao > 0 ? 'Requer atenção' : 'Nenhuma avaria'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between text-[#6B7280] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendentes / Baixas</span>
            <AlertCircle className="w-4 h-4 text-[#6B7280]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-[#171717]">
              {isLoading ? '...' : pendentes}
            </span>
            <span className="text-xs text-[#6B7280]">itens</span>
          </div>
        </div>
      </div>

      {/* 2. AÇÕES RÁPIDAS */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate('new')}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Novo patrimônio</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('scan')}
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-semibold text-xs transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#6B7280]" />
            <span>Consultar patrimônio</span>
          </button>

          <button
            onClick={() => onNavigate('scan')}
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-semibold text-xs transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#6B7280]" />
            <span>Bipar código</span>
          </button>

          <button
            onClick={() => onNavigate('conferencia')}
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#00A878]/10 hover:bg-[#00A878]/20 text-[#00A878] font-bold text-xs transition-colors cursor-pointer border border-[#00A878]/30"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Iniciar conferência</span>
          </button>
        </div>
      </div>

      {/* 3. GRID DUPLO: DISTRIBUIÇÃO POR SETOR & ATIVIDADE RECENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#171717] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#6B7280]" />
                Patrimônios por Setor
              </h2>
              <button
                onClick={() => onNavigate('setores')}
                className="text-xs font-semibold text-[#171717] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver todos <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {setoresData.length === 0 ? (
                <p className="text-xs text-[#6B7280] py-4 text-center">Nenhum setor registrado ainda.</p>
              ) : (
                setoresData.map((s) => (
                  <div key={s.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#171717] truncate max-w-[200px]">{s.nome}</span>
                      <span className="text-[#6B7280] font-semibold">
                        {s.total} itens ({s.percentual}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#FFC400] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(s.percentual, 5)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#171717] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6B7280]" />
                Atividade Recente
              </h2>
              <button
                onClick={() => onNavigate('list')}
                className="text-xs font-semibold text-[#171717] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Ver inventário <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentEvents.length === 0 ? (
                <p className="text-xs text-[#6B7280] py-4 text-center">Nenhuma atividade registrada recente.</p>
              ) : (
                recentEvents.map((ev, i) => (
                  <div key={i} className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5E7EB] last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[#171717]">{ev.codigo}</span>
                        <span className="text-xs text-[#6B7280]">{ev.titulo}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] truncate mt-0.5">{ev.descricao}</p>
                    </div>
                    <span className="text-[11px] text-[#6B7280] shrink-0">{ev.tempo}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
