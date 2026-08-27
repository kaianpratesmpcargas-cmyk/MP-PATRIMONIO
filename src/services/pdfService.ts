import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import type { Patrimonio } from '../types/patrimonio';
import { generateWhatsAppComprovanteLink } from './patrimonioService';

/**
 * Gera o documento PDF oficial em alta definição (A4) do Termo de Responsabilidade
 */
export function generateTermoPDF(patrimonio: Patrimonio): { doc: jsPDF; blob: Blob; filename: string } {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const horaHoje = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const numeroTermo = `TR-${patrimonio.codigo.replace(/[^0-9]/g, '') || '0001'}-${new Date().getFullYear()}`;
  const filename = `Comprovante-${patrimonio.codigo}.pdf`;

  // === 1. TOPO & LOGOTIPO MP CARGAS ===
  // Caixa do Logotipo "MP"
  doc.setFillColor(17, 17, 17); // Preto
  doc.roundedRect(15, 15, 16, 16, 3, 3, 'F');
  doc.setTextColor(255, 209, 0); // Amarelo MP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MP', 18.5, 26);

  // Nome da Empresa & Departamento
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(14);
  doc.text('MP CARGAS LOGÍSTICA & TRANSPORTES', 35, 21);

  doc.setTextColor(100, 116, 139); // Cinza
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('DEPARTAMENTO DE GESTÃO DE PATRIMÔNIO & ATIVOS', 35, 27);

  // Badge do Número do Termo no Topo Direito
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(140, 15, 55, 16, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(140, 15, 55, 16, 2, 2, 'S');

  doc.setTextColor(17, 17, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(numeroTermo, 145, 21);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Emissão: ${dataHoje} às ${horaHoje}`, 145, 27);

  // Linha divisória preta
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.8);
  doc.line(15, 35, 195, 35);

  // === 2. TÍTULO DO DOCUMENTO ===
  doc.setFillColor(255, 209, 0); // Amarelo MP
  doc.roundedRect(15, 39, 180, 8, 1.5, 1.5, 'F');
  doc.setTextColor(17, 17, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TERMO DE RESPONSABILIDADE E CAUTELA DE PATRIMÔNIO', 105, 44.5, { align: 'center' });

  // === 3. QUADRO: DADOS DO RESPONSÁVEL ===
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 51, 180, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, 51, 180, 28, 2, 2, 'S');

  // Coluna 1
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text('COLABORADOR / RESPONSÁVEL:', 20, 58);
  doc.setTextColor(17, 17, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(patrimonio.responsavel || 'Não especificado', 20, 64);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('SETOR / DEPARTAMENTO:', 20, 71);
  doc.setTextColor(17, 17, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(patrimonio.setor || 'Não especificado', 20, 76);

  // Coluna 2
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('LOCALIZAÇÃO / BASE FÍSICA:', 110, 58);
  doc.setTextColor(17, 17, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(patrimonio.localizacao || 'Não especificado', 110, 64);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('STATUS DO BEM:', 110, 71);
  doc.setTextColor(16, 185, 129); // Verde
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`[OK] ${patrimonio.status || 'Ativo'}`, 110, 76);

  // === 4. QUADRO: ESPECIFICAÇÃO DO BEM PATRIMONIAL ===
  // Cabeçalho da tabela do item
  doc.setFillColor(17, 17, 17);
  doc.roundedRect(15, 84, 180, 7, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CÓDIGO', 20, 88.5);
  doc.text('DESCRIÇÃO DO PATRIMÔNIO', 55, 88.5);
  doc.text('Nº DE SÉRIE', 125, 88.5);
  doc.text('CÓDIGO DE BARRAS', 160, 88.5);

  // Linha da tabela
  doc.setFillColor(255, 255, 255);
  doc.rect(15, 91, 180, 22, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(15, 91, 180, 22, 'S');

  // Código
  doc.setTextColor(17, 17, 17);
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.text(patrimonio.codigo, 20, 102);

  // Descrição
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const splitDesc = doc.splitTextToSize(patrimonio.descricao, 65);
  doc.text(splitDesc, 55, 98);

  // Nº de Série
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(patrimonio.numero_serie || '-', 125, 102);

  // Gerar Imagem do Código de Barras no Canvas e injetar no PDF
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, patrimonio.codigo, {
      format: 'CODE128',
      lineColor: '#000000',
      width: 2,
      height: 40,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
    });
    const barcodeDataUrl = canvas.toDataURL('image/png');
    doc.addImage(barcodeDataUrl, 'PNG', 158, 94, 32, 14);
  } catch (err) {
    console.warn('Erro ao desenhar código de barras no PDF:', err);
  }

  // === 5. CLÁUSULAS LEGAIS DE RESPONSABILIDADE & GUARDA ===
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 118, 180, 52, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, 118, 180, 52, 2, 2, 'S');

  doc.setTextColor(17, 17, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('TERMO DE COMPROMISSO, GUARDA E CONSERVAÇÃO:', 20, 125);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const clausulas = [
    '1. O colaborador identificado declara ter recebido o equipamento acima em perfeitas condições de funcionamento e conservação.',
    '2. O bem destina-se única e exclusivamente às atividades profissionais da MP CARGAS, cabendo ao colaborador o dever de zelo.',
    '3. Em caso de defeito, avaria, extravio ou necessidade de manutenção, o colaborador comunicará imediatamente o setor responsável.',
    '4. Em caso de rescisão de contrato, férias prolongadas ou transferência de base, o bem deverá ser restituído imediatamente.',
  ];

  let yClausula = 132;
  clausulas.forEach((txt) => {
    const lines = doc.splitTextToSize(txt, 170);
    doc.text(lines, 20, yClausula);
    yClausula += lines.length * 4 + 1.5;
  });

  // === 6. ASSINATURAS FORMAIS ===
  const yAssinatura = 195;

  // Linha 1: Colaborador
  doc.setDrawColor(17, 17, 17);
  doc.setLineWidth(0.5);
  doc.line(25, yAssinatura, 90, yAssinatura);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 17, 17);
  doc.text(patrimonio.responsavel || 'Assinatura do Colaborador', 57.5, yAssinatura + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Colaborador Responsável', 57.5, yAssinatura + 9, { align: 'center' });

  // Linha 2: MP CARGAS
  doc.line(120, yAssinatura, 185, yAssinatura);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(17, 17, 17);
  doc.text('Gestão de Patrimônio & Ativos', 152.5, yAssinatura + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('MP CARGAS Logística & Transportes', 152.5, yAssinatura + 9, { align: 'center' });

  // Rodapé do Documento
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado automaticamente pelo Sistema de Gestão de Patrimônio MP CARGAS.', 105, 215, { align: 'center' });

  const blob = doc.output('blob');
  return { doc, blob, filename };
}

/**
 * Envia o Termo Oficial em PDF DIRETO PARA O WHATSAPP em 1 clique:
 * - Em Celulares (iPhone e Android): Abre o WhatsApp nativo com o arquivo PDF já anexado via Web Share API!
 * - Em Computadores (Desktop): Faz o download imediato do PDF e abre a conversa do WhatsApp Web com os dados e confirmação!
 */
export async function enviarTermoDiretoWhatsApp(
  patrimonio: Patrimonio,
  telefoneDestinatario?: string
): Promise<{ success: boolean; method: 'native_share' | 'download_and_whatsapp' }> {
  const { doc, blob, filename } = generateTermoPDF(patrimonio);
  const pdfFile = new File([blob], filename, { type: 'application/pdf' });

  const mensagemTexto = `Olá ${patrimonio.responsavel ? `*${patrimonio.responsavel}*` : ''}, segue o *Termo Oficial de Cautela e Entrega de Patrimônio* do item *${patrimonio.codigo}* (*${patrimonio.descricao}*) emitido pela *MP CARGAS*.`;

  // 1. TENTA COMPARTILHAR DIRETO O ARQUIVO PDF NO WHATSAPP (iOS / Android / PWA)
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: `Comprovante MP CARGAS - ${patrimonio.codigo}`,
        text: mensagemTexto,
        files: [pdfFile],
      });
      return { success: true, method: 'native_share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Usuário apenas fechou a janela de compartilhamento
        return { success: false, method: 'native_share' };
      }
      console.warn('Falha no compartilhamento nativo de arquivo, usando fallback WhatsApp:', err);
    }
  }

  // 2. FALLBACK PARA COMPUTADOR / DESKTOP:
  // Salva o PDF no computador e abre o WhatsApp Web com a mensagem pronta
  doc.save(filename);
  const linkWhatsApp = generateWhatsAppComprovanteLink(patrimonio, telefoneDestinatario);
  window.open(linkWhatsApp, '_blank');

  return { success: true, method: 'download_and_whatsapp' };
}
