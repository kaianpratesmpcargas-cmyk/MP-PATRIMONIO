import { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { 
  Printer, 
  Download, 
  RotateCcw, 
  ShieldCheck 
} from 'lucide-react';

import { getPatrimonioByCodigo } from '../services/patrimonioService';
import { generateTermoPDF } from '../services/pdfService';
import type { Patrimonio } from '../types/patrimonio';

interface ComprovantePublicoScreenProps {
  codigo: string;
  onGoToApp?: () => void;
}

export const ComprovantePublicoScreen: React.FC<ComprovantePublicoScreenProps> = ({
  codigo,
  onGoToApp,
}) => {
  const [patrimonio, setPatrimonio] = useState<Patrimonio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const svgBarcodeRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    loadData();
  }, [codigo]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getPatrimonioByCodigo(codigo);
      if (data) {
        setPatrimonio(data);
        setTimeout(() => {
          if (svgBarcodeRef.current) {
            JsBarcode(svgBarcodeRef.current, data.codigo, {
              format: 'CODE128',
              lineColor: '#000000',
              width: 1.8,
              height: 40,
              displayValue: false,
              margin: 0,
              background: '#ffffff',
            });
          }
        }, 100);
      } else {
        setErrorMessage('Patrimônio não localizado no sistema.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar comprovante.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!patrimonio) return;
    const { doc, filename } = generateTermoPDF(patrimonio);
    doc.save(filename);
  };

  const handlePrint = () => {
    window.print();
  };

  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const numeroTermo = patrimonio ? `TR-${patrimonio.codigo.replace(/[^0-9]/g, '') || '0001'}-${new Date().getFullYear()}` : '';

  return (
    <div className="min-h-screen bg-[#0F0F12] text-neutral-900 flex flex-col items-center justify-center p-3 sm:p-6 antialiased selection:bg-[#FFD100] selection:text-black">
      {/* Barra Superior / Logo */}
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFD100] to-[#F59E0B] flex items-center justify-center text-black font-black text-lg shadow-lg shadow-[#FFD100]/20">
            MP
          </div>
          <div>
            <span className="font-black text-white text-base tracking-tight block">MP CARGAS</span>
            <span className="text-[10px] text-neutral-400 font-medium leading-none">Comprovante Digital Oficial</span>
          </div>
        </div>

        {onGoToApp && (
          <button
            onClick={onGoToApp}
            className="text-xs font-bold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer border border-neutral-700"
          >
            Acessar Sistema
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center max-w-md w-full shadow-2xl border border-neutral-800">
          <RotateCcw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#FFD100]" />
          <h3 className="font-black text-base text-neutral-900">Carregando Comprovante...</h3>
          <p className="text-xs text-neutral-500 mt-1">Buscando termo de patrimônio no banco central</p>
        </div>
      ) : errorMessage || !patrimonio ? (
        <div className="bg-white rounded-3xl p-8 text-center max-w-md w-full shadow-2xl border border-red-200">
          <h3 className="font-black text-lg text-neutral-900">Comprovante Não Encontrado</h3>
          <p className="text-xs text-neutral-500 mt-1 mb-4">{errorMessage || 'Código inválido.'}</p>
          <button
            onClick={loadData}
            className="bg-black text-white text-xs font-bold py-2.5 px-5 rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-4">
          {/* Badge de Verificação Oficial */}
          <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl flex items-center justify-between gap-2 shadow-lg no-print">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-black text-xs block text-white">DOCUMENTO OFICIAL VERIFICADO</span>
                <span className="text-[10px] text-emerald-300/80">Emitido pelo Departamento de Patrimônio da MP CARGAS</span>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 font-mono font-black text-[10px] px-2 py-0.5 rounded-md border border-emerald-500/30">
              AUTÊNTICO
            </span>
          </div>

          {/* Folha Oficial do Comprovante (A4 Digital) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-2xl text-neutral-800 font-sans text-xs space-y-5">
            {/* Cabeçalho do Termo */}
            <div className="flex items-start justify-between pb-5 border-b-2 border-neutral-900">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-black text-[#FFD100] font-black text-xl flex items-center justify-center shadow-md">
                  MP
                </div>
                <div>
                  <h1 className="font-black text-lg tracking-wider text-black">
                    MP CARGAS LOGÍSTICA & TRANSPORTES
                  </h1>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase">
                    Departamento de Gestão de Patrimônio & Ativos
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block bg-black text-[#FFD100] font-mono font-black text-xs px-3 py-1 rounded-lg uppercase shadow-xs">
                  {numeroTermo}
                </span>
                <span className="block text-[10px] text-neutral-500 mt-1 font-medium">
                  Emissão: {dataEmissao} às {horaEmissao}
                </span>
              </div>
            </div>

            {/* Título Central */}
            <div className="text-center py-2 bg-[#FFD100]/20 border border-[#FFD100]/40 rounded-xl">
              <h2 className="font-black text-xs uppercase tracking-widest text-neutral-900">
                TERMO DE RESPONSABILIDADE E CAUTELA DE PATRIMÔNIO
              </h2>
            </div>

            {/* Dados do Colaborador / Responsável */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Colaborador / Responsável:</span>
                <span className="font-black text-sm text-neutral-900">{patrimonio.responsavel || 'Não especificado'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Setor / Departamento:</span>
                <span className="font-bold text-xs text-neutral-900">{patrimonio.setor || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Localização / Base Física:</span>
                <span className="font-bold text-xs text-neutral-900">{patrimonio.localizacao || '-'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Status Operacional:</span>
                <span className="font-bold text-xs text-emerald-700 font-mono">🟢 {patrimonio.status || 'Ativo'}</span>
              </div>
            </div>

            {/* Tabela do Patrimônio */}
            <div className="border border-neutral-300 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-900 text-white text-[10px] font-black uppercase">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Descrição do Bem</th>
                    <th className="p-3">Nº de Série</th>
                    <th className="p-3 text-right">Código de Barras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 font-medium bg-white">
                  <tr>
                    <td className="p-3 font-mono font-black text-base text-black">{patrimonio.codigo}</td>
                    <td className="p-3 font-bold text-neutral-900 text-sm">{patrimonio.descricao}</td>
                    <td className="p-3 font-mono text-neutral-700">{patrimonio.numero_serie || '-'}</td>
                    <td className="p-3 text-right">
                      <svg ref={svgBarcodeRef} className="max-w-[130px] h-9 inline-block"></svg>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cláusulas e Termo Legal */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-[11px] text-neutral-700 space-y-1.5 leading-relaxed">
              <p className="font-bold text-neutral-900 uppercase text-[10px] tracking-wide">Declaração de Recebimento e Guarda:</p>
              <p>
                <strong>1.</strong> O colaborador declara ter recebido o equipamento acima em perfeitas condições operacionais de uso e funcionamento.
              </p>
              <p>
                <strong>2.</strong> Compromete-se a utilizá-lo estritamente para as atividades profissionais da <strong>MP CARGAS</strong>, zelando por sua guarda e integridade.
              </p>
              <p>
                <strong>3.</strong> Em caso de avaria, extravio ou necessidade de transferência, o colaborador comunicará imediatamente o setor de patrimônio.
              </p>
              <p>
                <strong>4.</strong> Em caso de rescisão ou transferência, o bem deverá ser restituído integralmente ao setor responsável.
              </p>
            </div>

            {/* Campos de Assinatura */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-200">
              <div className="text-center">
                <div className="border-b-2 border-neutral-900 w-full mb-1.5"></div>
                <span className="font-bold text-xs text-neutral-900 block">{patrimonio.responsavel || 'Assinatura do Colaborador'}</span>
                <span className="text-[10px] text-neutral-500">Colaborador Responsável</span>
              </div>

              <div className="text-center">
                <div className="border-b-2 border-neutral-900 w-full mb-1.5"></div>
                <span className="font-bold text-xs text-neutral-900 block">Gestão de Patrimônio</span>
                <span className="text-[10px] text-neutral-500">MP CARGAS Logística</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação Inferiores (Download PDF / Imprimir) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 no-print">
            <button
              onClick={handleDownloadPDF}
              className="bg-gradient-to-r from-[#FFD100] to-[#F59E0B] hover:opacity-95 text-black font-black text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-[#FFD100]/20 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>BAIXAR PDF OFICIAL (A4)</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg border border-neutral-700 transition-all cursor-pointer"
            >
              <Printer className="w-5 h-5 text-[#FFD100]" />
              <span>IMPRIMIR COMPROVANTE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
