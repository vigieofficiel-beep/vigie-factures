import { Link } from 'react-router-dom';
import { User, Briefcase } from 'lucide-react';

export default function HomeHub() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAF8F3 0%, #F5F1E8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Nunito Sans', sans-serif",
      padding: '24px',
    }}>
      <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>
        
        {/* Titre principal */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(36px, 6vw, 54px)',
          fontWeight: 700,
          color: '#2C2416',
          marginBottom: 12,
        }}>
          Vigie Hub
        </h1>
        
        {/* Sous-texte */}
        <p style={{
          fontSize: 16,
          color: 'rgba(44,36,22,0.5)',
          marginBottom: 60,
        }}>
          Choisissez votre espace Vigie
        </p>

        {/* Cartes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
        }}>
          
          {/* Carte Perso */}
          <Link to="/perso" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: '40px 24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: '2px solid transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(212,168,83,0.15)';
              e.currentTarget.style.borderColor = '#D4A853';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
              e.currentTarget.style.borderColor = 'transparent';
            }}>
              
              {/* Icône */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFE8C5, #FFD49C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <User size={28} color="#D4A853" strokeWidth={2.5} />
              </div>

              {/* Label */}
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#2C2416',
                marginBottom: 8,
              }}>
                Vigie Perso
              </h2>

              {/* Description */}
              <p style={{
                fontSize: 13,
                color: 'rgba(44,36,22,0.5)',
                lineHeight: 1.6,
              }}>
                Gestion personnelle, factures, démarches, foyer
              </p>
            </div>
          </Link>

          {/* Carte Pro */}
          <Link to="/pro" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: 20,
              padding: '40px 24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: '2px solid transparent',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(91,163,199,0.15)';
              e.currentTarget.style.borderColor = '#5BA3C7';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
              e.currentTarget.style.borderColor = 'transparent';
            }}>
              
              {/* Icône */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C5E8FF, #9CD4FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <Briefcase size={28} color="#5BA3C7" strokeWidth={2.5} />
              </div>

              {/* Label */}
              <h2 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#2C2416',
                marginBottom: 8,
              }}>
                Vigie Pro
              </h2>

              {/* Description */}
              <p style={{
                fontSize: 13,
                color: 'rgba(44,36,22,0.5)',
                lineHeight: 1.6,
              }}>
                Gestion entreprise, automatisation, veille, conformité
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}