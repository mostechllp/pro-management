// services/uploadManager.js
import apiClient from './apiClient';
import {
  getDraft,
  deleteDraft,
  saveJob,
  getJob,
  getAllJobs,
  deleteJob,
} from '../utils/draftStore';
import {
  setJobs,
  upsertJob,
  removeJob,
  clearAllJobs,          // ✅ NEW — needed for hard reset
} from '../store/slices/uploadQueueSlice';

let running = false;
let abortRequested = false;

/**
 * Public: init the manager once on app boot.
 *  - Loads jobs from IndexedDB into Redux
 *  - Auto-resumes pending uploads
 *  - Marks any 'uploading' jobs (interrupted by refresh/crash) as
 *    'pending' if their draft still exists, otherwise 'failed'
 */
export async function initUploadManager(store) {
  const jobs = await getAllJobs();

  const cleaned = await Promise.all(
    jobs.map(async (j) => {
      if (j.status !== 'uploading') return j;

      // Was interrupted mid-upload. Check if draft still exists.
      let draftExists = false;
      try {
        const d = await getDraft(j.draftId);
        draftExists = !!d;
      } catch (_) {
        // ignore — treat as missing
      }

      if (!draftExists) {
        return {
          ...j,
          status: 'failed',
          error: 'Draft file missing — please re-add this document.',
          updatedAt: Date.now(),
        };
      }
      return { ...j, status: 'pending', updatedAt: Date.now() };
    })
  );

  await Promise.all(cleaned.map((j) => saveJob(j)));
  store.dispatch(setJobs(cleaned));

  if (cleaned.some((j) => j.status === 'pending')) {
    runQueue(store);
  }
}

/**
 * Public: enqueue a batch of drafts for upload.
 * Called by DocumentForm when user clicks Upload.
 *
 * @param {Object} store - the redux store (from useStore())
 * @param {Array<{ draftId, customerId, name, type, entryDate, expiryDate, fileMeta }>} items
 */
