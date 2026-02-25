function fmtNum(n) {
  return n != null ? String(n).replace('.', ',') : '';
}

function download(content, name, type) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type })),
    download: name,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportCSVExpert(invoices, filename = 'vigie-export') {
  const headers = [
    'N° Facture', 'Fournisseur', 'Date facture', 'Date échéance',
    'Montant HT', 'TVA (%)', 'Montant TVA', 'Montant TTC',
    'Statut', 'Fréquence', 'Catégorie', 'Anomalie', 'Notes',
  ];

  const rows = invoices.map(i => [
    i.invoice_number ?? '',
    i.provider ?? '',
    i.invoice_date ?? '',
    i.due_date ?? '',
    fmtNum(i.amount_ht),
    fmtNum(i.tax_rate),
    fmtNum(i.tax),
    fmtNum(i.amount_ttc),
    i.status ?? 'recu',
    i.frequency ?? '',
    i.category ?? '',
    i.has_anomaly ? 'OUI' : 'NON',
    i.notes ?? '',
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  download('\uFEFF' + csv, `${filename}.csv`, 'text/csv;charset=utf-8');
}