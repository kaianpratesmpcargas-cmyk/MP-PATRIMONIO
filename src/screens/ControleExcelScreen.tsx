import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  FileUp, 
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getAllPatrimonios, createPatrimonio } from '../services/patrimonioService';
import { exportPatrimoniosToExcel } from '../services/excelService';
import type { Patrimonio } from '../types/patrimonio';
import { StatusBadge } from '../components/UIComponents';
import { useToast } from '../components/Toast';

interface ControleExcelScreenProps {
  onBack: () => void;
  onConsultar?: (codigo: string) => void;
}

export const ControleExcelScreen: React.FC<ControleExcelScreenProps> = () => {
  const { showToast } = useToast();
  const [items, setItems] = useState<Patrimonio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetor, setSelectedSetor] = useState('todos');

  // Estados de Importação
  const [importedPreview, setImportedPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getAllPatrimonios(1000);
      setItems(data);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const setoresList = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.setor && item.setor.trim()) {
        set.add(item.setor.trim());
      }
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSetor = selectedSetor === 'todos' || (item.setor || '').trim() === selectedSetor;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.codigo.toLowerCase().includes(term) ||
        item.descricao.toLowerCase().includes(term) ||
        (item.responsavel || '').toLowerCase().includes(term) ||
        (item.setor || '').toLowerCase().includes(term);

      return matchSetor && matchSearch;
    });
  }, [items, selectedSetor, searchTerm]);

  const handleExportAll = () => {
    if (items.length === 0) {
      showToast('Nenhum item para exportar.', 'error');
      return;
    }
    try {
      exportPatrimoniosToExcel(items, {
        fileName: `MP-CARGAS-Controle-Patrimonio-${new Date().toISOString().slice(0, 10)}.xlsx`,
      });
      showToast('✓ Planilha Excel baixada com sucesso!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erro ao exportar planilha.', 'error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          showToast('Nenhum dado encontrado na planilha.', 'error');
          return;
        }

        const errors: string[] = [];
        const validRows: any[] = [];

        data.forEach((row, idx) => {
          const desc = row['Descrição do Bem'] || row['Descricao'] || row['descricao'] || row['Descrição'] || row['Item'] || row['Nome'];
          if (!desc) {
            errors.push(`Linha ${idx + 2}: Descrição não informada.`);
          } else {
            validRows.push({
              descricao: String(desc),
              categoria: row['Categoria'] || row['categoria'] || '',
              setor: row['Setor'] || row['Departamento'] || row['setor'] || '',
              localizacao: row['Localização'] || row['Localizacao'] || row['localizacao'] || '',
              responsavel: row['Responsável'] || row['Responsavel'] || row['responsavel'] || '',
              numero_serie: row['Número de Série'] || row['Numero de Serie'] || row['Serial'] || row['SN'] || '',
              status: row['Status'] || row['status'] || 'Ativo',
            });
          }
        });

        setImportErrors(errors);
        setImportedPreview(validRows);
        showToast(`${validRows.length} registros válidos identificados.`, 'info');
      } catch (err) {
        showToast('Erro ao ler arquivo Excel.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (importedPreview.length === 0) return;
    setIsImporting(true);

    try {
      for (const row of importedPreview) {
        await createPatrimonio({
          codigo: '',
          descricao: row.descricao,
          categoria: row.categoria,
          setor: row.setor,
          localizacao: row.localizacao,
          responsavel: row.responsavel,
          numero_serie: row.numero_serie,
          status: row.status,
        });
      }

      showToast(`✓ ${importedPreview.length} patrimônios importados com sucesso!`, 'success');
      setImportedPreview([]);
      setImportErrors([]);
      loadData();
    } catch (err) {
      showToast('Erro durante importação dos registros.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#171717] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#00A878]" />
            Controle & Relatórios em Excel (.XLSX)
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Geração de planilha padronizada MP CARGAS com aba de dados e resumo executivo por setor.
          </p>
        </div>

        <button
          onClick={handleExportAll}
          className="px-4 py-2.5 bg-[#00A878] hover:bg-[#008f66] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Baixar Planilha Completa ({items.length} itens)</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
          Importar Patrimônios via Planilha
        </h3>

        {importedPreview.length === 0 ? (
          <div className="border-2 border-dashed border-[#E5E7EB] hover:border-[#FFC400] rounded-xl p-6 text-center transition-colors">
            <FileUp className="w-8 h-8 text-[#6B7280] mx-auto mb-2" />
            <p className="text-xs font-bold text-[#171717]">
              Arraste sua planilha aqui ou clique para selecionar
            </p>
            <p className="text-[11px] text-[#6B7280] mt-0.5 mb-3">
              Formatos aceitos: .xlsx, .xls, .csv
            </p>
            <label className="inline-block px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-[#171717] text-xs font-bold rounded-lg cursor-pointer transition-colors">
              <span>Selecionar Arquivo</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#00A878]/10 border border-[#00A878]/20 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#171717]">
                  ✓ {importedPreview.length} registros válidos prontos para importação.
                </p>
                {importErrors.length > 0 && (
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    ⚠ {importErrors.length} linhas foram ignoradas por falta de descrição.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setImportedPreview([]);
                    setImportErrors([]);
                  }}
                  className="px-3 py-1.5 bg-neutral-100 text-xs font-semibold rounded-lg hover:bg-neutral-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-4 py-1.5 bg-[#FFC400] hover:bg-[#F5B800] text-[#111111] text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Importar {importedPreview.length} Registros</span>
                </button>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-[#E5E7EB] rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F7F8] text-[#6B7280]">
                  <tr>
                    <th className="py-2 px-3">Descrição</th>
                    <th className="py-2 px-3">Categoria</th>
                    <th className="py-2 px-3">Setor</th>
                    <th className="py-2 px-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {importedPreview.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td className="py-2 px-3 font-medium text-[#171717]">{row.descricao}</td>
                      <td className="py-2 px-3 text-[#6B7280]">{row.categoria || '—'}</td>
                      <td className="py-2 px-3 text-[#6B7280]">{row.setor || '—'}</td>
                      <td className="py-2 px-3 text-[#6B7280]">{row.responsavel || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
            Visão Geral da Planilha ({filteredItems.length} linhas)
          </h3>

          <div className="flex gap-2">
            <select
              value={selectedSetor}
              onChange={(e) => setSelectedSetor(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-medium bg-white"
            >
              <option value="todos">Todos os Setores</option>
              {setoresList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar dados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1.5 rounded-lg border border-[#E5E7EB] text-xs bg-white"
              />
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F7F8] border-b border-[#E5E7EB] text-[#6B7280] font-semibold">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Setor</th>
                <th className="py-2.5 px-3">Localização</th>
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredItems.slice(0, 50).map((item) => (
                <tr key={item.codigo} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#171717]">{item.codigo}</td>
                  <td className="py-2.5 px-3 font-medium text-[#171717] max-w-[200px] truncate">{item.descricao}</td>
                  <td className="py-2.5 px-3 text-[#6B7280]">{item.setor || '—'}</td>
                  <td className="py-2.5 px-3 text-[#6B7280]">{item.localizacao || '—'}</td>
                  <td className="py-2.5 px-3 text-[#6B7280]">{item.responsavel || '—'}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