export async function enqueueUploads(store, items) {
  // ✅ Guard: skip any drafts already pending/uploading
  const existingJobDraftIds = new Set(
    store
      .getState()
      .uploadQueue.jobs.filter(
        (j) => j.status === 'pending' || j.status === 'uploading'
      )
      .map((j) => j.draftId)
  );

  const fresh = items.filter((it) => !existingJobDraftIds.has(it.draftId));
  if (fresh.length === 0) return;

  // ✅ Build real job objects (previously missing)
  const jobs = fresh.map((it) => ({
    jobId: `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    draftId: it.draftId,
    customerId: it.customerId,
    name: it.name || '',
    type: it.type,
    entryDate: it.entryDate || '',
    expiryDate: it.expiryDate || '',
    fileMeta: it.fileMeta || null,
    status: 'pending',
    error: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  await Promise.all(jobs.map((j) => saveJob(j)));
  jobs.forEach((j) => store.dispatch(upsertJob(j)));

  runQueue(store);
}

/**
 * Public: retry a specific failed job.
 */
export async function retryJob(store, jobId) {
  const job = await getJob(jobId);
  if (!job) return;

  // Before retrying, verify the draft still exists; otherwise fail fast.
  let draftExists = false;
  try {
    const d = await getDraft(job.draftId);
    draftExists = !!d;
  } catch (_) {}

  if (!draftExists) {
    const failedJob = {
      ...job,
      status: 'failed',
      error: 'Draft file missing — please re-add this document.',
      updatedAt: Date.now(),
    };
    await saveJob(failedJob);
    store.dispatch(upsertJob(failedJob));
    return;
  }

  const next = {
    ...job,
    status: 'pending',
    error: null,
    updatedAt: Date.now(),
  };
  await saveJob(next);
  store.dispatch(upsertJob(next));
  runQueue(store);
}

/**
 * ✅ Delete a single job (any status).
 * Also cleans up its leftover draft from IndexedDB (if any).
 */
export async function deleteJobAndDraft(store, jobId) {
  const job = await getJob(jobId);
  if (!job) {
    store.dispatch(removeJob(jobId));
    return;
  }

  if (job.draftId) {
    try {
      const draft = await getDraft(job.draftId);
      if (draft) await deleteDraft(job.draftId);
    } catch (err) {
      console.warn('Failed to delete draft for job', jobId, err);
    }
  }

  await deleteJob(jobId);
  store.dispatch(removeJob(jobId));
}

/**
 * ✅ Clear all FAILED jobs (and their leftover drafts).
 * Leaves pending/uploading/done jobs alone.
 */
export async function clearFailedJobs(store) {
  const state = store.getState();
  const failed = state.uploadQueue.jobs.filter((j) => j.status === 'failed');

  await Promise.all(
    failed.map(async (j) => {
      if (j.draftId) {
        try {
          const draft = await getDraft(j.draftId);
          if (draft) await deleteDraft(j.draftId);
        } catch (err) {
          console.warn('Failed to delete draft for job', j.jobId, err);
        }
      }
      await deleteJob(j.jobId);
    })
  );

  failed.forEach((j) => store.dispatch(removeJob(j.jobId)));
}

/**
 * ✅ Hard reset: clear ALL jobs regardless of status + their drafts.
 */
export async function clearAllJobsAndDrafts(store) {
  const jobs = await getAllJobs();

  await Promise.all(
    jobs.map(async (j) => {
      if (j.draftId) {
        try {
          const draft = await getDraft(j.draftId);
          if (draft) await deleteDraft(j.draftId);
        } catch (err) {
          console.warn('Failed to delete draft for job', j.jobId, err);
        }
      }
      await deleteJob(j.jobId);
    })
  );

  store.dispatch(clearAllJobs());
}

export function abortQueue() {
  abortRequested = true;
}

/**
 * The worker loop. Runs one file at a time.
 * Never belongs to a component — lives as long as the tab is open.
 */
async function runQueue(store) {
  if (running) return;
  running = true;

  try {
    // Keep looping while there are pending jobs
    // (re-reads each iteration so newly enqueued jobs get picked up)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (abortRequested) {
        abortRequested = false;
        break;
      }

      const state = store.getState();
      const next = state.uploadQueue.jobs.find((j) => j.status === 'pending');
      if (!next) break;

      await processOne(store, next.jobId);
    }
  } finally {
    running = false;
  }
}

async function processOne(store, jobId) {
  const job = await getJob(jobId);
  if (!job) return;

  // Mark uploading
  const uploadingJob = { ...job, status: 'uploading', updatedAt: Date.now() };
  await saveJob(uploadingJob);
  store.dispatch(upsertJob(uploadingJob));

  // Load the draft (contains the actual File object)
  const draft = await getDraft(job.draftId);
  if (!draft || !draft.file) {
    const failedJob = {
      ...uploadingJob,
      status: 'failed',
      error: 'Draft file missing — please re-add this document.',
      updatedAt: Date.now(),
    };
    await saveJob(failedJob);
    store.dispatch(upsertJob(failedJob));
    return;
  }

  try {
    const fd = new FormData();
    fd.append('file', draft.file, draft.file.name);
    fd.append('type', job.type || draft.type);
    fd.append('name', (job.name || draft.name || '').trim());
    fd.append('customerId', job.customerId);
    const entryDate = job.entryDate || draft.entryDate;
    const expiryDate = job.expiryDate || draft.expiryDate;
    if (entryDate) fd.append('entryDate', entryDate);
    if (expiryDate) fd.append('expiryDate', expiryDate);

    await apiClient.post('/documents/bulk/single', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Success → delete draft + mark job done
    await deleteDraft(draft.id);

    const doneJob = {
      ...uploadingJob,
      status: 'done',
      error: null,
      updatedAt: Date.now(),
    };
    await saveJob(doneJob);
    store.dispatch(upsertJob(doneJob));

    // Auto-remove 'done' jobs after a moment so the badge clears
    setTimeout(async () => {
      await deleteJob(doneJob.jobId);
      store.dispatch(removeJob(doneJob.jobId));
    }, 2500);
  } catch (err) {
    const failedJob = {
      ...uploadingJob,
      status: 'failed',
      error:
        err?.response?.data?.message || err?.message || 'Upload failed',
      updatedAt: Date.now(),
    };
    await saveJob(failedJob);
    store.dispatch(upsertJob(failedJob));
  }
}