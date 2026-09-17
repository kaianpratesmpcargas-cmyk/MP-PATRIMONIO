import * as XLSX from 'xlsx';
import type { Patrimonio } from '../types/patrimonio';

export interface ExportExcelOptions {
  fileName?: string;
  sheetTitle?: string;
  includeSummaryTab?: boolean;
}

/**
 * Exporta lista de patrimônios para uma planilha profissional do Excel (.xlsx)
 * com cabeçalhos organizados, ajuste de colunas e aba de resumo executivo.
 */
export function exportPatrimoniosToExcel(
  items: Patrimonio[],
  options: ExportExcelOptions = {}
): void {
  if (!items || items.length === 0) {
    throw new Error('Nenhum item disponível para exportar.');
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://mpcargas.vercel.app';

  // 1. DADOS DA TABELA PRINCIPAL (CONTROLE DE PATRIMÔNIO)
  const rows = items.map((item, index) => {
    const dataCadastro = item.created_at
      ? new Date(item.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Não informada';

    const comprovanteUrl = `${baseUrl}/?comprovante=${encodeURIComponent(item.codigo)}`;

    return {
      'Nº': index + 1,
      'Código de Etiqueta': item.codigo,
      'Descrição do Bem': item.descricao,
      'Categoria': item.categoria || 'Geral',
      'Setor / Departamento': item.setor || 'Não especificado',
      'Localização Física': item.localizacao || 'Não especificada',
      'Responsável Atual': item.responsavel || 'Não especificado',
      'Número de Série (S/N)': item.numero_serie || 'N/A',
      'Status Operacional': item.status || 'Ativo',
      'Observações': item.observacoes || '',
      'Data de Cadastro': dataCadastro,
      'Link do Termo / Comprovante': comprovanteUrl,
    };
  });

  const wb = XLSX.utils.book_new();

  // Cria a planilha principal
  const wsMain = XLSX.utils.json_to_sheet(rows);

  // Ajusta larguras de colunas automaticamente
  const colWidths = [
    { wch: 6 },  // Nº
    { wch: 18 }, // Código
    { wch: 36 }, // Descrição
    { wch: 18 }, // Categoria
    { wch: 22 }, // Setor
    { wch: 22 }, // Localização
    { wch: 24 }, // Responsável
    { wch: 20 }, // Número de Série
    { wch: 18 }, // Status
    { wch: 30 }, // Observações
    { wch: 18 }, // Data
    { wch: 45 }, // Link Comprovante
  ];
  wsMain['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsMain, options.sheetTitle || 'Inventário MP CARGAS');

  // 2. ABA DE RESUMO GERENCIAL PARA A DIRETORIA / CHEFIA
  if (options.includeSummaryTab !== false) {
    const setorMap = new Map<
      string,
      { total: number; ativos: number; manutencao: number; baixados: number }
    >();

    items.forEach((item) => {
      const setorNome = (item.setor && item.setor.trim()) || 'Não especificado';
      const curr = setorMap.get(setorNome) || { total: 0, ativos: 0, manutencao: 0, baixados: 0 };
      curr.total += 1;

      const st = (item.status || 'Ativo').toLowerCase();
      if (st.includes('manuten')) {
        curr.manutencao += 1;
      } else if (st.includes('baix') || st.includes('descar')) {
        curr.baixados += 1;
      } else {
        curr.ativos += 1;
      }

      setorMap.set(setorNome, curr);
    });

    const summaryRows = Array.from(setorMap.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([setor, stats]) => ({
        'Setor / Departamento': setor,
        'Total de Itens': stats.total,
        'Itens Ativos': stats.ativos,
        'Em Manutenção': stats.manutencao,
        'Baixados / Inativos': stats.baixados,
      }));

    // Adiciona linha de total geral
    const totalGeral = items.length;
    const totalAtivos = items.filter((i) => (i.status || 'Ativo').toLowerCase() === 'ativo').length;
    const totalManut = items.filter((i) => (i.status || '').toLowerCase().includes('manuten')).length;
    const totalBaixa = items.filter((i) => (i.status || '').toLowerCase().includes('baix')).length;

    summaryRows.push({
      'Setor / Departamento': '>>> TOTAL GERAL MP CARGAS <<<',
      'Total de Itens': totalGeral,
      'Itens Ativos': totalAtivos,
      'Em Manutenção': totalManut,
      'Baixados / Inativos': totalBaixa,
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 32 }, // Setor
      { wch: 16 }, // Total
      { wch: 16 }, // Ativos
      { wch: 18 }, // Em Manutenção
      { wch: 20 }, // Baixados
    ];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Gerencial');
  }

  // 3. NOME DO ARQUIVO E DOWNLOAD
  const cleanDate = new Date().toISOString().slice(0, 10);
  const defaultFileName = `MP-CARGAS-Controle-Patrimonio-${cleanDate}.xlsx`;
  const finalFileName = options.fileName || defaultFileName;

  XLSX.writeFile(wb, finalFileName);
}
