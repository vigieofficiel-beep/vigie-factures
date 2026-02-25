import { DEFAULT_FILTERS } from '../hooks/useInvoiceFilters';

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '6px 10px',
  color: '#EDE8DB',
  fontSize: 11,
  fontFamily: "'Nunito Sans', sans-serif",
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
};

export function FilterBar({ filters, onUpdate, onReset, resultCount }) {
  const hasActive = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>

        {/* Recherche */}
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={filters.search}
          onChange={e => onUpdate('search', e.target.value)}
          style={{ ...inputStyle, minWidth: 180 }}
        />

        {/* Statut */}
        <select value={filters.status} onChange={e => onUpdate('status', e.target.value)} style={selectStyle}>
          <option value="all">Tous statuts</option>
          <option value="recu">Reçu</option>
          <option value="a_valider">À valider</option>
          <option value="a_payer">À payer</option>
          <option value="paye">Payé</option>
          <option value="litige">Litige</option>
        </select>

        {/* Fréquence */}
        <select value={filters.freq} onChange={e => onUpdate('freq', e.target.value)} style={selectStyle}>
          <option value="all">Toutes fréq.</option>
          <option value="mensuel">Mensuel</option>
          <option value="annuel">Annuel</option>
          <option value="ponctuel">Ponctuel</option>
        </select>

        {/* Dates */}
        <input type="date" value={filters.dateFrom} onChange={e => onUpdate('dateFrom', e.target.value)} style={inputStyle} title="Date début" />
        <span style={{ color:'rgba(255,255,255,0.2)', fontSize:11 }}>→</span>
        <input type="date" value={filters.dateTo} onChange={e => onUpdate('dateTo', e.target.value)} style={inputStyle} title="Date fin" />

        {/* Montants */}
        <input
          type="number"
          placeholder="Min €"
          value={filters.amountMin}
          onChange={e => onUpdate('amountMin', e.target.value)}
          style={{ ...inputStyle, width: 70 }}
        />
        <input
          type="number"
          placeholder="Max €"
          value={filters.amountMax}
          onChange={e => onUpdate('amountMax', e.target.value)}
          style={{ ...inputStyle, width: 70 }}
        />

        {/* Tri */}
        <select value={filters.sortBy} onChange={e => onUpdate('sortBy', e.target.value)} style={selectStyle}>
          <option value="invoice_date">Date</option>
          <option value="amount_ttc">Montant</option>
          <option value="provider">Fournisseur</option>
        </select>
        <button
          onClick={() => onUpdate('sortDir', filters.sortDir === 'desc' ? 'asc' : 'desc')}
          style={{ ...inputStyle, cursor:'pointer', padding:'6px 10px' }}
          title="Inverser le tri"
        >
          {filters.sortDir === 'desc' ? '↓' : '↑'}
        </button>

        {/* Reset */}
        {hasActive && (
          <button
            onClick={onReset}
            style={{ ...inputStyle, cursor:'pointer', color:'#C75B4E', borderColor:'rgba(199,91,78,0.3)', padding:'6px 12px' }}
          >
            ✕ Réinitialiser
          </button>
        )}

        {/* Compteur */}
        <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)', marginLeft:'auto' }}>
          {resultCount} résultat{resultCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}