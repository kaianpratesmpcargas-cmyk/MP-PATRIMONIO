import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { HomeScreen } from './screens/HomeScreen';
import { NewPatrimonioScreen } from './screens/NewPatrimonioScreen';
import { ScanSearchScreen } from './screens/ScanSearchScreen';
import { PatrimoniosListScreen } from './screens/PatrimoniosListScreen';
import { ConfigScreen } from './screens/ConfigScreen';
import { ConferenciaScreen } from './screens/ConferenciaScreen';
import { SetoresScreen } from './screens/SetoresScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ComprovantePublicoScreen } from './screens/ComprovantePublicoScreen';
import { ControleExcelScreen } from './screens/ControleExcelScreen';
import { AdminAuthModal } from './components/AdminAuthModal';
import { ToastProvider } from './components/Toast';
import { getSupabase } from './services/supabase';
import type { UserRole } from './types/patrimonio';
import type { ScreenId } from './components/Sidebar';

export function AppContent() {
  const [publicCodigo, setPublicCodigo] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('comprovante') || p.get('termo');
    }
    return null;
  });

  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('mp_user_email'));
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('mp_user_email');
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('mp_user_role') as UserRole) || 'admin';
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [scanInitialCode, setScanInitialCode] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mp_sidebar_collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('mp_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setIsAuthenticated(true);
        const email = data.session.user.email || 'usuario@mpcargas.com.br';
        setUserEmail(email);
        localStorage.setItem('mp_user_email', email);
      }
    }
  };

  const handleToggleRole = () => {
    if (userRole === 'admin') {
      setUserRole('operador');
      localStorage.setItem('mp_user_role', 'operador');
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  const handleUnlockAdminSuccess = () => {
    setUserRole('admin');
    localStorage.setItem('mp_user_role', 'admin');
  };

  const handleLoginSuccess = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem('mp_user_email', email);
    setCurrentScreen('home');
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Erro ao deslogar do Supabase:', err);
      }
    }
    localStorage.removeItem('mp_user_email');
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  const handleConsultarFromList = (codigo: string) => {
    setScanInitialCode(codigo);
    setCurrentScreen('scan');
  };

  const handleNavigate = (screen: ScreenId) => {
    if (screen !== 'scan') {
      setScanInitialCode('');
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (publicCodigo) {
    return (
      <ComprovantePublicoScreen
        codigo={publicCodigo}
        onGoToApp={() => {
          window.history.replaceState({}, '', window.location.pathname);
          setPublicCodigo(null);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex bg-[#F7F7F8] text-[#171717] antialiased selection:bg-[#FFC400] selection:text-[#111111]">
      {/* Barra Lateral (Sidebar) */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        userEmail={userEmail}
        onLogout={handleLogout}
        userRole={userRole}
        onToggleRole={handleToggleRole}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Conteúdo Principal com Topbar */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-200 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-64'
        }`}
      >
        <Topbar
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          userRole={userRole}
          onToggleRole={handleToggleRole}
        />

        {/* Área Central */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {currentScreen === 'home' && (
            <HomeScreen onNavigate={handleNavigate} userRole={userRole} />
          )}

          {currentScreen === 'new' && userRole === 'admin' && (
            <NewPatrimonioScreen
              onBack={() => handleNavigate('home')}
              onNavigateToScan={() => handleNavigate('scan')}
            />
          )}

          {currentScreen === 'scan' && (
            <ScanSearchScreen
              onBack={() => handleNavigate('home')}
              onNavigateToNew={() => handleNavigate('new')}
              initialCode={scanInitialCode}
              userRole={userRole}
            />
          )}

          {currentScreen === 'conferencia' && (
            <ConferenciaScreen
              onBack={() => handleNavigate('home')}
            />
          )}

          {currentScreen === 'setores' && (
            <SetoresScreen
              onBack={() => handleNavigate('home')}
              onConsultar={handleConsultarFromList}
              userRole={userRole}
            />
          )}

          {currentScreen === 'list' && (
            <PatrimoniosListScreen
              onBack={() => handleNavigate('home')}
              onConsultar={handleConsultarFromList}
              onNavigateToNew={() => handleNavigate('new')}
            />
          )}

          {currentScreen === 'excel' && (
            <ControleExcelScreen
              onBack={() => handleNavigate('home')}
              onConsultar={handleConsultarFromList}
            />
          )}

          {currentScreen === 'config' && userRole === 'admin' && (
            <ConfigScreen
              onBack={() => handleNavigate('home')}
            />
          )}
        </main>
      </div>

      {/* Modal de Desbloqueio de Administrador */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleUnlockAdminSuccess}
      />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
