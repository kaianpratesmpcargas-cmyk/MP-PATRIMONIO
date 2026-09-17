import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  Search, 
  Camera, 
  Check, 
  AlertCircle
} from 'lucide-react';
import { 
  getAllPatrimonios, 
  updatePatrimonioConferencia,
  formatCodeInput 
} from '../services/patrimonioService';
import type { Patrimonio } from '../types/patrimonio';
import { CameraScannerModal } from '../components/CameraScannerModal';
import { useToast } from '../components/Toast';

interface ConferenciaScreenProps {
  onBack: () => void;
}

interface ItemAuditoria {
  patrimonio: Patrimonio;
  statusConferencia: 'pendente' | 'conferido' | 'divergencia';
  observacaoConferencia?: string;
  conferidoEm?: string;
}

export const ConferenciaScreen: React.FC<ConferenciaScreenProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Etapa 1: Filtros de Escopo
  const [allSetores, setAllSetores] = useState<string[]>([]);
  const [selectedSetor, setSelectedSetor] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState(false);

  // Etapa 2: Itens em Auditoria
  const [itensAuditoria, setItensAuditoria] = useState<ItemAuditoria[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSetores();
  }, []);

  const loadSetores = async () => {
    setIsLoading(true);
    try {
      const items = await getAllPatrimonios(1000);
      const uniqueSetores = Array.from(
        new Set(items.map((i) => i.setor?.trim()).filter(Boolean) as string[])
      );
      setAllSetores(uniqueSetores);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConferencia = async () => {
    setIsLoading(true);
    try {
      const all = await getAllPatrimonios(1000);
      const filtered = selectedSetor === 'Todos'
        ? all
        : all.filter((i) => (i.setor || '').toLowerCase() === selectedSetor.toLowerCase());

      const mapped: ItemAuditoria[] = filtered.map((p) => ({
        patrimonio: p,
        statusConferencia: 'pendente',
      }));

      setItensAuditoria(mapped);
      setStep(2);
      showToast(`Conferência iniciada com ${mapped.length} patrimônios.`, 'info');
    } catch (e) {
      showToast('Erro ao iniciar conferência.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiparCodigo = async (codigoBipado: string) => {
    const raw = codigoBipado.trim();
    if (!raw) return;

    const formatted = formatCodeInput(raw);
    const index = itensAuditoria.findIndex(
      (item) => item.patrimonio.codigo.toUpperCase() === formatted || item.patrimonio.codigo.toUpperCase() === raw.toUpperCase()
    );

    if (index === -1) {
      showToast(`Patrimônio ${formatted} não pertence ao escopo desta auditoria.`, 'error');
      setSearchInput('');
      return;
    }

    try {
      const itemOriginal = itensAuditoria[index].patrimonio;
      await updatePatrimonioConferencia(itemOriginal.codigo, {
        status: 'Ativo',
        condicao: 'Bom / Em uso',
        observacoes: 'Auditado via Conferência',
      });

      const updatedList = [...itensAuditoria];
      updatedList[index] = {
        ...updatedList[index],
        statusConferencia: 'conferido',
        conferidoEm: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      setItensAuditoria(updatedList);
      showToast(`✓ ${itemOriginal.codigo} (${itemOriginal.descricao}) conferido!`, 'success');
      setSearchInput('');
    } catch (err) {
      showToast('Erro ao registrar conferência.', 'error');
    }
  };

  const handleMarcarDivergencia = async (item: ItemAuditoria) => {
    try {
      await updatePatrimonioConferencia(item.patrimonio.codigo, {
        status: 'Em Manutenção',
        condicao: 'Avariado / Divergência',
        observacoes: 'Avaria ou divergência apontada durante auditoria.',
      });

      const updatedList = itensAuditoria.map((it) =>
        it.patrimonio.codigo === item.patrimonio.codigo
          ? { ...it, statusConferencia: 'divergencia' as const, conferidoEm: new Date().toLocaleTimeString('pt-BR') }
          : it
      );
      setItensAuditoria(updatedList);
      showToast(`Aviso de avaria registrado para ${item.patrimonio.codigo}.`, 'info');
    } catch {
      showToast('Erro ao registrar divergência.', 'error');
    }
  };

  const totalItens = itensAuditoria.length;
  const conferidos = itensAuditoria.filter((i) => i.statusConferencia === 'conferido').length;
  const divergencias = itensAuditoria.filter((i) => i.statusConferencia === 'divergencia').length;
  const pendentes = itensAuditoria.filter((i) => i.statusConferencia === 'pendente').length;
  const progressoPercent = totalItens > 0 ? Math.round(((conferidos + divergencias) / totalItens) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {step === 1 && (
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-[#171717]">
              Nova Conferência & Auditoria de Patrimônio
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Selecione o setor ou realize a auditoria geral do inventário para validar localização e integridade dos bens.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-[#171717]">
              Escopo da Auditoria
            </label>
            <select
              value={selectedSetor}
              onChange={(e) => setSelectedSetor(e.target.value)}
              className="w-full sm:w-80 px-3 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm font-medium bg-white"
            >
              <option value="Todos">Todos os Patrimônios (Inventário Geral)</option>
              {allSetores.map((setor) => (
                <option key={setor} value={setor}>
                  Setor: {setor}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold cursor-pointer"
            >
              Voltar
            </button>

            <button
              onClick={handleStartConferencia}
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Iniciar Conferência</span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Auditoria em Andamento
                </span>
                <h2 className="text-base font-bold text-[#171717]">
                  Conferência — {selectedSetor === 'Todos' ? 'Inventário Geral' : selectedSetor}
                </h2>
              </div>

              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
              >
                Concluir Conferência →
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#171717]">Progresso da Auditoria</span>
                <span className="font-bold text-[#171717]">{progressoPercent}%</span>
              </div>
              <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#00A878] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressoPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#E5E7EB]">
              <div className="p-2.5 rounded-lg bg-[#00A878]/10 text-center">
                <span className="text-xs text-[#6B7280] block font-semibold">✓ Conferidos</span>
                <span className="text-lg font-bold text-[#00A878]">{conferidos}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-neutral-100 text-center">
                <span className="text-xs text-[#6B7280] block font-semibold">○ Pendentes</span>
                <span className="text-lg font-bold text-[#171717]">{pendentes}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 text-center">
                <span className="text-xs text-amber-800 block font-semibold">⚠ Divergências</span>
                <span className="text-lg font-bold text-amber-600">{divergencias}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder="Bipar código com leitor ou digitar (ex: MP-000001)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleBiparCodigo(searchInput);
                  }
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#FFC400] text-xs sm:text-sm font-mono bg-white"
              />
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleBiparCodigo(searchInput)}
                className="px-4 py-2 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Conferir
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#FFC400]" />
                <span>Bipar Câmera</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
            <div className="p-3.5 border-b border-[#E5E7EB] bg-[#F7F7F8]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Itens a Conferir ({itensAuditoria.length})
              </span>
            </div>

            <div className="divide-y divide-[#E5E7EB] max-h-[400px] overflow-y-auto">
              {itensAuditoria.map((item) => {
                const isConferido = item.statusConferencia === 'conferido';
                const isDivergente = item.statusConferencia === 'divergencia';

                return (
                  <div
                    key={item.patrimonio.codigo}
                    className={`p-3.5 flex items-center justify-between gap-3 text-xs transition-colors ${
                      isConferido ? 'bg-[#00A878]/5' : isDivergente ? 'bg-amber-50/50' : 'hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono font-bold text-[#171717]">{item.patrimonio.codigo}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#171717] truncate">{item.patrimonio.descricao}</p>
                        <p className="text-[11px] text-[#6B7280] truncate">
                          {[item.patrimonio.setor, item.patrimonio.localizacao, item.patrimonio.responsavel].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isConferido && (
                        <span className="inline-flex items-center gap-1 text-[#00A878] font-bold text-xs">
                          <Check className="w-3.5 h-3.5" /> Conferido
                        </span>
                      )}

                      {isDivergente && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> Avariado
                        </span>
                      )}

                      {item.statusConferencia === 'pendente' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleBiparCodigo(item.patrimonio.codigo)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-[#00A878] hover:text-white text-[#171717] rounded font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            ✓ Validar
                          </button>
                          <button
                            onClick={() => handleMarcarDivergencia(item)}
                            className="px-2 py-1 bg-neutral-100 hover:bg-amber-100 text-amber-700 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                            title="Registrar Avaria / Não localizado"
                          >
                            ⚠
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-6 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-[#00A878]/10 text-[#00A878] flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#171717]">
              Conferência Concluída
            </h2>
            <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1">
              Todos os patrimônios do escopo foram auditados e os registros de conformidade e avarias foram sincronizados.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto py-2">
            <div className="p-3 bg-neutral-50 rounded-lg border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block font-semibold">Total</span>
              <span className="text-base font-bold text-[#171717]">{totalItens}</span>
            </div>
            <div className="p-3 bg-[#00A878]/10 rounded-lg border border-[#00A878]/20">
              <span className="text-[11px] text-[#00A878] block font-semibold">Encontrados</span>
              <span className="text-base font-bold text-[#00A878]">{conferidos}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="text-[11px] text-amber-800 block font-semibold">Divergências</span>
              <span className="text-base font-bold text-amber-700">{divergencias}</span>
            </div>
            <div className="p-3 bg-neutral-100 rounded-lg border border-[#E5E7EB]">
              <span className="text-[11px] text-[#6B7280] block font-semibold">Pendentes</span>
              <span className="text-base font-bold text-[#6B7280]">{pendentes}</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4 border-t border-[#E5E7EB]">
            <button
              onClick={() => {
                setStep(1);
                setItensAuditoria([]);
              }}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Nova Conferência
            </button>

            <button
              onClick={onBack}
              className="px-5 py-2 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )}

      {isCameraOpen && (
        <CameraScannerModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onScanSuccess={(code) => {
            setIsCameraOpen(false);
            handleBiparCodigo(code);
          }}
        />
      )}
    </div>
  );
};
