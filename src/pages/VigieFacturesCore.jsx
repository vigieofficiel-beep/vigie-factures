import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  FileText, AlertTriangle, TrendingUp, Calendar, Search, Filter,
  Eye, X, Bell, RefreshCw, Upload, CheckCircle, Clock, Trash2,
  ArrowUpRight, ArrowDownRight, Loader, Plus, LayoutDashboard,
  UploadCloud, Download, Wallet, FileBarChart
} from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { supabasePro } from "../lib/supabasePro";
import { StatusBadge } from '../components/StatusBadge';
import { useInvoiceStatus } from '../hooks/useInvoiceStatus';
import { useQuota, QUOTA_LIMITS } from '../hooks/useQuota';
import { QuotaBar } from '../components/QuotaBar';
import { useInvoiceFilters } from '../hooks/useInvoiceFilters';
import { FilterBar } from '../components/FilterBar';
import { RemindersLog } from '../components/RemindersLog';
import { exportCSVExpert } from '../utils/exportCSV';
import { exportZIP } from '../utils/exportZIP';
import { useFolders } from '../hooks/useFolders';
import { FolderTree } from '../components/FolderTree';

// ═══ CONFIG ═══
const ANALYZE_API = "/api/analyze";
const COLORS = ["#D4A853","#C75B4E","#5BA3C7","#5BC78A","#A85BC7","#C78A5B","#5BC7B8","#C75BA8"];
const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
const getSb = (context) => context === "pro" ? supabasePro : supabase;

const BUDGET_CATEGORIES = {
  "Logement":     { color: "#5BA3C7", keywords: ["loyer","immobilier","habitation","logement","eau","edf","engie","électricité","gaz","chauffage"] },
  "Transport":    { color: "#5BC78A", keywords: ["transport","essence","carburant","sncf","ratp","uber","taxi","parking","autoroute","péage"] },
  "Alimentation": { color: "#D4A853", keywords: ["alimentaire","restaurant","supermarché","courses","épicerie","boulangerie"] },
  "Télécom":      { color: "#A85BC7", keywords: ["télécom","mobile","internet","free","orange","sfr","bouygues","fibre","forfait"] },
  "Santé":        { color: "#C75B4E", keywords: ["santé","médecin","pharmacie","mutuelle","dentiste","opticien","hôpital"] },
  "Assurance":    { color: "#C78A5B", keywords: ["assurance","axa","maif","macif","allianz","groupama"] },
  "Loisirs":      { color: "#5BC7B8", keywords: ["loisir","sport","cinéma","netflix","spotify","abonnement","média","streaming"] },
  "Divers":       { color: "#888",    keywords: [] },
};

// ═══ HELPERS ═══
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

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractTextFromFile(file) {
  if (file.type === "application/pdf") return fileToBase64(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}



// ═══ SUB-COMPONENTS ═══

function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position:"absolute", top:-30, right:-30, width:80, height:80, borderRadius:"50%", background:`${color}08` }} />
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <div style={{ width:30, height:30, borderRadius:7, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:1, textTransform:"uppercase", fontWeight:600 }}>{label}</span>
      </div>
      <div style={{ fontSize:22, fontWeight:700, color:"#EDE8DB", fontFamily:"'Cormorant Garamond', serif" }}>{value}</div>
      {sub && (
        <div style={{ fontSize:10, color: trend==="up"?"#C75B4E": trend==="down"?"#5BC78A":"rgba(255,255,255,0.3)", display:"flex", alignItems:"center", gap:3, marginTop:3 }}>
          {trend==="up" && <ArrowUpRight size={11} />}
          {trend==="down" && <ArrowDownRight size={11} />}
          {sub}
        </div>
      )}
    </div>
  );
}

