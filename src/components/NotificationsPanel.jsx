import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Info, FileText, TrendingUp } from 'lucide-react';

const TYPE_CONFIG = {
  alerte:   { icon: AlertTriangle, color: '#C75B4E', bg: 'rgba(199,91,78,0.1)'  },
  info:     { icon: Info,          color: '#5BA3C7', bg: 'rgba(91,163,199,0.1)' },
  recette:  { icon: TrendingUp,    color: '#5BC78A', bg: 'rgba(91,199,138,0.1)' },
  document: { icon: FileText,      color: '#A85BC7', bg: 'rgba(168,91,199,0.1)' },
};

const NOTIFS_DEMO = [
  { id:1, type:'alerte',   titre:'Contrat expirant',     message:'Votre contrat Orange expire dans 12 jours.',  date: new Date(Date.now() - 1000*60*30),    lu: false },
  { id:2, type:'alerte',   titre:'Déclaration TVA',       message:'Échéance TVA dans 8 jours (19 du mois).',    date: new Date(Date.now() - 1000*60*120),   lu: false },
  { id:3, type:'recette',  titre:'Devis accepté',         message:'Le devis DEV-2025-012 a été accepté.',        date: new Date(Date.now() - 1000*60*60*3),  lu: false },
  { id:4, type:'info',     titre:'Mise à jour Vigie Pro', message:'Nouvelles fonctionnalités disponibles.',      date: new Date(Date.now() - 1000*60*60*24), lu: true  },
  { id:5, type:'document', titre:'Export FEC prêt',       message:'Votre export FEC 2024 est disponible.',       date: new Date(Date.now() - 1000*60*60*48), lu: true  },
];

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

export default function NotificationsPanel({ isOpen: sidebarOpen }) {
  const [open,   setOpen]   = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [notifs, setNotifs] = useState(NOTIFS_DEMO);
  const btnRef   = useRef(null);
  const panelRef = useRef(null);

  const unread = notifs.filter(n => !n.lu).length;

  // Calcul dynamique de la position du panel
  const computeCoords = () => {
    if (!btnRef.current) return;
    const r  = btnRef.current.getBoundingClientRect();
    const pw = 320; // largeur du panel
    // Positionner à droite du bouton, aligné en bas
    let left = r.right + 8;
    let top  = r.bottom - 460; // hauteur max panel
    // Si dépasse à droite, mettre à gauche
    if (left + pw > window.innerWidth - 8) left = r.left - pw - 8;
    // Pas trop haut
    if (top < 8) top = 8;
    setCoords({ top, left });
  };

  const handleToggle = () => {
    if (!open) computeCoords();
    setOpen(v => !v);
  };

  // Fermer si clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target))   return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    // Délai pour éviter fermeture immédiate sur le clic d'ouverture
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  const marquerLu      = (id) => setNotifs(n => n.map(x => x.id === id ? { ...x, lu: true } : x));
  const marquerTousLus = ()   => setNotifs(n => n.map(x => ({ ...x, lu: true })));
  const supprimer      = (id) => setNotifs(n => n.filter(x => x.id !== id));

  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* Bouton cloche */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '9px 8px', borderRadius: 10, border: 'none',
          background: open ? 'rgba(91,163,199,0.1)' : 'transparent',
          cursor: 'pointer', transition: 'background 150ms ease',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Icône cloche */}
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: open ? 'rgba(91,163,199,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Bell size={15} color={open ? '#5BA3C7' : 'rgba(255,255,255,0.45)'} strokeWidth={2}/>
          {unread > 0 && (
            <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#C75B4E', border: '2px solid rgba(15,23,42,0.92)', fontSize: 8, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unread > 9 ? '9+' : unread}
            </div>
          )}
        </div>

        {/* Label (visible si sidebar ouverte) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, opacity: sidebarOpen ? 1 : 0, transition: 'opacity 150ms ease' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: open ? '#5BA3C7' : 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' }}>
            Notifications
          </span>
          {unread > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#C75B4E', borderRadius: 10, padding: '1px 6px' }}>
              {unread}
            </span>
          )}
        </div>
      </button>

      {/* Panel — position:fixed calculée dynamiquement */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            top:  coords.top,
            left: coords.left,
            zIndex: 9999,
            width: 320,
            maxHeight: 460,
            background: 'rgba(15,23,42,0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(91,163,199,0.2)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'notifOpen 0.18s ease',
          }}
        >
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Notifications</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                {unread} non lue{unread !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unread > 0 && (
                <button
                  onClick={marquerTousLus}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(91,163,199,0.1)', border: '1px solid rgba(91,163,199,0.2)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#5BA3C7', fontSize: 11, fontWeight: 600, fontFamily: 'inherit' }}
                >
                  <CheckCheck size={12}/> Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}
              >
                <X size={14}/>
              </button>
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {notifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.25)' }}>
                <Bell size={32} style={{ marginBottom: 12, opacity: 0.3 }}/>
                <div style={{ fontSize: 13 }}>Aucune notification</div>
              </div>
            ) : notifs.map(n => {
              const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => marquerLu(n.id)}
                  style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 10, marginBottom: 4, cursor: 'pointer', background: n.lu ? 'transparent' : 'rgba(91,163,199,0.05)', border: `1px solid ${n.lu ? 'transparent' : 'rgba(91,163,199,0.1)'}`, transition: 'all 150ms ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.lu ? 'transparent' : 'rgba(91,163,199,0.05)'}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={cfg.color} strokeWidth={2}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: n.lu ? 500 : 700, color: n.lu ? 'rgba(255,255,255,0.5)' : '#F8FAFC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.titre}
                      </span>
                      {!n.lu && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BA3C7', flexShrink: 0 }}/>}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: 4 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{timeAgo(n.date)}</div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); supprimer(n.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: 2, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#C75B4E'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                  >
                    <X size={12}/>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center', flexShrink: 0 }}>
              <button
                onClick={() => setNotifs([])}
                style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Effacer toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes notifOpen {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
