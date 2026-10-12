// hooks/useDocumentDrafts.js
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveDraft,
  getDraftsByCustomer,
  deleteDraft,
  newDraftId,
} from '../utils/draftStore';

export function useDocumentDrafts(customerId) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Keep a map of draftId -> objectURL so we can revoke on unmount/delete
  const urlMapRef = useRef(new Map());

  // Load existing drafts for this customer on mount
  useEffect(() => {
    let cancelled = false;
    if (!customerId) {
      setDrafts([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const rows = await getDraftsByCustomer(customerId);
        if (cancelled) return;

        // Attach preview URLs for images
        const enriched = rows.map((r) => {
          let previewUrl = null;
          if (r.file && r.file.type?.startsWith('image/')) {
            previewUrl = URL.createObjectURL(r.file);
            urlMapRef.current.set(r.id, previewUrl);
          }
          return { ...r, previewUrl };
        });

        setDrafts(enriched.sort((a, b) => a.createdAt - b.createdAt));
      } catch (err) {
        console.error('Failed to load drafts:', err);
        setDrafts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  // Revoke all object URLs on unmount
  useEffect(() => {
    const map = urlMapRef.current;
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
      map.clear();
    };
  }, []);

  const addDraft = useCallback(
    async ({ file, name = '', type = '', entryDate = '', expiryDate = '' }) => {
      if (!customerId) throw new Error('customerId is required');
      const record = {
        id: newDraftId(),
        customerId,
        file,           // File object — stored natively in IndexedDB
        name,
        type,
        entryDate,
        expiryDate,
        createdAt: Date.now(),
      };
      await saveDraft(record);

      let previewUrl = null;
      if (file.type?.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
        urlMapRef.current.set(record.id, previewUrl);
      }

      const enriched = { ...record, previewUrl };
      setDrafts((prev) => [...prev, enriched]);
      return enriched;
    },
    [customerId]
  );

  const updateDraft = useCallback(async (id, patch) => {
    // Merge patch into the persisted record
    const { getDraft } = await import('../utils/draftStore');
    const existing = await getDraft(id);
    if (!existing) return;

    const next = { ...existing, ...patch };
    await saveDraft(next);

    // If file changed, revoke old preview and create new
    if (patch.file && patch.file !== existing.file) {
      const oldUrl = urlMapRef.current.get(id);
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
        urlMapRef.current.delete(id);
      }
      if (patch.file.type?.startsWith('image/')) {
        const newUrl = URL.createObjectURL(patch.file);
        urlMapRef.current.set(id, newUrl);
        next.previewUrl = newUrl;
      } else {
        next.previewUrl = null;
      }
    }

    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...next } : d)));
    return next;
  }, []);

  const removeDraft = useCallback(async (id) => {
    const url = urlMapRef.current.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      urlMapRef.current.delete(id);
    }
    await deleteDraft(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    urlMapRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlMapRef.current.clear();
    await Promise.all(drafts.map((d) => deleteDraft(d.id)));
    setDrafts([]);
  }, [drafts]);

  return { drafts, loading, addDraft, updateDraft, removeDraft, clearAll };
}