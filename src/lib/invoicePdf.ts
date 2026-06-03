// Génère un PDF facture/devis avec jsPDF + autoTable + QR vérification
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { EnterpriseInvoice } from '@/hooks/useEnterpriseCRM';
import type { EnterpriseProfile } from '@/hooks/useEnterprise';
import { amountInWordsFr } from './numberToWordsFr';

const TYPE_TITLE: Record<string, string> = {
  invoice: 'FACTURE',
  quote: 'DEVIS',
  credit_note: 'AVOIR',
};

const TYPE_LABEL_FR: Record<string, string> = {
  invoice: 'facture',
  quote: 'devis',
  credit_note: 'avoir',
};

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getVerifyUrl(invoiceId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ujamaan.com';
  return `${origin}/verifier-facture/${invoiceId}`;
}

export async function generateInvoicePdf(
  inv: EnterpriseInvoice,
  enterprise: EnterpriseProfile,
  clientInfo?: { name?: string; email?: string | null; phone?: string | null; address?: string | null }
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 15;

  // Logo
  if (enterprise.logo_url) {
    const dataUrl = await loadImageAsDataUrl(enterprise.logo_url);
    if (dataUrl) {
      try { doc.addImage(dataUrl, 'PNG', 14, y, 25, 25); } catch { /* ignore */ }
    }
  }

  // Entreprise (droite)
  doc.setFontSize(14).setFont('helvetica', 'bold');
  doc.text(enterprise.name, pageW - 14, y + 5, { align: 'right' });
  doc.setFontSize(9).setFont('helvetica', 'normal');
  const entLines = [
    enterprise.address,
    [enterprise.city, enterprise.island].filter(Boolean).join(', '),
    enterprise.phone ? `Tél : ${enterprise.phone}` : null,
    enterprise.email,
    enterprise.nif ? `NIF : ${enterprise.nif}` : null,
    enterprise.rccm ? `RCCM : ${enterprise.rccm}` : null,
  ].filter(Boolean) as string[];
  entLines.forEach((line, i) => {
    doc.text(line, pageW - 14, y + 11 + i * 4, { align: 'right' });
  });

  y += 40;

  // Titre + numéro
  doc.setFontSize(18).setFont('helvetica', 'bold');
  doc.setTextColor(16, 122, 87);
  doc.text(`${TYPE_TITLE[inv.type] || 'DOCUMENT'} N° ${inv.invoice_number}`, 14, y);
  doc.setTextColor(0, 0, 0);
  y += 6;
  doc.setFontSize(9).setFont('helvetica', 'normal');
  doc.text(`Date d'émission : ${new Date(inv.issue_date).toLocaleDateString('fr-FR')}`, 14, y);
  if (inv.due_date) {
    doc.text(`Échéance : ${new Date(inv.due_date).toLocaleDateString('fr-FR')}`, 80, y);
  }
  y += 8;

  // Client
  if (clientInfo?.name) {
    doc.setFontSize(10).setFont('helvetica', 'bold');
    doc.text('Facturé à :', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(clientInfo.name, 14, y);
    if (clientInfo.address) { y += 4; doc.text(clientInfo.address, 14, y); }
    if (clientInfo.phone) { y += 4; doc.text(`Tél : ${clientInfo.phone}`, 14, y); }
    if (clientInfo.email) { y += 4; doc.text(clientInfo.email, 14, y); }
    y += 6;
  }

  // Articles
  const items = Array.isArray(inv.items) ? inv.items : [];
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qté', 'PU', 'Total']],
    body: items.map(it => [
      it.description,
      String(it.quantity),
      Number(it.unit_price).toLocaleString('fr-FR'),
      `${Number(it.total).toLocaleString('fr-FR')} ${inv.currency}`,
    ]),
    headStyles: { fillColor: [16, 122, 87], textColor: 255, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // Totaux
  const finalY = (doc as any).lastAutoTable.finalY + 6;
  const xRight = pageW - 14;
  doc.setFontSize(10).setFont('helvetica', 'normal');
  doc.text(`Sous-total : ${Number(inv.subtotal).toLocaleString('fr-FR')} ${inv.currency}`, xRight, finalY, { align: 'right' });
  if (Number(inv.tax_rate) > 0) {
    doc.text(`TVA (${inv.tax_rate}%) : ${Number(inv.tax_amount).toLocaleString('fr-FR')} ${inv.currency}`, xRight, finalY + 5, { align: 'right' });
  }
  doc.setFontSize(12).setFont('helvetica', 'bold');
  doc.setTextColor(16, 122, 87);
  doc.text(`TOTAL : ${Number(inv.total).toLocaleString('fr-FR')} ${inv.currency}`, xRight, finalY + 12, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Montant en lettres
  let cursorY = finalY + 22;
  const docLabel = TYPE_LABEL_FR[inv.type] || 'facture';
  const wordsAmount = amountInWordsFr(Number(inv.total), inv.currency);
  doc.setFontSize(9).setFont('helvetica', 'bold');
  const fullPhrase = `Arrêtée la présente ${docLabel} à la somme de : ${wordsAmount} (${Number(inv.total).toLocaleString('fr-FR')} ${inv.currency}).`;
  const phraseLines = doc.splitTextToSize(fullPhrase, pageW - 28);
  doc.text(phraseLines, 14, cursorY);
  cursorY += phraseLines.length * 4 + 4;

  // Notes
  if (inv.notes) {
    doc.setFontSize(9).setFont('helvetica', 'italic');
    const split = doc.splitTextToSize(`Notes : ${inv.notes}`, pageW - 28);
    doc.text(split, 14, cursorY);
    cursorY += split.length * 4 + 2;
  }

  // QR code de vérification (bas-gauche)
  const qrSize = 28;
  const qrY = pageH - qrSize - 18;
  try {
    const verifyUrl = getVerifyUrl(inv.id);
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 200 });
    doc.addImage(qrDataUrl, 'PNG', 14, qrY, qrSize, qrSize);
    doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(80);
    doc.text('Vérifier en ligne', 14 + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    doc.text(verifyUrl.replace(/^https?:\/\//, ''), 14 + qrSize / 2, qrY + qrSize + 6, { align: 'center' });
  } catch { /* ignore */ }

  // Pied de page (bas-droite + bas-centre)
  doc.setFontSize(8).setFont('helvetica', 'italic').setTextColor(100);
  const footerLines = [
    enterprise.name + (enterprise.rccm ? ` • RCCM : ${enterprise.rccm}` : '') + (enterprise.nif ? ` • NIF : ${enterprise.nif}` : ''),
    [enterprise.address, enterprise.city, enterprise.island].filter(Boolean).join(' • '),
    [enterprise.phone, enterprise.email, enterprise.website].filter(Boolean).join(' • '),
  ].filter(s => s && s.length > 0);
  footerLines.forEach((line, i) => {
    doc.text(line, pageW / 2, pageH - 16 + i * 3.5, { align: 'center' });
  });
  doc.setFontSize(7).setTextColor(140);
  doc.text(
    `Document généré via Ujamaan • ${new Date().toLocaleString('fr-FR')}`,
    pageW / 2,
    pageH - 5,
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);

  return doc;
}

export async function downloadInvoicePdf(
  inv: EnterpriseInvoice,
  enterprise: EnterpriseProfile,
  clientInfo?: Parameters<typeof generateInvoicePdf>[2]
) {
  const doc = await generateInvoicePdf(inv, enterprise, clientInfo);
  doc.save(`${inv.invoice_number}.pdf`);
}

export async function invoicePdfBase64(
  inv: EnterpriseInvoice,
  enterprise: EnterpriseProfile,
  clientInfo?: Parameters<typeof generateInvoicePdf>[2]
): Promise<string> {
  const doc = await generateInvoicePdf(inv, enterprise, clientInfo);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
}
