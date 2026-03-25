import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const navigate = useNavigate();
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [count, setCount] = useState(3);

  useEffect(() => {
    const move = (e) => {
      setPos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(timer); navigate('/'); }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: '#0A0F1E',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      color: '#E2E8F0',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,600&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Orbe dynamique qui suit la souris */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, rgba(91,163,199,0.08) 0%, transparent 60%)`,
        transition: 'background 0.3s ease',
      }} />

      {/* Grille de fond */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Contenu principal */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', maxWidth: 600 }}>

        {/* 404 géant */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(120px, 20vw, 220px)',
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(91,163,199,0.2)',
            margin: 0, lineHeight: 0.9,
            userSelect: 'none',
            letterSpacing: '-4px',
          }}>404</p>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(120px, 20vw, 220px)',
            fontWeight: 700,
            color: 'transparent',
            WebkitTextStroke: '1px rgba(91,163,199,0.08)',
            margin: 0, lineHeight: 0.9,
            userSelect: 'none',
            letterSpacing: '-4px',
            position: 'absolute', top: 4, left: 4, width: '100%',
          }}>404</p>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(91,163,199,0.08)',
          border: '1px solid rgba(91,163,199,0.2)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5BA3C7', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5BA3C7', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Page introuvable</span>
        </div>

        {/* Titre */}
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 700, color: '#F8FAFC',
          marginBottom: 16, lineHeight: 1.2,
        }}>
          Cette page s'est <em style={{ color: '#5BA3C7' }}>éclipsée</em>
        </h1>

        <p style={{ fontSize: 16, color: 'rgba(237,232,219,0.5)', lineHeight: 1.7, marginBottom: 40, maxWidth: 420, margin: '0 auto 40px' }}>
          La page que vous cherchez n'existe pas ou a été déplacée. Vous allez être redirigé automatiquement.
        </p>

        {/* Compte à rebours */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginBottom: 36,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '2px solid rgba(91,163,199,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#5BA3C7',
          }}>
            {count}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(237,232,219,0.5)' }}>Redirection vers l'accueil...</span>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px', borderRadius: 10,
              background: 'linear-gradient(135deg, #5BA3C7, #3d7fa8)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(91,163,199,0.3)',
            }}
          >
            ← Retour à l'accueil
          </button>
          <button
            onClick={() => navigate('/tarifs')}
            style={{
              padding: '12px 28px', borderRadius: 10,
              background: 'transparent',
              color: '#94A3B8', fontSize: 14, fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
            }}
          >
            Voir les tarifs
          </button>
        </div>

        {/* Liens rapides */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: 12, color: '#475569', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Liens utiles</p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Dashboard', path: '/pro' },
              { label: 'Tarifs', path: '/tarifs' },
              { label: 'Mentions légales', path: '/mentions-legales' },
              { label: 'Confidentialité', path: '/confidentialite' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#475569', fontFamily: 'inherit',
                  transition: 'color 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#5BA3C7'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Logo bas */}
      <div style={{
        position: 'fixed', bottom: 24,
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.1)',
        zIndex: 1,
      }}>
        Vigie<span style={{ color: 'rgba(91,163,199,0.3)', fontStyle: 'italic' }}>Pro</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
