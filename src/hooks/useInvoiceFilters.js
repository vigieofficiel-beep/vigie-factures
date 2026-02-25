import { useState, useCallback } from 'react';

export const DEFAULT_FILTERS = {
  search:    '',
  status:    'all',
  freq:      'all',
  dateFrom:  '',
  dateTo:    '',
  amountMin: '',
  amountMax: '',
  sortBy:    'invoice_date',
  sortDir:   'desc',
};

export function useInvoiceFilters() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const update = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
  }, []);

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const applyToData = useCallback((invoices) => {
    let result = [...invoices];

    // Recherche texte
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(i =>
        (i.provider ?? '').toLowerCase().includes(q) ||
        (i.invoice_number ?? '').toLowerCase().includes(q) ||
        (i.category ?? '').toLowerCase().includes(q) ||
        (i.raw_text ?? '').toLowerCase().includes(q)
      );
    }

    // Statut
    if (filters.status !== 'all') {
      result = result.filter(i => i.status === filters.status);
    }

    // Fréquence
    if (filters.freq !== 'all') {
      result = result.filter(i => i.frequency === filters.freq);
    }

    // Dates
    if (filters.dateFrom) {
      result = result.filter(i => i.invoice_date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter(i => i.invoice_date <= filters.dateTo);
    }

    // Montants
    if (filters.amountMin !== '') {
      result = result.filter(i => (i.amount_ttc ?? 0) >= +filters.amountMin);
    }
    if (filters.amountMax !== '') {
      result = result.filter(i => (i.amount_ttc ?? 0) <= +filters.amountMax);
    }

    // Tri
    result.sort((a, b) => {
      const av = a[filters.sortBy] ?? '';
      const bv = b[filters.sortBy] ?? '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return filters.sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [filters]);

  return { filters, update, reset, applyToData };
}