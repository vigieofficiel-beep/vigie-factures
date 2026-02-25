const STATUS_CONFIG = {
  recu:      { label: 'Reçu',      color: '#5BA3C7', bg: 'rgba(91,163,199,0.12)'  },
  a_valider: { label: 'À valider', color: '#D4A853', bg: 'rgba(212,168,83,0.12)'  },
  a_payer:   { label: 'À payer',   color: '#C78A5B', bg: 'rgba(199,138,91,0.12)'  },
  paye:      { label: 'Payé',      color: '#5BC78A', bg: 'rgba(91,199,138,0.12)'  },
  litige:    { label: 'Litige',    color: '#C75B4E', bg: 'rgba(199,91,78,0.12)'   },
};

export function StatusBadge({ status, onChange }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.recu;
  return (
    <select
      value={status ?? 'recu'}
      onChange={e => onChange?.(e.target.value)}
      onClick={e => e.stopPropagation()}
      style={{
        background:   cfg.bg,
        color:        cfg.color,
        border:       `1px solid ${cfg.color}40`,
        borderRadius: 20,
        padding:      '3px 10px',
        fontSize:     10,
        fontWeight:   700,
        cursor:       'pointer',
        fontFamily:   "'Nunito Sans', sans-serif",
        outline:      'none',
      }}
    >
      {Object.entries(STATUS_CONFIG).map(([v, c]) => (
        <option key={v} value={v} style={{ background: '#161513', color: c.color }}>
          {c.label}
        </option>
      ))}
    </select>
  );
}