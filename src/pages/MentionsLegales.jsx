import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function MentionsLegales() {
  return (
    <div style={{
      fontFamily: "'Nunito Sans', sans-serif",
      background: '#F8FAFC', minHeight: '100vh',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Retour */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#94A3B8', textDecoration: 'none', marginBottom: 32,
        }}>
          <ArrowLeft size={14} /> Retour à l'accueil
        </Link>

        {/* Titre */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 36, fontWeight: 600, color: '#0F172A', margin: 0,
          }}>
            Mentions légales
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>
            Conformément à la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique
          </p>
        </div>

        {/* Sections */}
        {[
          {
            titre: '1. Éditeur du site',
            contenu: [
              { label: 'Responsable de publication', value: 'Narcisse Gaëtan' },
              { label: 'SIRET', value: '888 362 118 00026' },
              { label: 'Adresse', value: '37 bis rue du 13 octobre 1918, 02000 Laon' },
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
        ].map((section, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #E8EAF0',
            borderRadius: 14, padding: '24px 28px', marginBottom: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <h2 style={{
              fontSize: 15, fontWeight: 700, color: '#0F172A',
              margin: '0 0 16px', paddingBottom: 12,
              borderBottom: '1px solid #F0F2F5',
            }}>
              {section.titre}
            </h2>

            {section.contenu && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {section.contenu.map((row, j) => (
                    <tr key={j} style={{ borderBottom: j < section.contenu.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                      <td style={{ padding: '8px 0', fontSize: 13, color: '#94A3B8', fontWeight: 600, width: 200, verticalAlign: 'top' }}>
                        {row.label}
                      </td>
                      <td style={{ padding: '8px 0', fontSize: 13, color: '#1A1C20' }}>
                        {row.value.startsWith('http') ? (
                          <a href={row.value} target="_blank" rel="noreferrer" style={{ color: '#5BA3C7' }}>{row.value}</a>
                        ) : row.label === 'Email' ? (
                          <a href={`mailto:${row.value}`} style={{ color: '#5BA3C7' }}>{row.value}</a>
                        ) : row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {section.texte && (
              <p style={{ fontSize: 13, color: '#5A6070', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>
                {section.texte}
              </p>
            )}
          </div>
        ))}

        {/* Pied de page */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#CBD5E1', marginTop: 32 }}>
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}
          <Link to="/confidentialite" style={{ color: '#94A3B8', textDecoration: 'none' }}>Politique de confidentialité</Link>
        </p>

      </div>
    </div>
  );
}
