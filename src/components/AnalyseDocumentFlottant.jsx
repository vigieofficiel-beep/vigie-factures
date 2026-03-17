import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, X, Upload, Loader, CheckCircle, AlertTriangle, FileText, TrendingUp, FileCheck, HelpCircle } from 'lucide-react';

const ACCENT = '#5BA3C7';

// Convertit PDF page 1 en PNG base64 via pdfjs (CDN)
async function pdfToBase64(file) {
  return new Promise((resolve, reject) => {
    const script = document.getElementById('pdfjs-script');
    const doConvert = () => {
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      if (!pdfjsLib) { reject(new Error('pdfjs non chargé')); return; }
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          resolve(canvas.toDataURL('image/png').split(',')[1]);
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    };
    if (window['pdfjs-dist/build/pdf']) { doConvert(); return; }
    if (!script) {
      const s = document.createElement('script');
      s.id = 'pdfjs-script';
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = doConvert;
      s.onerror = () => reject(new Error('Impossible de charger pdfjs'));
      document.head.appendChild(s);
    } else {
      script.addEventListener('load', doConvert);
    }
  });
}

async function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const TYPE_CONFIG = {
  depense: { label: 'Dépense',  icon: TrendingUp,  color: '#C75B4E', route: '/pro/depenses', message: 'Redirigé vers Dépenses' },
  recette: { label: 'Recette',  icon: TrendingUp,  color: '#5BC78A', route: '/pro/recettes', message: 'Redirigé vers Recettes' },
  contrat: { label: 'Contrat',  icon: FileCheck,   color: '#5BA3C7', route: '/pro/contrats', message: 'Redirigé vers Contrats' },
  autre:   { label: 'Autre',    icon: HelpCircle,  color: '#94A3B8', route: null,            message: 'Type non reconnu' },
};

