import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomeScreen } from './screens/HomeScreen';
import { NewPatrimonioScreen } from './screens/NewPatrimonioScreen';
import { ScanSearchScreen } from './screens/ScanSearchScreen';
import { PatrimoniosListScreen } from './screens/PatrimoniosListScreen';
import { ConfigScreen } from './screens/ConfigScreen';
import { LoginScreen } from './screens/LoginScreen';
import { getSupabase } from './services/supabase';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'new' | 'scan' | 'list' | 'config'>('home');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('mp_user_email'));
  });
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('mp_user_email');
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

  const handleNavigate = (screen: 'home' | 'new' | 'scan' | 'list' | 'config') => {
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
      {/* Topo / Header da MP CARGAS com Botão Sair */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        userEmail={userEmail}
        onLogout={handleLogout}
      />



      {/* Área Principal de Conteúdo */}
      <main className="flex-1 flex flex-col">
        {currentScreen === 'home' && (
          <HomeScreen onNavigate={handleNavigate} />
        )}

        {currentScreen === 'new' && (
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
          />
        )}

        {currentScreen === 'list' && (
          <PatrimoniosListScreen
            onBack={() => handleNavigate('home')}
            onConsultar={handleConsultarFromList}
            onNavigateToNew={() => handleNavigate('new')}
          />
        )}

        {currentScreen === 'config' && (
          <ConfigScreen
            onBack={() => handleNavigate('home')}
          />
        )}
      </main>

      {/* Rodapé Fixo no Celular para Navegação Rápida com o Polegar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] text-white border-t-2 border-[#FFD100] px-4 py-2 flex items-center justify-around z-30 shadow-lg no-print">
        <button
          onClick={() => handleNavigate('home')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            currentScreen === 'home' ? 'text-[#FFD100]' : 'text-gray-400'
          }`}
        >
          <span>Início</span>
        </button>

        <button
          onClick={() => handleNavigate('new')}
          className={`flex flex-col items-center gap-1 text-[11px] font-black ${
            currentScreen === 'new' ? 'text-[#FFD100]' : 'text-gray-300'
          }`}
        >
          <span className="bg-[#FFD100] text-black px-2.5 py-0.5 rounded-full text-xs font-black">
            + NOVO
          </span>
        </button>

        <button
          onClick={() => handleNavigate('scan')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            currentScreen === 'scan' ? 'text-[#FFD100]' : 'text-gray-400'
          }`}
        >
          <span>Bipar</span>
        </button>

        <button
          onClick={() => handleNavigate('list')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            currentScreen === 'list' ? 'text-[#FFD100]' : 'text-gray-400'
          }`}
        >
          <span>Patrimônios</span>
        </button>

        <button
          onClick={() => handleNavigate('config')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            currentScreen === 'config' ? 'text-[#FFD100]' : 'text-gray-400'
          }`}
        >
          <span>Ajustes</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-red-400"
          title="Sair do sistema"
        >
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}


export default App;


