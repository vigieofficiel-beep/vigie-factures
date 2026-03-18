import { useState, useEffect, useRef } from 'react';

/**
 * Composant Tooltip universel Vigie Pro
 *
 * Usage :
 *   <Tooltip text="Explication" />
 *   <Tooltip text={TIPS.tva} size={12} />
 *   <label>Mon label <Tooltip text="..." /></label>
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
  const iconRef   = useRef(null);
  const bubbleRef = useRef(null);
  const timer     = useRef(null);

  const compute = () => {
    if (!iconRef.current) return;
    const r  = iconRef.current.getBoundingClientRect();
    const bw = maxWidth;
    const bh = 90;
    const vw = window.innerWidth;
    let top, left;

    switch (position) {
      case 'bottom':
        top  = r.bottom + 8;
        left = r.left + r.width / 2 - bw / 2;
        break;
      case 'left':
        top  = r.top + r.height / 2 - bh / 2;
        left = r.left - bw - 10;
        break;
      case 'right':
        top  = r.top + r.height / 2 - bh / 2;
        left = r.right + 10;
        break;
      default: // top
        top  = r.top - bh - 8;
        left = r.left + r.width / 2 - bw / 2;
    }

    if (left < 8)           left = 8;
    if (left + bw > vw - 8) left = vw - bw - 8;
    if (top < 8)            top  = r.bottom + 8;

    setCoords({ top, left });
  };

  const show = () => {
    clearTimeout(timer.current);
    compute();
    setVisible(true);
  };

  const hide = (delay = 120) => {
    timer.current = setTimeout(() => setVisible(false), delay);
  };

  const toggle = (e) => {
    e.stopPropagation();
    visible ? hide(0) : show();
  };

  useEffect(() => {
    if (!visible) return;
    const handler = (e) => {
      if (iconRef.current?.contains(e.target) || bubbleRef.current?.contains(e.target)) return;
      setVisible(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // ── Icône ─────────────────────────────────────────────────────────
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
        width:  size + 6,
        height: size + 6,
        borderRadius: '50%',
        background: visible ? `${color}22` : `${color}14`,
        border: `1.5px solid ${color}40`,
        color,
        fontSize: Math.max(size - 2, 9),
        fontWeight: 800,
        cursor: 'help',
        flexShrink: 0,
        transition: 'all 150ms ease',
        transform: visible ? 'scale(1.12)' : 'scale(1)',
        userSelect: 'none',
        lineHeight: 1,
        verticalAlign: 'middle',
        fontFamily: 'serif',
      }}
      aria-label="Information"
    >
      i
    </span>
  );

  // ── Bulle fixed ───────────────────────────────────────────────────
  const bubbleEl = visible && (
    <div
      ref={bubbleRef}
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={() => hide()}
      style={{
        position: 'fixed',
        top:  coords.top,
        left: coords.left,
        width: maxWidth,
        zIndex: 99999,
        background: '#0F172A',
        color: '#F1F5F9',
        fontSize: 12,
        lineHeight: 1.65,
        padding: '10px 14px',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(15,23,42,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
        pointerEvents: 'auto',
        fontFamily: "'Nunito Sans', sans-serif",
        fontWeight: 400,
        animation: 'tipIn 140ms ease',
      }}
    >
      {text}
      <span style={{
        position: 'absolute',
        display: 'block',
        width: 10, height: 10,
        background: '#0F172A',
        transform: 'rotate(45deg)',
        borderRadius: 2,
        ...(position === 'top'    && { bottom: -5, left: 'calc(50% - 5px)' }),
        ...(position === 'bottom' && { top:    -5, left: 'calc(50% - 5px)' }),
        ...(position === 'left'   && { right:  -5, top:  'calc(50% - 5px)' }),
        ...(position === 'right'  && { left:   -5, top:  'calc(50% - 5px)' }),
      }} />
    </div>
  );

  return (
    <>
      {children ? (
        <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
          {children}{iconEl}
        </span>
      ) : label ? (
        <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
          <span>{label}</span>{iconEl}
        </span>
      ) : (
        iconEl
      )}

      {bubbleEl}

      <style>{`
        @keyframes tipIn {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </>
  );
}
