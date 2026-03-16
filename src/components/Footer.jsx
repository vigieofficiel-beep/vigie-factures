import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background:'#0f1114', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'48px 32px 28px', fontFamily:"'Nunito Sans', sans-serif" }}>
      <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:40, marginBottom:40 }}>

        <div>
          <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:700, color:'#D4A853', marginBottom:14, letterSpacing:0.5 }}>Vigie</h3>
          <p style={{ fontSize:13, color:'#BDBABB', lineHeight:1.7, maxWidth:200 }}>
            La solution intelligente pour gérer et automatiser votre gestion d'entreprise.
          </p>
        </div>

        <div>
          <h4 style={{ fontSize:13, fontWeight:700, letterSpacing:1.4, color:'#D8D5CF', textTransform:'uppercase', marginBottom:16 }}>Navigation</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Accueil',     to:'/'       },
              { label:'Vigie Perso', to:'/perso'  },
              { label:'Vigie Pro',   to:'/pro'    },
              { label:'Tarifs',      to:'/tarifs' },
              { label:'Contact',     to:'/contact'},
            ].map(link => (
              <Link key={link.to} to={link.to} style={{ fontSize:14, color:'#BDBABB', textDecoration:'none', transition:'color 150ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color='#D4A853'}
                onMouseLeave={e => e.currentTarget.style.color='#BDBABB'}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize:13, fontWeight:700, letterSpacing:1.4, color:'#D8D5CF', textTransform:'uppercase', marginBottom:16 }}>Légal</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Mentions légales', to:'/mentions-legales' },
              { label:'Confidentialité',  to:'/confidentialite'  },
              { label:'CGU',              to:'/cgu'              },
            ].map(link => (
              <Link key={link.label} to={link.to} style={{ fontSize:14, color:'#BDBABB', textDecoration:'none', transition:'color 150ms ease' }}
                onMouseEnter={e => e.currentTarget.style.color='#D4A853'}
                onMouseLeave={e => e.currentTarget.style.color='#BDBABB'}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize:13, fontWeight:700, letterSpacing:1.4, color:'#D8D5CF', textTransform:'uppercase', marginBottom:16 }}>Contact</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <a href="mailto:vigie-officiel@gmail.com" style={{ fontSize:14, color:'#BDBABB', textDecoration:'none', transition:'color 150ms ease' }}
              onMouseEnter={e => e.currentTarget.style.color='#D4A853'}
              onMouseLeave={e => e.currentTarget.style.color='#BDBABB'}>
              vigie-officiel@gmail.com
            </a>
            <Link to="/contact" style={{ fontSize:14, color:'#BDBABB', textDecoration:'none', transition:'color 150ms ease' }}
              onMouseEnter={e => e.currentTarget.style.color='#D4A853'}
              onMouseLeave={e => e.currentTarget.style.color='#BDBABB'}>
              Formulaire de contact
            </Link>
            <Link to="/tarifs#faq" style={{ fontSize:14, color:'#BDBABB', textDecoration:'none', transition:'color 150ms ease' }}
              onMouseEnter={e => e.currentTarget.style.color='#D4A853'}
              onMouseLeave={e => e.currentTarget.style.color='#BDBABB'}>
              FAQ
            </Link>
          </div>
        </div>

      </div>

      <div style={{ maxWidth:1000, margin:'0 auto', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>Vigie © {new Date().getFullYear()} — Tous droits réservés</span>
        <div style={{ display:'flex', gap:16 }}>
          <Link to="/mentions-legales" style={{ fontSize:11, color:'rgba(255,255,255,0.15)', textDecoration:'none' }}>Mentions légales</Link>
          <Link to="/confidentialite"  style={{ fontSize:11, color:'rgba(255,255,255,0.15)', textDecoration:'none' }}>Confidentialité</Link>
          <Link to="/cgu"              style={{ fontSize:11, color:'rgba(255,255,255,0.15)', textDecoration:'none' }}>CGU</Link>
        </div>
      </div>
    </footer>
  );
}
