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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices para Pesquisa Ultra Rápida
CREATE INDEX IF NOT EXISTS idx_patrimonios_codigo ON public.patrimonios (codigo);
CREATE INDEX IF NOT EXISTS idx_patrimonios_descricao ON public.patrimonios USING gin(to_tsvector('portuguese', descricao));
CREATE INDEX IF NOT EXISTS idx_patrimonios_numero_serie ON public.patrimonios (numero_serie);

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


-- 6. Habilitar Segurança por Linha (RLS)
ALTER TABLE public.patrimonios ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acesso
DROP POLICY IF EXISTS "Permitir acesso completo aos patrimonios" ON public.patrimonios;
CREATE POLICY "Permitir acesso completo aos patrimonios"
ON public.patrimonios FOR ALL
USING (true)
WITH CHECK (true);
