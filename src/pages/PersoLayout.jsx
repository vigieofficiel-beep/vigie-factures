import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Home, LogOut, Pin, PinOff, Menu, X, ChevronRight, ChevronDown,
  // Trésorerie
  Wallet, Receipt, TrendingUp,
  // Juridique
  FileCheck, AlertCircle, Mail,
  // Opérations
  Users, ShoppingCart, Download,
  Clock,
  // Vigie Factures (existant)
  FileText,
} from 'lucide-react';
import { supabasePro } from '../lib/supabasePro';
import Footer from '../components/Footer';
import { ProfileAvatar } from '../components/ProfileAvatar';
import Vigil from './Vigil';

/* ══════════════════════════════════════════
   STRUCTURE DE NAVIGATION
══════════════════════════════════════════ */
const NAV = [
  {
    id: 'accueil',
    label: 'Accueil',
    icon: Home,
    color: '#5BA3C7',
    route: '/pro',
    exact: true,
    active: true,
  },
  {
    id: 'tresorerie',
    label: 'Trésorerie',
    icon: Wallet,
    color: '#5BC78A',
    active: true,
    children: [
      { id: 'depenses', label: 'Dépenses', icon: Receipt,     color: '#5BC78A', route: '/pro/depenses',  active: true  },
      { id: 'recettes', label: 'Recettes', icon: TrendingUp,  color: '#5BC78A', route: '/pro/recettes',  active: true },
      { id: 'banque',   label: 'Banque',   icon: Wallet,      color: '#5BC78A', route: '/pro/banque',    active: true },
    ],
  },
  {
    id: 'juridique',
    label: 'Juridique',
    icon: FileCheck,
    color: '#5BC78A',
    active: true,
    children: [
      { id: 'contrats',   label: 'Contrats',   icon: FileCheck,  color: '#5BC78A', route: '/pro/contrats',   active: true },
      { id: 'formalites', label: 'Formalités', icon: AlertCircle,color: '#5BC78A', route: '/pro/formalites', active: true },
      { id: 'mail-agent', label: 'Mail Agent', icon: Mail,       color: '#5BC78A', route: '/pro/mail-agent', active: true },
    ],
  },
  {
    id: 'operations',
    label: 'Opérations',
    icon: Users,
    color: '#A85BC7',
    active: true,
    children: [
      { id: 'equipe',      label: 'Équipe',      icon: Users,       color: '#A85BC7', route: '/pro/equipe',      active: true },
      { id: 'pointages',    label: 'Pointages',    icon: Clock,        color: '#A85BC7', route: '/pro/pointages',   active: true  },
      { id: 'fournisseurs',label: 'Fournisseurs',icon: ShoppingCart,color: '#A85BC7', route: '/pro/fournisseurs',active: true },
      { id: 'exports',     label: 'Exports',     icon: Download,    color: '#A85BC7', route: '/pro/exports',     active: true },
    ],
  },
];

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
══════════════════════════════════════════ */
export default function ProLayout() {
  const [expanded,   setExpanded]   = useState(false);
  const [pinned,     setPinned]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ tresorerie: true });
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768);
  const hoverTimeout = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ouvre automatiquement le groupe actif selon la route
  useEffect(() => {
    NAV.forEach(item => {
      if (item.children) {
        const isGroupActive = item.children.some(c => location.pathname.startsWith(c.route));
        if (isGroupActive) {
          setOpenGroups(prev => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const handleMouseEnter = () => {
    if (pinned || isMobile) return;
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setExpanded(true), 80);
  };
  const handleMouseLeave = () => {
    if (pinned || isMobile) return;
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setExpanded(false), 120);
  };

  const isOpen = isMobile ? mobileOpen : (pinned || expanded);
  const sidebarWidth = isOpen ? 240 : 64;

  const toggleGroup = (id) => {
    if (!isOpen) return;
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = async () => {
    await supabasePro.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
      fontFamily: "'Nunito Sans', sans-serif", position: 'relative',
    }}>

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(4px)', zIndex: 40,
        }} />
      )}

      {/* Mobile hamburger */}
      {isMobile && (
        <button onClick={() => setMobileOpen(true)} style={{
          position: 'fixed', top: 16, left: 16, zIndex: 60,
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)',
          color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Menu size={18} />
        </button>
      )}

      {/* ══ SIDEBAR ══ */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: isMobile ? 'fixed' : 'sticky', top: 0, left: 0,
          width:    isMobile ? (mobileOpen ? 240 : 0) : sidebarWidth,
          minWidth: isMobile ? (mobileOpen ? 240 : 0) : sidebarWidth,
          height: '100vh', zIndex: 50, overflow: 'hidden',
          transition: 'width 200ms ease, min-width 200ms ease',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(15,23,42,0.92)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(91,163,199,0.15)',
          boxShadow: '4px 0 32px rgba(15,23,42,0.2)',
        }}
      >
        <div style={{ width: 240, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* HEADER avatar + titre */}
          <div style={{
            padding: '20px 16px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            position: 'relative', minHeight: 72,
          }}>
            <ProfileAvatar mode="pro" size={64} />
            <Link to="/" title="Retour au hub" style={{ textDecoration: 'none' }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18, fontWeight: 700, color: '#F8FAFC',
                whiteSpace: 'nowrap', textAlign: 'center',
                opacity: isOpen ? 1 : 0, transition: 'opacity 150ms ease',
              }}>
                Vigie <span style={{ color: '#5BA3C7' }}>Pro</span>
              </div>
            </Link>
            <div style={{ position: 'absolute', top: 12, right: 8 }}>
              {!isMobile ? (
                <button onClick={() => setPinned(p => !p)} title={pinned ? 'Désépingler' : 'Épingler'}
                  style={{
                    opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
                    background: pinned ? 'rgba(91,163,199,0.15)' : 'transparent',
                    border: `1px solid ${pinned ? 'rgba(91,163,199,0.4)' : 'transparent'}`,
                    borderRadius: 6, padding: 4, cursor: 'pointer',
                    color: pinned ? '#5BA3C7' : 'rgba(255,255,255,0.3)',
                    display: 'flex', transition: 'all 150ms ease',
                  }}>
                  {pinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
              ) : (
                <button onClick={() => setMobileOpen(false)} style={{
                  background: 'transparent', border: 'none',
                  color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: 4,
                }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* NAVIGATION */}
          <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 8px', scrollbarWidth: 'none' }}>

            {NAV.map((item) => {
              const Icon = item.icon;

              /* ── Lien simple (Accueil) ── */
              if (!item.children) {
                return (
                  <NavLink
                    key={item.id}
                    to={item.route}
                    end={item.exact}
                    onClick={() => { if (isMobile) setMobileOpen(false); }}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 8px', borderRadius: 10, marginBottom: 2,
                      textDecoration: 'none',
                      background: isActive ? `${item.color}18` : 'transparent',
                      borderLeft: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                      transition: 'background 150ms ease',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: isActive ? `${item.color}25` : 'rgba(255,255,255,0.04)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={16} color={isActive ? item.color : 'rgba(255,255,255,0.45)'} strokeWidth={2} />
                        </div>
                        <span style={{
                          fontSize: 13, fontWeight: isActive ? 700 : 500,
                          color: isActive ? item.color : 'rgba(255,255,255,0.65)',
                          opacity: isOpen ? 1 : 0, transition: 'opacity 150ms ease', whiteSpace: 'nowrap',
                        }}>
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                );
              }

              /* ── Groupe avec enfants ── */
              const isGroupOpen   = openGroups[item.id];
              const isGroupActive = item.children.some(c => location.pathname.startsWith(c.route));

              return (
                <div key={item.id} style={{ marginBottom: 2 }}>

                  {/* En-tête du groupe */}
                  <button
                    onClick={() => toggleGroup(item.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 8px', borderRadius: 10, border: 'none',
                      background: isGroupActive ? `${item.color}12` : 'transparent',
                      borderLeft: isGroupActive ? `2px solid ${item.color}` : '2px solid transparent',
                      cursor: item.active ? 'pointer' : 'default',
                      opacity: item.active ? 1 : 0.38,
                      transition: 'background 150ms ease',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: isGroupActive ? `${item.color}20` : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} color={isGroupActive ? item.color : 'rgba(255,255,255,0.45)'} strokeWidth={2} />
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flex: 1, opacity: isOpen ? 1 : 0, transition: 'opacity 150ms ease',
                    }}>
                      <span style={{
                        fontSize: 13, fontWeight: isGroupActive ? 700 : 500,
                        color: isGroupActive ? item.color : 'rgba(255,255,255,0.65)',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {!item.active && (
                          <span style={{
                            fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
                            color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)',
                            borderRadius: 4, padding: '2px 5px',
                          }}>BIENTÔT</span>
                        )}
                        {item.active && (
                          <ChevronDown size={13} color="rgba(255,255,255,0.3)"
                            style={{ transform: isGroupOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 200ms ease' }}
                          />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Sous-items */}
                  {item.active && isGroupOpen && isOpen && (
                    <div style={{ paddingLeft: 16, marginTop: 2 }}>
                      {item.children.map(child => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.id}
                            to={child.active ? child.route : '#'}
                            onClick={e => {
                              if (!child.active) e.preventDefault();
                              if (isMobile) setMobileOpen(false);
                            }}
                            style={({ isActive }) => ({
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 8px', borderRadius: 8, marginBottom: 1,
                              textDecoration: 'none',
                              cursor: child.active ? 'pointer' : 'not-allowed',
                              opacity: child.active ? 1 : 0.4,
                              background: isActive && child.active ? `${child.color}15` : 'transparent',
                              borderLeft: isActive && child.active ? `2px solid ${child.color}` : '2px solid transparent',
                              transition: 'background 150ms ease',
                            })}
                          >
                            {({ isActive }) => (
                              <>
                                <div style={{
                                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                                  background: isActive && child.active ? `${child.color}20` : 'rgba(255,255,255,0.03)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <ChildIcon size={13} color={isActive && child.active ? child.color : 'rgba(255,255,255,0.35)'} strokeWidth={2} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                                  <span style={{
                                    fontSize: 12, fontWeight: isActive && child.active ? 600 : 400,
                                    color: isActive && child.active ? child.color : 'rgba(255,255,255,0.5)',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {child.label}
                                  </span>
                                  {!child.active && (
                                    <span style={{
                                      fontSize: 7, fontWeight: 700, letterSpacing: 0.8,
                                      color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)',
                                      borderRadius: 3, padding: '1px 4px',
                                    }}>BIENTÔT</span>
                                  )}
                                </div>
                              </>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* FOOTER DÉCONNEXION */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 8px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 8px', borderRadius: 10, border: 'none',
                background: 'transparent', cursor: 'pointer', transition: 'background 150ms ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(199,91,78,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(199,91,78,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogOut size={15} color="rgba(199,91,78,0.7)" strokeWidth={2} />
              </div>
              <span style={{
                fontSize: 13, fontWeight: 500, color: 'rgba(199,91,78,0.7)',
                opacity: isOpen ? 1 : 0, transition: 'opacity 150ms ease', whiteSpace: 'nowrap',
              }}>
                Déconnexion
              </span>
            </button>
          </div>

        </div>
      </aside>

      {/* MAIN + FOOTER */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {isMobile && <div style={{ height: 64 }} />}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* ══ VIGIL — Assistant flottant ══ */}
      <Vigil />

      <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
