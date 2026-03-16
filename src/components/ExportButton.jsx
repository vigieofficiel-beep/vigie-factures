import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table, ChevronDown } from 'lucide-react';

/**
 * ExportButton — composant réutilisable
 * Props :
 *   data     : tableau d'objets à exporter
 *   columns  : [{ key, label, format? }] — colonnes à inclure
 *   filename : nom du fichier sans extension (ex: "depenses-2025")
 *   color    : couleur accent (défaut: #5BA3C7)
 */
export default function ExportButton({ data = [], columns = [], filename = 'export', color = '#5BA3C7' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Export CSV ──────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = columns.map(c => `"${c.label}"`).join(';');
    const rows = data.map(row =>
      columns.map(c => {
        const val = c.format ? c.format(row[c.key], row) : (row[c.key] ?? '');
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(';')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    triggerDownload(blob, `${filename}.csv`);
    setOpen(false);
  };

  // ── Export Excel (XLSX simple via HTML table) ────────────────────────
  const exportExcel = () => {
    const headers = columns.map(c => `<th>${c.label}</th>`).join('');
    const rows = data.map(row =>
      '<tr>' + columns.map(c => {
        const val = c.format ? c.format(row[c.key], row) : (row[c.key] ?? '');
        return `<td>${String(val).replace(/</g, '&lt;')}</td>`;
      }).join('') + '</tr>'
    ).join('');

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
      <x:Name>${filename}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
      </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      <style>th{background:#1A1C20;color:#fff;font-weight:bold;padding:6px 10px;}td{padding:5px 10px;border:1px solid #E8EAF0;}</style>
      </head><body><table border="1"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>
    `;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    triggerDownload(blob, `${filename}.xls`);
    setOpen(false);
  };

  const triggerDownload = (blob, name) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, border:'1px solid #E8EAF0', background:'#fff', color:'#5A6070', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 150ms' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor=color; e.currentTarget.style.color=color; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#E8EAF0'; e.currentTarget.style.color='#5A6070'; }}
      >
        <Download size={13}/>
        Exporter
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition:'transform 150ms' }}/>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:100, background:'#fff', border:'1px solid #E8EAF0', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', overflow:'hidden', minWidth:160, animation:'fadeDown 0.15s ease' }}>
          <button onClick={exportCSV} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', border:'none', background:'none', cursor:'pointer', fontSize:13, color:'#1A1C20', fontFamily:'inherit', textAlign:'left' }}
            onMouseEnter={e => e.currentTarget.style.background='#F8F9FB'}
            onMouseLeave={e => e.currentTarget.style.background='none'}>
            <FileText size={14} color="#5BA3C7"/> CSV (.csv)
          </button>
          <div style={{ height:1, background:'#F0F2F5' }}/>
          <button onClick={exportExcel} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 16px', border:'none', background:'none', cursor:'pointer', fontSize:13, color:'#1A1C20', fontFamily:'inherit', textAlign:'left' }}
            onMouseEnter={e => e.currentTarget.style.background='#F8F9FB'}
            onMouseLeave={e => e.currentTarget.style.background='none'}>
            <Table size={14} color="#5BC78A"/> Excel (.xls)
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
