import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'mp_supabase_url';
const STORAGE_KEY_KEY = 'mp_supabase_anon_key';

// Obter credenciais salvas no ambiente ou no LocalStorage
export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(STORAGE_KEY_URL) || '';
  const storedKey = localStorage.getItem(STORAGE_KEY_KEY) || '';

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  // Re-instanciar cliente
  initSupabaseClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function initSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    supabaseInstance = null;
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
    supabaseInstance = null;
    return null;
  }
}

// Inicialização inicial
initSupabaseClient();

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    return initSupabaseClient();
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const targetUrl = url || getSupabaseCredentials().url;
    const targetKey = anonKey || getSupabaseCredentials().anonKey;

    if (!targetUrl || !targetKey) {
      return { success: false, error: 'URL ou Chave do Supabase não fornecidas.' };
    }

    const testClient = createClient(targetUrl, targetKey);
    const { error } = await testClient.from('patrimonios').select('id').limit(1);

    if (error) {
      // Se a tabela não existe ainda, mas a conexão foi autenticada:
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return { 
          success: true, 
          error: 'Conectado ao Supabase, mas a tabela "patrimonios" ainda não foi criada. Execute o script SQL no Supabase.' 
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Falha ao conectar com o Supabase' };
  }
}
