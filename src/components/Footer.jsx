import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: '#0f1114',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '48px 32px 28px',
      fontFamily: "'Nunito Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: 1000, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 40, marginBottom: 40,
      }}>

        {/* Colonne 1 — Marque */}
        <div>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 22, fontWeight: 700,
            color: '#D4A853', marginBottom: 14, letterSpacing: 0.5,
          }}>
            Vigie
          </h3>
          <p style={{ fontSize: 13, color: '#BDBABB', lineHeight: 1.7, maxWidth: 200 }}>
            La solution intelligente pour gérer et analyser vos factures automatiquement.
          </p>
        </div>

        {/* Colonne 2 — Navigation */}
        <div>
          <h4 style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 1.4,
            color: '#D8D5CF', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Navigation
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Accueil', to: '/' },
              { label: 'Vigie Perso', to: '/perso' },
              { label: 'Vigie Pro', to: '/pro' },
            ].map(link => (
              <Link
                key={link.to} to={link.to}
                style={{ fontSize: 14, color: '#BDBABB', textDecoration: 'none', transition: 'color 150ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color = '#D4A853'}
                onMouseLeave={e => e.currentTarget.style.color = '#BDBABB'}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Colonne 3 — Légal */}
        <div>
          <h4 style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 1.4,
            color: '#D8D5CF', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Légal
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Mentions légales', 'Confidentialité', 'CGU'].map(item => (
              <span
                key={item}
                style={{ fontSize: 14, color: '#BDBABB', cursor: 'default', transition: 'color 150ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color = '#D8D5CF'}
                onMouseLeave={e => e.currentTarget.style.color = '#BDBABB'}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Colonne 4 — Contact */}
        <div>
          <h4 style={{
            fontSize: 13, fontWeight: 700, letterSpacing: 1.4,
            color: '#D8D5CF', textTransform: 'uppercase', marginBottom: 16,
          }}>
            Contact
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 14, color: '#BDBABB' }}>support@vigie.app</span>
            <span style={{ fontSize: 14, color: '#BDBABB' }}>FAQ</span>
          </div>
        </div>

      </div>

      {/* Bas de footer */}
      <div style={{
        maxWidth: 1000, margin: '0 auto',
        borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Vigie © {new Date().getFullYear()} — Tous droits réservés
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          Analyse propulsée par IA
        </span>
      </div>
    </footer>
  );
}
