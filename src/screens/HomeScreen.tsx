import { useEffect, useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  PackageCheck, 
  List, 
  ArrowRight, 
  ClipboardCheck, 
  Building2 
} from 'lucide-react';
import { getTotalPatrimoniosCount } from '../services/patrimonioService';
import type { UserRole } from '../types/patrimonio';


interface HomeScreenProps {
  onNavigate: (screen: 'new' | 'scan' | 'list' | 'config' | 'conferencia' | 'setores') => void;
  userRole?: UserRole;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate, userRole = 'admin' }) => {
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCount();
  }, []);

  const loadCount = async () => {
    setIsLoading(true);
    try {
      const count = await getTotalPatrimoniosCount();
      setTotalCount(count);
    } catch (err) {
      console.error('Erro ao carregar contagem:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 max-w-5xl mx-auto w-full my-auto">
      {/* Hero Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 bg-[#FFD100]/15 text-[#B45309] border border-[#FFD100]/40 font-black text-[11px] uppercase px-3.5 py-1.5 rounded-full mb-3 tracking-widest shadow-xs">
          <span className="w-2 h-2 rounded-full bg-[#FFD100] animate-pulse"></span>
          <span>SISTEMA DE GESTÃO DE PATRIMÔNIO</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-neutral-900 tracking-tight mb-2">
          MP CARGAS
        </h1>
        <p className="text-sm sm:text-base font-medium text-neutral-500 max-w-md mx-auto">
          Rastreabilidade inteligente, emissão de etiquetas e conferência de ativos
        </p>
      </div>

      {/* Grid Principal de 4 Ações em Harmonia (2x2 no desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 w-full max-w-3xl mb-6">
        {/* Card 1: + NOVO PATRIMÔNIO (Admin) ou MAPA DE SETORES (Operador) */}
        {userRole === 'admin' ? (
          <div
            onClick={() => onNavigate('new')}
            className="group relative bg-gradient-to-br from-[#FFD100] to-[#F59E0B] p-6 sm:p-7 rounded-3xl shadow-xl shadow-[#FFD100]/15 hover:shadow-2xl hover:shadow-[#FFD100]/25 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[170px] hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="w-13 h-13 rounded-2xl bg-black text-[#FFD100] flex items-center justify-center shadow-lg group-hover:scale-108 transition-transform">
                <PlusCircle className="w-7 h-7" />
              </div>
              <span className="bg-black/10 text-black font-black text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider">
                Individual ou Lote
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
                + Novo Patrimônio
              </h3>
              <p className="text-xs font-bold text-black/75 mt-0.5">
                Cadastrar bens e gerar etiquetas sequenciais MP-
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => onNavigate('setores')}
            className="group relative bg-gradient-to-br from-[#FFD100] to-[#F59E0B] p-6 sm:p-7 rounded-3xl shadow-xl shadow-[#FFD100]/15 hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[170px] hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div className="w-13 h-13 rounded-2xl bg-black text-[#FFD100] flex items-center justify-center shadow-lg group-hover:scale-108 transition-transform">
                <Building2 className="w-7 h-7" />
              </div>
              <span className="bg-black/10 text-black font-black text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider">
                Galpões & Salas
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
                Mapa de Setores
              </h3>
              <p className="text-xs font-bold text-black/75 mt-0.5">
                Visualizar bens organizados por local físico
              </p>
            </div>
          </div>
        )}

        {/* Card 2: CONSULTAR / BIPAR */}
        <div
          onClick={() => onNavigate('scan')}
          className="group relative bg-[#0F0F12] text-white p-6 sm:p-7 rounded-3xl shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 border border-neutral-800 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[170px] hover:-translate-y-1"
        >
          <div className="flex items-start justify-between">
            <div className="w-13 h-13 rounded-2xl bg-[#FFD100] text-black flex items-center justify-center shadow-lg shadow-[#FFD100]/10 group-hover:scale-108 transition-transform">
              <Search className="w-7 h-7" />
            </div>
            <span className="bg-white/10 text-neutral-300 font-bold text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider">
              Pistola ou Câmera
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight group-hover:text-[#FFD100] transition-colors">
              Consultar / Bipar
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Busca instantânea, histórico e comprovante WhatsApp
            </p>
          </div>
        </div>

        {/* Card 3: CONFERÊNCIA & AUDITORIA */}
        <div
          onClick={() => onNavigate('conferencia')}
          className="group relative bg-white p-6 sm:p-7 rounded-3xl shadow-lg border border-neutral-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[170px] hover:-translate-y-1"
        >
          <div className="flex items-start justify-between">
            <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-black text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider">
              Auditoria Ativa
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight leading-tight group-hover:text-emerald-700 transition-colors">
              Conferência & Auditoria
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Validar funcionamento, registrar manutenção ou baixas
            </p>
          </div>
        </div>

        {/* Card 4: MAPA DE SETORES */}
        <div
          onClick={() => onNavigate('setores')}
          className="group relative bg-white p-6 sm:p-7 rounded-3xl shadow-lg border border-neutral-200 hover:border-[#FFD100] hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[170px] hover:-translate-y-1"
        >
          <div className="flex items-start justify-between">
            <div className="w-13 h-13 rounded-2xl bg-neutral-100 text-neutral-800 flex items-center justify-center shadow-sm group-hover:bg-[#FFD100] group-hover:text-black transition-colors">
              <Building2 className="w-7 h-7" />
            </div>
            <span className="bg-neutral-100 text-neutral-700 font-black text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider">
              Visão por Base
            </span>
          </div>

          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight leading-tight group-hover:text-neutral-900 transition-colors">
              Setores & Galpões
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Painel com a distribuição de todos os itens da empresa
            </p>
          </div>
        </div>
      </div>

      {/* Cartão de Resumo e Acesso à Listagem */}
      <div className="w-full max-w-3xl bg-neutral-900 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD100]/20 text-[#FFD100] border border-[#FFD100]/30 flex items-center justify-center shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Total de Ativos Cadastrados
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#FFD100] font-mono leading-none mt-1 block">
              {isLoading ? '...' : totalCount ?? 0}
            </span>
          </div>
        </div>

        <button
          onClick={() => onNavigate('list')}
          className="w-full sm:w-auto bg-neutral-800 hover:bg-neutral-700 active:scale-98 text-neutral-200 hover:text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl border border-neutral-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <List className="w-4 h-4 text-[#FFD100]" />
          <span>Ver Tabela Completa</span>
          <ArrowRight className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
    </div>
  );
};
