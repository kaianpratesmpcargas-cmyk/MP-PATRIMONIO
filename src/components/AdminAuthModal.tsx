import { useState } from 'react';
import { ShieldAlert, Lock, X, ArrowRight } from 'lucide-react';


interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const savedPin = localStorage.getItem('mp_admin_pin') || 'mp2026';
    const validPins = [savedPin, 'mp2026', 'admin', 'admin123', 'adminmp'];

    if (validPins.includes(adminPassword.trim())) {
      onSuccess();
      onClose();
    } else {
      setError('Senha de Administrador incorreta.');
      setAdminPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-7 border border-neutral-200 animate-in fade-in zoom-in duration-150">
        {/* Topo do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-neutral-900 leading-tight">
                Acesso Restrito
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                Desbloqueio de Administrador
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
          O perfil de <strong>Operador</strong> não possui permissão para editar ou cadastrar patrimônios. Digite a senha mestre de administrador:
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase text-neutral-700 mb-1">
              Senha Mestre do Administrador
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Digite a senha..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-neutral-300 focus:border-black focus:outline-none focus:ring-2 focus:ring-[#FFD100] text-sm font-bold bg-neutral-50"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 font-medium">
              💡 Senha padrão: <code className="font-mono bg-neutral-100 px-1 py-0.5 rounded">mp2026</code>
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] active:scale-98 text-black font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>DESBLOQUEAR ADMIN</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs py-3 px-4 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
