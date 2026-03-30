import { useState, useRef } from 'react';
import { useWorkspace } from '../hooks/useWorkspace.jsx';
import { supabasePro } from '../lib/supabasePro';
import { ScanLine, X, Upload, Loader, CheckCircle, AlertTriangle, TrendingUp, FileCheck, HelpCircle, Save } from 'lucide-react';

const ACCENT = '#5BA3C7';

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
  depense: { label: 'Dépense',  icon: TrendingUp, color: '#C75B4E', table: 'expenses',  message: 'Classifié comme dépense' },
  recette: { label: 'Recette',  icon: TrendingUp, color: '#5BC78A', table: 'devis',   message: 'Classifié comme recette' },
  contrat: { label: 'Contrat',  icon: FileCheck,  color: '#5BA3C7', table: 'contrats',   message: 'Classifié comme contrat' },
  autre:   { label: 'Autre',    icon: HelpCircle, color: '#A85BC7', table: null,          message: 'Type non reconnu' },
};

const CATEGORIES = ['depense', 'recette', 'contrat', 'autre'];

export default function AnalyseDocumentFlottant() {
  const { activeWorkspace } = useWorkspace();
  const [open,     setOpen]     = useState(false);
  const [step,     setStep]     = useState('idle');
  const [result,   setResult]   = useState(null);
  const [errMsg,   setErrMsg]   = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [catChoisie, setCatChoisie] = useState(null);
  const [statutRecette, setStatutRecette] = useState('encaisse');
  const fileRef = useRef();
  const currentFile = useRef(null);

  const reset = () => { setStep('idle'); setResult(null); setErrMsg(''); setSaved(false); setSaving(false); setCatChoisie(null); setStatutRecette('encaisse'); currentFile.current = null; };
  const close = () => { setOpen(false); setTimeout(reset, 300); };

  const analyser = async (file) => {
    if (!file) return;
    currentFile.current = file;
    setStep('loading'); setResult(null);
    try {
      let base64, mimeType;
      if (file.type === 'application/pdf') {
        base64 = await pdfToBase64(file); mimeType = 'image/png';
      } else {
        base64 = await imageToBase64(file); mimeType = file.type;
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
      setCatChoisie(data.type_document || 'autre');
      setStep('done');
    } catch (e) {
      setErrMsg(e.message || 'Erreur inconnue'); setStep('error');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const ok = ['application/pdf','image/jpeg','image/png','image/jpg'].includes(file.type);
    if (!ok) { setErrMsg('Format non supporté. Utilisez PDF, JPG ou PNG.'); setStep('error'); return; }
    analyser(file);
  };

  const sauvegarder = async () => {
    if (!result || !catChoisie) return;
    const config = TYPE_CONFIG[catChoisie] || TYPE_CONFIG.autre;
    // FIX : dispatch event même pour "autre"
    if (!config.table) {
      setSaved(true);
      window.dispatchEvent(new CustomEvent('vigie_document_saved'));
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabasePro.auth.getSession();
      if (!session) { const { data: r } = await supabasePro.auth.refreshSession(); }
      const { data: { user } } = await supabasePro.auth.getUser();
      if (!user) throw new Error('Session expirée — reconnectez-vous');
      // Upload fichier original
      let file_url = null, storage_path = null;
      if (currentFile.current) {
        try {
          const file = currentFile.current;
          const ext = file.name.split('.').pop();
          const folder = catChoisie === 'depense' ? 'frais' : catChoisie === 'recette' ? 'recettes' : 'contrats';
          const path = `${folder}/${user.id}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabasePro.storage.from('invoices').upload(path, file);
          if (!upErr) {
            const { data: urlData } = supabasePro.storage.from('invoices').getPublicUrl(path);
            file_url = urlData.publicUrl;
            storage_path = path;
          }
        } catch (e) { console.warn('Upload non bloquant:', e); }
      }

      let payload = {};
      if (catChoisie === 'depense') {
        payload = {
          user_id: user.id,
          workspace_id: activeWorkspace?.id || null,
          date: result.date || new Date().toISOString().split('T')[0],
          amount_ttc: result.montant_ttc || 0,
          etablissement: result.fournisseur || '',
          type: 'autre',
          notes: result.description || '',
          file_url,
          storage_path,
        };
      } else if (catChoisie === 'recette') {
        payload = {
          user_id: user.id,
          workspace_id: activeWorkspace?.id || null,
          date_emission: result.date || new Date().toISOString().split('T')[0],
          montant_ht: result.montant_ht || 0,
          montant_ttc: result.montant_ttc || 0,
          tva_taux: 20,
          statut: statutRecette,
          description: result.description || result.fournisseur || '',
          numero: `REC-${new Date().getFullYear()}-OCR`,
          file_url,
          storage_path,
        };
      } else if (catChoisie === 'contrat') {
        payload = {
          user_id: user.id,
          workspace_id: activeWorkspace?.id || null,
          nom: result.nom_contrat || result.fournisseur || 'Contrat importé',
          fournisseur: result.fournisseur || '',
          date_debut: result.date || new Date().toISOString().split('T')[0],
          date_fin: result.date_fin || null,
          statut: 'actif',
          notes: result.description || '',
          montant_periodique: result.montant_ttc || 0,
          file_url,
          storage_path,
        };
      }
      await supabasePro.from(config.table).insert([payload]);
      setSaved(true);
      // FIX : rafraîchir le dashboard après enregistrement OCR
      window.dispatchEvent(new CustomEvent('vigie_document_saved'));
    } catch (e) {
      setErrMsg('Erreur sauvegarde : ' + e.message); setStep('error');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => n != null && n !== 0
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
    : null;

  const typeConfig = catChoisie ? (TYPE_CONFIG[catChoisie] || TYPE_CONFIG.autre) : null;

  return (
    <>
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

      {open && (
        <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6,8,11,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0F1923', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 460, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'fadeUp 200ms ease' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScanLine size={18} color={ACCENT} strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#EDE8DB' }}>Analyser un document</div>
                  <div style={{ fontSize: 11, color: 'rgba(237,232,219,0.4)' }}>PDF, JPG ou PNG — classement automatique</div>
                </div>
              </div>
              <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(237,232,219,0.4)', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {step === 'idle' && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? ACCENT : 'rgba(255,255,255,0.12)'}`, borderRadius: 14, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? `${ACCENT}08` : 'rgba(255,255,255,0.03)', transition: 'all 180ms ease' }}
              >
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                <Upload size={32} color={dragOver ? ACCENT : 'rgba(237,232,219,0.2)'} style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: dragOver ? ACCENT : 'rgba(237,232,219,0.6)', marginBottom: 6 }}>
                  {dragOver ? 'Lâchez ici !' : 'Glissez votre document'}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(237,232,219,0.3)' }}>ou cliquez pour parcourir • PDF, JPG, PNG</div>
              </div>
            )}

            {step === 'loading' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${ACCENT}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Loader size={24} color={ACCENT} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#EDE8DB', marginBottom: 6 }}>Analyse en cours…</div>
                <div style={{ fontSize: 12, color: 'rgba(237,232,219,0.4)' }}>Extraction et classification du document</div>
              </div>
            )}

            {step === 'done' && result && typeConfig && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: `${typeConfig.color}12`, border: `1px solid ${typeConfig.color}30`, marginBottom: 16 }}>
                  <CheckCircle size={16} color={typeConfig.color} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: typeConfig.color }}>Document classifié : {typeConfig.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(237,232,219,0.4)' }}>{typeConfig.message}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(237,232,219,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Enregistrer dans</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {CATEGORIES.map(cat => {
                      const cfg = TYPE_CONFIG[cat];
                      const actif = catChoisie === cat;
                      return (
                        <button key={cat} onClick={() => setCatChoisie(cat)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: `1px solid ${actif ? cfg.color : 'rgba(255,255,255,0.08)'}`, background: actif ? `${cfg.color}15` : 'rgba(255,255,255,0.03)', color: actif ? cfg.color : 'rgba(237,232,219,0.4)', fontSize: 11, fontWeight: actif ? 700 : 500, cursor: 'pointer', transition: 'all 150ms', fontFamily: 'inherit' }}>
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Statut recette */}
                {catChoisie === 'recette' && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(237,232,219,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Statut de la recette</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[
                        { id: 'brouillon', label: 'Brouillon', color: 'rgba(237,232,219,0.4)' },
                        { id: 'envoye',    label: 'Envoyé',    color: '#5BA3C7' },
                        { id: 'signe',     label: 'Signé',     color: '#5BC78A' },
                        { id: 'encaisse',  label: 'Encaissé',  color: '#A85BC7' },
                      ].map(s => (
                        <button key={s.id} onClick={() => setStatutRecette(s.id)}
                          style={{ flex: 1, padding: '7px 4px', borderRadius: 9, border: `1px solid ${statutRecette === s.id ? s.color : 'rgba(255,255,255,0.08)'}`, background: statutRecette === s.id ? `${s.color}20` : 'rgba(255,255,255,0.03)', color: statutRecette === s.id ? s.color : 'rgba(237,232,219,0.4)', fontSize: 11, fontWeight: statutRecette === s.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(237,232,219,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Données extraites</div>
                  {[
                    ['Fournisseur / Nom', result.fournisseur || result.nom_contrat],
                    ['Date',             result.date],
                    ['N° document',      result.numero_facture],
                    ['Montant HT',       fmt(result.montant_ht)],
                    ['TVA',              fmt(result.tva)],
                    ['Montant TTC',      fmt(result.montant_ttc)],
                    ['Catégorie',        result.categorie],
                    ['Description',      result.description],
                    ['Date de fin',      result.date_fin],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 12 }}>
                      <span style={{ color: 'rgba(237,232,219,0.45)' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: '#EDE8DB', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {saved ? (
                  <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(91,199,138,0.08)', border: '1px solid rgba(91,199,138,0.25)', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#5BC78A' }}>
                    ✅ Enregistré dans {typeConfig.label}s
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={sauvegarder} disabled={saving || !TYPE_CONFIG[catChoisie]?.table} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: TYPE_CONFIG[catChoisie]?.table ? `linear-gradient(135deg, ${typeConfig.color}, ${typeConfig.color}CC)` : 'rgba(255,255,255,0.1)', color: TYPE_CONFIG[catChoisie]?.table ? '#fff' : 'rgba(237,232,219,0.3)', fontSize: 13, fontWeight: 700, cursor: TYPE_CONFIG[catChoisie]?.table ? 'pointer' : 'not-allowed', fontFamily: "'Nunito Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Save size={14} /> {saving ? 'Enregistrement…' : `Enregistrer dans ${typeConfig.label}s`}
                    </button>
                    <button onClick={reset} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(237,232,219,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito Sans', sans-serif" }}>
                      Nouveau
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 'error' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(199,91,78,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <AlertTriangle size={22} color="#C75B4E" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#C75B4E', marginBottom: 6 }}>Erreur d'analyse</div>
                <div style={{ fontSize: 12, color: 'rgba(237,232,219,0.4)', marginBottom: 20 }}>{errMsg}</div>
                <button onClick={reset} style={{ padding: '10px 24px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(237,232,219,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito Sans', sans-serif" }}>
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
