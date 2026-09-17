import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Search,
  ClipboardCheck,
  Building2,
  Boxes,
  FileSpreadsheet,
  Settings,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Shield,
  Lock,
  X,
} from 'lucide-react';
import type { UserRole } from '../types/patrimonio';

export type ScreenId = 'home' | 'new' | 'scan' | 'list' | 'config' | 'conferencia' | 'setores' | 'excel';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  userEmail?: string | null;
  onLogout?: () => void;
  userRole?: UserRole;
  onToggleRole?: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  adminOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  userEmail,
  onLogout,
  userRole = 'admin',
  onToggleRole,
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems: NavItem[] = [
    { id: 'home', label: 'Início / Dashboard', icon: LayoutDashboard },
    { id: 'new', label: 'Novo Patrimônio', icon: PlusCircle, adminOnly: true, badge: 'Novo' },
    { id: 'scan', label: 'Consultar / Bipar', icon: Search },
    { id: 'conferencia', label: 'Conferência & Auditoria', icon: ClipboardCheck },
    { id: 'setores', label: 'Setores & Galpões', icon: Building2 },
    { id: 'list', label: 'Todos os Patrimônios', icon: Boxes },
    { id: 'excel', label: 'Controle Excel', icon: FileSpreadsheet },
    { id: 'config', label: 'Configurações', icon: Settings, adminOnly: true },
  ];

  const filteredItems = navItems.filter((item) => !item.adminOnly || userRole === 'admin');

  const handleItemClick = (screen: ScreenId) => {
    onNavigate(screen);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const displayName = userEmail ? userEmail.split('@')[0] : 'admin';

  return (
    <>
      {/* Overlay Backdrop para Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Container Principal da Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#111111] text-white border-r border-[#18191B] flex flex-col transition-all duration-200 ease-in-out select-none shadow-xl lg:shadow-none ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[68px]' : 'lg:w-64'}`}
      >
        {/* Cabeçalho da Sidebar (Logo & Marca) */}
        <div className={`h-16 flex items-center border-b border-[#18191B] shrink-0 px-3.5 ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'}`}>
          <div
            onClick={() => handleItemClick('home')}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
            title="MP CARGAS — Gestão e Etiquetas"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFC400] text-[#111111] font-black text-sm flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#F5B800] transition-colors">
              MP
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight text-white group-hover:text-[#FFC400] transition-colors truncate">
                  MP CARGAS
                </span>
                <span className="text-[11px] text-[#6B7280] font-medium truncate">
                  Gestão e Etiquetas
                </span>
              </div>
            )}
          </div>

          {/* Botão Fechar no Mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Navegação */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-neutral-800">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer text-left ${
                    isCollapsed && !isMobileOpen
                      ? 'justify-center h-10 w-10 mx-auto px-0'
                      : 'px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[#FFC400] text-[#111111] font-bold shadow-xs'
                      : 'text-neutral-300 hover:text-white hover:bg-[#18191B]'
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 shrink-0 ${
                      isActive ? 'text-[#111111]' : 'text-neutral-400 group-hover:text-[#FFC400]'
                    }`}
                  />

                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            isActive
                              ? 'bg-[#111111] text-[#FFC400]'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Tooltip flutuante no modo colapsado */}
                {isCollapsed && !isMobileOpen && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1.5 bg-[#18191B] text-white text-xs font-medium rounded-lg shadow-lg border border-neutral-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Rodapé da Sidebar (Usuário, Perfil & Botão Recolher) */}
        <div className="p-2.5 border-t border-[#18191B] shrink-0 bg-[#0e0e10] space-y-2">
          {(!isCollapsed || isMobileOpen) ? (
            <>
              <div className="p-2.5 rounded-xl bg-[#18191B] border border-neutral-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate capitalize">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-[#00A878] font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] animate-pulse"></span>
                    Sessão ativa
                  </p>
                </div>

                {onToggleRole && (
                  <button
                    onClick={onToggleRole}
                    title={
                      userRole === 'admin'
                        ? 'Perfil Administrador. Clique para alternar.'
                        : 'Perfil Operador. Clique para desbloquear com senha mestre.'
                    }
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                      userRole === 'admin'
                        ? 'bg-[#FFC400]/15 text-[#FFC400] border border-[#FFC400]/30 hover:bg-[#FFC400] hover:text-[#111111]'
                        : 'bg-neutral-800 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {userRole === 'admin' ? (
                      <span className="flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Operador 🔒
                      </span>
                    )}
                  </button>
                )}
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-red-950/40 text-neutral-400 hover:text-red-400 text-xs font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair do sistema</span>
                </button>
              )}

              {/* Botão de Recolher no Desktop */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 text-neutral-400 hover:text-white text-xs font-medium rounded-lg hover:bg-[#18191B] transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-4 h-4" />
                <span>Recolher barra</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              {onToggleRole && (
                <button
                  onClick={onToggleRole}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
                    userRole === 'admin'
                      ? 'bg-[#FFC400]/20 text-[#FFC400] hover:bg-[#FFC400] hover:text-[#111111]'
                      : 'bg-neutral-800 text-amber-300'
                  }`}
                  title={userRole === 'admin' ? 'Administrador' : 'Operador (bloqueado)'}
                >
                  {userRole === 'admin' ? <Shield className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
              )}

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-9 h-9 rounded-xl hover:bg-red-950/50 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

              {/* Botão de Expandir quando colapsado */}
              <button
                onClick={onToggleCollapse}
                className="w-9 h-9 rounded-xl hover:bg-[#18191B] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Expandir barra lateral"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
