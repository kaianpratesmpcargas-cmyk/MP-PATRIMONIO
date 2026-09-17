import React from 'react';
import { Menu, Shield, Lock, Camera, Plus } from 'lucide-react';
import type { ScreenId } from './Sidebar';
import type { UserRole } from '../types/patrimonio';

interface TopbarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenMobileMenu: () => void;
  userRole?: UserRole;
  onToggleRole?: () => void;
}

const screenMetadata: Record<ScreenId, { title: string; subtitle: string }> = {
  home: { title: 'Dashboard Executivo', subtitle: 'Visão geral do inventário e patrimônios da MP CARGAS' },
  new: { title: 'Novo Patrimônio', subtitle: 'Cadastrar bens e emitir etiquetas de rastreabilidade' },
  scan: { title: 'Consultar & Bipar', subtitle: 'Busca rápida de ativos, histórico e emissão de comprovantes' },
  conferencia: { title: 'Conferência & Auditoria', subtitle: 'Validação física, conferência de status e registro de avarias' },
  setores: { title: 'Setores & Galpões', subtitle: 'Distribuição dos bens por departamentos e posições físicas' },
  list: { title: 'Todos os Patrimônios', subtitle: 'Listagem geral, filtros avançados e gestão de ativos' },
  excel: { title: 'Controle Excel', subtitle: 'Importação e exportação de planilhas de inventário' },
  config: { title: 'Configurações', subtitle: 'Parâmetros de etiquetas, código de barras e banco de dados' },
};

export const Topbar: React.FC<TopbarProps> = ({
  currentScreen,
  onNavigate,
  onOpenMobileMenu,
  userRole = 'admin',
  onToggleRole,
}) => {
  const meta = screenMetadata[currentScreen] || { title: 'MP CARGAS', subtitle: 'Gestão de Patrimônio' };

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between gap-4 select-none no-print">
      {/* Lado Esquerdo: Hambúrguer Mobile + Título & Contexto */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#171717] transition-colors shrink-0 cursor-pointer"
          title="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight truncate">
            {meta.title}
          </h1>
          <p className="text-xs text-[#6B7280] hidden sm:block truncate">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Lado Direito: Ações Rápidas & Perfil */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Botão 📷 Bipar código */}
        {currentScreen !== 'scan' && (
          <button
            onClick={() => onNavigate('scan')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="Bipar código com câmera ou leitor"
          >
            <Camera className="w-4 h-4 text-[#6B7280]" />
            <span className="hidden sm:inline">Bipar código</span>
          </button>
        )}

        {/* Botão + Novo */}
        {userRole === 'admin' && currentScreen !== 'new' && (
          <button
            onClick={() => onNavigate('new')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Cadastrar novo patrimônio"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo</span>
          </button>
        )}

        {/* Badge Administrador / Operador */}
        {onToggleRole && (
          <button
            onClick={onToggleRole}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              userRole === 'admin'
                ? 'bg-neutral-100 text-[#171717] border border-[#E5E7EB] hover:bg-neutral-200'
                : 'bg-neutral-800 text-amber-300 hover:bg-neutral-700'
            }`}
            title={userRole === 'admin' ? 'Clique para alternar para Operador' : 'Clique para desbloquear Admin com senha'}
          >
            {userRole === 'admin' ? (
              <>
                <Shield className="w-3.5 h-3.5 text-[#171717]" />
                <span className="hidden sm:inline">Administrador</span>
                <span className="sm:hidden">Admin</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Operador 🔒</span>
                <span className="sm:hidden">Op 🔒</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
