/**
 * Agent 5 — Alertes intelligentes (zéro IA, logique pure)
 * Détecte : contrats, TVA, devis en retard, formalités
 */

const URGENCE = {
  CRITIQUE : 'critique',   // rouge  — 0-7 jours
  ATTENTION: 'attention',  // orange — 8-30 jours
  INFO     : 'info',       // bleu   — 31-60 jours
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function niveauUrgence(days) {
  if (days === null) return null;
  if (days <= 7)  return URGENCE.CRITIQUE;
  if (days <= 30) return URGENCE.ATTENTION;
  if (days <= 60) return URGENCE.INFO;
  return null; // pas d'alerte au-delà de 60 jours
}

/* ══ CONTRATS ══════════════════════════════════════════════════════ */
export function analyserContrats(contrats = []) {
  const alertes = [];
  for (const c of contrats) {
    const days = daysUntil(c.date_fin || c.date_echeance || c.date_renouvellement);
    const niveau = niveauUrgence(days);
    if (!niveau) continue;
    alertes.push({
      id      : `contrat-${c.id}`,
      type    : 'contrat',
      niveau,
      titre   : `Contrat${c.nom ? ` "${c.nom}"` : ''} expire dans ${days} jour${days > 1 ? 's' : ''}`,
      detail  : c.fournisseur || c.prestataire || '',
      days,
      lien    : '/pro/contrats',
      icone   : 'FileCheck',
    });
  }
  return alertes;
}

/* ══ TVA ═══════════════════════════════════════════════════════════ */
export function analyserTVA(regime = 'mensuel') {
  const alertes = [];
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const year  = now.getFullYear();

  // Prochaine échéance TVA selon régime
  let prochaine;
  if (regime === 'mensuel') {
    // Le 19 de chaque mois
    prochaine = new Date(year, month, 19);
    if (prochaine < now) prochaine = new Date(year, month + 1, 19);
  } else {
    // Trimestriel : 19 jan, 19 avr, 19 jul, 19 oct
    const moisTrim = [0, 3, 6, 9];
    for (const m of moisTrim) {
      const d = new Date(year, m, 19);
      if (d > now) { prochaine = d; break; }
    }
    if (!prochaine) prochaine = new Date(year + 1, 0, 19);
  }

  const days = Math.ceil((prochaine - now) / (1000 * 60 * 60 * 24));
  const niveau = niveauUrgence(days);
  if (!niveau) return alertes;

  alertes.push({
    id     : 'tva-prochaine',
    type   : 'tva',
    niveau,
    titre  : `Déclaration TVA dans ${days} jour${days > 1 ? 's' : ''}`,
    detail : `Régime ${regime} — échéance le ${prochaine.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
    days,
    lien   : '/pro/formalites',
    icone  : 'Percent',
  });

  return alertes;
}

/* ══ DEVIS EN RETARD ═══════════════════════════════════════════════ */
export function analyserDevis(devis = []) {
  const alertes = [];
  const enRetard = devis.filter(d =>
    (d.statut === 'envoye' || d.statut === 'signe') &&
    d.date_echeance &&
    daysUntil(d.date_echeance) < 0
  );

  if (enRetard.length === 0) return alertes;

  // Une alerte groupée
  const totalTTC = enRetard.reduce((s, d) => s + (d.montant_ttc || 0), 0);
  alertes.push({
    id    : 'devis-retard',
    type  : 'devis',
    niveau: URGENCE.CRITIQUE,
    titre : `${enRetard.length} devis en retard de paiement`,
    detail: `Total : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(totalTTC)}`,
    days  : 0,
    lien  : '/pro/recettes',
    icone : 'AlertCircle',
  });

  // Alertes individuelles si > 1
  if (enRetard.length > 1) {
    enRetard.forEach(d => {
      const retard = Math.abs(daysUntil(d.date_echeance));
      alertes.push({
        id    : `devis-retard-${d.id}`,
        type  : 'devis',
        niveau: URGENCE.CRITIQUE,
        titre : `Devis ${d.numero} — retard de ${retard}j`,
        detail: `${d.clients?.nom || 'Client'} · ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(d.montant_ttc || 0)}`,
        days  : -retard,
        lien  : '/pro/recettes',
        icone : 'FileText',
      });
    });
  }

  return alertes;
}

/* ══ FORMALITÉS ════════════════════════════════════════════════════ */
export function analyserFormalites(formalites = []) {
  const alertes = [];
  for (const f of formalites) {
    if (f.statut === 'fait' || f.statut === 'termine') continue;
    const days = daysUntil(f.date_echeance || f.prochaine_echeance);
    const niveau = niveauUrgence(days);
    if (!niveau) continue;
    alertes.push({
      id    : `formalite-${f.id}`,
      type  : 'formalite',
      niveau,
      titre : `${f.nom || f.type || 'Formalité'} dans ${days} jour${days > 1 ? 's' : ''}`,
      detail: f.description || f.organisme || '',
      days,
      lien  : '/pro/formalites',
      icone : 'ClipboardCheck',
    });
  }
  return alertes;
}

/* ══ AGRÉGATEUR PRINCIPAL ══════════════════════════════════════════ */
export function analyserTout({ contrats, devis, formalites, regimeTVA = 'mensuel' }) {
  const toutes = [
    ...analyserContrats(contrats),
    ...analyserTVA(regimeTVA),
    ...analyserDevis(devis),
    ...analyserFormalites(formalites),
  ];

  // Trier : critique d'abord, puis par jours croissants
  const ordre = { critique: 0, attention: 1, info: 2 };
  toutes.sort((a, b) => {
    const niv = ordre[a.niveau] - ordre[b.niveau];
    if (niv !== 0) return niv;
    return (a.days ?? 999) - (b.days ?? 999);
  });

  return toutes;
}

export { URGENCE };
