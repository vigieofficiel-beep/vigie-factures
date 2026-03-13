import { useState, useEffect } from "react";
import { supabasePro } from '../lib/supabasePro';

// ─── Icônes ───────────────────────────────────────────────────────────
const Icon = {
  Mail:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7" strokeLinecap="round"/></svg>,
  Send:     () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Sparkle:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3l1.88 5.76L20 12l-6.12 3.24L12 21l-1.88-5.76L4 12l6.12-3.24L12 3z" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Alert:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  History:  () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10" strokeLinecap="round"/></svg>,
  Close:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>,
  Search:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/></svg>,
  Eye:      () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Copy:     () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  Refresh:  () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10" strokeLinecap="round"/></svg>,
  Settings: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
};

// ─── Constantes ───────────────────────────────────────────────────────
const TYPES_EMAIL = ["Relance facture", "Envoi devis", "Remerciement", "Confirmation", "Information", "Mise en demeure", "Autre"];
const TONS = ["Professionnel", "Cordial", "Formel", "Amical"];
const TABS = ["rediger", "relances", "historique", "parametres"];

const TAB_LABELS = {
  rediger:    { label: "Rédiger", icon: Icon.Sparkle },
  relances:   { label: "Relances auto", icon: Icon.Alert },
  historique: { label: "Historique", icon: Icon.History },
  parametres: { label: "Paramètres", icon: Icon.Settings },
};

const STATUT_COLORS = {
  envoyé:   { bg: "#d1fae5", text: "#065f46" },
  échec:    { bg: "#fee2e2", text: "#991b1b" },
  brouillon:{ bg: "#f3f4f6", text: "#374151" },
};

