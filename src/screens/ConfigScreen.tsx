import { useState } from 'react';
import { Settings, Save, RotateCcw, ArrowLeft, Check, Sliders, Tag, Layout } from 'lucide-react';
import { getLabelConfig, saveLabelConfig, resetLabelConfig } from '../services/configService';
import type { LabelConfig } from '../types/config';
import { BarcodeLabel } from '../components/BarcodeLabel';

interface ConfigScreenProps {
  onBack: () => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ onBack }) => {
  const [config, setConfig] = useState<LabelConfig>(() => getLabelConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = <K extends keyof LabelConfig>(key: K, value: LabelConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveLabelConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    const defaultCfg = resetLabelConfig();
    setConfig(defaultCfg);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Botão Voltar */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-black py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Início
      </button>

      {/* Topo da Tela de Configurações */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFD100] text-black flex items-center justify-center shadow-sm">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Configuração das Etiquetas
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Personalize o símbolo, cabeçalho, textos e formato de impressão
            </p>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-bold animate-in fade-in duration-150">
          <Check className="w-5 h-5 text-emerald-600" />
          Configurações da etiqueta salvas com sucesso!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulário de Configurações (7 colunas) */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-gray-800 font-black text-sm uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[#FFD100]" />
            Textos e Símbolo do Cabeçalho
          </div>

          {/* Símbolo / Logo */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-800 mb-1.5">
              Símbolo / Badge (Padrão: MP)
            </label>
            <input
              type="text"
              maxLength={6}
              value={config.simboloTexto}
              onChange={(e) => handleChange('simboloTexto', e.target.value.toUpperCase())}
              placeholder="MP"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50 font-bold"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Símbolo destacado dentro do retângulo branco no topo esquerdo da etiqueta.
            </p>
          </div>

          {/* Nome da Empresa */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-800 mb-1.5">
              Nome da Empresa / Título
            </label>
            <input
              type="text"
              value={config.empresaNome}
              onChange={(e) => handleChange('empresaNome', e.target.value.toUpperCase())}
              placeholder="MP CARGAS"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50 font-bold"
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-800 mb-1.5">
              Rótulo / Subtítulo da Direita
            </label>
            <input
              type="text"
              value={config.subtitulo}
              onChange={(e) => handleChange('subtitulo', e.target.value.toUpperCase())}
              placeholder="PATRIMÔNIO"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50 font-bold"
            />
          </div>

          {/* Prefixo do Código */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-800 mb-1.5">
              Prefixo dos Códigos Gerados (Padrão: MP)
            </label>
            <input
              type="text"
              maxLength={8}
              value={config.codigoPrefixo}
              onChange={(e) => handleChange('codigoPrefixo', e.target.value.toUpperCase())}
              placeholder="MP"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-black text-sm bg-gray-50/50 font-mono font-bold"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Os novos patrimônios serão gerados como <strong>{config.codigoPrefixo || 'MP'}-000001</strong>, <strong>{config.codigoPrefixo || 'MP'}-000002</strong>, etc.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 pb-2 border-b border-gray-100 text-gray-800 font-black text-sm uppercase tracking-wider">
            <Layout className="w-4 h-4 text-[#FFD100]" />
            Opções de Exibição e Impressão
          </div>


          {/* Mostrar Setor e Localização */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-800 block">
                Exibir Setor e Localização
              </span>
              <span className="text-[11px] text-gray-500">
                Mostra o setor e sala abaixo da descrição na etiqueta
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.mostrarSetorLocal}
              onChange={(e) => handleChange('mostrarSetorLocal', e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>

          {/* Mostrar Linha de Corte */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-800 block">
                Linha de Corte com Tesoura (✂)
              </span>
              <span className="text-[11px] text-gray-500">
                Guia tracejada para recortar em folhas sulfite A4 comuns
              </span>
            </div>
            <input
              type="checkbox"
              checked={config.mostrarLinhaCorte}
              onChange={(e) => handleChange('mostrarLinhaCorte', e.target.checked)}
              className="w-5 h-5 accent-black cursor-pointer"
            />
          </div>

          {/* Tamanho da Etiqueta */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-gray-800 mb-1.5">
              Dimensões da Etiqueta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('tamanho', 'padrao')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  config.tamanho === 'padrao'
                    ? 'border-black bg-black text-[#FFD100]'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Padrão (85 x 48 mm)
                <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                  Ideal para A4 e Geral
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleChange('tamanho', 'compacto')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  config.tamanho === 'compacto'
                    ? 'border-black bg-black text-[#FFD100]'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Compacto (70 x 40 mm)
                <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                  Itens menores / Térmica
                </span>
              </button>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="flex-1 bg-[#FFD100] hover:bg-[#E5BC00] active:scale-[0.99] text-black font-black text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Save className="w-5 h-5" />
              SALVAR CONFIGURAÇÕES
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrão
            </button>
          </div>
        </form>

        {/* Pré-visualização em Tempo Real (5 colunas) */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8 flex flex-col items-center">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-100 w-full mb-6 text-gray-800 font-black text-sm uppercase tracking-wider">
            <Tag className="w-4 h-4 text-[#FFD100]" />
            Pré-visualização em Tempo Real
          </div>

          <div className="w-full bg-gray-100 p-6 rounded-2xl border border-gray-300 flex flex-col items-center justify-center min-h-[260px]">
            <BarcodeLabel
              codigo={`${config.codigoPrefixo || 'MP'}-000001`}
              descricao="NOTEBOOK DELL LATITUDE"
              setor="ADMINISTRATIVO"
              localizacao="SALA 02"
              configOverride={config}
            />

          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 w-full">
            <p className="font-bold mb-0.5">Dica de Impressão:</p>
            <p>
              As alterações salvas aqui serão aplicadas automaticamente em todos os novos cadastros, consultas e reimpressões de etiquetas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
