import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';
import {
  AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown,
  FileText, Bell, CreditCard, Users, ShoppingCart,
  FileCheck, Mail, BarChart2, ArrowRight, Wallet,
  Upload, Receipt, Building2, Landmark, X, CheckCheck,
  Zap, Shield, Brain, AlertOctagon, ChevronDown, ChevronUp,
} from 'lucide-react';

const C = {
  blue:   '#5BA3C7',
  green:  '#5BC78A',
  gold:   '#D4A853',
  purple: '#A85BC7',
  red:    '#C75B4E',
  dark:   '#0F172A',
  mid:    '#1E293B',
  gray:   '#64748B',
  light:  '#94A3B8',
  border: '#E2E8F0',
  bg:     '#F8FAFC',
};

const euro = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const fdate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
const daysUntil = (d) => { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); };
const moisCourant = () => {
  const n = new Date();
  return {
    debut: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`,
    fin: new Date(n.getFullYear(), n.getMonth()+1, 0).toISOString().split('T')[0],
  };
};

// ── Détection d'anomalies (code pur, sans IA) ─────────────────────────
function detecterAnomalies(expenses) {
  const anomalies = [];
  if (!expenses || expenses.length === 0) return anomalies;

  // 1. Doublons (même montant + même fournisseur + même date)
  const seen = {};
  expenses.forEach((e, i) => {
    const key = `${e.etablissement?.toLowerCase().trim()}_${e.amount_ttc}_${e.date}`;
    if (e.etablissement && e.amount_ttc && e.date) {
      if (seen[key] !== undefined) {
        anomalies.push({
          type: 'doublon',
          severity: 'high',
          message: `Doublon possible : ${e.etablissement} — ${euro(e.amount_ttc)} le ${fdate(e.date)}`,
          route: '/pro/depenses',
        });
      } else {
        seen[key] = i;
      }
    }
  });

  // 2. Montant inhabituel (> 3x la moyenne)
  const montants = expenses.map(e => Number(e.amount_ttc || 0)).filter(m => m > 0);
  if (montants.length >= 3) {
    const moyenne = montants.reduce((s, m) => s + m, 0) / montants.length;
    expenses.forEach(e => {
      const m = Number(e.amount_ttc || 0);
      if (m > moyenne * 3 && m > 100) {
        anomalies.push({
          type: 'montant',
          severity: 'medium',
          message: `Dépense inhabituelle : ${e.etablissement || 'Inconnu'} — ${euro(m)} (moyenne : ${euro(Math.round(moyenne))})`,
          route: '/pro/depenses',
        });
      }
    });
  }

  // 3. TVA incorrecte (taux non standard en France)
  const tauxValides = [0, 2.1, 5.5, 10, 20];
  expenses.forEach(e => {
    const tva = Number(e.taux_tva);
    if (e.taux_tva != null && !tauxValides.includes(tva)) {
      anomalies.push({
        type: 'tva',
        severity: 'medium',
        message: `TVA suspecte : ${tva}% chez ${e.etablissement || 'Inconnu'} — taux non standard`,
        route: '/pro/depenses',
      });
    }
  });

  // 4. Fournisseur inconnu (fournisseur vide sur montant élevé)
  expenses.forEach(e => {
    const m = Number(e.amount_ttc || 0);
    if ((!e.etablissement || e.etablissement.trim() === '') && m > 50) {
      anomalies.push({
        type: 'fournisseur',
        severity: 'low',
        message: `Fournisseur manquant pour une dépense de ${euro(m)} le ${fdate(e.date)}`,
        route: '/pro/depenses',
      });
    }
  });

  // Dédoublonner et limiter à 5
  const uniques = anomalies.filter((a, i, arr) => arr.findIndex(b => b.message === a.message) === i);
  return uniques.slice(0, 5);
}

// ── Bandeau anomalies ─────────────────────────────────────────────────
function AnomaliesPanel({ anomalies, navigate }) {
  const [open, setOpen] = useState(true);
  if (!anomalies || anomalies.length === 0) return null;

  const severityColor = { high: C.red, medium: C.gold, low: C.blue };
  const severityLabel = { high: 'Critique', medium: 'Attention', low: 'Info' };

  return (
    <div style={{
      background: '#fff', border: `1.5px solid rgba(199,91,78,0.3)`,
      borderRadius: 14, marginBottom: 20, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(199,91,78,0.08)',
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', cursor: 'pointer',
          background: 'rgba(199,91,78,0.04)',
          borderBottom: open ? `1px solid rgba(199,91,78,0.15)` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(199,91,78,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertOctagon size={14} color={C.red} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Anomalies détectées
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, background: C.red, color: '#fff', borderRadius: 20, padding: '1px 8px' }}>
            {anomalies.length}
          </span>
        </div>
        {open ? <ChevronUp size={14} color={C.light} /> : <ChevronDown size={14} color={C.light} />}
      </div>

      {/* Liste */}
      {open && (
        <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {anomalies.map((a, i) => (
            <div
              key={i}
              onClick={() => a.route && navigate(a.route)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 9,
                background: `${severityColor[a.severity]}08`,
                border: `1px solid ${severityColor[a.severity]}25`,
                cursor: a.route ? 'pointer' : 'default',
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: severityColor[a.severity], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.dark, flex: 1, lineHeight: 1.4 }}>{a.message}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: severityColor[a.severity], background: `${severityColor[a.severity]}15`, borderRadius: 4, padding: '2px 7px', flexShrink: 0 }}>
                {severityLabel[a.severity]}
              </span>
              {a.route && <ArrowRight size={12} color={C.light} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const PHRASES = [
  "Vos documents transformés en données exploitables en quelques secondes.",
  "Chaque reçu uploadé, c'est une saisie manuelle évitée.",
  "Importez. Vigie Pro classe, analyse et alerte automatiquement.",
  "De la facture brute à l'écriture comptable, sans effort.",
  "Votre pré-comptabilité se construit document par document.",
];

function RotatingText() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % PHRASES.length); setVisible(true); }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  return (
    <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.7, margin: '0 0 20px', minHeight: 44, transition: 'opacity 0.4s ease', opacity: visible ? 1 : 0 }}>
      {PHRASES[idx]}
    </p>
  );
}

function HeroUpload({ navigate }) {
  const [dragging, setDragging]   = useState(false);
  const [uploaded, setUploaded]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone]           = useState(false);
  const fileRef = useRef();

  const DESTINATIONS = [
    { id: 'depense', label: 'Justificatif de dépense', icon: Receipt, color: C.red, route: '/pro/depenses', ext: ['jpg','jpeg','png','pdf','webp'], desc: 'Reçu, note de frais, ticket restaurant' },
    { id: 'fournisseur', label: 'Facture fournisseur', icon: Building2, color: C.purple, route: '/pro/fournisseurs', ext: ['pdf','jpg','jpeg','png'], desc: "Facture reçue d'un prestataire ou fournisseur" },
    { id: 'banque', label: 'Relevé bancaire', icon: Landmark, color: C.blue, route: '/pro/banque', ext: ['csv','ofx','qif'], desc: 'Export CSV depuis votre espace bancaire en ligne' },
  ];

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    setUploaded({ file, ext, name: file.name, size: (file.size / 1024).toFixed(0) + ' Ko' });
    setDone(false);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleRedirect = async (dest) => {
    setUploading(true);
    await new Promise(r => setTimeout(r, 700));
    setUploading(false); setDone(true);
    await new Promise(r => setTimeout(r, 700));
    navigate(dest.route);
  };

  const reset = () => { setUploaded(null); setDone(false); };

  return (
    <div style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.mid} 55%, #162032 100%)`, borderRadius: 22, padding: '40px 44px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 380, height: 380, borderRadius: '50%', background: `${C.blue}07`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -50, left: 180, width: 240, height: 240, borderRadius: '50%', background: `${C.green}05`, pointerEvents: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(91,163,199,0.12)', border: '1px solid rgba(91,163,199,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.blue, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Import intelligent</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: '#F1F5F9', margin: '0 0 14px', lineHeight: 1.25 }}>
            Déposez vos documents,<br /><span style={{ color: C.blue, fontStyle: 'italic' }}>Vigie Pro fait le reste.</span>
          </h2>
          <RotatingText />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: Zap,    color: C.gold,  text: 'Classement automatique dans le bon module' },
              { icon: Brain,  color: C.blue,  text: 'Extraction intelligente des données clés' },
              { icon: Shield, color: C.green, text: 'Stockage sécurisé et conforme RGPD' },
            ].map(({ icon: Icon, color, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color={color} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 12, color: '#CBD5E1', lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['PDF', 'JPG', 'PNG', 'CSV', 'OFX'].map(f => (
              <span key={f} style={{ fontSize: 10, fontWeight: 700, color: '#64748B', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '2px 7px', letterSpacing: '0.05em' }}>{f}</span>
            ))}
          </div>
        </div>

        <div>
          {!uploaded ? (
            <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragging ? C.blue : 'rgba(255,255,255,0.12)'}`, borderRadius: 18, padding: '44px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.25s ease', background: dragging ? 'rgba(91,163,199,0.08)' : 'rgba(255,255,255,0.025)' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: dragging ? 'rgba(91,163,199,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s ease', boxShadow: dragging ? `0 0 30px ${C.blue}30` : 'none' }}>
                <Upload size={24} color={dragging ? C.blue : '#475569'} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: dragging ? '#E2E8F0' : '#94A3B8', margin: '0 0 6px' }}>{dragging ? 'Relâchez pour importer' : 'Glissez un document ici'}</p>
                <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>ou <span style={{ color: C.blue, fontWeight: 600 }}>cliquez pour parcourir</span></p>
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.ofx,.qif" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
          ) : done ? (
            <div style={{ border: `2px solid ${C.green}40`, borderRadius: 18, padding: '44px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, background: 'rgba(91,199,138,0.06)' }}>
              <CheckCheck size={36} color={C.green} strokeWidth={1.5} />
              <p style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', margin: 0 }}>Redirection en cours…</p>
            </div>
          ) : (
            <div style={{ border: '1px solid rgba(255,255,255,0.10)', borderRadius: 18, padding: 22, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, padding: '10px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <FileText size={15} color={C.blue} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploaded.name}</p>
                  <p style={{ fontSize: 10, color: '#64748B', margin: '2px 0 0' }}>{uploaded.size} · .{uploaded.ext.toUpperCase()}</p>
                </div>
                <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2, display: 'flex' }}><X size={14} /></button>
              </div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Où envoyer ce document ?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DESTINATIONS.map(dest => {
                  const DIcon = dest.icon;
                  const compatible = dest.ext.includes(uploaded.ext);
                  return (
                    <button key={dest.id} onClick={() => compatible && !uploading && handleRedirect(dest)} disabled={!compatible || uploading}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: 'none', background: compatible ? `${dest.color}12` : 'rgba(255,255,255,0.02)', cursor: compatible ? 'pointer' : 'not-allowed', opacity: compatible ? 1 : 0.35, transition: 'all 0.15s ease', textAlign: 'left', width: '100%' }}
                      onMouseEnter={e => { if (compatible) e.currentTarget.style.background = `${dest.color}22`; }}
                      onMouseLeave={e => { if (compatible) e.currentTarget.style.background = `${dest.color}12`; }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${dest.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <DIcon size={15} color={dest.color} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', margin: 0 }}>{dest.label}</p>
                        <p style={{ fontSize: 10, color: '#64748B', margin: '2px 0 0' }}>{dest.desc}</p>
                      </div>
                      {compatible && <ArrowRight size={13} color={dest.color} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
              {uploading && <p style={{ marginTop: 12, fontSize: 11, color: C.blue, textAlign: 'center', fontWeight: 600 }}>Préparation du document…</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, alert, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ background: '#fff', border: `1px solid ${alert ? 'rgba(199,91,78,0.35)' : C.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)', cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s ease', transform: hov && onClick ? 'translateY(-2px)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.light, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} strokeWidth={2} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: alert ? C.red : C.dark, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.light }}>{sub}</div>}
    </div>
  );
}

function Panel({ children, style = {} }) {
  return <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style }}>{children}</div>;
}

