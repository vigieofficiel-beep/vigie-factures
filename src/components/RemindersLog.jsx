import { useState, useEffect, useCallback } from 'react';
import { Bell, X } from 'lucide-react';

const TYPE_CONFIG = {
  'j-7':    { label: 'J-7',    color: '#5BC78A', desc: 'Rappel 7 jours avant échéance' },
  'j-1':    { label: 'J-1',    color: '#C78A5B', desc: 'Rappel 1 jour avant échéance'  },
  'j+3':    { label: 'J+3',    color: '#C75B4E', desc: 'Retard 3 jours'                },
  'manuel': { label: 'Manuel', color: '#5BA3C7', desc: 'Relance manuelle'              },
};

export function RemindersLog({ sb, userId, context }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [open, setOpen]           = useState(false);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await sb
      .from('reminders')
      .select(`*, invoices(provider, invoice_date, due_date, amount_ttc)`)
      .eq('user_id', userId)
      .eq('context', context)
      .order('sent_at', { ascending: false })
      .limit(50);
    setReminders(data ?? []);
    setLoading(false);
  }, [userId, context]);

  useEffect(() => { fetch(); }, [fetch]);

  const deleteReminder = async (id) => {
    await sb.from('reminders').delete().eq('id', id);
    setReminders(r => r.filter(x => x.id !== id));
  };

  const unread = reminders.filter(r => {
    const age = Date.now() - new Date(r.sent_at).getTime();
    return age < 24 * 60 * 60 * 1000; // moins de 24h = nouveau
  }).length;

  return (
    <div style={{ position:'relative' }}>

      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:'relative', background:'rgba(255,255,255,0.04)',
          border:'1px solid rgba(255,255,255,0.08)', borderRadius:8,
          padding:'6px 10px', cursor:'pointer', color:'#EDE8DB',
          display:'flex', alignItems:'center', gap:6,
        }}
      >
        <Bell size={14} color={unread > 0 ? '#5BC78A' : 'rgba(255,255,255,0.4)'} />
        <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>Relances</span>
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-6, right:-6,
            background:'#C75B4E', color:'#fff',
            borderRadius:10, padding:'1px 5px', fontSize:9, fontWeight:700,
          }}>
            {unread}
          </span>
        )}
      </button>

      {/* Panel déroulant */}
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 8px)', right:0, zIndex:100,
          width:360, maxHeight:400, overflowY:'auto',
          background:'#161513', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'#EDE8DB' }}>Journal des relances</span>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)' }}>
              <X size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding:24, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:11 }}>Chargement...</div>
          ) : reminders.length === 0 ? (
            <div style={{ padding:24, textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:11 }}>Aucune relance pour le moment</div>
          ) : (
            reminders.map(r => {
              const cfg = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.manuel;
              const inv = r.invoices;
              return (
                <div key={r.id} style={{
                  padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)',
                  display:'flex', gap:10, alignItems:'flex-start',
                }}>
                  <span style={{
                    background:`${cfg.color}18`, color:cfg.color,
                    borderRadius:6, padding:'2px 7px', fontSize:9,
                    fontWeight:700, whiteSpace:'nowrap', marginTop:2,
                  }}>
                    {cfg.label}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, color:'#EDE8DB', fontWeight:600, marginBottom:2 }}>
                      {inv?.provider ?? 'Fournisseur inconnu'}
                    </div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>
                      {cfg.desc}
                      {inv?.due_date && ` — échéance ${inv.due_date}`}
                    </div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.2)', marginTop:2 }}>
                      {new Date(r.sent_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReminder(r.id)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.2)', padding:0, flexShrink:0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}