function FileItem({ file, onRemove }) {
  const sc = { pending:"rgba(255,255,255,0.3)", processing:"#D4A853", done:"#5BC78A", error:"#C75B4E" };
  const SI = { pending:Clock, processing:Loader, done:CheckCircle, error:AlertTriangle }[file.status];
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
      background: file.status==="processing" ? "rgba(212,168,83,0.06)" : "rgba(255,255,255,0.02)",
      border:`1px solid ${file.status==="processing"?"rgba(212,168,83,0.2)":file.status==="error"?"rgba(199,91,78,0.2)":file.status==="done"?"rgba(91,199,138,0.15)":"rgba(255,255,255,0.05)"}`,
      borderRadius:10,
    }}>
      <div style={{ width:34, height:34, borderRadius:7, background:file.status==="done"?"rgba(91,199,138,0.1)":"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <FileText size={16} color={file.status==="done"?"#5BC78A":"rgba(255,255,255,0.4)"} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, color:"#EDE8DB", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</div>
        <div style={{ fontSize:10, color:sc[file.status], marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
          <SI size={11} style={file.status==="processing"?{animation:"spin 1s linear infinite"}:{}} />
          {file.status==="pending" && "En attente"}
          {file.status==="processing" && "Analyse en cours..."}
          {file.status==="done" && `✓ ${file.result?.extraction?.provider||"Analysé"} — ${formatEuro(file.result?.extraction?.amount_ttc)}`}
          {file.status==="error" && (file.errorMsg||"Erreur")}
        </div>
      </div>
      {(file.status==="pending"||file.status==="error") && (
        <button onClick={() => onRemove(file.id)} style={{ background:"none", border:"none", cursor:"pointer", padding:4, color:"rgba(255,255,255,0.2)" }}>
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

function InvoiceModal({ inv, onClose }) {
  if (!inv) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", padding:16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#161513", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"24px 28px", width:"100%", maxWidth:460, maxHeight:"80vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ color:"#EDE8DB", fontFamily:"'Cormorant Garamond', serif", fontSize:20, margin:0 }}>Détails de la facture</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><X size={16} color="rgba(255,255,255,0.3)" /></button>
        </div>
        {[
          ["Numéro", inv.invoice_number],
          ["Fournisseur", inv.provider],
          ["Date", formatDate(inv.invoice_date)],
          ["Montant HT", formatEuro(inv.amount_ht)],
          ["TVA", `${formatEuro(inv.tax)} (${inv.tax_rate||"—"}%)`],
          ["Montant TTC", formatEuro(inv.amount_ttc)],
          ["Catégorie", `${inv.category||"—"} / ${inv.subcategory||"—"}`],
          ["Fréquence", inv.frequency||"—"],
          ["Coût annuel", formatEuro(inv.total_year)],
          ["Anomalie", inv.has_anomaly ? `⚠️ ${inv.anomaly_explanation}` : "✅ Aucune"],
        ].map(([k, v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color:"rgba(255,255,255,0.35)", fontSize:11 }}>{k}</span>
            <span style={{ color:"#EDE8DB", fontSize:11, fontWeight:500, textAlign:"right", maxWidth:"60%" }}>{v||"—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#161513", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"6px 10px", fontSize:10 }}>
      <div style={{ color:"rgba(255,255,255,0.4)" }}>{payload[0]?.name||payload[0]?.payload?.name}</div>
      <div style={{ color:"#D4A853", fontWeight:700 }}>{formatEuro(payload[0]?.value)}</div>
    </div>
  );
}

// ═══ TAB NAV ═══
const TABS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "upload",    icon: UploadCloud,    label: "Analyser" },
  { id: "budget",    icon: Wallet,         label: "Budget" },
  { id: "report",    icon: FileBarChart,   label: "Rapport" },
];

// ═══ MAIN COMPONENT ═══
export default function VigieFacturesCore({ context = "perso", user }) {
  const sb = getSb(context);
  const { updateStatus } = useInvoiceStatus(sb);
  const { tree, create: createFolder, remove: deleteFolder, moveInvoice } = useFolders(sb, user?.id, context);
  const [activeFolder, setActiveFolder] = useState(null);
  const { filters, update: updateFilter, reset: resetFilters, applyToData } = useInvoiceFilters();
  const { quota, limits, ocrPct, storagePct, canUpload, refresh: refreshQuota } = useQuota(sb, user?.id);
  const [tab, setTab] = useState("dashboard");
  const [files, setFiles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const nextId = useRef(0);

  // Quota display
  const quotaPct = Math.min(((quota?.ocr_month ?? 0) / limits.ocr) * 100, 100);
  const quotaAlert = (quota?.ocr_month ?? 0) >= limits.ocr * 0.9;

  // ═══ FETCH ═══
  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await sb
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .eq("context", context)
        .order("processed_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setInvoices(data ?? []);
    } catch (e) {
      console.error("fetchInvoices error:", e);
    } finally {
      setLoading(false);
    }
  }, [user, context, sb]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // ═══ FILE MANAGEMENT ═══
  const addFiles = useCallback((newFiles) => {
    const fileObjs = Array.from(newFiles)
      .filter(f => f.type === "application/pdf" || f.type.startsWith("text/") || f.type.startsWith("image/"))
      .map(f => ({ id: nextId.current++, file: f, name: f.name, status: "pending", result: null, errorMsg: null }));
    setFiles(prev => [...prev, ...fileObjs]);
  }, []);

  const removeFile = useCallback((id) => setFiles(prev => prev.filter(f => f.id !== id)), []);

  const processAll = useCallback(async () => {
    if ((quota?.ocr_month ?? 0) >= limits.ocr) return;
    setIsProcessing(true);
    const pending = files.filter(f => f.status === "pending" || f.status === "error");
    for (const fileObj of pending) {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "processing" } : f));
      try {
        const file = fileObj.file;
        let body;
        if (file.type === "application/pdf" || file.type.startsWith("image/")) {
          const fileBase64 = await fileToBase64(file);
          body = JSON.stringify({ fileBase64, fileType: file.type, user_id: user?.id, context });
        } else {
          const text = await extractTextFromFile(file);
          body = JSON.stringify({ text, user_id: user?.id, context });
        }
        const response = await fetch(ANALYZE_API, { method: "POST", headers: { "Content-Type": "application/json" }, body });
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
}, [files, fetchInvoices, user, context]);
  // ═══ COMPUTED ═══
const filtered = useMemo(() => {
  const byFolder = activeFolder
    ? invoices.filter(i => i.folder_id === activeFolder)
    : invoices;
  return applyToData(byFolder);
}, [invoices, applyToData, activeFolder]);
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

  // ═══ RENDER ═══
  return (
    <div style={{ minHeight: "100%", background: "#0E0D0B", color: "#EDE8DB", fontFamily: "'Nunito Sans', sans-serif" }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:3px; }
        input[type="file"] { display:none; }
      `}</style>

      {/* ── TAB BAR ── */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        gap: 4,
        background: "rgba(0,0,0,0.2)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        {TABS.map(t => {
          const isActive = tab === t.id;
          const badge = t.id === "upload" && pendingCount > 0 ? pendingCount : null;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "14px 16px",
                background: "none", border: "none", cursor: "pointer",
                color: isActive ? "#D4A853" : "rgba(255,255,255,0.35)",
                fontSize: 12, fontWeight: isActive ? 700 : 400,
                fontFamily: "'Nunito Sans', sans-serif",
                borderBottom: isActive ? "2px solid #D4A853" : "2px solid transparent",
                transition: "all 150ms ease",
                position: "relative",
              }}
            >
              <t.icon size={14} />
              {t.label}
              {badge && (
                <span style={{ background:"#D4A853", color:"#0E0D0B", borderRadius:10, padding:"1px 6px", fontSize:9, fontWeight:700 }}>{badge}</span>
              )}
            </button>
          );
        })}
<div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8, padding:'8px 0' }}>
  <RemindersLog sb={sb} userId={user?.id} context={context} />
</div>
        {/* Quota bar — à droite */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: quotaAlert ? "#C75B4E" : "rgba(255,255,255,0.25)", letterSpacing: 0.8, marginBottom: 3 }}>
              {quotaAlert ? "⚠️ " : ""}{(quota?.ocr_month ?? 0)}/{limits.ocr} factures
            </div>
            <div style={{ width: 100, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${quotaPct}%`,
                background: quotaAlert ? "#C75B4E" : quotaPct > 60 ? "#D4A853" : "#5BC78A",
                borderRadius: 2, transition: "width 0.5s",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "28px 28px 48px" }}>

        {/* ════ DASHBOARD TAB ════ */}
        {tab === "dashboard" && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:10 }}>
              <div>
                <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:700, marginBottom:3 }}>Dashboard</h2>
                <p style={{ color:"rgba(255,255,255,0.25)", fontSize:11 }}>Vue d'ensemble de vos factures</p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