function SectionTitle({ icon: Icon, label, color, route, navigate: nav }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={12} color={color} strokeWidth={2} />
        </div>
        <h2 style={{ fontSize: 11, fontWeight: 700, color: C.dark, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</h2>
      </div>
      {route && <button onClick={() => nav(route)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color, fontSize: 11, fontWeight: 600 }}>Voir <ArrowRight size={11} /></button>}
    </div>
  );
}

function AlertRow({ message, type, date, onClick }) {
  const colors = { overdue: C.red, upcoming: C.gold, info: C.blue, contrat: C.gold, facture: C.red, formalite: C.purple };
  const c = colors[type] || C.gray;
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.bg}`, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: C.dark, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{message}</p>
        {date && <p style={{ fontSize: 10, color: C.light, margin: '2px 0 0' }}>{fdate(date)}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: C.dark, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, color: C.light }}>{euro(value)}</span>
      </div>
      <div style={{ height: 5, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

export default function ProHome() {
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading]     = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [data, setData]           = useState({
    recettesMois: 0, depensesMois: 0, soldeMois: 0,
    facturesEnAttente: 0, montantEnAttente: 0, facturesEnRetard: 0,
    nbActifs: 0, nbConges: 0, masseSalariale: 0,
    montantDuFourn: 0, fourniRetard: 0,
    contratsExpirent: [], formalitesEnRetard: 0, formalitesProchaines: 0,
    alertes: [], depensesParCat: [],
  });
  const navigate = useNavigate();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      if (!user) return;
      const uid = user.id;
      setFirstName(user.user_metadata?.first_name || '');

      const { debut, fin } = moisCourant();
      const today = new Date().toISOString().split('T')[0];
      const in30  = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      const [
        { data: recettes }, { data: depenses }, { data: invoices },
        { data: equipe }, { data: factureFourn }, { data: contrats },
        { data: formalites }, { data: reminders }, { data: toutesDepenses },
      ] = await Promise.all([
        supabasePro.from('invoices').select('montant_ht,taux_tva,montant_ttc,statut,date,date_echeance').eq('user_id', uid).gte('date', debut).lte('date', fin),
        supabasePro.from('expenses').select('montant_ht,taux_tva,categorie,date').eq('user_id', uid).gte('date', debut).lte('date', fin),
        supabasePro.from('invoices').select('montant_ttc,statut,date_echeance').eq('user_id', uid).neq('statut', 'Payée'),
        supabasePro.from('equipe').select('statut,salaire_brut').eq('user_id', uid),
        supabasePro.from('factures_fournisseurs').select('montant_ttc,statut,date_echeance').eq('user_id', uid).neq('statut', 'Payée'),
        supabasePro.from('contrats').select('titre,date_fin,statut').eq('user_id', uid).eq('statut', 'Actif').lte('date_fin', in30).gte('date_fin', today),
        supabasePro.from('formalites').select('titre,date_echeance,statut').eq('user_id', uid).lte('date_echeance', in30),
        supabasePro.from('reminders').select('*').eq('user_id', uid).order('sent_at', { ascending: false }).limit(5),
        // Toutes les dépenses du mois pour la détection d'anomalies
        supabasePro.from('expenses').select('amount_ttc,taux_tva,etablissement,date,type').eq('user_id', uid).gte('date', debut).lte('date', fin),
      ]);

      // Détection d'anomalies
      setAnomalies(detecterAnomalies(toutesDepenses || []));

      const totalRecettes  = (recettes || []).reduce((s, r) => s + Number(r.montant_ttc || r.montant_ht || 0), 0);
      const totalDepenses  = (depenses  || []).reduce((s, d) => s + Number(d.montant_ht || 0) * (1 + Number(d.taux_tva || 20) / 100), 0);
      const factAttente    = (invoices  || []).filter(i => i.statut === 'En attente' || i.statut === 'Envoyée');
      const factRetard     = (invoices  || []).filter(i => i.date_echeance && new Date(i.date_echeance) < new Date());
      const montantAttente = factAttente.reduce((s, i) => s + Number(i.montant_ttc || 0), 0);

      const catMap = {};
      (depenses || []).forEach(d => {
        const cat = d.categorie || 'Autre';
        catMap[cat] = (catMap[cat] || 0) + Number(d.montant_ht || 0) * (1 + Number(d.taux_tva || 20) / 100);
      });
      const depensesParCat = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

      const actifs  = (equipe || []).filter(e => e.statut === 'Actif');
      const conges  = (equipe || []).filter(e => e.statut === 'Congé');
      const masse   = actifs.reduce((s, e) => s + Number(e.salaire_brut || 0), 0);
      const fourniRetard   = (factureFourn || []).filter(f => f.date_echeance && new Date(f.date_echeance) < new Date());
      const montantDuFourn = (factureFourn || []).reduce((s, f) => s + Number(f.montant_ttc || 0), 0);

      const alertes = [];
      factRetard.slice(0, 3).forEach(f => alertes.push({ message: `Facture client en retard — ${euro(f.montant_ttc)}`, type: 'facture', date: f.date_echeance, route: '/pro/recettes' }));
      fourniRetard.slice(0, 2).forEach(f => alertes.push({ message: `Facture fournisseur en retard — ${euro(f.montant_ttc)}`, type: 'facture', date: f.date_echeance, route: '/pro/fournisseurs' }));
      (contrats || []).forEach(c => { const j = daysUntil(c.date_fin); alertes.push({ message: `Contrat "${c.titre}" expire dans ${j}j`, type: 'contrat', date: c.date_fin, route: '/pro/contrats' }); });
      (formalites || []).filter(f => f.statut !== 'Terminé').forEach(f => {
        const j = daysUntil(f.date_echeance);
        alertes.push({ message: j < 0 ? `Formalité en retard : ${f.titre}` : `Formalité dans ${j}j : ${f.titre}`, type: j < 0 ? 'formalite' : 'upcoming', date: f.date_echeance, route: '/pro/formalites' });
      });
      (reminders || []).forEach(r => alertes.push({ message: r.message, type: r.type || 'info', date: r.sent_at }));

      setData({
        recettesMois: totalRecettes, depensesMois: totalDepenses,
        soldeMois: totalRecettes - totalDepenses,
        facturesEnAttente: factAttente.length, montantEnAttente: montantAttente,
        facturesEnRetard: factRetard.length,
        nbActifs: actifs.length, nbConges: conges.length, masseSalariale: masse,
        montantDuFourn, fourniRetard: fourniRetard.length,
        contratsExpirent: contrats || [],
        formalitesEnRetard: (formalites || []).filter(f => f.statut !== 'Terminé' && daysUntil(f.date_echeance) < 0).length,
        formalitesProchaines: (formalites || []).filter(f => f.statut !== 'Terminé' && daysUntil(f.date_echeance) >= 0).length,
        alertes: alertes.slice(0, 8), depensesParCat,
      });
    } catch (e) { console.error('Dashboard error:', e); }
    finally { setLoading(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const moisLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito Sans', sans-serif", color: C.blue, fontSize: 13 }}>
      Chargement du tableau de bord…
    </div>
  );

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif", padding: '32px 28px', maxWidth: 1140, margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: C.dark, margin: 0 }}>
            {greeting}{firstName ? ', ' : ''}<span style={{ color: C.blue, fontStyle: 'italic' }}>{firstName}</span>
          </h1>
          <p style={{ fontSize: 13, color: C.light, marginTop: 4 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {anomalies.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: C.red }}>
              <AlertOctagon size={13} /> {anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''} détectée{anomalies.length > 1 ? 's' : ''}
            </div>
          )}
          {data.facturesEnRetard > 0 && (
            <div onClick={() => navigate('/pro/recettes')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.red }}>
              <AlertTriangle size={13} /> {data.facturesEnRetard} facture{data.facturesEnRetard > 1 ? 's' : ''} en retard
            </div>
          )}
          {data.fourniRetard > 0 && (
            <div onClick={() => navigate('/pro/fournisseurs')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.gold }}>
              <AlertTriangle size={13} /> {data.fourniRetard} fournisseur{data.fourniRetard > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Hero Upload */}
      <HeroUpload navigate={navigate} />

      {/* Anomalies */}
      <AnomaliesPanel anomalies={anomalies} navigate={navigate} />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard icon={TrendingUp}   label={`Recettes ${moisLabel}`}    value={euro(data.recettesMois)}    color={C.green} onClick={() => navigate('/pro/recettes')} />
        <StatCard icon={TrendingDown} label={`Dépenses ${moisLabel}`}    value={euro(data.depensesMois)}    color={C.red}   onClick={() => navigate('/pro/depenses')} />
        <StatCard icon={Wallet}       label="Solde du mois"              value={euro(data.soldeMois)}       color={data.soldeMois >= 0 ? C.blue : C.red} alert={data.soldeMois < 0} />
        <StatCard icon={FileText}     label="En attente de paiement"     value={euro(data.montantEnAttente)} sub={`${data.facturesEnAttente} facture${data.facturesEnAttente > 1 ? 's' : ''}`} color={C.gold} alert={data.facturesEnRetard > 0} onClick={() => navigate('/pro/recettes')} />
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 14, marginBottom: 14 }}>
        <Panel>
          <SectionTitle icon={Bell} label="Alertes & Rappels" color={C.blue} />
          {data.alertes.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8 }}>
              <CheckCircle size={24} color={C.green} style={{ opacity: 0.6 }} />
              <p style={{ fontSize: 12, color: C.light, margin: 0 }}>Aucune alerte en cours</p>
            </div>
          ) : data.alertes.map((a, i) => (
            <AlertRow key={i} message={a.message} type={a.type} date={a.date} onClick={a.route ? () => navigate(a.route) : null} />
          ))}
        </Panel>

        <Panel>
          <SectionTitle icon={BarChart2} label={`Dépenses — ${moisLabel}`} color={C.red} route="/pro/depenses" navigate={navigate} />
          {data.depensesParCat.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8 }}>
              <CheckCircle size={24} color={C.green} style={{ opacity: 0.6 }} />
              <p style={{ fontSize: 12, color: C.light, margin: 0 }}>Aucune dépense ce mois</p>
            </div>
          ) : (
            <>
              {data.depensesParCat.map(([cat, val]) => <ProgressBar key={cat} label={cat} value={val} max={data.depensesMois} color={C.red} />)}
              <div style={{ borderTop: `1px solid ${C.bg}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: C.light }}>Total</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{euro(data.depensesMois)}</span>
              </div>
            </>
          )}
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel>
            <SectionTitle icon={Users} label="Équipe" color={C.purple} route="/pro/equipe" navigate={navigate} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ label: 'Actifs', value: data.nbActifs, color: C.green }, { label: 'Congés', value: data.nbConges, color: C.gold }].map(k => (
                <div key={k.label} style={{ background: C.bg, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: C.light }}>{k.label}</div>
                </div>
              ))}
            </div>
            {data.masseSalariale > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: C.light, display: 'flex', justifyContent: 'space-between' }}>
                <span>Masse salariale</span>
                <span style={{ fontWeight: 700, color: C.dark }}>{euro(data.masseSalariale)}</span>
              </div>
            )}
          </Panel>

          <Panel>
            <SectionTitle icon={ShoppingCart} label="Fournisseurs" color={C.purple} route="/pro/fournisseurs" navigate={navigate} />
            <div style={{ fontSize: 11, color: C.light, display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>Montant dû</span>
              <span style={{ fontWeight: 700, color: C.dark }}>{euro(data.montantDuFourn)}</span>
            </div>
            {data.fourniRetard > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 600, color: C.gold }}>
                <AlertTriangle size={11} /> {data.fourniRetard} en retard
              </div>
            )}
          </Panel>

          <Panel>
            <SectionTitle icon={FileCheck} label="Juridique" color={C.gold} route="/pro/contrats" navigate={navigate} />
            {data.contratsExpirent.length > 0
              ? data.contratsExpirent.slice(0, 2).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                    <span style={{ color: C.dark, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{c.titre}</span>
                    <span style={{ color: C.gold, fontWeight: 700, flexShrink: 0 }}>J-{daysUntil(c.date_fin)}</span>
                  </div>
                ))
              : <p style={{ fontSize: 11, color: C.light, margin: 0 }}>Aucun contrat expirant bientôt</p>
            }
            {data.formalitesEnRetard > 0 && (
              <div onClick={() => navigate('/pro/formalites')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontWeight: 600, color: C.red, cursor: 'pointer', marginTop: 6 }}>
                <AlertTriangle size={11} /> {data.formalitesEnRetard} formalité{data.formalitesEnRetard > 1 ? 's' : ''} en retard
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* Raccourcis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {[
          { label: 'Dépenses',   icon: TrendingDown, color: C.red,    route: '/pro/depenses'   },
          { label: 'Recettes',   icon: TrendingUp,   color: C.green,  route: '/pro/recettes'   },
          { label: 'Banque',     icon: CreditCard,   color: C.blue,   route: '/pro/banque'     },
          { label: 'Pointages',  icon: Clock,        color: C.purple, route: '/pro/pointages'  },
          { label: 'Mail Agent', icon: Mail,         color: C.blue,   route: '/pro/mail-agent' },
          { label: 'Export FEC', icon: FileText,     color: C.gold,   route: '/pro/exports'    },
        ].map(s => {
          const SIcon = s.icon;
          return (
            <div key={s.label} onClick={() => navigate(s.route)} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SIcon size={16} color={s.color} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.dark, textAlign: 'center' }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
