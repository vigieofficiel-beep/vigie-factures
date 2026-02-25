import { useState, useEffect, useCallback } from 'react';

export const QUOTA_LIMITS = {
  free:       { ocr: 10,   storageMb: 50,    fileMb: 5  },
  pro:        { ocr: 200,  storageMb: 2048,  fileMb: 25 },
  enterprise: { ocr: 9999, storageMb: 20480, fileMb: 50 },
};

export function useQuota(sb, userId) {
  const [quota, setQuota] = useState(null);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await sb
      .from('user_quotas')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!data) {
      const { data: created } = await sb
        .from('user_quotas')
        .insert({ user_id: userId })
        .select()
        .single();
      setQuota(created);
    } else {
      setQuota(data);
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  const limits = quota ? QUOTA_LIMITS[quota.plan] : QUOTA_LIMITS.free;

  return {
    quota,
    limits,
    ocrPct:     quota ? (quota.ocr_month / limits.ocr) * 100 : 0,
    storagePct: quota ? (quota.storage_bytes / (limits.storageMb * 1024 * 1024)) * 100 : 0,
    canUpload: (file) => {
      if (!quota) return { ok: false, reason: 'loading' };
      if (file.size > limits.fileMb * 1024 * 1024) return { ok: false, reason: 'size', limit: limits.fileMb };
      if (quota.ocr_month >= limits.ocr)           return { ok: false, reason: 'ocr',  limit: limits.ocr  };
      if (quota.storage_bytes >= limits.storageMb * 1024 * 1024) return { ok: false, reason: 'storage' };
      return { ok: true };
    },
    refresh: fetch,
  };
}