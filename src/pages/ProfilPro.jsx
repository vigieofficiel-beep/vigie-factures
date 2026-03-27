import { useState, useEffect, useRef } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { Save, User, Building2, CreditCard, MapPin, CheckCircle, Camera, Upload, Zap, ExternalLink, Loader, Trash2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useStripe } from '../hooks/useStripe';
import { usePlan, PLANS } from '../hooks/usePlan';
import { useNavigate } from 'react-router-dom';

import React from 'react';

const FORMES = ['Auto-entrepreneur','EURL','SARL','SAS','SASU','SA','EI','Association'];

function CustomSelectForme({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{ position:'relative', userSelect:'none' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ width:'100%', padding:'10px 12px', borderRadius:9, background:'rgba(255,255,255,0.06)', border:`1px solid ${open?'rgba(91,163,199,0.5)':'rgba(255,255,255,0.1)'}`, color: value ? '#EDE8DB' : 'rgba(237,232,219,0.3)', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', boxSizing:'border-box', fontFamily:'inherit' }}>
        <span>{value || 'Sélectionner'}</span>
        <ChevronDown size={13} style={{ color:'rgba(237,232,219,0.4)', transform:open?'rotate(180deg)':'rotate(0deg)', transition:'transform 200ms' }}/>
      </div>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#1a1d24', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, zIndex:100, overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
          {FORMES.map(f => (
            <div key={f} onClick={() => { onChange(f); setOpen(false); }}
              style={{ padding:'9px 12px', fontSize:13, color: value===f?'#5BA3C7':'#EDE8DB', background:value===f?'rgba(91,163,199,0.1)':'transparent', cursor:'pointer' }}
              onMouseEnter={e => { if(value!==f) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if(value!==f) e.currentTarget.style.background='transparent'; }}>
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const C = {
  blue:   '#5BA3C7',
  green:  '#5BC78A',
  dark:   '#EDE8DB',
  light:  'rgba(237,232,219,0.5)',
  border: 'rgba(255,255,255,0.08)',
  bg:     'rgba(255,255,255,0.06)',
  red:    '#C75B4E',
};

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 9,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#EDE8DB', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle = {
  fontSize: 11, fontWeight: 600, color: 'rgba(237,232,219,0.5)',
  marginBottom: 5, display: 'block',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

export default function ProfilPro() {
  const { startCheckout, openPortal, loading: stripeLoading, error: stripeError } = useStripe();
  const { plan: currentPlan } = usePlan();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '',
    company_name: '', siret: '', forme_juridique: '',
    tva_intracommunautaire: '', adresse: '', code_postal: '', ville: '',
    iban: '', avatar_url: '',
  });
  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview,   setPhotoPreview]   = useState(null);
  const fileRef = useRef(null);

  // FIX : suppression de compte
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput,       setDeleteInput]       = useState('');
  const [deleting,          setDeleting]          = useState(false);
  const [deleteError,       setDeleteError]       = useState('');

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Le fichier doit être une image (JPG, PNG, WebP).'); return; }
    if (file.size > 2 * 1024 * 1024) { setError("L'image ne doit pas dépasser 2 Mo."); return; }
    setError(''); setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const ext  = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: upErr } = await supabasePro.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabasePro.storage.from('avatars').getPublicUrl(path);
      const avatar_url = urlData.publicUrl + '?t=' + Date.now();
      await supabasePro.from('user_profiles').upsert({ id: user.id, avatar_url });
      setForm(f => ({ ...f, avatar_url }));
      setPhotoPreview(avatar_url);
      window.dispatchEvent(new CustomEvent('avatar_updated', { detail: { url: avatar_url } }));
    } catch (e) {
      setError('Erreur upload : ' + e.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

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

  // FIX : suppression compte + profil
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'SUPPRIMER') {
      setDeleteError('Tapez exactement SUPPRIMER pour confirmer.');
      return;
    }
    setDeleting(true); setDeleteError('');
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      if (!user) throw new Error('Utilisateur non trouvé.');

      // 1. Supprimer le profil
      await supabasePro.from('user_profiles').delete().eq('id', user.id);

      // 2. Supprimer l'avatar du storage
      try {
        await supabasePro.storage.from('avatars').remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`]);
      } catch (_) { /* ignorer si pas d'avatar */ }

      // 3. Déconnecter
      await supabasePro.auth.signOut();

      // 4. Appeler la route API pour supprimer auth.users (nécessite service role)
      await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      // 5. Rediriger vers l'accueil
      navigate('/');
    } catch (e) {
      setDeleteError('Erreur lors de la suppression : ' + e.message);
      setDeleting(false);
    }
  };

  const initiales = [form.first_name?.[0], form.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.light, fontSize: 13 }}>Chargement…</div>
  );

  const cardStyle = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, marginBottom:16 };
  const sectionTitle = (icon, label) => (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
      <div style={{ width:28, height:28, borderRadius:8, background:`${C.blue}15`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {icon}
      </div>
      <span style={{ fontSize:12, fontWeight:700, color:'rgba(237,232,219,0.7)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Nunito Sans', sans-serif", padding:'32px 28px', maxWidth:720, margin:'0 auto' }}>

      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:26, fontWeight:600, color:'#EDE8DB', margin:0 }}>
          Mon profil pro
        </h1>
        <p style={{ fontSize:13, color:C.light, marginTop:4 }}>
          Ces informations apparaîtront automatiquement sur vos devis et factures générés.
        </p>
      </div>

      {/* Photo de profil */}
      <div style={cardStyle}>
        {sectionTitle(<Camera size={13} color={C.blue}/>, 'Photo de profil')}
        <div style={{ display:'flex', alignItems:'center', gap:24 }}>
          <div onClick={() => !uploadingPhoto && fileRef.current?.click()}
            style={{ width:100, height:100, borderRadius:16, flexShrink:0, background:photoPreview?'transparent':`${C.blue}15`, border:`2px dashed ${photoPreview?C.blue:'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:uploadingPhoto?'wait':'pointer', overflow:'hidden', position:'relative', transition:'all 200ms ease' }}
            onMouseEnter={e => { if (!uploadingPhoto) e.currentTarget.style.borderColor=C.blue; }}
            onMouseLeave={e => { if (!photoPreview) e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; }}>
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="Photo" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 200ms' }}
                  onMouseEnter={e => e.currentTarget.style.opacity=1}
                  onMouseLeave={e => e.currentTarget.style.opacity=0}>
                  <Camera size={20} color="#fff"/>
                </div>
              </>
            ) : uploadingPhoto ? (
              <div style={{ fontSize:11, color:C.light, textAlign:'center', padding:8 }}>Upload…</div>
            ) : (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:28, fontWeight:700, color:C.blue, lineHeight:1 }}>{initiales}</div>
                <div style={{ fontSize:10, color:C.light, marginTop:6 }}>Cliquer</div>
              </div>
            )}
          </div>
          <div>
            <p style={{ fontSize:13, color:'#EDE8DB', fontWeight:600, marginBottom:6 }}>{photoPreview?'Modifier la photo':'Ajouter une photo'}</p>
            <p style={{ fontSize:12, color:C.light, marginBottom:14, lineHeight:1.5 }}>JPG, PNG ou WebP · Max 2 Mo<br/>Apparaît sur votre bureau et vos documents.</p>
            <button onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:9, border:`1px solid ${C.blue}`, background:`${C.blue}10`, color:C.blue, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
              <Upload size={13}/>
              {uploadingPhoto ? 'Upload en cours…' : 'Choisir une image'}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display:'none' }} onChange={handlePhotoChange}/>
          </div>
        </div>
      </div>

      {/* Identité */}
      <div style={cardStyle}>
        {sectionTitle(<User size={13} color={C.blue}/>, 'Identité')}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div><label style={labelStyle}>Prénom</label><input value={form.first_name||''} onChange={set('first_name')} style={inputStyle} placeholder="Jean"/></div>
          <div><label style={labelStyle}>Nom</label><input value={form.last_name||''} onChange={set('last_name')} style={inputStyle} placeholder="Dupont"/></div>
          <div><label style={labelStyle}>Téléphone</label><input value={form.phone||''} onChange={set('phone')} style={inputStyle} placeholder="06 00 00 00 00"/></div>
        </div>
      </div>

      {/* Entreprise */}
      <div style={cardStyle}>
        {sectionTitle(<Building2 size={13} color={C.blue}/>, 'Entreprise')}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div><label style={labelStyle}>Raison sociale</label><input value={form.company_name||''} onChange={set('company_name')} style={inputStyle} placeholder="SARL Dupont"/></div>
          <div>
            <label style={labelStyle}>Forme juridique</label>
            <CustomSelectForme value={form.forme_juridique||''} onChange={(v) => setForm(f => ({...f, forme_juridique: v}))} />
          </div>
          <div><label style={labelStyle}>SIRET</label><input value={form.siret||''} onChange={set('siret')} style={inputStyle} placeholder="000 000 000 00000"/></div>
          <div><label style={labelStyle}>N° TVA intracommunautaire</label><input value={form.tva_intracommunautaire||''} onChange={set('tva_intracommunautaire')} style={inputStyle} placeholder="FR00000000000"/></div>
        </div>
      </div>

      {/* Adresse */}
      <div style={cardStyle}>
        {sectionTitle(<MapPin size={13} color={C.blue}/>, 'Adresse')}
        <div style={{ display:'grid', gap:14 }}>
          <div><label style={labelStyle}>Adresse</label><input value={form.adresse||''} onChange={set('adresse')} style={inputStyle} placeholder="1 rue de la Paix"/></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:14 }}>
            <div><label style={labelStyle}>Code postal</label><input value={form.code_postal||''} onChange={set('code_postal')} style={inputStyle} placeholder="75001"/></div>
            <div><label style={labelStyle}>Ville</label><input value={form.ville||''} onChange={set('ville')} style={inputStyle} placeholder="Paris"/></div>
          </div>
        </div>
      </div>

      {/* Bancaire */}
      <div style={{ ...cardStyle, marginBottom:24 }}>
        {sectionTitle(<CreditCard size={13} color={C.blue}/>, 'Coordonnées bancaires')}
        <div><label style={labelStyle}>IBAN</label><input value={form.iban||''} onChange={set('iban')} style={inputStyle} placeholder="FR76 0000 0000 0000 0000 0000 000"/></div>
        <p style={{ fontSize:11, color:C.light, marginTop:8 }}>ℹ️ L'IBAN apparaîtra en bas de vos devis pour faciliter le paiement.</p>
      </div>

      {/* Abonnement */}
      <div style={{ ...cardStyle, marginBottom:24 }}>
        {sectionTitle(<Zap size={13} color={C.blue}/>, 'Mon abonnement')}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:12, color:C.light, marginBottom:3 }}>Plan actuel</div>
            <div style={{ fontSize:16, fontWeight:700, color:'#EDE8DB' }}>
              {PLANS[currentPlan]?.label || 'Gratuit'}
              <span style={{ fontSize:12, fontWeight:400, color:C.light, marginLeft:8 }}>{PLANS[currentPlan]?.price || '0 €/mois'}</span>
            </div>
          </div>
          <div style={{ width:10, height:10, borderRadius:'50%', background:currentPlan==='gratuit'?'rgba(237,232,219,0.2)':C.green }}/>
        </div>

        {currentPlan === 'gratuit' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <p style={{ fontSize:12, color:C.light, marginBottom:8 }}>Passez à un plan payant pour accéder aux modules de gestion.</p>
            {['starter','pro','premium'].map(p => (
              <button key={p} onClick={() => startCheckout(p)} disabled={stripeLoading}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderRadius:9, border:`1px solid ${PLANS[p]?.color}40`, background:`${PLANS[p]?.color}08`, color:PLANS[p]?.color, fontSize:13, fontWeight:700, cursor:stripeLoading?'wait':'pointer', fontFamily:'inherit' }}>
                <span>{PLANS[p]?.label} — {PLANS[p]?.price}</span>
                {stripeLoading ? <Loader size={13} style={{ animation:'spin 1s linear infinite' }}/> : <ExternalLink size={13}/>}
              </button>
            ))}
          </div>
        )}

        {currentPlan !== 'gratuit' && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={openPortal} disabled={stripeLoading}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'11px 16px', borderRadius:9, border:`1px solid ${C.blue}`, background:`${C.blue}10`, color:C.blue, fontSize:13, fontWeight:700, cursor:stripeLoading?'wait':'pointer', fontFamily:'inherit' }}>
              {stripeLoading ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }}/> Redirection…</> : <><ExternalLink size={13}/> Gérer mon abonnement (CB, factures, annulation)</>}
            </button>
            <p style={{ fontSize:11, color:C.light, textAlign:'center' }}>Vous serez redirigé vers le portail sécurisé Stripe.</p>
          </div>
        )}

        {stripeError && <div style={{ fontSize:12, color:C.red, marginTop:8, padding:'8px 12px', background:'rgba(199,91,78,0.07)', borderRadius:8 }}>{stripeError}</div>}
      </div>

      {error && <div style={{ color:C.red, fontSize:12, marginBottom:12, padding:'8px 12px', background:'rgba(199,91,78,0.07)', borderRadius:8, border:'1px solid rgba(199,91,78,0.2)' }}>{error}</div>}

      <button onClick={handleSave} disabled={saving}
        style={{ width:'100%', padding:'13px', borderRadius:11, border:'none', background:saved?C.green:C.blue, color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background 0.3s ease', fontFamily:'inherit', marginBottom:32 }}>
        {saved ? <><CheckCircle size={16}/> Profil enregistré !</> : saving ? 'Enregistrement…' : <><Save size={16}/> Enregistrer mon profil</>}
      </button>

      {/* FIX : Zone suppression compte */}
      <div style={{ background:'rgba(199,91,78,0.04)', border:'1px solid rgba(199,91,78,0.15)', borderRadius:16, padding:24, marginBottom:16 }}>
        {sectionTitle(<Trash2 size={13} color={C.red}/>, 'Zone de danger')}

        {!showDeleteConfirm ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <p style={{ fontSize:13, color:'#EDE8DB', fontWeight:600, marginBottom:4 }}>Supprimer mon compte</p>
              <p style={{ fontSize:12, color:C.light, margin:0 }}>Supprime définitivement votre compte, profil et toutes vos données.</p>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:9, border:`1px solid ${C.red}`, background:'rgba(199,91,78,0.08)', color:C.red, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              <Trash2 size={13}/> Supprimer mon compte
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'10px 14px', background:'rgba(199,91,78,0.1)', borderRadius:10, border:'1px solid rgba(199,91,78,0.2)' }}>
              <AlertTriangle size={15} color={C.red}/>
              <p style={{ fontSize:12, color:C.red, margin:0, fontWeight:600 }}>
                Action irréversible — toutes vos données seront supprimées définitivement.
              </p>
            </div>
            <p style={{ fontSize:12, color:C.light, marginBottom:10 }}>
              Tapez <strong style={{ color:'#EDE8DB' }}>SUPPRIMER</strong> pour confirmer :
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="SUPPRIMER"
              style={{ ...inputStyle, marginBottom:12, border:'1px solid rgba(199,91,78,0.3)' }}
            />
            {deleteError && <p style={{ fontSize:11, color:C.red, marginBottom:10 }}>{deleteError}</p>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeleteError(''); }}
                style={{ flex:1, padding:'10px', borderRadius:9, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:C.light, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Annuler
              </button>
              <button onClick={handleDeleteAccount} disabled={deleting || deleteInput !== 'SUPPRIMER'}
                style={{ flex:1, padding:'10px', borderRadius:9, border:'none', background:deleteInput==='SUPPRIMER'?C.red:'rgba(199,91,78,0.2)', color:'#fff', fontSize:13, fontWeight:700, cursor:deleteInput==='SUPPRIMER'?'pointer':'not-allowed', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {deleting ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }}/> Suppression…</> : <><Trash2 size={13}/> Confirmer la suppression</>}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
