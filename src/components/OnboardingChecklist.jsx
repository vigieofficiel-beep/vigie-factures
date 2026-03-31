import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, Circle, ChevronRight, Rocket } from 'lucide-react';

const ETAPES = [
  { id:'profil',    titre:'Compléter mon profil',          description:'Ajoutez votre SIRET, adresse et IBAN pour les devis et factures.', route:'/pro/profil',    emoji:'👤', important:true  },
  { id:'depense',   titre:'Ajouter ma première dépense',   description:'Enregistrez une dépense pour découvrir le module.',               route:'/pro/depenses',  emoji:'🧾', important:true  },
  { id:'devis',     titre:'Créer mon premier document',    description:'Générez un document commercial PDF professionnel en quelques clics.', route:'/pro/recettes', emoji:'📋', important:true  },
  { id:'banque',    titre:'Importer un relevé bancaire',   description:'Connectez votre banque via import CSV pour le rapprochement.',     route:'/pro/banque',    emoji:'🏦', important:false },
  { id:'contrat',   titre:'Ajouter un contrat',            description:'Suivez vos échéances et recevez des alertes automatiques.',        route:'/pro/contrats',  emoji:'📄', important:false },
  { id:'formalite', titre:'Vérifier mes obligations',      description:'Consultez vos formalités obligatoires et leurs échéances.',        route:'/pro/formalites',emoji:'⚖️', important:false },
  { id:'vigil',     titre:'Poser une question à Vigil',    description:"Testez votre assistant en bas à droite de l'écran.",              route:null,             emoji:'🤖', important:false },
];

const CLE_STORAGE = 'vigie_onboarding_v1';

export default function OnboardingChecklist() {
  const navigate = useNavigate();
  const [visible,   setVisible]   = useState(false);
  const [checked,   setChecked]   = useState({});
  const [minimise,  setMinimise]  = useState(false);
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(CLE_STORAGE) || '{}');
      if (data.ferme) return;
      setChecked(data.checked || {});
      setVisible(true);
    } catch { setVisible(true); }
  }, []);

  const sauvegarder = (newChecked, ferme = false) => {
    try { localStorage.setItem(CLE_STORAGE, JSON.stringify({ checked: newChecked, ferme })); } catch {}
  };

  const toggleCheck = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next); sauvegarder(next);
  };

  const fermerDefinitivement = () => { sauvegarder(checked, true); setVisible(false); };

  const allerVers = (etape) => {
    if (!checked[etape.id]) { const next = { ...checked, [etape.id]: true }; setChecked(next); sauvegarder(next); }
    if (etape.route) navigate(etape.route);
  };

  if (!visible) return null;

  const total   = ETAPES.length;
  const done    = ETAPES.filter(e => checked[e.id]).length;
  const pct     = Math.round((done / total) * 100);
  const termine = done === total;

  const bottomOffset = isMobile ? 80 : 24;

  if (minimise) {
    return (
      <div onClick={() => setMinimise(false)}
        style={{ position:'fixed', bottom: bottomOffset, left:24, zIndex:900, background:'linear-gradient(135deg, #1E293B, #0F172A)', border:'1px solid rgba(91,163,199,0.3)', borderRadius:14, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', boxShadow:'0 8px 24px rgba(0,0,0,0.3)', animation:'fadeUp 0.2s ease' }}>
        <Rocket size={16} color="#5BA3C7"/>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#F8FAFC' }}>Guide de démarrage</div>
          <div style={{ fontSize:10, color:'#94A3B8' }}>{done}/{total} étapes complétées</div>
        </div>
        <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(91,163,199,0.1)', border:'2px solid rgba(91,163,199,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:11, fontWeight:800, color:'#5BA3C7' }}>{pct}%</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:'fixed', bottom: bottomOffset, left:24, zIndex:900, width: isMobile ? 'calc(100vw - 48px)' : 340, maxHeight: isMobile ? '60vh' : '75vh', background:'rgba(15,23,42,0.97)', backdropFilter:'blur(20px)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:20, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.4)', display:'flex', flexDirection:'column', animation:'fadeUp 0.25s ease', fontFamily:"'Nunito Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ padding:'16px 18px', background:'linear-gradient(135deg, rgba(91,163,199,0.15), rgba(91,163,199,0.05))', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Rocket size={16} color="#5BA3C7"/>
            <span style={{ fontSize:14, fontWeight:700, color:'#F8FAFC' }}>{termine ? '🎉 Félicitations !' : 'Guide de démarrage'}</span>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setMinimise(true)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'#94A3B8', fontSize:11 }}>Réduire</button>
            <button onClick={fermerDefinitivement} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:6, padding:4, cursor:'pointer', color:'#94A3B8', display:'flex' }}><X size={14}/></button>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ flex:1, height:6, background:'rgba(255,255,255,0.08)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background:termine?'linear-gradient(90deg, #5BC78A, #3da86a)':'linear-gradient(90deg, #5BA3C7, #3d7fa8)', borderRadius:3, transition:'width 0.5s ease' }}/>
          </div>
          <span style={{ fontSize:12, fontWeight:700, color:termine?'#5BC78A':'#5BA3C7', whiteSpace:'nowrap' }}>{done}/{total}</span>
        </div>
        {termine && <p style={{ fontSize:12, color:'#5BC78A', marginTop:8, marginBottom:0 }}>Vigie Pro est prêt. 🚀</p>}
      </div>

      {/* Liste */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
        {ETAPES.map((etape) => {
          const fait = !!checked[etape.id];
          return (
            <div key={etape.id}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px', borderRadius:12, marginBottom:4, background:fait?'rgba(91,199,138,0.05)':'rgba(255,255,255,0.03)', border:`1px solid ${fait?'rgba(91,199,138,0.15)':'rgba(255,255,255,0.06)'}`, cursor:'pointer', transition:'all 150ms ease', opacity:fait?0.7:1 }}
              onMouseEnter={e => e.currentTarget.style.background=fait?'rgba(91,199,138,0.08)':'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background=fait?'rgba(91,199,138,0.05)':'rgba(255,255,255,0.03)'}>
              <button onClick={() => toggleCheck(etape.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', flexShrink:0 }}>
                {fait ? <CheckCircle size={20} color="#5BC78A" strokeWidth={2}/> : <Circle size={20} color="rgba(255,255,255,0.2)" strokeWidth={2}/>}
              </button>
              <div style={{ flex:1, minWidth:0 }} onClick={() => allerVers(etape)}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:14 }}>{etape.emoji}</span>
                  <span style={{ fontSize:12, fontWeight:fait?500:700, color:fait?'rgba(255,255,255,0.4)':'#F8FAFC', textDecoration:fait?'line-through':'none' }}>{etape.titre}</span>
                  {etape.important && !fait && <span style={{ fontSize:9, fontWeight:700, color:'#5BC78A', background:'rgba(212,168,83,0.15)', borderRadius:4, padding:'1px 5px' }}>PRIORITÉ</span>}
                </div>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.35)', margin:'2px 0 0', lineHeight:1.4 }}>{etape.description}</p>
              </div>
              {etape.route && !fait && <ChevronRight size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink:0 }}/>}
            </div>
          );
        })}
      </div>

      <div style={{ padding:'10px 16px', borderTop:'1px solid rgba(255,255,255,0.06)', textAlign:'center' }}>
        <button onClick={fermerDefinitivement} style={{ fontSize:11, color:'rgba(255,255,255,0.25)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Ne plus afficher ce guide</button>
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
