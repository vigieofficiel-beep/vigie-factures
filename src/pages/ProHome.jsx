import { useState, useEffect, useRef, useCallback } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, AlertTriangle, ChevronRight,
  FileCheck, Receipt, Bell, BellOff, X, ChevronDown, ChevronUp,
  Percent, FileText, ClipboardCheck, AlertCircle, CheckCheck,
} from 'lucide-react';
import { analyserTout, URGENCE } from '../agents/AlertesAgent';
import GraphiqueCA from './GraphiqueCA';
import OnboardingChecklist from '../components/OnboardingChecklist';
import { useWorkspace } from '../hooks/useWorkspace.jsx';

const formatEuro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n ?? 0);

const ALERTE_STYLE = {
  critique : { bg: 'rgba(199,91,78,0.08)',  border: 'rgba(199,91,78,0.2)',  color: '#C75B4E', label: 'Urgent'    },
  attention: { bg: 'rgba(212,168,83,0.08)', border: 'rgba(212,168,83,0.15)', color: '#D4A853', label: 'Attention' },
  info     : { bg: 'rgba(91,163,199,0.08)', border: 'rgba(91,163,199,0.2)', color: '#5BA3C7', label: 'Info'      },
};
const ICONE_MAP = { Percent, FileText, ClipboardCheck, AlertCircle, FileCheck };

const TYPE_CONFIG = {
  alerte:   { color: '#C75B4E', bg: 'rgba(199,91,78,0.1)'  },
  info:     { color: '#5BA3C7', bg: 'rgba(91,163,199,0.1)' },
  recette:  { color: '#5BC78A', bg: 'rgba(91,199,138,0.1)' },
  document: { color: '#A85BC7', bg: 'rgba(168,91,199,0.1)' },
};

function timeAgo(date) {
  const diff = Date.now() - date.getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(min / 60);
  const d    = Math.floor(h / 24);
  if (min < 1)  return "À l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (h < 24)   return `il y a ${h}h`;
  return `il y a ${d}j`;
}

