import React, { useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import {
  selectActiveJobs,
  selectUploadCounts,
} from '../../store/slices/uploadQueueSlice';
import {
  retryJob,
  deleteJobAndDraft,
  clearFailedJobs,
} from '../../services/uploadManager';
import {
  FiUploadCloud,
  FiRefreshCw,
  FiAlertTriangle,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiX,
} from 'react-icons/fi';

const UploadProgressBadge = () => {
  const store = useStore();
  const counts = useSelector(selectUploadCounts);
  const activeJobs = useSelector(selectActiveJobs);
  const allJobs = useSelector((s) => s.uploadQueue.jobs);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const isActive = counts.pending + counts.uploading > 0;
  const hasFailed = counts.failed > 0;

  // If there's nothing to show, render nothing
  if (!isActive && !hasFailed) return null;

  // If user explicitly dismissed and no active jobs are running, hide
  if (dismissed && !isActive) return null;

  // Re-show automatically whenever new activity starts
  if (dismissed && isActive) {
    // (setting state during render triggers re-render — safe here because
    // it converges: once set to false, isActive stays true and we won't loop)
    setDismissed(false);
  }

  const total = counts.total;
  const done = counts.done;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleClose = (e) => {
    e.stopPropagation();
    if (isActive) {
      // Can't fully hide while uploading — just collapse
      setExpanded(false);
    } else {
      // Nothing running, just dismiss the panel
      setDismissed(true);
    }
  };

  const handleClearAllFailed = async (e) => {
    e.stopPropagation();
    await clearFailedJobs(store);
    // If nothing left, hide the badge entirely
    const state = store.getState();
    const remaining = state.uploadQueue.jobs.filter(
      (j) => j.status === 'pending' || j.status === 'uploading' || j.status === 'failed'
    );
    if (remaining.length === 0) setDismissed(true);
    setExpanded(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50"
          onClick={() => setExpanded((v) => !v)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasFailed && !isActive ? (
              <FiAlertTriangle className="text-red-500 shrink-0" size={16} />
            ) : (
              <FiUploadCloud className="text-blue-600 shrink-0" size={16} />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {isActive
                  ? `Uploading ${done}/${total}...`
                  : `${counts.failed} upload${counts.failed > 1 ? 's' : ''} failed`}
              </p>
              {isActive && (
                <p className="text-xs text-slate-500">
                  {counts.uploading} in progress · {counts.pending} pending
                  {hasFailed && ` · ${counts.failed} failed`}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Expand/collapse chevron */}
            <span className="text-slate-400">
              {expanded ? <FiChevronDown size={14} /> : <FiChevronUp size={14} />}
            </span>
            {/* Close button */}
            <button
              onClick={handleClose}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
              title={isActive ? 'Collapse' : 'Dismiss'}
            >
              <FiX size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}

        {/* Expanded: job list + actions */}
        {expanded && (
          <>
            {/* Bulk action bar (only when there are failed jobs) */}
            {hasFailed && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-red-50 border-t border-red-100">
                <span className="text-[11px] text-red-700 font-medium">
                  {counts.failed} failed
                </span>
                <button
                  onClick={handleClearAllFailed}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700 hover:text-red-900 px-2 py-1 rounded hover:bg-red-100"
                  title="Delete all failed uploads"
                >
                  <FiTrash2 size={12} />
                  Clear all failed
                </button>
              </div>
            )}

            {/* Job list */}
            <div className="max-h-72 overflow-y-auto border-t border-slate-100">
              {allJobs.length === 0 ? (
                <p className="px-3 py-4 text-xs text-slate-400 text-center">
                  No uploads
                </p>
              ) : (
                allJobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-50 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-700 truncate">
                        {job.fileMeta?.name || job.name || job.type || 'Document'}
                      </p>
                      <p
                        className={`text-[11px] truncate ${
                          job.status === 'failed'
                            ? 'text-red-500'
                            : job.status === 'done'
                            ? 'text-green-600'
                            : job.status === 'uploading'
                            ? 'text-blue-600'
                            : 'text-slate-400'
                        }`}
                        title={job.error || ''}
                      >
                        {job.status === 'failed'
                          ? job.error || 'Failed'
                          : job.status === 'done'
                          ? 'Uploaded'
                          : job.status === 'uploading'
                          ? 'Uploading...'
                          : 'Pending'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Retry (only for failed) */}
                      {job.status === 'failed' && (
                        <button
                          onClick={() => retryJob(store, job.jobId)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Retry"
                        >
                          <FiRefreshCw size={13} />
                        </button>
                      )}

                      {/* Delete (for failed or done — not for pending/uploading) */}
                      {(job.status === 'failed' || job.status === 'done') && (
                        <button
                          onClick={() => deleteJobAndDraft(store, job.jobId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Remove this upload"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UploadProgressBadge;