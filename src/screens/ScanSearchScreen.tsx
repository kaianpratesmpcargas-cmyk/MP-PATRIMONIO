import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Camera, 
  Printer, 
  ArrowLeft, 
  RotateCcw, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Pencil, 
  Clock, 
  X, 
  Save, 
  History, 
  MapPin,
  Send,
  MessageSquareShare
} from 'lucide-react';
import { 
  getPatrimonioByCodigo, 
  updatePatrimonio, 
  getHistoricoPatrimonio, 
  formatCodeInput,
  searchPatrimonios 
} from '../services/patrimonioService';
import { enviarTermoDiretoWhatsApp } from '../services/pdfService';
import type { Patrimonio, HistoricoEvento, UserRole } from '../types/patrimonio';


import { BarcodeLabel } from '../components/BarcodeLabel';
import { PrintModal } from '../components/PrintModal';
import { CameraScannerModal } from '../components/CameraScannerModal';
import { TermoResponsabilidadeModal } from '../components/TermoResponsabilidadeModal';
import { FileText, ChevronRight, Boxes } from 'lucide-react';

interface ScanSearchScreenProps {
  onBack: () => void;
  onNavigateToNew: () => void;
  initialCode?: string;
  userRole?: UserRole;
}

export const ScanSearchScreen: React.FC<ScanSearchScreenProps> = ({
  onBack,
  onNavigateToNew,
  initialCode = '',
  userRole = 'admin',
}) => {
  const [searchInput, setSearchInput] = useState(initialCode);
  const [searchedCode, setSearchedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundPatrimonio, setFoundPatrimonio] = useState<Patrimonio | null>(null);
  const [multipleResults, setMultipleResults] = useState<Patrimonio[]>([]);
  const [historicoList, setHistoricoList] = useState<HistoricoEvento[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTermoModalOpen, setIsTermoModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  // Modal WhatsApp
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');

  // Estados de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    if (!foundPatrimonio && !hasSearched && multipleResults.length === 0) {
      inputRef.current?.focus();
    }
  }, [foundPatrimonio, hasSearched, multipleResults]);

  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSelectPatrimonio = async (item: Patrimonio) => {
    setFoundPatrimonio(item);
    setMultipleResults([]);
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
    if (!raw) return;

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);
    setSearchedCode(raw);
    setMultipleResults([]);
    setFoundPatrimonio(null);
    setHistoricoList([]);

    try {
      // 1. Tenta primeiro busca exata pelo código (ex: MP-000001 ou 1)
      const exactResult = await getPatrimonioByCodigo(raw);
      if (exactResult) {
        setFoundPatrimonio(exactResult);
        const hist = await getHistoricoPatrimonio(exactResult.codigo);
        setHistoricoList(hist);
        return;
      }

      // 2. Se não for código exato, busca ampla por Nome / Descrição / Responsável / Setor
      const searchResults = await searchPatrimonios(raw);

      if (searchResults.length === 1) {
        // Exatamente 1 encontrado: abre direto
        setFoundPatrimonio(searchResults[0]);
        const hist = await getHistoricoPatrimonio(searchResults[0].codigo);
        setHistoricoList(hist);
      } else if (searchResults.length > 1) {
        // Múltiplos encontrados: exibe lista com cards
        setMultipleResults(searchResults);
      } else {
        // Nenhum encontrado
        setFoundPatrimonio(null);
        setMultipleResults([]);
      }
    } catch (err: any) {
      console.error('Erro na consulta:', err);
      setErrorMessage(err.message || 'Erro ao consultar banco de dados.');
      setFoundPatrimonio(null);
      setMultipleResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchInput);
    }
  };

  const handleCameraScanSuccess = (scannedCode: string) => {
    setSearchInput(scannedCode);
    handleSearch(scannedCode);
  };

  const handleNewSearch = () => {
    setSearchInput('');
    setSearchedCode('');
    setFoundPatrimonio(null);
    setMultipleResults([]);
    setHistoricoList([]);
    setHasSearched(false);
    setErrorMessage(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleOpenEdit = () => {
    if (!foundPatrimonio) return;
    setEditDescricao(foundPatrimonio.descricao);
    setEditCategoria(foundPatrimonio.categoria || '');
    setEditSetor(foundPatrimonio.setor || '');
    setEditLocalizacao(foundPatrimonio.localizacao || '');
    setEditResponsavel(foundPatrimonio.responsavel || '');
    setEditNumeroSerie(foundPatrimonio.numero_serie || '');
    setEditStatus(foundPatrimonio.status || 'Ativo');
    setEditObservacoes(foundPatrimonio.observacoes || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundPatrimonio || !editDescricao.trim()) return;

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

      const hist = await getHistoricoPatrimonio(updated.codigo);
      setHistoricoList(hist);
    } catch (err: any) {
      alert('Erro ao salvar alterações: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!foundPatrimonio) return;
    setIsWhatsAppModalOpen(false);
    await enviarTermoDiretoWhatsApp(foundPatrimonio, whatsAppPhone);
  };


  return (
    <div className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Botão Voltar */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer no-print"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Início
      </button>

      {/* ESTADO 1: ENCONTRADO */}
      {hasSearched && foundPatrimonio && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            {/* Topo do Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                    Patrimônio Localizado
                  </span>
                  <h1 className="text-3xl font-black text-black font-mono tracking-wide">
                    {foundPatrimonio.codigo}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                    foundPatrimonio.status === 'Ativo'
                      ? 'bg-emerald-100 text-emerald-800'
                      : foundPatrimonio.status === 'Em Manutenção'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {foundPatrimonio.status}
                </span>

                {userRole === 'admin' && (
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    title="Editar cadastro"
                    className="bg-gray-900 hover:bg-black text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#FFD100]" />
                    <span>Editar</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Detalhes do Patrimônio */}
              <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-xs uppercase font-bold text-gray-500">
                    Descrição
                  </span>
                  <p className="text-xl font-black text-gray-900 mt-0.5">
                    {foundPatrimonio.descricao}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <span className="text-xs uppercase font-bold text-gray-500">Categoria</span>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {foundPatrimonio.categoria || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-gray-500">Setor</span>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {foundPatrimonio.setor || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-gray-500">Localização</span>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {foundPatrimonio.localizacao || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-gray-500">Responsável</span>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {foundPatrimonio.responsavel || '-'}
                    </p>
                  </div>
                </div>

                {foundPatrimonio.numero_serie && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs uppercase font-bold text-gray-500">Número de Série</span>
                    <p className="text-sm font-mono font-bold text-gray-800">
                      {foundPatrimonio.numero_serie}
                    </p>
                  </div>
                )}

                {foundPatrimonio.observacoes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs uppercase font-bold text-gray-500">Observações</span>
                    <p className="text-xs text-gray-700 font-medium italic mt-0.5">
                      "{foundPatrimonio.observacoes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Etiqueta Renderizada */}
              <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-2xl border border-gray-300">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Etiqueta do Patrimônio
                </span>
                <BarcodeLabel
                  codigo={foundPatrimonio.codigo}
                  descricao={foundPatrimonio.descricao}
                  setor={foundPatrimonio.setor}
                  localizacao={foundPatrimonio.localizacao}
                />
              </div>
            </div>

            {/* Botões de Ação: Etiqueta, Termo PDF, WhatsApp, Nova Consulta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>ETIQUETA</span>
              </button>

              <button
                onClick={() => setIsTermoModalOpen(true)}
                className="bg-neutral-900 hover:bg-black active:scale-[0.99] text-[#FFD100] font-black text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer border border-neutral-800"
              >
                <FileText className="w-4 h-4 text-[#FFD100]" />
                <span>TERMO PDF</span>
              </button>

              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <MessageSquareShare className="w-4 h-4 text-emerald-100" />
                <span>WHATSAPP</span>
              </button>

              <button
                onClick={handleNewSearch}
                className="bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>NOVA BUSCA</span>
              </button>
            </div>
          </div>


          {/* HISTÓRICO DE MOVIMENTAÇÕES (LINHA DO TEMPO) */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 mb-6">
              <History className="w-5 h-5 text-[#FFD100]" />
              <div>
                <h3 className="font-black text-base text-gray-900 uppercase tracking-wider">
                  Histórico de Movimentações & Auditorias
                </h3>
                <p className="text-xs text-gray-500">
                  Rastreabilidade completa de todas as alterações deste patrimônio
                </p>
              </div>
            </div>

            {historicoList.length === 0 ? (
              <div className="py-6 text-center text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold text-gray-500">
                  Nenhum registro anterior detalhado no histórico.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                {historicoList.map((item, idx) => {
                  const dataFormatada = item.criado_em 
                    ? new Date(item.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Data não informada';

                  return (
                    <div key={item.id || idx} className="relative">
                      <span className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        item.tipo === 'cadastro' ? 'bg-[#FFD100]' :
                        item.tipo === 'movimentacao' ? 'bg-blue-500' :
                        item.tipo === 'conferencia' ? 'bg-emerald-500' :
                        item.tipo === 'baixa' ? 'bg-red-500' : 'bg-gray-800'
                      }`}></span>

                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <span className="font-black text-sm text-gray-900">
                            {item.titulo}
                          </span>
                          <span className="text-[11px] font-mono text-gray-500">
                            {dataFormatada}
                          </span>
                        </div>

                        {item.descricao && (
                          <p className="text-xs text-gray-600 mt-1">
                            {item.descricao}
                          </p>
                        )}

                        {item.setor_novo && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span>Setor: {item.setor_novo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ESTADO 2: MÚLTIPLOS RESULTADOS ENCONTRADOS (BUSCA POR NOME / DESCRIÇÃO / RESPONSÁVEL) */}
      {hasSearched && !foundPatrimonio && multipleResults.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl border border-neutral-200 p-6 sm:p-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3 mb-6">
            <div>
              <span className="text-xs font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4" />
                <span>Resultados da Pesquisa por Nome</span>
              </span>
              <h2 className="text-2xl font-black text-neutral-900 mt-0.5">
                {multipleResults.length} {multipleResults.length === 1 ? 'patrimônio encontrado' : 'patrimônios encontrados'} para "{searchedCode}"
              </h2>
            </div>

            <button
              onClick={handleNewSearch}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Nova Busca</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {multipleResults.map((item) => (
              <div
                key={item.id || item.codigo}
                onClick={() => handleSelectPatrimonio(item)}
                className="group bg-neutral-50 hover:bg-white p-5 rounded-2xl border-2 border-neutral-200 hover:border-black hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono font-black text-sm text-black bg-[#FFD100] px-2.5 py-0.5 rounded-lg shadow-xs">
                      {item.codigo}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        item.status === 'Ativo'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Em Manutenção'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h4 className="font-black text-base text-neutral-900 group-hover:text-black line-clamp-2">
                    {item.descricao}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-2">
                    {item.setor && <span>🏢 {item.setor}</span>}
                    {item.localizacao && <span>📍 {item.localizacao}</span>}
                    {item.responsavel && <span>👤 {item.responsavel}</span>}
                    {item.numero_serie && <span className="font-mono">SN: {item.numero_serie}</span>}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-neutral-200/80 flex items-center justify-end text-xs font-black text-neutral-800 group-hover:text-black transition-colors">
                  <span>Abrir Ficha & Etiqueta</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ESTADO 3: NÃO ENCONTRADO */}
      {hasSearched && !foundPatrimonio && multipleResults.length === 0 && !isLoading && (
        <div className="bg-white rounded-3xl shadow-xl border border-red-200 p-6 sm:p-10 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-9 h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
            Nenhum patrimônio encontrado
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Termo pesquisado:
          </p>

          <div className="inline-block bg-gray-100 border border-gray-300 px-6 py-2 rounded-xl mb-8">
            <span className="text-2xl font-mono font-black text-gray-900">
              {formatCodeInput(searchedCode) || searchedCode}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            {userRole === 'admin' && (
              <button
                onClick={onNavigateToNew}
                className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] text-black font-black text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                CADASTRAR NOVO
              </button>
            )}

            <button
              onClick={handleNewSearch}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              TENTAR NOVAMENTE
            </button>
          </div>
        </div>
      )}

      {/* ESTADO 4: FORMULÁRIO DE BIPAGEM / PESQUISA POR NOME OU CÓDIGO */}
      {!hasSearched && (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-gray-100 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-black text-[#FFD100] flex items-center justify-center shadow-md">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Consultar Patrimônio
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Pesquise por nome do bem, código MP-, responsável, setor ou bipe com leitor/câmera
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-800 mb-2">
                Nome do Bem, Descrição, Responsável ou Código de Barras
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ex: Notebook Dell, Mesa, Cadeira, Carlos, MP-000001..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-black focus:outline-none focus:ring-4 focus:ring-[#FFD100]/40 text-lg font-bold bg-gray-50/50 shadow-inner"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              </div>

              <p className="text-xs text-gray-500 mt-2 font-medium">
                💡 <strong>Dica:</strong> Você pode digitar palavras como <em>"Notebook"</em>, <em>"Mesa"</em> ou bipar diretamente com o leitor USB.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => handleSearch(searchInput)}
                disabled={isLoading || !searchInput.trim()}
                className="bg-black hover:bg-gray-800 active:scale-[0.99] text-white font-black text-base py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-5 h-5 text-[#FFD100]" />
                {isLoading ? 'Pesquisando...' : 'BUSCAR PATRIMÔNIO'}
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-base py-4 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                BIPAR COM CÂMERA DO CELULAR
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL ENVIAR NO WHATSAPP */}
      {isWhatsAppModalOpen && foundPatrimonio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-gray-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-gray-900">
                  Comprovante por WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4">
              Envie o comprovante de entrega do patrimônio <strong>{foundPatrimonio.codigo}</strong> diretamente para o WhatsApp do responsável.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                WhatsApp do Responsável (com DDD)
              </label>
              <input
                type="tel"
                value={whatsAppPhone}
                onChange={(e) => setWhatsAppPhone(e.target.value)}
                placeholder="Ex: 11999998888 (opcional)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold bg-white"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Se deixar em branco, o WhatsApp abrirá para você escolher o contato na lista.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send className="w-4 h-4" />
                ABRIR NO WHATSAPP
              </button>
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 px-4 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CADASTRO */}
      {isEditModalOpen && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#FFD100]" />
                <h3 className="font-black text-lg text-gray-900">
                  Editar Cadastro ({foundPatrimonio?.codigo})
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Setor</label>
                  <input
                    type="text"
                    value={editSetor}
                    onChange={(e) => setEditSetor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Localização</label>
                  <input
                    type="text"
                    value={editLocalizacao}
                    onChange={(e) => setEditLocalizacao(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Responsável</label>
                  <input
                    type="text"
                    value={editResponsavel}
                    onChange={(e) => setEditResponsavel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Nº de Série</label>
                  <input
                    type="text"
                    value={editNumeroSerie}
                    onChange={(e) => setEditNumeroSerie(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Em Manutenção">Em Manutenção</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Baixado">Baixado</option>
                    <option value="Avariado">Avariado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={editObservacoes}
                  onChange={(e) => setEditObservacoes(e.target.value)}
                  placeholder="Histórico ou notas adicionais..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] text-black font-black text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {isSavingEdit ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 px-4 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Impressão */}
      {foundPatrimonio && isPrintModalOpen && (
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          codigo={foundPatrimonio.codigo}
          descricao={foundPatrimonio.descricao}
          setor={foundPatrimonio.setor}
          localizacao={foundPatrimonio.localizacao}
        />
      )}

      {/* Modal de Comprovante Oficial / Termo de Cautela PDF */}
      {foundPatrimonio && isTermoModalOpen && (
        <TermoResponsabilidadeModal
          isOpen={isTermoModalOpen}
          onClose={() => setIsTermoModalOpen(false)}
          patrimonio={foundPatrimonio}
        />
      )}

      {/* Modal de Leitura por Câmera */}
      {isCameraOpen && (
        <CameraScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanSuccess={handleCameraScanSuccess}
        />
      )}
    </div>
  );
};