function ClocheNotifications({ notifs, setNotifs }) {
  const [open,   setOpen]   = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const btnRef   = useRef(null);
  const panelRef = useRef(null);
  const unread   = notifs.filter(n => !n.lu).length;

  const computeCoords = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const pw = 320, ph = 460;
    let left = r.right - pw;
    let top  = r.bottom + 8;
    if (left < 8) left = 8;
    if (top + ph > window.innerHeight - 8) top = r.top - ph - 8;
    setCoords({ top, left });
  };

  const handleToggle = () => { if (!open) computeCoords(); setOpen(v => !v); };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target))   return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [open]);

  const marquerLu      = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, lu: true } : x));
  const marquerTousLus = ()   => setNotifs(n => n.map(x => ({ ...x, lu: true })));
  const supprimer      = (id) => setNotifs(n => n.filter(x => x.id !== id));

  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} onClick={handleToggle}
        style={{ position:'relative', width:38, height:38, borderRadius:10, background:open?'rgba(91,163,199,0.15)':'rgba(255,255,255,0.06)', border:`1px solid ${open?'rgba(91,163,199,0.4)':'rgba(255,255,255,0.1)'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 150ms ease' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor='rgba(91,163,199,0.3)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}>
        <Bell size={16} color={open ? '#5BA3C7' : 'rgba(237,232,219,0.6)'} strokeWidth={2}/>
        {unread > 0 && (
          <div style={{ position:'absolute', top:-4, right:-4, width:17, height:17, borderRadius:'50%', background:'#C75B4E', border:'2px solid #0F172A', fontSize:8, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </button>
      {open && (
        <div ref={panelRef} style={{ position:'fixed', top:coords.top, left:coords.left, zIndex:9999, width:320, maxHeight:460, background:'rgba(15,23,42,0.98)', backdropFilter:'blur(20px)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:16, boxShadow:'0 20px 60px rgba(0,0,0,0.5)', display:'flex', flexDirection:'column', overflow:'hidden', animation:'notifSlide 0.18s ease' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#F8FAFC' }}>Notifications</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{unread} non lue{unread !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {unread > 0 && (
                <button onClick={marquerTousLus} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(91,163,199,0.1)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'#5BA3C7', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                  <CheckCheck size={12}/> Tout lire
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:6, padding:4, cursor:'pointer', color:'rgba(255,255,255,0.4)', display:'flex' }}>
                <X size={14}/>
              </button>
            </div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:8 }}>
            {notifs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,0.25)' }}>
                <Bell size={32} style={{ marginBottom:12, opacity:0.3 }}/>
                <div style={{ fontSize:13 }}>Aucune notification</div>
              </div>
            ) : notifs.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              return (
                <div key={n.id} onClick={() => marquerLu(n.id)}
                  style={{ display:'flex', gap:10, padding:10, borderRadius:10, marginBottom:4, cursor:'pointer', background:n.lu?'transparent':'rgba(91,163,199,0.05)', border:`1px solid ${n.lu?'transparent':'rgba(91,163,199,0.1)'}`, transition:'all 150ms ease' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background=n.lu?'transparent':'rgba(91,163,199,0.05)'}>
                  <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Bell size={14} color={cfg.color}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                      <span style={{ fontSize:12, fontWeight:n.lu?500:700, color:n.lu?'rgba(255,255,255,0.5)':'#F8FAFC', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.titre}</span>
                      {!n.lu && <div style={{ width:6, height:6, borderRadius:'50%', background:'#5BA3C7', flexShrink:0 }}/>}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.4, marginBottom:4 }}>{n.message}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>{timeAgo(n.date)}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); supprimer(n.id); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', padding:2, flexShrink:0, display:'flex', alignItems:'center' }}
                    onMouseEnter={e => e.currentTarget.style.color='#C75B4E'}
                    onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.2)'}>
                    <X size={12}/>
                  </button>
                </div>
              );
            })}
          </div>
          {notifs.length > 0 && (
            <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.07)', textAlign:'center', flexShrink:0 }}>
              <button onClick={() => setNotifs([])} style={{ fontSize:11, color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                Effacer toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes notifSlide { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}

function BandeauAlertes({ alertes, onDismiss }) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('alertes_dismissed') || '[]'); } catch { return []; }
  });
  const visibles  = alertes.filter(a => !dismissed.includes(a.id));
  const critiques = visibles.filter(a => a.niveau === URGENCE.CRITIQUE).length;

  const dismissOne = (id) => { const next = [...dismissed, id]; setDismissed(next); try { sessionStorage.setItem('alertes_dismissed', JSON.stringify(next)); } catch {} };
  const dismissAll = () => { const next = alertes.map(a => a.id); setDismissed(next); try { sessionStorage.setItem('alertes_dismissed', JSON.stringify(next)); } catch {} if (onDismiss) onDismiss(); };

  if (visibles.length === 0) return null;

  return (
    <div style={{ background:critiques>0?'rgba(199,91,78,0.08)':'rgba(212,168,83,0.08)', border:`1px solid ${critiques>0?'rgba(199,91,78,0.2)':'rgba(212,168,83,0.15)'}`, borderRadius:14, marginBottom:24, overflow:'hidden' }}>
      <div onClick={() => setCollapsed(c => !c)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer' }}>
        <Bell size={15} color={critiques>0?'#C75B4E':'#D4A853'}/>
        <span style={{ fontSize:13, fontWeight:700, color:critiques>0?'#C75B4E':'#D4A853', flex:1 }}>
          {visibles.length} alerte{visibles.length>1?'s':''} en attente
          {critiques>0 && <span style={{ fontSize:11, fontWeight:600, marginLeft:8, background:'rgba(199,91,78,0.15)', color:'#C75B4E', padding:'2px 7px', borderRadius:20 }}>{critiques} urgent{critiques>1?'es':'e'}</span>}
        </span>
        <button onClick={e => { e.stopPropagation(); dismissAll(); }} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(237,232,219,0.4)', fontSize:11, display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:6 }}>
          <BellOff size={11}/> Tout ignorer
        </button>
        {collapsed ? <ChevronDown size={14} color="rgba(237,232,219,0.4)"/> : <ChevronUp size={14} color="rgba(237,232,219,0.4)"/>}
      </div>
      {!collapsed && (
        <div style={{ padding:'8px 16px 12px' }}>
          {visibles.map(a => {
            const s = ALERTE_STYLE[a.niveau];
            const Icon = ICONE_MAP[a.icone] || AlertTriangle;
            return (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, background:s.bg, border:`1px solid ${s.border}`, borderRadius:9, padding:'9px 12px', marginBottom:6 }}>
                <div style={{ width:26, height:26, borderRadius:7, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={13} color={s.color}/>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:s.color }}>{a.titre}</div>
                  {a.detail && <div style={{ fontSize:11, color:'rgba(237,232,219,0.4)', marginTop:1 }}>{a.detail}</div>}
                </div>
                <span style={{ fontSize:10, fontWeight:700, color:s.color, background:`${s.color}15`, padding:'2px 8px', borderRadius:20, flexShrink:0 }}>{s.label}</span>
                <a href={a.lien} style={{ color:'rgba(237,232,219,0.4)', flexShrink:0 }}><ChevronRight size={13}/></a>
                <button onClick={() => dismissOne(a.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(237,232,219,0.3)', padding:2, display:'flex', flexShrink:0 }}><X size={11}/></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function detecterAnomalies(expenses) {
  const anomalies = [];
  if (!expenses || expenses.length === 0) return anomalies;
  const montants = expenses.map(e => e.amount_ttc).filter(Boolean);
  const moyenne  = montants.reduce((a, b) => a + b, 0) / montants.length;
  const vus = new Set();
  expenses.forEach(e => {
    const cle = `${e.etablissement}-${e.amount_ttc}-${e.date}`;
    if (vus.has(cle)) anomalies.push({ type:'doublon', message:`Doublon détecté : ${e.etablissement} (${e.amount_ttc}€)` });
    else vus.add(cle);
    if (e.amount_ttc > moyenne * 3 && moyenne > 0) anomalies.push({ type:'montant', message:`Montant inhabituel : ${e.etablissement} → ${e.amount_ttc}€ (moy. ${Math.round(moyenne)}€)` });
    if (!e.etablissement && e.amount_ttc > 50) anomalies.push({ type:'manquant', message:`Fournisseur manquant pour une dépense de ${e.amount_ttc}€` });
  });
  return anomalies;
}

export default function ProHome() {
  const [expenses,      setExpenses]      = useState([]);
  const [devis,         setDevis]         = useState([]);
  const [contrats,      setContrats]      = useState([]);
  const [formalites,    setFormalites]    = useState([]);
  const [alertes,       setAlertes]       = useState([]);
  const [anomalies,     setAnomalies]     = useState([]);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [loading,       setLoading]       = useState(true);
  const [profil,        setProfil]        = useState({});
  const [notifs,        setNotifs]        = useState([]);
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();

  // FIX : fetchAll exposé via useCallback pour être appelé après OCR
  const fetchAll = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);

    const { data: { session } } = await supabasePro.auth.getSession();
    const user = session?.user;
    if (!user) { setLoading(false); return; }

    let qExp = supabasePro.from('expenses').select('amount_ttc, type, etablissement, date, notes').eq('user_id', user.id).order('date', { ascending: false }).limit(50);
    if (activeWorkspace?.id) qExp = qExp.eq('workspace_id', activeWorkspace.id);

    let qDev = supabasePro.from('devis').select('*, clients(nom)').eq('user_id', user.id);
    if (activeWorkspace?.id) qDev = qDev.eq('workspace_id', activeWorkspace.id);

    const [{ data: exp }, { data: dev }, { data: cont }, { data: form }, { data: prof }] = await Promise.all([
      qExp, qDev,
      supabasePro.from('contrats').select('*').eq('user_id', user.id),
      supabasePro.from('formalites').select('*').eq('user_id', user.id),
      supabasePro.from('user_profiles').select('company_name, first_name').eq('id', user.id).single(),
    ]);

    setExpenses(exp || []); setDevis(dev || []); setContrats(cont || []); setFormalites(form || []);
    setAnomalies(detecterAnomalies(exp || []));
    setAlertes(analyserTout({ contrats: cont || [], devis: dev || [], formalites: form || [], regimeTVA: 'mensuel' }));
    setProfil(prof || {});
    setLoading(false);
  }, [activeWorkspace]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // FIX : écouter l'événement OCR enregistré pour rafraîchir le dashboard
  useEffect(() => {
    const handler = () => fetchAll();
    window.addEventListener('vigie_document_saved', handler);
    return () => window.removeEventListener('vigie_document_saved', handler);
  }, [fetchAll]);

  const totalDepenses  = expenses.reduce((s, e) => s + (e.amount_ttc || 0), 0);
  const totalRecettes  = devis.filter(d => d.statut === 'encaisse').reduce((s, d) => s + (d.montant_ttc || 0), 0);
  const devisEnAttente = devis.filter(d => d.statut === 'envoye' || d.statut === 'signe').length;
  const contratsActifs = contrats.filter(c => c.statut === 'actif' || !c.statut).length;
  const depensesByType = expenses.reduce((acc, e) => { const t = e.type || 'Autre'; acc[t] = (acc[t] || 0) + (e.amount_ttc || 0); return acc; }, {});
  const critiques      = alertes.filter(a => a.niveau === URGENCE.CRITIQUE).length;
  const nomBureau      = activeWorkspace?.name || profil.company_name || (profil.first_name ? `Bureau de ${profil.first_name}` : 'Bureau');

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'rgba(237,232,219,0.4)', fontSize:14 }}>Chargement…</div>
  );

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:1000, margin:'0 auto' }}>

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28 }}>
        <div>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:600, color:'#EDE8DB', margin:0 }}>{nomBureau}</h1>
          <p style={{ fontSize:13, color:'rgba(237,232,219,0.4)', marginTop:4, marginBottom:0 }}>
            Vue d'ensemble de votre activité
            {critiques > 0 && <span style={{ marginLeft:10, color:'#C75B4E', fontWeight:700 }}>· {critiques} alerte{critiques>1?'s':''} urgente{critiques>1?'s':''}</span>}
          </p>
        </div>
        <ClocheNotifications notifs={notifs} setNotifs={setNotifs}/>
      </div>

      <div style={{ marginBottom:24, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, overflow:'hidden' }}>
        <GraphiqueCA compact={true}/>
      </div>

      {alertes.length > 0 && <BandeauAlertes alertes={alertes} onDismiss={() => setAlertes([])}/>}

      {anomalies.length > 0 && showAnomalies && (
        <div style={{ background:'rgba(199,91,78,0.06)', border:'1px solid rgba(199,91,78,0.25)', borderRadius:14, marginBottom:24, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px' }}>
            <AlertTriangle size={15} color="#C75B4E"/>
            <span style={{ fontSize:13, fontWeight:700, color:'#C75B4E', flex:1 }}>{anomalies.length} anomalie{anomalies.length>1?'s':''} détectée{anomalies.length>1?'s':''}</span>
            <button onClick={() => setShowAnomalies(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(237,232,219,0.3)', padding:2, display:'flex' }}><X size={13}/></button>
          </div>
          <div style={{ padding:'8px 16px 12px' }}>
            {anomalies.map((a, i) => (
              <div key={i} style={{ fontSize:12, color:'#C75B4E', padding:'5px 0', borderBottom:i<anomalies.length-1?'1px solid rgba(199,91,78,0.1)':'none' }}>⚠️ {a.message}</div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginBottom:28 }}>
        {[
          { label:'Dépenses (mois)',     value:formatEuro(totalDepenses), color:'#C75B4E', icon:TrendingDown, action:() => navigate('/pro/depenses') },
          { label:'Recettes encaissées', value:formatEuro(totalRecettes), color:'#5BC78A', icon:TrendingUp,   action:() => navigate('/pro/recettes?statut=encaisse') },
          { label:'Devis en attente',    value:devisEnAttente,            color:'#5BC78A', icon:Receipt,      action:() => navigate('/pro/recettes') },
          { label:'Contrats actifs',     value:contratsActifs,            color:'#5BA3C7', icon:FileCheck,    action:() => navigate('/pro/contrats') },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} onClick={s.action}
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'18px 20px', cursor:'pointer', transition:'all 120ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'; e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <p style={{ fontSize:11, color:'rgba(237,232,219,0.4)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', margin:0 }}>{s.label}</p>
                <Icon size={15} color={s.color}/>
              </div>
              <p style={{ fontSize:24, fontWeight:700, color:s.color, margin:0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {Object.keys(depensesByType).length > 0 && (
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:22, marginBottom:20 }}>
          <h2 style={{ fontSize:13, fontWeight:700, color:'rgba(237,232,219,0.6)', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 16px' }}>Dépenses par catégorie</h2>
          {Object.entries(depensesByType).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([type, total]) => {
            const max = Math.max(...Object.values(depensesByType));
            const pct = Math.round((total / max) * 100);
            return (
              <div key={type} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:12, color:'rgba(237,232,219,0.5)', fontWeight:500 }}>{type}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#EDE8DB' }}>{formatEuro(total)}</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${pct}%`, height:'100%', background:'linear-gradient(90deg, #5BA3C7, #5BC78A)', borderRadius:3, transition:'width 0.6s ease' }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
        {[
          { label:'Nouvelle dépense',  color:'#5BC78A', path:'/pro/depenses'   },
          { label:'Nouveau devis',     color:'#5BA3C7', path:'/pro/recettes'   },
          { label:'Voir les contrats', color:'#5BC78A', path:'/pro/contrats'   },
          { label:'Formalités',        color:'#A85BC7', path:'/pro/formalites' },
        ].map(r => (
          <button key={r.label} onClick={() => navigate(r.path)}
            style={{ padding:'13px 18px', borderRadius:11, border:`1px solid ${r.color}40`, background:`${r.color}10`, color:r.color, fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all 150ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.background=`${r.color}20`; e.currentTarget.style.borderColor=`${r.color}60`; }}
            onMouseLeave={e => { e.currentTarget.style.background=`${r.color}10`; e.currentTarget.style.borderColor=`${r.color}40`; }}>
            {r.label} <ChevronRight size={14}/>
          </button>
        ))}
      </div>
      <OnboardingChecklist/>
    </div>
  );
}
