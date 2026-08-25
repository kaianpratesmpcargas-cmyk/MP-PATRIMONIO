import { Search, PlusCircle, List, Settings, LogOut, ClipboardCheck } from 'lucide-react';

interface HeaderProps {
  currentScreen: 'home' | 'new' | 'scan' | 'list' | 'config' | 'conferencia';
  onNavigate: (screen: 'home' | 'new' | 'scan' | 'list' | 'config' | 'conferencia') => void;
  userEmail?: string | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  userEmail,
  onLogout,
}) => {
  return (
    <header className="bg-[#111111] text-white border-b-[3px] border-[#FFD100] sticky top-0 z-40 shadow-md select-none no-print safe-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Marca / Logotipo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FFD100] text-black font-black text-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            MP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg tracking-wider text-white">
                MP CARGAS
              </span>
              <span className="hidden sm:inline-block bg-[#FFD100] text-black text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                Patrimônio
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium leading-none">
              Gerador de Etiquetas
            </span>
          </div>
        </div>

        {/* Menu de Navegação Desktop */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'home'
                ? 'bg-gray-800 text-[#FFD100] shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            Início
          </button>

          <button
            onClick={() => onNavigate('new')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'new'
                ? 'bg-[#FFD100] text-black shadow-xs'
                : 'text-gray-300 hover:text-[#FFD100] hover:bg-gray-800/60'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Novo</span>
          </button>

          <button
            onClick={() => onNavigate('scan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'scan'
                ? 'bg-white text-black shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Consultar / Bipar</span>
          </button>

          <button
            onClick={() => onNavigate('conferencia')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'conferencia'
                ? 'bg-emerald-500 text-black font-black shadow-xs'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-950/40'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Conferência</span>
          </button>

          <button
            onClick={() => onNavigate('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'list'
                ? 'bg-gray-800 text-[#FFD100] shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Patrimônios</span>
          </button>

          <button
            onClick={() => onNavigate('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'config'
                ? 'bg-gray-800 text-[#FFD100] shadow-xs'
                : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurações</span>
          </button>
        </nav>


        {/* Lado Direito: Usuário Logado + Sair */}
        <div className="flex items-center gap-3 shrink-0">
          {userEmail && (
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-gray-900/80 rounded-lg border border-gray-800 text-[11px] text-gray-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
              <span className="truncate max-w-[170px]">{userEmail}</span>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair do Sistema"
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-red-950/80 hover:text-red-300 hover:border-red-800/80 text-gray-400 text-xs font-bold py-1.5 px-3 rounded-lg border border-gray-800 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};



