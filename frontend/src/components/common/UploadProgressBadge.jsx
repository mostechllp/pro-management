import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  selectActiveJobs,
  selectUploadCounts,
} from '../../store/slices/uploadQueueSlice';
import { retryJob, abortQueue } from '../../services/uploadManager';
import { useStore } from 'react-redux';
import { FiUploadCloud, FiX, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

const UploadProgressBadge = () => {
  const store = useStore();
  const counts = useSelector(selectUploadCounts);
  const activeJobs = useSelector(selectActiveJobs);
  const allJobs = useSelector((s) => s.uploadQueue.jobs);
  const [expanded, setExpanded] = useState(false);

  const isActive = counts.pending + counts.uploading > 0;
  const hasFailed = counts.failed > 0;

  if (!isActive && !hasFailed) return null;

  const total = counts.total;
  const done = counts.done;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const failedJobs = allJobs.filter((j) => j.status === 'failed');

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
                </p>
              )}
            </div>
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

        {/* Expanded: job list */}
        {expanded && (
          <div className="max-h-72 overflow-y-auto border-t border-slate-100">
            {allJobs.map((job) => (
              <div
                key={job.jobId}
                className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-50 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 truncate">
                    {job.fileMeta?.name || job.name || job.type || 'Document'}
                  </p>
                  <p
                    className={`text-[11px] ${
                      job.status === 'failed'
                        ? 'text-red-500'
                        : job.status === 'done'
                        ? 'text-green-600'
                        : job.status === 'uploading'
                        ? 'text-blue-600'
                        : 'text-slate-400'
                    }`}
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
                {job.status === 'failed' && (
                  <button
                    onClick={() => retryJob(store, job.jobId)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded shrink-0"
                    title="Retry"
                  >
                    <FiRefreshCw size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadProgressBadge;