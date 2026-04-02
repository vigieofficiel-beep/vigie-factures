import { useState } from 'react';
import { Folder, FolderOpen, Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

function FolderNode({ node, depth = 0, onDrop, onDelete, activeFolder, onSelect }) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const isActive = activeFolder === node.id;

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const invoiceId = e.dataTransfer.getData('invoiceId');
          if (invoiceId) onDrop(invoiceId, node.id);
        }}
        onClick={() => onSelect(isActive ? null : node.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: `5px 8px 5px ${12 + depth * 14}px`,
          borderRadius: 7, cursor: 'pointer',
          background: dragOver
            ? 'rgba(212,168,83,0.15)'
            : isActive
              ? 'rgba(212,168,83,0.08)'
              : 'transparent',
          border: dragOver
            ? '1px solid rgba(212,168,83,0.4)'
            : '1px solid transparent',
          transition: 'all 150ms',
          userSelect: 'none',
        }}
      >
        {/* Toggle enfants */}
        {node.children?.length > 0 ? (
          <span onClick={e => { e.stopPropagation(); setOpen(o => !o); }} style={{ color: 'rgba(255,255,255,0.3)', display:'flex' }}>
            {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </span>
        ) : (
          <span style={{ width: 10 }} />
        )}

        {open
          ? <FolderOpen size={13} color={node.color ?? '#5BC78A'} />
          : <Folder size={13} color={node.color ?? '#5BC78A'} />
        }

        <span style={{ fontSize: 11, color: isActive ? '#5BC78A' : 'rgba(255,255,255,0.6)', flex: 1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {node.name}
        </span>

        <button
          onClick={e => { e.stopPropagation(); onDelete(node.id); }}
          style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.15)', padding:0, display:'flex', opacity:0 }}
          className="delete-btn"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {open && node.children?.map(child => (
        <FolderNode
          key={child.id}
          node={child}
          depth={depth + 1}
          onDrop={onDrop}
          onDelete={onDelete}
          activeFolder={activeFolder}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function FolderTree({ tree, onDrop, onDelete, onCreate, activeFolder, onSelect }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setAdding(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 12, padding: 12, marginBottom: 16,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:1 }}>
          Dossiers
        </span>
        <button
          onClick={() => setAdding(a => !a)}
          style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', display:'flex', padding:2 }}
        >
          <Plus size={13} />
        </button>
      </div>

      {/* Tous les documents */}
      <div
        onClick={() => onSelect(null)}
        style={{
          display:'flex', alignItems:'center', gap:6,
          padding:'5px 8px', borderRadius:7, cursor:'pointer',
          background: activeFolder === null ? 'rgba(212,168,83,0.08)' : 'transparent',
          marginBottom:4,
        }}
      >
        <Folder size={13} color="rgba(255,255,255,0.3)" />
        <span style={{ fontSize:11, color: activeFolder === null ? '#5BC78A' : 'rgba(255,255,255,0.4)' }}>
          Tous les documents
        </span>
      </div>

      {tree.map(node => (
        <FolderNode
          key={node.id}
          node={node}
          onDrop={onDrop}
          onDelete={onDelete}
          activeFolder={activeFolder}
          onSelect={onSelect}
        />
      ))}

      {adding && (
        <div style={{ display:'flex', gap:6, marginTop:8 }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Nom du dossier..."
            style={{
              flex:1, background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(212,168,83,0.15)',
              borderRadius:6, padding:'5px 8px',
              color:'#EDE8DB', fontSize:11, outline:'none',
              fontFamily:"'Nunito Sans', sans-serif",
            }}
          />
          <button
            onClick={handleCreate}
            style={{ background:'rgba(212,168,83,0.15)', border:'1px solid rgba(212,168,83,0.15)', borderRadius:6, padding:'5px 10px', cursor:'pointer', color:'#5BC78A', fontSize:11 }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}