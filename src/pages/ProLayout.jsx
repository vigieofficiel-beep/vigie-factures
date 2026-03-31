import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Home, LogOut, Pin, PinOff, Menu, X, ChevronDown,
  Wallet, Receipt, TrendingUp,
  FileCheck, AlertCircle, Mail,
  Users, ShoppingCart, Download,
  Clock, FileText, Calculator, UserCircle, FilePlus,
} from 'lucide-react';
import { supabasePro } from '../lib/supabasePro';
import Footer from '../components/Footer';
import { ProfileAvatar } from '../components/ProfileAvatar';
import Vigil from './Vigil';
import AnalyseDocumentFlottant from '../components/AnalyseDocumentFlottant';
import { PlanProvider } from '../hooks/usePlan.jsx';
import { WorkspaceProvider } from '../hooks/useWorkspace.jsx';
import WorkspaceSwitcher from '../components/WorkspaceSwitcher.jsx';

const NAV = [
  { id:'accueil', label:'Bureau', icon:Home, color:'#5BA3C7', route:'/pro', exact:true, active:true },
  {
    id:'tresorerie', label:'Trésorerie', icon:Wallet, color:'#5BC78A', active:true,
    children:[
      { id:'depenses', label:'Dépenses', icon:Receipt,    color:'#5BC78A', route:'/pro/depenses', active:true },
      { id:'recettes', label:'Recettes', icon:TrendingUp, color:'#5BC78A', route:'/pro/recettes', active:true },
      { id:'banque',   label:'Banque',   icon:Wallet,     color:'#5BC78A', route:'/pro/banque',   active:true },
    ],
  },
  {
    id:'juridique', label:'Juridique', icon:FileCheck, color:'#5BC78A', active:true,
    children:[
      { id:'contrats',   label:'Contrats',   icon:FileCheck,   color:'#5BC78A', route:'/pro/contrats',   active:true },
      { id:'formalites', label:'Formalités', icon:AlertCircle, color:'#5BC78A', route:'/pro/formalites', active:true },
      { id:'mail-agent', label:'Mail Agent', icon:Mail,        color:'#5BC78A', route:'/pro/mail-agent', active:true },
    ],
  },
  {
    id:'documents', label:'Documents', icon:FilePlus, color:'#5BA3C7', active:true,
    children:[
      { id:'doc-factures', label:'Factures', icon:FileText, color:'#5BA3C7', route:'/pro/documents?tab=factures', active:true },
      { id:'doc-devis',    label:'Devis',    icon:FilePlus, color:'#5BA3C7', route:'/pro/documents?tab=devis',    active:true },
    ],
  },
  {
    id:'outils', label:'Outils', icon:Calculator, color:'#5BA3C7', active:true,
    children:[
      { id:'tva',           label:'Calculateur TVA',       icon:Calculator, color:'#5BA3C7', route:'/pro/tva',           active:true },
      { id:'charges',       label:'Charges sociales',      icon:Calculator, color:'#5BA3C7', route:'/pro/charges',       active:true },
      { id:'devises',       label:'Convertisseur devises', icon:Calculator, color:'#5BA3C7', route:'/pro/devises',       active:true },
      { id:'rentabilite',   label:'Rentabilité clients',   icon:Calculator, color:'#5BA3C7', route:'/pro/rentabilite',   active:true },
      { id:'graphiques',    label:'Graphiques',            icon:Calculator, color:'#5BA3C7', route:'/pro/graphiques',    active:true },
      { id:'amortissement', label:'Amortissement',         icon:Calculator, color:'#5BA3C7', route:'/pro/amortissement', active:true },
      { id:'salaire',       label:'Simulateur salaire',    icon:Calculator, color:'#5BA3C7', route:'/pro/salaire',       active:true },
      { id:'seuil',         label:'Seuil de rentabilité',  icon:Calculator, color:'#5BA3C7', route:'/pro/seuil',         active:true },
      { id:'fiscal',        label:'Tableau fiscal',        icon:Calculator, color:'#5BA3C7', route:'/pro/fiscal',        active:true },
    ],
  },
  {
    id:'operations', label:'Opérations', icon:Users, color:'#A85BC7', active:true,
    children:[
      { id:'equipe',       label:'Équipe',       icon:Users,        color:'#A85BC7', route:'/pro/equipe',       active:true },
      { id:'pointages',    label:'Pointages',    icon:Clock,        color:'#A85BC7', route:'/pro/pointages',    active:true },
      { id:'fournisseurs', label:'Fournisseurs', icon:ShoppingCart, color:'#A85BC7', route:'/pro/fournisseurs', active:true },
      { id:'exports',      label:'Exports',      icon:Download,     color:'#A85BC7', route:'/pro/exports',      active:true },
    ],
  },
];

