import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, AlertTriangle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function PersoDashboard() {
  const [user, setUser] = useState(null);
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const tick = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  const hour = time.getHours();
  const greeting =
    hour < 12 ? 'Bonjour' :
    hour < 18 ? 'Bon après-midi' :
    'Bonsoir';

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    ?? user?.email?.split('@')[0]
    ?? '';

  const dateStr = time.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  // Stat cards
  const STATS = [
    {
      label: 'Factures analysées',
      value: '—',
      sub: 'ce mois',
      icon: FileText,
      color: '#D4A853',
      bg: 'rgba(212,168,83,0.06)',
      border: 'rgba(212,168,83,0.15)',
      route: '/perso/factures',
    },
    {
      label: 'Économies détectées',
      value: '—',
      sub: 'anomalies trouvées',
      icon: TrendingUp,
      color: '#5BC78A',
      bg: 'rgba(91,199,138,0.06)',
      border: 'rgba(91,199,138,0.12)',
      route: '/perso/factures',
    },
    {
      label: 'Alertes actives',
      value: '—',
      sub: 'à traiter',
      icon: AlertTriangle,
      color: '#C75B4E',
      bg: 'rgba(199,91,78,0.06)',
      border: 'rgba(199,91,78,0.12)',
      route: '/perso/factures',
    },
    {
      label: 'Dernière analyse',
      value: '—',
      sub: 'il y a',
      icon: Clock,
      color: '#5BA3C7',
      bg: 'rgba(91,163,199,0.06)',
      border: 'rgba(91,163,199,0.12)',
      route: '/perso/factures',
    },
  ];

  const QUICK_ACTIONS = [
    {
      label: 'Analyser une facture',
      desc: 'Importez et analysez un nouveau document',
      icon: FileText,
      color: '#D4A853',
      route: '/perso/factures',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 60%, #E2E8F0 100%)',
      padding: '40px 32px',
      fontFamily: "'Nunito Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── GREETING ── */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontSize: 12, fontWeight: 600, letterSpacing: 1.5,
            color: '#94A3B8', textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            {dateStr}
          </p>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(28px, 4vw, 38px)',
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: 6,
            lineHeight: 1.2,
          }}>
            {greeting}{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>
            Voici un aperçu de votre espace personnel Vigie.
          </p>
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}>
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                onClick={() => navigate(stat.route)}
                style={{
                  background: 'white',
                  border: `1px solid ${stat.border}`,
                  borderRadius: 16,
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'transform 150ms ease, box-shadow 150ms ease',
                  boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${stat.color}20`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.06)';
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${stat.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Icon size={18} color={stat.color} strokeWidth={2} />
                </div>
                <div style={{
                  fontSize: 26, fontWeight: 800,
                  fontFamily: "'Cormorant Garamond', serif",
                  color: stat.color, marginBottom: 4, lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginBottom: 2 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                  {stat.sub}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 20, fontWeight: 700,
            color: '#0F172A',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Sparkles size={16} color='#D4A853' /> Actions rapides
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.route)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px',
                    background: 'white',
                    border: `1px solid rgba(212,168,83,0.2)`,
                    borderRadius: 12, cursor: 'pointer',
                    transition: 'all 150ms ease',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(212,168,83,0.04)';
                    e.currentTarget.style.borderColor = 'rgba(212,168,83,0.4)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(212,168,83,0.12)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'white';
                    e.currentTarget.style.borderColor = 'rgba(212,168,83,0.2)';
                    e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.06)';
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${action.color}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={16} color={action.color} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      {action.desc}
                    </div>
                  </div>
                  <ArrowRight size={14} color='#D4A853' style={{ marginLeft: 8, opacity: 0.6 }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ACTIVITÉ RÉCENTE ── */}
        <div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 20, fontWeight: 700,
            color: '#0F172A',
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Clock size={16} color='#5BA3C7' /> Activité récente
          </h2>
          <div style={{
            background: 'white',
            border: '1px solid rgba(15,23,42,0.06)',
            borderRadius: 16, padding: '32px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 10, minHeight: 140,
            boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(15,23,42,0.04)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Clock size={18} color='#94A3B8' />
            </div>
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center' }}>
              Aucune activité récente
            </p>
            <button
              onClick={() => navigate('/perso/factures')}
              style={{
                fontSize: 12, color: '#0E0D0B',
                background: 'linear-gradient(135deg, #D4A853, #C78A5B)',
                border: 'none',
                borderRadius: 8, padding: '8px 16px',
                cursor: 'pointer', fontWeight: 700,
              }}
            >
              Commencer avec Vigie Factures →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
