import { useState, useEffect } from 'react';

/**
 * Topbar
 * Props :
 *   - firstName  : string
 *   - mode       : "perso" | "pro"
 *   - actions    : ReactNode — slot actions rapides (optionnel)
 *   - onNotif    : fn
 *   - onFavoris  : fn
 *   - notifCount : number
 */
export default function Topbar({
  firstName = 'Utilisateur',
  mode = 'perso',
  actions,
  onNotif,
  onFavoris,
  notifCount = 0,
}) {
  const accent = mode === 'pro' ? '#5BA3C7' : '#D4A853';
  const label  = mode === 'pro' ? 'Espace Pro' : 'Espace Perso';

  return (
    <div className="tb-root">
      {/* Gauche : salutation */}
      <div className="tb-left">
        <span className="tb-greeting">
          Bonjour <span className="tb-name" style={{ color: accent }}>{firstName}</span>
          <span className="tb-comma">,</span>
        </span>
        <span className="tb-label" style={{ background: `${accent}1a`, color: accent }}>
          {label}
        </span>
      </div>

      {/* Droite : actions rapides + icônes */}
      <div className="tb-right">
        {actions && <div className="tb-actions">{actions}</div>}

        <button
          className="tb-icon-btn"
          onClick={onFavoris}
          aria-label="Favoris"
          title="Favoris"
        >
          <HeartIcon />
        </button>

        <button
          className="tb-icon-btn tb-notif-btn"
          onClick={onNotif}
          aria-label={`Notifications${notifCount > 0 ? ` (${notifCount})` : ''}`}
          title="Notifications"
        >
          <BellIcon />
          {notifCount > 0 && (
            <span className="tb-badge" style={{ background: accent }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── SVG icons ── */
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
