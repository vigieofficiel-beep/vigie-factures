import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#0E0D0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20, fontFamily: "'Nunito Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: '#D4A853', marginBottom: 10 }}>Vigie</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 20 }}>La plateforme de veille intelligente</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link to="/login" style={{ padding: '12px 28px', borderRadius: 10, background: 'linear-gradient(135deg,#D4A853,#C78A5B)', color: '#0E0D0B', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
          Se connecter
        </Link>
        <Link to="/signup" style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid rgba(212,168,83,0.3)', color: '#D4A853', textDecoration: 'none', fontSize: 14 }}>
          S'inscrire
        </Link>
      </div>
    </div>
  );
}