import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabasePro } from '../lib/supabasePro';

function getClient(mode) {
  return mode === 'pro' ? supabasePro : supabase;
}

export function ProfileAvatar({ mode, size = 32 }) {
  const sb = useRef(getClient(mode)).current;
  const [user, setUser]         = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState(null);
  const fileInputRef            = useRef(null);
  const menuRef                 = useRef(null);

  // Ferme le menu si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Charge user + avatar depuis DB
  useEffect(() => {
  sb.auth.getUser().then(({ data }) => {
    const u = data?.user;
    if (!u) return;
    setUser(u);
    sb.from('user_profiles')
      .select('avatar_url')
      .eq('id', u.id)
      .single()
      .then(({ data: profile }) => {
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      });
  });

  // Écouter les mises à jour depuis ProfilPro
  const onUpdate = (e) => setAvatarUrl(e.detail.url);
  window.addEventListener('avatar_updated', onUpdate);
  return () => window.removeEventListener('avatar_updated', onUpdate);
}, []);

  const accentColor = mode === 'pro' ? '#5BA3C7' : '#5BC78A';
  const gradientBg  = mode === 'pro'
    ? 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(91,163,199,0.2))'
    : 'linear-gradient(135deg, rgba(212,168,83,0.15), rgba(199,138,91,0.2))';
  const userInitial = user?.email?.[0]?.toUpperCase() ?? '?';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) { setError('Format non supporté (PNG, JPG, WebP)'); return; }
    if (file.size > 3 * 1024 * 1024) { setError('Fichier trop lourd (max 3 Mo)'); return; }

    setError(null);
    setUploading(true);
    setMenuOpen(false);

    const { data: { session } } = await sb.auth.getSession();
    if (!session) { setError('Non connecté'); setUploading(false); return; }

    try {
      const ext  = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: upErr } = await sb.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: publicData } = sb.storage
        .from('avatars')
        .getPublicUrl(path);

      const url = `${publicData.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await sb.from('user_profiles').upsert({
        id: user.id,
        avatar_url: url,
        updated_at: new Date().toISOString(),
      });
      if (dbErr) throw dbErr;

      setAvatarUrl(url);
    } catch (err) {
      setError('Erreur : ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!user) return;
    try {
      for (const ext of ['png', 'jpg', 'jpeg', 'webp'])
        await sb.storage.from('avatars').remove([`${user.id}/avatar.${ext}`]);
      const { error: dbErr } = await sb.from('user_profiles').upsert({
        id: user.id,
        avatar_url: null,
        updated_at: new Date().toISOString(),
      });
      if (dbErr) throw dbErr;
      setAvatarUrl(null);
    } catch (err) {
      setError('Erreur suppression : ' + err.message);
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <input
        ref={fileInputRef} type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button
        onClick={() => setMenuOpen(o => !o)}
        title="Photo de profil"
        style={{
          width: size, height: size, borderRadius: '50%',
          border: `2px solid ${menuOpen ? accentColor : 'rgba(255,255,255,0.15)'}`,
          background: avatarUrl ? 'transparent' : gradientBg,
          cursor: 'pointer', padding: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 150ms', opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? (
          <div style={{
            width: Math.round(size * 0.4), height: Math.round(size * 0.4),
            border: `2px solid ${accentColor}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'avatarSpin 0.8s linear infinite',
          }} />
        ) : avatarUrl ? (
          <img src={avatarUrl} alt="avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: Math.round(size * 0.35), fontWeight: 700, color: accentColor }}>
            {userInitial}
          </span>
        )}
      </button>

      {menuOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)', zIndex: 200,
          background: '#161513', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          minWidth: 180, overflow: 'hidden',
        }}>
          <button
            onClick={() => { setMenuOpen(false); fileInputRef.current?.click(); }}
            style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none',
              cursor: 'pointer', color: '#EDE8DB', fontSize: 12, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            📷 Importer une photo...
          </button>
          {avatarUrl && (
            <button
              onClick={handleDelete}
              style={{ width: '100%', padding: '10px 14px', background: 'none',
                border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer', color: '#C75B4E', fontSize: 12, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(199,91,78,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              🗑️ Supprimer la photo
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)', zIndex: 200,
          background: 'rgba(199,91,78,0.12)', border: '1px solid rgba(199,91,78,0.3)',
          borderRadius: 8, padding: '8px 12px', fontSize: 11,
          color: '#C75B4E', whiteSpace: 'nowrap',
        }}>
          {error}
          <button onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C75B4E', marginLeft: 6 }}>
            ✕
          </button>
        </div>
      )}

      <style>{`@keyframes avatarSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
