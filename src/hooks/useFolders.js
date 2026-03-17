import { useState, useEffect, useCallback, useMemo } from 'react';

function buildTree(flat, parentId = null) {
  return flat
    .filter(f => f.parent_id === parentId)
    .map(f => ({ ...f, children: buildTree(flat, f.id) }));
}

export function useFolders(sb, userId, context) {
  const [folders, setFolders] = useState([]);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await sb
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .eq('context', context)
      .order('name');
    setFolders(data ?? []);
  }, [userId, context]);

  useEffect(() => { fetch(); }, [fetch]);

  const tree = useMemo(() => buildTree(folders), [folders]);

  const create = async (name, parentId = null, color = '#5BC78A') => {
    await sb.from('folders').insert({
      user_id: userId, context, name, parent_id: parentId, color
    });
    fetch();
  };

  const rename = async (id, name) => {
    await sb.from('folders').update({ name }).eq('id', id);
    fetch();
  };

  const remove = async (id) => {
    await sb.from('folders').delete().eq('id', id);
    fetch();
  };

  const moveInvoice = async (invoiceId, folderId) => {
    await sb.from('invoices')
      .update({ folder_id: folderId })
      .eq('id', invoiceId);
  };

  return { folders, tree, create, rename, remove, moveInvoice, refresh: fetch };
}