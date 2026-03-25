import { useState, useEffect } from "react";
import { supabasePro } from '../lib/supabasePro';
// ─── Icônes ─────────────────────────────────────────────────────────
const Icon = {
  Clock: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" strokeLinecap="round"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6" strokeLinecap="round"/>
      <path d="M10 11v6M14 11v6" strokeLinecap="round"/><path d="M9 6V4h6v2" strokeLinecap="round"/>
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/>
    </svg>
  ),
  Close: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="15 18 9 12 15 6" strokeLinecap="round"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points="9 18 15 12 9 6" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── Helpers ─────────────────────────────────────────────────────────
const TYPES = ["Travail", "Congé payé", "RTT", "Maladie", "Télétravail", "Formation", "Absence non justifiée"];
const TYPE_COLOR = {
  Travail: "#5BA3C7",
  "Congé payé": "#5BC78A",
  RTT: "#3b82f6",
  Maladie: "#f59e0b",
  Télétravail: "#8b5cf6",
  Formation: "#0ea5e9",
  "Absence non justifiée": "#ef4444",
};

function formatHeure(h) {
  if (!h) return "—";
  return h.substring(0, 5);
}

function dureeHeures(debut, fin) {
  if (!debut || !fin) return null;
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  const diff = (fh * 60 + fm) - (dh * 60 + dm);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h${m > 0 ? String(m).padStart(2, "0") : ""}`;
}

function dureeMinutes(debut, fin, pause = 0) {
  if (!debut || !fin) return 0;
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  return Math.max(0, (fh * 60 + fm) - (dh * 60 + dm) - Number(pause));
}

// ─── Modal Pointage ────────────────────────────────────────────────
function PointageModal({ pointage, employes, onClose, onSave }) {
  const [form, setForm] = useState(
    pointage || {
      employe_id: employes[0]?.id || "",
      date: new Date().toISOString().split("T")[0],
      type: "Travail",
      heure_debut: "09:00",
      heure_fin: "18:00",
      pause_minutes: 60,
      notes: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const estTravail = ["Travail", "Télétravail", "Formation"].includes(form.type);

  const handleSubmit = async () => {
    if (!form.employe_id || !form.date) { setError("Employé et date sont obligatoires."); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const duree = estTravail ? dureeMinutes(form.heure_debut, form.heure_fin, form.pause_minutes) : null;
      const payload = { ...form, user_id: user.id, duree_minutes: duree };
      let err;
      if (form.id) {
        ({ error: err } = await supabasePro.from("pointages").update(payload).eq("id", form.id));
      } else {
        ({ error: err } = await supabasePro.from("pointages").insert([payload]));
      }
      if (err) throw err;
      onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, width: "100%", maxWidth: 520, overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "22px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: "#EDE8DB" }}>
            {form.id ? "Modifier le pointage" : "Saisir un pointage"}
          </h2>
          <button onClick={onClose} style={btnIcon}><Icon.Close /></button>
        </div>
        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Employé */}
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Collaborateur *</Label>
            <select value={form.employe_id} onChange={e => set("employe_id", e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              {employes.map(e => (
                <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
              ))}
            </select>
          </div>
          {/* Date */}
          <div>
            <Label>Date *</Label>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} />
          </div>
          {/* Type */}
          <div>
            <Label>Type</Label>
            <select value={form.type} onChange={e => set("type", e.target.value)} style={inputStyle}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          {/* Horaires (uniquement si travail) */}
          {estTravail && (
            <>
              <div>
                <Label>Heure de début</Label>
                <input type="time" value={form.heure_debut} onChange={e => set("heure_debut", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <Label>Heure de fin</Label>
                <input type="time" value={form.heure_fin} onChange={e => set("heure_fin", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <Label>Pause (minutes)</Label>
                <input type="number" min="0" max="240" value={form.pause_minutes} onChange={e => set("pause_minutes", e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                <div style={{ background: "rgba(91,163,199,0.08)", border: "1px solid #bae6fd", borderRadius: 8, padding: "8px 14px", fontSize: 14, fontWeight: 700, color: "#5BA3C7" }}>
                  ≈ {dureeHeures(form.heure_debut, form.heure_fin)} travaillées
                </div>
              </div>
            </>
          )}
          {/* Notes */}
          <div style={{ gridColumn: "1/-1" }}>
            <Label>Notes</Label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical", width: "100%", boxSizing: "border-box" }} placeholder="Commentaire optionnel..." />
          </div>
          {error && (
            <div style={{ gridColumn: "1/-1", color: "#C75B4E", fontSize: 13, background: "rgba(199,91,78,0.08)", padding: "8px 12px", borderRadius: 8 }}>{error}</div>
          )}
          <div style={{ gridColumn: "1/-1", display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={btnSecondary}>Annuler</button>
            <button onClick={handleSubmit} disabled={saving} style={btnPrimary}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────
export default function PointagesPro() {
  const [pointages, setPointages] = useState([]);
  const [employes, setEmployes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  // Filtres
  const today = new Date();
  const [mois, setMois] = useState(today.getMonth());
  const [annee, setAnnee] = useState(today.getFullYear());
  const [filtreEmploye, setFiltreEmploye] = useState("Tous");
  const [filtreType, setFiltreType] = useState("Tous");
  const [vueMode, setVueMode] = useState("liste"); // "liste" | "recap"

  const fetchAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabasePro.auth.getUser();

    const debut = new Date(annee, mois, 1).toISOString().split("T")[0];
    const fin = new Date(annee, mois + 1, 0).toISOString().split("T")[0];

    const [{ data: pts }, { data: emps }] = await Promise.all([
      supabasePro.from("pointages").select("*").eq("user_id", user.id).gte("date", debut).lte("date", fin).order("date", { ascending: false }),
      supabasePro.from("equipe").select("id, prenom, nom").eq("user_id", user.id).order("nom"),
    ]);

    setPointages(pts || []);
    setEmployes(emps || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [mois, annee]);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce pointage ?")) return;
    await supabasePro.from("pointages").delete().eq("id", id);
    fetchAll();
  };

  const nomEmploye = (id) => {
    const e = employes.find(e => e.id === id);
    return e ? `${e.prenom} ${e.nom}` : "—";
  };

  const naviguerMois = (delta) => {
    let m = mois + delta;
    let a = annee;
    if (m < 0) { m = 11; a--; }
    if (m > 11) { m = 0; a++; }
    setMois(m); setAnnee(a);
  };

  const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

  const filtered = pointages.filter(p => {
    const matchEmp = filtreEmploye === "Tous" || p.employe_id === filtreEmploye;
    const matchType = filtreType === "Tous" || p.type === filtreType;
    return matchEmp && matchType;
  });

  // Stats du mois
  const totalMinutes = filtered.filter(p => p.duree_minutes).reduce((s, p) => s + p.duree_minutes, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;
  const joursConge = filtered.filter(p => p.type === "Congé payé").length;
  const joursMaladie = filtered.filter(p => p.type === "Maladie").length;

  // Récap par employé
  const recapParEmploye = employes.map(emp => {
    const pts = filtered.filter(p => p.employe_id === emp.id);
    const mins = pts.filter(p => p.duree_minutes).reduce((s, p) => s + p.duree_minutes, 0);
    const conges = pts.filter(p => p.type === "Congé payé").length;
    const maladies = pts.filter(p => p.type === "Maladie").length;
    const jours = pts.length;
    return { ...emp, mins, conges, maladies, jours };
  }).filter(e => e.jours > 0);

  const exportCSV = () => {
    const headers = ["Date","Employé","Type","Début","Fin","Pause (min)","Durée","Notes"];
    const rows = filtered.map(p => [
      p.date, nomEmploye(p.employe_id), p.type,
      formatHeure(p.heure_debut), formatHeure(p.heure_fin),
      p.pause_minutes || "", p.duree_minutes ? `${Math.floor(p.duree_minutes/60)}h${String(p.duree_minutes%60).padStart(2,"0")}` : "",
      p.notes || ""
    ]);
    const csv = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `pointages_${MOIS_FR[mois]}_${annee}.csv`; a.click();
  };

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto", fontFamily: "'Outfit', 'Segoe UI', sans-serif" }}>
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#EDE8DB" }}>Pointages</h1>
          <p style={{ margin: "4px 0 0", color: "rgba(237,232,219,0.4)", fontSize: 14 }}>Suivi des présences, absences et congés</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={exportCSV} style={btnSecondary}><Icon.Download /> Export CSV</button>
          <button onClick={() => setModal("new")} style={btnPrimary} disabled={employes.length === 0}>
            <Icon.Plus /> Saisir un pointage
          </button>
        </div>
      </div>

      {employes.length === 0 && (
        <div style={{ background: "rgba(212,168,83,0.08)", border: "1px solid rgba(212,168,83,0.3)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 14, color: "#D4A853" }}>
          ⚠️ Aucun membre dans l'équipe. Ajoutez d'abord des collaborateurs dans le module <strong>Équipe</strong>.
        </div>
      )}

      {/* Navigation mois */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={() => naviguerMois(-1)} style={btnIcon}><Icon.ChevronLeft /></button>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#EDE8DB", minWidth: 180, textAlign: "center" }}>
          {MOIS_FR[mois]} {annee}
        </span>
        <button onClick={() => naviguerMois(1)} style={btnIcon}><Icon.ChevronRight /></button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Pointages saisis", value: filtered.length, color: "#5BA3C7" },
          { label: "Heures travaillées", value: `${totalH}h${String(totalM).padStart(2,"0")}`, color: "#5BC78A" },
          { label: "Jours de congé", value: joursConge, color: "#f59e0b" },
          { label: "Jours maladie", value: joursMaladie, color: "#ef4444" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 13, color: "rgba(237,232,219,0.4)", marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres + basculement vue */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={filtreEmploye} onChange={e => setFiltreEmploye(e.target.value)} style={{ ...inputStyle, minWidth: 180 }}>
          <option value="Tous">Tous les collaborateurs</option>
          {employes.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
        </select>
        <select value={filtreType} onChange={e => setFiltreType(e.target.value)} style={{ ...inputStyle, minWidth: 160 }}>
          <option value="Tous">Tous les types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["liste", "recap"].map(m => (
            <button key={m} onClick={() => setVueMode(m)} style={{
              ...btnSecondary, padding: "8px 14px", fontSize: 13,
              background: vueMode === m ? "#5BA3C7" : "rgba(255,255,255,0.04)",
              color: vueMode === m ? "rgba(255,255,255,0.04)" : "#EDE8DB",
              borderColor: vueMode === m ? "#5BA3C7" : "rgba(255,255,255,0.1)",
            }}>
              {m === "liste" ? "Liste" : "Récapitulatif"}
            </button>
          ))}
        </div>
      </div>

      {/* LISTE */}
      {vueMode === "liste" && (
        loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(237,232,219,0.4)" }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(237,232,219,0.4)", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "2px dashed rgba(255,255,255,0.1)" }}>
            <Icon.Clock />
            <p style={{ marginTop: 12 }}>Aucun pointage pour cette période.</p>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Date","Collaborateur","Type","Horaires","Durée","Notes",""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "rgba(237,232,219,0.4)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const color = TYPE_COLOR[p.type] || "rgba(237,232,219,0.4)";
                  const duree = p.duree_minutes ? `${Math.floor(p.duree_minutes/60)}h${String(p.duree_minutes%60).padStart(2,"0")}` : "—";
                  const horaires = p.heure_debut ? `${formatHeure(p.heure_debut)} → ${formatHeure(p.heure_fin)}` : "—";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)" }}>
                      <td style={{ padding: "10px 14px", fontSize: 14, color: "#EDE8DB", fontWeight: 600 }}>
                        {new Date(p.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 14, color: "#EDE8DB" }}>{nomEmploye(p.employe_id)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: color + "18", color }}>
                          {p.type}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "rgba(237,232,219,0.4)", fontFamily: "monospace" }}>{horaires}</td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: "#EDE8DB" }}>{duree}</td>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "rgba(237,232,219,0.4)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.notes || "—"}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setModal(p)} style={btnIcon}><Icon.Edit /></button>
                          <button onClick={() => handleDelete(p.id)} style={{ ...btnIcon, color: "#ef4444" }}><Icon.Trash /></button>
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

      {/* RÉCAPITULATIF */}
      {vueMode === "recap" && (
        <div>
          {recapParEmploye.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "rgba(237,232,219,0.4)", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "2px dashed rgba(255,255,255,0.1)" }}>
              Aucune donnée pour cette période.
            </div>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Collaborateur","Jours pointés","Heures travaillées","Congés payés","Maladie"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "rgba(237,232,219,0.4)", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recapParEmploye.map((e, i) => {
                    const h = Math.floor(e.mins / 60);
                    const m = e.mins % 60;
                    return (
                      <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.04)", fontWeight: 700, fontSize: 13 }}>
                              {(e.prenom[0] + e.nom[0]).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: "#EDE8DB" }}>{e.prenom} {e.nom}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "#EDE8DB" }}>{e.jours} j</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#5BC78A" }}>
                          {e.mins > 0 ? `${h}h${String(m).padStart(2,"0")}` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", color: e.conges > 0 ? "#f59e0b" : "rgba(237,232,219,0.4)", fontWeight: e.conges > 0 ? 700 : 400 }}>
                          {e.conges > 0 ? `${e.conges} j` : "—"}
                        </td>
                        <td style={{ padding: "12px 16px", color: e.maladies > 0 ? "#ef4444" : "rgba(237,232,219,0.4)", fontWeight: e.maladies > 0 ? 700 : 400 }}>
                          {e.maladies > 0 ? `${e.maladies} j` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <PointageModal
          pointage={modal === "new" ? null : modal}
          employes={employes}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchAll(); }}
        />
      )}
    </div>
  );
}

// ─── Helpers UI ───────────────────────────────────────────────────────
function Label({ children }) {
  return <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "rgba(237,232,219,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</label>;
}

const inputStyle = {
  padding: "8px 12px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
  fontSize: 14, color: "#EDE8DB", background: "rgba(255,255,255,0.04)", outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const btnPrimary = {
  display: "flex", alignItems: "center", gap: 6,
  background: "#5BA3C7", color: "rgba(255,255,255,0.04)", border: "none",
  padding: "9px 18px", borderRadius: 8, fontWeight: 600,
  fontSize: 14, cursor: "pointer", fontFamily: "inherit",
};
const btnSecondary = {
  display: "flex", alignItems: "center", gap: 6,
  background: "rgba(255,255,255,0.04)", color: "#EDE8DB", border: "1px solid rgba(255,255,255,0.08)",
  padding: "9px 16px", borderRadius: 8, fontWeight: 600,
  fontSize: 14, cursor: "pointer", fontFamily: "inherit",
};
const btnIcon = {
  background: "none", border: "none", cursor: "pointer", color: "rgba(237,232,219,0.4)",
  padding: 5, borderRadius: 6, display: "flex",
};
