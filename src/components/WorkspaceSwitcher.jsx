import { useState } from 'react';
import { Building2, Plus, Check, ChevronDown, X, Loader, Trash2, Pencil } from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace.jsx';
import { usePlan } from '../hooks/usePlan.jsx';
import { supabasePro } from '../lib/supabasePro';

export default function WorkspaceSwitcher({ isOpen }) {
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace, deleteWorkspace, reload } = useWorkspace();
  const { plan } = usePlan();
  const [showMenu,   setShowMenu]   = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [deleting,   setDeleting]   = useState(null);
  const [renaming,   setRenaming]   = useState(null); // id du bureau en cours de renommage
  const [renamVal,   setRenamVal]   = useState('');
  const [savingRen,  setSavingRen]  = useState(false);
  const [error,      setError]      = useState('');

  const isPremium = plan === 'premium';

  const handleSwitch = (ws) => {
    switchWorkspace(ws);
    setShowMenu(false);
    window.dispatchEvent(new CustomEvent('workspace_changed', { detail: { workspaceId: ws.id } }));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true); setError('');
    try {
      const ws = await createWorkspace(newName.trim());
      handleSwitch(ws);
      setNewName('');
      setShowCreate(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e, ws) => {
    e.stopPropagation();
    if (workspaces.length === 1) return;
    if (!confirm(`Supprimer le bureau "${ws.name}" ? Les données associées ne seront pas supprimées.`)) return;
    setDeleting(ws.id);
    try {
      await deleteWorkspace(ws.id);
      if (activeWorkspace?.id === ws.id) {
        const remaining = workspaces.filter(w => w.id !== ws.id);
        if (remaining.length > 0) handleSwitch(remaining[0]);
      }
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setDeleting(null);
    }
  };

  // FIX : renommer un bureau
  const startRename = (e, ws) => {
    e.stopPropagation();
    setRenaming(ws.id);
    setRenamVal(ws.name);
  };

  const handleRename = async (ws) => {
    if (!renamVal.trim() || renamVal.trim() === ws.name) { setRenaming(null); return; }
    setSavingRen(true);
    try {
      await supabasePro.from('workspaces').update({ name: renamVal.trim() }).eq('id', ws.id);
      await reload();
      // Mettre à jour le workspace actif si c'est celui-là
      if (activeWorkspace?.id === ws.id) {
        switchWorkspace({ ...ws, name: renamVal.trim() });
      }
    } catch (e) {
      alert('Erreur : ' + e.message);
    } finally {
      setSavingRen(false);
      setRenaming(null);
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div style={{ position:'relative', width:'100%', marginBottom:4 }}>
      <button
        onClick={() => { if (!isOpen) return; setShowMenu(v => !v); }}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'9px 8px', borderRadius:10, border:'none', background:showMenu&&isOpen?'rgba(91,163,199,0.1)':'transparent', cursor:isOpen?'pointer':'default', transition:'background 150ms ease' }}
        onMouseEnter={e => { if (isOpen && !showMenu) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
        onMouseLeave={e => { if (!showMenu) e.currentTarget.style.background='transparent'; }}
      >
        <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:'rgba(91,163,199,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Building2 size={15} color="#5BA3C7" strokeWidth={2}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flex:1, opacity:isOpen?1:0, transition:'opacity 150ms ease', minWidth:0 }}>
          <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.65)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {activeWorkspace.name}
          </span>
          <ChevronDown size={13} color="rgba(255,255,255,0.3)" style={{ transform:showMenu?'rotate(0deg)':'rotate(-90deg)', transition:'transform 200ms', flexShrink:0 }}/>
        </div>
      </button>

      {showMenu && isOpen && (
        <div style={{ position:'absolute', bottom:'calc(100% + 4px)', left:0, right:0, background:'rgba(15,23,42,0.98)', backdropFilter:'blur(20px)', border:'1px solid rgba(91,163,199,0.2)', borderRadius:14, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', overflow:'hidden', zIndex:200 }}>
          <div style={{ padding:8 }}>
            {workspaces.map(ws => {
              const isActive = activeWorkspace.id === ws.id;
              const isLast   = workspaces.length === 1;
              const isRenaming = renaming === ws.id;

              return (
                <div key={ws.id} style={{ marginBottom:2 }}>
                  {isRenaming ? (
                    // Mode renommage inline
                    <div style={{ display:'flex', gap:6, padding:'4px 2px', alignItems:'center' }}>
                      <input
                        autoFocus
                        value={renamVal}
                        onChange={e => setRenamVal(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') handleRename(ws); if (e.key==='Escape') setRenaming(null); }}
                        style={{ flex:1, padding:'7px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(91,163,199,0.3)', color:'#EDE8DB', fontSize:12, outline:'none', fontFamily:'inherit' }}
                      />
                      <button onClick={() => handleRename(ws)} disabled={savingRen}
                        style={{ width:28, height:28, borderRadius:7, border:'none', background:'#5BA3C7', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {savingRen ? <Loader size={11} style={{ animation:'spin 1s linear infinite' }}/> : <Check size={11}/>}
                      </button>
                      <button onClick={() => setRenaming(null)}
                        style={{ width:28, height:28, borderRadius:7, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <X size={11}/>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <button
                        onClick={() => handleSwitch(ws)}
                        style={{ flex:1, display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:8, border:'none', background:isActive?'rgba(91,163,199,0.1)':'transparent', cursor:'pointer', transition:'background 150ms', fontFamily:'inherit' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; }}
                      >
                        <div style={{ width:28, height:28, borderRadius:7, background:'rgba(91,163,199,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Building2 size={13} color="#5BA3C7"/>
                        </div>
                        <span style={{ fontSize:13, color:'rgba(237,232,219,0.8)', flex:1, textAlign:'left', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ws.name}</span>
                        {isActive && <Check size={13} color="#5BA3C7"/>}
                      </button>
                      {/* Bouton renommer — toujours visible */}
                      <button
                        onClick={e => startRename(e, ws)}
                        title={`Renommer "${ws.name}"`}
                        style={{ width:28, height:28, borderRadius:7, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(237,232,219,0.2)', flexShrink:0, transition:'all 150ms' }}
                        onMouseEnter={e => e.currentTarget.style.color='#5BA3C7'}
                        onMouseLeave={e => e.currentTarget.style.color='rgba(237,232,219,0.2)'}
                      >
                        <Pencil size={11}/>
                      </button>
                      {!isLast && (
                        <button
                          onClick={e => handleDelete(e, ws)}
                          disabled={deleting === ws.id}
                          title={`Supprimer "${ws.name}"`}
                          style={{ width:28, height:28, borderRadius:7, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(237,232,219,0.2)', flexShrink:0, transition:'all 150ms' }}
                          onMouseEnter={e => e.currentTarget.style.color='#C75B4E'}
                          onMouseLeave={e => e.currentTarget.style.color='rgba(237,232,219,0.2)'}
                        >
                          {deleting === ws.id ? <Loader size={11} style={{ animation:'spin 1s linear infinite' }}/> : <Trash2 size={11}/>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'0 8px' }}/>

          <div style={{ padding:8 }}>
            {!isPremium ? (
              <div style={{ padding:'8px 10px', fontSize:11, color:'rgba(237,232,219,0.3)', textAlign:'center', lineHeight:1.5 }}>
                Multi-bureaux disponible<br/>avec le plan <span style={{ color:'#A85BC7', fontWeight:700 }}>Premium</span>
              </div>
            ) : showCreate ? (
              <div style={{ padding:'4px 2px' }}>
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') handleCreate(); if (e.key==='Escape') { setShowCreate(false); setNewName(''); } }}
                  placeholder="Nom du bureau..."
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(91,163,199,0.3)', color:'#EDE8DB', fontSize:12, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
                />
                {error && <div style={{ fontSize:10, color:'#C75B4E', marginTop:4 }}>{error}</div>}
                <div style={{ display:'flex', gap:6, marginTop:6 }}>
                  <button onClick={handleCreate} disabled={creating || !newName.trim()}
                    style={{ flex:1, padding:'7px', borderRadius:7, border:'none', background:'#5BA3C7', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    {creating ? <Loader size={11} style={{ animation:'spin 1s linear infinite' }}/> : <Check size={11}/>}
                    Créer
                  </button>
                  <button onClick={() => { setShowCreate(false); setNewName(''); }}
                    style={{ padding:'7px 10px', borderRadius:7, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.4)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
                    <X size={11}/>
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCreate(true)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'9px 10px', borderRadius:8, border:'1px dashed rgba(91,163,199,0.3)', background:'rgba(91,163,199,0.04)', cursor:'pointer', fontFamily:'inherit', transition:'all 150ms' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(91,163,199,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(91,163,199,0.04)'}>
                <Plus size={13} color="#5BA3C7"/>
                <span style={{ fontSize:12, color:'#5BA3C7', fontWeight:600 }}>Nouveau bureau</span>
              </button>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}
