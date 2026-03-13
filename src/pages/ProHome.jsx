import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle, ChevronRight,
  FileCheck, Receipt, Bell, BellOff, X, ChevronDown, ChevronUp,
  Percent, FileText, ClipboardCheck, AlertCircle,
} from 'lucide-react';
import { analyserTout, URGENCE } from '../agents/AlertesAgent';
import GraphiqueCA from './GraphiqueCA';

const formatEuro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

/* ══ COULEURS ALERTES ══════════════════════════════════════════════ */
const ALERTE_STYLE = {
  critique : { bg: 'rgba(199,91,78,0.08)',  border: 'rgba(199,91,78,0.3)',  color: '#C75B4E', label: 'Urgent'    },
  attention: { bg: 'rgba(212,168,83,0.08)', border: 'rgba(212,168,83,0.3)', color: '#D4A853', label: 'Attention' },
  info     : { bg: 'rgba(91,163,199,0.08)', border: 'rgba(91,163,199,0.3)', color: '#5BA3C7', label: 'Info'      },
};

const ICONE_MAP = { Percent: Percent, FileText, ClipboardCheck, AlertCircle, FileCheck };

/* ══ BANDEAU ALERTES ═══════════════════════════════════════════════ */
function BandeauAlertes({ alertes, onDismiss }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('alertes_dismissed') || '[]'); } catch { return []; }
  });

  const visibles = alertes.filter(a => !dismissed.includes(a.id));
  const critiques = visibles.filter(a => a.niveau === URGENCE.CRITIQUE).length;

  const dismissOne = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try { sessionStorage.setItem('alertes_dismissed', JSON.stringify(next)); } catch {}
  };

  const dismissAll = () => {
    const next = alertes.map(a => a.id);
    setDismissed(next);
    try { sessionStorage.setItem('alertes_dismissed', JSON.stringify(next)); } catch {}
    if (onDismiss) onDismiss();
  };

  if (visibles.length === 0) return null;

  return (
    <div style={{
      background: critiques > 0 ? 'rgba(199,91,78,0.06)' : 'rgba(212,168,83,0.06)',
      border: `1px solid ${critiques > 0 ? 'rgba(199,91,78,0.25)' : 'rgba(212,168,83,0.25)'}`,
      borderRadius: 14, marginBottom: 24, overflow: 'hidden',
    }}>
      {/* En-tête bandeau */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', cursor: 'pointer',
          background: critiques > 0 ? 'rgba(199,91,78,0.04)' : 'rgba(212,168,83,0.04)',
        }}
      >
        <Bell size={15} color={critiques > 0 ? '#C75B4E' : '#D4A853'} />
        <span style={{ fontSize: 13, fontWeight: 700, color: critiques > 0 ? '#C75B4E' : '#D4A853', flex: 1 }}>
          {visibles.length} alerte{visibles.length > 1 ? 's' : ''} en attente
          {critiques > 0 && <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 8, background: 'rgba(199,91,78,0.15)', color: '#C75B4E', padding: '2px 7px', borderRadius: 20 }}>{critiques} urgent{critiques > 1 ? 'es' : 'e'}</span>}
        </span>
        <button
          onClick={e => { e.stopPropagation(); dismissAll(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6 }}
        >
          <BellOff size={11} /> Tout ignorer
        </button>
        {collapsed ? <ChevronDown size={14} color="#94A3B8" /> : <ChevronUp size={14} color="#94A3B8" />}
      </div>

      {/* Liste alertes */}
      {!collapsed && (
        <div style={{ padding: '8px 16px 12px' }}>
          {visibles.map(a => {
            const s = ALERTE_STYLE[a.niveau];
            const Icon = ICONE_MAP[a.icone] || AlertTriangle;
            return (
              <div key={a.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: s.bg, border: `1px solid ${s.border}`,
                borderRadius: 9, padding: '9px 12px', marginBottom: 6,
              }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={s.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{a.titre}</div>
                  {a.detail && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{a.detail}</div>}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: `${s.color}15`, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>{s.label}</span>
                <a href={a.lien} style={{ color: '#94A3B8', flexShrink: 0 }}>
                  <ChevronRight size={13} />
                </a>
                <button
                  onClick={() => dismissOne(a.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2, display: 'flex', flexShrink: 0 }}
                  title="Ignorer"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══ DÉTECTION ANOMALIES (Agent 2) ════════════════════════════════ */
function detecterAnomalies(expenses) {
  const anomalies = [];
  if (!expenses || expenses.length === 0) return anomalies;

  const montants = expenses.map(e => e.amount_ttc).filter(Boolean);
  const moyenne = montants.reduce((a, b) => a + b, 0) / montants.length;

  const vus = new Set();
  expenses.forEach(e => {
    const cle = `${e.etablissement}-${e.amount_ttc}-${e.date}`;
    if (vus.has(cle)) {
      anomalies.push({ type: 'doublon', message: `Doublon détecté : ${e.etablissement} (${e.amount_ttc}€)` });
    } else {
      vus.add(cle);
    }
    if (e.amount_ttc > moyenne * 3 && moyenne > 0) {
      anomalies.push({ type: 'montant', message: `Montant inhabituel : ${e.etablissement} → ${e.amount_ttc}€ (moy. ${Math.round(moyenne)}€)` });
    }
    if (!e.etablissement && e.amount_ttc > 50) {
      anomalies.push({ type: 'manquant', message: `Fournisseur manquant pour une dépense de ${e.amount_ttc}€` });
    }
  });
  return anomalies;
}

/* ══ PAGE PRINCIPALE ═══════════════════════════════════════════════ */
export default function ProHome() {
  const [expenses,    setExpenses]    = useState([]);
  const [devis,       setDevis]       = useState([]);
  const [contrats,    setContrats]    = useState([]);
  const [formalites,  setFormalites]  = useState([]);
  const [alertes,     setAlertes]     = useState([]);
  const [anomalies,   setAnomalies]   = useState([]);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [loading,     setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;

    const [
      { data: exp },
      { data: dev },
      { data: cont },
      { data: form },
    ] = await Promise.all([
      supabasePro.from('expenses').select('amount_ttc, type, etablissement, date, notes').eq('user_id', user.id).order('date', { ascending: false }).limit(50),
      supabasePro.from('devis').select('*, clients(nom)').eq('user_id', user.id),
      supabasePro.from('contrats').select('*').eq('user_id', user.id),
      supabasePro.from('formalites').select('*').eq('user_id', user.id),
    ]);

    const expData  = exp   || [];
    const devData  = dev   || [];
    const contData = cont  || [];
    const formData = form  || [];

    setExpenses(expData);
    setDevis(devData);
    setContrats(contData);
    setFormalites(formData);

    // Agent 2 — anomalies
    setAnomalies(detecterAnomalies(expData));

    // Agent 5 — alertes
    const alertesCalc = analyserTout({
      contrats   : contData,
      devis      : devData,
      formalites : formData,
      regimeTVA  : 'mensuel',
    });
    setAlertes(alertesCalc);

    setLoading(false);
  };

  /* Stats */
  const totalDepenses  = expenses.reduce((s, e) => s + (e.amount_ttc || 0), 0);
  const totalRecettes  = devis.filter(d => d.statut === 'encaisse').reduce((s, d) => s + (d.montant_ttc || 0), 0);
  const devisEnAttente = devis.filter(d => d.statut === 'envoye' || d.statut === 'signe').length;
  const contratsActifs = contrats.filter(c => c.statut === 'actif' || !c.statut).length;

  const depensesByType = expenses.reduce((acc, e) => {
    const type = e.type || 'Autre';
    acc[type] = (acc[type] || 0) + (e.amount_ttc || 0);
    return acc;
  }, {});

  const critiques = alertes.filter(a => a.niveau === URGENCE.CRITIQUE).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94A3B8', fontSize: 14 }}>
      Chargement…
    </div>
  );

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif", padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: '#1A1C20', margin: 0 }}>
          Tableau de bord
        </h1>
        <p style={{ fontSize: 13, color: '#9AA0AE', marginTop: 4 }}>
          Vue d'ensemble de votre activité
          {critiques > 0 && <span style={{ marginLeft: 10, color: '#C75B4E', fontWeight: 700 }}>· {critiques} alerte{critiques > 1 ? 's' : ''} urgente{critiques > 1 ? 's' : ''}</span>}
        </p>
      </div>

      {/* ── Agent 5 : Bandeau alertes ── */}
      <GraphiqueCA compact={true} />
      {alertes.length > 0 && (
        <BandeauAlertes alertes={alertes} onDismiss={() => setAlertes([])} />
      )}

      {/* ── Agent 2 : Anomalies ── */}
      {anomalies.length > 0 && showAnomalies && (
        <div style={{ background: 'rgba(199,91,78,0.05)', border: '1px solid rgba(199,91,78,0.2)', borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(199,91,78,0.04)' }}>
            <AlertTriangle size={15} color="#C75B4E" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#C75B4E', flex: 1 }}>{anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''} détectée{anomalies.length > 1 ? 's' : ''}</span>
            <button onClick={() => setShowAnomalies(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 2, display: 'flex' }}><X size={13} /></button>
          </div>
          <div style={{ padding: '8px 16px 12px' }}>
            {anomalies.map((a, i) => (
              <div key={i} style={{ fontSize: 12, color: '#C75B4E', padding: '5px 0', borderBottom: i < anomalies.length - 1 ? '1px solid rgba(199,91,78,0.1)' : 'none' }}>
                ⚠️ {a.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Dépenses (mois)', value: formatEuro(totalDepenses),  color: '#C75B4E', icon: TrendingDown, action: () => navigate('/pro/depenses') },
          { label: 'Recettes encaissées', value: formatEuro(totalRecettes), color: '#5BC78A', icon: TrendingUp,   action: () => navigate('/pro/recettes') },
          { label: 'Devis en attente',    value: devisEnAttente,           color: '#D4A853', icon: Receipt,       action: () => navigate('/pro/recettes') },
          { label: 'Contrats actifs',     value: contratsActifs,           color: '#5BA3C7', icon: FileCheck,     action: () => navigate('/pro/contrats') },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} onClick={s.action} style={{ background: '#fff', border: '1px solid #E8EAF0', borderRadius: 12, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 120ms ease, box-shadow 120ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 11, color: '#9AA0AE', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
                <Icon size={15} color={s.color} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Dépenses par catégorie */}
      {Object.keys(depensesByType).length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E8EAF0', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1A1C20', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>
            Dépenses par catégorie
          </h2>
          {Object.entries(depensesByType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([type, total]) => {
              const max = Math.max(...Object.values(depensesByType));
              const pct = Math.round((total / max) * 100);
              return (
                <div key={type} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#5A6070', fontWeight: 500 }}>{type}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1C20' }}>{formatEuro(total)}</span>
                  </div>
                  <div style={{ height: 6, background: '#F0F2F5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #5BA3C7, #5BC78A)', borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Raccourcis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { label: 'Nouvelle dépense', color: '#5BC78A', path: '/pro/depenses' },
          { label: 'Nouveau devis',    color: '#5BA3C7', path: '/pro/recettes' },
          { label: 'Voir les contrats',color: '#D4A853', path: '/pro/contrats' },
          { label: 'Formalités',       color: '#A85BC7', path: '/pro/formalites' },
        ].map(r => (
          <button key={r.label} onClick={() => navigate(r.path)} style={{
            padding: '13px 18px', borderRadius: 11, border: `1px solid ${r.color}30`,
            background: `${r.color}08`, color: r.color, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'background 150ms ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = `${r.color}15`}
            onMouseLeave={e => e.currentTarget.style.background = `${r.color}08`}
          >
            {r.label} <ChevronRight size={14} />
          </button>
        ))}
      </div>

    </div>
  );
}
