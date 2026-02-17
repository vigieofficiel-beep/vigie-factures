import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FileText, AlertTriangle, TrendingUp, Calendar, Search, Filter, Eye, X, Bell, RefreshCw, Upload, CheckCircle, Clock, Trash2, ArrowUpRight, ArrowDownRight, Loader, Plus, LayoutDashboard, UploadCloud, Download, Menu, Shield, Zap, BarChart3, Wallet, FileBarChart, LogOut } from "lucide-react";
import { LegalModal } from './LegalPages.jsx';

// ═══ SUPABASE AUTH CLIENT ═══
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = "https://qkvqujnctdyaxsenvwsm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdnF1am5jdGR5YXhzZW52d3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Nzc1MzcsImV4cCI6MjA4NjU1MzUzN30.XtzE94TOrI7KRh8Naj3cBxM80wGPDjZvI8nhUbxIvdA";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ANALYZE_API = "/api/analyze";
const COLORS = ["#D4A853", "#C75B4E", "#5BA3C7", "#5BC78A", "#A85BC7", "#C78A5B", "#5BC7B8", "#C75BA8"];
const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

const BUDGET_CATEGORIES = {
  "Logement": { color: "#5BA3C7", keywords: ["loyer", "immobilier", "habitation", "logement", "eau", "edf", "engie", "électricité", "gaz", "chauffage"] },
  "Transport": { color: "#5BC78A", keywords: ["transport", "essence", "carburant", "sncf", "ratp", "uber", "taxi", "parking", "autoroute", "péage"] },
  "Alimentation": { color: "#D4A853", keywords: ["alimentaire", "restaurant", "supermarché", "courses", "épicerie", "boulangerie"] },
  "Télécom": { color: "#A85BC7", keywords: ["télécom", "mobile", "internet", "free", "orange", "sfr", "bouygues", "fibre", "forfait"] },
  "Santé": { color: "#C75B4E", keywords: ["santé", "médecin", "pharmacie", "mutuelle", "dentiste", "opticien", "hôpital"] },
  "Assurance": { color: "#C78A5B", keywords: ["assurance", "axa", "maif", "macif", "allianz", "groupama"] },
  "Loisirs": { color: "#5BC7B8", keywords: ["loisir", "sport", "cinéma", "netflix", "spotify", "abonnement", "média", "btlv", "streaming"] },
  "Divers": { color: "#888", keywords: [] },
};

function getBudgetCategory(invoice) {
  const text = [invoice.category, invoice.subcategory, invoice.provider].filter(Boolean).join(" ").toLowerCase();
  for (const [cat, { keywords }] of Object.entries(BUDGET_CATEGORIES)) {
    if (cat === "Divers") continue;
    if (keywords.some(k => text.includes(k))) return cat;
  }
  return "Divers";
}

