-- ====================================================================
-- SISTEMA MP CARGAS — GERADOR DE ETIQUETAS
-- Script de Criação do Banco de Dados Central (Supabase / PostgreSQL)
-- ====================================================================

-- 1. Criação da Tabela Principal
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
    condicao VARCHAR(100) DEFAULT 'Funcionando 100%',
    ultima_conferencia_at TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migrações automáticas para tabelas já existentes:
ALTER TABLE public.patrimonios ADD COLUMN IF NOT EXISTS condicao VARCHAR(100) DEFAULT 'Funcionando 100%';
ALTER TABLE public.patrimonios ADD COLUMN IF NOT EXISTS ultima_conferencia_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.patrimonios ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 2. Índices para Pesquisa Instantânea
CREATE INDEX IF NOT EXISTS idx_patrimonios_codigo ON public.patrimonios (codigo);
CREATE INDEX IF NOT EXISTS idx_patrimonios_descricao ON public.patrimonios USING gin(to_tsvector('portuguese', descricao));
CREATE INDEX IF NOT EXISTS idx_patrimonios_numero_serie ON public.patrimonios (numero_serie);
CREATE INDEX IF NOT EXISTS idx_patrimonios_ultima_conferencia ON public.patrimonios (ultima_conferencia_at);


-- 3. Sequência para Códigos Automáticos PAT-000001, PAT-000002...
CREATE SEQUENCE IF NOT EXISTS patrimonio_seq START WITH 1;

-- 4. Função e Trigger para Atribuição Automática de Código no Banco
CREATE OR REPLACE FUNCTION public.set_patrimonio_codigo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' OR NEW.codigo = 'AUTO' THEN
        NEW.codigo := 'MP-' || LPAD(nextval('patrimonio_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_patrimonio_codigo ON public.patrimonios;
CREATE TRIGGER trigger_set_patrimonio_codigo
BEFORE INSERT ON public.patrimonios
FOR EACH ROW
EXECUTE FUNCTION public.set_patrimonio_codigo();

-- 5. Função RPC para Obter o Próximo Código Previsto
CREATE OR REPLACE FUNCTION public.get_next_code()
RETURNS TEXT AS $$
DECLARE
    next_id BIGINT;
    max_num BIGINT;
BEGIN
    -- Busca o maior número já existente na coluna codigo
    SELECT COALESCE(MAX(NULLIF(regexp_replace(codigo, '[^0-9]', '', 'g'), '')::BIGINT), 0)
    INTO max_num
    FROM public.patrimonios;
    
    next_id := max_num + 1;
    RETURN 'MP-' || LPAD(next_id::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;


-- 6. Habilitar Segurança por Linha (RLS) para Patrimônios
ALTER TABLE public.patrimonios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo aos patrimonios" ON public.patrimonios;
CREATE POLICY "Permitir acesso completo aos patrimonios"
ON public.patrimonios FOR ALL
USING (true)
WITH CHECK (true);

-- 7. Tabela de Histórico de Movimentações e Auditorias (Linha do Tempo)
CREATE TABLE IF NOT EXISTS public.historico_patrimonio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrimonio_codigo VARCHAR(20) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'cadastro', 'edicao', 'conferencia', 'baixa', 'movimentacao'
    titulo TEXT NOT NULL,
    descricao TEXT,
    setor_anterior VARCHAR(100),
    setor_novo VARCHAR(100),
    responsavel VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_historico_codigo ON public.historico_patrimonio (patrimonio_codigo);
CREATE INDEX IF NOT EXISTS idx_historico_criado_em ON public.historico_patrimonio (criado_em DESC);

-- 8. Habilitar Segurança por Linha (RLS) para Histórico
ALTER TABLE public.historico_patrimonio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso completo ao historico" ON public.historico_patrimonio;
CREATE POLICY "Permitir acesso completo ao historico"
ON public.historico_patrimonio FOR ALL
USING (true)
WITH CHECK (true);

-- 9. Tabela de Heartbeat & Keep-Alive (Impede pausa por inatividade no Supabase)
CREATE TABLE IF NOT EXISTS public.sistema_heartbeat (
    id INT PRIMARY KEY DEFAULT 1,
    ultimo_ping TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'ONLINE'
);

INSERT INTO public.sistema_heartbeat (id, ultimo_ping, status)
VALUES (1, now(), 'ONLINE')
ON CONFLICT (id) DO UPDATE 
SET ultimo_ping = now(), status = 'ONLINE';

ALTER TABLE public.sistema_heartbeat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura do heartbeat" ON public.sistema_heartbeat;
CREATE POLICY "Permitir leitura do heartbeat"
ON public.sistema_heartbeat FOR ALL
USING (true)
WITH CHECK (true);



