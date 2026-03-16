import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Clock, CheckCircle } from 'lucide-react';

export default function Contact() {
  const [form,    setForm]    = useState({ nom:'', email:'', sujet:'', message:'' });
  const [envoye,  setEnvoye]  = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulation envoi — à brancher sur Resend si besoin
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setEnvoye(true);
  };

  const iS = { width:'100%', padding:'11px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#EDE8DB', fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' };
  const lS = { display:'block', fontSize:11, fontWeight:700, color:'rgba(237,232,219,0.5)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' };

  if (envoye) return (
    <div style={{ minHeight:'100vh', background:'#08090C', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito Sans', sans-serif", padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:400 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(91,199,138,0.1)', border:'1px solid rgba(91,199,138,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <CheckCircle size={28} color="#5BC78A"/>
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:700, color:'#EDE8DB', marginBottom:12 }}>Message envoyé !</h2>
        <p style={{ fontSize:14, color:'rgba(237,232,219,0.5)', lineHeight:1.7, marginBottom:28 }}>
          Nous avons bien reçu votre message et vous répondrons sous 48h à l'adresse <strong style={{ color:'#5BA3C7' }}>{form.email}</strong>.
        </p>
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 24px', borderRadius:10, background:'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:13, fontWeight:700, textDecoration:'none' }}>
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#08090C', fontFamily:"'Nunito Sans', sans-serif", color:'#EDE8DB' }}>

      {/* Navbar */}
      <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, background:'rgba(8,9,12,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <Link to="/" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:'#EDE8DB', textDecoration:'none' }}>Vigie</Link>
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'7px 14px', color:'rgba(237,232,219,0.5)', fontSize:13, textDecoration:'none' }}>
          <ArrowLeft size={13}/> Retour
        </Link>
      </nav>

      <div style={{ maxWidth:840, margin:'0 auto', padding:'60px 6%' }}>

        {/* En-tête */}
        <div style={{ marginBottom:48, textAlign:'center' }}>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px, 5vw, 52px)', fontWeight:700, color:'#EDE8DB', marginBottom:12 }}>
            Contactez-nous
          </h1>
          <p style={{ fontSize:15, color:'rgba(237,232,219,0.5)', maxWidth:440, margin:'0 auto', lineHeight:1.7 }}>
            Une question, un bug, une suggestion ? On vous répond sous 48h.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:24 }}>

          {/* Infos contact */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              { icon:Mail,          titre:'Email',           valeur:'vigie-officiel@gmail.com', href:'mailto:vigie-officiel@gmail.com' },
              { icon:MessageCircle, titre:'Assistant Vigil', valeur:'Disponible dans l\'app',   href:'/pro' },
              { icon:Clock,         titre:'Délai de réponse',valeur:'Sous 48h ouvrées',          href:null },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.titre} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, padding:'18px 20px', display:'flex', gap:14, alignItems:'flex-start' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:'rgba(91,163,199,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={17} color="#5BA3C7"/>
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'rgba(237,232,219,0.5)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{item.titre}</div>
                    {item.href ? (
                      <a href={item.href} style={{ fontSize:13, color:'#EDE8DB', textDecoration:'none', fontWeight:500 }}>{item.valeur}</a>
                    ) : (
                      <div style={{ fontSize:13, color:'#EDE8DB', fontWeight:500 }}>{item.valeur}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Liens utiles */}
            <div style={{ background:'rgba(91,163,199,0.06)', border:'1px solid rgba(91,163,199,0.15)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#5BA3C7', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Liens utiles</div>
              {[
                { label:'Documentation / FAQ', to:'/tarifs#faq' },
                { label:'Mentions légales',    to:'/mentions-legales' },
                { label:'Confidentialité',     to:'/confidentialite' },
                { label:'CGU',                 to:'/cgu' },
              ].map(l => (
                <Link key={l.label} to={l.to} style={{ display:'block', fontSize:13, color:'rgba(237,232,219,0.5)', textDecoration:'none', padding:'4px 0', transition:'color 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.color='#5BA3C7'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(237,232,219,0.5)'}>
                  → {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:20, padding:'32px 28px' }}>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lS}>Nom</label>
                  <input value={form.nom} onChange={set('nom')} placeholder="Jean Dupont" required style={iS}/>
                </div>
                <div>
                  <label style={lS}>Email</label>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="votre@email.fr" required style={iS}/>
                </div>
              </div>

              <div>
                <label style={lS}>Sujet</label>
                <select value={form.sujet} onChange={set('sujet')} required style={iS}>
                  <option value="">Choisir un sujet…</option>
                  <option value="bug">🐛 Signaler un bug</option>
                  <option value="question">❓ Question sur le service</option>
                  <option value="facturation">💳 Facturation / abonnement</option>
                  <option value="suggestion">💡 Suggestion d'amélioration</option>
                  <option value="rgpd">🔒 Demande RGPD</option>
                  <option value="autre">📩 Autre</option>
                </select>
              </div>

              <div>
                <label style={lS}>Message</label>
                <textarea value={form.message} onChange={set('message')} placeholder="Décrivez votre demande en détail…" required rows={5} style={{ ...iS, resize:'vertical', lineHeight:1.6 }}/>
              </div>

              <button type="submit" disabled={loading} style={{ padding:'13px', borderRadius:12, border:'none', background:loading?'rgba(91,163,199,0.3)':'linear-gradient(135deg, #5BA3C7, #3d7fa8)', color:'#fff', fontSize:14, fontWeight:700, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', transition:'all 200ms' }}>
                {loading ? 'Envoi en cours…' : 'Envoyer le message →'}
              </button>

              <p style={{ fontSize:11, color:'rgba(237,232,219,0.25)', textAlign:'center', margin:0 }}>
                Vos données ne sont utilisées que pour répondre à votre demande.{' '}
                <Link to="/confidentialite" style={{ color:'rgba(91,163,199,0.6)', textDecoration:'none' }}>Politique de confidentialité</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
