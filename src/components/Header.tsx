import { Search, PlusCircle, List, Settings, LogOut, ClipboardCheck, Building2, Shield, Lock } from 'lucide-react';
import type { UserRole } from '../types/patrimonio';


interface HeaderProps {
  currentScreen: 'home' | 'new' | 'scan' | 'list' | 'config' | 'conferencia' | 'setores';
  onNavigate: (screen: 'home' | 'new' | 'scan' | 'list' | 'config' | 'conferencia' | 'setores') => void;
  userEmail?: string | null;
  onLogout?: () => void;
  userRole?: UserRole;
  onToggleRole?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  userEmail,
  onLogout,
  userRole = 'admin',
  onToggleRole,
}) => {
  return (
    <header className="bg-[#0f0f12]/95 backdrop-blur-xl text-white border-b border-neutral-800/80 sticky top-0 z-40 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.5)] select-none no-print safe-top">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Marca / Logotipo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFD100] to-[#F59E0B] text-black font-black text-lg flex items-center justify-center shadow-lg shadow-[#FFD100]/20 group-hover:scale-105 transition-all">
            MP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white group-hover:text-[#FFD100] transition-colors">
                MP CARGAS
              </span>
              <span className="hidden sm:inline-block bg-[#FFD100]/15 text-[#FFD100] border border-[#FFD100]/30 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Patrimônio
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium leading-none tracking-wide">
              Gestão de Ativos & Etiquetas
            </span>
          </div>
        </div>

        {/* Menu de Navegação Desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/90 p-1.5 rounded-2xl border border-neutral-800/80 shadow-inner">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'home'
                ? 'bg-neutral-800 text-[#FFD100] shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            Início
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate('new')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                currentScreen === 'new'
                  ? 'bg-[#FFD100] text-black shadow-md shadow-[#FFD100]/20'
                  : 'text-[#FFD100] hover:bg-[#FFD100]/10'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Novo</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('scan')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'scan'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Consultar</span>
          </button>

          <button
            onClick={() => onNavigate('conferencia')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'conferencia'
                ? 'bg-emerald-500 text-black font-black shadow-sm shadow-emerald-500/20'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Conferência</span>
          </button>

          <button
            onClick={() => onNavigate('setores')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'setores'
                ? 'bg-neutral-800 text-[#FFD100] shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Setores</span>
          </button>

          <button
            onClick={() => onNavigate('list')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              currentScreen === 'list'
                ? 'bg-neutral-800 text-[#FFD100] shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Patrimônios</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={() => onNavigate('config')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                currentScreen === 'config'
                  ? 'bg-neutral-800 text-[#FFD100] shadow-sm ring-1 ring-neutral-700'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ajustes</span>
            </button>
          )}
        </nav>

        {/* Lado Direito: Perfil de Acesso + Usuário Logado + Sair */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleRole && (
            <button
              onClick={onToggleRole}
              title={
                userRole === 'admin'
                  ? 'Perfil Administrador (Acesso Total). Clique para alternar para Operador.'
                  : 'Perfil Operador (Acesso Restrito). Clique para desbloquear com senha mestre de Administrador.'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                userRole === 'admin'
                  ? 'bg-gradient-to-r from-[#FFD100] to-[#F59E0B] text-black shadow-md shadow-[#FFD100]/20 hover:opacity-90'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/40'
              }`}
            >
              {userRole === 'admin' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-black" />
                  <span>Admin</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Operador 🔒</span>
                </>
              )}
            </button>
          )}


          {userEmail && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-neutral-900/90 rounded-xl border border-neutral-800 text-xs text-neutral-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
              <span className="truncate max-w-[150px]">{userEmail}</span>
            </div>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair do Sistema"
              className="flex items-center gap-1.5 bg-neutral-900 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800/60 text-neutral-400 text-xs font-bold py-1.5 px-3 rounded-xl border border-neutral-800 transition-all cursor-pointer"
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





