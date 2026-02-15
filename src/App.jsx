import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FileText, AlertTriangle, TrendingUp, Calendar, Search, Filter, Eye, X, Bell, RefreshCw, Upload, CheckCircle, Clock, Trash2, ChevronDown, ArrowUpRight, ArrowDownRight, Loader, Plus, LayoutDashboard, UploadCloud } from "lucide-react";

// ═══════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════
const SUPABASE_URL = "https://qkvqujnctdyaxsenvwsm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdnF1am5jdGR5YXhzZW52d3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Nzc1MzcsImV4cCI6MjA4NjU1MzUzN30.XtzE94TOrI7KRh8Naj3cBxM80wGPDjZvI8nhUbxIvdA";
const MINDSTUDIO_API = "/api/analyze";
const MINDSTUDIO_KEY = "skg0tCIZw5vqKYAa6OKgY6w2Gom2Q";
const MINDSTUDIO_APP_ID = "vigiefactures2-66aa30f6";

const COLORS = ["#D4A853", "#C75B4E", "#5BA3C7", "#5BC78A", "#A85BC7", "#C78A5B", "#5BC7B8", "#C75BA8"];
const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

function formatEuro(n) {
  if (n == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ═══════════════════════════════════════════
// PDF TEXT EXTRACTION (client-side)
// ═══════════════════════════════════════════
async function extractTextFromPDF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target.result);
        // Simple text extraction from PDF binary
        let text = "";
        const decoder = new TextDecoder("utf-8", { fatal: false });
        const raw = decoder.decode(typedArray);
        
        // Extract text between BT and ET markers (PDF text objects)
        const textBlocks = raw.match(/BT[\s\S]*?ET/g) || [];
        for (const block of textBlocks) {
          const strings = block.match(/\(([^)]*)\)/g) || [];
          for (const s of strings) {
            text += s.slice(1, -1) + " ";
          }
          const hexStrings = block.match(/<([0-9A-Fa-f]+)>/g) || [];
          for (const h of hexStrings) {
            const hex = h.slice(1, -1);
            for (let i = 0; i < hex.length; i += 2) {
              const charCode = parseInt(hex.substr(i, 2), 16);
              if (charCode > 31) text += String.fromCharCode(charCode);
            }
          }
        }
        
        if (text.trim().length < 20) {
          // Fallback: read as plain text
          text = raw.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, " ").replace(/\s{3,}/g, "\n");
        }
        
        resolve(text.trim() || "Impossible d'extraire le texte du PDF");
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function extractTextFromFile(file) {
  if (file.type === "application/pdf") {
    return extractTextFromPDF(file);
  }
  // For text/image files, read as text
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ═══════════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════════
function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, borderRadius: "50%", background: `${color}08` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#EDE8DB", fontFamily: "'Cormorant Garamond', serif" }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11, color: trend === "up" ? "#C75B4E" : trend === "down" ? "#5BC78A" : "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          {trend === "up" && <ArrowUpRight size={12} />}
          {trend === "down" && <ArrowDownRight size={12} />}
          {sub}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// FILE ITEM COMPONENT (upload queue)
// ═══════════════════════════════════════════
function FileItem({ file, onRemove }) {
  const statusColors = {
    pending: "rgba(255,255,255,0.3)",
    processing: "#D4A853",
    done: "#5BC78A",
    error: "#C75B4E",
  };
  const statusIcons = {
    pending: Clock,
    processing: Loader,
    done: CheckCircle,
    error: AlertTriangle,
  };
  const StatusIcon = statusIcons[file.status];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 18px",
      background: file.status === "processing" ? "rgba(212,168,83,0.06)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${file.status === "processing" ? "rgba(212,168,83,0.2)" : file.status === "error" ? "rgba(199,91,78,0.2)" : file.status === "done" ? "rgba(91,199,138,0.15)" : "rgba(255,255,255,0.05)"}`,
      borderRadius: 10,
      transition: "all 0.3s",
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 8,
        background: file.status === "done" ? "rgba(91,199,138,0.1)" : "rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <FileText size={18} color={file.status === "done" ? "#5BC78A" : "rgba(255,255,255,0.4)"} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#EDE8DB", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </div>
        <div style={{ fontSize: 11, color: statusColors[file.status], marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
          <StatusIcon size={12} style={file.status === "processing" ? { animation: "spin 1s linear infinite" } : {}} />
          {file.status === "pending" && "En attente"}
          {file.status === "processing" && "Analyse en cours..."}
          {file.status === "done" && `✓ ${file.result?.extraction?.provider || "Analysé"} — ${formatEuro(file.result?.extraction?.amount_ttc)}`}
          {file.status === "error" && (file.errorMsg || "Erreur")}
        </div>
      </div>
      {(file.status === "pending" || file.status === "error") && (
        <button onClick={() => onRemove(file.id)} style={{
          background: "none", border: "none", cursor: "pointer", padding: 4,
          color: "rgba(255,255,255,0.2)", transition: "color 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#C75B4E"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// INVOICE MODAL
// ═══════════════════════════════════════════
function InvoiceModal({ inv, onClose }) {
  if (!inv) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#161513",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18,
        padding: 32,
        width: "90%",
        maxWidth: 500,
        maxHeight: "80vh",
        overflowY: "auto",
        animation: "modalIn 0.3s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ color: "#EDE8DB", fontFamily: "'Cormorant Garamond', serif", fontSize: 22, margin: 0 }}>Détails</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color="rgba(255,255,255,0.3)" /></button>
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
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{k}</span>
            <span style={{ color: "#EDE8DB", fontSize: 12, fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{v || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#161513", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
      <div style={{ color: "rgba(255,255,255,0.4)" }}>{payload[0]?.name || payload[0]?.payload?.name}</div>
      <div style={{ color: "#D4A853", fontWeight: 700 }}>{formatEuro(payload[0]?.value)}</div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function VigieFactures() {
  const [page, setPage] = useState("upload");
  const [files, setFiles] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInv, setSelectedInv] = useState(null);
  const [search, setSearch] = useState("");
  const [filterFreq, setFilterFreq] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const nextId = useRef(0);

  // Fetch invoices from Supabase
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/invoices?order=processed_at.desc&limit=100`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      if (res.ok) setInvoices(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Add files to queue
  const addFiles = useCallback((newFiles) => {
    const fileObjs = Array.from(newFiles).filter(f =>
      f.type === "application/pdf" || f.type.startsWith("text/") || f.type.startsWith("image/")
    ).map(f => ({
      id: nextId.current++,
      file: f,
      name: f.name,
      status: "pending",
      result: null,
      errorMsg: null,
    }));
    setFiles(prev => [...prev, ...fileObjs]);
  }, []);

  // Remove file from queue
  const removeFile = useCallback((id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Process all files
  const processAll = useCallback(async () => {
    setIsProcessing(true);
    const pending = files.filter(f => f.status === "pending" || f.status === "error");

    for (const fileObj of pending) {
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "processing" } : f));

      try {
        // Extract text from file
        const text = await extractTextFromFile(fileObj.file);

        // Send to MindStudio API
       const response = await fetch(MINDSTUDIO_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        const data = await response.json();

        if (data.success && data.result) {
          let result;
          try {
            result = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
          } catch {
            result = { raw: data.result };
          }
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "done", result } : f));
        } else {
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "error", errorMsg: data.error || "Erreur API" } : f));
        }
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: "error", errorMsg: err.message } : f));
      }
    }

    setIsProcessing(false);
    fetchInvoices(); // Refresh dashboard
  }, [files, fetchInvoices]);

  // Drag & Drop handlers
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

  // Filtered invoices for dashboard
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = !search || [inv.provider, inv.invoice_number, inv.category].some(f => f?.toLowerCase().includes(search.toLowerCase()));
      const matchFreq = filterFreq === "all" || inv.frequency === filterFreq;
      return matchSearch && matchFreq;
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
    const byProvider = {};
    invoices.forEach(i => { const p = i.provider || "Inconnu"; byProvider[p] = (byProvider[p] || 0) + (i.amount_ttc || 0); });
    return Object.entries(byProvider).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [invoices]);

  const barData = useMemo(() => {
    const byMonth = {};
    invoices.forEach(i => {
      if (!i.invoice_date) return;
      const d = new Date(i.invoice_date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      byMonth[key] = { name: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`, total: (byMonth[key]?.total || 0) + (i.amount_ttc || 0) };
    });
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v).slice(-12);
  }, [invoices]);

  const alerts = useMemo(() => invoices.filter(i => i.has_anomaly).map(i => ({ provider: i.provider, explanation: i.anomaly_explanation })), [invoices]);
  const pendingCount = files.filter(f => f.status === "pending").length;
  const doneCount = files.filter(f => f.status === "done").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0E0D0B", color: "#EDE8DB", fontFamily: "'Nunito Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes modalIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        @keyframes dropZonePulse { 0%,100% { border-color: rgba(212,168,83,0.3); } 50% { border-color: rgba(212,168,83,0.6); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        table { border-collapse: collapse; width: 100%; }
        input[type="file"] { display: none; }
      `}</style>

      {/* ═══ SIDEBAR NAV ═══ */}
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 220, background: "rgba(255,255,255,0.015)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "28px 16px", display: "flex", flexDirection: "column", zIndex: 100 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: "#D4A853", marginBottom: 6, paddingLeft: 8 }}>
          Vigie
        </h1>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", paddingLeft: 8, marginBottom: 36 }}>Factures</p>

        {[
          { id: "upload", icon: UploadCloud, label: "Analyser", badge: pendingCount > 0 ? pendingCount : null },
          { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", badge: null },
        ].map(item => (
          <button key={item.id} onClick={() => setPage(item.id)} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 10, border: "none",
            background: page === item.id ? "rgba(212,168,83,0.1)" : "transparent",
            color: page === item.id ? "#D4A853" : "rgba(255,255,255,0.4)",
            cursor: "pointer", fontSize: 13, fontWeight: page === item.id ? 600 : 400,
            width: "100%", textAlign: "left", marginBottom: 4,
            transition: "all 0.2s", fontFamily: "'Nunito Sans', sans-serif",
          }}
            onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.background = "transparent"; }}>
            <item.icon size={18} />
            {item.label}
            {item.badge && (
              <span style={{ marginLeft: "auto", background: "#D4A853", color: "#0E0D0B", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{item.badge}</span>
            )}
          </button>
        ))}

        <div style={{ marginTop: "auto", padding: "16px 8px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
            {invoices.length} facture{invoices.length > 1 ? "s" : ""} analysée{invoices.length > 1 ? "s" : ""}
          </div>
          {alerts.length > 0 && (
            <div style={{ fontSize: 11, color: "#C75B4E", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <Bell size={11} /> {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div style={{ marginLeft: 220, padding: "32px 40px 60px" }}>

        {/* ═══ UPLOAD PAGE ═══ */}
        {page === "upload" && (
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: "#EDE8DB", marginBottom: 8 }}>
              Analyser des factures
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 32 }}>
              Glisse tes fichiers ou clique pour les ajouter un par un. Lance l'analyse quand tu es prêt.
            </p>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "rgba(212,168,83,0.6)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 16,
                padding: "48px 32px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s",
                background: dragOver ? "rgba(212,168,83,0.04)" : "rgba(255,255,255,0.01)",
                animation: dragOver ? "dropZonePulse 1.5s infinite" : "none",
                marginBottom: 24,
              }}>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.png,.jpg,.jpeg"
                onChange={e => { addFiles(e.target.files); e.target.value = ""; }}
              />
              <Upload size={36} color={dragOver ? "#D4A853" : "rgba(255,255,255,0.2)"} style={{ marginBottom: 16 }} />
              <div style={{ color: dragOver ? "#D4A853" : "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                {dragOver ? "Lâche tes fichiers ici !" : "Glisse tes factures ici"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
                ou clique pour parcourir • PDF, images, texte
              </div>
            </div>

            {/* Add more button */}
            {files.length > 0 && (
              <button onClick={() => fileInputRef.current?.click()} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 18px", borderRadius: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)", fontSize: 12,
                cursor: "pointer", marginBottom: 16, fontFamily: "'Nunito Sans', sans-serif",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,83,0.3)"; e.currentTarget.style.color = "#D4A853"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                <Plus size={14} /> Ajouter d'autres factures
              </button>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {files.map(f => <FileItem key={f.id} file={f} onRemove={removeFile} />)}
              </div>
            )}

            {/* Action buttons */}
            {files.length > 0 && (
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={processAll}
                  disabled={isProcessing || pendingCount === 0}
                  style={{
                    flex: 1,
                    padding: "14px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: isProcessing ? "rgba(212,168,83,0.15)" : pendingCount === 0 ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #D4A853, #C78A5B)",
                    color: isProcessing ? "#D4A853" : pendingCount === 0 ? "rgba(255,255,255,0.3)" : "#0E0D0B",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: isProcessing || pendingCount === 0 ? "not-allowed" : "pointer",
                    fontFamily: "'Nunito Sans', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}>
                  {isProcessing ? (
                    <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Analyse en cours...</>
                  ) : pendingCount === 0 ? (
                    <><CheckCircle size={16} /> Toutes analysées !</>
                  ) : (
                    <><UploadCloud size={16} /> Analyser {pendingCount} facture{pendingCount > 1 ? "s" : ""}</>
                  )}
                </button>
                {doneCount > 0 && (
                  <button onClick={() => setPage("dashboard")} style={{
                    padding: "14px 20px", borderRadius: 10,
                    border: "1px solid rgba(91,199,138,0.3)",
                    background: "rgba(91,199,138,0.08)",
                    color: "#5BC78A", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "'Nunito Sans', sans-serif",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <LayoutDashboard size={15} /> Voir le dashboard
                  </button>
                )}
              </div>
            )}

            {/* Empty state */}
            {files.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.15)", fontSize: 13 }}>
                Aucune facture ajoutée pour le moment
              </div>
            )}
          </div>
        )}

        {/* ═══ DASHBOARD PAGE ═══ */}
        {page === "dashboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: "#EDE8DB", marginBottom: 4 }}>Dashboard</h2>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>Vue d'ensemble de vos factures</p>
              </div>
              <button onClick={fetchInvoices} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "8px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'Nunito Sans', sans-serif",
              }}>
                <RefreshCw size={13} /> Actualiser
              </button>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {alerts.map((a, i) => (
                  <div key={i} style={{
                    background: "rgba(199,91,78,0.06)", border: "1px solid rgba(199,91,78,0.15)",
                    borderRadius: 10, padding: "12px 18px",
                    display: "flex", alignItems: "center", gap: 12,
                    animation: "slideIn 0.3s ease-out",
                  }}>
                    <AlertTriangle size={16} color="#C75B4E" />
                    <span style={{ color: "#C75B4E", fontWeight: 600, fontSize: 12 }}>{a.provider}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>— {a.explanation}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              <StatCard icon={FileText} label="Factures" value={stats.count} sub={`${stats.providers} fournisseur${stats.providers > 1 ? "s" : ""}`} color="#D4A853" />
              <StatCard icon={TrendingUp} label="Total" value={formatEuro(stats.total)} sub={`${formatEuro(stats.totalYear)} est. annuel`} color="#5BA3C7" />
              <StatCard icon={AlertTriangle} label="Anomalies" value={stats.anomalies} sub={stats.anomalies > 0 ? "À vérifier" : "RAS"} color={stats.anomalies > 0 ? "#C75B4E" : "#5BC78A"} trend={stats.anomalies > 0 ? "up" : undefined} />
              <StatCard icon={Calendar} label="Récurrents" value={invoices.filter(i => i.frequency === "mensuel").length} sub={`${formatEuro(invoices.filter(i => i.frequency === "mensuel").reduce((s, i) => s + (i.amount_ttc || 0), 0))}/mois`} color="#A85BC7" />
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 22 }}>
                <h3 style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 1.5, marginBottom: 18, fontWeight: 600, textTransform: "uppercase" }}>Par fournisseur</h3>
                {pieData.length > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie><Tooltip content={<CustomTooltip />} /></PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {pieData.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                          <span style={{ color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>{d.name}</span>
                          <span style={{ color: COLORS[i % COLORS.length], fontWeight: 600, marginLeft: "auto" }}>{formatEuro(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div style={{ color: "rgba(255,255,255,0.15)", textAlign: "center", padding: 40, fontSize: 12 }}>Aucune donnée</div>}
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 22 }}>
                <h3 style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 1.5, marginBottom: 18, fontWeight: 600, textTransform: "uppercase" }}>Par mois</h3>
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="total" radius={[5, 5, 0, 0]}>
                        {barData.map((_, i) => <Cell key={i} fill={`rgba(212,168,83,${0.35 + (i / barData.length) * 0.65})`} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ color: "rgba(255,255,255,0.15)", textAlign: "center", padding: 40, fontSize: 12 }}>Aucune donnée</div>}
              </div>
            </div>

            {/* Search & Table */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "0 14px" }}>
                <Search size={14} color="rgba(255,255,255,0.25)" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." style={{ background: "none", border: "none", outline: "none", color: "#EDE8DB", fontSize: 12, padding: "10px 0", width: "100%", fontFamily: "'Nunito Sans', sans-serif" }} />
              </div>
              <button onClick={() => setShowFilters(!showFilters)} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10, padding: "8px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "'Nunito Sans', sans-serif",
              }}><Filter size={13} /> Filtres</button>
            </div>

            {showFilters && (
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[["all", "Tous"], ["mensuel", "Mensuel"], ["annuel", "Annuel"], ["ponctuel", "Ponctuel"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterFreq(v)} style={{
                    background: filterFreq === v ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${filterFreq === v ? "rgba(212,168,83,0.25)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 16, padding: "5px 14px", cursor: "pointer",
                    color: filterFreq === v ? "#D4A853" : "rgba(255,255,255,0.4)",
                    fontSize: 11, fontWeight: filterFreq === v ? 600 : 400, fontFamily: "'Nunito Sans', sans-serif",
                  }}>{l}</button>
                ))}
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden" }}>
              <table>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["N°", "Fournisseur", "TTC", "Date", "Fréq.", "Statut", ""].map(h => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>Chargement...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.15)", fontSize: 12 }}>Aucune facture</td></tr>
                  ) : filtered.map((inv, i) => (
                    <tr key={inv.id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", cursor: "pointer", transition: "background 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      onClick={() => setSelectedInv(inv)}>
                      <td style={{ padding: "12px 14px", color: "#EDE8DB", fontSize: 12, fontWeight: 500 }}>{inv.invoice_number || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{inv.provider || "—"}</td>
                      <td style={{ padding: "12px 14px", color: "#D4A853", fontSize: 12, fontWeight: 600 }}>{formatEuro(inv.amount_ttc)}</td>
                      <td style={{ padding: "12px 14px", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{formatDate(inv.invoice_date)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                          background: inv.frequency === "mensuel" ? "rgba(91,163,199,0.12)" : "rgba(255,255,255,0.05)",
                          color: inv.frequency === "mensuel" ? "#5BA3C7" : "rgba(255,255,255,0.4)",
                        }}>{inv.frequency || "—"}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {inv.has_anomaly
                          ? <span style={{ color: "#C75B4E", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Anomalie</span>
                          : <span style={{ color: "rgba(91,199,138,0.6)", fontSize: 11 }}>✓ OK</span>}
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <Eye size={13} color="rgba(255,255,255,0.2)" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>{filtered.length} facture{filtered.length > 1 ? "s" : ""}</span>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>Total : {formatEuro(filtered.reduce((s, i) => s + (i.amount_ttc || 0), 0))}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <InvoiceModal inv={selectedInv} onClose={() => setSelectedInv(null)} />
    </div>
  );
}
