import { useState, useEffect, useRef } from 'react';
import { Search, Camera, Printer, ArrowLeft, RotateCcw, PlusCircle, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';
import { getPatrimonioByCodigo, formatCodeInput } from '../services/patrimonioService';
import type { Patrimonio } from '../types/patrimonio';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { PrintModal } from '../components/PrintModal';
import { CameraScannerModal } from '../components/CameraScannerModal';

interface ScanSearchScreenProps {
  onBack: () => void;
  onNavigateToNew: () => void;
  initialCode?: string;
}

export const ScanSearchScreen: React.FC<ScanSearchScreenProps> = ({
  onBack,
  onNavigateToNew,
  initialCode = '',
}) => {
  const [searchInput, setSearchInput] = useState(initialCode);
  const [searchedCode, setSearchedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [foundPatrimonio, setFoundPatrimonio] = useState<Patrimonio | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Foco automático contínuo
  useEffect(() => {
    if (!foundPatrimonio && !hasSearched) {
      inputRef.current?.focus();
    }
  }, [foundPatrimonio, hasSearched]);

  // Se veio com código inicial (ex: vindo da listagem)
  useEffect(() => {
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSearch = async (codeToSearch: string) => {
    const raw = codeToSearch.trim();
    if (!raw) return;

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);
    setSearchedCode(raw);

    try {
      const result = await getPatrimonioByCodigo(raw);
      setFoundPatrimonio(result);
    } catch (err: any) {
      console.error('Erro na consulta:', err);
      setErrorMessage(err.message || 'Erro ao consultar banco de dados.');
      setFoundPatrimonio(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Quando a pistola de código de barras ou o usuário pressiona ENTER
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
    setHasSearched(false);
    setErrorMessage(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
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

            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              {foundPatrimonio.status}
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

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <Printer className="w-6 h-6" />
              IMPRIMIR ETIQUETA
            </button>

            <button
              onClick={handleNewSearch}
              className="bg-gray-900 hover:bg-black text-white font-bold text-base py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              NOVA CONSULTA
            </button>
          </div>
        </div>
      )}

      {/* ESTADO 2: NÃO ENCONTRADO */}
      {hasSearched && !foundPatrimonio && !isLoading && (
        <div className="bg-white rounded-3xl shadow-xl border border-red-200 p-6 sm:p-10 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-9 h-9" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
            Patrimônio não encontrado
          </h2>

          <p className="text-sm text-gray-500 mb-4">
            Código pesquisado:
          </p>

          <div className="inline-block bg-gray-100 border border-gray-300 px-6 py-2 rounded-xl mb-8">
            <span className="text-2xl font-mono font-black text-gray-900">
              {formatCodeInput(searchedCode) || searchedCode}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={onNavigateToNew}
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] text-black font-black text-base py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              CADASTRAR NOVO
            </button>

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

      {/* ESTADO 3: FORMULÁRIO DE BIPAGEM / PESQUISA (Se ainda não pesquisou ou limpou) */}
      {!hasSearched && (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#FFD100] text-black font-black text-xs uppercase px-3 py-1 rounded-full mb-3 tracking-wider">
              <QrCode className="w-3.5 h-3.5" />
              Leitura Rápida
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Consultar / Bipar
            </h1>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Pistola de código de barras USB ou Câmera do Smartphone
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold text-center">
              {errorMessage}
            </div>
          )}

          {/* Campo Grande de Bipagem */}
          <div className="space-y-4 max-w-xl mx-auto">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite ou bipar o código..."
                className="w-full text-center sm:text-left px-5 py-5 sm:pl-14 rounded-2xl border-2 border-black focus:outline-none focus:ring-4 focus:ring-[#FFD100]/50 text-xl sm:text-2xl font-mono font-bold bg-white text-black shadow-inner tracking-wider"
                autoFocus
              />
              <Search className="hidden sm:block absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            </div>

            {/* Botão de Pesquisar Manual */}
            <button
              onClick={() => handleSearch(searchInput)}
              disabled={isLoading || !searchInput.trim()}
              className="w-full bg-[#111111] hover:bg-[#222222] active:scale-[0.99] text-[#FFD100] font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                'Consultando no Supabase...'
              ) : (
                <>
                  <Search className="w-6 h-6" />
                  CONSULTAR CÓDIGO
                </>
              )}
            </button>

            {/* Divisor Visual */}
            <div className="relative flex py-3 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-xs font-bold uppercase text-gray-400 tracking-wider">
                OU PELO CELULAR
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Botão BIPAR COM CÂMERA */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="w-full bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-lg py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-black/10"
            >
              <Camera className="w-6 h-6 text-black" />
              📷 BIPAR COM CÂMERA
            </button>
          </div>
        </div>
      )}

      {/* Modal de Impressão */}
      {foundPatrimonio && (
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          codigo={foundPatrimonio.codigo}
          descricao={foundPatrimonio.descricao}
          setor={foundPatrimonio.setor}
          localizacao={foundPatrimonio.localizacao}
        />
      )}


      {/* Modal de Leitura de Câmera */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </div>
  );
};
