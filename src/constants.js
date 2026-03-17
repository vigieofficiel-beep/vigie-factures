/**
 * VIGIE PRO — Constantes fiscales et sociales
 * ⚠️ À mettre à jour chaque janvier selon le budget et les décrets URSSAF
 * Dernière mise à jour : 2025
 */

export const ANNEE_FISCALE = 2025;

// ── SMIC ────────────────────────────────────────────────────────────
export const SMIC_MENSUEL_BRUT  = 1801.80;
export const SMIC_ANNUEL_BRUT   = SMIC_MENSUEL_BRUT * 12;

// ── PASS (Plafond Annuel Sécurité Sociale) ───────────────────────────
export const PASS_ANNUEL  = 47100;
export const PASS_MENSUEL = PASS_ANNUEL / 12; // 3925€

// ── TVA ─────────────────────────────────────────────────────────────
export const TVA_TAUX = {
  normal:     0.20,  // 20%
  reduit:     0.10,  // 10% restauration, travaux
  super_reduit: 0.055, // 5.5% alimentation, livres
  particulier: 0.021, // 2.1% médicaments remboursés
  zero:       0,
};

// Seuils franchise en base de TVA
export const SEUILS_FRANCHISE_TVA = {
  services:  37500,   // Prestations de services
  ventes:    85000,   // Ventes de marchandises
  avocats:   47700,
  auteurs:   47700,
};

// ── AUTO-ENTREPRENEUR ────────────────────────────────────────────────
export const AE = {
  bic_vente: {
    label: 'Auto-entrepreneur — Vente de marchandises',
    cotisations: 0.122,
    versement_liberatoire: 0.01,
    abattement: 0.71,
    plafond_ca: 188700,
    desc: 'Commerce, vente, hébergement',
  },
  bic_service: {
    label: 'Auto-entrepreneur — Prestations de services BIC',
    cotisations: 0.211,
    versement_liberatoire: 0.017,
    abattement: 0.50,
    plafond_ca: 77700,
    desc: 'Artisans, services commerciaux',
  },
  bnc: {
    label: 'Auto-entrepreneur — Professions libérales (BNC)',
    cotisations: 0.231,
    versement_liberatoire: 0.022,
    abattement: 0.34,
    plafond_ca: 77700,
    desc: 'Consultants, freelances, libéraux',
  },
};

// ── SOCIÉTÉS ─────────────────────────────────────────────────────────
export const SOCIETES = {
  eurl_tns: {
    label: 'EURL — Gérant majoritaire (TNS)',
    cotisations_base: 0.45,
    desc: 'Travailleur non salarié, société à l\'IS',
  },
  sarl_tns: {
    label: 'SARL — Gérant majoritaire (TNS)',
    cotisations_base: 0.45,
    desc: 'Gérant majoritaire assimilé TNS',
  },
  sas_sasu: {
    label: 'SAS / SASU — Président assimilé salarié',
    cotisations_base: 0.82,
    desc: 'Assimilé salarié, cotisations élevées',
  },
  sa: {
    label: 'SA — Directeur Général',
    cotisations_base: 0.82,
    desc: 'Assimilé salarié',
  },
};

// ── IS (Impôt sur les Sociétés) ──────────────────────────────────────
export const IS = {
  taux_reduit: 0.15,   // 15% jusqu'au seuil
  taux_normal: 0.25,   // 25% au-delà
  seuil_reduit: 42500, // Seuil taux réduit
};

// ── BARÈME IR (Impôt sur le Revenu) 2025 ────────────────────────────
export const TRANCHES_IR = [
  { min: 0,       max: 11497,   taux: 0    },
  { min: 11497,   max: 29315,   taux: 0.11 },
  { min: 29315,   max: 83823,   taux: 0.30 },
  { min: 83823,   max: 180294,  taux: 0.41 },
  { min: 180294,  max: Infinity, taux: 0.45 },
];

// ── COTISATIONS SALARIALES 2025 ──────────────────────────────────────
export const COTISATIONS_SALARIALES = [
  { nom:'Assurance vieillesse plafonnée',   taux:6.90,  base:'brut', plafond:'pass' },
  { nom:'Assurance vieillesse déplafonnée', taux:0.40,  base:'brut', plafond:null   },
  { nom:'Retraite complémentaire T1',       taux:3.15,  base:'brut', plafond:'pass' },
  { nom:'Retraite complémentaire T2',       taux:8.64,  base:'brut', plafond:'t2'   },
  { nom:'CEG T1',                           taux:0.86,  base:'brut', plafond:'pass' },
  { nom:'CEG T2',                           taux:1.08,  base:'brut', plafond:'t2'   },
  { nom:'CSG déductible',                   taux:6.80,  base:'csg',  plafond:null   },
  { nom:'CSG/CRDS non déductible',          taux:2.90,  base:'csg',  plafond:null   },
  { nom:'Prévoyance (estimation)',           taux:0.78,  base:'brut', plafond:'pass' },
];

// ── NOTES DE FRAIS ───────────────────────────────────────────────────
export const NOTES_FRAIS = {
  repas_max: 20.20,         // Plafond repas remboursable
  taux_km:   0.529,         // Barème kilométrique 5CV (2024, mis à jour annuellement)
};

// ── AMORTISSEMENT — Durées fiscales par catégorie ────────────────────
export const DUREES_AMORTISSEMENT = {
  informatique:  3,
  vehicule:      5,
  mobilier:     10,
  outillage:     5,
  machine:      10,
  batiment:     25,
  logiciel:      3,
};

// ── FONCTION UTILITAIRE — Calcul IR ─────────────────────────────────
export function calculerIR(revenuImposable) {
  let ir = 0;
  for (const t of TRANCHES_IR) {
    if (revenuImposable <= t.min) break;
    ir += (Math.min(revenuImposable, t.max) - t.min) * t.taux;
  }
  return Math.max(0, ir);
}

// ── FONCTION UTILITAIRE — Calcul IS ─────────────────────────────────
export function calculerIS(benefice) {
  if (benefice <= 0) return 0;
  if (benefice <= IS.seuil_reduit) return benefice * IS.taux_reduit;
  return IS.seuil_reduit * IS.taux_reduit + (benefice - IS.seuil_reduit) * IS.taux_normal;
}
