function LandingPage({ onStart }) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" ou "signup"

  return (
    <div style={{ minHeight: "100vh", background: "#0E0D0B", color: "#EDE8DB", fontFamily: "'Nunito Sans', sans-serif", overflow: "hidden" }}>
      {/* Hero */}
      <div style={{ position: "relative", padding: "60px 24px 40px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 7vw, 64px)", fontWeight: 700, lineHeight: 1.1, marginBottom: 20 }}>
          Analysez vos factures<br /><span style={{ color: "#D4A853" }}>en un clic</span>
        </h1>
        <p style={{ fontSize: "clamp(14px, 2.5vw, 18px)", color: "rgba(255,255,255,0.45)", maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Vigie-Factures détecte les anomalies, compare les prix et vous alerte automatiquement. Plus jamais de mauvaises surprises.
        </p>
        <button onClick={() => setShowAuth(true)} style={{
          background: "linear-gradient(135deg, #D4A853, #C78A5B)", color: "#0E0D0B", border: "none", borderRadius: 12,
          padding: "16px 40px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif",
          boxShadow: "0 4px 24px rgba(212,168,83,0.3)", transition: "transform 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          Commencer gratuitement →
        </button>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, maxWidth: 900, margin: "40px auto", padding: "0 24px" }}>
        {[
          { icon: Shield, title: "Détection d'anomalies", desc: "Repérez les hausses de prix suspectes et les erreurs de facturation instantanément." },
          { icon: BarChart3, title: "Dashboard intelligent", desc: "Visualisez vos dépenses par fournisseur, par mois et par catégorie." },
          { icon: Bell, title: "Alertes automatiques", desc: "Recevez un email dès qu'une anomalie est détectée sur vos factures." },
          { icon: Search, title: "Comparateur de prix", desc: "Trouvez des alternatives moins chères grâce à la recherche web intégrée." },
          { icon: Upload, title: "Multi-upload", desc: "Glissez plusieurs factures d'un coup, elles sont toutes analysées en parallèle." },
          { icon: Download, title: "Export Excel/CSV", desc: "Téléchargez vos données pour votre comptable ou vos rapports." },
        ].map((f, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "24px 20px", transition: "border-color 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,168,83,0.2)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(212,168,83,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <f.icon size={17} color="#D4A853" />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#EDE8DB" }}>{f.title}</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing - NOUVELLE SECTION ABONNEMENTS */}
      <div style={{ textAlign: "center", padding: "48px 24px 60px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, marginBottom: 12, color: "#EDE8DB" }}>Nos offres</h2>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 40 }}>Choisissez la formule adaptée à vos besoins</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          {/* GRATUIT */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 24px", textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#D4A853", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Gratuit</div>
            <div style={{ fontSize: 42, fontWeight: 700, color: "#EDE8DB", fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>0€</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 24 }}>/ mois</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.9, marginBottom: 24 }}>
              ✓ 10 factures / mois<br />
              ✓ Dashboard basique<br />
              ✓ Détection d'anomalies<br />
              ✓ Export CSV<br />
              <span style={{ color: "rgba(255,255,255,0.2)" }}>✗ Alertes email</span><br />
              <span style={{ color: "rgba(255,255,255,0.2)" }}>✗ Comparateur de prix</span>
            </div>
            <button onClick={() => setShowAuth(true)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(212,168,83,0.3)", background: "transparent", color: "#D4A853", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}>
              Essayer gratuitement
            </button>
          </div>

          {/* PRO - RECOMMANDÉ */}
          <div style={{ background: "linear-gradient(135deg, rgba(212,168,83,0.08), rgba(199,138,91,0.08))", border: "2px solid #D4A853", borderRadius: 16, padding: "32px 24px", textAlign: "left", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, right: 20, background: "#D4A853", color: "#0E0D0B", padding: "4px 12px", borderRadius: 12, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>RECOMMANDÉ</div>
            <div style={{ fontSize: 11, color: "#D4A853", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Pro</div>
            <div style={{ fontSize: 42, fontWeight: 700, color: "#D4A853", fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>19€</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 24 }}>/ mois</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.9, marginBottom: 24 }}>
              ✓ <strong style={{ color: "#D4A853" }}>Factures illimitées</strong><br />
              ✓ Dashboard avancé<br />
              ✓ Détection d'anomalies<br />
              ✓ Alertes email<br />
              ✓ Comparateur de prix<br />
              ✓ Export CSV/Excel<br />
              ✓ Support prioritaire
            </div>
            <button onClick={() => setShowAuth(true)} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #D4A853, #C78A5B)", color: "#0E0D0B", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}>
              Commencer
            </button>
          </div>

          {/* ENTREPRISE */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 24px", textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#5BA3C7", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Entreprise</div>
            <div style={{ fontSize: 42, fontWeight: 700, color: "#EDE8DB", fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>Sur devis</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 24 }}>&nbsp;</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.9, marginBottom: 24 }}>
              ✓ Tout de Pro<br />
              ✓ Multi-utilisateurs<br />
              ✓ API dédiée<br />
              ✓ Intégrations personnalisées<br />
              ✓ Support 24/7<br />
              ✓ Formation équipe
            </div>
            <button onClick={() => window.location.href = 'mailto:contact@vigie-factures.fr'} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(91,163,199,0.3)", background: "transparent", color: "#5BA3C7", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}>
              Nous contacter
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "40px 24px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32, marginBottom: 32 }}>
          {/* Colonne 1 */}
          <div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#D4A853", marginBottom: 12 }}>Vigie-Factures</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
              La solution intelligente pour gérer et analyser vos factures automatiquement.
            </p>
          </div>

          {/* Colonne 2 - Produit */}
          <div>
            <h4 style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Produit</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Fonctionnalités", "Tarifs", "FAQ", "Démo"].map(link => (
                <a key={link} href="#" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#D4A853"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>{link}</a>
              ))}
            </div>
          </div>

          {/* Colonne 3 - Légal */}
          <div>
            <h4 style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Légal</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Mentions légales", page: "legal" },
                { label: "CGV", page: "cgv" },
                { label: "Confidentialité", page: "privacy" },
                { label: "Cookies", page: "cookies" }
              ].map(link => (
                <a key={link.page} href={`#${link.page}`} style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#D4A853"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>{link.label}</a>
              ))}
            </div>
          </div>

          {/* Colonne 4 - Contact */}
          <div>
            <h4 style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              <a href="mailto:contact@vigie-factures.fr" style={{ color: "inherit", textDecoration: "none" }}>contact@vigie-factures.fr</a>
              <p style={{ margin: 0 }}>37 bis rue du 13 octobre 1918<br />02000 Laon, France</p>
              <p style={{ margin: 0 }}>SIRET: [à compléter]</p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, margin: 0 }}>
            © 2026 Vigie-Factures — Tous droits réservés
          </p>
        </div>
      </footer>

      {/* MODAL AUTH */}
      {showAuth && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", padding: 16 }} onClick={() => setShowAuth(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#161513", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 36px", width: "100%", maxWidth: 420, animation: "modalIn 0.3s ease-out" }}>
            <button onClick={() => setShowAuth(false)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 24, padding: 0, marginTop: -8 }}>×</button>
            
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#EDE8DB", marginBottom: 6 }}>
              {authMode === "login" ? "Connexion" : "Inscription"}
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>
              {authMode === "login" ? "Ravi de vous revoir !" : "Créez votre compte gratuitement"}
            </p>

            <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {authMode === "signup" && (
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Nom complet</label>
                  <input type="text" placeholder="Jean Dupont" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#EDE8DB", fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }} />
                </div>
              )}
              
              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Email</label>
                <input type="email" placeholder="votre@email.fr" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#EDE8DB", fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Mot de passe</label>
                <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#EDE8DB", fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }} />
              </div>

              <button type="submit" style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #D4A853, #C78A5B)", color: "#0E0D0B", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif", marginTop: 8 }}>
                {authMode === "login" ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {authMode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
              <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "#D4A853", cursor: "pointer", textDecoration: "underline", fontFamily: "'Nunito Sans', sans-serif" }}>
                {authMode === "login" ? "Inscription" : "Connexion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
