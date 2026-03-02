import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';
import {
  AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown,
  FileText, Bell, CreditCard, Users, ShoppingCart,
  FileCheck, Mail, BarChart2, ArrowRight, Wallet,
} from 'lucide-react';

// ─── Couleurs piliers ─────────────────────────────────────────────────
const C = {
  blue:   '#5BA3C7',
  green:  '#5BC78A',
  gold:   '#D4A853',
  purple: '#A85BC7',
  red:    '#C75B4E',
  dark:   '#1A1C20',
  gray:   '#9AA0AE',
  border: '#E8EAF0',
  bg:     '#F8FAFC',
};

// ─── Helpers ──────────────────────────────────────────────────────────
const euro = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const fdate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
const daysUntil = (d) => { if (!d) return null; return Math.ceil((new Date(d) - new Date()) / 86400000); };
const moisCourant = () => { const n = new Date(); return { debut: `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-01`, fin: new Date(n.getFullYear(), n.getMonth()+1, 0).toISOString().split('T')[0] }; };

// ─── StatCard ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, alert, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: `1px solid ${alert ? 'rgba(199,91,78,0.35)' : C.border}`,
        borderRadius: 14, padding: '18px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.10)' : alert ? '0 2px 12px rgba(199,91,78,0.08)' : '0 1px 4px rgba(0,0,0,0.06)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s, transform 0.15s',
        transform: hov && onClick ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.gray, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} strokeWidth={2} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: alert ? C.red : C.dark, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.gray }}>{sub}</div>}
    </div>
  );
}

// ─── Section titre ────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, label, color, route, navigate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={color} strokeWidth={2} />
        </div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</h2>
      </div>
      {route && (
        <button onClick={() => navigate(route)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: color, fontSize: 11, fontWeight: 600 }}>
          Voir tout <ArrowRight size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Panel card ───────────────────────────────────────────────────────
function Panel({ children, style = {} }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  );
}

