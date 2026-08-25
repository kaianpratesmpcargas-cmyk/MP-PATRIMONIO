import { useState, useEffect } from 'react';
import { PlusCircle, Printer, ArrowLeft, CheckCircle2, RotateCcw, Layers } from 'lucide-react';

import { createPatrimonio, createPatrimoniosBatch, getNextPatrimonioCode } from '../services/patrimonioService';
import type { Patrimonio } from '../types/patrimonio';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { PrintModal } from '../components/PrintModal';
import { BatchPrintModal } from '../components/BatchPrintModal';

interface NewPatrimonioScreenProps {
  onBack: () => void;
  onNavigateToScan: () => void;
}

export const NewPatrimonioScreen: React.FC<NewPatrimonioScreenProps> = ({
  onBack,
}) => {
  const [tabMode, setTabMode] = useState<'single' | 'batch'>('single');

  // Campos Individuais
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [setor, setSetor] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [status, setStatus] = useState('Ativo');

  // Campos Lote
  const [batchCount, setBatchCount] = useState<number>(10);

  const [previewCode, setPreviewCode] = useState('MP-...');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPatrimonio, setSavedPatrimonio] = useState<Patrimonio | null>(null);
  const [savedBatchPatrimonios, setSavedBatchPatrimonios] = useState<Patrimonio[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);

  // Carrega previsão do próximo código
  useEffect(() => {
    fetchNextCode();
  }, []);

  const fetchNextCode = async () => {
    try {
      const next = await getNextPatrimonioCode();
      setPreviewCode(next);
    } catch {
      setPreviewCode('MP-000001');
    }
  };

  const handleResetForm = () => {
    setDescricao('');
    setCategoria('');
    setSetor('');
    setLocalizacao('');
    setResponsavel('');
    setNumeroSerie('');
    setStatus('Ativo');
    setSavedPatrimonio(null);
    setSavedBatchPatrimonios([]);
    setErrorMessage(null);
    fetchNextCode();
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErrorMessage('Por favor, informe a descrição do patrimônio.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const created = await createPatrimonio({
        codigo: '',
        descricao,
        categoria,
        setor,
        localizacao,
        responsavel,
        numero_serie: numeroSerie,
        status,
      });

      setSavedPatrimonio(created);
    } catch (err: any) {
      console.error('Erro ao salvar patrimônio:', err);
      setErrorMessage(err.message || 'Erro ao salvar no banco central.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErrorMessage('Por favor, informe a descrição dos itens.');
      return;
    }

    if (batchCount < 1 || batchCount > 200) {
      setErrorMessage('Informe uma quantidade válida entre 1 e 200 itens.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const createdList = await createPatrimoniosBatch(batchCount, {
        descricao,
        categoria,
        setor,
        localizacao,
        responsavel,
        status,
      });

      setSavedBatchPatrimonios(createdList);
    } catch (err: any) {
      console.error('Erro ao salvar lote:', err);
      setErrorMessage(err.message || 'Erro ao salvar lote no banco central.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Botão de Voltar */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Início
      </button>

      {/* CASO 1: Lote Cadastrado com Sucesso */}
      {savedBatchPatrimonios.length > 0 ? (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                Lote Criado com Sucesso
              </span>
              <h2 className="text-2xl font-black text-gray-900">
                {savedBatchPatrimonios.length} Patrimônios Cadastrados!
              </h2>
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mb-6">
            <p className="text-xs uppercase font-bold text-gray-500 mb-1">
              Intervalo de Códigos Gerados:
            </p>
            <p className="text-2xl font-black text-black font-mono tracking-wider">
              {savedBatchPatrimonios[0]?.codigo} até{' '}
              {savedBatchPatrimonios[savedBatchPatrimonios.length - 1]?.codigo}
            </p>
            <p className="text-sm font-bold text-gray-800 mt-2">
              Item: {descricao} {setor && `• Setor: ${setor}`}
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowBatchPrintModal(true)}
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <Printer className="w-6 h-6" />
              IMPRIMIR TODAS AS {savedBatchPatrimonios.length} ETIQUETAS
            </button>

            <button
              onClick={handleResetForm}
              className="bg-gray-900 hover:bg-black text-white font-bold text-base py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              + Cadastrar Outro
            </button>
          </div>

          {/* Modal de Impressão em Lote */}
          <BatchPrintModal
            isOpen={showBatchPrintModal}
            onClose={() => setShowBatchPrintModal(false)}
            items={savedBatchPatrimonios}
          />
        </div>
      ) : savedPatrimonio ? (
        /* CASO 2: Patrimônio Individual Cadastrado com Sucesso */
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                Sucesso
              </span>
              <h2 className="text-2xl font-black text-gray-900">
                Patrimônio Cadastrado!
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
            {/* Dados Cadastrados */}
            <div className="space-y-3 bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <div>
                <span className="text-xs uppercase font-bold text-gray-500">
                  Código Gerado
                </span>
                <p className="text-3xl font-black text-black font-mono tracking-wider">
                  {savedPatrimonio.codigo}
                </p>
              </div>

              <div>
                <span className="text-xs uppercase font-bold text-gray-500">
                  Descrição
                </span>
                <p className="text-base font-bold text-gray-900">
                  {savedPatrimonio.descricao}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                <div>
                  <span className="text-xs text-gray-500 font-semibold">Setor:</span>
                  <p className="font-bold text-gray-800">{savedPatrimonio.setor || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold">Local:</span>
                  <p className="font-bold text-gray-800">{savedPatrimonio.localizacao || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold">Responsável:</span>
                  <p className="font-bold text-gray-800">{savedPatrimonio.responsavel || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 font-semibold">Status:</span>
                  <p className="font-bold text-emerald-700">{savedPatrimonio.status}</p>
                </div>
              </div>
            </div>

            {/* Visualização da Etiqueta */}
            <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-2xl border border-gray-300">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Etiqueta Pronta para Impressão
              </span>
              <BarcodeLabel
                codigo={savedPatrimonio.codigo}
                descricao={savedPatrimonio.descricao}
                setor={savedPatrimonio.setor}
                localizacao={savedPatrimonio.localizacao}
              />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <Printer className="w-6 h-6" />
              IMPRIMIR ETIQUETA
            </button>

            <button
              onClick={handleResetForm}
              className="bg-gray-900 hover:bg-black text-white font-bold text-base py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              + Cadastrar Outro
            </button>
          </div>

          {/* Modal de Impressão */}
          <PrintModal
            isOpen={showPrintModal}
            onClose={() => setShowPrintModal(false)}
            codigo={savedPatrimonio.codigo}
            descricao={savedPatrimonio.descricao}
            setor={savedPatrimonio.setor}
            localizacao={savedPatrimonio.localizacao}
          />
        </div>
      ) : (
        /* CASO 3: Formulário de Cadastro (Individual ou Lote) */
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8">
          {/* Alternador de Modo: Individual vs Em Lote */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFD100] text-black flex items-center justify-center shadow-sm">
                {tabMode === 'single' ? <PlusCircle className="w-7 h-7" /> : <Layers className="w-7 h-7" />}
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  {tabMode === 'single' ? 'Novo Patrimônio' : 'Gerar Etiquetas em Lote'}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  {tabMode === 'single'
                    ? 'Cadastre 1 item e imprima a etiqueta'
                    : 'Cadastre vários itens iguais de uma só vez para imprimir tudo junto'}
                </p>
              </div>
            </div>

            {/* Seletor de Modo */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setTabMode('single')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  tabMode === 'single'
                    ? 'bg-black text-[#FFD100] shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                1 Item (Individual)
              </button>
              <button
                type="button"
                onClick={() => setTabMode('batch')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  tabMode === 'batch'
                    ? 'bg-[#FFD100] text-black shadow-xs'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Em Lote (Vários)
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
              {errorMessage}
            </div>
          )}

          <form onSubmit={tabMode === 'single' ? handleSubmitSingle : handleSubmitBatch} className="space-y-4">
            {/* Se for MODO EM LOTE: Campo de Quantidade */}
            {tabMode === 'batch' && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <label className="block text-xs font-black uppercase tracking-wider text-amber-900 mb-1.5">
                  Quantidade de Etiquetas a Gerar:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value, 10) || 1)}
                    className="w-32 px-4 py-2.5 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD100] text-lg font-mono font-black bg-white"
                  />
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 20, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBatchCount(num)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          batchCount === num ? 'bg-black text-[#FFD100]' : 'bg-white border text-gray-700'
                        }`}
                      >
                        +{num}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 font-medium mt-2">
                  Serão gerados <strong>{batchCount}</strong> códigos sequenciais começando a partir de <strong>{previewCode}</strong>.
                </p>
              </div>
            )}

            {/* Campo Descrição */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-800 mb-1.5">
                Descrição do Patrimônio *
              </label>
              <input
                type="text"
                required
                placeholder={tabMode === 'batch' ? "Ex: CADEIRA DE ESCRITÓRIO, PALETEIRA, MESA..." : "Ex: NOTEBOOK DELL, MONITOR LG..."}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-base bg-gray-50/50 font-medium"
                autoFocus
              />
            </div>

            {/* Linha 2: Categoria e Setor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  placeholder="Ex: Informática, Mobiliário, Maquinário..."
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Setor
                </label>
                <input
                  type="text"
                  placeholder="Ex: Operacional, Administrativo, TI, Logística..."
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50"
                />
              </div>
            </div>

            {/* Linha 3: Localização e Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Localização
                </label>
                <input
                  type="text"
                  placeholder="Ex: Galpão 02, Sala 104, Recepção..."
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Responsável
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Logística, João..."
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50"
                />
              </div>
            </div>

            {/* Linha 4: Número de Série (Apenas no individual) e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tabMode === 'single' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Número de Série (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SN-987654321"
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Modo de Numeração
                  </label>
                  <div className="p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-800">
                    Sequencial Automático (MP-XXXXXX)
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50 font-semibold"
                >
                  <option value="Ativo">Ativo (Padrão)</option>
                  <option value="Em Manutenção">Em Manutenção</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Baixado">Baixado</option>
                </select>
              </div>
            </div>

            {/* Botão de Salvar */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-lg py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <span>Salvando no banco central...</span>
                ) : tabMode === 'single' ? (
                  <>
                    <PlusCircle className="w-6 h-6" />
                    SALVAR E GERAR ETIQUETA
                  </>
                ) : (
                  <>
                    <Layers className="w-6 h-6" />
                    GERAR {batchCount} ETIQUETAS E IMPRIMIR LOTE
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