<button onClick={() => exportCSVExpert(filtered, `vigie-${context}`)} style={{ background:"rgba(91,199,138,0.08)", border:"1px solid rgba(91,199,138,0.2)", borderRadius:7, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"#5BC78A", fontSize:11, fontFamily:"'Nunito Sans', sans-serif" }}>                  <Download size={12} /> Export CSV
                </button>
                <button onClick={() => exportZIP(filtered, sb, `vigie-${context}`)} style={{ background:"rgba(212,168,83,0.08)", border:"1px solid rgba(212,168,83,0.2)", borderRadius:7, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"#D4A853", fontSize:11, fontFamily:"'Nunito Sans', sans-serif" }}>
  <Download size={12} /> Export ZIP
</button>
                <button onClick={fetchInvoices} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"7px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, color:"rgba(255,255,255,0.4)", fontSize:11, fontFamily:"'Nunito Sans', sans-serif" }}>
                  <RefreshCw size={12} /> Actualiser
                </button>
              </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
                {alerts.map((a, i) => (
                  <div key={i} style={{ background:"rgba(199,91,78,0.06)", border:"1px solid rgba(199,91,78,0.15)", borderRadius:9, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, animation:"slideIn 0.3s ease-out", flexWrap:"wrap" }}>
                    <AlertTriangle size={14} color="#C75B4E" />
                    <span style={{ color:"#C75B4E", fontWeight:600, fontSize:11 }}>{a.provider}</span>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>— {a.explanation}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12, marginBottom:24 }}>
              <StatCard icon={FileText}      label="Factures"    value={stats.count}               sub={`${stats.providers} fournisseur${stats.providers>1?"s":""}`} color="#D4A853" />
              <StatCard icon={TrendingUp}    label="Total"       value={formatEuro(stats.total)}    sub={`${formatEuro(stats.totalYear)} est. annuel`} color="#5BA3C7" />
              <StatCard icon={AlertTriangle} label="Anomalies"   value={stats.anomalies}            sub={stats.anomalies>0?"À vérifier":"RAS"} color={stats.anomalies>0?"#C75B4E":"#5BC78A"} trend={stats.anomalies>0?"up":undefined} />
              <StatCard icon={Calendar}      label="Récurrents"  value={invoices.filter(i=>i.frequency==="mensuel").length} sub={`${formatEuro(invoices.filter(i=>i.frequency==="mensuel").reduce((s,i)=>s+(i.amount_ttc||0),0))}/mois`} color="#A85BC7" />
            </div>

            {/* Charts */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:24 }}>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:14, padding:18 }}>
                <h3 style={{ color:"rgba(255,255,255,0.4)", fontSize:9, letterSpacing:1.5, marginBottom:14, fontWeight:600, textTransform:"uppercase" }}>Par fournisseur</h3>
                {pieData.length > 0 ? (
                  <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                    <ResponsiveContainer width="50%" height={160}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                      {pieData.map((d, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:10 }}>
                          <div style={{ width:7, height:7, borderRadius:2, background:COLORS[i%COLORS.length], flexShrink:0 }} />
                          <span style={{ color:"rgba(255,255,255,0.5)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:90 }}>{d.name}</span>
                          <span style={{ color:COLORS[i%COLORS.length], fontWeight:600, marginLeft:"auto" }}>{formatEuro(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ color:"rgba(255,255,255,0.15)", textAlign:"center", padding:36, fontSize:11 }}>Aucune donnée</div>
                )}
              </div>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:14, padding:18 }}>
                <h3 style={{ color:"rgba(255,255,255,0.4)", fontSize:9, letterSpacing:1.5, marginBottom:14, fontWeight:600, textTransform:"uppercase" }}>Par mois</h3>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill:"rgba(255,255,255,0.3)", fontSize:9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:"rgba(255,255,255,0.3)", fontSize:9 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" radius={[4,4,0,0]}>
                        {barData.map((_, i) => <Cell key={i} fill={`rgba(212,168,83,${0.35+(i/barData.length)*0.65})`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ color:"rgba(255,255,255,0.15)", textAlign:"center", padding:36, fontSize:11 }}>Aucune donnée</div>
                )}
              </div>
            </div>
