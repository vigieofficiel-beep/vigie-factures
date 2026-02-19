import { useNavigate, Link } from 'react-router-dom';
import { FileText, Calculator, Users, Shield, Scale, ArrowLeft, Plus } from 'lucide-react';

// Configuration des modules Pro
const PRO_MODULES = [
  {
    id: 'factures-pro',
    label: 'Factures',
    icon: FileText,
    color: '#5BA3C7',
    bg: 'rgba(91,163,199,0.12)',
    route: '/pro/factures',
    status: 'active',
    description: 'Factures & fournisseurs',
  },
  {
    id: 'comptabilite',
    label: 'Comptabilité',
    icon: Calculator,
    color: '#5BC78A',
    bg: 'rgba(91,199,138,0.12)',
    route: '/pro/comptabilite',
    status: 'coming-soon',
    description: 'Suivi comptable & TVA',
  },
  {
    id: 'rh',
    label: 'RH',
    icon: Users,
    color: '#A85BC7',
    bg: 'rgba(168,91,199,0.12)',
    route: '/pro/rh',
    status: 'coming-soon',
    description: 'Gestion des équipes',
  },
  {
    id: 'conformite',
    label: 'Conformité',
    icon: Shield,
    color: '#D4A853',
    bg: 'rgba(212,168,83,0.12)',
    route: '/pro/conformite',
    status: 'coming-soon',
    description: 'RGPD & réglementations',
  },
  {
    id: 'litiges',
    label: 'Litiges',
    icon: Scale,
    color: '#C75B4E',
    bg: 'rgba(199,91,78,0.12)',
    route: '/pro/litiges',
    status: 'coming-soon',
    description: 'Contentieux & juridique',
  },
];

export default function ProSpace() {
  const navigate = useNavigate();

  const handleClick = (module) => {
    if (module.status === 'active') {
      navigate(module.route);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAF8F3 0%, #F5F1E8 100%)',
      fontFamily: "'Nunito Sans', sans-serif",
      padding: '24px',
    }}>
      
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 40px' }}>
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
          fontSize: 'clamp(32px, 5vw, 42px)',
          fontWeight: 700,
          color: '#2C2416',
          marginBottom: 8,
        }}>
          Vigie <span style={{ color: '#5BA3C7' }}>Pro</span>
        </h1>
        <p style={{ color: 'rgba(44,36,22,0.5)', fontSize: 14 }}>
          Vos outils de gestion d'entreprise
        </p>
      </div>

      {/* Grille de modules */}
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 20,
      }}>
        {PRO_MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = module.status === 'active';

          return (
            <button
              key={module.id}
              onClick={() => handleClick(module)}
              disabled={!isActive}
              style={{
                background: 'white',
                border: `2px solid ${isActive ? module.color + '40' : 'rgba(44,36,22,0.06)'}`,
                borderRadius: 20,
                padding: '32px 20px',
                cursor: isActive ? 'pointer' : 'not-allowed',
                opacity: isActive ? 1 : 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                if (isActive) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 8px 32px ${module.color}25`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)';
              }}
            >
              {/* Badge "Bientôt" */}
              {!isActive && (
                <span style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(44,36,22,0.06)',
                  borderRadius: 8,
                  padding: '3px 8px',
                  fontSize: 9,
                  color: 'rgba(44,36,22,0.4)',
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}>
                  BIENTÔT
                </span>
              )}

              {/* Icône */}
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: module.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={28} color={module.color} strokeWidth={2.5} />
              </div>

              {/* Label */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isActive ? '#2C2416' : 'rgba(44,36,22,0.4)',
                  marginBottom: 4,
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  {module.label}
                </div>
                <div style={{
                  fontSize: 11,
                  color: 'rgba(44,36,22,0.4)',
                  lineHeight: 1.4,
                }}>
                  {module.description}
                </div>
              </div>
            </button>
          );
        })}

        {/* Carte "Autres modules" */}
        <div style={{
          background: 'transparent',
          border: '2px dashed rgba(44,36,22,0.12)',
          borderRadius: 20,
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          opacity: 0.4,
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(44,36,22,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Plus size={28} color="rgba(44,36,22,0.3)" strokeWidth={2} />
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(44,36,22,0.3)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            D'autres modules arrivent bientôt
          </div>
        </div>
      </div>
    </div>
  );
}

export { PRO_MODULES };