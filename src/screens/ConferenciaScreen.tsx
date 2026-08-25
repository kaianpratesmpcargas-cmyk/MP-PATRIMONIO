import { useState, useRef, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Camera, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  RotateCcw,
  Clock
} from 'lucide-react';
import { getPatrimonioByCodigo, updatePatrimonioConferencia, formatCodeInput } from '../services/patrimonioService';
import type { Patrimonio } from '../types/patrimonio';
import { CameraScannerModal } from '../components/CameraScannerModal';

interface ConferenciaScreenProps {
  onBack: () => void;
}

interface ConferidoItem {
  patrimonio: Patrimonio;
  conferidoEm: string;
  statusResultado: string;
  condicaoResultado?: string;
  observacao?: string;
}

export const ConferenciaScreen: React.FC<ConferenciaScreenProps> = ({ onBack }) => {
  const [searchInput, setSearchInput] = useState('');
  const [currentItem, setCurrentItem] = useState<Patrimonio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  // Customizações para o item bipado
  const [customObservacao, setCustomObservacao] = useState('');
  const [editLocalizacao, setEditLocalizacao] = useState(false);
  const [customSetor, setCustomSetor] = useState('');
  const [customLocal, setCustomLocal] = useState('');

  
  // Lista de itens auditados nesta sessão
  const [conferidosList, setConferidosList] = useState<ConferidoItem[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (codeToSearch?: string) => {
    const code = (codeToSearch || searchInput).trim();
    if (!code) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      const found = await getPatrimonioByCodigo(code);
      if (!found) {
        setErrorMessage(`Patrimônio ${formatCodeInput(code)} não foi encontrado no banco central.`);
        setCurrentItem(null);
      } else {
        setCurrentItem(found);
        setCustomObservacao(found.observacoes || '');
        setCustomSetor(found.setor || '');
        setCustomLocal(found.localizacao || '');
        setEditLocalizacao(false);
      }

    } catch (err: any) {
      console.error('Erro na busca de conferência:', err);
      setErrorMessage(err.message || 'Erro ao consultar item.');
      setCurrentItem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleCameraScanSuccess = (decodedText: string) => {
    setIsCameraOpen(false);
    setSearchInput(decodedText);
    handleSearch(decodedText);
  };

  const handleRegistrarConferencia = async (novoStatus: string, condicaoTexto: string) => {
    if (!currentItem) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const updated = await updatePatrimonioConferencia(currentItem.codigo, {
        status: novoStatus,
        condicao: condicaoTexto,
        observacoes: customObservacao.trim() || undefined,
        setor: customSetor.trim() || currentItem.setor,
        localizacao: customLocal.trim() || currentItem.localizacao,
      });

      // Adiciona na lista da sessão
      const newItemConferido: ConferidoItem = {
        patrimonio: updated,
        conferidoEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        statusResultado: novoStatus,
        condicaoResultado: condicaoTexto,
        observacao: customObservacao.trim() || undefined,
      };

      setConferidosList((prev) => [newItemConferido, ...prev.filter((i) => i.patrimonio.codigo !== updated.codigo)]);

      setSuccessToast(`✓ ${updated.codigo} conferido como "${novoStatus}" com sucesso!`);
      
      // Limpa e foca no input para o próximo item
      setCurrentItem(null);
      setSearchInput('');
      setCustomObservacao('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      console.error('Erro ao salvar conferência:', err);
      setErrorMessage(err.message || 'Erro ao registrar conferência.');
    } finally {
      setIsLoading(false);
    }
  };

  // Contadores da sessão
  const countTotal = conferidosList.length;
  const countAtivos = conferidosList.filter((i) => i.statusResultado === 'Ativo').length;
  const countManutencao = conferidosList.filter((i) => i.statusResultado === 'Em Manutenção').length;
  const countBaixados = conferidosList.filter((i) => i.statusResultado === 'Baixado' || i.statusResultado === 'Avariado').length;

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

      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFD100] text-black flex items-center justify-center shadow-md shrink-0">
              <ClipboardCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Conferência de Patrimônio
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Audite itens, verifique se estão funcionando e registre baixas ou manutenção
              </p>
            </div>
          </div>

          {/* Resumo da Sessão Atual */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2 rounded-2xl">
            <div className="text-center px-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Auditados</span>
              <span className="text-lg font-black text-black font-mono">{countTotal}</span>
            </div>
            <div className="text-center px-2 border-l border-gray-200">
              <span className="text-[10px] font-bold text-emerald-600 uppercase block">OK</span>
              <span className="text-lg font-black text-emerald-700 font-mono">{countAtivos}</span>
            </div>
            <div className="text-center px-2 border-l border-gray-200">
              <span className="text-[10px] font-bold text-amber-600 uppercase block">Reparo</span>
              <span className="text-lg font-black text-amber-700 font-mono">{countManutencao}</span>
            </div>
            <div className="text-center px-2 border-l border-gray-200">
              <span className="text-[10px] font-bold text-red-600 uppercase block">Baixa</span>
              <span className="text-lg font-black text-red-700 font-mono">{countBaixados}</span>
            </div>
          </div>
        </div>

        {/* Input de Bipagem Rápida */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Bipe com o leitor ou digite o código (ex: MP-000001 ou 1)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-black focus:outline-none focus:ring-4 focus:ring-[#FFD100]/40 text-base font-bold bg-white shadow-inner font-mono"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            </div>

            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={isLoading || !searchInput.trim()}
              className="bg-black hover:bg-gray-800 text-white font-black text-sm px-6 py-3.5 rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="bg-[#FFD100] hover:bg-[#E5BC00] active:scale-95 text-black font-black text-sm px-4 py-3.5 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              <span>Câmera</span>
            </button>
          </div>

          <p className="text-[11px] text-gray-500 mt-2 font-medium">
            💡 <strong>Dica:</strong> Aponte a pistola de código de barras para a etiqueta — o item será carregado automaticamente na tela.
          </p>
        </div>
      </div>

      {/* Toast de Sucesso */}
      {successToast && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-sm font-bold animate-in fade-in zoom-in duration-150 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm font-bold animate-in fade-in duration-150">
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* CARD DO ITEM BIPADO (Para Conferência Imediata) */}
      {currentItem && (
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-black p-6 sm:p-8 mb-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 block">
                Item Selecionado para Conferência
              </span>
              <h2 className="text-3xl font-black text-black font-mono tracking-wider">
                {currentItem.codigo}
              </h2>
            </div>

            <span
              className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                currentItem.status === 'Ativo'
                  ? 'bg-emerald-100 text-emerald-800'
                  : currentItem.status === 'Em Manutenção'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              Status Atual: {currentItem.status}
            </span>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mb-6">
            <h3 className="text-lg font-black text-gray-900 mb-2">
              {currentItem.descricao}
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-500 font-bold block">Setor:</span>
                <span className="font-bold text-gray-800">{currentItem.setor || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block">Localização:</span>
                <span className="font-bold text-gray-800">{currentItem.localizacao || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block">Responsável:</span>
                <span className="font-bold text-gray-800">{currentItem.responsavel || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 font-bold block">Nº de Série:</span>
                <span className="font-mono font-bold text-gray-800">{currentItem.numero_serie || '-'}</span>
              </div>
            </div>
          </div>

          {/* Campo de Observação Opcional */}
          <div className="mb-6 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Observação da Conferência (opcional)
              </label>
              <input
                type="text"
                value={customObservacao}
                onChange={(e) => setCustomObservacao(e.target.value)}
                placeholder="Ex: Teclado revisado, trocado de mesa, arranhão leve..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] text-sm bg-white"
              />
            </div>

            {/* Alternador para Atualizar Setor / Local */}
            <div>
              <button
                type="button"
                onClick={() => setEditLocalizacao(!editLocalizacao)}
                className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1.5 cursor-pointer underline"
              >
                <MapPin className="w-3.5 h-3.5 text-[#FFD100]" />
                {editLocalizacao ? 'Ocultar mudança de setor/local' : 'Item mudou de setor ou sala? Clique aqui para atualizar'}
              </button>

              {editLocalizacao && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">Novo Setor</label>
                    <input
                      type="text"
                      value={customSetor}
                      onChange={(e) => setCustomSetor(e.target.value)}
                      placeholder="Ex: TI, Administrativo..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-amber-900 mb-1">Nova Sala / Local</label>
                    <input
                      type="text"
                      value={customLocal}
                      onChange={(e) => setCustomLocal(e.target.value)}
                      placeholder="Ex: Galpão 01, Sala 04..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOTÕES DE AÇÃO COM 1 CLIQUE */}
          <div className="pt-2">
            <span className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-3 text-center">
              Selecione o Resultado da Conferência:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Botão 1: FUNCIONANDO / OK */}
              <button
                type="button"
                onClick={() => handleRegistrarConferencia('Ativo', 'Funcionando 100%')}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
              >
                <CheckCircle2 className="w-7 h-7 text-emerald-200" />
                <span className="text-sm uppercase font-black tracking-wide">FUNCIONANDO 100%</span>
                <span className="text-[11px] text-emerald-100">Manter Ativo no Sistema</span>
              </button>

              {/* Botão 2: EM MANUTENÇÃO */}
              <button
                type="button"
                onClick={() => handleRegistrarConferencia('Em Manutenção', 'Necessita Reparo')}
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-600 active:scale-98 text-black p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
              >
                <AlertTriangle className="w-7 h-7 text-black" />
                <span className="text-sm uppercase font-black tracking-wide">EM MANUTENÇÃO</span>
                <span className="text-[11px] text-black/80">Necessita Reparo Técnico</span>
              </button>

              {/* Botão 3: DAR BAIXA / AVARIADO */}
              <button
                type="button"
                onClick={() => handleRegistrarConferencia('Baixado', 'Inoperante / Descarte')}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 active:scale-98 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer font-bold"
              >
                <XCircle className="w-7 h-7 text-red-200" />
                <span className="text-sm uppercase font-black tracking-wide">DAR BAIXA</span>
                <span className="text-[11px] text-red-100">Descarte ou Sucata</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LISTA DE ITENS AUDITADOS NESTA SESSÃO */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFD100]" />
            <h3 className="font-black text-base text-gray-900 uppercase tracking-wider">
              Histórico da Sessão ({conferidosList.length} itens)
            </h3>
          </div>

          {conferidosList.length > 0 && (
            <button
              onClick={() => setConferidosList([])}
              className="text-xs text-gray-400 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar Lista
            </button>
          )}
        </div>

        {conferidosList.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-bold text-gray-600">Nenhum item conferido nesta sessão</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Bipe uma etiqueta acima para começar a conferência do inventário.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conferidosList.map((item, index) => (
              <div key={index} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-mono font-bold text-xs text-gray-700">
                    #{conferidosList.length - index}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-black">
                        {item.patrimonio.codigo}
                      </span>
                      <span className="text-xs font-bold text-gray-800 truncate max-w-xs">
                        {item.patrimonio.descricao}
                      </span>
                    </div>
                    {item.observacao && (
                      <p className="text-[11px] text-gray-500 italic mt-0.5">
                        Obs: "{item.observacao}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      item.statusResultado === 'Ativo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.statusResultado === 'Em Manutenção'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.statusResultado}
                  </span>
                  <span className="block text-[10px] text-gray-400 mt-0.5 font-mono">
                    {item.conferidoEm}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
