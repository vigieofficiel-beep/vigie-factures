import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import HomeLayout from './HomeLayout';
import Topbar from './Topbar';
import './home.css';

export default function ProHome() {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    supabasePro.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata;
      if (meta) setFirstName(meta.first_name || 'vous');
    });
  }, []);

  return (
    <HomeLayout
      topbar={<Topbar firstName={firstName} mode="pro" notifCount={3} />}
      main={
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 8 }}>Tableau de bord entreprise</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Activité et indicateurs de la semaine</p>
        </div>
      }
      widgets={<div style={{ padding: 20, background: 'white', borderRadius: 12 }}>Widgets</div>}
      banner={<span>📋 Bienvenue dans votre espace Pro</span>}
    />
  );
}