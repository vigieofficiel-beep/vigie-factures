import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, CheckCircle, Zap } from 'lucide-react';

/**
 * ExitIntent — popup qui apparaît quand la souris sort par le haut de la page.
 * À placer dans HomeHub.jsx uniquement.
 *
 * Règles :
 * - N'apparaît qu'une seule fois par session (sessionStorage)
 * - Délai de 3s avant d'être actif (évite les faux positifs)
 * - Ne s'affiche pas sur mobile
 */
export default function ExitIntent() {
  const [visible,   setVisible]   = useState(false);
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState('');
  const ready = useRef(false);

  useEffect(() => {
    // Ne pas afficher si déjà vu ou sur mobile
    const deja = sessionStorage.getItem('exit_intent_shown');
    if (deja) return;
    if (window.innerWidth < 768) return;

    // Activer après 3 secondes sur la page
    const timer = setTimeout(() => { ready.current = true; }, 3000);

    const handleMouseLeave = (e) => {
      if (!ready.current) return;
      if (e.clientY <= 10) {
        setVisible(true);
        sessionStorage.setItem('exit_intent_shown', '1');
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Email invalide'); return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'exit_intent' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSuccess(true);
      setTimeout(() => setVisible(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setVisible(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(8,9,12,0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 99998,
          animation: 'fadeIn 250ms ease',
        }}
      />

      {/* Popup */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 99999,
        width: '100%',
        maxWidth: 480,
        padding: '0 16px',
        animation: 'slideUp 300ms ease',
      }}>
        <div style={{
          background: '#0F172A',
          border: '1px solid rgba(91,163,199,0.25)',
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          position: 'relative',
        }}>

          {/* Bouton fermer */}
          <button
            onClick={() => setVisible(false)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.06)', border: 'none',
              borderRadius: 8, padding: 6, cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', display: 'flex',
            }}
          >
            <X size={16}/>
          </button>

          {success ? (
            /* ── État succès ── */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(91,199,138,0.15)', border: '1px solid rgba(91,199,138,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle size={26} color="#5BC78A"/>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#F8FAFC', margin: '0 0 10px' }}>
                C'est noté ! 🎉
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Vous recevrez bientôt nos conseils et nouveautés directement dans votre boîte mail.
              </p>
            </div>
          ) : (
            /* ── Formulaire ── */
            <>
              {/* Badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(91,163,199,0.1)', border: '1px solid rgba(91,163,199,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 20 }}>
                <Zap size={11} color="#5BA3C7"/>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5BA3C7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Avant de partir
                </span>
              </div>

              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px', lineHeight: 1.2 }}>
                Gérez votre activité<br/>
                <span style={{ color: '#5BA3C7' }}>sans vous perdre</span>
              </h2>

              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: '0 0 24px' }}>
                Rejoignez les indépendants qui utilisent Vigie Pro pour piloter leur activité. Recevez nos conseils gratuits chaque semaine.
              </p>

              {/* Avantages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {[
                  'Conseils comptables pour indépendants',
                  'Nouveautés Vigie Pro en avant-première',
                  'Offres exclusives abonnés',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(91,199,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={11} color="#5BC78A"/>
                    </div>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Formulaire email */}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    required
                    style={{
                      flex: 1, padding: '11px 14px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#F8FAFC', fontSize: 13, outline: 'none',
                      fontFamily: "'Nunito Sans', sans-serif",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '11px 18px', borderRadius: 10, border: 'none',
                      background: loading ? 'rgba(91,163,199,0.4)' : 'linear-gradient(135deg, #5BA3C7, #3d7fa8)',
                      color: '#fff', fontSize: 13, fontWeight: 700,
                      cursor: loading ? 'wait' : 'pointer',
                      fontFamily: "'Nunito Sans', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {loading ? 'Envoi…' : <>Je m'inscris <ArrowRight size={13}/></>}
                  </button>
                </div>

                {error && <p style={{ fontSize: 12, color: '#C75B4E', margin: 0 }}>{error}</p>}

                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '8px 0 0', lineHeight: 1.5 }}>
                  Pas de spam. Désinscription en un clic. Données hébergées en Europe.
                </p>
              </form>

              {/* Lien fermer */}
              <button
                onClick={() => setVisible(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: 'rgba(255,255,255,0.2)',
                  marginTop: 16, display: 'block', width: '100%',
                  textAlign: 'center', fontFamily: "'Nunito Sans', sans-serif",
                }}
              >
                Non merci, je pars sans m'inscrire
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 20px)); }
          to   { opacity: 1; transform: translate(-50%, -50%); }
        }
      `}</style>
    </>
  );
}
