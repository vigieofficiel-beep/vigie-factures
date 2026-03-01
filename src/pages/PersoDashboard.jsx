import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import HomeLayout from './HomeLayout';
import Topbar from './Topbar';
import './home.css';

export default function PersoDashboard() {
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata;
      if (meta) setFirstName(meta.first_name || 'vous');
    });
  }, []);

  return (
    <HomeLayout
      topbar={<Topbar firstName={firstName} mode="perso" notifCount={1} />}
      main={
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 8 }}>Mes finances du mois</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Vue d'ensemble de vos factures et dépenses</p>
        </div>
      }
      widgets={<div style={{ padding: 20, background: 'white', borderRadius: 12 }}>Widgets</div>}
      banner={<span>🔔 Bienvenue dans votre espace Perso</span>}
    />
  );
}