// utils/draftStore.js
const DB_NAME = 'documentsDrafts';
const DB_VERSION = 2;               // ✅ bump version
const DRAFTS = 'drafts';
const JOBS = 'jobs';                 // ✅ new store for pending upload jobs

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(DRAFTS)) {
        const store = db.createObjectStore(DRAFTS, { keyPath: 'id' });
        store.createIndex('customerId', 'customerId', { unique: false });
      }

      if (!db.objectStoreNames.contains(JOBS)) {
        // ✅ Queue of pending upload jobs — survives refresh
        const jobs = db.createObjectStore(JOBS, { keyPath: 'jobId' });
        jobs.createIndex('status', 'status', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

function tx(storeName, mode) {
  return openDB().then(
    (db) => db.transaction(storeName, mode).objectStore(storeName)
  );
}

// ---------- Drafts (existing) ----------
export function newDraftId() {
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveDraft(record) {
  const store = await tx(DRAFTS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getDraftsByCustomer(customerId) {
  const store = await tx(DRAFTS, 'readonly');
  const index = store.index('customerId');
  return new Promise((resolve, reject) => {
    const req = index.getAll(customerId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getDraft(id) {
  const store = await tx(DRAFTS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDraft(id) {
  const store = await tx(DRAFTS, 'readwrite');
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

// ---------- Upload jobs (NEW) ----------
export function newJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Job shape:
 * {
 *   jobId, draftId, customerId, name, type, entryDate, expiryDate,
 *   fileMeta: { name, size, type },   // for UI display; file itself is in DRAFTS
 *   status: 'pending' | 'uploading' | 'failed' | 'done',
 *   error: string | null,
 *   createdAt, updatedAt
 * }
 */
export async function saveJob(job) {
  const store = await tx(JOBS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(job);
    req.onsuccess = () => resolve(job);
    req.onerror = () => reject(req.error);
  });
}

export async function getJob(jobId) {
  const store = await tx(JOBS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(jobId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllJobs() {
  const store = await tx(JOBS, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteJob(jobId) {
  const store = await tx(JOBS, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(jobId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearDoneJobs() {
  const all = await getAllJobs();
  const done = all.filter((j) => j.status === 'done');
  await Promise.all(done.map((j) => deleteJob(j.jobId)));
}