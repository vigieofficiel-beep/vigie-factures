import { useState, useEffect, useRef } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Save, User, Building2, CreditCard, MapPin, CheckCircle, Camera, Upload } from 'lucide-react';

const C = {
  blue:   '#5BA3C7',
  green:  '#5BC78A',
  dark:   '#0F172A',
  light:  '#94A3B8',
  border: '#E2E8F0',
  bg:     '#F8FAFC',
  red:    '#C75B4E',
};

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 9,
  background: C.bg, border: `1px solid ${C.border}`,
  color: C.dark, fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle = {
  fontSize: 11, fontWeight: 600, color: C.light,
  marginBottom: 5, display: 'block',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

export default function ProfilPro() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    company_name: '', siret: '', forme_juridique: '',
    tva_intracommunautaire: '', adresse: '', code_postal: '', ville: '',
    iban: '', avatar_url: '',
  });
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const fileRef = useRef(null);

  useEffect(() => { loadProfil(); }, []);

  const loadProfil = async () => {
    const { data: { user } } = await supabasePro.auth.getUser();
    if (!user) return;
    const { data } = await supabasePro.from('user_profiles').select('*').eq('id', user.id).single();
    if (data) {
      setForm(f => ({ ...f, ...data }));
      if (data.avatar_url) setPhotoPreview(data.avatar_url);
    }
    setLoading(false);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ── Upload photo de profil ───────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifications
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 2 Mo.');
      return;
    }

    setError('');
    setUploadingPhoto(true);

    // Aperçu local immédiat
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const ext  = file.name.split('.').pop();
      const path = `avatars/${user.id}/profil.${ext}`;

      // Upload dans le bucket invoices (déjà existant)
      const { error: upErr } = await supabasePro.storage
        .from('invoices')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: urlData } = supabasePro.storage
        .from('invoices')
        .getPublicUrl(path);

      const avatar_url = urlData.publicUrl + '?t=' + Date.now(); // cache-bust

      // Sauvegarder l'URL dans le profil
      await supabasePro.from('user_profiles').upsert({ id: user.id, avatar_url });
      setForm(f => ({ ...f, avatar_url }));
      setPhotoPreview(avatar_url);
    } catch (e) {
      setError('Erreur upload : ' + e.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  // ── Sauvegarde profil ────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const { error: err } = await supabasePro.from('user_profiles').upsert({ ...form, id: user.id });
      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  // Initiales pour le placeholder avatar
  const initiales = [form.first_name?.[0], form.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.light, fontSize: 13 }}>Chargement…</div>
  );

  return (
    <div style={{ fontFamily: "'Nunito Sans', sans-serif", padding: '32px 28px', maxWidth: 720, margin: '0 auto' }}>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: C.dark, margin: 0 }}>
          Mon profil pro
        </h1>
        <p style={{ fontSize: 13, color: C.light, marginTop: 4 }}>
          Ces informations apparaîtront automatiquement sur vos devis et factures générés.
        </p>
      </div>

      {/* ── Photo de profil ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={13} color={C.blue}/>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Photo de profil
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>

          {/* Avatar — grand carré cliquable */}
          <div
            onClick={() => !uploadingPhoto && fileRef.current?.click()}
            style={{
              width: 100, height: 100, borderRadius: 16, flexShrink: 0,
              background: photoPreview ? 'transparent' : `${C.blue}15`,
              border: `2px dashed ${photoPreview ? C.blue : C.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploadingPhoto ? 'wait' : 'pointer',
              overflow: 'hidden', position: 'relative',
              transition: 'all 200ms ease',
            }}
            onMouseEnter={e => { if (!uploadingPhoto) e.currentTarget.style.borderColor = C.blue; }}
            onMouseLeave={e => { if (!photoPreview) e.currentTarget.style.borderColor = C.border; }}
          >
            {photoPreview ? (
              <>
                <img
                  src={photoPreview}
                  alt="Photo de profil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Overlay au hover */}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 200ms' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <Camera size={20} color="#fff"/>
                </div>
              </>
            ) : uploadingPhoto ? (
              <div style={{ fontSize: 11, color: C.light, textAlign: 'center', padding: 8 }}>Upload…</div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: C.blue, lineHeight: 1 }}>
                  {initiales}
                </div>
                <div style={{ fontSize: 10, color: C.light, marginTop: 6 }}>Cliquer</div>
              </div>
            )}
          </div>

          {/* Infos et bouton */}
          <div>
            <p style={{ fontSize: 13, color: C.dark, fontWeight: 600, marginBottom: 6 }}>
              {photoPreview ? 'Modifier la photo' : 'Ajouter une photo'}
            </p>
            <p style={{ fontSize: 12, color: C.light, marginBottom: 14, lineHeight: 1.5 }}>
              JPG, PNG ou WebP · Max 2 Mo<br/>
              Apparaît sur votre bureau et vos documents.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPhoto}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: `1px solid ${C.blue}`, background: `${C.blue}10`, color: C.blue, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Upload size={13}/>
              {uploadingPhoto ? 'Upload en cours…' : 'Choisir une image'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>
        </div>
      </div>

      {/* ── Identité ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={13} color={C.blue}/>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identité</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label style={labelStyle}>Prénom</label><input value={form.first_name || ''} onChange={set('first_name')} style={inputStyle} placeholder="Jean"/></div>
          <div><label style={labelStyle}>Nom</label><input value={form.last_name || ''} onChange={set('last_name')} style={inputStyle} placeholder="Dupont"/></div>
          <div><label style={labelStyle}>Téléphone</label><input value={form.phone || ''} onChange={set('phone')} style={inputStyle} placeholder="06 00 00 00 00"/></div>
        </div>
      </div>

      {/* ── Entreprise ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={13} color={C.blue}/>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entreprise</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label style={labelStyle}>Raison sociale</label><input value={form.company_name || ''} onChange={set('company_name')} style={inputStyle} placeholder="SARL Dupont"/></div>
          <div>
            <label style={labelStyle}>Forme juridique</label>
            <select value={form.forme_juridique || ''} onChange={set('forme_juridique')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Sélectionner</option>
              {['Auto-entrepreneur','EURL','SARL','SAS','SASU','SA','EI','Association'].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>SIRET</label><input value={form.siret || ''} onChange={set('siret')} style={inputStyle} placeholder="000 000 000 00000"/></div>
          <div><label style={labelStyle}>N° TVA intracommunautaire</label><input value={form.tva_intracommunautaire || ''} onChange={set('tva_intracommunautaire')} style={inputStyle} placeholder="FR00000000000"/></div>
        </div>
      </div>

      {/* ── Adresse ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={13} color={C.blue}/>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Adresse</span>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div><label style={labelStyle}>Adresse</label><input value={form.adresse || ''} onChange={set('adresse')} style={inputStyle} placeholder="1 rue de la Paix"/></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
            <div><label style={labelStyle}>Code postal</label><input value={form.code_postal || ''} onChange={set('code_postal')} style={inputStyle} placeholder="75001"/></div>
            <div><label style={labelStyle}>Ville</label><input value={form.ville || ''} onChange={set('ville')} style={inputStyle} placeholder="Paris"/></div>
          </div>
        </div>
      </div>

      {/* ── Coordonnées bancaires ── */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${C.blue}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={13} color={C.blue}/>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.dark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coordonnées bancaires</span>
        </div>
        <div><label style={labelStyle}>IBAN</label><input value={form.iban || ''} onChange={set('iban')} style={inputStyle} placeholder="FR76 0000 0000 0000 0000 0000 000"/></div>
        <p style={{ fontSize: 11, color: C.light, marginTop: 8 }}>ℹ️ L'IBAN apparaîtra en bas de vos devis pour faciliter le paiement.</p>
      </div>

      {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(199,91,78,0.07)', borderRadius: 8, border: '1px solid rgba(199,91,78,0.2)' }}>{error}</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', padding: '13px', borderRadius: 11, border: 'none', background: saved ? C.green : C.blue, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.3s ease', fontFamily: 'inherit' }}
      >
        {saved
          ? <><CheckCircle size={16}/> Profil enregistré !</>
          : saving ? 'Enregistrement…'
          : <><Save size={16}/> Enregistrer mon profil</>
        }
      </button>
    </div>
  );
}
