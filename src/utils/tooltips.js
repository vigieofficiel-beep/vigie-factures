// Dictionnaire centralisé des tooltips Vigie Pro
// Usage : import { TIPS } from '../utils/tooltips'
// Puis : <Tooltip text={TIPS.tva} />

export const TIPS = {

  // ── TERMES COMPTABLES ──────────────────────────────────────────
  tva: "TVA (Taxe sur la Valeur Ajoutée) : impôt collecté pour l'État. Vous la facturez à vos clients et la reversez au Trésor Public, généralement chaque mois ou trimestre.",
  ht: "HT (Hors Taxes) : montant avant application de la TVA. C'est votre revenu réel avant la part reversée à l'État.",
  ttc: "TTC (Toutes Taxes Comprises) : montant final payé par votre client, TVA incluse.",
  tva_intra: "Numéro de TVA intracommunautaire : identifiant fiscal européen. Format FR + 11 chiffres. Obligatoire pour les transactions avec des entreprises dans l'UE.",
  siret: "SIRET : numéro d'identification de votre entreprise (14 chiffres). Il figure sur votre extrait Kbis et vos documents officiels.",
  montant_ht: "Montant hors taxes : base de calcul avant ajout de la TVA.",
  montant_ttc: "Montant toutes taxes comprises : ce que votre client paie réellement.",
  taux_tva: "Taux de TVA applicable à cette prestation. Les taux courants en France : 20% (standard), 10% (restauration, travaux), 5,5% (alimentation, livres), 0% (exports).",
  escompte: "Réduction accordée si le client paie avant la date d'échéance. Ex : 2% si paiement sous 10 jours.",
  penalites_retard: "Pénalités légalement dues si le client paie en retard. Le taux minimum légal est 3× le taux d'intérêt légal. Une indemnité forfaitaire de 40€ est aussi due automatiquement.",
  amortissement: "Étalement du coût d'un bien sur sa durée de vie. Ex : un ordinateur à 1 200€ amorti sur 3 ans = 400€/an en charge.",
  charges_sociales: "Cotisations versées aux organismes sociaux (URSSAF, retraite...). Elles financent votre protection sociale en contrepartie.",
  seuil_rentabilite: "Chiffre d'affaires minimum à atteindre pour couvrir toutes vos charges. En dessous : vous perdez de l'argent.",
  indemnite_km: "Remboursement des frais de déplacement professionnel avec votre véhicule personnel. Le barème fiscal 2025 est de 0,529€/km.",

  // ── MODULES ───────────────────────────────────────────────────
  depenses: "Enregistrez toutes vos dépenses professionnelles : achats, frais de déplacement, abonnements... Elles sont déductibles de votre résultat imposable.",
  recettes: "Suivez vos devis et encaissements clients. Un devis signé devient une recette une fois encaissé.",
  banque: "Importez votre relevé bancaire CSV pour rapprocher automatiquement vos transactions avec vos factures enregistrées.",
  contrats: "Centralisez vos contrats fournisseurs, baux, assurances. Vigie vous alerte avant les échéances et reconductions tacites.",
  formalites: "Vos obligations administratives : déclarations TVA, CFE, bilan... Vigie vous rappelle les dates limites.",
  exports_fec: "FEC (Fichier des Écritures Comptables) : format obligatoire pour transmettre votre comptabilité à l'administration fiscale ou votre expert-comptable.",

  // ── DOCUMENTS ─────────────────────────────────────────────────
  devis: "Proposition commerciale envoyée à un client avant de réaliser la prestation. Il n'est pas obligatoire légalement mais fortement recommandé. Une fois signé, il engage les deux parties.",
  facture: "Document obligatoire lors de toute vente entre professionnels. Elle doit comporter des mentions légales précises (numéro, date, SIRET, TVA...) sous peine d'amende.",
  numero_facture: "Numéro unique et séquentiel obligatoire sur chaque facture. Vous ne pouvez pas sauter de numéro ni en avoir deux identiques.",
  date_echeance: "Date limite de paiement accordée au client. Passé ce délai, vous pouvez appliquer des pénalités de retard.",
  date_validite: "Date jusqu'à laquelle votre devis reste valable. Passé cette date, vous pouvez modifier vos tarifs.",
  conditions_paiement: "Délai accordé au client pour payer. Le délai légal maximum entre professionnels est 60 jours (ou 45 jours fin de mois).",
  reconduction_tacite: "Renouvellement automatique du contrat si aucune des parties ne donne son préavis avant la date limite. Très fréquent dans les assurances et abonnements.",
  delai_preavis: "Délai minimum à respecter avant la date de fin pour résilier un contrat à reconduction tacite. Passé ce délai, le contrat est automatiquement reconduit.",

  // ── TRÉSORERIE & PRÉVISION ────────────────────────────────────
  prevision_tresorerie: "Estimation de votre solde bancaire futur basée sur vos entrées et sorties moyennes des 3 derniers mois. C'est une projection, pas une garantie.",
  rapprochement: "Vérification que chaque transaction bancaire correspond bien à une facture enregistrée dans Vigie. Permet de détecter les erreurs et oublis.",
  solde_previsionnel: "Estimation de votre solde bancaire à une date future, calculée à partir de vos habitudes de revenus et dépenses.",

  // ── OCR & IA ──────────────────────────────────────────────────
  ocr: "Reconnaissance automatique du contenu d'une facture photo ou PDF. Vigie lit les montants, dates et fournisseurs sans que vous ayez à les saisir.",
  classification: "Catégorisation automatique de votre document : dépense, recette ou contrat. Vous pouvez toujours corriger la classification.",

  // ── STATUTS DEVIS ─────────────────────────────────────────────
  statut_brouillon: "Devis en cours de rédaction, non envoyé au client.",
  statut_envoye: "Devis transmis au client, en attente de réponse.",
  statut_signe: "Devis accepté et signé par le client. La prestation peut commencer.",
  statut_encaisse: "Paiement reçu sur votre compte bancaire.",
  statut_en_retard: "Paiement non reçu après la date d'échéance.",
  statut_annule: "Devis annulé, n'a plus de valeur commerciale.",

  // ── PLANS & ABONNEMENT ────────────────────────────────────────
  plan_gratuit: "Accès aux outils de calcul et à Vigil en mode limité. Aucune carte bancaire requise.",
  plan_starter: "Modules de base illimités : dépenses, recettes, banque, contrats. Idéal pour les auto-entrepreneurs.",
  plan_pro: "Tout Starter + agents IA (OCR, anomalies, alertes) + export FEC. Idéal pour les TPE et EURL.",
  plan_premium: "Tout Pro + Business Plan IA + étude de marché + multi-entreprises. Idéal pour les PME.",
};