<FolderTree
  tree={tree}
  activeFolder={activeFolder}
  onSelect={setActiveFolder}
  onCreate={createFolder}
  onDelete={deleteFolder}
  onDrop={async (invoiceId, folderId) => {
    await moveInvoice(invoiceId, folderId);
    fetchInvoices();
  }}
/>
            <FilterBar
  filters={filters}
  onUpdate={updateFilter}
  onReset={resetFilters}
  resultCount={filtered.length}
/>


            {/* Table */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:14, overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table style={{ borderCollapse:"collapse", width:"100%", minWidth:600 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                      {["N°","Fournisseur","TTC","Date","Fréq.","Catégorie","Statut paiement","Anomalie" ,""].map(h => (
                        <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:9, fontWeight:600, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? <tr><td colSpan={8} style={{ padding:36, textAlign:"center", color:"rgba(255,255,255,0.15)", fontSize:11 }}>Chargement...</td></tr>
                      : filtered.length === 0
                        ? <tr><td colSpan={8} style={{ padding:36, textAlign:"center", color:"rgba(255,255,255,0.15)", fontSize:11 }}>
                            {invoices.length === 0 ? "Aucune facture — commencez par analyser vos documents" : "Aucun résultat pour cette recherche"}
                          </td></tr>
                        : filtered.map((inv, i) => {
                          const cat = getBudgetCategory(inv);
                          const catColor = BUDGET_CATEGORIES[cat]?.color || "#888";
                          return (
                            <tr key={inv.id||i} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)", cursor:"pointer" }}
                              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                              onMouseLeave={e => e.currentTarget.style.background="transparent"}
                              onClick={() => setSelectedInv(inv)}
                              draggable
onDragStart={e => e.dataTransfer.setData('invoiceId', inv.id)}
                            >
                              <td style={{ padding:"10px 12px", color:"#EDE8DB", fontSize:11, fontWeight:500 }}>{inv.invoice_number||"—"}</td>
                              <td style={{ padding:"10px 12px", color:"rgba(255,255,255,0.6)", fontSize:11 }}>{inv.provider||"—"}</td>
                              <td style={{ padding:"10px 12px", color:"#D4A853", fontSize:11, fontWeight:600 }}>{formatEuro(inv.amount_ttc)}</td>
                              <td style={{ padding:"10px 12px", color:"rgba(255,255,255,0.4)", fontSize:11 }}>{formatDate(inv.invoice_date)}</td>
                              <td style={{ padding:"10px 12px" }}>
                                <span style={{ padding:"2px 7px", borderRadius:10, fontSize:9, fontWeight:600, background:inv.frequency==="mensuel"?"rgba(91,163,199,0.12)":"rgba(255,255,255,0.05)", color:inv.frequency==="mensuel"?"#5BA3C7":"rgba(255,255,255,0.4)" }}>{inv.frequency||"—"}</span>
                              </td>
                              <td style={{ padding:"10px 12px" }}>
                                <span style={{ background:`${catColor}18`, color:catColor, padding:"2px 8px", borderRadius:10, fontSize:9, fontWeight:600 }}>{cat}</span>
                              </td>
                              
                              <td style={{ padding:"10px 12px" }}>
                                {inv.has_anomaly
                                  ? <span style={{ color:"#C75B4E", fontSize:10, fontWeight:600, display:"flex", alignItems:"center", gap:3 }}><AlertTriangle size={11} /> Anomalie</span>
                                  : <span style={{ color:"rgba(91,199,138,0.6)", fontSize:10 }}>✓ OK</span>
                                }
                              </td>
                              <td style={{ padding:"10px 6px" }}><Eye size={12} color="rgba(255,255,255,0.2)" /></td>
                            </tr>
                          );
                        })
                    }
                  </tbody>
                </table>
              </div>
              <div style={{ padding:"8px 12px", borderTop:"1px solid rgba(255,255,255,0.04)", display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"rgba(255,255,255,0.2)", fontSize:10 }}>{filtered.length} facture{filtered.length>1?"s":""}</span>
                <span style={{ color:"rgba(255,255,255,0.2)", fontSize:10 }}>Total : {formatEuro(filtered.reduce((s,i)=>s+(i.amount_ttc||0),0))}</span>
              </div>
            </div>
          </>
        )}

        {/* ════ UPLOAD TAB ════ */}
        {tab === "upload" && (
          <div style={{ maxWidth:640, margin:"0 auto" }}>
            <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:700, marginBottom:6 }}>Analyser des factures</h2>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, marginBottom:28 }}>Glissez vos fichiers ou cliquez pour les ajouter.</p>

            {/* Quota bars */}
