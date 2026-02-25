import JSZip from 'jszip';
import { exportCSVExpert } from './exportCSV';

function download(blob, name, type) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([blob], { type })),
    download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

function buildCSVString(invoices) {
  const headers = [
    'N° Facture', 'Fournisseur', 'Date facture', 'Date échéance',
    'Montant HT', 'TVA (%)', 'Montant TVA', 'Montant TTC',
    'Statut', 'Fréquence', 'Catégorie', 'Anomalie', 'Notes',
  ];
  const fmtNum = n => n != null ? String(n).replace('.', ',') : '';
  const rows = invoices.map(i => [
    i.invoice_number ?? '', i.provider ?? '',
    i.invoice_date ?? '', i.due_date ?? '',
    fmtNum(i.amount_ht), fmtNum(i.tax_rate),
    fmtNum(i.tax), fmtNum(i.amount_ttc),
    i.status ?? 'recu', i.frequency ?? '',
    i.category ?? '', i.has_anomaly ? 'OUI' : 'NON',
    i.notes ?? '',
  ]);
  return [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
}

export async function exportZIP(invoices, supabaseClient, folderName = 'vigie-export') {
  const zip = new JSZip();
  const folder = zip.folder(folderName);

  // Index CSV
  folder.file('index.csv', '\uFEFF' + buildCSVString(invoices));

  // PDF depuis Supabase Storage
  for (const inv of invoices) {
    if (!inv.storage_path) continue;
    try {
      const { data } = await supabaseClient.storage
        .from('invoices')
        .download(inv.storage_path);
      const safeName = `${inv.provider ?? 'facture'}_${inv.invoice_date ?? ''}.pdf`
        .replace(/[^a-zA-Z0-9_.\-]/g, '_');
      folder.file(safeName, data);
    } catch {
      // fichier manquant — on continue
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  download(blob, `${folderName}.zip`, 'application/zip');
}