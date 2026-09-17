import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Camera, 
  Printer, 
  ArrowLeft, 
  Check, 
  Copy, 
  Pencil, 
  X, 
  Save, 
  History, 
  MessageSquareShare, 
  Loader2
} from 'lucide-react';
import { 
  getPatrimonioByCodigo, 
  updatePatrimonio, 
  getHistoricoPatrimonio, 
  searchPatrimonios,
  getAllPatrimonios 
} from '../services/patrimonioService';
import type { Patrimonio, HistoricoEvento, UserRole } from '../types/patrimonio';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { PrintModal } from '../components/PrintModal';
import { CameraScannerModal } from '../components/CameraScannerModal';
import { TermoResponsabilidadeModal } from '../components/TermoResponsabilidadeModal';
import { StatusBadge, EmptyState } from '../components/UIComponents';
import { useToast } from '../components/Toast';

interface ScanSearchScreenProps {
  onBack: () => void;
  onNavigateToNew: () => void;
  initialCode?: string;
  userRole?: UserRole;
}

export const ScanSearchScreen: React.FC<ScanSearchScreenProps> = ({
  onNavigateToNew,
  initialCode = '',
  userRole = 'admin',
}) => {
  const { showToast } = useToast();
  const [searchInput, setSearchInput] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [foundPatrimonio, setFoundPatrimonio] = useState<Patrimonio | null>(null);
  const [searchResults, setSearchResults] = useState<Patrimonio[]>([]);
  const [historicoList, setHistoricoList] = useState<HistoricoEvento[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativos' | 'Manutenção' | 'Baixados'>('Todos');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modais
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTermoModalOpen, setIsTermoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Campos de Edição
  const [editDescricao, setEditDescricao] = useState('');
  const [editCategoria, setEditCategoria] = useState('');
  const [editSetor, setEditSetor] = useState('');
  const [editLocalizacao, setEditLocalizacao] = useState('');
  const [editResponsavel, setEditResponsavel] = useState('');
  const [editNumeroSerie, setEditNumeroSerie] = useState('');
  const [editStatus, setEditStatus] = useState('Ativo');
  const [editObservacoes, setEditObservacoes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    } else {
      loadInitialList();
    }
  }, [initialCode]);

  const loadInitialList = async () => {
    setIsLoading(true);
    try {
      const items = await getAllPatrimonios(30);
      setSearchResults(items);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPatrimonio = async (item: Patrimonio) => {
    setFoundPatrimonio(item);
    setIsLoading(true);
    try {
      const hist = await getHistoricoPatrimonio(item.codigo);
      setHistoricoList(hist);
    } catch (err) {
      console.warn('Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (termToSearch: string) => {
    const raw = termToSearch.trim();
    if (!raw) {
      loadInitialList();
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setFoundPatrimonio(null);
    setHistoricoList([]);

    try {
      const exact = await getPatrimonioByCodigo(raw);
      if (exact) {
        handleSelectPatrimonio(exact);
        return;
      }

      const results = await searchPatrimonios(raw);
      if (results.length === 1) {
        handleSelectPatrimonio(results[0]);
      } else {
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Erro na pesquisa:', err);
      showToast('Erro ao realizar busca.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    showToast(`✓ Código ${code} copiado.`, 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenEdit = (item: Patrimonio) => {
    setEditDescricao(item.descricao);
    setEditCategoria(item.categoria || '');
    setEditSetor(item.setor || '');
    setEditLocalizacao(item.localizacao || '');
    setEditResponsavel(item.responsavel || '');
    setEditNumeroSerie(item.numero_serie || '');
    setEditStatus(item.status || 'Ativo');
    setEditObservacoes(item.observacoes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundPatrimonio) return;

    setIsSavingEdit(true);
    try {
      const updated = await updatePatrimonio(foundPatrimonio.codigo, {
        descricao: editDescricao,
        categoria: editCategoria,
        setor: editSetor,
        localizacao: editLocalizacao,
        responsavel: editResponsavel,
        numero_serie: editNumeroSerie,
        status: editStatus,
        observacoes: editObservacoes,
      });

      setFoundPatrimonio(updated);
      setIsEditModalOpen(false);
      showToast('✓ Alterações salvas com sucesso.', 'success');

      const hist = await getHistoricoPatrimonio(updated.codigo);
      setHistoricoList(hist);
    } catch (err: any) {
      console.error('Erro ao editar:', err);
      showToast(err.message || 'Erro ao salvar alterações.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredResults = searchResults.filter((item) => {
    if (statusFilter === 'Todos') return true;
    const st = (item.status || 'Ativo').toLowerCase();
    if (statusFilter === 'Ativos') return st === 'ativo';
    if (statusFilter === 'Manutenção') return st.includes('manuten');
    if (statusFilter === 'Baixados') return st.includes('baix') || st.includes('avari');
    return true;
  });

  return (
    <div className="space-y-6">
      {!foundPatrimonio && (
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchInput);
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Pesquise por código MP, descrição, responsável, setor ou número de série..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm bg-white"
              />
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Buscar</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-4 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Bipar etiqueta com a câmera"
              >
                <Camera className="w-4 h-4 text-[#FFC400]" />
                <span>Bipar com câmera</span>
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 pt-1 border-t border-[#E5E7EB] overflow-x-auto">
            <span className="text-xs font-semibold text-[#6B7280] shrink-0">Filtrar por:</span>
            {(['Todos', 'Ativos', 'Manutenção', 'Baixados'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  statusFilter === filter
                    ? 'bg-[#111111] text-[#FFC400]'
                    : 'bg-neutral-100 text-[#6B7280] hover:text-[#171717]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      )}

      {!foundPatrimonio && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              {hasSearched ? `Resultados da busca (${filteredResults.length})` : `Inventário Recente (${filteredResults.length})`}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#6B7280] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#FFC400]" />
              <span>Buscando registros...</span>
            </div>
          ) : filteredResults.length === 0 ? (
            <EmptyState
              title="Nenhum patrimônio encontrado"
              description="Tente alterar os termos de busca ou filtros, ou cadastre um novo bem no sistema."
              actionLabel={userRole === 'admin' ? '+ Novo Patrimônio' : undefined}
              onAction={onNavigateToNew}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F7F8] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Patrimônio / Descrição</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Setor</th>
                    <th className="py-3 px-4">Localização</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredResults.map((item) => (
                    <tr
                      key={item.codigo}
                      onClick={() => handleSelectPatrimonio(item)}
                      className="hover:bg-neutral-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#171717]">{item.codigo}</td>
                      <td className="py-3 px-4 font-semibold text-[#171717] max-w-[220px] truncate">{item.descricao}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{item.categoria || '—'}</td>
                      <td className="py-3 px-4 text-[#171717] font-medium">{item.setor || '—'}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{item.localizacao || '—'}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{item.responsavel || '—'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs font-bold text-[#171717] hover:underline">
                          Ver detalhes →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {foundPatrimonio && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <button
            onClick={() => setFoundPatrimonio(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#171717] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para a busca</span>
          </button>

          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black text-[#171717] font-mono tracking-tight">
                  {foundPatrimonio.codigo}
                </span>
                <StatusBadge status={foundPatrimonio.status} />
                <button
                  onClick={() => handleCopyCode(foundPatrimonio.codigo)}
                  className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Copiar código do patrimônio"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[#00A878]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              <h2 className="text-lg font-bold text-[#171717]">
                {foundPatrimonio.descricao}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="px-3.5 py-2 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir etiqueta</span>
              </button>

              {userRole === 'admin' && (
                <button
                  onClick={() => handleOpenEdit(foundPatrimonio)}
                  className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-[#6B7280]" />
                  <span>Editar</span>
                </button>
              )}

              <button
                onClick={() => setIsTermoModalOpen(true)}
                className="px-3.5 py-2 bg-[#00A878]/10 hover:bg-[#00A878]/20 text-[#00A878] text-xs font-bold rounded-lg border border-[#00A878]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquareShare className="w-4 h-4" />
                <span>Comprovante WhatsApp / Termo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB] pb-2">
                Informações do Patrimônio
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#6B7280] font-medium block">Categoria</span>
                  <span className="text-[#171717] font-semibold text-sm">{foundPatrimonio.categoria || 'Não especificada'}</span>
                </div>

                <div>
                  <span className="text-[#6B7280] font-medium block">Número de Série (S/N)</span>
                  <span className="text-[#171717] font-mono font-semibold text-sm">{foundPatrimonio.numero_serie || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-[#6B7280] font-medium block">Setor / Departamento</span>
                  <span className="text-[#171717] font-semibold text-sm">{foundPatrimonio.setor || 'Não especificado'}</span>
                </div>

                <div>
                  <span className="text-[#6B7280] font-medium block">Localização Física</span>
                  <span className="text-[#171717] font-semibold text-sm">{foundPatrimonio.localizacao || 'Não especificada'}</span>
                </div>

                <div>
                  <span className="text-[#6B7280] font-medium block">Responsável Atual</span>
                  <span className="text-[#171717] font-semibold text-sm">{foundPatrimonio.responsavel || 'Não especificado'}</span>
                </div>

                <div>
                  <span className="text-[#6B7280] font-medium block">Data de Cadastro</span>
                  <span className="text-[#171717] font-semibold text-sm">
                    {foundPatrimonio.created_at ? new Date(foundPatrimonio.created_at).toLocaleDateString('pt-BR') : 'Hoje'}
                  </span>
                </div>

                {foundPatrimonio.observacoes && (
                  <div className="sm:col-span-2 p-3 bg-[#F7F7F8] rounded-lg border border-[#E5E7EB]">
                    <span className="text-[#6B7280] font-medium block mb-0.5">Observações:</span>
                    <p className="text-[#171717]">{foundPatrimonio.observacoes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
                Etiqueta Oficial
              </span>
              <BarcodeLabel item={foundPatrimonio} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-2 border-b border-[#E5E7EB] pb-2">
              <History className="w-4 h-4" />
              Histórico & Movimentações
            </h3>

            {historicoList.length === 0 ? (
              <p className="text-xs text-[#6B7280] py-2">
                Nenhuma movimentação registrada no histórico deste bem além do cadastro inicial.
              </p>
            ) : (
              <div className="space-y-3">
                {historicoList.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs border-l-2 border-[#FFC400] pl-3 py-1">
                    <div>
                      <p className="font-bold text-[#171717]">{h.titulo}</p>
                      {h.descricao && <p className="text-[#6B7280] mt-0.5">{h.descricao}</p>}
                      <span className="text-[11px] text-[#6B7280] mt-1 block">
                        {h.criado_em ? new Date(h.criado_em).toLocaleString('pt-BR') : 'Data recente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isCameraOpen && (
        <CameraScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanSuccess={(code) => {
            setIsCameraOpen(false);
            setSearchInput(code);
            handleSearch(code);
          }}
        />
      )}

      {isPrintModalOpen && foundPatrimonio && (
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          item={foundPatrimonio}
        />
      )}

      {isTermoModalOpen && foundPatrimonio && (
        <TermoResponsabilidadeModal
          isOpen={isTermoModalOpen}
          onClose={() => setIsTermoModalOpen(false)}
          patrimonio={foundPatrimonio}
        />
      )}

      {isEditModalOpen && foundPatrimonio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-[#E5E7EB] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <h3 className="text-sm font-bold text-[#171717]">
                Editar Patrimônio — {foundPatrimonio.codigo}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#6B7280] hover:text-[#171717] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#171717] mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171717] mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#171717] mb-1">Número de Série</label>
                  <input
                    type="text"
                    value={editNumeroSerie}
                    onChange={(e) => setEditNumeroSerie(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171717] mb-1">Setor</label>
                  <input
                    type="text"
                    value={editSetor}
                    onChange={(e) => setEditSetor(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#171717] mb-1">Localização</label>
                  <input
                    type="text"
                    value={editLocalizacao}
                    onChange={(e) => setEditLocalizacao(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#171717] mb-1">Responsável</label>
                  <input
                    type="text"
                    value={editResponsavel}
                    onChange={(e) => setEditResponsavel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#171717] mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] font-medium"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Manutenção">Em Manutenção</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Baixado">Baixado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#171717] mb-1">Observações</label>
                <input
                  type="text"
                  value={editObservacoes}
                  onChange={(e) => setEditObservacoes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#171717] rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
