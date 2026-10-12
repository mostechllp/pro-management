// hooks/useUploadQueueWatcher.js
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  selectActiveJobs,
  selectUploadCounts,
} from '../store/slices/uploadQueueSlice';

/**
 * Fires `onQueueIdle` once the queue transitions from "has pending/uploading"
 * to "nothing pending/uploading" (i.e. just finished).
 *
 * Also fires `onProgress(counts)` on every queue change, if you want a live counter.
 */
export function useUploadQueueWatcher({ onQueueIdle, onProgress } = {}) {
  const activeJobs = useSelector(selectActiveJobs);
  const counts = useSelector(selectUploadCounts);
  const wasBusyRef = useRef(false);

  // Track busy → idle transition
  useEffect(() => {
    const isBusy = activeJobs.length > 0;

    if (isBusy) {
      wasBusyRef.current = true;
    } else if (wasBusyRef.current) {
      // just transitioned from busy to idle
      wasBusyRef.current = false;
      onQueueIdle?.();
    }
  }, [activeJobs.length, onQueueIdle]);

  // Report counts on every change
  useEffect(() => {
    onProgress?.(counts);
  }, [counts, onProgress]);
}