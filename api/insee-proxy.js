/**
 * Proxy INSEE BDM — endpoint public, aucune clé requise
 * Route : GET /api/insee-proxy?categorie=energie
 * Retourne le taux d'inflation sectoriel sur 12 mois
 */

// Codes séries INSEE IPC par catégorie (indices prix à la consommation)
const SERIES_INSEE = {
  energie       : '001763851', // Énergie
  alimentation  : '001763952', // Alimentation
  transport     : '001763854', // Transports
  communication : '001763856', // Communications
  logement      : '001763853', // Logement
  sante         : '001763855', // Santé
  default       : '001763849', // IPC général (tous produits)
};

function getSerieCode(categorie) {
  const c = (categorie || '').toLowerCase();
  if (c.includes('energ'))       return SERIES_INSEE.energie;
  if (c.includes('aliment') || c.includes('restaur')) return SERIES_INSEE.alimentation;
  if (c.includes('transport'))   return SERIES_INSEE.transport;
  if (c.includes('communicat') || c.includes('telecom')) return SERIES_INSEE.communication;
  if (c.includes('loyer') || c.includes('logement'))     return SERIES_INSEE.logement;
  if (c.includes('sant') || c.includes('medical'))       return SERIES_INSEE.sante;
  return SERIES_INSEE.default;
}

export default async function handler(req, res) {
  // Cache CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { categorie } = req.query;
  const serie = getSerieCode(categorie);

  try {
    const url = `https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/${serie}?lastNObservations=13`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      // Fallback : retourner inflation générale estimée si INSEE inaccessible
      return res.status(200).json({
        ok          : true,
        fallback    : true,
        categorie   : categorie || 'general',
        inflation12m: 2.5, // taux moyen estimé BCE 2024-2025
        source      : 'estimation',
      });
    }

    const text = await response.text();

    // Parser XML SDMX — extraire les 13 dernières valeurs
    const matches = [...text.matchAll(/OBS_VALUE="([\d.]+)"/g)];
    if (matches.length < 2) {
      return res.status(200).json({ ok: true, fallback: true, inflation12m: 2.5, source: 'estimation' });
    }

    const valeurs = matches.map(m => parseFloat(m[1]));
    const derniere  = valeurs[valeurs.length - 1];
    const ilYa12m   = valeurs[valeurs.length - 13] || valeurs[0];
    const inflation = ((derniere - ilYa12m) / ilYa12m) * 100;

    return res.status(200).json({
      ok          : true,
      fallback    : false,
      categorie   : categorie || 'general',
      inflation12m: Math.round(inflation * 10) / 10,
      source      : 'INSEE BDM',
      serie,
    });

  } catch (err) {
    console.error('[INSEE Proxy]', err);
    // Toujours retourner quelque chose d'utilisable
    return res.status(200).json({
      ok          : true,
      fallback    : true,
      inflation12m: 2.5,
      source      : 'estimation',
    });
  }
}
