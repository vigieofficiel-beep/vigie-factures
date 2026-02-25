export function useInvoiceStatus(sb) {
  const updateStatus = async (invoiceId, status) => {
    const patch = { status };
    if (status === 'paye') patch.paid_at = new Date().toISOString();
    const { error } = await sb
      .from('invoices')
      .update(patch)
      .eq('id', invoiceId);
    if (error) console.error('updateStatus error:', error);
    return !error;
  };

  return { updateStatus };
}