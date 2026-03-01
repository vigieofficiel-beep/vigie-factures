import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabasePro } from '../lib/supabasePro';
import {
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  FileText, Bell, CreditCard, BarChart2,
} from 'lucide-react';

const ACCENT = '#5BA3C7';

/* ── Helpers ── */
const formatEuro = (n) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/* ── Composant carte stat ── */
function StatCard({ icon: Icon, label, value, sub, color = ACCENT, alert = false }) {
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${alert ? 'rgba(199,91,78,0.3)' : '#E8EAF0'}`,
      borderRadius: 14,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxShadow: alert ? '0 2px 12px rgba(199,91,78,0.08)' : '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9AA0AE', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={color} strokeWidth={2} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: alert ? '#C75B4E' : '#1A1C20', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#9AA0AE' }}>{sub}</div>}
    </div>
  );
}

/* ── Composant ligne alerte ── */
function AlertRow({ message, type, sentAt, color }) {
  const typeColors = {
    overdue: '#C75B4E',
    upcoming: '#D4A853',
    info: '#5BA3C7',
  };
  const c = typeColors[type] || '#9AA0AE';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid #F0F2F5',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: c, flexShrink: 0, marginTop: 4,
      }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, color: '#1A1C20', margin: 0, fontWeight: 500 }}>{message}</p>
        <p style={{ fontSize: 11, color: '#9AA0AE', margin: '3px 0 0' }}>
          {sentAt ? formatDate(sentAt) : ''}
        </p>
      </div>
    </div>
  );
}

/* ── Composant ligne paiement ── */
function PaymentRow({ provider, amount, date, statut }) {
  const days = daysUntil(date);
  const isLate = days !== null && days < 0;
  const isSoon = days !== null && days >= 0 && days <= 7;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 0', borderBottom: '1px solid #F0F2F5',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: isLate ? 'rgba(199,91,78,0.08)' : isSoon ? 'rgba(212,168,83,0.08)' : 'rgba(91,163,199,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CreditCard size={14} color={isLate ? '#C75B4E' : isSoon ? '#D4A853' : ACCENT} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1C20', margin: 0 }}>{provider || '—'}</p>
          <p style={{ fontSize: 11, color: '#9AA0AE', margin: '2px 0 0' }}>
            {isLate ? `En retard de ${Math.abs(days)}j` : days === 0 ? "Aujourd'hui" : `Dans ${days}j`}
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: isLate ? '#C75B4E' : '#1A1C20', margin: 0 }}>
          {formatEuro(amount)}
        </p>
        <p style={{ fontSize: 10, color: '#9AA0AE', margin: '2px 0 0' }}>{formatDate(date)}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
export default function ProHome() {
  const [firstName, setFirstName] = useState('');
  const [stats, setStats]         = useState(null);
  const [alerts, setAlerts]       = useState([]);
  const [payments, setPayments]   = useState([]);
  const [quota, setQuota]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      if (!user) return;

      const uid = user.id;
      setFirstName(user.user_metadata?.first_name || 'vous');

      // Chargement en parallèle
      const [
        { data: invoices },
        { data: reminders },
        { data: calendar },
        { data: quotaData },
      ] = await Promise.all([
        supabasePro.from('invoices').select('id, amount_ttc, has_anomaly, invoice_date').eq('user_id', uid),
        supabasePro.from('reminders').select('*').eq('user_id', uid).order('sent_at', { ascending: false }).limit(8),
        supabasePro.from('payment_calendar').select('*').eq('user_id', uid).gte('paiement_data', new Date().toISOString().split('T')[0]).order('paiement_data').limit(5),
        supabasePro.from('user_quotas').select('*').eq('user_id', uid).single(),
      ]);

      // Stats factures
      const total       = invoices?.length || 0;
      const montantTotal = invoices?.reduce((s, i) => s + (i.amount_ttc || 0), 0) || 0;
      const anomalies   = invoices?.filter(i => i.has_anomaly).length || 0;

      setStats({ total, montantTotal, anomalies });
      setAlerts(reminders || []);
      setPayments(calendar || []);
      setQuota(quotaData);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito Sans', sans-serif", color: ACCENT, fontSize: 13,
    }}>
      Chargement du tableau de bord…
    </div>
  );

  return (
    <div style={{
      fontFamily: "'Nunito Sans', sans-serif",
      padding: '32px 28px',
      maxWidth: 1100,
      margin: '0 auto',
    }}>

      {/* ── En-tête ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28, fontWeight: 600, color: '#1A1C20', margin: 0,
        }}>
          {greeting}, <span style={{ color: ACCENT, fontStyle: 'italic' }}>{firstName}</span>
        </h1>
        <p style={{ fontSize: 13, color: '#9AA0AE', marginTop: 4 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Ligne de stats ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <StatCard
          icon={FileText}
          label="Factures totales"
          value={stats?.total ?? '—'}
          sub="Depuis le début"
          color={ACCENT}
        />
        <StatCard
          icon={TrendingUp}
          label="Volume total"
          value={formatEuro(stats?.montantTotal)}
          sub="Toutes factures"
          color="#5BC78A"
        />
        <StatCard
          icon={AlertTriangle}
          label="Anomalies"
          value={stats?.anomalies ?? '—'}
          sub={stats?.anomalies > 0 ? 'À vérifier' : 'Aucune anomalie'}
          color="#C75B4E"
          alert={stats?.anomalies > 0}
        />
        <StatCard
          icon={BarChart2}
          label="Analyses ce mois"
          value={quota?.ocr_month ?? '—'}
          sub={`Plan ${quota?.plan ?? 'free'}`}
          color="#D4A853"
        />
      </div>

      {/* ── Grille principale ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 20,
      }}>

        {/* Colonne gauche : Alertes */}
        <div style={{
          background: '#fff',
          border: '1px solid #E8EAF0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Bell size={15} color={ACCENT} />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1C20', margin: 0 }}>
              Alertes & Rappels
            </h2>
            {alerts.length > 0 && (
              <span style={{
                background: `${ACCENT}18`, color: ACCENT,
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              }}>
                {alerts.length}
              </span>
            )}
          </div>

          {alerts.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '32px 0', gap: 8,
            }}>
              <CheckCircle size={28} color="#5BC78A" style={{ opacity: 0.6 }} />
              <p style={{ fontSize: 13, color: '#9AA0AE', margin: 0 }}>Aucune alerte en cours</p>
            </div>
          ) : (
            alerts.map((a, i) => (
              <AlertRow
                key={a.id || i}
                message={a.message}
                type={a.type}
                sentAt={a.sent_at}
              />
            ))
          )}
        </div>

        {/* Colonne droite : Paiements à venir */}
        <div style={{
          background: '#fff',
          border: '1px solid #E8EAF0',
          borderRadius: 14,
          padding: '20px 22px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={15} color="#D4A853" />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1C20', margin: 0 }}>
              Paiements à venir
            </h2>
          </div>

          {payments.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '32px 0', gap: 8,
            }}>
              <CheckCircle size={28} color="#5BC78A" style={{ opacity: 0.6 }} />
              <p style={{ fontSize: 13, color: '#9AA0AE', margin: 0 }}>Aucun paiement à venir</p>
            </div>
          ) : (
            <>
              {payments.map((p, i) => (
                <PaymentRow
                  key={p.id || i}
                  provider={p.provider}
                  amount={p.amount}
                  date={p.paiement_data}
                  statut={p.statut}
                />
              ))}
              <div style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid #F0F2F5',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: 11, color: '#9AA0AE' }}>Total à venir</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1C20' }}>
                  {formatEuro(payments.reduce((s, p) => s + (p.amount || 0), 0))}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
