import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  jobs: [],            // array of job objects
  initialized: false,  // have we loaded jobs from IndexedDB yet?
};

const uploadQueueSlice = createSlice({
  name: 'uploadQueue',
  initialState,
  reducers: {
    setJobs: (state, action) => {
      state.jobs = action.payload;
      state.initialized = true;
    },
    upsertJob: (state, action) => {
      const idx = state.jobs.findIndex((j) => j.jobId === action.payload.jobId);
      if (idx === -1) state.jobs.push(action.payload);
      else state.jobs[idx] = action.payload;
    },
    removeJob: (state, action) => {
      state.jobs = state.jobs.filter((j) => j.jobId !== action.payload);
    },
    clearAllJobs: (state) => {
      state.jobs = [];
    },
  },
});

export const { setJobs, upsertJob, removeJob, clearAllJobs } =
  uploadQueueSlice.actions;

// ---------- Selectors ----------
export const selectActiveJobs = (state) =>
  state.uploadQueue.jobs.filter(
    (j) => j.status === 'pending' || j.status === 'uploading'
  );

export const selectUploadCounts = (state) => {
  const jobs = state.uploadQueue.jobs;
  return {
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    uploading: jobs.filter((j) => j.status === 'uploading').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
    done: jobs.filter((j) => j.status === 'done').length,
  };
};

export default uploadQueueSlice.reducer;