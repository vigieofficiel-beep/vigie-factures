import { useNavigate } from 'react-router-dom';

const C = {
  dark:   '#0A0F1E',
  card:   '#141C2E',
  border: 'rgba(255,255,255,0.08)',
  text:   '#E2E8F0',
  light:  '#94A3B8',
  muted:  '#64748B',
  blue:   '#5BA3C7',
  green:  '#5BC78A',
};

const SECTIONS = [
  {
    titre: '1. Éditeur du site',
    contenu: [
      { label: 'Responsable de publication', value: 'Lucien Doppler' },
      { label: 'SIRET', value: '888 362 118 00026' },
      { label: 'Adresse', value: 'France' },
      { label: 'Email', value: 'vigie-officiel@gmail.com' },
      { label: 'Site web', value: 'https://vigie-officiel.com' },
    ],
  },
  {
    titre: '2. Hébergement',
    contenu: [
      { label: 'Hébergeur', value: 'Vercel Inc.' },
      { label: 'Adresse', value: '340 Pine Street, Suite 701, San Francisco, CA 94104, États-Unis' },
      { label: 'Site web', value: 'https://vercel.com' },
    ],
  },
  {
    titre: '3. Propriété intellectuelle',
    texte: `Le site Vigie Pro et l'ensemble de son contenu (textes, graphiques, logotypes, icônes, images, etc.) sont la propriété exclusive de leur auteur et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, distribution, modification ou utilisation de ces contenus, même partielle, est strictement interdite sans autorisation préalable écrite.`,
  },
  {
    titre: '4. Protection des données personnelles',
    texte: `Les données personnelles collectées sur ce site sont traitées conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679). Elles sont utilisées uniquement dans le cadre de la fourniture du service Vigie Pro et ne sont jamais cédées à des tiers à des fins commerciales.\n\nConformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée, vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données. Pour exercer ces droits, contactez : vigie-officiel@gmail.com`,
  },
  {
    titre: '5. Cookies',
    texte: `Ce site utilise des cookies techniques nécessaires au bon fonctionnement de l'application (authentification, préférences). Aucun cookie publicitaire ou de tracking n'est utilisé. En continuant à naviguer sur ce site, vous acceptez l'utilisation de ces cookies techniques.`,
  },
  {
    titre: '6. Responsabilité',
    texte: `Les informations et outils fournis par Vigie Pro sont à titre indicatif uniquement. Ils ne constituent pas des conseils juridiques, fiscaux ou comptables. L'éditeur ne saurait être tenu responsable des décisions prises sur la base de ces informations. Il est recommandé de consulter un expert-comptable pour toute décision importante.`,
  },
  {
    titre: '7. Droit applicable',
    texte: `Les présentes mentions légales sont soumises au droit français. Tout litige relatif à l'utilisation du site sera soumis à la compétence exclusive des tribunaux français.`,
  },
];

export default function MentionsLegales() {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: C.dark, color: C.text, minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{ position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 6%', height:64, background:'rgba(10,15,30,0.95)', backdropFilter:'blur(20px)', borderBottom:`1px solid ${C.border}` }}>
        <button onClick={() => navigate('/')} style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:'#fff', background:'none', border:'none', cursor:'pointer' }}>
          Vigie<span style={{ color:C.blue, fontStyle:'italic' }}>Pro</span>
        </button>
        <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'7px 14px', color:C.light, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          ← Retour
        </button>
      </nav>

      {/* En-tête */}
      <div style={{ padding:'60px 6% 40px', borderBottom:`1px solid ${C.border}`, background:'linear-gradient(135deg, rgba(91,163,199,0.05) 0%, transparent 60%)' }}>
        <div style={{ maxWidth:820, margin:'0 auto' }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.blue, display:'block', marginBottom:12 }}>Informations légales</span>
          <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'clamp(32px,4vw,48px)', fontWeight:700, color:'#F8FAFC', marginBottom:14, lineHeight:1.2 }}>
            Mentions <em style={{ color:C.blue }}>légales</em>
          </h1>
          <p style={{ fontSize:15, color:C.light, lineHeight:1.7, maxWidth:560 }}>
            Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.
          </p>
          <p style={{ fontSize:12, color:C.muted, marginTop:12 }}>
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth:820, margin:'0 auto', padding:'60px 6%' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {SECTIONS.map((section, i) => (
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:'28px 32px' }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:20, fontWeight:700, color:'#fff', marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
                {section.titre}
              </h2>

              {section.contenu && (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <tbody>
                    {section.contenu.map((row, j) => (
                      <tr key={j} style={{ borderBottom: j < section.contenu.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <td style={{ padding:'10px 0', fontSize:13, color:C.muted, fontWeight:600, width:220, verticalAlign:'top' }}>
                          {row.label}
                        </td>
                        <td style={{ padding:'10px 0', fontSize:13, color:C.light }}>
                          {row.value.startsWith('http') ? (
                            <a href={row.value} target="_blank" rel="noreferrer" style={{ color:C.blue, textDecoration:'none' }}>{row.value}</a>
                          ) : row.label === 'Email' ? (
                            <a href={`mailto:${row.value}`} style={{ color:C.blue, textDecoration:'none' }}>{row.value}</a>
                          ) : row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {section.texte && (
                <p style={{ fontSize:14, color:C.light, lineHeight:1.9, margin:0, whiteSpace:'pre-line' }}>
                  {section.texte}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop:`1px solid ${C.border}`, padding:'24px 6%', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, fontWeight:700, color:C.light }}>
          Vigie<span style={{ color:C.blue, fontStyle:'italic' }}>Pro</span>
        </div>
        <div style={{ display:'flex', gap:20 }}>
          <button onClick={() => navigate('/')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:C.muted, fontFamily:'inherit' }}>Accueil</button>
          <button onClick={() => navigate('/confidentialite')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:C.muted, fontFamily:'inherit' }}>Confidentialité</button>
          <button onClick={() => navigate('/cgu')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:C.muted, fontFamily:'inherit' }}>CGU</button>
        </div>
        <div style={{ fontSize:12, color:C.muted }}>© 2026 Vigie Pro</div>
      </footer>
    </div>
  );
}
