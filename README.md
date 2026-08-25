# MP CARGAS — Gerador de Etiquetas de Patrimônio

Sistema web corporativo, ultrarrápido, minimalista e responsivo para cadastro de patrimônios, geração de códigos sequenciais (`PAT-000001`), geração e impressão de etiquetas térmicas com código de barras **Code 128**, e consulta instantânea via leitor/pistola USB ou câmera do smartphone, integrado a um banco de dados central no **Supabase (PostgreSQL)**.

---

## 🚀 Funcionalidades Principais

1. **Cadastro Rápido de Patrimônio**:
   - Descrição, Categoria, Setor, Localização, Responsável, Número de Série e Status.
   - Geração automática e sequencial de código único (`PAT-000001`, `PAT-000002`...).
   - Pré-visualização instantânea da etiqueta gerada.

2. **Geração de Código de Barras (Code 128)**:
   - Renderização vetorial SVG de alta definição, perfeitamente nítida para leitura óptica.
   - Padrão da etiqueta: Topo **MP CARGAS**, Código em destaque, Código de barras Code 128 e Descrição.

3. **Impressão Térmica Dedicada (`@media print`)**:
   - CSS milimétrico otimizado para rolos de etiquetas padrão (50x30mm / 80x40mm) em impressoras térmicas (Zebra, Elgin, Argox, etc.) e impressoras normais.
   - Oculta menus, cabeçalhos, rodapés e elementos de tela, imprimindo estritamente a etiqueta.

4. **Consulta e Bipagem Ágil**:
   - **Pistola de Código de Barras USB / Bluetooth**: Campo grande com foco automático constante; pesquisa instantânea ao receber o `ENTER` da pistola.
   - **📷 Bipar com Câmera**: Leitura óptica direta pela câmera traseira do celular com suporte a lanterna e bipe de confirmação.
   - Tela de resultado detalhado com botão de **Reimprimir Etiqueta** e **Nova Consulta**.
   - Tela de "Não Encontrado" com atalho direto para **Cadastrar Novo**.

5. **Listagem e Busca**:
   - Tabela organizada com pesquisa em tempo real por Código, Descrição ou Número de Série.
   - Ações de Consultar e Imprimir diretamente em cada linha.

6. **Banco Central Supabase**:
   - Banco único compartilhado entre computadores, celulares e leitores de código de barras.

---

## 🛠️ Como Executar

### 1. Instalação
```bash
npm install
```

### 2. Desenvolvimento
```bash
npm run dev
```

### 3. Build para Produção
```bash
npm run build
```

---

## 🗄️ Configuração do Banco de Dados (Supabase)

Execute o script SQL disponível em `src/sql/schema.sql` no **SQL Editor** do seu painel Supabase.
Depois, configure as variáveis no arquivo `.env` ou clique no botão **"Configurar Banco"** no topo do sistema:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```
