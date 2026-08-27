import { useEffect, useState } from 'react';
import { PlusCircle, Search, PackageCheck, List, ArrowRight, ClipboardCheck, Building2 } from 'lucide-react';
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
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full my-auto">
      {/* Bloco Central de Destaque */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 bg-[#FFD100] text-black font-black text-[11px] uppercase px-3 py-1 rounded-full mb-3 tracking-widest shadow-xs">
          <span>Sistema de Patrimônio</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#111111] tracking-tight mb-1">
          MP CARGAS
        </h1>
        <p className="text-base sm:text-lg font-medium text-gray-500">
          Gerador & Leitor de Etiquetas
        </p>
      </div>

      {/* Botões Grandes Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl mb-5">
        {/* Botão 1: + NOVO PATRIMÔNIO (se Admin) ou PAINEL DE SETORES (se Operador) */}
        {userRole === 'admin' ? (
          <button
            onClick={() => onNavigate('new')}
            className="group relative bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.98] text-[#111111] font-black p-7 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col items-center justify-center gap-3 border-2 border-black/5 cursor-pointer min-h-[190px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-black text-[#FFD100] flex items-center justify-center shadow-lg group-hover:scale-108 transition-transform">
              <PlusCircle className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="block text-xl font-black uppercase tracking-wide">
                + NOVO PATRIMÔNIO
              </span>
              <span className="block text-xs font-bold text-black/75 mt-0.5 tracking-normal">
                Cadastrar 1 item ou gerar em lote
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('setores')}
            className="group relative bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.98] text-[#111111] font-black p-7 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col items-center justify-center gap-3 border-2 border-black/5 cursor-pointer min-h-[190px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-black text-[#FFD100] flex items-center justify-center shadow-lg group-hover:scale-108 transition-transform">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="block text-xl font-black uppercase tracking-wide">
                SETORES & LOCAIS
              </span>
              <span className="block text-xs font-bold text-black/75 mt-0.5 tracking-normal">
                Ver bens por galpão e sala
              </span>
            </div>
          </button>
        )}

        {/* Botão CONSULTAR / BIPAR */}
        <button
          onClick={() => onNavigate('scan')}
          className="group relative bg-[#111111] hover:bg-[#1c1c1c] active:scale-[0.98] text-white font-black p-7 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col items-center justify-center gap-3 border-2 border-gray-800 cursor-pointer min-h-[190px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFD100] text-black flex items-center justify-center shadow-lg group-hover:scale-108 transition-transform">
            <Search className="w-8 h-8" />
          </div>
          <div className="text-center">
            <span className="block text-xl font-black uppercase tracking-wide text-[#FFD100]">
              CONSULTAR / BIPAR
            </span>
            <span className="block text-xs font-medium text-gray-400 mt-0.5 tracking-normal">
              Pistola USB ou Câmera do Celular
            </span>
          </div>
        </button>
      </div>

      {/* Grade de 2 Ações Rápidas: Conferência & Setores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-5">
        {/* Botão Conferência */}
        <button
          onClick={() => onNavigate('conferencia')}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white p-4 rounded-3xl shadow-md hover:shadow-xl transition-all flex items-center justify-between gap-3 cursor-pointer border border-emerald-500"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/40 text-emerald-200 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-black uppercase tracking-wide">
                📋 CONFERÊNCIA
              </span>
              <span className="block text-[11px] text-emerald-100 font-medium">
                Auditar funcionamento & baixa
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-200 shrink-0" />
        </button>

        {/* Botão Setores & Locais */}
        <button
          onClick={() => onNavigate('setores')}
          className="bg-gray-900 hover:bg-black active:scale-[0.99] text-white p-4 rounded-3xl shadow-md hover:shadow-xl transition-all flex items-center justify-between gap-3 cursor-pointer border border-gray-800"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-2xl bg-gray-800 text-[#FFD100] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-black uppercase tracking-wide text-[#FFD100]">
                🏢 MAPA DE SETORES
              </span>
              <span className="block text-[11px] text-gray-400 font-medium">
                Bens por galpão e sala
              </span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
        </button>
      </div>

      {/* Cartão de Contagem Total */}
      <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-shadow flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-xs">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase font-black text-gray-500 tracking-wider">
              Total de patrimônios no banco central
            </p>
            <p className="text-2xl sm:text-3xl font-black text-gray-900 font-mono leading-none mt-1">
              {isLoading ? '...' : totalCount ?? 0}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('list')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-gray-800 hover:text-black bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-gray-200"
        >
          <List className="w-4 h-4 text-gray-600" />
          <span>Ver Listagem Completa</span>
          <ArrowRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};



