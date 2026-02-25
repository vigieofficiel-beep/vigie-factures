import { Link } from 'react-router-dom';

// variant = "dark" (sidebar perso/pro) | "light" (pages fond clair comme HomeHub)
export default function Footer({ variant = 'dark' }) {
  const isDark = variant === 'dark';

  const textSecondary = isDark ? 'rgba(255,255,255,0.35)' : '#475569';
  const textFaint     = isDark ? 'rgba(255,255,255,0.15)' : '#94A3B8';
  const borderColor   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)';
  const bg            = isDark ? 'rgba(0,0,0,0.15)'       : 'rgba(15,23,42,0.03)';

  return (
    <footer style={{ borderTop: `1px solid ${borderColor}`, padding: '40px 24px 24px', background: bg }}>
      <div style={{
        maxWidth: 1000, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 32, marginBottom: 32,
      }}>

        {/* Colonne 1 */}
        <div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: '#D4A853', marginBottom: 12 }}>
            Vigie
          </h3>
          <p style={{ fontSize: 12, color: textSecondary, lineHeight: 1.6 }}>
            La solution intelligente pour gérer et analyser vos factures automatiquement.
          </p>
        </div>

        {/* Colonne 2 */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: textFaint, textTransform: 'uppercase', marginBottom: 12 }}>
            Navigation
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ label: 'Accueil', to: '/' }, { label: 'Vigie Perso', to: '/perso' }, { label: 'Vigie Pro', to: '/pro' }].map(link => (
              <Link
                key={link.to} to={link.to}
                style={{ fontSize: 12, color: textSecondary, textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color = '#D4A853'}
                onMouseLeave={e => e.currentTarget.style.color = textSecondary}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Colonne 3 */}
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: textFaint, textTransform: 'uppercase', marginBottom: 12 }}>
            Légal
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Mentions légales', 'Politique de confidentialité', 'CGU'].map(item => (
              <span key={item} style={{ fontSize: 12, color: textSecondary, cursor: 'default' }}>{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1000, margin: '0 auto',
        borderTop: `1px solid ${borderColor}`, paddingTop: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontSize: 11, color: textFaint }}>Vigie © {new Date().getFullYear()} — Tous droits réservés</span>
        <span style={{ fontSize: 11, color: textFaint }}>Rapport généré automatiquement</span>
      </div>
    </footer>
  );
}