function formatEuro(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ═══ FILE TO BASE64 ═══
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractTextFromFile(file) {
  if (file.type.startsWith("text/")) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
  return null;
}

async function extractTextFromFile(file) {
  if (file.type === "application/pdf") return extractTextFromPDF(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ═══ EXPORT CSV ═══
function exportCSV(invoices) {
  const headers = ["Numero", "Fournisseur", "Montant TTC", "Montant HT", "TVA", "Date", "Categorie", "Frequence", "Anomalie"];
  const rows = invoices.map(i => [
    i.invoice_number || "", i.provider || "", i.amount_ttc || "", i.amount_ht || "", i.tax || "",
    i.invoice_date || "", i.category || "", i.frequency || "", i.has_anomaly ? "OUI" : "NON"
  ]);
  const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "vigie-factures-export.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ═══ STAT CARD ═══
function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: `${color}08` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "#EDE8DB", fontFamily: "'Cormorant Garamond', serif" }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 10, color: trend === "up" ? "#C75B4E" : trend === "down" ? "#5BC78A" : "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
          {trend === "up" && <ArrowUpRight size={11} />}
          {trend === "down" && <ArrowDownRight size={11} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ═══ FILE ITEM ═══
function FileItem({ file, onRemove }) {
  const sc = { pending: "rgba(255,255,255,0.3)", processing: "#D4A853", done: "#5BC78A", error: "#C75B4E" };
  const si = { pending: Clock, processing: Loader, done: CheckCircle, error: AlertTriangle };
  const SI = si[file.status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: file.status === "processing" ? "rgba(212,168,83,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${file.status === "processing" ? "rgba(212,168,83,0.2)" : file.status === "error" ? "rgba(199,91,78,0.2)" : file.status === "done" ? "rgba(91,199,138,0.15)" : "rgba(255,255,255,0.05)"}`, borderRadius: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 7, background: file.status === "done" ? "rgba(91,199,138,0.1)" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FileText size={16} color={file.status === "done" ? "#5BC78A" : "rgba(255,255,255,0.4)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: "#EDE8DB", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
        <div style={{ fontSize: 10, color: sc[file.status], marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <SI size={11} style={file.status === "processing" ? { animation: "spin 1s linear infinite" } : {}} />
          {file.status === "pending" && "En attente"}
          {file.status === "processing" && "Analyse en cours..."}
          {file.status === "done" && `✓ ${file.result?.extraction?.provider || "Analysé"} — ${formatEuro(file.result?.extraction?.amount_ttc)}`}
          {file.status === "error" && (file.errorMsg || "Erreur")}
        </div>
      </div>
      {(file.status === "pending" || file.status === "error") && (
        <button onClick={() => onRemove(file.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.2)" }}>
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

// ═══ INVOICE MODAL ═══
function InvoiceModal({ inv, onClose }) {
  if (!inv) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#161513", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 28px", width: "100%", maxWidth: 460, maxHeight: "80vh", overflowY: "auto", animation: "modalIn 0.3s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ color: "#EDE8DB", fontFamily: "'Cormorant Garamond', serif", fontSize: 20, margin: 0 }}>Détails</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color="rgba(255,255,255,0.3)" /></button>
        </div>
        {[
          ["Numéro", inv.invoice_number],
          ["Fournisseur", inv.provider],
          ["Date", formatDate(inv.invoice_date)],
          ["Montant HT", formatEuro(inv.amount_ht)],
          ["TVA", `${formatEuro(inv.tax)} (${inv.tax_rate || "—"}%)`],
          ["Montant TTC", formatEuro(inv.amount_ttc)],
          ["Catégorie", `${inv.category || "—"} / ${inv.subcategory || "—"}`],
          ["Fréquence", inv.frequency || "—"],
          ["Coût annuel", formatEuro(inv.total_year)],
          ["Anomalie", inv.has_anomaly ? `⚠️ ${inv.anomaly_explanation}` : "✅ Aucune"],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{k}</span>
            <span style={{ color: "#EDE8DB", fontSize: 11, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{v || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ CUSTOM TOOLTIP ═══
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#161513", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", fontSize: 10 }}>
      <div style={{ color: "rgba(255,255,255,0.4)" }}>{payload[0]?.name || payload[0]?.payload?.name}</div>
      <div style={{ color: "#D4A853", fontWeight: 700 }}>{formatEuro(payload[0]?.value)}</div>
    </div>
  );
}

// ═══ LEGAL LINKS CONFIG ═══
const LEGAL_LINKS = [
  { label: "Mentions légales", page: "legal" },
  { label: "CGV", page: "cgv" },
  { label: "Confidentialité", page: "privacy" },
  { label: "Cookies", page: "cookies" },
];

// ═══ LANDING PAGE ═══
function LandingPage({ onLogin, onSignUp, authError, onLegal }) {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" ou "signup"

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const fullName = formData.get('fullName');

    if (authMode === "login") {
      onLogin(email, password);
    } else {
      onSignUp(email, password, fullName);
    }
  };

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
        <button
          onClick={() => setShowAuth(true)}
          style={{ background: "linear-gradient(135deg, #D4A853, #C78A5B)", color: "#0E0D0B", border: "none", borderRadius: 12, padding: "16px 40px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif", boxShadow: "0 4px 24px rgba(212,168,83,0.3)", transition: "transform 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
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
          <div
            key={i}
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "24px 20px", transition: "border-color 0.3s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,168,83,0.2)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(212,168,83,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <f.icon size={17} color="#D4A853" />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: "#EDE8DB" }}>{f.title}</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
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
            <button
              onClick={() => setShowAuth(true)}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(212,168,83,0.3)", background: "transparent", color: "#D4A853", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}
            >
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
            <button
              onClick={() => setShowAuth(true)}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #D4A853, #C78A5B)", color: "#0E0D0B", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}
            >
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
            <button
              onClick={() => window.location.href = 'mailto:contact@vigie-factures.fr'}
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(91,163,199,0.3)", background: "transparent", color: "#5BA3C7", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif" }}
            >
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
                <a
                  key={link}
                  href="#"
                  style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#D4A853"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 3 - Légal */}
          <div>
            <h4 style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, fontWeight: 600 }}>Légal</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LEGAL_LINKS.map(link => (
                <a
                  key={link.page}
                  href="#"
                  onClick={(e) => { e.preventDefault(); onLegal(link.page); }}
                  style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#D4A853"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
                >
                  {link.label}
                </a>
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
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", padding: 16 }}
          onClick={() => setShowAuth(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{ background: "#161513", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 36px", width: "100%", maxWidth: 420, animation: "modalIn 0.3s ease-out" }}>
            <button onClick={() => setShowAuth(false)} style={{ float: "right", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 24, padding: 0, marginTop: -8 }}>×</button>

            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#EDE8DB", marginBottom: 6 }}>
              {authMode === "login" ? "Connexion" : "Inscription"}
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>
              {authMode === "login" ? "Ravi de vous revoir !" : "Créez votre compte gratuitement"}
            </p>

            <form onSubmit={handleAuthSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {authMode === "signup" && (
                <div>
                  <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Nom complet</label>
                  <input name="fullName" type="text" placeholder="Jean Dupont" required style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#EDE8DB", fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }} />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Email</label>
                <input name="email" type="email" placeholder="votre@email.fr" required style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#EDE8DB", fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Mot de passe</label>
                <input name="password" type="password" placeholder="••••••••" required minLength={6} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#EDE8DB", fontSize: 13, fontFamily: "'Nunito Sans', sans-serif" }} />
              </div>

              {authError && (
                <div style={{ color: "#C75B4E", fontSize: 11, background: "rgba(199,91,78,0.1)", padding: "8px 12px", borderRadius: 6 }}>{authError}</div>
              )}

              <button
                type="submit"
                style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #D4A853, #C78A5B)", color: "#0E0D0B", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif", marginTop: 8 }}
              >
                {authMode === "login" ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              {authMode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
              <button
                onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                style={{ background: "none", border: "none", color: "#D4A853", cursor: "pointer", textDecoration: "underline", fontFamily: "'Nunito Sans', sans-serif" }}
              >
                {authMode === "login" ? "Inscription" : "Connexion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function VigieFactures() {
  const [page, setPage] = useState("landing");
  const [files, setFiles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);
  const [search, setSearch] = useState("");
  const [filterFreq, setFilterFreq] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const fileInputRef = useRef(null);
  const nextId = useRef(0);
  const [legalPage, setLegalPage] = useState(null);

  // ═══ AUTH STATE ═══
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ═══ CHECK AUTH ═══
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ═══ AUTH FUNCTIONS ═══
  const handleSignUp = async (email, password, fullName) => {
    setAuthError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) setAuthError(error.message);
    else alert("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
  };

  const handleLogin = async (email, password) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    else setPage("dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage("landing");
  };

  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices?user_id=eq.${user.id}&order=processed_at.desc&limit=100`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (res.ok) setInvoices(await res.json());
    } catch (e) {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) fetchInvoices();
  }, [fetchInvoices, user]);

  const addFiles = useCallback((newFiles) => {
    const fileObjs = Array.from(newFiles)
      .filter(f => f.type === "application/pdf" || f.type.startsWith("text/") || f.type.startsWith("image/"))
      .map(f => ({
        id: nextId.current++, file: f, name: f.name, status: "pending", result: null, errorMsg: null,
      }));
    setFiles(prev => [...prev, ...fileObjs]);
  }, []);

  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const processAll = useCallback(async () => {
    setIsProcessing(true);
    const pending = files.filter(f => f.status === "pending" || f.status === "error");
    for (const fileObj of pending) {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "processing" } : f));
      try {
        const file = fileObj.file;
let body;
if (file.type === "application/pdf" || file.type.startsWith("image/")) {
  const fileBase64 = await fileToBase64(file);
  body = JSON.stringify({ fileBase64, fileType: file.type, user_id: user?.id });
} else {
  const text = await extractTextFromFile(file);
  body = JSON.stringify({ text, user_id: user?.id });
}
const response = await fetch(ANALYZE_API, {
  method: "POST", headers: { "Content-Type": "application/json" }, body,
});
        const data = await response.json();
        if (data.success && data.result) {
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "done", result: data.result } : f));
        } else {
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "error", errorMsg: data.error || "Erreur API" } : f));
        }
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "error", errorMsg: err.message } : f));
      }
    }
    setIsProcessing(false);
    fetchInvoices();
  }, [files, fetchInvoices, user]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const m1 = !search || [inv.provider, inv.invoice_number, inv.category].some(f => f?.toLowerCase().includes(search.toLowerCase()));
      const m2 = filterFreq === "all" || inv.frequency === filterFreq;
      return m1 && m2;
    });
  }, [invoices, search, filterFreq]);

  const stats = useMemo(() => {
    const total = invoices.reduce((s, i) => s + (i.amount_ttc || 0), 0);
    const totalYear = invoices.reduce((s, i) => s + (i.total_year || 0), 0);
    const anomalies = invoices.filter(i => i.has_anomaly).length;
    const providers = [...new Set(invoices.map(i => i.provider).filter(Boolean))].length;
    return { total, totalYear, anomalies, providers, count: invoices.length };
  }, [invoices]);

  const pieData = useMemo(() => {
    const bp = {};
    invoices.forEach(i => { const p = i.provider || "Inconnu"; bp[p] = (bp[p] || 0) + (i.amount_ttc || 0); });
    return Object.entries(bp).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [invoices]);

  const barData = useMemo(() => {
    const bm = {};
    invoices.forEach(i => {
      if (!i.invoice_date) return;
      const d = new Date(i.invoice_date);
      const k = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      bm[k] = { name: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`, total: (bm[k]?.total || 0) + (i.amount_ttc || 0) };
    });
    return Object.entries(bm).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v).slice(-12);
  }, [invoices]);

  const alerts = useMemo(() => invoices.filter(i => i.has_anomaly).map(i => ({ provider: i.provider, explanation: i.anomaly_explanation })), [invoices]);
  const pendingCount = files.filter(f => f.status === "pending").length;
  const doneCount = files.filter(f => f.status === "done").length;

  // ═══ SI PAS CONNECTÉ → LANDING ═══
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#0E0D0B", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4A853" }}>
      Chargement...
    </div>
  );

  if (!user && page !== "landing") return (
    <LandingPage onLogin={handleLogin} onSignUp={handleSignUp} authError={authError} onLegal={setLegalPage} />
  );

  if (page === "landing") return (
    <LandingPage onLogin={handleLogin} onSignUp={handleSignUp} authError={authError} onLegal={setLegalPage} />
  );

  // ═══ APP LAYOUT ═══
  return (
    <div style={{ minHeight: "100vh", background: "#0E0D0B", color: "#EDE8DB", fontFamily: "'Nunito Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        input[type="file"] { display: none; }
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); position: fixed !important; z-index: 200 !important; }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0 !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Mobile header */}
      <div
        style={{ display: "none", position: "fixed", top: 0, left: 0, right: 0, height: 52, background: "#0E0D0B", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 150, alignItems: "center", padding: "0 16px", justifyContent: "space-between" }}
        className="mobile-header"
        ref={el => { if (el) el.style.display = window.innerWidth <= 768 ? "flex" : "none"; }}
      >
        <button onClick={() => setMobileMenu(!mobileMenu)} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <Menu size={20} color="#D4A853" />
        </button>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: "#D4A853" }}>Vigie</span>
        <div style={{ width: 20 }} />
      </div>

      {/* Overlay */}
      {mobileMenu && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 190 }} onClick={() => setMobileMenu(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${mobileMenu ? "open" : ""}`}
        style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 200, background: "rgba(255,255,255,0.015)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "24px 14px", display: "flex", flexDirection: "column", zIndex: 200, transition: "transform 0.3s" }}
      >
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: "#D4A853", marginBottom: 4, paddingLeft: 8 }}>Vigie</h1>
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", paddingLeft: 8, marginBottom: 32 }}>Factures</p>

        {[
          { id: "upload", icon: UploadCloud, label: "Analyser", badge: pendingCount > 0 ? pendingCount : null },
          { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { id: "budget", icon: Wallet, label: "Budget" },
          { id: "report", icon: FileBarChart, label: "Rapport" },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => { setPage(item.id); setMobileMenu(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 9, border: "none",
              background: page === item.id ? "rgba(212,168,83,0.1)" : "transparent",
              color: page === item.id ? "#D4A853" : "rgba(255,255,255,0.4)",
              cursor: "pointer", fontSize: 12, fontWeight: page === item.id ? 600 : 400,
              width: "100%", textAlign: "left", marginBottom: 3, fontFamily: "'Nunito Sans', sans-serif",
            }}
          >
            <item.icon size={16} />
            {item.label}
            {item.badge && (
              <span style={{ marginLeft: "auto", background: "#D4A853", color: "#0E0D0B", borderRadius: 10, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{item.badge}</span>
            )}
          </button>
        ))}

        <div style={{ marginTop: "auto" }}>
          <div style={{ padding: "14px 8px", borderTop: "1px solid rgba(255,255,255,0.05)", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{invoices.length} facture{invoices.length > 1 ? "s" : ""}</div>
            {alerts.length > 0 && (
              <div style={{ fontSize: 10, color: "#C75B4E", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
                <Bell size={10} /> {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", width: "100%", fontFamily: "'Nunito Sans', sans-serif" }}
          >
            <LogOut size={14} /> Déconnexion
          </button>
          <LegalModal page={legalPage} onClose={() => setLegalPage(null)} />
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ marginLeft: 200, padding: "28px 32px 50px", paddingTop: window.innerWidth <= 768 ? 72 : 28 }}>

        {/* ═══ UPLOAD PAGE ═══ */}
        {page === "upload" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Analyser des factures</h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 28 }}>Glisse tes fichiers ou clique pour les ajouter. Lance l'analyse quand tu es prêt.</p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "rgba(212,168,83,0.6)" : "rgba(255,255,255,0.1)"}`, borderRadius: 14, padding: "40px 24px", textAlign: "center", cursor: "pointer",
                background: dragOver ? "rgba(212,168,83,0.04)" : "rgba(255,255,255,0.01)", marginBottom: 20,
              }}
            >
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.png,.jpg,.jpeg" onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
              <Upload size={32} color={dragOver ? "#D4A853" : "rgba(255,255,255,0.2)"} style={{ marginBottom: 12 }} />
              <div style={{ color: dragOver ? "#D4A853" : "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                {dragOver ? "Lâche tes fichiers ici !" : "Glisse tes factures ici"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>ou clique pour parcourir • PDF, images, texte</div>
            </div>

            {files.length > 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer", marginBottom: 14, fontFamily: "'Nunito Sans', sans-serif" }}
              >
                <Plus size={12} /> Ajouter d'autres factures
              </button>
            )}

            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                {files.map(f => <FileItem key={f.id} file={f} onRemove={removeFile} />)}
              </div>
            )}

            {files.length > 0 && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={processAll}
                  disabled={isProcessing || pendingCount === 0}
                  style={{
                    flex: 1, minWidth: 200, padding: "12px 20px", borderRadius: 10, border: "none",
                    background: isProcessing ? "rgba(212,168,83,0.15)" : pendingCount === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #D4A853, #C78A5B)",
                    color: isProcessing ? "#D4A853" : pendingCount === 0 ? "rgba(255,255,255,0.3)" : "#0E0D0B",
                    fontSize: 13, fontWeight: 700, cursor: isProcessing || pendingCount === 0 ? "not-allowed" : "pointer",
                    fontFamily: "'Nunito Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {isProcessing
                    ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Analyse en cours...</>
                    : pendingCount === 0
                      ? <><CheckCircle size={14} /> Toutes analysées !</>
                      : <><UploadCloud size={14} /> Analyser {pendingCount} facture{pendingCount > 1 ? "s" : ""}</>
                  }
                </button>
                {doneCount > 0 && (
                  <button
                    onClick={() => setPage("dashboard")}
                    style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(91,199,138,0.3)", background: "rgba(91,199,138,0.08)", color: "#5BC78A", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <LayoutDashboard size={13} /> Dashboard
                  </button>
                )}
              </div>
            )}

            {files.length === 0 && (
              <div style={{ textAlign: "center", padding: 16, color: "rgba(255,255,255,0.15)", fontSize: 12 }}>Aucune facture ajoutée</div>
            )}
          </div>
        )}

        {/* ═══ DASHBOARD PAGE ═══ */}
        {page === "dashboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, marginBottom: 3 }}>Dashboard</h2>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Vue d'ensemble de vos factures</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => exportCSV(filtered)}
                  style={{ background: "rgba(91,199,138,0.08)", border: "1px solid rgba(91,199,138,0.2)", borderRadius: 7, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "#5BC78A", fontSize: 11, fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  <Download size={12} /> Export CSV
                </button>
                <button
                  onClick={fetchInvoices}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'Nunito Sans', sans-serif" }}
                >
                  <RefreshCw size={12} /> Actualiser
                </button>
              </div>
            </div>

            {alerts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
                {alerts.map((a, i) => (
                  <div key={i} style={{ background: "rgba(199,91,78,0.06)", border: "1px solid rgba(199,91,78,0.15)", borderRadius: 9, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, animation: "slideIn 0.3s ease-out", flexWrap: "wrap" }}>
                    <AlertTriangle size={14} color="#C75B4E" />
                    <span style={{ color: "#C75B4E", fontWeight: 600, fontSize: 11 }}>{a.provider}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>— {a.explanation}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              <StatCard icon={FileText} label="Factures" value={stats.count} sub={`${stats.providers} fournisseur${stats.providers > 1 ? "s" : ""}`} color="#D4A853" />
              <StatCard icon={TrendingUp} label="Total" value={formatEuro(stats.total)} sub={`${formatEuro(stats.totalYear)} est. annuel`} color="#5BA3C7" />
              <StatCard icon={AlertTriangle} label="Anomalies" value={stats.anomalies} sub={stats.anomalies > 0 ? "À vérifier" : "RAS"} color={stats.anomalies > 0 ? "#C75B4E" : "#5BC78A"} trend={stats.anomalies > 0 ? "up" : undefined} />
              <StatCard icon={Calendar} label="Récurrents" value={invoices.filter(i => i.frequency === "mensuel").length} sub={`${formatEuro(invoices.filter(i => i.frequency === "mensuel").reduce((s, i) => s + (i.amount_ttc || 0), 0))}/mois`} color="#A85BC7" />
            </div>

            <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 18 }}>
                <h3 style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 1.5, marginBottom: 14, fontWeight: 600, textTransform: "uppercase" }}>Par fournisseur</h3>
                {pieData.length > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {pieData.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                          <div style={{ width: 7, height: 7, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                          <span style={{ color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>{d.name}</span>
                          <span style={{ color: COLORS[i % COLORS.length], fontWeight: 600, marginLeft: "auto" }}>{formatEuro(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.15)", textAlign: "center", padding: 36, fontSize: 11 }}>Aucune donnée</div>
                )}
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 18 }}>
                <h3 style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 1.5, marginBottom: 14, fontWeight: 600, textTransform: "uppercase" }}>Par mois</h3>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                        {barData.map((_, i) => <Cell key={i} fill={`rgba(212,168,83,${0.35 + (i / barData.length) * 0.65})`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.15)", textAlign: "center", padding: 36, fontSize: 11 }}>Aucune donnée</div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180, display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "0 12px" }}>
                <Search size={12} color="rgba(255,255,255,0.25)" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  style={{ background: "none", border: "none", outline: "none", color: "#EDE8DB", fontSize: 11, padding: "9px 0", width: "100%", fontFamily: "'Nunito Sans', sans-serif" }}
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "7px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "'Nunito Sans', sans-serif" }}
              >
                <Filter size={11} /> Filtres
              </button>
            </div>

            {showFilters && (
              <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
                {[["all", "Tous"], ["mensuel", "Mensuel"], ["annuel", "Annuel"], ["ponctuel", "Ponctuel"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setFilterFreq(v)}
                    style={{ background: filterFreq === v ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${filterFreq === v ? "rgba(212,168,83,0.25)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "4px 12px", cursor: "pointer", color: filterFreq === v ? "#D4A853" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: filterFreq === v ? 600 : 400, fontFamily: "'Nunito Sans', sans-serif" }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 600 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["N°", "Fournisseur", "TTC", "Date", "Fréq.", "Statut", ""].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? <tr><td colSpan={7} style={{ padding: 36, textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 11 }}>Chargement...</td></tr>
                      : filtered.length === 0
                        ? <tr><td colSpan={7} style={{ padding: 36, textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 11 }}>Aucune facture</td></tr>
                        : filtered.map((inv, i) => (
                          <tr
                            key={inv.id || i}
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            onClick={() => setSelectedInv(inv)}
                          >
                            <td style={{ padding: "10px 12px", color: "#EDE8DB", fontSize: 11, fontWeight: 500 }}>{inv.invoice_number || "—"}</td>
                            <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.6)", fontSize: 11 }}>{inv.provider || "—"}</td>
                            <td style={{ padding: "10px 12px", color: "#D4A853", fontSize: 11, fontWeight: 600 }}>{formatEuro(inv.amount_ttc)}</td>
                            <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{formatDate(inv.invoice_date)}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{ padding: "2px 7px", borderRadius: 10, fontSize: 9, fontWeight: 600, background: inv.frequency === "mensuel" ? "rgba(91,163,199,0.12)" : "rgba(255,255,255,0.05)", color: inv.frequency === "mensuel" ? "#5BA3C7" : "rgba(255,255,255,0.4)" }}>
                                {inv.frequency || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px" }}>
                              {inv.has_anomaly
                                ? <span style={{ color: "#C75B4E", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={11} /> Anomalie</span>
                                : <span style={{ color: "rgba(91,199,138,0.6)", fontSize: 10 }}>✓ OK</span>
                              }
                            </td>
                            <td style={{ padding: "10px 6px" }}><Eye size={12} color="rgba(255,255,255,0.2)" /></td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{filtered.length} facture{filtered.length > 1 ? "s" : ""}</span>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>Total : {formatEuro(filtered.reduce((s, i) => s + (i.amount_ttc || 0), 0))}</span>
              </div>
            </div>
          </>
        )}

        {/* ═══ BUDGET PAGE ═══ */}
        {page === "budget" && (() => {
          const budgetData = {};
          invoices.forEach(inv => {
            const cat = getBudgetCategory(inv);
            if (!budgetData[cat]) budgetData[cat] = { total: 0, yearly: 0, count: 0, invoices: [] };
            budgetData[cat].total += inv.amount_ttc || 0;
            budgetData[cat].yearly += inv.total_year || inv.amount_ttc || 0;
            budgetData[cat].count++;
            budgetData[cat].invoices.push(inv);
          });
          const sortedCats = Object.entries(budgetData).sort(([, a], [, b]) => b.total - a.total);
          const grandTotal = sortedCats.reduce((s, [, d]) => s + d.total, 0);
          const grandYearly = sortedCats.reduce((s, [, d]) => s + d.yearly, 0);

          return (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, marginBottom: 3 }}>Budget</h2>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>Répartition de vos dépenses par catégorie</p>
                </div>
                <div style={{ background: "rgba(212,168,83,0.08)", border: "1px solid rgba(212,168,83,0.15)", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Estimation annuelle</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#D4A853", fontFamily: "'Cormorant Garamond', serif" }}>{formatEuro(grandYearly)}</div>
                </div>
              </div>

              {/* Budget pie chart */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={sortedCats.map(([name, d]) => ({ name, value: d.total }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                        {sortedCats.map(([cat], i) => <Cell key={i} fill={BUDGET_CATEGORIES[cat]?.color || "#888"} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sortedCats.map(([cat, d]) => {
                      const pct = grandTotal > 0 ? Math.round((d.total / grandTotal) * 100) : 0;
                      const color = BUDGET_CATEGORIES[cat]?.color || "#888";
                      return (
                        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, minWidth: 90 }}>{cat}</span>
                          <span style={{ color, fontSize: 12, fontWeight: 600, minWidth: 70, textAlign: "right" }}>{formatEuro(d.total)}</span>
                          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, minWidth: 35, textAlign: "right" }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Budget cards per category */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {sortedCats.map(([cat, d]) => {
                  const color = BUDGET_CATEGORIES[cat]?.color || "#888";
                  const pct = grandTotal > 0 ? Math.round((d.total / grandTotal) * 100) : 0;
                  return (
                    <div key={cat} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "16px 18px", borderLeft: `3px solid ${color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ color: "#EDE8DB", fontSize: 14, fontWeight: 600 }}>{cat}</span>
                        <span style={{ background: `${color}18`, color, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{pct}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Total factures</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Cormorant Garamond', serif" }}>{formatEuro(d.total)}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Est. annuel</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{formatEuro(d.yearly)}</div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden", marginBottom: 10 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s" }} />
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                        {d.count} facture{d.count > 1 ? "s" : ""} — {d.invoices.map(i => i.provider).filter((v, i, a) => a.indexOf(v) === i).join(", ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* ═══ REPORT PAGE ═══ */}
        {page === "report" && (() => {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const monthInvoices = invoices.filter(i => {
            if (!i.invoice_date) return false;
            const d = new Date(i.invoice_date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          });
          const prevMonthInvoices = invoices.filter(i => {
            if (!i.invoice_date) return false;
            const d = new Date(i.invoice_date);
            const pm = currentMonth === 0 ? 11 : currentMonth - 1;
            const py = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === pm && d.getFullYear() === py;
          });
          const monthTotal = monthInvoices.reduce((s, i) => s + (i.amount_ttc || 0), 0);
          const prevTotal = prevMonthInvoices.reduce((s, i) => s + (i.amount_ttc || 0), 0);
          const variation = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : 0;
          const monthAnomalies = monthInvoices.filter(i => i.has_anomaly);
          const recurring = invoices.filter(i => i.frequency === "mensuel");
          const recurringTotal = recurring.reduce((s, i) => s + (i.amount_ttc || 0), 0);

          const monthBudget = {};
          monthInvoices.forEach(inv => {
            const cat = getBudgetCategory(inv);
            monthBudget[cat] = (monthBudget[cat] || 0) + (inv.amount_ttc || 0);
          });

          const reportDate = `${MONTHS_FR[currentMonth]} ${currentYear}`;

          const printReport = () => {
            const w = window.open("", "_blank");
            w.document.write(`<!DOCTYPE html><html><head><title>Rapport ${reportDate} - Vigie-Factures</title>
            <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#222;padding:0 20px}
            h1{color:#B8860B;border-bottom:2px solid #B8860B;padding-bottom:10px}
            h2{color:#555;margin-top:30px}
            .stat{display:inline-block;background:#f5f0e8;padding:12px 20px;border-radius:8px;margin:5px;text-align:center}
            .stat .value{font-size:24px;font-weight:bold;color:#B8860B}
            .stat .label{font-size:11px;color:#888;margin-top:3px}
            table{width:100%;border-collapse:collapse;margin:15px 0}
            th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #eee;font-size:13px}
            th{background:#f5f0e8;color:#555;font-size:11px;text-transform:uppercase}
            .anomaly{color:#c0392b;font-weight:bold}
            .ok{color:#27ae60}
            .footer{margin-top:40px;text-align:center;color:#bbb;font-size:11px;border-top:1px solid #eee;padding-top:15px}
            </style></head><body>
            <h1>📊 Rapport mensuel — ${reportDate}</h1>
            <p style="color:#888">Généré le ${now.toLocaleDateString("fr-FR")} par Vigie-Factures</p>
            <div style="margin:20px 0">
              <div class="stat"><div class="value">${monthInvoices.length}</div><div class="label">Factures</div></div>
              <div class="stat"><div class="value">${formatEuro(monthTotal)}</div><div class="label">Total du mois</div></div>
              <div class="stat"><div class="value">${variation > 0 ? "+" : ""}${Math.round(variation)}%</div><div class="label">vs mois précédent</div></div>
              <div class="stat"><div class="value">${monthAnomalies.length}</div><div class="label">Anomalies</div></div>
            </div>
            <h2>Répartition budgétaire</h2>
            <table><tr><th>Catégorie</th><th>Montant</th><th>%</th></tr>
            ${Object.entries(monthBudget).sort(([, a], [, b]) => b - a).map(([cat, total]) =>
              `<tr><td>${cat}</td><td>${formatEuro(total)}</td><td>${monthTotal > 0 ? Math.round((total / monthTotal) * 100) : 0}%</td></tr>`
            ).join("")}
            <tr style="font-weight:bold;border-top:2px solid #B8860B"><td>Total</td><td>${formatEuro(monthTotal)}</td><td>100%</td></tr>
            </table>
            <h2>Détail des factures</h2>
            <table><tr><th>Fournisseur</th><th>Montant TTC</th><th>Date</th><th>Catégorie</th><th>Statut</th></tr>
            ${monthInvoices.map(i =>
              `<tr><td>${i.provider || "—"}</td><td>${formatEuro(i.amount_ttc)}</td><td>${formatDate(i.invoice_date)}</td><td>${getBudgetCategory(i)}</td><td class="${i.has_anomaly ? "anomaly" : "ok"}">${i.has_anomaly ? "⚠️ Anomalie" : "✅ OK"}</td></tr>`
            ).join("")}
            </table>
            ${monthAnomalies.length > 0 ? `<h2>⚠️ Anomalies détectées</h2>
            <table><tr><th>Fournisseur</th><th>Détail</th></tr>
            ${monthAnomalies.map(i => `<tr><td>${i.provider}</td><td>${i.anomaly_explanation || "Anomalie détectée"}</td></tr>`).join("")}
            </table>` : ""}
            <h2>Charges récurrentes</h2>
            <table><tr><th>Fournisseur</th><th>Montant/mois</th><th>Coût annuel</th></tr>
            ${recurring.map(i => `<tr><td>${i.provider || "—"}</td><td>${formatEuro(i.amount_ttc)}</td><td>${formatEuro(i.total_year)}</td></tr>`).join("")}
            <tr style="font-weight:bold;border-top:2px solid #B8860B"><td>Total récurrent</td><td>${formatEuro(recurringTotal)}/mois</td><td>${formatEuro(recurringTotal * 12)}/an</td></tr>
            </table>
            <div class="footer">Vigie-Factures © 2026 — Rapport généré automatiquement</div>
            </body></html>`);
            w.document.close();
            w.print();
          };

          return (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, marginBottom: 3 }}>Rapport mensuel</h2>
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>{reportDate} — {monthInvoices.length} facture{monthInvoices.length > 1 ? "s" : ""} ce mois</p>
                </div>
                <button
                  onClick={printReport}
                  style={{ background: "linear-gradient(135deg, #D4A853, #C78A5B)", color: "#0E0D0B", border: "none", borderRadius: 9, padding: "10px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Download size={13} /> Télécharger PDF
                </button>
              </div>

              {/* Summary stats */}
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                <StatCard icon={FileText} label="Factures du mois" value={monthInvoices.length} color="#D4A853" />
                <StatCard icon={TrendingUp} label="Total du mois" value={formatEuro(monthTotal)} sub={`${variation > 0 ? "+" : ""}${Math.round(variation)}% vs mois préc.`} color="#5BA3C7" trend={variation > 5 ? "up" : variation < -5 ? "down" : undefined} />
                <StatCard icon={AlertTriangle} label="Anomalies" value={monthAnomalies.length} sub={monthAnomalies.length > 0 ? "À vérifier" : "RAS"} color={monthAnomalies.length > 0 ? "#C75B4E" : "#5BC78A"} />
                <StatCard icon={Wallet} label="Récurrents" value={formatEuro(recurringTotal)} sub={`${recurring.length} abonnement${recurring.length > 1 ? "s" : ""}`} color="#A85BC7" />
              </div>

              {/* Budget breakdown */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
                <h3 style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 1.5, marginBottom: 14, fontWeight: 600, textTransform: "uppercase" }}>Répartition budgétaire du mois</h3>
                {Object.entries(monthBudget).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {Object.entries(monthBudget).sort(([, a], [, b]) => b - a).map(([cat, total]) => {
                      const pct = monthTotal > 0 ? Math.round((total / monthTotal) * 100) : 0;
                      const color = BUDGET_CATEGORIES[cat]?.color || "#888";
                      return (
                        <div key={cat}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{cat}</span>
                            <span style={{ color, fontSize: 12, fontWeight: 600 }}>{formatEuro(total)} <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>({pct}%)</span></span>
                          </div>
                          <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.15)", textAlign: "center", padding: 24, fontSize: 11 }}>Aucune facture ce mois</div>
                )}
              </div>

              {/* Invoice list for the month */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 500 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {["Fournisseur", "TTC", "Catégorie", "Statut"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: 9, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthInvoices.length === 0
                        ? <tr><td colSpan={4} style={{ padding: 36, textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 11 }}>Aucune facture ce mois</td></tr>
                        : monthInvoices.map((inv, i) => {
                          const cat = getBudgetCategory(inv);
                          const catColor = BUDGET_CATEGORIES[cat]?.color || "#888";
                          return (
                            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                              <td style={{ padding: "10px 12px", color: "#EDE8DB", fontSize: 11, fontWeight: 500 }}>{inv.provider || "—"}</td>
                              <td style={{ padding: "10px 12px", color: "#D4A853", fontSize: 11, fontWeight: 600 }}>{formatEuro(inv.amount_ttc)}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{ background: `${catColor}18`, color: catColor, padding: "2px 8px", borderRadius: 10, fontSize: 9, fontWeight: 600 }}>{cat}</span>
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                {inv.has_anomaly
                                  ? <span style={{ color: "#C75B4E", fontSize: 10, fontWeight: 600 }}>⚠️ Anomalie</span>
                                  : <span style={{ color: "rgba(91,199,138,0.6)", fontSize: 10 }}>✅ OK</span>
                                }
                              </td>
                            </tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      <InvoiceModal inv={selectedInv} onClose={() => setSelectedInv(null)} />
    </div>
  );
}
