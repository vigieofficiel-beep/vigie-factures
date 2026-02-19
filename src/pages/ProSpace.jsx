import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ProSpace() {
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
      <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
        
        {/* Bouton retour */}
        <Link to="/" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#5BA3C7',
          textDecoration: 'none',
          fontSize: 13,
          marginBottom: 32,
          padding: '8px 12px',
          borderRadius: 8,
          background: 'rgba(91,163,199,0.1)',
        }}>
          <ArrowLeft size={14} /> Retour au hub
        </Link>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 42,
          fontWeight: 700,
          color: '#2C2416',
          marginBottom: 16,
        }}>
          Vigie Pro
        </h1>

        <p style={{
          fontSize: 15,
          color: 'rgba(44,36,22,0.5)',
          lineHeight: 1.7,
          marginBottom: 32,
        }}>
          Votre espace professionnel sera bientôt disponible.<br/>
          Vous y retrouverez la gestion d'entreprise, automatisations et outils de veille.
        </p>

        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize: 13, color: 'rgba(44,36,22,0.4)', margin: 0 }}>
            🚧 En construction
          </p>
        </div>
      </div>
    </div>
  );
}