<div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginBottom:10, textTransform:'uppercase', letterSpacing:1 }}>
    Utilisation — Plan {quota?.plan ?? 'free'}
  </div>
  <QuotaBar label="Analyses ce mois" used={quota?.ocr_month ?? 0} max={limits.ocr} unit=" analyses" />
  <QuotaBar label="Stockage utilisé" used={Math.round((quota?.storage_bytes ?? 0) / (1024*1024))} max={limits.storageMb} unit=" Mo" />
</div>

{(quota?.ocr_month ?? 0) >= limits.ocr ? (
  <div style={{ background:"rgba(199,91,78,0.06)", border:"1px solid rgba(199,91,78,0.2)", borderRadius:14, padding:"32px", textAlign:"center" }}>
    <AlertTriangle size={32} color="#C75B4E" style={{ margin:"0 auto 12px" }} />
    <div style={{ color:"#C75B4E", fontSize:14, fontWeight:600, marginBottom:8 }}>Quota mensuel atteint</div>
    <div style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>Vous avez analysé {limits.ocr} factures ce mois. Revenez le mois prochain ou contactez-nous.</div>
  </div>
) : (
  <>
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border:`2px dashed ${dragOver?"rgba(212,168,83,0.6)":"rgba(255,255,255,0.1)"}`,
        borderRadius:14, padding:"40px 24px", textAlign:"center", cursor:"pointer",
        background:dragOver?"rgba(212,168,83,0.04)":"rgba(255,255,255,0.01)", marginBottom:20,
        transition:"all 200ms ease",
      }}
    >
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.png,.jpg,.jpeg" onChange={e => { addFiles(e.target.files); e.target.value=""; }} />
      <Upload size={32} color={dragOver?"#D4A853":"rgba(255,255,255,0.2)"} style={{ marginBottom:12, display:"block", margin:"0 auto 12px" }} />
      <div style={{ color:dragOver?"#D4A853":"rgba(255,255,255,0.5)", fontSize:14, fontWeight:500, marginBottom:6 }}>
        {dragOver ? "Lâchez ici !" : "Glissez vos factures"}
      </div>
      <div style={{ color:"rgba(255,255,255,0.25)", fontSize:11 }}>ou cliquez pour parcourir • PDF, images, texte</div>
    </div>

    {files.length > 0 && (
      <>
        <button onClick={() => fileInputRef.current?.click()} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", borderRadius:7, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)", fontSize:11, cursor:"pointer", marginBottom:14, fontFamily:"'Nunito Sans', sans-serif" }}>
          <Plus size={12} /> Ajouter d'autres factures
        </button>
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:20 }}>
          {files.map(f => <FileItem key={f.id} file={f} onRemove={removeFile} />)}
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <button
            onClick={processAll}
            disabled={isProcessing || pendingCount === 0}
            style={{
              flex:1, minWidth:200, padding:"12px 20px", borderRadius:10, border:"none",
              background:isProcessing?"rgba(212,168,83,0.15)":pendingCount===0?"rgba(255,255,255,0.05)":"linear-gradient(135deg, #D4A853, #C78A5B)",
              color:isProcessing?"#D4A853":pendingCount===0?"rgba(255,255,255,0.3)":"#0E0D0B",
              fontSize:13, fontWeight:700, cursor:isProcessing||pendingCount===0?"not-allowed":"pointer",
              fontFamily:"'Nunito Sans', sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            }}
          >
            {isProcessing ? <><Loader size={14} style={{ animation:"spin 1s linear infinite" }} /> Analyse en cours...</>
              : pendingCount===0 ? <><CheckCircle size={14} /> Toutes analysées !</>
              : <><UploadCloud size={14} /> Analyser {pendingCount} facture{pendingCount>1?"s":""}</>
            }
          </button>
          {doneCount > 0 && (
            <button onClick={() => setTab("dashboard")} style={{ padding:"12px 16px", borderRadius:10, border:"1px solid rgba(91,199,138,0.3)", background:"rgba(91,199,138,0.08)", color:"#5BC78A", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Nunito Sans', sans-serif", display:"flex", alignItems:"center", gap:6 }}>
              <LayoutDashboard size={13} /> Voir le dashboard
            </button>
          )}
        </div>
      </>
    )}
  </>
)}
        </div>
      )}

      {/* ════ BUDGET TAB ════ */}
        {tab === "budget" && (() => {
          const budgetData = {};
          invoices.forEach(inv => {
            const cat = getBudgetCategory(inv);
            if (!budgetData[cat]) budgetData[cat] = { total:0, yearly:0, count:0, invoices:[] };
            budgetData[cat].total += inv.amount_ttc || 0;
            budgetData[cat].yearly += inv.total_year || inv.amount_ttc || 0;
            budgetData[cat].count++;
            budgetData[cat].invoices.push(inv);
          });
          const sortedCats = Object.entries(budgetData).sort(([,a],[,b]) => b.total - a.total);
          const grandTotal = sortedCats.reduce((s,[,d]) => s+d.total, 0);
          const grandYearly = sortedCats.reduce((s,[,d]) => s+d.yearly, 0);

          return (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:10 }}>
                <div>
                  <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:700, marginBottom:3 }}>Budget</h2>
                  <p style={{ color:"rgba(255,255,255,0.25)", fontSize:11 }}>Répartition de vos dépenses par catégorie</p>
                </div>
                <div style={{ background:"rgba(212,168,83,0.08)", border:"1px solid rgba(212,168,83,0.15)", borderRadius:10, padding:"10px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:1, marginBottom:3 }}>Estimation annuelle</div>
                  <div style={{ fontSize:20, fontWeight:700, color:"#D4A853", fontFamily:"'Cormorant Garamond', serif" }}>{formatEuro(grandYearly)}</div>
                </div>
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:14, padding:20, marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap", justifyContent:"center" }}>
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie data={sortedCats.map(([name,d]) => ({ name, value:d.total }))} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value">
                        {sortedCats.map(([cat],i) => <Cell key={i} fill={BUDGET_CATEGORIES[cat]?.color||"#888"} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {sortedCats.map(([cat, d]) => {
                      const pct = grandTotal>0 ? Math.round((d.total/grandTotal)*100) : 0;
                      const color = BUDGET_CATEGORIES[cat]?.color||"#888";
                      return (
                        <div key={cat} style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:10, height:10, borderRadius:3, background:color, flexShrink:0 }} />
                          <span style={{ color:"rgba(255,255,255,0.6)", fontSize:12, minWidth:90 }}>{cat}</span>
                          <span style={{ color, fontSize:12, fontWeight:600, minWidth:70, textAlign:"right" }}>{formatEuro(d.total)}</span>
                          <span style={{ color:"rgba(255,255,255,0.25)", fontSize:10, minWidth:35, textAlign:"right" }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:12 }}>
                {sortedCats.map(([cat, d]) => {
                  const color = BUDGET_CATEGORIES[cat]?.color||"#888";
                  const pct = grandTotal>0 ? Math.round((d.total/grandTotal)*100) : 0;
                  return (
                    <div key={cat} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:"16px 18px", borderLeft:`3px solid ${color}` }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <span style={{ color:"#EDE8DB", fontSize:14, fontWeight:600 }}>{cat}</span>
                        <span style={{ background:`${color}18`, color, padding:"2px 8px", borderRadius:10, fontSize:10, fontWeight:600 }}>{pct}%</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>Total factures</div>
                          <div style={{ fontSize:18, fontWeight:700, color, fontFamily:"'Cormorant Garamond', serif" }}>{formatEuro(d.total)}</div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>Est. annuel</div>
                          <div style={{ fontSize:14, fontWeight:600, color:"rgba(255,255,255,0.5)" }}>{formatEuro(d.yearly)}</div>
                        </div>
                      </div>
                      <div style={{ height:4, background:"rgba(255,255,255,0.04)", borderRadius:2, overflow:"hidden", marginBottom:10 }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2, transition:"width 0.5s" }} />
                      </div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>
                        {d.count} facture{d.count>1?"s":""} — {d.invoices.map(i=>i.provider).filter((v,i,a)=>a.indexOf(v)===i).join(", ")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* ════ REPORT TAB ════ */}
        {tab === "report" && (() => {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const monthInvoices = invoices.filter(i => {
            if (!i.invoice_date) return false;
            const d = new Date(i.invoice_date);
            return d.getMonth()===currentMonth && d.getFullYear()===currentYear;
          });
          const prevMonthInvoices = invoices.filter(i => {
            if (!i.invoice_date) return false;
            const d = new Date(i.invoice_date);
            const pm = currentMonth===0?11:currentMonth-1;
            const py = currentMonth===0?currentYear-1:currentYear;
            return d.getMonth()===pm && d.getFullYear()===py;
          });
          const monthTotal = monthInvoices.reduce((s,i)=>s+(i.amount_ttc||0),0);
          const prevTotal  = prevMonthInvoices.reduce((s,i)=>s+(i.amount_ttc||0),0);
          const variation  = prevTotal>0 ? ((monthTotal-prevTotal)/prevTotal)*100 : 0;
          const monthAnomalies = monthInvoices.filter(i=>i.has_anomaly);
          const recurring = invoices.filter(i=>i.frequency==="mensuel");
          const recurringTotal = recurring.reduce((s,i)=>s+(i.amount_ttc||0),0);
          const monthBudget = {};
          monthInvoices.forEach(inv => {
            const cat = getBudgetCategory(inv);
            monthBudget[cat] = (monthBudget[cat]||0) + (inv.amount_ttc||0);
          });
          const reportDate = `${MONTHS_FR[currentMonth]} ${currentYear}`;

          const printReport = () => {
            const w = window.open("","_blank");
            w.document.write(`<!DOCTYPE html><html><head><title>Rapport ${reportDate}</title>
            <style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#222;padding:0 20px}h1{color:#B8860B;border-bottom:2px solid #B8860B;padding-bottom:10px}table{width:100%;border-collapse:collapse;margin:15px 0}th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #eee;font-size:13px}th{background:#f5f0e8;color:#555;font-size:11px;text-transform:uppercase}.anomaly{color:#c0392b}.ok{color:#27ae60}</style>
            </head><body>
            <h1>Rapport mensuel — ${reportDate}</h1>
            <p>Total : ${formatEuro(monthTotal)} | Factures : ${monthInvoices.length} | Anomalies : ${monthAnomalies.length}</p>
            <table><tr><th>Fournisseur</th><th>Montant TTC</th><th>Date</th><th>Statut</th></tr>
            ${monthInvoices.map(i=>`<tr><td>${i.provider||"—"}</td><td>${formatEuro(i.amount_ttc)}</td><td>${formatDate(i.invoice_date)}</td><td class="${i.has_anomaly?"anomaly":"ok"}">${i.has_anomaly?"⚠️ Anomalie":"✅ OK"}</td></tr>`).join("")}
            </table></body></html>`);
            w.document.close(); w.print();
          };

          return (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:10 }}>
                <div>
                  <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:700, marginBottom:3 }}>Rapport mensuel</h2>
                  <p style={{ color:"rgba(255,255,255,0.25)", fontSize:11 }}>{reportDate} — {monthInvoices.length} facture{monthInvoices.length>1?"s":""} ce mois</p>
                </div>
                <button onClick={printReport} style={{ background:"linear-gradient(135deg, #D4A853, #C78A5B)", color:"#0E0D0B", border:"none", borderRadius:9, padding:"10px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Nunito Sans', sans-serif", display:"flex", alignItems:"center", gap:6 }}>
                  <Download size={13} /> Télécharger PDF
                </button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:12, marginBottom:24 }}>
                <StatCard icon={FileText}      label="Factures du mois" value={monthInvoices.length} color="#D4A853" />
                <StatCard icon={TrendingUp}    label="Total du mois"    value={formatEuro(monthTotal)} sub={`${variation>0?"+":""}${Math.round(variation)}% vs mois préc.`} color="#5BA3C7" trend={variation>5?"up":variation<-5?"down":undefined} />
                <StatCard icon={AlertTriangle} label="Anomalies"         value={monthAnomalies.length} sub={monthAnomalies.length>0?"À vérifier":"RAS"} color={monthAnomalies.length>0?"#C75B4E":"#5BC78A"} />
                <StatCard icon={Wallet}        label="Récurrents"        value={formatEuro(recurringTotal)} sub={`${recurring.length} abonnement${recurring.length>1?"s":""}`} color="#A85BC7" />
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:14, padding:20, marginBottom:20 }}>
                <h3 style={{ color:"rgba(255,255,255,0.4)", fontSize:9, letterSpacing:1.5, marginBottom:14, fontWeight:600, textTransform:"uppercase" }}>Répartition budgétaire du mois</h3>
                {Object.entries(monthBudget).length > 0 ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {Object.entries(monthBudget).sort(([,a],[,b])=>b-a).map(([cat,total]) => {
                      const pct = monthTotal>0 ? Math.round((total/monthTotal)*100) : 0;
                      const color = BUDGET_CATEGORIES[cat]?.color||"#888";
                      return (
                        <div key={cat}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ color:"rgba(255,255,255,0.6)", fontSize:12 }}>{cat}</span>
                            <span style={{ color, fontSize:12, fontWeight:600 }}>{formatEuro(total)} <span style={{ color:"rgba(255,255,255,0.25)", fontWeight:400 }}>({pct}%)</span></span>
                          </div>
                          <div style={{ height:6, background:"rgba(255,255,255,0.04)", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width 0.5s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color:"rgba(255,255,255,0.15)", textAlign:"center", padding:24, fontSize:11 }}>Aucune facture ce mois</div>
                )}
              </div>

              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:14, overflow:"hidden" }}>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ borderCollapse:"collapse", width:"100%", minWidth:500 }}>
                    <thead>
                      <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                        {["Fournisseur","TTC","Catégorie","Statut"].map(h => (
                          <th key={h} style={{ padding:"10px 12px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:9, fontWeight:600, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthInvoices.length===0
                        ? <tr><td colSpan={4} style={{ padding:36, textAlign:"center", color:"rgba(255,255,255,0.15)", fontSize:11 }}>Aucune facture ce mois</td></tr>
                        : monthInvoices.map((inv,i) => {
                          const cat = getBudgetCategory(inv);
                          const catColor = BUDGET_CATEGORIES[cat]?.color||"#888";
                          return (
                            <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                              <td style={{ padding:"10px 12px", color:"#EDE8DB", fontSize:11, fontWeight:500 }}>{inv.provider||"—"}</td>
                              <td style={{ padding:"10px 12px", color:"#D4A853", fontSize:11, fontWeight:600 }}>{formatEuro(inv.amount_ttc)}</td>
                              <td style={{ padding:"10px 12px" }}><span style={{ background:`${catColor}18`, color:catColor, padding:"2px 8px", borderRadius:10, fontSize:9, fontWeight:600 }}>{cat}</span></td>
                              <td style={{ padding:"10px 12px" }}>
                                {inv.has_anomaly ? <span style={{ color:"#C75B4E", fontSize:10, fontWeight:600 }}>⚠️ Anomalie</span> : <span style={{ color:"rgba(91,199,138,0.6)", fontSize:10 }}>✅ OK</span>}
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