// ─── Appel Claude API ─────────────────────────────────────────────────
async function genererEmailIA({ contexte, type, ton, destinataire, montant, numeroFacture, raisonSociale }) {
  const prompt = `Tu es un assistant professionnel pour une entreprise française. Génère un email ${type.toLowerCase()} en français.

Informations :
- Destinataire : ${destinataire || "le client"}
- Ton souhaité : ${ton}
- Type : ${type}
- Contexte : ${contexte}
${montant ? `- Montant : ${montant} €` : ""}
${numeroFacture ? `- Référence facture : ${numeroFacture}` : ""}
${raisonSociale ? `- Expéditeur : ${raisonSociale}` : ""}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "sujet": "Objet de l'email",
  "corps": "Corps complet de l'email avec salutation, contenu et signature"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ─── Envoi via Resend (Edge Function Supabase) ────────────────────────
async function envoyerEmail({ destinataire, sujet, corps, type, config }) {
  // Appel à une Supabase Edge Function "send-email"
  const { data, error } = await supabasePro.functions.invoke("send-email", {
    body: {
      to: destinataire,
      from: config.email_expediteur || "noreply@vigiepro.fr",
      fromName: config.raison_sociale || "Vigie Pro",
      subject: sujet,
      html: corps.replace(/\n/g, "<br>"),
      text: corps,
    },
  });
  if (error) throw error;
  return data;
}

// ─── Onglet Rédiger ────────────────────────────────────────────────────
function OngletRediger({ config, onEmailEnvoye }) {
  const [form, setForm] = useState({
    destinataire: "", type: "Autre", ton: "Professionnel",
    contexte: "", numeroFacture: "", montant: "",
  });
  const [email, setEmail]         = useState(null); // { sujet, corps }
  const [generating, setGenerating] = useState(false);
  const [sending, setSending]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [copied, setCopied]       = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const generer = async () => {
    if (!form.contexte) { setError("Décrivez le contexte de l'email."); return; }
    setError(""); setGenerating(true); setEmail(null);
    try {
      const result = await genererEmailIA({
        ...form,
        raisonSociale: config?.raison_sociale,
      });
      setEmail(result);
    } catch (e) {
      setError("Erreur lors de la génération IA. Vérifiez votre connexion.");
    } finally {
      setGenerating(false);
    }
  };

  const envoyer = async () => {
    if (!form.destinataire || !email) return;
    if (!config?.email_expediteur) { setError("Configurez votre courriel d'expédition dans les Paramètres."); return; }
    setSending(true); setError("");
    try {
      await envoyerEmail({ ...form, sujet: email.sujet, corps: email.corps, config });
      // Sauvegarder dans l'historique
      const { data: { user } } = await supabasePro.auth.getUser();
      await supabasePro.from("mail_logs").insert([{
        user_id: user.id,
        destinataire: form.destinataire,
        sujet: email.sujet,
        corps: email.corps,
        type: form.type,
        statut: "envoyé",
      }]);
      setSuccess(`Courriel envoyé avec succès à ${form.destinataire} !`);
      setEmail(null);
      setForm({ destinataire: "", type: "Autre", ton: "Professionnel", contexte: "", numeroFacture: "", montant: "" });
      onEmailEnvoye?.();
    } catch (e) {
      // Sauvegarde en brouillon si l'envoi échoue
      const { data: { user } } = await supabasePro.auth.getUser();
      await supabasePro.from("mail_logs").insert([{
        user_id: user.id,
        destinataire: form.destinataire,
        sujet: email.sujet,
        corps: email.corps,
        type: form.type,
        statut: "échec",
      }]);
      setError("Échec de l'envoi. Vérifiez la configuration Resend dans les Paramètres.");
    } finally {
      setSending(false);
    }
  };

  const copier = () => {
    if (!email) return;
    navigator.clipboard.writeText(`Objet : ${email.sujet}\n\n${email.corps}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* Formulaire */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={card}>
          <h3 style={cardTitle}>Paramètres de l'email</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Destinataire (email)">
              <input type="email" value={form.destinataire} onChange={e => set("destinataire", e.target.value)}
                style={inputStyle} placeholder="client@exemple.fr" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Type d'email">
                <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle}>
                  {TYPES_EMAIL.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Ton">
                <select value={form.ton} onChange={e => set("ton", e.target.value)} style={inputStyle}>
                  {TONS.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            {(form.type === "Relance facture" || form.type === "Mise en demeure") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="N° Facture">
                  <input value={form.numeroFacture} onChange={e => set("numeroFacture", e.target.value)}
                    style={inputStyle} placeholder="F-2026-001" />
                </Field>
                <Field label="Montant (€)">
                  <input type="number" value={form.montant} onChange={e => set("montant", e.target.value)}
                    style={inputStyle} placeholder="1500" />
                </Field>
              </div>
            )}
            <Field label="Contexte — décrivez votre message">
              <textarea value={form.contexte} onChange={e => set("contexte", e.target.value)}
                rows={4} style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Ex: Relancer M. Dupont pour la facture du 15 janvier, 2ème relance, ton ferme mais poli..." />
            </Field>
            <button onClick={generer} disabled={generating} style={{
              ...btnPrimary,
              justifyContent: "center",
              background: generating ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: generating ? "#9ca3af" : "#fff",
            }}>
              <Icon.Sparkle />
              {generating ? "Génération en cours..." : "Générer"}
            </button>
          </div>
        </div>

        {(error || success) && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13,
            background: error ? "#fef2f2" : "#f0fdf4",
            color: error ? "#dc2626" : "#166534",
            border: `1px solid ${error ? "#fca5a5" : "#bbf7d0"}`,
          }}>
            {error || success}
          </div>
        )}
      </div>

      {/* Aperçu email */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!email ? (
          <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, color: "#9ca3af", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
            <p style={{ margin: 0, fontSize: 14 }}>Le courriel généré apparaîtra ici</p>
            <p style={{ margin: "8px 0 0", fontSize: 12 }}>Remplissez le formulaire et cliquez sur "Générer"</p>
          </div>
        ) : (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ ...cardTitle, margin: 0 }}>Aperçu & édition</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={copier} style={btnSecondary} title="Copier">
                  <Icon.Copy /> {copied ? "Copié !" : "Copier"}
                </button>
                <button onClick={generer} style={btnSecondary} title="Régénérer">
                  <Icon.Refresh /> Régénérer
                </button>
              </div>
            </div>

            <Field label="Objet">
              <input value={email.sujet} onChange={e => setEmail(em => ({ ...em, sujet: e.target.value }))}
                style={{ ...inputStyle, fontWeight: 600 }} />
            </Field>

            <div style={{ marginTop: 12 }}>
              <Field label="Corps de l'email">
                <textarea
                  value={email.corps}
                  onChange={e => setEmail(em => ({ ...em, corps: e.target.value }))}
                  rows={12}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.7 }}
                />
              </Field>
            </div>

            <button onClick={envoyer} disabled={sending || !form.destinataire} style={{
              ...btnPrimary, justifyContent: "center", marginTop: 14,
              background: !form.destinataire ? "#e5e7eb" : "#10b981",
              color: !form.destinataire ? "#9ca3af" : "#fff",
              cursor: !form.destinataire ? "not-allowed" : "pointer",
            }}>
              <Icon.Send />
              {sending ? "Envoi en cours..." : `Envoyer à ${form.destinataire || "..."}`}
            </button>

            {!config?.email_expediteur && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#f59e0b", textAlign: "center" }}>
                ⚠️ Configurez votre courriel d'expédition dans les Paramètres avant d'envoyer.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onglet Relances auto ─────────────────────────────────────────────
function OngletRelances({ config, onEmailEnvoye }) {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState({});
  const [generated, setGenerated] = useState({});
  const [success, setSuccess]   = useState({});

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabasePro.auth.getUser();
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabasePro
        .from("invoices")
        .select("*, clients(nom, email)")
        .eq("user_id", user.id)
        .neq("statut", "Payée")
        .lt("date_echeance", today);
      setFactures(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const genererRelance = async (facture) => {
    setSending(s => ({ ...s, [facture.id]: "generating" }));
    try {
      const result = await genererEmailIA({
        type: "Relance facture",
        ton: "Professionnel",
        contexte: `Relance pour facture impayée`,
        destinataire: facture.clients?.nom || "le client",
        montant: facture.montant_ttc || facture.montant_ht,
        numeroFacture: facture.numero || facture.id.substring(0, 8).toUpperCase(),
        raisonSociale: config?.raison_sociale,
      });
      setGenerated(g => ({ ...g, [facture.id]: result }));
    } catch (e) {
      console.error(e);
    } finally {
      setSending(s => ({ ...s, [facture.id]: null }));
    }
  };

  const envoyerRelance = async (facture) => {
    const emailData = generated[facture.id];
    const destinataire = facture.clients?.email;
    if (!destinataire || !emailData) return;
    if (!config?.email_expediteur) { alert("Configurez votre courriel d'expédition dans les Paramètres."); return; }
    setSending(s => ({ ...s, [facture.id]: "sending" }));
    try {
      await envoyerEmail({ destinataire, sujet: emailData.sujet, corps: emailData.corps, type: "Relance facture", config });
      const { data: { user } } = await supabasePro.auth.getUser();
      await supabasePro.from("mail_logs").insert([{
        user_id: user.id,
        destinataire,
        sujet: emailData.sujet,
        corps: emailData.corps,
        type: "Relance facture",
        statut: "envoyé",
      }]);
      setSuccess(s => ({ ...s, [facture.id]: true }));
      onEmailEnvoye?.();
    } catch (e) {
      alert("Échec de l'envoi.");
    } finally {
      setSending(s => ({ ...s, [facture.id]: null }));
    }
  };

  const joursRetard = (dateEcheance) => {
    const diff = Math.floor((new Date() - new Date(dateEcheance)) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Chargement...</div>;

  if (factures.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: "#6b7280", background: "#f0fdf4", borderRadius: 12, border: "2px dashed #bbf7d0" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
      <p style={{ margin: 0, fontWeight: 600, color: "#166534" }}>Aucune facture en retard !</p>
      <p style={{ margin: "6px 0 0", fontSize: 13 }}>Toutes vos factures sont à jour.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#92400e", display: "flex", gap: 8 }}>
        <Icon.Alert />
        <span><b>{factures.length} facture{factures.length > 1 ? "s" : ""}</b> en retard de paiement détectée{factures.length > 1 ? "s" : ""}. Les courriels de relance peuvent être générés automatiquement.</span>
      </div>

      {factures.map(f => {
        const retard = joursRetard(f.date_echeance);
        const emailGenere = generated[f.id];
        const isSending = sending[f.id];
        const isSuccess = success[f.id];

        return (
          <div key={f.id} style={{ ...card, borderLeft: `4px solid ${retard > 30 ? "#ef4444" : "#f59e0b"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{f.clients?.nom || "Client inconnu"}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                  {f.numero || `FAC-${f.id.substring(0, 8).toUpperCase()}`} — {f.montant_ttc ? `${Number(f.montant_ttc).toLocaleString("fr-FR")} € TTC` : "Montant non défini"}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                  Échéance : {f.date_echeance ? new Date(f.date_echeance + "T12:00:00").toLocaleDateString("fr-FR") : "—"}
                </div>
              </div>
              <span style={{
                fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                background: retard > 30 ? "#fee2e2" : "#fef3c7",
                color: retard > 30 ? "#991b1b" : "#92400e",
              }}>
                {retard}j de retard
              </span>
            </div>

            {isSuccess ? (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", fontWeight: 600, textAlign: "center" }}>
                ✅ Relance envoyée avec succès à {f.clients?.email}
              </div>
            ) : emailGenere ? (
              <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase" }}>Aperçu courriel généré</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Objet : {emailGenere.sujet}</div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, maxHeight: 100, overflow: "hidden", whiteSpace: "pre-line" }}>
                  {emailGenere.corps.substring(0, 200)}...
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button onClick={() => envoyerRelance(f)} disabled={isSending === "sending"} style={{ ...btnPrimary, flex: 1, justifyContent: "center", background: "#10b981", fontSize: 13 }}>
                    <Icon.Send /> {isSending === "sending" ? "Envoi..." : `Envoyer à ${f.clients?.email || "..."}`}
                  </button>
                  <button onClick={() => genererRelance(f)} style={{ ...btnSecondary, fontSize: 13 }}>
                    <Icon.Refresh />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => genererRelance(f)} disabled={isSending === "generating"} style={{ ...btnSecondary, justifyContent: "center", width: "100%" }}>
                <Icon.Sparkle />
                {isSending === "generating" ? "Génération..." : "Générer la relance"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Onglet Historique ─────────────────────────────────────────────────
function OngletHistorique({ refresh }) {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    const { data } = await supabasePro
      .from("mail_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [refresh]);

  const filtered = logs.filter(l =>
    !search || `${l.destinataire} ${l.sujet} ${l.type}`.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: logs.length,
    envoyes: logs.filter(l => l.statut === "envoyé").length,
    echecs: logs.filter(l => l.statut === "échec").length,
  };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Chargement...</div>;

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total envoyés", value: stats.total, color: "#6366f1" },
          { label: "Succès", value: stats.envoyes, color: "#10b981" },
          { label: "Échecs", value: stats.echecs, color: "#ef4444" },
        ].map(k => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}><Icon.Search /></span>
        <input placeholder="Rechercher dans l'historique..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 36 }} />
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Aucun courriel dans l'historique.</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Date", "Destinataire", "Objet", "Type", "Statut", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const sc = STATUT_COLORS[l.statut] || { bg: "#f3f4f6", text: "#374151" };
                return (
                  <tr key={l.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#6b7280" }}>
                      {new Date(l.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#111827", fontWeight: 600 }}>{l.destinataire}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.sujet}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280" }}>{l.type}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: sc.bg, color: sc.text }}>{l.statut}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => setSelected(l)} style={btnIcon} title="Voir le contenu"><Icon.Eye /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal aperçu courriel */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "80vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "18px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Contenu de l'email</h3>
              <button onClick={() => setSelected(null)} style={btnIcon}><Icon.Close /></button>
            </div>
            <div style={{ padding: 22 }}>
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>À</span>
                <span style={{ fontSize: 13, color: "#111827", marginLeft: 8 }}>{selected.destinataire}</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Objet</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginLeft: 8 }}>{selected.sujet}</span>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, fontSize: 13, color: "#374151", lineHeight: 1.8, whiteSpace: "pre-line" }}>
                {selected.corps}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Paramètres ─────────────────────────────────────────────────
function OngletParametres({ config, onSave }) {
  const [form, setForm] = useState(config || {
    email_expediteur: "",
    raison_sociale: "",
    resend_api_key: "",
    signature: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sauvegarder = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const { error } = await supabasePro.from("mail_config").upsert([{ ...form, user_id: user.id }]);
      if (error) throw error;
      setSuccess(true);
      onSave(form);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert("Erreur lors de la sauvegarde : " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={card}>
        <h3 style={cardTitle}>Configuration de l'expédition</h3>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#1e40af" }}>
          Le Mail Agent utilise <b>Resend</b> pour envoyer les courriels. Créez un compte gratuit sur{" "}
          <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ color: "#6366f1" }}>resend.com</a>{" "}
          et récupérez votre clé API. Vous pouvez envoyer jusqu'à 3 000 courriels/mois gratuitement.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Clé API Resend">
            <input type="password" value={form.resend_api_key} onChange={e => set("resend_api_key", e.target.value)}
              style={inputStyle} placeholder="re_xxxxxxxxxxxxxxxxxxxx" />
          </Field>
          <Field label="Courriel d'expédition (ex: contact@mondomaine.fr)">
            <input type="email" value={form.email_expediteur} onChange={e => set("email_expediteur", e.target.value)}
              style={inputStyle} placeholder="contact@mondomaine.fr" />
          </Field>
          <Field label="Raison sociale (affiché comme expéditeur)">
            <input value={form.raison_sociale} onChange={e => set("raison_sociale", e.target.value)}
              style={inputStyle} placeholder="Ma Société SAS" />
          </Field>
          <Field label="Signature automatique">
            <textarea value={form.signature} onChange={e => set("signature", e.target.value)}
              rows={4} style={{ ...inputStyle, resize: "vertical" }}
              placeholder="Cordialement,&#10;Jean Dupont&#10;Ma Société SAS&#10;01 23 45 67 89" />
          </Field>

          <button onClick={sauvegarder} disabled={saving} style={{ ...btnPrimary, justifyContent: "center" }}>
            {saving ? "Sauvegarde..." : "Sauvegarder la configuration"}
          </button>

          {success && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#166534", textAlign: "center", fontWeight: 600 }}>
              ✅ Configuration sauvegardée avec succès !
            </div>
          )}
        </div>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <h3 style={cardTitle}>Supabase Edge Function</h3>
        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7 }}>
          Pour que l'envoi de courriels fonctionne, vous devez déployer une Edge Function Supabase nommée{" "}
          <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: 4, color: "#4f46e5" }}>send-email</code>{" "}
          qui utilisera votre clé API Resend. Cette fonction est disponible dans la documentation Supabase.
          Rendez-vous dans votre dashboard Supabase → Edge Functions → New Function.
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────
export default function MailAgent() {
  const [tab, setTab]         = useState("rediger");
  const [config, setConfig]   = useState(null);
  const [refreshLog, setRefreshLog] = useState(0);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data: { user } } = await supabasePro.auth.getUser();
      const { data } = await supabasePro.from("mail_config").select("*").eq("user_id", user.id).single();
      if (data) setConfig(data);
    };
    fetchConfig();
  }, []);

  const onEmailEnvoye = () => setRefreshLog(r => r + 1);

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827" }}>Mail Agent</h1>
        <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>
          Rédigez et envoyez des courriels professionnels · Mode sortant uniquement
        </p>
      </div>

      {/* Alerte si pas configuré */}
      {!config?.email_expediteur && (
        <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400e", display: "flex", gap: 10, alignItems: "center" }}>
          <Icon.Alert />
          <span>Configurez votre courriel d'expédition dans les <b>Paramètres</b> pour pouvoir envoyer des courriels.</span>
          <button onClick={() => setTab("parametres")} style={{ ...btnSecondary, marginLeft: "auto", fontSize: 12, padding: "5px 12px" }}>
            Configurer →
          </button>
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f3f4f6", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {TABS.map(t => {
          const TabIcon = TAB_LABELS[t].icon;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, border: "none",
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              background: tab === t ? "#fff" : "transparent",
              color: tab === t ? "#111827" : "#6b7280",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 150ms ease",
            }}>
              <TabIcon /> {TAB_LABELS[t].label}
            </button>
          );
        })}
      </div>

      {/* Contenu */}
      {tab === "rediger"    && <OngletRediger config={config} onEmailEnvoye={onEmailEnvoye} />}
      {tab === "relances"   && <OngletRelances config={config} onEmailEnvoye={onEmailEnvoye} />}
      {tab === "historique" && <OngletHistorique refresh={refreshLog} />}
      {tab === "parametres" && <OngletParametres config={config} onSave={setConfig} />}
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}

const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };
const cardTitle = { margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em" };
const inputStyle = { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#111827", background: "#fff", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const btnPrimary = { display: "flex", alignItems: "center", gap: 6, background: "#6366f1", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };
const btnSecondary = { display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#374151", border: "1px solid #d1d5db", padding: "7px 14px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" };
const btnIcon = { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 5, borderRadius: 6, display: "flex" };
