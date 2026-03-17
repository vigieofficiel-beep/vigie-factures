import { useState, useEffect, useRef } from 'react';

/**
 * Composant Tooltip universel Vigie Pro
 *
 * Usage simple :
 *   <Tooltip text="Explication du terme" />
 *
 * Usage avec label inline :
 *   <Tooltip label="TVA" text={TIPS.tva} />
 *
 * Usage autour d'un enfant :
 *   <Tooltip text={TIPS.tva}><span>Mon contenu</span></Tooltip>
 *
 * Props :
 *   text      {string}  - Texte de l'infobulle (obligatoire)
 *   label     {string}  - Texte affiché à côté de l'icône (optionnel)
 *   position  {string}  - 'top'|'bottom'|'left'|'right' (défaut: 'top')
 *   size      {number}  - Taille de l'icône en px (défaut: 14)
 *   color     {string}  - Couleur de l'icône (défaut: '#5BA3C7')
 *   maxWidth  {number}  - Largeur max de la bulle en px (défaut: 280)
 *   children  {node}    - Si fourni, wrappé avec l'icône à côté
 */
export default function Tooltip({
  text,
  label,
  position = 'top',
  size = 14,
  color = '#5BA3C7',
  maxWidth = 280,
  children,
}) {
  const [visible, setVisible] = useState(false);
  const [coords,  setCoords]  = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);
  const bubbleRef = useRef(null);
  const hideTimer = useRef(null);

  const show = () => {
    clearTimeout(hideTimer.current);
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const bw = maxWidth;
    const bh = 80; // hauteur estimée

    let top, left;
    switch (position) {
      case 'bottom':
        top  = rect.bottom + scrollY + 8;
        left = rect.left + scrollX + rect.width / 2 - bw / 2;
        break;
      case 'left':
        top  = rect.top + scrollY + rect.height / 2 - bh / 2;
        left = rect.left + scrollX - bw - 10;
        break;
      case 'right':
        top  = rect.top + scrollY + rect.height / 2 - bh / 2;
        left = rect.right + scrollX + 10;
        break;
      default: // top
        top  = rect.top + scrollY - bh - 10;
        left = rect.left + scrollX + rect.width / 2 - bw / 2;
    }

    // Garde la bulle dans le viewport horizontalement
    const vw = window.innerWidth;
    if (left < 8) left = 8;
    if (left + bw > vw - 8) left = vw - bw - 8;

    setCoords({ top, left });
    setVisible(true);
  };

  const hide = (delay = 150) => {
    hideTimer.current = setTimeout(() => setVisible(false), delay);
  };

  const toggle = (e) => {
    e.stopPropagation();
    if (visible) hide(0);
    else show();
  };

  // Fermer en cliquant ailleurs
  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (iconRef.current && !iconRef.current.contains(e.target) &&
          bubbleRef.current && !bubbleRef.current.contains(e.target)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const iconEl = (
    <span
      ref={iconRef}
      onMouseEnter={show}
      onMouseLeave={() => hide()}
      onClick={toggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 4,
        height: size + 4,
        borderRadius: '50%',
        background: visible ? `${color}20` : `${color}12`,
        border: `1px solid ${color}30`,
        color,
        fontSize: size - 3,
        fontWeight: 700,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 150ms ease, transform 150ms ease',
        transform: visible ? 'scale(1.1)' : 'scale(1)',
        userSelect: 'none',
        lineHeight: 1,
        verticalAlign: 'middle',
        marginLeft: children || label ? 5 : 0,
      }}
      title=""
      aria-label="Information"
    >
      i
    </span>
  );

  const bubble = visible && (
    <div
      ref={bubbleRef}
      onMouseEnter={() => clearTimeout(hideTimer.current)}
      onMouseLeave={() => hide()}
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        width: maxWidth,
        zIndex: 9999,
        background: '#0F172A',
        color: '#F8FAFC',
        fontSize: 12,
        lineHeight: 1.6,
        padding: '10px 14px',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(15,23,42,0.25)',
        pointerEvents: 'auto',
        animation: 'tooltipIn 150ms ease',
        fontFamily: "'Nunito Sans', sans-serif",
        fontWeight: 400,
      }}
    >
      {text}
      {/* Petite flèche */}
      <div style={{
        position: 'absolute',
        ...(position === 'top'    && { bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)' }),
        ...(position === 'bottom' && { top: -5,    left: '50%', transform: 'translateX(-50%) rotate(45deg)' }),
        ...(position === 'left'   && { right: -5,  top: '50%',  transform: 'translateY(-50%) rotate(45deg)' }),
        ...(position === 'right'  && { left: -5,   top: '50%',  transform: 'translateY(-50%) rotate(45deg)' }),
        width: 10, height: 10,
        background: '#0F172A',
        borderRadius: 2,
      }} />
    </div>
  );

  // Portail simplifié : on appende au body via un div fixe
  const portal = visible && (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {bubble}
      </div>
    </div>
  );

  return (
    <>
      {/* Rendu inline */}
      {children ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {children}
          {iconEl}
        </span>
      ) : label ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>{label}</span>
          {iconEl}
        </span>
      ) : (
        iconEl
      )}

      {/* Bulle rendue hors du flux via position fixed */}
      {visible && (
        <div
          ref={bubbleRef}
          onMouseEnter={() => clearTimeout(hideTimer.current)}
          onMouseLeave={() => hide()}
          style={{
            position: 'fixed',
            top: coords.top - window.scrollY,
            left: coords.left,
            width: maxWidth,
            zIndex: 9999,
            background: '#0F172A',
            color: '#F8FAFC',
            fontSize: 12,
            lineHeight: 1.6,
            padding: '10px 14px',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(15,23,42,0.25)',
            pointerEvents: 'auto',
            animation: 'tooltipIn 150ms ease',
            fontFamily: "'Nunito Sans', sans-serif",
            fontWeight: 400,
          }}
        >
          {text}
          <div style={{
            position: 'absolute',
            ...(position === 'top'    && { bottom: -5, left: 'calc(50% - 5px)', transform: 'rotate(45deg)' }),
            ...(position === 'bottom' && { top: -5,    left: 'calc(50% - 5px)', transform: 'rotate(45deg)' }),
            ...(position === 'left'   && { right: -5,  top: 'calc(50% - 5px)', transform: 'rotate(45deg)' }),
            ...(position === 'right'  && { left: -5,   top: 'calc(50% - 5px)', transform: 'rotate(45deg)' }),
            width: 10, height: 10,
            background: '#0F172A',
            borderRadius: 2,
          }} />
        </div>
      )}

      <style>{`
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
