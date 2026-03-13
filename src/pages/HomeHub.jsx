import { Link } from 'react-router-dom';
import { User, Briefcase, ArrowRight, Lock } from 'lucide-react';
import Footer from '../components/Footer';

export default function HomeHub() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAF8F3 0%, #F5F1E8 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Nunito Sans', sans-serif",
    }}>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ maxWidth: 600, width: '100%', textAlign: 'center' }}>

          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(36px, 6vw, 54px)',
            fontWeight: 700,
            color: '#2C2416',
            marginBottom: 12,
          }}>
            Vigie Hub
          </h1>

          <p style={{ fontSize: 16, color: 'rgba(44,36,22,0.5)', marginBottom: 60 }}>
            Choisissez votre espace Vigie
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>

            {/* Carte Perso — EN CONSTRUCTION */}
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'white', borderRadius: 20, padding: '40px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: '2px solid rgba(212,168,83,0.15)',
                opacity: 0.6,
                cursor: 'not-allowed',
                userSelect: 'none',
              }}>
                {/* Badge */}
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'rgba(212,168,83,0.12)', border: '1px solid rgba(212,168,83,0.3)',
                  borderRadius: 20, padding: '3px 10px',
                }}>
                  <Lock size={10} color="#D4A853" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#D4A853' }}>Bientôt</span>
                </div>

                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFE8C5, #FFD49C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <User size={28} color="#D4A853" strokeWidth={2.5} />
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#2C2416', marginBottom: 8 }}>
                  Vigie Perso
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(44,36,22,0.5)', lineHeight: 1.6, marginBottom: 16 }}>
                  Gestion personnelle, factures, démarches, foyer
                </p>
                <span style={{ fontSize: 12, color: 'rgba(44,36,22,0.35)', fontStyle: 'italic' }}>
                  🚧 En cours de développement
                </span>
              </div>
            </div>

            {/* Carte Pro */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/pro" style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 20, padding: '40px 24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)', transition: 'all 0.3s ease',
                  cursor: 'pointer', border: '2px solid transparent',
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
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #C5E8FF, #9CD4FF)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                  }}>
                    <Briefcase size={28} color="#5BA3C7" strokeWidth={2.5} />
                  </div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#2C2416', marginBottom: 8 }}>
                    Vigie Pro
                  </h2>
                  <p style={{ fontSize: 13, color: 'rgba(44,36,22,0.5)', lineHeight: 1.6 }}>
                    Gestion entreprise, automatisation, veille, conformité
                  </p>
                </div>
              </Link>

              <Link to="/tarifs" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 10,
                  background: 'rgba(91,163,199,0.08)',
                  border: '1px solid rgba(91,163,199,0.2)',
                  transition: 'all 0.2s ease', cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(91,163,199,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(91,163,199,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(91,163,199,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(91,163,199,0.2)';
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#5BA3C7' }}>
                    Voir les fonctionnalités & tarifs
                  </span>
                  <ArrowRight size={14} color="#5BA3C7" />
                </div>
              </Link>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