// ─── Alerte row ───────────────────────────────────────────────────────
function AlertRow({ message, type, date, onClick }) {
  const colors = { overdue: C.red, upcoming: C.gold, info: C.blue, contrat: C.gold, facture: C.red, formalite: C.purple };
  const c = colors[type] || C.gray;
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.bg}`, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: C.dark, margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{message}</p>
        {date && <p style={{ fontSize: 10, color: C.gray, margin: '2px 0 0' }}>{fdate(date)}</p>}
      </div>
    </div>
  );
}

// ─── Barre de progression ─────────────────────────────────────────────
function ProgressBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: C.dark, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, color: C.gray }}>{euro(value)}</span>
      </div>
      <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════
export default function ProHome() {
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading]     = useState(true);
  const [data, setData]           = useState({
    // Trésorerie
    recettesMois: 0, depensesMois: 0, soldeMois: 0,
    facturesEnAttente: 0, montantEnAttente: 0,
    facturesEnRetard: 0,
    // Équipe
    nbActifs: 0, nbConges: 0, masseSalariale: 0,
    // Fournisseurs
    facturesFourn: 0, montantDuFourn: 0, fourniRetard: 0,
    // Contrats
    contratsExpirent: [],
    // Formalités
    formalitesEnRetard: 0, formalitesProchaines: 0,
    // Alertes consolidées
    alertes: [],
    // Dépenses par catégorie
    depensesParCat: [],
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
        { data: recettes },
        { data: depenses },
        { data: invoices },
        { data: equipe },
        { data: factureFourn },
        { data: contrats },
        { data: formalites },
        { data: reminders },
      ] = await Promise.all([
        supabasePro.from('invoices').select('montant_ht, taux_tva, montant_ttc, statut, date, date_echeance').eq('user_id', uid).gte('date', debut).lte('date', fin),
        supabasePro.from('expenses').select('montant_ht, taux_tva, categorie, date').eq('user_id', uid).gte('date', debut).lte('date', fin),
        supabasePro.from('invoices').select('montant_ttc, statut, date_echeance').eq('user_id', uid).neq('statut', 'Payée'),
        supabasePro.from('equipe').select('statut, salaire_brut').eq('user_id', uid),
        supabasePro.from('factures_fournisseurs').select('montant_ttc, statut, date_echeance').eq('user_id', uid).neq('statut', 'Payée'),
        supabasePro.from('contrats').select('titre, date_fin, statut').eq('user_id', uid).eq('statut', 'Actif').lte('date_fin', in30).gte('date_fin', today),
        supabasePro.from('formalites').select('titre, date_echeance, statut').eq('user_id', uid).lte('date_echeance', in30),
        supabasePro.from('reminders').select('*').eq('user_id', uid).order('sent_at', { ascending: false }).limit(5),
      ]);

      // ── Trésorerie
      const totalRecettes  = (recettes || []).reduce((s, r) => s + Number(r.montant_ttc || r.montant_ht || 0), 0);
      const totalDepenses  = (depenses  || []).reduce((s, d) => s + Number(d.montant_ht || 0) * (1 + Number(d.taux_tva || 20) / 100), 0);
      const factAttente    = (invoices  || []).filter(i => i.statut === 'En attente' || i.statut === 'Envoyée');
      const factRetard     = (invoices  || []).filter(i => i.date_echeance && new Date(i.date_echeance) < new Date());
      const montantAttente = factAttente.reduce((s, i) => s + Number(i.montant_ttc || 0), 0);

      // ── Dépenses par catégorie
      const catMap = {};
      (depenses || []).forEach(d => {
        const cat = d.categorie || 'Autre';
        const ttc = Number(d.montant_ht || 0) * (1 + Number(d.taux_tva || 20) / 100);
        catMap[cat] = (catMap[cat] || 0) + ttc;
      });
      const depensesParCat = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

      // ── Équipe
      const actifs  = (equipe || []).filter(e => e.statut === 'Actif');
      const conges  = (equipe || []).filter(e => e.statut === 'Congé');
      const masse   = actifs.reduce((s, e) => s + Number(e.salaire_brut || 0), 0);

      // ── Fournisseurs
      const fourniRetard   = (factureFourn || []).filter(f => f.date_echeance && new Date(f.date_echeance) < new Date());
      const montantDuFourn = (factureFourn || []).reduce((s, f) => s + Number(f.montant_ttc || 0), 0);

      // ── Alertes consolidées
      const alertes = [];
      factRetard.slice(0, 3).forEach(f => alertes.push({ message: `Facture client en retard — ${euro(f.montant_ttc)}`, type: 'facture', date: f.date_echeance, route: '/pro/recettes' }));
      fourniRetard.slice(0, 2).forEach(f => alertes.push({ message: `Facture fournisseur en retard — ${euro(f.montant_ttc)}`, type: 'facture', date: f.date_echeance, route: '/pro/fournisseurs' }));
      (contrats || []).forEach(c => { const j = daysUntil(c.date_fin); alertes.push({ message: `Contrat "${c.titre}" expire dans ${j}j`, type: 'contrat', date: c.date_fin, route: '/pro/contrats' }); });
      (formalites || []).filter(f => f.statut !== 'Terminé').forEach(f => { const j = daysUntil(f.date_echeance); if (j < 0) alertes.push({ message: `Formalité en retard : ${f.titre}`, type: 'formalite', date: f.date_echeance, route: '/pro/formalites' }); else alertes.push({ message: `Formalité dans ${j}j : ${f.titre}`, type: 'upcoming', date: f.date_echeance, route: '/pro/formalites' }); });
      (reminders || []).forEach(r => alertes.push({ message: r.message, type: r.type || 'info', date: r.sent_at }));

      setData({
        recettesMois: totalRecettes,
        depensesMois: totalDepenses,
        soldeMois: totalRecettes - totalDepenses,
        facturesEnAttente: factAttente.length,
        montantEnAttente: montantAttente,
        facturesEnRetard: factRetard.length,
        nbActifs: actifs.length,
        nbConges: conges.length,
        masseSalariale: masse,
        facturesFourn: factureFourn?.length || 0,
        montantDuFourn,
        fourniRetard: fourniRetard.length,
        contratsExpirent: contrats || [],
        formalitesEnRetard: (formalites || []).filter(f => f.statut !== 'Terminé' && daysUntil(f.date_echeance) < 0).length,
        formalitesProchaines: (formalites || []).filter(f => f.statut !== 'Terminé' && daysUntil(f.date_echeance) >= 0).length,
        alertes: alertes.slice(0, 8),
        depensesParCat,
      });

    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const moisLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito Sans', sans-serif", color: C.blue, fontSize: 13 }}>
      Chargement du tableau de bord…
    </div>
  );

  const totalAlertes = data.alertes.length;

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif", padding: '32px 28px', maxWidth: 1140, margin: '0 auto' }}>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: C.dark, margin: 0 }}>
            {greeting}{firstName ? `, ` : ''}<span style={{ color: C.blue, fontStyle: 'italic' }}>{firstName}</span>
          </h1>
          <p style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
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

      {/* ── KPIs Trésorerie du mois ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon={TrendingUp}   label={`Recettes ${moisLabel}`} value={euro(data.recettesMois)} color={C.green}  onClick={() => navigate('/pro/recettes')} />
        <StatCard icon={TrendingDown} label={`Dépenses ${moisLabel}`} value={euro(data.depensesMois)} color={C.red}    onClick={() => navigate('/pro/depenses')} />
        <StatCard icon={Wallet}       label="Solde du mois"           value={euro(data.soldeMois)}    color={data.soldeMois >= 0 ? C.blue : C.red} alert={data.soldeMois < 0} />
        <StatCard icon={FileText}     label="En attente de paiement"  value={euro(data.montantEnAttente)} sub={`${data.facturesEnAttente} facture${data.facturesEnAttente > 1 ? 's' : ''}`} color={C.gold} alert={data.facturesEnRetard > 0} onClick={() => navigate('/pro/recettes')} />
      </div>

      {/* ── Grille principale ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 340px', gap: 16, marginBottom: 16 }}>

        {/* Alertes */}
        <Panel>
          <SectionTitle icon={Bell} label="Alertes & Rappels" color={C.blue} />
          {totalAlertes === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8 }}>
              <CheckCircle size={26} color={C.green} style={{ opacity: 0.6 }} />
              <p style={{ fontSize: 13, color: C.gray, margin: 0 }}>Aucune alerte en cours</p>
            </div>
          ) : (
            data.alertes.map((a, i) => (
              <AlertRow key={i} message={a.message} type={a.type} date={a.date} onClick={a.route ? () => navigate(a.route) : null} />
            ))
          )}
        </Panel>

        {/* Dépenses par catégorie */}
        <Panel>
          <SectionTitle icon={BarChart2} label={`Dépenses par catégorie — ${moisLabel}`} color={C.red} route="/pro/depenses" navigate={navigate} />
          {data.depensesParCat.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', gap: 8 }}>
              <CheckCircle size={26} color={C.green} style={{ opacity: 0.6 }} />
              <p style={{ fontSize: 13, color: C.gray, margin: 0 }}>Aucune dépense ce mois</p>
            </div>
          ) : (
            <>
              {data.depensesParCat.map(([cat, val]) => (
                <ProgressBar key={cat} label={cat} value={val} max={data.depensesMois} color={C.red} />
              ))}
              <div style={{ borderTop: `1px solid ${C.bg}`, marginTop: 12, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: C.gray }}>Total dépenses</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{euro(data.depensesMois)}</span>
              </div>
            </>
          )}
        </Panel>

        {/* Colonne droite : Équipe + Fournisseurs + Juridique */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Équipe */}
          <Panel>
            <SectionTitle icon={Users} label="Équipe" color={C.purple} route="/pro/equipe" navigate={navigate} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Actifs', value: data.nbActifs, color: C.green },
                { label: 'En congé', value: data.nbConges, color: C.gold },
              ].map(k => (
                <div key={k.label} style={{ background: C.bg, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: C.gray }}>{k.label}</div>
                </div>
              ))}
            </div>
            {data.masseSalariale > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: C.gray, display: 'flex', justifyContent: 'space-between' }}>
                <span>Masse salariale</span>
                <span style={{ fontWeight: 700, color: C.dark }}>{euro(data.masseSalariale)}/mois</span>
              </div>
            )}
          </Panel>

          {/* Fournisseurs */}
          <Panel>
            <SectionTitle icon={ShoppingCart} label="Fournisseurs" color={C.purple} route="/pro/fournisseurs" navigate={navigate} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: C.gray }}>Factures en attente</span>
                <span style={{ fontWeight: 700, color: C.dark }}>{euro(data.montantDuFourn)}</span>
              </div>
              {data.fourniRetard > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, color: C.gold }}>
                  <AlertTriangle size={12} /> {data.fourniRetard} facture{data.fourniRetard > 1 ? 's' : ''} en retard
                </div>
              )}
            </div>
          </Panel>

          {/* Juridique */}
          <Panel>
            <SectionTitle icon={FileCheck} label="Juridique" color={C.gold} route="/pro/contrats" navigate={navigate} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.contratsExpirent.length > 0 ? (
                data.contratsExpirent.slice(0, 2).map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ color: C.dark, fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre}</span>
                    <span style={{ color: C.gold, fontWeight: 700, flexShrink: 0 }}>J-{daysUntil(c.date_fin)}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12, color: C.gray }}>Aucun contrat expirant bientôt</div>
              )}
              {data.formalitesEnRetard > 0 && (
                <div onClick={() => navigate('/pro/formalites')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fee2e2', borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, color: C.red, cursor: 'pointer', marginTop: 4 }}>
                  <AlertTriangle size={12} /> {data.formalitesEnRetard} formalité{data.formalitesEnRetard > 1 ? 's' : ''} en retard
                </div>
              )}
              {data.formalitesProchaines > 0 && (
                <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
                  {data.formalitesProchaines} formalité{data.formalitesProchaines > 1 ? 's' : ''} dans les 30 prochains jours
                </div>
              )}
            </div>
          </Panel>

        </div>
      </div>

      {/* ── Raccourcis modules ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginTop: 8 }}>
        {[
          { label: 'Dépenses',     icon: TrendingDown, color: C.red,    route: '/pro/depenses'    },
          { label: 'Recettes',     icon: TrendingUp,   color: C.green,  route: '/pro/recettes'    },
          { label: 'Banque',       icon: CreditCard,   color: C.blue,   route: '/pro/banque'      },
          { label: 'Pointages',    icon: Clock,        color: C.purple, route: '/pro/pointages'   },
          { label: 'Mail Agent',   icon: Mail,         color: C.blue,   route: '/pro/mail-agent'  },
          { label: 'Export FEC',   icon: FileText,     color: C.gold,   route: '/pro/exports'     },
        ].map(s => {
          const SIcon = s.icon;
          return (
            <div key={s.label} onClick={() => navigate(s.route)} style={{
              background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
              padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
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
