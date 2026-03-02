import { useState, useEffect } from "react";
import { supabasePro } from '../lib/supabasePro';
// ─── Icônes SVG inline ───────────────────────────────────────────────
const Icon = {
  Plus: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>,
  Edit: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/></svg>,
  Trash: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6" strokeLinecap="round"/><path d="M10 11v6M14 11v6" strokeLinecap="round"/><path d="M9 6V4h6v2" strokeLinecap="round"/></svg>,
  Search: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/></svg>,
  Download: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/></svg>,
  Close: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>,
  Mail: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7" strokeLinecap="round"/></svg>,
  Phone: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 012.09 5.18 2 2 0 014.07 3h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 10.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 17.92z"/></svg>,
  Globe: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" strokeLinecap="round"/></svg>,
  Cart: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" strokeLinecap="round"/></svg>,
  Invoice: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Alert: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

// ─── Constantes ───────────────────────────────────────────────────────
const CATEGORIES = ["Informatique", "Logistique", "Fournitures", "Services", "Immobilier", "Communication", "Finance", "Autre"];
const STATUTS_FACTURE = ["En attente", "Payée", "En retard", "Contestée"];
const STATUT_COLOR = {
  "En attente": { bg: "#fef3c7", text: "#92400e" },
  "Payée":      { bg: "#d1fae5", text: "#065f46" },
  "En retard":  { bg: "#fee2e2", text: "#991b1b" },
  "Contestée":  { bg: "#ede9fe", text: "#5b21b6" },
};
const TABS = ["fournisseurs", "factures"];

// ─── Modal Fournisseur ────────────────────────────────────────────────
function FournisseurModal({ fournisseur, onClose, onSave }) {
  const [form, setForm] = useState(fournisseur || {
    nom: "", siret: "", categorie: "Autre",
    email: "", telephone: "", site_web: "",
    adresse: "", code_postal: "", ville: "",
    contact_nom: "", conditions_paiement: 30, notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.nom) { setError("Le nom du fournisseur est obligatoire."); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const payload = { ...form, user_id: user.id };
      let err;
      if (form.id) {
        ({ error: err } = await supabasePro.from("fournisseurs").update(payload).eq("id", form.id));
      } else {
        ({ error: err } = await supabasePro.from("fournisseurs").insert([payload]));
      }
      if (err) throw err;
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const F = ({ label, k, type = "text", opts = {} }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {opts.select ? (
        <select value={form[k]} onChange={e => set(k, e.target.value)} style={inputStyle}>
          {opts.options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : opts.textarea ? (
        <textarea value={form[k]} onChange={e => set(k, e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder={opts.placeholder || ""} />
      ) : (
        <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} style={inputStyle} placeholder={opts.placeholder || ""} />
      )}
    </div>
  );

  return (
    <div style={overlay}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 660, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "22px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827" }}>
            {form.id ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
          </h2>
          <button onClick={onClose} style={btnIcon}><Icon.Close /></button>
        </div>
        <div style={{ padding: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}><F label="Nom *" k="nom" opts={{ placeholder: "Acme SARL" }} /></div>
          <F label="SIRET" k="siret" opts={{ placeholder: "XXX XXX XXX XXXXX" }} />
          <F label="Catégorie" k="categorie" opts={{ select: true, options: CATEGORIES }} />
          <F label="Email" k="email" type="email" opts={{ placeholder: "contact@fournisseur.fr" }} />
          <F label="Téléphone" k="telephone" type="tel" opts={{ placeholder: "01 XX XX XX XX" }} />
          <div style={{ gridColumn: "1/-1" }}><F label="Site web" k="site_web" opts={{ placeholder: "https://..." }} /></div>
          <div style={{ gridColumn: "1/-1" }}><F label="Adresse" k="adresse" opts={{ placeholder: "12 rue de la Paix" }} /></div>
          <F label="Code postal" k="code_postal" opts={{ placeholder: "75001" }} />
          <F label="Ville" k="ville" opts={{ placeholder: "Paris" }} />
          <F label="Nom du contact" k="contact_nom" opts={{ placeholder: "Jean Dupont" }} />
          <F label="Délai de paiement (jours)" k="conditions_paiement" type="number" opts={{ placeholder: "30" }} />
          <div style={{ gridColumn: "1/-1" }}><F label="Notes" k="notes" opts={{ textarea: true, placeholder: "Informations complémentaires..." }} /></div>
          {error && <div style={{ gridColumn: "1/-1", color: "#dc2626", fontSize: 13, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>{error}</div>}
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnSecondary}>Annuler</button>
            <button onClick={handleSubmit} disabled={saving} style={btnPrimary}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Facture fournisseur ────────────────────────────────────────
function FactureModal({ facture, fournisseurs, onClose, onSave }) {
  const [form, setForm] = useState(facture || {
    fournisseur_id: fournisseurs[0]?.id || "",
    numero: "", date_facture: new Date().toISOString().split("T")[0],
    date_echeance: "", montant_ht: "", tva: 20, statut: "En attente", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const montantTTC = form.montant_ht ? (Number(form.montant_ht) * (1 + Number(form.tva) / 100)).toFixed(2) : "";

  const handleSubmit = async () => {
    if (!form.fournisseur_id || !form.montant_ht) { setError("Fournisseur et montant sont obligatoires."); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const payload = { ...form, user_id: user.id, montant_ttc: Number(montantTTC) };
      let err;
      if (form.id) {
        ({ error: err } = await supabasePro.from("factures_fournisseurs").update(payload).eq("id", form.id));
      } else {
        ({ error: err } = await supabasePro.from("factures_fournisseurs").insert([payload]));
      }
      if (err) throw err;
      onSave();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={overlay}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 540, overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "22px 26px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#111827" }}>
            {form.id ? "Modifier la facture" : "Saisir une facture fournisseur"}
          </h2>
          <button onClick={onClose} style={btnIcon}><Icon.Close /></button>
        </div>
        <div style={{ padding: 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={labelStyle}>Fournisseur *</label>
            <select value={form.fournisseur_id} onChange={e => set("fournisseur_id", e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
          </div>
          {[
            { label: "N° Facture", k: "numero", placeholder: "F-2026-001" },
          ].map(({ label, k, placeholder }) => (
            <div key={k} style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>{label}</label>
              <input value={form[k]} onChange={e => set(k, e.target.value)} style={inputStyle} placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label style={labelStyle}>Date facture</label>
            <input type="date" value={form.date_facture} onChange={e => set("date_facture", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Date d'échéance</label>
            <input type="date" value={form.date_echeance} onChange={e => set("date_echeance", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Montant HT (€) *</label>
            <input type="number" value={form.montant_ht} onChange={e => set("montant_ht", e.target.value)} style={inputStyle} placeholder="0.00" />
          </div>
          <div>
            <label style={labelStyle}>TVA (%)</label>
            <select value={form.tva} onChange={e => set("tva", e.target.value)} style={inputStyle}>
              {[0, 5.5, 10, 20].map(t => <option key={t} value={t}>{t}%</option>)}
            </select>
          </div>
          {montantTTC && (
            <div style={{ gridColumn: "1/-1" }}>
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "#0369a1" }}>Montant TTC</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#0369a1" }}>{Number(montantTTC).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
              </div>
            </div>
          )}
          <div>
            <label style={labelStyle}>Statut</label>
            <select value={form.statut} onChange={e => set("statut", e.target.value)} style={inputStyle}>
              {STATUTS_FACTURE.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Notes</label>
            <input value={form.notes} onChange={e => set("notes", e.target.value)} style={inputStyle} placeholder="Optionnel" />
          </div>
          {error && <div style={{ gridColumn: "1/-1", color: "#dc2626", fontSize: 13, background: "#fef2f2", padding: "8px 12px", borderRadius: 8 }}>{error}</div>}
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnSecondary}>Annuler</button>
            <button onClick={handleSubmit} disabled={saving} style={btnPrimary}>{saving ? "Enregistrement..." : "Enregistrer"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────────────
export default function FournisseursPro() {
  const [tab, setTab] = useState("fournisseurs");
  const [fournisseurs, setFournisseurs] = useState([]);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtreCategorie, setFiltreCategorie] = useState("Toutes");
  const [filtreStatut, setFiltreStatut] = useState("Tous");
  const [modal, setModal] = useState(null); // null | "new-f" | "new-fac" | objet

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();
    const [{ data: f }, { data: fac }] = await Promise.all([
      supabasePro.from("fournisseurs").select("*").eq("user_id", user.id).order("nom"),
      supabasePro.from("factures_fournisseurs").select("*").eq("user_id", user.id).order("date_facture", { ascending: false }),
    ]);
    setFournisseurs(f || []);
    setFactures(fac || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteFournisseur = async (id) => {
    if (!window.confirm("Supprimer ce fournisseur ? Ses factures seront aussi supprimées.")) return;
    await supabasePro.from("fournisseurs").delete().eq("id", id);
    fetchAll();
  };

  const deleteFacture = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    await supabasePro.from("factures_fournisseurs").delete().eq("id", id);
    fetchAll();
  };

  const nomFournisseur = (id) => fournisseurs.find(f => f.id === id)?.nom || "—";

  // ── Filtres fournisseurs
  const filteredF = fournisseurs.filter(f => {
    const q = search.toLowerCase();
    const matchS = !search || `${f.nom} ${f.email} ${f.ville} ${f.categorie}`.toLowerCase().includes(q);
    const matchC = filtreCategorie === "Toutes" || f.categorie === filtreCategorie;
    return matchS && matchC;
  });

  // ── Filtres factures
  const filteredFac = factures.filter(f => {
    const q = search.toLowerCase();
    const nom = nomFournisseur(f.fournisseur_id).toLowerCase();
    const matchS = !search || nom.includes(q) || (f.numero || "").toLowerCase().includes(q);
    const matchSt = filtreStatut === "Tous" || f.statut === filtreStatut;
    return matchS && matchSt;
  });

  // ── KPIs
  const totalDu = factures.filter(f => f.statut === "En attente" || f.statut === "En retard")
    .reduce((s, f) => s + Number(f.montant_ttc || 0), 0);
  const enRetard = factures.filter(f => {
    if (f.statut === "Payée") return false;
    if (!f.date_echeance) return false;
    return new Date(f.date_echeance) < new Date();
  }).length;
  const totalAnnee = factures.filter(f => f.date_facture?.startsWith(new Date().getFullYear().toString()))
    .reduce((s, f) => s + Number(f.montant_ttc || 0), 0);

  // ── Export CSV
  const exportCSV = () => {
    if (tab === "fournisseurs") {
      const h = ["Nom","SIRET","Catégorie","Email","Téléphone","Ville","Contact","Délai paiement"];
      const r = filteredF.map(f => [f.nom,f.siret,f.categorie,f.email,f.telephone,f.ville,f.contact_nom,f.conditions_paiement]);
      dl(h, r, "fournisseurs.csv");
    } else {
      const h = ["Date","Fournisseur","N° Facture","Montant HT","TVA%","Montant TTC","Échéance","Statut"];
      const r = filteredFac.map(f => [f.date_facture,nomFournisseur(f.fournisseur_id),f.numero,f.montant_ht,f.tva,f.montant_ttc,f.date_echeance,f.statut]);
      dl(h, r, "factures_fournisseurs.csv");
    }
  };
  const dl = (h, r, name) => {
    const csv = [h, ...r].map(row => row.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    a.download = name; a.click();
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>

      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111827" }}>Fournisseurs</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>Gérez vos fournisseurs et leurs factures entrantes</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={exportCSV} style={btnSecondary}><Icon.Download /> Export CSV</button>
          <button onClick={() => setModal(tab === "fournisseurs" ? "new-f" : "new-fac")} style={btnPrimary}>
            <Icon.Plus /> {tab === "fournisseurs" ? "Ajouter un fournisseur" : "Saisir une facture"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Fournisseurs actifs", value: fournisseurs.length, color: "#a855f7" },
          { label: "Factures en attente", value: factures.filter(f => f.statut === "En attente").length, color: "#f59e0b" },
          { label: "En retard", value: enRetard, color: "#ef4444", alert: enRetard > 0 },
          { label: "Total dû", value: totalDu.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }), color: "#3b82f6" },
        ].map(k => (
          <div key={k.label} style={{ background: k.alert ? "#fef2f2" : "#fff", border: `1px solid ${k.alert ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</span>
              {k.alert && <Icon.Alert />}
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f3f4f6", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          { id: "fournisseurs", label: "Fournisseurs", icon: <Icon.Cart /> },
          { id: "factures",     label: "Factures reçues", icon: <Icon.Invoice /> },
        ].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 8, border: "none",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            background: tab === t.id ? "#fff" : "transparent",
            color: tab === t.id ? "#111827" : "#6b7280",
            boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            transition: "all 150ms ease",
          }}>
            {t.icon} {t.label}
            {t.id === "factures" && enRetard > 0 && (
              <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{enRetard}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}><Icon.Search /></span>
          <input placeholder={tab === "fournisseurs" ? "Rechercher un fournisseur..." : "Rechercher une facture..."} value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 36, width: "100%", boxSizing: "border-box" }} />
        </div>
        {tab === "fournisseurs" ? (
          <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="Toutes">Toutes les catégories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        ) : (
          <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="Tous">Tous les statuts</option>
            {STATUTS_FACTURE.map(s => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>

      {/* ── LISTE FOURNISSEURS */}
      {tab === "fournisseurs" && (
        loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Chargement...</div>
        ) : filteredF.length === 0 ? (
          <EmptyState icon={<Icon.Cart />} text="Aucun fournisseur. Ajoutez-en un pour commencer." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filteredF.map(f => {
              const nbFactures = factures.filter(fac => fac.fournisseur_id === f.id).length;
              const totalF = factures.filter(fac => fac.fournisseur_id === f.id).reduce((s, fac) => s + Number(fac.montant_ttc || 0), 0);
              const initiales = f.nom.substring(0, 2).toUpperCase();
              return (
                <div key={f.id} style={card}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: "linear-gradient(135deg,#a855f7,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                        {initiales}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{f.nom}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{f.categorie}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: "#f3e8ff", color: "#7c3aed" }}>
                      {nbFactures} facture{nbFactures !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                    {f.email && <Row icon={<Icon.Mail />}>{f.email}</Row>}
                    {f.telephone && <Row icon={<Icon.Phone />}>{f.telephone}</Row>}
                    {f.site_web && <Row icon={<Icon.Globe />}><a href={f.site_web} target="_blank" rel="noreferrer" style={{ color: "#6366f1", textDecoration: "none" }}>{f.site_web.replace(/^https?:\/\//, "")}</a></Row>}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>Délai : {f.conditions_paiement || 30}j</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{totalF > 0 ? totalF.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }) : ""}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button onClick={() => setModal(f)} style={{ ...btnSecondary, flex: 1, justifyContent: "center", fontSize: 13 }}>
                      <Icon.Edit /> Modifier
                    </button>
                    <button onClick={() => deleteFournisseur(f.id)} style={{ ...btnDanger, padding: "6px 12px" }}>
                      <Icon.Trash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── LISTE FACTURES */}
      {tab === "factures" && (
        loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Chargement...</div>
        ) : filteredFac.length === 0 ? (
          <EmptyState icon={<Icon.Invoice />} text="Aucune facture fournisseur saisie." />
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Date","Fournisseur","N° Facture","Montant HT","TTC","Échéance","Statut",""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFac.map((f, i) => {
                  const sc = STATUT_COLOR[f.statut] || { bg: "#f3f4f6", text: "#374151" };
                  const enRetardItem = f.statut !== "Payée" && f.date_echeance && new Date(f.date_echeance) < new Date();
                  return (
                    <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6", background: enRetardItem ? "#fff7f7" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "10px 14px", fontSize: 14, color: "#374151" }}>
                        {f.date_facture ? new Date(f.date_facture + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{nomFournisseur(f.fournisseur_id)}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#6b7280", fontFamily: "monospace" }}>{f.numero || "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 14, color: "#374151" }}>{f.montant_ht ? `${Number(f.montant_ht).toLocaleString("fr-FR")} €` : "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: "#111827" }}>{f.montant_ttc ? `${Number(f.montant_ttc).toLocaleString("fr-FR")} €` : "—"}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: enRetardItem ? "#ef4444" : "#6b7280", fontWeight: enRetardItem ? 700 : 400 }}>
                        {f.date_echeance ? new Date(f.date_echeance + "T12:00:00").toLocaleDateString("fr-FR") : "—"}
                        {enRetardItem && " ⚠️"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sc.bg, color: sc.text }}>{f.statut}</span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setModal({ ...f, _type: "facture" })} style={btnIcon}><Icon.Edit /></button>
                          <button onClick={() => deleteFacture(f.id)} style={{ ...btnIcon, color: "#ef4444" }}><Icon.Trash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modals */}
      {modal === "new-f" && (
        <FournisseurModal fournisseur={null} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchAll(); }} />
      )}
      {modal === "new-fac" && (
        <FactureModal facture={null} fournisseurs={fournisseurs} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchAll(); }} />
      )}
      {modal && modal._type === "facture" && (
        <FactureModal facture={modal} fournisseurs={fournisseurs} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchAll(); }} />
      )}
      {modal && typeof modal === "object" && !modal._type && modal.id && (
        <FournisseurModal fournisseur={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchAll(); }} />
      )}
    </div>
  );
}

// ─── Petits composants ────────────────────────────────────────────────
function Row({ icon, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#374151", overflow: "hidden" }}>
      <span style={{ color: "#9ca3af", flexShrink: 0 }}>{icon}</span>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</span>
    </div>
  );
}
function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: 60, color: "#6b7280", background: "#f9fafb", borderRadius: 12, border: "2px dashed #e5e7eb" }}>
      <div style={{ opacity: 0.4 }}>{icon}</div>
      <p style={{ marginTop: 12 }}>{text}</p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const inputStyle = { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#111827", background: "#fff", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" };
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block" };
const btnPrimary = { display: "flex", alignItems: "center", gap: 6, background: "#a855f7", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };
const btnSecondary = { display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#374151", border: "1px solid #d1d5db", padding: "9px 16px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };
const btnDanger = { display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", padding: "6px 10px" };
const btnIcon = { background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 5, borderRadius: 6, display: "flex" };
const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s" };
