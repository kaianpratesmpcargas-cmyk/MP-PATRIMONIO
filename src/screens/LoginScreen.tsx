import { useState } from 'react';
import { LogIn, Lock, Mail } from 'lucide-react';
import { getSupabase } from '../services/supabase';

interface LoginScreenProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Informe e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const supabase = getSupabase();

    if (!supabase) {
      setErrorMessage('Erro de conexão com o banco central.');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (data.user) {
          onLoginSuccess(data.user.email || email.trim());
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        if (data.user) {
          onLoginSuccess(data.user.email || email.trim());
        }
      }
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setErrorMessage('E-mail ou senha incorretos.');
      } else if (err.message?.includes('User already registered')) {
        setErrorMessage('Este e-mail já está cadastrado. Faça login.');
      } else if (err.message?.includes('Password should be at least')) {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setErrorMessage(err.message || 'Falha ao autenticar no sistema.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Cartão de Login */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 sm:p-10">
          {/* Topo / Logotipo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#FFD100] text-black font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              MP
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              MP CARGAS
            </h1>
            <p className="text-sm font-semibold text-gray-500">
              Gerador de Etiquetas de Patrimônio
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="usuario@mpcargas.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50 font-medium"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50"
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-base py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                'Entrando...'
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  {isSignUp ? 'Criar Conta e Entrar' : 'ENTRAR NO SISTEMA'}
                </>
              )}
            </button>
          </form>

          {/* Alternador Entre Login e Cadastro */}
          <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="text-xs font-semibold text-gray-600 hover:text-black cursor-pointer underline"
            >
              {isSignUp ? 'Já possui cadastro? Fazer login' : 'Primeiro acesso? Criar usuário'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


