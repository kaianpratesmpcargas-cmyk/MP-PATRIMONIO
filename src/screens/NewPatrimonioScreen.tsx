import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Printer, 
  Check, 
  Copy, 
  Layers, 
  Search, 
  Loader2
} from 'lucide-react';

import { createPatrimonio, createPatrimoniosBatch, getNextPatrimonioCode } from '../services/patrimonioService';
import type { Patrimonio } from '../types/patrimonio';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { PrintModal } from '../components/PrintModal';
import { BatchPrintModal } from '../components/BatchPrintModal';
import { useToast } from '../components/Toast';

interface NewPatrimonioScreenProps {
  onBack: () => void;
  onNavigateToScan: () => void;
}

export const NewPatrimonioScreen: React.FC<NewPatrimonioScreenProps> = ({
  onBack,
  onNavigateToScan,
}) => {
  const { showToast } = useToast();
  const [tabMode, setTabMode] = useState<'single' | 'batch'>('single');

  // Formulário Individual
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [setor, setSetor] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [status, setStatus] = useState('Ativo');
  const [observacoes, setObservacoes] = useState('');

  // Formulário Lote
  const [batchCount, setBatchCount] = useState<number>(10);

  const [previewCode, setPreviewCode] = useState('MP-000001');
  const [isSaving, setIsSaving] = useState(false);
  const [savedPatrimonio, setSavedPatrimonio] = useState<Patrimonio | null>(null);
  const [savedBatchPatrimonios, setSavedBatchPatrimonios] = useState<Patrimonio[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Modais de Impressão
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);

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
    setObservacoes('');
    setSavedPatrimonio(null);
    setSavedBatchPatrimonios([]);
    setErrorMessage(null);
    setCopiedCode(false);
    fetchNextCode();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`✓ Código ${code} copiado com sucesso!`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErrorMessage('Informe a descrição do patrimônio.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const created = await createPatrimonio({
        codigo: '',
        descricao,
        categoria: categoria.trim() || undefined,
        setor: setor.trim() || undefined,
        localizacao: localizacao.trim() || undefined,
        responsavel: responsavel.trim() || undefined,
        numero_serie: numeroSerie.trim() || undefined,
        status,
        observacoes: observacoes.trim() || undefined,
      });

      setSavedPatrimonio(created);
      showToast('✓ Patrimônio cadastrado com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao salvar patrimônio:', err);
      setErrorMessage(err.message || 'Não foi possível salvar o patrimônio.');
      showToast('Não foi possível salvar o patrimônio.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      setErrorMessage('Informe a descrição base para os itens em lote.');
      return;
    }

    if (batchCount < 1 || batchCount > 100) {
      setErrorMessage('A quantidade em lote deve ser entre 1 e 100.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const createdList = await createPatrimoniosBatch(batchCount, {
        descricao,
        categoria: categoria.trim() || undefined,
        setor: setor.trim() || undefined,
        localizacao: localizacao.trim() || undefined,
        responsavel: responsavel.trim() || undefined,
        status,
      });

      setSavedBatchPatrimonios(createdList);
      showToast(`✓ ${createdList.length} patrimônios cadastrados com sucesso!`, 'success');
    } catch (err: any) {
      console.error('Erro ao salvar lote:', err);
      setErrorMessage(err.message || 'Erro ao gerar lote de patrimônios.');
      showToast('Erro ao gerar lote de patrimônios.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!savedPatrimonio && savedBatchPatrimonios.length === 0 && (
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTabMode('single')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                tabMode === 'single'
                  ? 'bg-[#111111] text-[#FFC400]'
                  : 'bg-neutral-100 text-[#6B7280] hover:text-[#171717]'
              }`}
            >
              Cadastro Unitário
            </button>
            <button
              type="button"
              onClick={() => setTabMode('batch')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                tabMode === 'batch'
                  ? 'bg-[#111111] text-[#FFC400]'
                  : 'bg-neutral-100 text-[#6B7280] hover:text-[#171717]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cadastro em Lote</span>
            </button>
          </div>

          <span className="text-xs text-[#6B7280] font-mono">
            Próximo código: <strong>{previewCode}</strong>
          </span>
        </div>
      )}

      {/* SUCESSO UNITÁRIO */}
      {savedPatrimonio && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
          <div className="p-4 bg-[#00A878]/10 border border-[#00A878]/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00A878] text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#171717]">Patrimônio cadastrado com sucesso</h3>
                <p className="text-xs text-[#6B7280]">O bem já foi registrado no banco central e a etiqueta está pronta.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider block mb-1">
                  Código do Patrimônio
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-[#171717] font-mono tracking-tight">
                    {savedPatrimonio.codigo}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(savedPatrimonio.codigo)}
                    className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Copiar código"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-[#00A878]" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#6B7280] space-y-1 bg-[#F7F7F8] p-3 rounded-lg border border-[#E5E7EB]">
                <p><strong className="text-[#171717]">Descrição:</strong> {savedPatrimonio.descricao}</p>
                <p><strong className="text-[#171717]">Setor / Local:</strong> {[savedPatrimonio.setor, savedPatrimonio.localizacao].filter(Boolean).join(' • ') || 'Não especificado'}</p>
                <p><strong className="text-[#171717]">Responsável:</strong> {savedPatrimonio.responsavel || 'Não especificado'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="px-4 py-2.5 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir etiqueta</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToScan}
                  className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[#6B7280]" />
                  <span>Ver patrimônio</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="col-span-2 px-4 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#FFC400]" />
                  <span>+ Cadastrar outro patrimônio</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-[#F7F7F8] rounded-xl border border-[#E5E7EB]">
              <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                Pré-visualização da Etiqueta
              </span>
              <BarcodeLabel item={savedPatrimonio} />
            </div>
          </div>
        </div>
      )}

      {/* SUCESSO LOTE */}
      {savedBatchPatrimonios.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
          <div className="p-4 bg-[#00A878]/10 border border-[#00A878]/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00A878] text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#171717]">Lote cadastrado com sucesso</h3>
                <p className="text-xs text-[#6B7280]">
                  Foram gerados <strong>{savedBatchPatrimonios.length}</strong> códigos sequenciais do <strong>{savedBatchPatrimonios[0]?.codigo}</strong> ao <strong>{savedBatchPatrimonios[savedBatchPatrimonios.length - 1]?.codigo}</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowBatchPrintModal(true)}
              className="flex-1 py-3 px-4 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir todas as {savedBatchPatrimonios.length} etiquetas em lote</span>
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              className="py-3 px-4 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              + Novo Cadastro
            </button>
          </div>
        </div>
      )}

      {/* FORMULÁRIO */}
      {!savedPatrimonio && savedBatchPatrimonios.length === 0 && (
        <form onSubmit={tabMode === 'single' ? handleSubmitSingle : handleSubmitBatch} className="space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-[#DC2626]">
              {errorMessage}
            </div>
          )}

          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Seção 1 — Identificação
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#171717] mb-1.5">
                Descrição do Patrimônio <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Notebook Dell Latitude 5420 i7 16GB"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  placeholder="Ex: TI / Informática, Mobiliário, Veículos"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1.5">
                  Número de Série (S/N)
                </label>
                <input
                  type="text"
                  placeholder="Ex: BR5420X991"
                  value={numeroSerie}
                  onChange={(e) => setNumeroSerie(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white font-mono"
                />
              </div>
            </div>

            {tabMode === 'batch' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="block text-xs font-bold text-amber-900 mb-1.5">
                  Quantidade de Etiquetas a Gerar em Sequência (1 a 100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={batchCount}
                  onChange={(e) => setBatchCount(parseInt(e.target.value, 10) || 1)}
                  className="w-32 px-3 py-2 rounded-lg border border-amber-300 focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-sm font-bold bg-white"
                />
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Seção 2 — Localização & Guarda
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1.5">
                  Setor / Departamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tecnologia da Informação"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1.5">
                  Localização Física
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sala 02, Mesa 03, Galpão Doca 01"
                  value={localizacao}
                  onChange={(e) => setLocalizacao(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1.5">
                  Responsável pelo Bem
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Silva"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="border-b border-[#E5E7EB] pb-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Seção 3 — Status Inicial
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1.5">
                  Status Operacional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white font-medium"
                >
                  <option value="Ativo">Ativo (Em uso regular)</option>
                  <option value="Em Manutenção">Em Manutenção / Revisão</option>
                  <option value="Inativo">Inativo / Almoxarifado</option>
                  <option value="Baixado">Baixado / Descartado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171717] mb-1.5">
                  Observações / Detalhes de Entrega
                </label>
                <input
                  type="text"
                  placeholder="Ex: Acompanha fonte original e cabo de força"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#FFC400] hover:bg-[#F5B800] active:scale-[0.99] text-[#111111] font-bold text-xs sm:text-sm rounded-lg shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando patrimônio...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{tabMode === 'single' ? 'Salvar e Gerar Etiqueta' : `Gerar Lote de ${batchCount} Patrimônios`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {showPrintModal && savedPatrimonio && (
        <PrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          item={savedPatrimonio}
        />
      )}

      {showBatchPrintModal && savedBatchPatrimonios.length > 0 && (
        <BatchPrintModal
          isOpen={showBatchPrintModal}
          onClose={() => setShowBatchPrintModal(false)}
          items={savedBatchPatrimonios}
        />
      )}
    </div>
  );
};
