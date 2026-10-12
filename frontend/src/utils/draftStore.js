// utils/draftStore.js
const DB_NAME = 'documentsDrafts';
const DB_VERSION = 1;
const STORE = 'drafts';

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('customerId', 'customerId', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

function tx(mode) {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

// Generate a stable draft id
export function newDraftId() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Save a draft record: { id, customerId, file (Blob), name, type, entryDate, expiryDate, createdAt }
export async function saveDraft(record) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getDraftsByCustomer(customerId) {
  const store = await tx('readonly');
  const index = store.index('customerId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(customerId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getDraft(id) {
  const store = await tx('readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDraft(id) {
  const store = await tx('readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearDraftsForCustomer(customerId) {
  const drafts = await getDraftsByCustomer(customerId);
  await Promise.all(drafts.map((d) => deleteDraft(d.id)));
}