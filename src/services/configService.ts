import type { LabelConfig } from '../types/config';
import { DEFAULT_LABEL_CONFIG } from '../types/config';


const STORAGE_KEY = 'mp_label_config';

export function getLabelConfig(): LabelConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_LABEL_CONFIG, ...JSON.parse(stored) };
    }
  } catch (err) {
    console.error('Erro ao ler configuração da etiqueta:', err);
  }
  return DEFAULT_LABEL_CONFIG;
}

export function saveLabelConfig(config: LabelConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Erro ao salvar configuração da etiqueta:', err);
  }
}

export function resetLabelConfig(): LabelConfig {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_LABEL_CONFIG;
}