// Barre de navigation mobile — 5 raccourcis principaux
const MOBILE_NAV = [
  { label:'Bureau',   icon:Home,      route:'/pro',           exact:true,  color:'#5BA3C7' },
  { label:'Dépenses', icon:Receipt,   route:'/pro/depenses',  exact:false, color:'#5BC78A' },
  { label:'Recettes', icon:TrendingUp,route:'/pro/recettes',  exact:false, color:'#5BC78A' },
  { label:'Banque',   icon:Wallet,    route:'/pro/banque',    exact:false, color:'#5BC78A' },
  { label:'Menu',     icon:Menu,      route:null,             exact:false, color:'#5BA3C7' },
];

export default function ProLayout() {
  const [expanded,   setExpanded]   = useState(false);
  const [pinned,     setPinned]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ tresorerie: true });
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768);
  const [compteOpen, setCompteOpen] = useState(false);
  const hoverTimeout = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    NAV.forEach(item => {
      if (item.children) {
        const isGroupActive = item.children.some(c => location.pathname.startsWith(c.route?.split('?')[0]));
        if (isGroupActive) setOpenGroups(prev => ({ ...prev, [item.id]: true }));
      }
    });
    if (location.pathname.startsWith('/pro/profil')) setCompteOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobile) setMobileOpen(false);
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

  const isOpen       = isMobile ? mobileOpen : (pinned || expanded);
  const sidebarWidth = isOpen ? 240 : 64;
  const toggleGroup  = (id) => { if (!isOpen) return; setOpenGroups(prev => ({ ...prev, [id]: !prev[id] })); };
  const handleLogout = async () => { await supabasePro.auth.signOut(); window.location.href = '/'; };

  return (
    <WorkspaceProvider>
    <PlanProvider>
    <div style={{ display:'flex', minHeight:'100vh', background:'#06080B', fontFamily:"'Nunito Sans', sans-serif", position:'relative' }}>

      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', backdropFilter:'blur(4px)', zIndex:40 }} />
      )}

      {/* SIDEBAR — desktop uniquement */}
      {!isMobile && (
        <aside
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ position:'sticky', top:0, left:0, width:sidebarWidth, minWidth:sidebarWidth, height:'100vh', zIndex:50, overflow:'hidden', transition:'width 200ms ease, min-width 200ms ease', display:'flex', flexDirection:'column', background:'rgba(15,23,42,0.92)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderRight:'1px solid rgba(91,163,199,0.15)', boxShadow:'4px 0 32px rgba(15,23,42,0.2)' }}
        >
          <div style={{ width:240, height:'100%', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', alignItems:'center', gap:10, position:'relative', minHeight:72 }}>
              <ProfileAvatar mode="pro" size={64} />
              <Link to="/" title="Retour à l'accueil" style={{ textDecoration:'none' }}>
                <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:18, fontWeight:700, color:'#F8FAFC', whiteSpace:'nowrap', textAlign:'center', opacity:isOpen?1:0, transition:'opacity 150ms ease' }}>
                  Vigie <span style={{ color:'#5BA3C7' }}>Pro</span>
                </div>
              </Link>
              <div style={{ position:'absolute', top:12, right:8 }}>
                <button onClick={() => setPinned(p => !p)} title={pinned?'Désépingler':'Épingler'} style={{ opacity:isOpen?1:0, pointerEvents:isOpen?'auto':'none', background:pinned?'rgba(91,163,199,0.15)':'transparent', border:`1px solid ${pinned?'rgba(91,163,199,0.4)':'transparent'}`, borderRadius:6, padding:4, cursor:'pointer', color:pinned?'#5BA3C7':'rgba(255,255,255,0.3)', display:'flex', transition:'all 150ms ease' }}>
                  {pinned ? <Pin size={14} /> : <PinOff size={14} />}
                </button>
              </div>
            </div>

            <nav style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'12px 4px 12px 8px' }}>
              {NAV.map((item) => {
                const Icon = item.icon;
                if (!item.children) {
                  return (
                    <NavLink key={item.id} to={item.route} end={item.exact}
                      style={({ isActive }) => ({ display:'flex', alignItems:'center', gap:12, padding:'10px 8px', borderRadius:10, marginBottom:2, textDecoration:'none', background:isActive?`${item.color}18`:'transparent', borderLeft:isActive?`2px solid ${item.color}`:'2px solid transparent', transition:'background 150ms ease' })}>
                      {({ isActive }) => (<>
                        <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:isActive?`${item.color}25`:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Icon size={16} color={isActive?item.color:'rgba(255,255,255,0.45)'} strokeWidth={2} />
                        </div>
                        <span style={{ fontSize:13, fontWeight:isActive?700:500, color:isActive?item.color:'rgba(255,255,255,0.65)', opacity:isOpen?1:0, transition:'opacity 150ms ease', whiteSpace:'nowrap' }}>{item.label}</span>
                      </>)}
                    </NavLink>
                  );
                }

                const isGroupOpen   = openGroups[item.id];
                const isGroupActive = item.children.some(c => location.pathname.startsWith(c.route?.split('?')[0]));

                return (
                  <div key={item.id} style={{ marginBottom:2 }}>
                    <button onClick={() => toggleGroup(item.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 8px', borderRadius:10, border:'none', background:isGroupActive?`${item.color}12`:'transparent', borderLeft:isGroupActive?`2px solid ${item.color}`:'2px solid transparent', cursor:'pointer', transition:'background 150ms ease' }}>
                      <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:isGroupActive?`${item.color}20`:'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon size={16} color={isGroupActive?item.color:'rgba(255,255,255,0.45)'} strokeWidth={2} />
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flex:1, opacity:isOpen?1:0, transition:'opacity 150ms ease' }}>
                        <span style={{ fontSize:13, fontWeight:isGroupActive?700:500, color:isGroupActive?item.color:'rgba(255,255,255,0.65)', whiteSpace:'nowrap' }}>{item.label}</span>
                        <ChevronDown size={13} color="rgba(255,255,255,0.3)" style={{ transform:isGroupOpen?'rotate(0deg)':'rotate(-90deg)', transition:'transform 200ms ease' }}/>
                      </div>
                    </button>

                    {isGroupOpen && isOpen && (
                      <div style={{ paddingLeft:16, marginTop:2 }}>
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink key={child.id} to={child.route}
                              style={({ isActive }) => ({ display:'flex', alignItems:'center', gap:10, padding:'8px 8px', borderRadius:8, marginBottom:1, textDecoration:'none', background:isActive?`${child.color}15`:'transparent', borderLeft:isActive?`2px solid ${child.color}`:'2px solid transparent', transition:'background 150ms ease' })}>
                              {({ isActive }) => (<>
                                <div style={{ width:26, height:26, borderRadius:6, flexShrink:0, background:isActive?`${child.color}20`:'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <ChildIcon size={13} color={isActive?child.color:'rgba(255,255,255,0.35)'} strokeWidth={2} />
                                </div>
                                <span style={{ fontSize:12, fontWeight:isActive?600:400, color:isActive?child.color:'rgba(255,255,255,0.5)', whiteSpace:'nowrap' }}>{child.label}</span>
                              </>)}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'8px 8px 4px' }}>
              <WorkspaceSwitcher isOpen={isOpen} />
              <div style={{ marginBottom:4 }}>
                <button onClick={() => { if (!isOpen) return; setCompteOpen(v => !v); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'9px 8px', borderRadius:10, border:'none', background:compteOpen&&isOpen?'rgba(91,163,199,0.1)':'transparent', cursor:'pointer', transition:'background 150ms ease' }}>
                  <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:'rgba(91,163,199,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <UserCircle size={15} color="#5BA3C7" strokeWidth={2} />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flex:1, opacity:isOpen?1:0, transition:'opacity 150ms ease' }}>
                    <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.65)', whiteSpace:'nowrap' }}>Mon compte</span>
                    <ChevronDown size={13} color="rgba(255,255,255,0.3)" style={{ transform:compteOpen?'rotate(0deg)':'rotate(-90deg)', transition:'transform 200ms ease' }}/>
                  </div>
                </button>
                {compteOpen && isOpen && (
                  <div style={{ paddingLeft:16, marginTop:2 }}>
                    <NavLink to="/pro/profil"
                      style={({ isActive }) => ({ display:'flex', alignItems:'center', gap:10, padding:'8px 8px', borderRadius:8, marginBottom:1, textDecoration:'none', background:isActive?'rgba(91,163,199,0.15)':'transparent', borderLeft:isActive?'2px solid #5BA3C7':'2px solid transparent', transition:'background 150ms ease' })}>
                      {({ isActive }) => (<>
                        <div style={{ width:26, height:26, borderRadius:6, flexShrink:0, background:isActive?'rgba(91,163,199,0.2)':'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <UserCircle size={13} color={isActive?'#5BA3C7':'rgba(255,255,255,0.35)'} strokeWidth={2} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:isActive?600:400, color:isActive?'#5BA3C7':'rgba(255,255,255,0.5)', whiteSpace:'nowrap' }}>Mon profil</span>
                      </>)}
                    </NavLink>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'9px 8px', borderRadius:10, border:'none', background:'transparent', cursor:'pointer', transition:'background 150ms ease', marginBottom:4 }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(199,91,78,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:'rgba(199,91,78,0.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <LogOut size={15} color="rgba(199,91,78,0.7)" strokeWidth={2} />
                </div>
                <span style={{ fontSize:13, fontWeight:500, color:'rgba(199,91,78,0.7)', opacity:isOpen?1:0, transition:'opacity 150ms ease', whiteSpace:'nowrap' }}>Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* SIDEBAR MOBILE — drawer latéral */}
      {isMobile && (
        <aside style={{ position:'fixed', top:0, left:0, width:mobileOpen?280:0, height:'100vh', zIndex:50, overflow:'hidden', transition:'width 220ms ease', display:'flex', flexDirection:'column', background:'rgba(15,23,42,0.98)', backdropFilter:'blur(16px)', borderRight:'1px solid rgba(91,163,199,0.15)', boxShadow:mobileOpen?'4px 0 32px rgba(0,0,0,0.4)':'none' }}>
          <div style={{ width:280, height:'100%', display:'flex', flexDirection:'column' }}>

            {/* Header mobile */}
            <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:'#F8FAFC' }}>
                Vigie <span style={{ color:'#5BA3C7' }}>Pro</span>
              </div>
              <button onClick={() => setMobileOpen(false)} style={{ background:'rgba(255,255,255,0.06)', border:'none', borderRadius:8, padding:8, cursor:'pointer', color:'rgba(237,232,219,0.5)', display:'flex' }}>
                <X size={18} />
              </button>
            </div>

            {/* Nav mobile */}
            <nav style={{ flex:1, overflowY:'auto', padding:'12px 8px' }}>
              {NAV.map((item) => {
                const Icon = item.icon;
                if (!item.children) {
                  return (
                    <NavLink key={item.id} to={item.route} end={item.exact} onClick={() => setMobileOpen(false)}
                      style={({ isActive }) => ({ display:'flex', alignItems:'center', gap:12, padding:'12px 12px', borderRadius:10, marginBottom:4, textDecoration:'none', background:isActive?`${item.color}18`:'transparent', borderLeft:isActive?`2px solid ${item.color}`:'2px solid transparent' })}>
                      {({ isActive }) => (<>
                        <Icon size={18} color={isActive?item.color:'rgba(255,255,255,0.45)'} strokeWidth={2} />
                        <span style={{ fontSize:14, fontWeight:isActive?700:500, color:isActive?item.color:'rgba(255,255,255,0.65)' }}>{item.label}</span>
                      </>)}
                    </NavLink>
                  );
                }

                const isGroupOpen   = openGroups[item.id];
                const isGroupActive = item.children.some(c => location.pathname.startsWith(c.route?.split('?')[0]));

                return (
                  <div key={item.id} style={{ marginBottom:4 }}>
                    <button onClick={() => toggleGroup(item.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px 12px', borderRadius:10, border:'none', background:isGroupActive?`${item.color}12`:'transparent', cursor:'pointer' }}>
                      <Icon size={18} color={isGroupActive?item.color:'rgba(255,255,255,0.45)'} strokeWidth={2} />
                      <span style={{ flex:1, fontSize:14, fontWeight:isGroupActive?700:500, color:isGroupActive?item.color:'rgba(255,255,255,0.65)', textAlign:'left' }}>{item.label}</span>
                      <ChevronDown size={14} color="rgba(255,255,255,0.3)" style={{ transform:isGroupOpen?'rotate(0deg)':'rotate(-90deg)', transition:'transform 200ms ease' }}/>
                    </button>
                    {isGroupOpen && (
                      <div style={{ paddingLeft:20, marginTop:2 }}>
                        {item.children.map(child => {
                          const ChildIcon = child.icon;
                          return (
                            <NavLink key={child.id} to={child.route} onClick={() => setMobileOpen(false)}
                              style={({ isActive }) => ({ display:'flex', alignItems:'center', gap:10, padding:'10px 10px', borderRadius:8, marginBottom:2, textDecoration:'none', background:isActive?`${child.color}15`:'transparent', borderLeft:isActive?`2px solid ${child.color}`:'2px solid transparent' })}>
                              {({ isActive }) => (<>
                                <ChildIcon size={15} color={isActive?child.color:'rgba(255,255,255,0.35)'} strokeWidth={2} />
                                <span style={{ fontSize:13, fontWeight:isActive?600:400, color:isActive?child.color:'rgba(255,255,255,0.5)' }}>{child.label}</span>
                              </>)}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Footer mobile */}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding:'12px' }}>
              <NavLink to="/pro/profil" onClick={() => setMobileOpen(false)}
                style={({ isActive }) => ({ display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:10, marginBottom:4, textDecoration:'none', background:isActive?'rgba(91,163,199,0.15)':'rgba(255,255,255,0.04)' })}>
                {({ isActive }) => (<>
                  <UserCircle size={18} color={isActive?'#5BA3C7':'rgba(255,255,255,0.45)'} />
                  <span style={{ fontSize:14, color:isActive?'#5BA3C7':'rgba(255,255,255,0.65)' }}>Mon profil</span>
                </>)}
              </NavLink>
              <button onClick={handleLogout} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:10, border:'none', background:'rgba(199,91,78,0.08)', cursor:'pointer' }}>
                <LogOut size={18} color="rgba(199,91,78,0.7)" />
                <span style={{ fontSize:14, color:'rgba(199,91,78,0.7)' }}>Déconnexion</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        <main style={{ flex:1, paddingBottom: isMobile ? 72 : 0, paddingTop: isMobile ? 16 : 0 }}>
          <Outlet />
        </main>
        {!isMobile && <Footer />}
      </div>

      {/* BARRE NAVIGATION MOBILE EN BAS */}
      {isMobile && (
        <nav style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:60, height:64, background:'rgba(15,23,42,0.97)', backdropFilter:'blur(16px)', borderTop:'1px solid rgba(91,163,199,0.15)', display:'flex', alignItems:'center', justifyContent:'space-around', padding:'0 4px', paddingBottom:'env(safe-area-inset-bottom)' }}>
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            if (!item.route) {
              return (
                <button key={item.label} onClick={() => setMobileOpen(true)}
                  style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 12px', borderRadius:10, border:'none', background:'transparent', cursor:'pointer', color:'rgba(255,255,255,0.45)', minWidth:56 }}>
                  <Icon size={22} strokeWidth={1.8} />
                  <span style={{ fontSize:9, fontWeight:500 }}>Menu</span>
                </button>
              );
            }
            const isActive = item.exact
              ? location.pathname === item.route
              : location.pathname.startsWith(item.route);
            return (
              <NavLink key={item.label} to={item.route}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'8px 12px', borderRadius:10, textDecoration:'none', background:isActive?`${item.color}18`:'transparent', minWidth:56 }}>
                <Icon size={22} color={isActive?item.color:'rgba(255,255,255,0.45)'} strokeWidth={isActive?2:1.8} />
                <span style={{ fontSize:9, fontWeight:isActive?700:500, color:isActive?item.color:'rgba(255,255,255,0.45)' }}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}

      <AnalyseDocumentFlottant />
      <Vigil />
      <style>{`
        nav::-webkit-scrollbar { width: 4px; }
        nav::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); border-radius: 2px; }
        nav::-webkit-scrollbar-thumb { background: rgba(91,163,199,0.35); border-radius: 2px; }
        nav::-webkit-scrollbar-thumb:hover { background: rgba(91,163,199,0.6); }
        * { -webkit-tap-highlight-color: transparent; }
        input, select, textarea { font-size: 16px !important; }
      `}</style>
    </div>
    </PlanProvider>
    </WorkspaceProvider>
  );
}
