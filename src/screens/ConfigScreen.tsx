import React, { useState } from 'react';
import { Save, ArrowLeft, Database } from 'lucide-react';
import { getLabelConfig, saveLabelConfig, resetLabelConfig } from '../services/configService';
import type { LabelConfig } from '../types/config';
import { BarcodeLabel } from '../components/BarcodeLabel';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';
import { useToast } from '../components/Toast';

interface ConfigScreenProps {
  onBack: () => void;
}

export const ConfigScreen: React.FC<ConfigScreenProps> = ({ onBack }) => {
  const { showToast } = useToast();
  const [config, setConfig] = useState<LabelConfig>(() => getLabelConfig());
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  const mockItem = {
    id: 'demo',
    codigo: `${config.codigoPrefixo || 'MP'}-000126`,
    descricao: 'Notebook Dell Latitude 5420 Core i7',
    categoria: 'TI / Informática',
    setor: 'Tecnologia da Informação',
    localizacao: 'Sala 02 - Mesa 03',
    responsavel: 'Carlos Silva',
    numero_serie: 'BR5420X991',
    status: 'Ativo',
  };

  const handleChange = <K extends keyof LabelConfig>(key: K, value: LabelConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveLabelConfig(config);
    showToast('✓ Configurações salvas com sucesso!', 'success');
  };

  const handleReset = () => {
    const defaultCfg = resetLabelConfig();
    setConfig(defaultCfg);
    showToast('Configurações restauradas para o padrão.', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#171717] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao início</span>
      </button>

      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#171717]">
            Configurações & Parâmetros do Sistema
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Ajuste de formato de etiquetas, código de barras, prefixo e banco central.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSupabaseModalOpen(true)}
          className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Database className="w-4 h-4 text-[#6B7280]" />
          <span>Banco Supabase</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#E5E7EB] pb-2">
            Textos e Símbolo da Etiqueta
          </h3>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">
              Símbolo / Badge
            </label>
            <input
              type="text"
              maxLength={6}
              value={config.simboloTexto}
              onChange={(e) => handleChange('simboloTexto', e.target.value.toUpperCase())}
              placeholder="MP"
              className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">
              Nome da Empresa / Título
            </label>
            <input
              type="text"
              value={config.empresaNome}
              onChange={(e) => handleChange('empresaNome', e.target.value)}
              placeholder="MP CARGAS"
              className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">
              Subtítulo
            </label>
            <input
              type="text"
              value={config.subtitulo}
              onChange={(e) => handleChange('subtitulo', e.target.value)}
              placeholder="PATRIMÔNIO"
              className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#171717] mb-1">
              Prefixo do Código
            </label>
            <input
              type="text"
              maxLength={6}
              value={config.codigoPrefixo}
              onChange={(e) => handleChange('codigoPrefixo', e.target.value.toUpperCase())}
              placeholder="MP"
              className="w-32 px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs font-mono font-bold"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-semibold rounded-lg cursor-pointer"
            >
              Restaurar Padrão
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Parâmetros</span>
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-3">
            Pré-visualização em Tempo Real
          </span>
          <BarcodeLabel item={mockItem} customConfig={config} />
        </div>
      </div>

      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};
