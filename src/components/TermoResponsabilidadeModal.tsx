import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import JsBarcode from 'jsbarcode';
import { FileText, Printer, X, MessageSquareShare } from 'lucide-react';
import type { Patrimonio } from '../types/patrimonio';
import { enviarTermoDiretoWhatsApp } from '../services/pdfService';


interface TermoResponsabilidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patrimonio: Patrimonio;
}

export const TermoResponsabilidadeModal: React.FC<TermoResponsabilidadeModalProps> = ({
  isOpen,
  onClose,
  patrimonio,
}) => {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const svgBarcodeRef = useRef<SVGSVGElement | null>(null);
  const svgPrintBarcodeRef = useRef<SVGSVGElement | null>(null);

  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const numeroTermo = `TR-${patrimonio.codigo.replace(/[^0-9]/g, '') || '0001'}-${new Date().getFullYear()}`;

  useEffect(() => {
    if (isOpen && patrimonio.codigo) {
      setTimeout(() => {
        if (svgBarcodeRef.current) {
          JsBarcode(svgBarcodeRef.current, patrimonio.codigo, {
            format: 'CODE128',
            lineColor: '#000000',
            width: 1.5,
            height: 35,
            displayValue: false,
            margin: 0,
            background: '#ffffff',
          });
        }
        if (svgPrintBarcodeRef.current) {
          JsBarcode(svgPrintBarcodeRef.current, patrimonio.codigo, {
            format: 'CODE128',
            lineColor: '#000000',
            width: 1.6,
            height: 38,
            displayValue: false,
            margin: 0,
            background: '#ffffff',
          });
        }
      }, 50);
    }
  }, [isOpen, patrimonio.codigo]);

  if (!isOpen) return null;

  const handlePrintPDF = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDirectWhatsAppPDF = async () => {
    setIsSendingWhatsApp(true);
    try {
      await enviarTermoDiretoWhatsApp(patrimonio, whatsAppPhone);
    } catch (err) {
      console.error('Erro ao enviar PDF pelo WhatsApp:', err);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const printRoot = document.getElementById('mp-print-root');

  return (
    <>
      {/* Modal na Tela */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs no-print overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-neutral-200 animate-in fade-in zoom-in duration-150 my-auto max-h-[95vh] flex flex-col">
          {/* Topo do Modal */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFD100] to-[#F59E0B] flex items-center justify-center text-black shadow-md shadow-[#FFD100]/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-neutral-900 leading-tight">
                  Comprovante Oficial / Termo de Cautela
                </h3>
                <p className="text-xs text-neutral-500">
                  Envio direto com PDF para o WhatsApp do colaborador
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 p-2 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Área de Visualização do Termo (Estilo Folha Formal A4) */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* Folha do Comprovante */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-neutral-200 shadow-inner text-neutral-800 font-sans text-xs space-y-5">
              {/* Cabeçalho do Termo */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black text-[#FFD100] font-black text-lg flex items-center justify-center">
                    MP
                  </div>
                  <div>
                    <h2 className="font-black text-base tracking-wider text-black">
                      MP CARGAS LOGÍSTICA & TRANSPORTES
                    </h2>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase">
                      Departamento de Gestão de Patrimônio & Ativos
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-black text-[#FFD100] font-mono font-black text-[10px] px-2.5 py-0.5 rounded uppercase">
                    {numeroTermo}
                  </span>
                  <span className="block text-[10px] text-neutral-500 mt-1 font-medium">
                    Emissão: {dataEmissao} às {horaEmissao}
                  </span>
                </div>
              </div>

              {/* Título Central */}
              <div className="text-center py-1 bg-neutral-100 rounded-lg">
                <h4 className="font-black text-xs uppercase tracking-widest text-neutral-900">
                  TERMO DE RESPONSABILIDADE E CAUTELA DE BENS
                </h4>
              </div>

              {/* Dados do Colaborador / Responsável */}
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Colaborador / Responsável:</span>
                  <span className="font-black text-sm text-neutral-900">{patrimonio.responsavel || 'Não especificado'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Setor / Departamento:</span>
                  <span className="font-bold text-xs text-neutral-900">{patrimonio.setor || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Localização / Base:</span>
                  <span className="font-bold text-xs text-neutral-900">{patrimonio.localizacao || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Status do Bem:</span>
                  <span className="font-bold text-xs text-emerald-700 font-mono">🟢 {patrimonio.status || 'Ativo'}</span>
                </div>
              </div>

              {/* Tabela do Patrimônio */}
              <div className="border border-neutral-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900 text-white text-[10px] font-black uppercase">
                    <tr>
                      <th className="p-2.5">Código</th>
                      <th className="p-2.5">Descrição do Bem</th>
                      <th className="p-2.5">Nº de Série</th>
                      <th className="p-2.5 text-right">Código de Barras</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 font-medium bg-white">
                    <tr>
                      <td className="p-2.5 font-mono font-black text-sm text-black">{patrimonio.codigo}</td>
                      <td className="p-2.5 font-bold text-neutral-900">{patrimonio.descricao}</td>
                      <td className="p-2.5 font-mono text-neutral-700">{patrimonio.numero_serie || '-'}</td>
                      <td className="p-2.5 text-right">
                        <svg ref={svgBarcodeRef} className="max-w-[120px] h-8 inline-block"></svg>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cláusulas e Termo Legal */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-[10px] text-neutral-600 space-y-1 leading-relaxed">
                <p className="font-bold text-neutral-800">Declaração de Recebimento e Guarda:</p>
                <p>
                  1. O colaborador declara ter recebido o equipamento acima em perfeitas condições de uso e funcionamento.
                </p>
                <p>
                  2. Compromete-se a utilizá-lo estritamente para as atividades profissionais da <strong>MP CARGAS</strong>, zelando por sua conservação.
                </p>
                <p>
                  3. Em caso de avaria, extravio ou necessidade de transferência, o colaborador comunicará imediatamente o setor de patrimônio.
                </p>
              </div>

              {/* Campos de Assinatura */}
              <div className="grid grid-cols-2 gap-8 pt-6">
                <div className="text-center">
                  <div className="border-b-2 border-neutral-900 w-full mb-1"></div>
                  <span className="font-bold text-[11px] text-neutral-900 block">{patrimonio.responsavel || 'Assinatura do Colaborador'}</span>
                  <span className="text-[9px] text-neutral-500">Colaborador Responsável</span>
                </div>

                <div className="text-center">
                  <div className="border-b-2 border-neutral-900 w-full mb-1"></div>
                  <span className="font-bold text-[11px] text-neutral-900 block">Gestão de Patrimônio</span>
                  <span className="text-[9px] text-neutral-500">MP CARGAS Logística</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campo de Telefone do WhatsApp */}
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 mb-3 shrink-0">
            <label className="block text-xs font-black uppercase text-emerald-950 mb-1.5 flex items-center gap-1.5">
              <MessageSquareShare className="w-4 h-4 text-emerald-700" />
              <span>Número de WhatsApp do Colaborador / Motorista (com DDD):</span>
            </label>
            <input
              type="tel"
              value={whatsAppPhone}
              onChange={(e) => setWhatsAppPhone(e.target.value)}
              placeholder="Ex: 11999998888 (com DDD)"
              className="w-full px-4 py-2.5 rounded-xl border border-emerald-300 text-sm font-bold bg-white text-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-emerald-800/80 mt-1 font-medium">
              💡 Digite o número com DDD para abrir a conversa direta, ou deixe em branco para escolher nos contatos.
            </p>
          </div>

          {/* Botões de Ação com Envio Direto ao WhatsApp */}
          <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handleDirectWhatsAppPDF}
              disabled={isSendingWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-99 text-white font-black text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-60"
            >
              <MessageSquareShare className="w-5 h-5 text-emerald-100" />
              <span>{isSendingWhatsApp ? 'ENVIANDO...' : 'ENVIAR NO WHATSAPP COM PDF'}</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="bg-neutral-900 hover:bg-black text-[#FFD100] font-black text-xs py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border border-neutral-800"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs py-3.5 px-4 rounded-2xl transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>


      {/* RENDERIZAÇÃO EXCLUSIVA PARA IMPRESSÃO EM FOLHA A4 (via Portal #mp-print-root) */}
      {printRoot &&
        createPortal(
          <div className="w-full bg-white p-8 font-sans text-black" style={{ minHeight: '297mm' }}>
            {/* Cabeçalho A4 */}
            <div className="flex items-start justify-between pb-6 border-b-4 border-black mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-black text-[#FFD100] font-black text-2xl flex items-center justify-center">
                  MP
                </div>
                <div>
                  <h1 className="font-black text-xl tracking-wider text-black">
                    MP CARGAS LOGÍSTICA & TRANSPORTES
                  </h1>
                  <p className="text-xs text-gray-600 font-bold uppercase">
                    Departamento de Gestão de Patrimônio & Ativos
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block bg-black text-white font-mono font-black text-xs px-3 py-1 rounded">
                  {numeroTermo}
                </span>
                <span className="block text-xs text-gray-600 mt-1 font-medium">
                  Emissão: {dataEmissao} às {horaEmissao}
                </span>
              </div>
            </div>

            {/* Título */}
            <div className="text-center py-2 bg-gray-100 rounded-lg mb-6 border border-gray-300">
              <h2 className="font-black text-sm uppercase tracking-widest text-black">
                TERMO DE RESPONSABILIDADE E CAUTELA DE PATRIMÔNIO
              </h2>
            </div>

            {/* Dados do Responsável */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-300 grid grid-cols-2 gap-4 mb-6 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Colaborador / Responsável:</span>
                <span className="font-black text-sm text-black">{patrimonio.responsavel || 'Não informado'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Setor / Departamento:</span>
                <span className="font-bold text-xs text-black">{patrimonio.setor || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Localização / Base Física:</span>
                <span className="font-bold text-xs text-black">{patrimonio.localizacao || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Status Operacional:</span>
                <span className="font-bold text-xs text-black font-mono">{patrimonio.status || 'Ativo'}</span>
              </div>
            </div>

            {/* Tabela do Bem */}
            <div className="border-2 border-black rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-black text-white text-[11px] font-black uppercase">
                  <tr>
                    <th className="p-3">Código do Patrimônio</th>
                    <th className="p-3">Descrição Detalhada</th>
                    <th className="p-3">Número de Série</th>
                    <th className="p-3 text-right">Código de Barras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300 font-medium bg-white">
                  <tr>
                    <td className="p-3 font-mono font-black text-base text-black">{patrimonio.codigo}</td>
                    <td className="p-3 font-bold text-black text-sm">{patrimonio.descricao}</td>
                    <td className="p-3 font-mono text-black">{patrimonio.numero_serie || '-'}</td>
                    <td className="p-3 text-right">
                      <svg ref={svgPrintBarcodeRef} className="max-w-[140px] h-10 inline-block"></svg>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cláusulas Formais */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-300 text-xs text-gray-800 space-y-2 mb-10 leading-relaxed">
              <p className="font-black text-black text-xs uppercase tracking-wide">
                Cláusulas de Compromisso, Guarda e Conservação:
              </p>
              <p>
                <strong>1. Recebimento:</strong> O colaborador identificado acima declara ter recebido o equipamento em perfeitas condições operacionais de conservação e funcionamento.
              </p>
              <p>
                <strong>2. Uso Exclusivo:</strong> O bem patrimonial destina-se única e exclusivamente às atividades e rotinas da <strong>MP CARGAS</strong>.
              </p>
              <p>
                <strong>3. Zelo e Segurança:</strong> O colaborador compromete-se a zelar pela integridade física do bem e comunicar qualquer defeito, avaria ou sinistro de imediato à coordenação.
              </p>
              <p>
                <strong>4. Devolução:</strong> Em caso de férias prolongadas, transferência de base ou rescisão de contrato de trabalho, o bem deverá ser restituído imediatamente ao setor de patrimônio.
              </p>
            </div>

            {/* Assinaturas */}
            <div className="grid grid-cols-2 gap-16 pt-12 mt-auto">
              <div className="text-center">
                <div className="border-b-2 border-black w-full mb-2"></div>
                <span className="font-black text-sm text-black block">{patrimonio.responsavel || 'Assinatura do Colaborador'}</span>
                <span className="text-xs text-gray-600 font-medium">Colaborador Responsável</span>
              </div>

              <div className="text-center">
                <div className="border-b-2 border-black w-full mb-2"></div>
                <span className="font-black text-sm text-black block">Gestão de Ativos & Frota</span>
                <span className="text-xs text-gray-600 font-medium">MP CARGAS Logística</span>
              </div>
            </div>
          </div>,
          printRoot
        )}
    </>
  );
};
