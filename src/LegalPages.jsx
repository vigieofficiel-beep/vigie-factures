import React from 'react';
import { X } from 'lucide-react';

export function LegalModal({ page, onClose }) {
  if (!page) return null;

  const content = {
    legal: {
      title: "Mentions légales",
      body: `
        <h3>Éditeur du site</h3>
        <p><strong>Vigie-Factures</strong><br/>
        Gaëtan Narcisse<br/>
        37 bis rue du 13 octobre 1918, Cité Beynel Bâtiment B<br/>
        02000 LAON, France<br/>
        Email : gaetan.narcisse@gmail.com</p>

        <h3>Hébergement</h3>
        <p><strong>Vercel Inc.</strong><br/>
        340 S Lemon Ave #4133<br/>
        Walnut, CA 91789, USA<br/>
        <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a></p>

        <h3>Données personnelles</h3>
        <p>Les données collectées sont : email, nom, factures uploadées.<br/>
        Base de données hébergée par Supabase (Singapour).<br/>
        Conformité RGPD : droit d'accès, rectification et suppression via email.</p>

        <h3>Propriété intellectuelle</h3>
        <p>© 2026 Vigie-Factures. Tous droits réservés.</p>
      `
    },
    cgv: {
      title: "Conditions Générales de Vente",
      body: `
        <h3>Article 1 - Objet</h3>
        <p>Les présentes CGV régissent la vente des services Vigie-Factures proposés par Gaëtan Narcisse.</p>

        <h3>Article 2 - Prix</h3>
        <p><strong>Offre Gratuite :</strong> 10 factures/mois, fonctionnalités basiques.<br/>
        <strong>Offre Pro :</strong> 19€/mois HT (22,80€ TTC), factures illimitées, toutes fonctionnalités.<br/>
        <strong>Offre Entreprise :</strong> Sur devis.</p>

        <h3>Article 3 - Paiement</h3>
        <p>Paiement par carte bancaire via Stripe. Abonnement mensuel renouvelable automatiquement.</p>

        <h3>Article 4 - Résiliation</h3>
        <p>Résiliation possible à tout moment depuis votre compte. Aucun remboursement au prorata.</p>

        <h3>Article 5 - Responsabilité</h3>
        <p>Vigie-Factures s'engage à fournir un service de qualité mais ne garantit pas l'exactitude à 100% des analyses IA. L'utilisateur reste responsable de la vérification de ses factures.</p>

        <h3>Article 6 - Données</h3>
        <p>Vos factures sont stockées de manière sécurisée. Vous pouvez les supprimer à tout moment.</p>

        <h3>Article 7 - Droit applicable</h3>
        <p>Droit français. Juridiction compétente : Laon, France.</p>
      `
    },
    privacy: {
      title: "Politique de confidentialité",
      body: `
        <h3>Données collectées</h3>
        <p>Nous collectons :<br/>
        - Email et nom lors de l'inscription<br/>
        - Contenu des factures uploadées<br/>
        - Données d'utilisation (pages visitées, durée)</p>

        <h3>Utilisation des données</h3>
        <p>- Analyse des factures par IA (Claude AI)<br/>
        - Envoi d'alertes par email<br/>
        - Amélioration du service</p>

        <h3>Partage des données</h3>
        <p>Vos données ne sont jamais vendues. Partagées uniquement avec :<br/>
        - Anthropic (Claude AI) pour l'analyse<br/>
        - Supabase pour le stockage<br/>
        - Resend pour les emails</p>

        <h3>Vos droits (RGPD)</h3>
        <p>Vous avez le droit de :<br/>
        - Accéder à vos données<br/>
        - Les rectifier<br/>
        - Les supprimer<br/>
        - Vous opposer au traitement<br/>
        Contactez-nous : gaetan.narcisse@gmail.com</p>

        <h3>Cookies</h3>
        <p>Nous utilisons des cookies techniques nécessaires au fonctionnement du site (authentification). Pas de cookies publicitaires.</p>

        <h3>Sécurité</h3>
        <p>Données chiffrées en transit (HTTPS) et au repos. Accès protégé par mot de passe.</p>
      `
    },
    cookies: {
      title: "Politique de cookies",
      body: `
        <h3>Qu'est-ce qu'un cookie ?</h3>
        <p>Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite.</p>

        <h3>Cookies utilisés</h3>
        <p><strong>Cookies essentiels (obligatoires) :</strong><br/>
        - Authentification (maintenir votre session connectée)<br/>
        - Sécurité (protection CSRF)</p>

        <p><strong>Cookies optionnels :</strong><br/>
        Aucun pour le moment. Pas de tracking publicitaire.</p>

        <h3>Gestion des cookies</h3>
        <p>Vous pouvez désactiver les cookies dans les paramètres de votre navigateur, mais cela empêchera la connexion.</p>

        <h3>Durée de conservation</h3>
        <p>Cookies de session : supprimés à la fermeture du navigateur.<br/>
        Cookies persistants : 30 jours maximum.</p>
      `
    }
  };

  const current = content[page];
  if (!current) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161513", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 36px", width: "100%", maxWidth: 700, maxHeight: "80vh", overflowY: "auto", animation: "modalIn 0.3s ease-out" }}>
        <button onClick={onClose} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 24, padding: 0, marginTop: -8 }}>×</button>
        
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: "#D4A853", marginBottom: 24 }}>{current.title}</h2>
        
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: current.body.replace(/<h3>/g, '<h3 style="color:#EDE8DB;font-size:15px;margin:20px 0 10px;font-weight:600">').replace(/<p>/g, '<p style="margin-bottom:12px">').replace(/<a /g, '<a style="color:#D4A853" ') }} />
      </div>
    </div>
  );
}
