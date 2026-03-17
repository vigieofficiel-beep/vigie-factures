import { useState, useEffect } from 'react';
import { supabase }    from '../lib/supabaseClient';
import { supabasePro } from '../lib/supabasePro';
import HomeLayout  from './HomeLayout';
import Topbar      from './Topbar';
import WeatherCard from './WeatherCard';
import './home.css';

/* ── Config par mode ── */
const CONFIG = {
  perso: {
    accent    : '#5BC78A',
    mainTitle : 'Mes finances du mois',
    mainSub   : "Vue d'ensemble de vos factures et dépenses",
    bannerText: '🔔 Votre facture EDF de novembre est disponible.',
    btnClass  : 'btn--perso',
    btnLabel  : 'Analyser mes factures',
    shortcuts : ['Mes factures', 'Budget', 'Historique', 'Alertes'],
  },
  pro: {
    accent    : '#5BA3C7',
    mainTitle : 'Tableau de bord entreprise',
    mainSub   : 'Activité et indicateurs de la semaine',
    bannerText: '📋 Rapport mensuel prêt — Novembre 2024.',
    btnClass  : 'btn--pro',
    btnLabel  : 'Voir les factures',
    shortcuts : ['Factures', 'Équipe', 'Rapports', 'Paramètres'],
  },
};

export default function HomePage({ mode = 'perso' }) {
  const cfg = CONFIG[mode];

  const [firstName, setFirstName] = useState('');
  const [city, setCity]           = useState('Paris');

  useEffect(() => {
    const client = mode === 'pro' ? supabasePro : supabase;

    client.auth.getUser().then(({ data }) => {
      const meta = data?.user?.user_metadata;
      if (meta) {
        setFirstName(meta.first_name || 'vous');
        if (meta.city) setCity(meta.city);
      }
    });
  }, [mode]);

  return (
    <HomeLayout
      topbar={
        <Topbar
          firstName={firstName}
          mode={mode}
          notifCount={mode === 'pro' ? 3 : 1}
          actions={
            <div style={{ display: 'flex', gap: 6 }}>
              {cfg.shortcuts.map((s) => (
                <button
                  key={s}
                  className="btn btn--ghost"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  {s}
                </button>
              ))}
            </div>
          }
        />
      }

      main={<MainPanel cfg={cfg} mode={mode} />}

      widgets={
        <>
          <WeatherCard city={city} />
          <QuickStatsCard mode={mode} accent={cfg.accent} />
        </>
      }

      banner={<Banner text={cfg.bannerText} accent={cfg.accent} />}
    />
  );
}

function MainPanel({ cfg, mode }) {
  return (
    <div>
      <h2 className="section-title">{cfg.mainTitle}</h2>
      <p className="section-sub">{cfg.mainSub}</p>

      <div style={{
        height        : 200,
        borderRadius  : 10,
        background    : `linear-gradient(135deg, ${cfg.accent}10 0%, ${cfg.accent}05 100%)`,
        border        : `1px dashed ${cfg.accent}40`,
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'center',
        color         : `${cfg.accent}90`,
        fontSize      : 13,
        fontWeight    : 500,
        marginBottom  : 24,
      }}>
        {mode === 'pro' ? '[ Graphique activité ]' : '[ Graphique dépenses ]'}
      </div>

      <button className={`btn ${cfg.btnClass}`}>
        {cfg.btnLabel} →
      </button>
    </div>
  );
}

function QuickStatsCard({ mode, accent }) {
  const stats = mode === 'pro'
    ? [{ label: 'Factures ce mois', val: '12' }, { label: 'En attente', val: '3' }, { label: 'Équipe', val: '5' }]
    : [{ label: 'Factures analysées', val: '8' }, { label: 'Alertes', val: '1' }, { label: 'Budget restant', val: '420 €' }];

  return (
    <div className="card">
      <p className="card-title">Résumé</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: accent }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Banner({ text, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{text}</span>
      <button className="btn btn--ghost" style={{ fontSize: 12 }}>Voir →</button>
    </div>
  );
}
