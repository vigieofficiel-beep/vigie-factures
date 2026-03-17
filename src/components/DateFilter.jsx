import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

/**
 * DateFilter — composant réutilisable
 * Props :
 *   onChange({ debut, fin }) — appelé à chaque changement
 *   color — couleur accent
 */

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function getMoisRapides() {
  const now = new Date();
  const result = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      label: `${MOIS[d.getMonth()]} ${d.getFullYear()}`,
      debut: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,
      fin:   new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().split('T')[0],
    });
  }
  return result;
}

const PERIODES_RAPIDES = [
  {
    label: 'Ce mois',
    getRange: () => {
      const now = new Date();
      return {
        debut: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`,
        fin:   new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'Mois dernier',
    getRange: () => {
      const now = new Date();
      const d = new Date(now.getFullYear(), now.getMonth()-1, 1);
      return {
        debut: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`,
        fin:   new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'Ce trimestre',
    getRange: () => {
      const now = new Date();
      const trim = Math.floor(now.getMonth() / 3);
      const debut = new Date(now.getFullYear(), trim * 3, 1);
      const fin   = new Date(now.getFullYear(), trim * 3 + 3, 0);
      return {
        debut: debut.toISOString().split('T')[0],
        fin:   fin.toISOString().split('T')[0],
      };
    },
  },
  {
    label: 'Cette année',
    getRange: () => ({
      debut: `${new Date().getFullYear()}-01-01`,
      fin:   `${new Date().getFullYear()}-12-31`,
    }),
  },
  {
    label: 'Année dernière',
    getRange: () => ({
      debut: `${new Date().getFullYear()-1}-01-01`,
      fin:   `${new Date().getFullYear()-1}-12-31`,
    }),
  },
];

export default function DateFilter({ onChange, color = '#5BA3C7' }) {
  const [open,   setOpen]   = useState(false);
  const [debut,  setDebut]  = useState('');
  const [fin,    setFin]    = useState('');
  const [actif,  setActif]  = useState(null); // label du raccourci actif
  const ref = useRef();
  const moisRapides = getMoisRapides();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const appliquer = (d, f, label = null) => {
    setDebut(d); setFin(f); setActif(label);
    onChange({ debut: d, fin: f });
    setOpen(false);
  };

  const effacer = (e) => {
    e.stopPropagation();
    setDebut(''); setFin(''); setActif(null);
    onChange({ debut: '', fin: '' });
  };

  const hasFilter = debut || fin;
  const labelAffiché = actif
    ? actif
    : debut && fin
    ? `${debut.split('-').reverse().join('/')} → ${fin.split('-').reverse().join('/')}`
    : debut ? `Depuis ${debut.split('-').reverse().join('/')}` 
    : fin   ? `Jusqu'au ${fin.split('-').reverse().join('/')}`
    : 'Toutes les dates';

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>

      {/* Bouton principal */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'8px 14px', borderRadius:9,
          border:`1px solid ${hasFilter ? color : '#E8EAF0'}`,
          background: hasFilter ? `${color}0F` : '#fff',
          color: hasFilter ? color : '#5A6070',
          fontSize:12, fontWeight: hasFilter ? 700 : 500,
          cursor:'pointer', fontFamily:'inherit',
          transition:'all 150ms',
        }}
      >
        <Calendar size={13} color={hasFilter ? color : '#9AA0AE'}/>
        <span>{labelAffiché}</span>
        {hasFilter
          ? <X size={12} onClick={effacer} style={{ cursor:'pointer', opacity:0.7 }}/>
          : <ChevronDown size={12} style={{ transform:open?'rotate(180deg)':'rotate(0)', transition:'transform 150ms' }}/>
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:200,
          background:'#fff', border:'1px solid #E8EAF0', borderRadius:14,
          boxShadow:'0 8px 32px rgba(0,0,0,0.12)', padding:16, width:340,
          animation:'fadeDown 0.15s ease',
        }}>

          {/* Périodes rapides */}
          <div style={{ fontSize:10, fontWeight:700, color:'#9AA0AE', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            Périodes rapides
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
            {PERIODES_RAPIDES.map(p => {
              const r = p.getRange();
              const isActif = actif === p.label;
              return (
                <button key={p.label} onClick={() => appliquer(r.debut, r.fin, p.label)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${isActif ? color : '#E8EAF0'}`, background:isActif?`${color}12`:'#F8F9FB', color:isActif?color:'#5A6070', fontSize:12, fontWeight:isActif?700:400, cursor:'pointer', fontFamily:'inherit', transition:'all 150ms' }}>
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Mois récents */}
          <div style={{ fontSize:10, fontWeight:700, color:'#9AA0AE', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            Par mois
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:14 }}>
            {moisRapides.map(m => {
              const isActif = actif === m.label;
              return (
                <button key={m.label} onClick={() => appliquer(m.debut, m.fin, m.label)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${isActif ? color : '#E8EAF0'}`, background:isActif?`${color}12`:'#F8F9FB', color:isActif?color:'#5A6070', fontSize:12, fontWeight:isActif?700:400, cursor:'pointer', fontFamily:'inherit', transition:'all 150ms' }}>
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Dates libres */}
          <div style={{ fontSize:10, fontWeight:700, color:'#9AA0AE', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
            Période personnalisée
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, color:'#9AA0AE', display:'block', marginBottom:4 }}>Du</label>
              <input
                type="date"
                value={debut}
                onChange={e => setDebut(e.target.value)}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #E8EAF0', fontSize:12, outline:'none', boxSizing:'border-box', colorScheme:'light' }}
              />
            </div>
            <div>
              <label style={{ fontSize:11, color:'#9AA0AE', display:'block', marginBottom:4 }}>Au</label>
              <input
                type="date"
                value={fin}
                onChange={e => setFin(e.target.value)}
                style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid #E8EAF0', fontSize:12, outline:'none', boxSizing:'border-box', colorScheme:'light' }}
              />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => { if (debut || fin) appliquer(debut, fin, null); }}
              disabled={!debut && !fin}
              style={{ flex:1, padding:'9px', borderRadius:9, border:'none', background:(debut||fin)?color:'#E8EAF0', color:(debut||fin)?'#fff':'#9AA0AE', fontSize:12, fontWeight:700, cursor:(debut||fin)?'pointer':'not-allowed', fontFamily:'inherit', transition:'all 150ms' }}>
              Appliquer
            </button>
            <button
              onClick={() => appliquer('', '', null)}
              style={{ padding:'9px 14px', borderRadius:9, border:'1px solid #E8EAF0', background:'#fff', color:'#9AA0AE', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              Effacer
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
