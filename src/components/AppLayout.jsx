import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AppLayout({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0E0D0B', color: '#EDE8DB', fontFamily: "'Nunito Sans', sans-serif" }}>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, zIndex: 100, background: 'rgba(14,13,11,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
        <Link to="/app" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#D4A853' }}>Vigie</span>
        </Link>
        <div style={{ flex: 1 }} />
        {user && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{user.email}</span>}
        <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
          Déconnexion
        </button>
      </header>
      <main style={{ paddingTop: 52 }}>
        {children}
      </main>
    </div>
  );
}