import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomers } from '../../store/slices/customerSlice';
import {
  addDocumentType,
  getDocumentTypes,
} from '../../store/slices/documentTypeSlice';
import {
  FiUploadCloud,
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiCalendar,
  FiEye,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import SearchableSelect from '../common/SearchableSelect';
import apiClient from '../../services/apiClient';
import { useDocumentDrafts } from '../../hooks/useDocumentDrafts';
import toast from 'react-hot-toast';

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

const DocumentForm = ({ customerId, customerName, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [globalError, setGlobalError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  const { customers } = useSelector((s) => s.customers);
  const { token } = useSelector((s) => s.auth);
  const { types: documentTypeObjs } = useSelector((s) => s.documentTypes);
  const documentTypes = useMemo(
    () => documentTypeObjs.map((t) => t.name),
    [documentTypeObjs]
  );

  // ✅ IndexedDB-backed drafts — survives modal close, tab close, refresh
  const {
    drafts,
    loading: draftsLoading,
    addDraft,
    updateDraft,
    removeDraft,
    clearAll,
  } = useDocumentDrafts(selectedCustomerId);

  const fileInputRefs = useRef({});

  useEffect(() => {
    if (!documentTypeObjs.length) dispatch(getDocumentTypes());
  }, [dispatch, documentTypeObjs.length]);

  useEffect(() => {
    if (!customerId) dispatch(getCustomers({ limit: 100 }));
  }, [dispatch, customerId]);

  useEffect(() => {
    if (customerId) setSelectedCustomerId(customerId);
  }, [customerId]);

  // ---------- Add new type ----------
  const handleAddDocumentType = async (newType) => {
    try {
      await dispatch(addDocumentType(newType)).unwrap();
    } catch (_) {}
  };

  // ---------- Row helpers ----------
  const updateDraftField = (id, patch) => updateDraft(id, patch);

  // ✅ Pick a file → immediately persist to IndexedDB
  const handleFilePick = async (file) => {
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, JPEG, or PNG file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      await addDraft({ file });
    } catch (err) {
      console.error(err);
      toast.error('Failed to save draft');
    }
  };

  const handleReplaceFile = async (draftId, file) => {
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a PDF, JPG, JPEG, or PNG file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    await updateDraft(draftId, { file });
  };

  const handleNameChange = (id, value) => updateDraftField(id, { name: value });

  const handleTypeChange = (id, e) => {
    const newType = e.target.value;
    const current = drafts.find((d) => d.id === id);
    updateDraftField(id, {
      type: newType,
      // auto-fill name only if user hasn't typed a custom one
      name: current?.name?.trim() ? current.name : newType,
    });
  };

  const handleDateChange = (id, field, value) =>
    updateDraftField(id, { [field]: value });

  const toggleDates = (id, show) => {
    if (show) updateDraftField(id, { showDates: true });
    else updateDraftField(id, { entryDate: '', expiryDate: '', showDates: false });
  };

  // ---------- Preview ----------
  const handlePreview = (draft) => {
    const url = draft.previewUrl || URL.createObjectURL(draft.file);
    window.open(url, '_blank');
  };

  // ---------- Submit: ONE file per request, sequential ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    if (!selectedCustomerId) {
      setGlobalError('Please select a customer');
      return;
    }
    if (drafts.length === 0) {
      setGlobalError('Please add at least one document');
      return;
    }
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      if (!d.type) {
        setGlobalError(`Document #${i + 1}: Please select a document type`);
        return;
      }
    }

    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      setGlobalError('You are not authenticated. Please login again.');
      return;
    }

    setUploading(true);
    setUploadProgress({ done: 0, total: drafts.length });

    const failed = [];

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      try {
        const fd = new FormData();
        fd.append('file', d.file, d.file.name);
        fd.append('type', d.type);
        fd.append('name', d.name?.trim() || '');
        fd.append('customerId', selectedCustomerId);
        if (d.entryDate) fd.append('entryDate', d.entryDate);
        if (d.expiryDate) fd.append('expiryDate', d.expiryDate);

        // ✅ One file per request — small, fast, independently retryable
        await apiClient.post('/documents/bulk/single', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Success → remove from drafts (IndexedDB)
        await removeDraft(d.id);
      } catch (err) {
        failed.push({
          name: d.file.name,
          reason: err?.response?.data?.message || err.message || 'Upload failed',
        });
      } finally {
        setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
      }
    }

    setUploading(false);

    if (failed.length === 0) {
      toast.success(`${drafts.length} document(s) uploaded successfully`);
      onSuccess();
    } else {
      // Drafts that failed remain in IndexedDB → user can retry just those
      setGlobalError(
        `${failed.length} of ${drafts.length} failed. Failed items remain in the list — retry when ready.`
      );
      toast.error(`${failed.length} upload(s) failed`);
    }
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-slate-800">
          Upload Document{drafts.length !== 1 ? 's' : ''}
        </h2>
        <span className="text-xs text-slate-400">
          {drafts.length} document{drafts.length !== 1 ? 's' : ''} · saved locally
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Customer */}
          <div>
            <label className={labelClass}>Customer *</label>
            {customerId ? (
              <input
                type="text"
                value={customerName || 'Loading...'}
                disabled
                className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
              />
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.company ? `- ${c.company}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Draft rows */}
          <div className="space-y-3">
            {draftsLoading && drafts.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">
                Loading saved drafts...
              </p>
            )}

            {drafts.map((doc, index) => {
              const hasDates = doc.entryDate || doc.expiryDate;
              return (
                <div
                  key={doc.id}
                  className="relative border border-slate-200 rounded-xl p-3.5 bg-slate-50/40"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Document #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDraft(doc.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                      title="Remove this document"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>

                  {/* File preview card */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 mb-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      {doc.previewUrl ? (
                        <img
                          src={doc.previewUrl}
                          alt=""
                          className="w-10 h-10 object-cover rounded border shrink-0"
                        />
                      ) : (
                        <FiCheckCircle size={16} className="text-green-600 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-green-800 truncate">
                          {doc.file.name}
                        </p>
                        <p className="text-xs text-green-600">
                          {(doc.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreview(doc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                        title="Preview"
                      >
                        <FiEye size={14} />
                      </button>
                      {/* Replace */}
                      <label
                        className="p-1.5 text-amber-600 hover:bg-amber-100 rounded cursor-pointer"
                        title="Replace file"
                      >
                        <FiRefreshCw size={14} />
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files[0]) handleReplaceFile(doc.id, e.target.files[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeDraft(doc.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                        title="Remove"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Optional name */}
                  <div className="mb-3">
                    <label className={labelClass}>
                      Document Name
                    </label>
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) => handleNameChange(doc.id, e.target.value)}
                      placeholder={doc.type || 'e.g., Trade License 2024'}
                      className={inputClass}
                      maxLength={120}
                    />
                  </div>

                  {/* Type */}
                  <SearchableSelect
                    label="Document Type *"
                    name={`type-${doc.id}`}
                    value={doc.type}
                    onChange={(e) => handleTypeChange(doc.id, e)}
                    options={documentTypes}
                    placeholder="Select type"
                    searchPlaceholder="Search or type to add new..."
                    allowClear
                    allowAdd
                    onAddOption={handleAddDocumentType}
                    addOptionLabel="Add new type"
                  />

                  {/* Dates */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={`${labelClass} mb-0`}>Validity Dates</label>
                      {!hasDates && (
                        <button
                          type="button"
                          onClick={() => toggleDates(doc.id, true)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50"
                        >
                          <FiPlus size={14} /> Add dates
                        </button>
                      )}
                      {hasDates && (
                        <button
                          type="button"
                          onClick={() => toggleDates(doc.id, false)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50"
                        >
                          <FiTrash2 size={14} /> Remove dates
                        </button>
                      )}
                    </div>

                    {hasDates ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-100">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Entry Date
                          </label>
                          <input
                            type="date"
                            value={doc.entryDate}
                            onChange={(e) => handleDateChange(doc.id, 'entryDate', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={doc.expiryDate}
                            onChange={(e) => handleDateChange(doc.id, 'expiryDate', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add file — supports multiple selection */}
          <label
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
          >
            <FiUploadCloud size={16} />
            Add Document(s)
            <input
              ref={(el) => (fileInputRefs.current['__add__'] = el)}
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                for (const f of files) {
                  // eslint-disable-next-line no-await-in-loop
                  await handleFilePick(f);
                }
                e.target.value = '';
              }}
            />
          </label>

          {globalError && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <FiAlertCircle className="shrink-0 mt-0.5" size={16} />
              <span>{globalError}</span>
            </div>
          )}

          {drafts.length > 0 && !uploading && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-slate-500 hover:text-red-600 underline"
            >
              Clear all drafts
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={uploading || drafts.length === 0}
            className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading
              ? `Uploading ${uploadProgress.done}/${uploadProgress.total}...`
              : `Upload ${drafts.length} Document${drafts.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;