import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './screens/HomeScreen';
import { NewPatrimonioScreen } from './screens/NewPatrimonioScreen';
import { ScanSearchScreen } from './screens/ScanSearchScreen';
import { PatrimoniosListScreen } from './screens/PatrimoniosListScreen';
import { ConfigScreen } from './screens/ConfigScreen';
import { ConferenciaScreen } from './screens/ConferenciaScreen';
import { SetoresScreen } from './screens/SetoresScreen';
import { LoginScreen } from './screens/LoginScreen';
import { getSupabase } from './services/supabase';
import type { UserRole } from './types/patrimonio';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'new' | 'scan' | 'list' | 'config' | 'conferencia' | 'setores'>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('mp_user_email'));
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('mp_user_email');
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('mp_user_role') as UserRole) || 'admin';
  });
  const [scanInitialCode, setScanInitialCode] = useState<string>('');

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
    const nextRole: UserRole = userRole === 'admin' ? 'operador' : 'admin';
    setUserRole(nextRole);
    localStorage.setItem('mp_user_role', nextRole);
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

  const handleNavigate = (screen: 'home' | 'new' | 'scan' | 'list' | 'config' | 'conferencia' | 'setores') => {
    if (screen !== 'scan') {
      setScanInitialCode('');
    }
    setCurrentScreen(screen);
  };

  // Se não estiver logado, exibe a tela de login restrita
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111111] antialiased">
      {/* Topo / Header da MP CARGAS com Perfil Admin/Operador e Sair */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        userEmail={userEmail}
        onLogout={handleLogout}
        userRole={userRole}
        onToggleRole={handleToggleRole}
      />

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 flex flex-col pb-24 md:pb-6">
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

        {currentScreen === 'config' && userRole === 'admin' && (
          <ConfigScreen
            onBack={() => handleNavigate('home')}
          />
        )}
      </main>

      {/* Rodapé Fixo no Celular (Otimizado para iPhone Pro/Max Notch e Android) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111]/95 backdrop-blur-md text-white border-t-2 border-[#FFD100] px-2 pt-2 safe-bottom flex items-center justify-around z-30 shadow-2xl select-none no-print">
        <button
          onClick={() => handleNavigate('home')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-1.5 transition-colors active:scale-95 ${
            currentScreen === 'home' ? 'text-[#FFD100]' : 'text-gray-400'
          }`}
        >
          <span>Início</span>
        </button>

        {userRole === 'admin' && (
          <button
            onClick={() => handleNavigate('new')}
            className={`flex flex-col items-center gap-1 text-[10px] font-black py-1 px-1.5 transition-transform active:scale-95 ${
              currentScreen === 'new' ? 'text-[#FFD100]' : 'text-gray-300'
            }`}
          >
            <span className="bg-[#FFD100] text-black px-2 py-0.5 rounded-full text-[11px] font-black shadow-xs">
              + NOVO
            </span>
          </button>
        )}

        <button
          onClick={() => handleNavigate('conferencia')}
          className={`flex flex-col items-center gap-1 text-[10px] font-black py-1 px-1.5 transition-colors active:scale-95 ${
            currentScreen === 'conferencia' ? 'text-emerald-400' : 'text-emerald-300'
          }`}
        >
          <span>Auditar</span>
        </button>

        <button
          onClick={() => handleNavigate('scan')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-1.5 transition-colors active:scale-95 ${
            currentScreen === 'scan' ? 'text-[#FFD100]' : 'text-gray-400'
          }`}
        >
          <span>Bipar</span>
        </button>

        <button
          onClick={() => handleNavigate('setores')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-1.5 transition-colors active:scale-95 ${
            currentScreen === 'setores' ? 'text-[#FFD100]' : 'text-gray-400'
          }`}
        >
          <span>Setores</span>
        </button>

        <button
          onClick={() => handleNavigate('list')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-1.5 transition-colors active:scale-95 ${
            currentScreen === 'list' ? 'text-[#FFD100]' : 'text-gray-400'
          }`}
        >
          <span>Itens</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-1.5 text-gray-400 hover:text-red-400 active:scale-95"
          title="Sair do sistema"
        >
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}

export default App;