export default function AnalyseDocumentFlottant() {
  const [open,    setOpen]    = useState(false);
  const [step,    setStep]    = useState('idle'); // idle | loading | done | error
  const [result,  setResult]  = useState(null);
  const [errMsg,  setErrMsg]  = useState('');
  const [dragOver,setDragOver]= useState(false);
  const fileRef = useRef();
  const navigate = useNavigate();

  const reset = () => { setStep('idle'); setResult(null); setErrMsg(''); };
  const close = () => { setOpen(false); setTimeout(reset, 300); };

  const analyser = async (file) => {
    if (!file) return;
    setStep('loading');
    setResult(null);
    try {
      let base64, mimeType;
      if (file.type === 'application/pdf') {
        base64 = await pdfToBase64(file);
        mimeType = 'image/png';
      } else {
        base64 = await imageToBase64(file);
        mimeType = file.type;
      }
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileBase64: base64, mimeType, fileName: file.name }),
      });
      if (!res.ok) throw new Error('Erreur serveur OCR');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep('done');
    } catch (e) {
      setErrMsg(e.message || 'Erreur inconnue');
      setStep('error');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const ok = ['application/pdf','image/jpeg','image/png','image/jpg'].includes(file.type);
    if (!ok) { setErrMsg('Format non supporté. Utilisez PDF, JPG ou PNG.'); setStep('error'); return; }
    analyser(file);
  };

  const handleRedirect = () => {
    if (!result) return;
    const type = result.type_document || 'autre';
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.autre;
    if (!config.route) { close(); return; }

    // Passer les données extraites via sessionStorage
    sessionStorage.setItem('ocr_prefill', JSON.stringify({
      source: 'prohome_ocr',
      type_document: type,
      date: result.date,
      numero_facture: result.numero_facture,
      fournisseur: result.fournisseur,
      montant_ht: result.montant_ht,
      tva: result.tva,
      montant_ttc: result.montant_ttc,
      categorie: result.categorie,
      description: result.description,
      nom_contrat: result.nom_contrat,
      date_fin: result.date_fin,
    }));

    close();
    navigate(config.route);
  };

  const fmt = (n) => n != null && n !== 0
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
    : null;

  const typeConfig = result ? (TYPE_CONFIG[result.type_document] || TYPE_CONFIG.autre) : null;

  return (
    <>
      {/* BOUTON FLOTTANT */}
      <button
        onClick={() => { setOpen(true); reset(); }}
        title="Analyser un document"
        style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 49,
          width: 52, height: 52, borderRadius: '50%', border: 'none',
          background: `linear-gradient(135deg, ${ACCENT}, #3D7FA3)`,
          color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(91,163,199,0.45)',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(91,163,199,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(91,163,199,0.45)'; }}
      >
        <ScanLine size={22} strokeWidth={2} />
      </button>

      {/* MODAL */}
      {open && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460,
              boxShadow: '0 24px 64px rgba(15,23,42,0.2)',
              animation: 'fadeUp 200ms ease',
            }}
          >
            {/* HEADER MODAL */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScanLine size={18} color={ACCENT} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Analyser un document</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>PDF, JPG ou PNG — classement automatique</div>
                </div>
              </div>
              <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* ÉTAT : IDLE */}
            {step === 'idle' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? ACCENT : '#E2E8F0'}`,
                  borderRadius: 14, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? `${ACCENT}05` : '#F8FAFC',
                  transition: 'all 180ms ease',
                }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                <Upload size={32} color={dragOver ? ACCENT : '#CBD5E1'} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: dragOver ? ACCENT : '#64748B', marginBottom: 6 }}>
                  {dragOver ? 'Lâchez ici !' : 'Glissez votre document'}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>ou cliquez pour parcourir • PDF, JPG, PNG</div>
              </div>
            )}

            {/* ÉTAT : LOADING */}
            {step === 'loading' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${ACCENT}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Loader size={24} color={ACCENT} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>Analyse en cours…</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>Extraction et classification du document</div>
              </div>
            )}

            {/* ÉTAT : DONE */}
            {step === 'done' && result && typeConfig && (
              <div>
                {/* Badge type */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: `${typeConfig.color}10`, border: `1px solid ${typeConfig.color}30`, marginBottom: 20 }}>
                  <CheckCircle size={16} color={typeConfig.color} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: typeConfig.color }}>Document classifié : {typeConfig.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{typeConfig.message}</div>
                  </div>
                </div>

                {/* Données extraites */}
                <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Données extraites</div>
                  {[
                    ['Fournisseur / Nom',  result.fournisseur || result.nom_contrat],
                    ['Date',              result.date],
                    ['N° document',       result.numero_facture],
                    ['Montant HT',        fmt(result.montant_ht)],
                    ['TVA',               fmt(result.tva)],
                    ['Montant TTC',       fmt(result.montant_ttc)],
                    ['Catégorie',         result.categorie],
                    ['Description',       result.description],
                    ['Date de fin',       result.date_fin],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12 }}>
                      <span style={{ color: '#94A3B8' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: '#1E293B', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Boutons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {typeConfig.route && (
                    <button onClick={handleRedirect} style={{
                      flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                      background: `linear-gradient(135deg, ${typeConfig.color}, ${typeConfig.color}CC)`,
                      color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'Nunito Sans', sans-serif",
                    }}>
                      → Aller vers {typeConfig.label}s
                    </button>
                  )}
                  <button onClick={reset} style={{
                    padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0',
                    background: '#fff', color: '#64748B', fontSize: 13, cursor: 'pointer',
                    fontFamily: "'Nunito Sans', sans-serif",
                  }}>
                    Nouveau
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAT : ERROR */}
            {step === 'error' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(199,91,78,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <AlertTriangle size={22} color="#C75B4E" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#C75B4E', marginBottom: 6 }}>Erreur d'analyse</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>{errMsg}</div>
                <button onClick={reset} style={{ padding: '10px 24px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito Sans', sans-serif" }}>
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </>
  );
}
