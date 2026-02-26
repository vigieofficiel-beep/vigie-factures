import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  FileText, ClipboardList, Heart, FolderOpen, Home, LogOut, Pin, PinOff, Menu, X, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Footer from '../components/Footer';
import { ProfileAvatar } from '../components/ProfileAvatar';

const MODULES = [
  { id: 'factures', label: 'Vigie Factures', icon: FileText, color: '#D4A853', route: '/perso/factures', active: true },
  { id: 'demarches', label: 'Démarches', icon: ClipboardList, color: '#5BA3C7', route: '/perso/demarches', active: false },
  { id: 'sante', label: 'Santé', icon: Heart, color: '#C75B4E', route: '/perso/sante', active: false },
  { id: 'documents', label: 'Documents', icon: FolderOpen, color: '#A85BC7', route: '/perso/documents', active: false },
];

export default function PersoLayout() {
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const hoverTimeout = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleLogout = async () => {
  await supabase.auth.signOut();
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', zIndex: 40,
        }} />
      )}

      {/* Mobile hamburger */}
      {isMobile && (
        <button onClick={() => setMobileOpen(true)} style={{
          position: 'fixed', top: 16, left: 16, zIndex: 60,
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(212,168,83,0.15)', border: '1px solid rgba(212,168,83,0.3)',
          color: '#D4A853', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Menu size={18} />
        </button>
      )}

      {/* SIDEBAR */}
      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          position: isMobile ? 'fixed' : 'sticky', top: 0, left: 0,
          width: isMobile ? (mobileOpen ? 240 : 0) : sidebarWidth,
          minWidth: isMobile ? (mobileOpen ? 240 : 0) : sidebarWidth,
          height: '100vh', zIndex: 50, overflow: 'hidden',
          transition: 'width 200ms ease, min-width 200ms ease',
          display: 'flex', flexDirection: 'column',
          background: 'rgba(14,13,11,0.88)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(212,168,83,0.12)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ width: 240, height: '100%', display: 'flex', flexDirection: 'column' }}>

          {/* HEADER */}
          <div style={{
            padding: '20px 16px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            position: 'relative', minHeight: 72,
          }}>
            <ProfileAvatar mode="perso" size={64} />

            <Link to="/" title="Retour au hub" style={{ textDecoration: 'none' }}>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18, fontWeight: 700,
                color: '#EDE8DB', whiteSpace: 'nowrap',
                opacity: isOpen ? 1 : 0,
                transition: 'opacity 150ms ease',
                textAlign: 'center',
              }}>
                Vigie <span style={{ color: '#D4A853' }}>Perso</span>
              </div>
            </Link>

            <div style={{ position: 'absolute', top: 12, right: 8 }}>
              {!isMobile && (
                <button onClick={() => setPinned(p => !p)} title={pinned ? 'Désépingler' : 'Épingler'}
                  style={{
                    opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
                    background: pinned ? 'rgba(212,168,83,0.15)' : 'transparent',
                    border: `1px solid ${pinned ? 'rgba(212,168,83,0.4)' : 'transparent'}`,
                    borderRadius: 6, padding: 4, cursor: 'pointer',
                    color: pinned ? '#D4A853' : 'rgba(255,255,255,0.3)',
                    display: 'flex', flexShrink: 0, transition: 'all 150ms ease',
                  }}>
                  {pinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
              )}
              {isMobile && (
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
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
              color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
              padding: '4px 8px 8px', opacity: isOpen ? 1 : 0,
              transition: 'opacity 150ms ease', whiteSpace: 'nowrap',
            }}>
              Modules
            </div>

            {/* Accueil */}
            <NavLink
              to="/perso"
              end
              onClick={() => { if (isMobile) setMobileOpen(false); }}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 8px', borderRadius: 10, marginBottom: 2,
                textDecoration: 'none', cursor: 'pointer',
                transition: 'background 150ms ease',
                background: isActive ? 'rgba(212,168,83,0.12)' : 'transparent',
                borderLeft: isActive ? '2px solid #D4A853' : '2px solid transparent',
              })}
            >
              {({ isActive }) => (
                <>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: isActive ? 'rgba(212,168,83,0.2)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Home size={16} color={isActive ? '#D4A853' : 'rgba(255,255,255,0.45)'} strokeWidth={2} />
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#D4A853' : 'rgba(255,255,255,0.65)',
                    opacity: isOpen ? 1 : 0, transition: 'opacity 150ms ease', whiteSpace: 'nowrap',
                  }}>
                    Accueil
                  </span>
                </>
              )}
            </NavLink>

            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <NavLink
                  key={mod.id}
                  to={mod.active ? mod.route : '#'}
                  onClick={e => { if (!mod.active) e.preventDefault(); if (isMobile) setMobileOpen(false); }}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 8px', borderRadius: 10, marginBottom: 2,
                    textDecoration: 'none', cursor: mod.active ? 'pointer' : 'not-allowed',
                    opacity: mod.active ? 1 : 0.38, transition: 'background 150ms ease',
                    background: isActive && mod.active ? 'rgba(212,168,83,0.12)' : 'transparent',
                    borderLeft: isActive && mod.active ? `2px solid ${mod.color}` : '2px solid transparent',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: isActive && mod.active ? `${mod.color}20` : 'rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 150ms ease',
                      }}>
                        <Icon size={16} color={isActive && mod.active ? mod.color : 'rgba(255,255,255,0.45)'} strokeWidth={2} />
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flex: 1, overflow: 'hidden', opacity: isOpen ? 1 : 0,
                        transition: 'opacity 150ms ease', whiteSpace: 'nowrap',
                      }}>
                        <span style={{
                          fontSize: 13, fontWeight: isActive && mod.active ? 700 : 500,
                          color: isActive && mod.active ? mod.color : 'rgba(255,255,255,0.65)',
                          transition: 'color 150ms ease',
                        }}>
                          {mod.label}
                        </span>
                        {!mod.active && (
                          <span style={{
                            fontSize: 8, fontWeight: 700, letterSpacing: 0.8,
                            color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)',
                            borderRadius: 4, padding: '2px 5px',
                          }}>BIENTÔT</span>
                        )}
                        {mod.active && isActive && <ChevronRight size={12} color={mod.color} style={{ opacity: 0.6 }} />}
                      </div>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* FOOTER DECONNEXION */}
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
                <LogOut size={15} color='rgba(199,91,78,0.7)' strokeWidth={2} />
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

      <style>{`nav::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}