import { useNavigate } from 'react-router-dom';
import { FileText, Briefcase, Home, Heart, Plus } from 'lucide-react';

const VIGIE_MODULES = [
  {
    id: 'vigie-factures',
    label: 'Factures',
    icon: FileText,
    color: '#D4A853',
    bg: 'rgba(212,168,83,0.12)',
    route: '/app/vigie-factures',
    status: 'active',
    description: 'Analysez et gérez vos factures',
  },
  {
    id: 'vigie-emploi',
    label: 'Emploi',
    icon: Briefcase,
    color: '#5BA3C7',
    bg: 'rgba(91,163,199,0.12)',
    route: '/app/vigie-emploi',
    status: 'coming-soon',
    description: 'Alertes offres & analyse CV',
  },
  {
    id: 'vigie-logement',
    label: 'Logement',
    icon: Home,
    color: '#5BC78A',
    bg: 'rgba(91,199,138,0.12)',
    route: '/app/vigie-logement',
    status: 'coming-soon',
    description: 'Annonces & suivi des loyers',
  },
  {
    id: 'vigie-aides',
    label: 'Aides',
    icon: Heart,
    color: '#C75B4E',
    bg: 'rgba(199,91,78,0.12)',
    route: '/app/vigie-aides',
    status: 'coming-soon',
    description: 'Aides & éligibilité',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const handleClick = (module) => {
    if (module.status === 'active') {
      navigate(module.route);
    }
  };

  return (
    <div style={{ padding: '40px 24px 60px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, color: '#EDE8DB', marginBottom: 10 }}>
          Plateforme <span style={{ color: '#D4A853' }}>Vigie</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
          Choisissez un module pour commencer
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20, justifyItems: 'center' }}>
        {VIGIE_MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = module.status === 'active';

          return (
            <button
              key={module.id}
              onClick={() => handleClick(module)}
              disabled={!isActive}
              style={{ width: '100%', maxWidth: 180, background: isActive ? module.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${isActive ? module.color + '30' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, padding: '28px 16px 20px', cursor: isActive ? 'pointer' : 'not-allowed', opacity: isActive ? 1 : 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative' }}
              onMouseEnter={e => { if (isActive) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${module.color}20`; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {!isActive && (
                <span style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '2px 6px', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                  BIENTÔT
                </span>
              )}
              <div style={{ width: 56, height: 56, borderRadius: 16, background: isActive ? module.color + '20' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={26} color={isActive ? module.color : 'rgba(255,255,255,0.2)'} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? '#EDE8DB' : 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                  {module.label}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.4 }}>
                  {module.description}
                </div>
              </div>
            </button>
          );
        })}

        <button style={{ width: '100%', maxWidth: 180, background: 'transparent', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 16px 20px', cursor: 'default', opacity: 0.4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={24} color="rgba(255,255,255,0.2)" />
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            D'autres modules arrivent bientôt
          </div>
        </button>
      </div>
    </div>
  );
}