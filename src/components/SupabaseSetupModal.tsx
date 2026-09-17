import { useState, useEffect } from 'react';
import { Database, Check, Copy, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { getSupabaseCredentials, saveSupabaseCredentials, testSupabaseConnection } from '../services/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  const sqlScript = `-- 1. Tabela Principal de Patrimonios
CREATE TABLE IF NOT EXISTS public.patrimonios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(100),
    setor VARCHAR(100),
    localizacao VARCHAR(100),
    responsavel VARCHAR(100),
    numero_serie VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indices
CREATE INDEX IF NOT EXISTS idx_patrimonios_codigo ON public.patrimonios (codigo);
CREATE INDEX IF NOT EXISTS idx_patrimonios_descricao ON public.patrimonios (descricao);

-- 3. Sequencia e Gerador Automatico de PAT-XXXXXX
CREATE SEQUENCE IF NOT EXISTS patrimonio_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.set_patrimonio_codigo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' OR NEW.codigo = 'AUTO' THEN
        NEW.codigo := 'PAT-' || LPAD(nextval('patrimonio_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_patrimonio_codigo ON public.patrimonios;
CREATE TRIGGER trigger_set_patrimonio_codigo
BEFORE INSERT ON public.patrimonios
FOR EACH ROW
EXECUTE FUNCTION public.set_patrimonio_codigo();

-- 4. Funcao RPC para proximo codigo
CREATE OR REPLACE FUNCTION public.get_next_code()
RETURNS TEXT AS $$
DECLARE
    max_num BIGINT;
BEGIN
    SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo, '[^0-9]', '', 'g'), '')::BIGINT), 0)
    INTO max_num
    FROM public.patrimonios;
    
    RETURN 'PAT-' || LPAD((max_num + 1)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- 5. Liberar Acesso RLS
ALTER TABLE public.patrimonios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permissao Geral Patrimonios" ON public.patrimonios;
CREATE POLICY "Permissao Geral Patrimonios"
ON public.patrimonios FOR ALL
USING (true)
WITH CHECK (true);`;

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      if (creds.isConfigured) {
        verifyConnection(creds.url, creds.anonKey);
      }
    }
  }, [isOpen]);

  const verifyConnection = async (targetUrl: string, targetKey: string) => {
    setStatus('testing');
    setStatusMessage('Testando conexão com o Supabase...');
    const res = await testSupabaseConnection(targetUrl, targetKey);
    if (res.success) {
      setStatus('success');
      setStatusMessage(res.error || 'Conexão com o banco central estabelecida com sucesso!');
    } else {
      setStatus('error');
      setStatusMessage(res.error || 'Falha ao conectar com o Supabase.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !anonKey) {
      setStatus('error');
      setStatusMessage('Por favor preencha a URL e a Anon Key do Supabase.');
      return;
    }

    saveSupabaseCredentials(url, anonKey);
    await verifyConnection(url, anonKey);
    if (onConfigSaved) {
      onConfigSaved();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 border border-gray-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD100] flex items-center justify-center text-black shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Banco de Dados Central</h2>
              <p className="text-xs text-gray-500">Configuração Supabase + PostgreSQL (MP CARGAS)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagens de Status */}
        {status === 'success' && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Banco Conectado!</p>
              <p className="text-xs mt-0.5">{statusMessage}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atenção na Conexão</p>
              <p className="text-xs mt-0.5">{statusMessage}</p>
            </div>
          </div>
        )}

        {/* Formulário de Credenciais */}
        <form onSubmit={handleSave} className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://exemplo.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50 font-mono text-xs"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={status === 'testing'}
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {status === 'testing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testando Conexão...
                </>
              ) : (
                'Salvar e Conectar'
              )}
            </button>
          </div>
        </form>

        {/* Bloco de Script SQL */}
        <div className="bg-gray-900 text-gray-100 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#FFD100] uppercase tracking-wider">
              Script SQL para criar a tabela no Supabase
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="text-xs bg-gray-800 hover:bg-gray-700 text-white font-medium py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar SQL
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mb-2">
            Abra seu projeto no <strong>Supabase</strong> → <strong>SQL Editor</strong> → Cole e clique em <strong>Run</strong>.
          </p>
          <pre className="text-[11px] bg-black/60 p-3 rounded-lg overflow-x-auto text-gray-300 font-mono max-h-36 scrollbar-thin">
            {sqlScript}
          </pre>
        </div>
      </div>
    </div>
  );
};
