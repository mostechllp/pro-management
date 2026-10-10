import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadDocumentsBulk } from '../../store/slices/documentSlice';
import { getCustomers } from '../../store/slices/customerSlice';
import {
  FiUploadCloud,
  FiCheckCircle,
  FiPlus,
  FiTrash2,
  FiCalendar,
} from 'react-icons/fi';
import SearchableSelect from '../common/SearchableSelect';

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

const DOCUMENT_TYPES = [
  'Trade License',
  'Emirates ID',
  'Passport',
  'Visa',
  'Labour Card',
  'VAT Certificate',
  'Establishment Card',
  'MOA',
  'Power of Attorney',
  'Insurance',
  'Other',
];

const createEmptyDoc = () => ({
  uid: Math.random().toString(36).slice(2, 10), // unique key for React list
  type: '',
  entryDate: '',
  expiryDate: '',
  showDates: false,
  file: null,
  fileError: '',
});

const DocumentForm = ({ customerId, customerName, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [docs, setDocs] = useState([createEmptyDoc()]);
  const [globalError, setGlobalError] = useState('');

  const { customers } = useSelector((state) => state.customers);
  const { token } = useSelector((state) => state.auth);

  // Refs for each file input so we can reset them
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (!customerId) {
      dispatch(getCustomers({ limit: 100 }));
    }
  }, [dispatch, customerId]);

  useEffect(() => {
    if (customerId) {
      setSelectedCustomerId(customerId);
    }
  }, [customerId]);

  // ---------- Document row helpers ----------
  const updateDoc = (uid, patch) => {
    setDocs((prev) =>
      prev.map((d) => (d.uid === uid ? { ...d, ...patch } : d))
    );
  };

  const addDoc = () => {
    setDocs((prev) => [...prev, createEmptyDoc()]);
  };

  const removeDoc = (uid) => {
    setDocs((prev) => {
      if (prev.length === 1) {
        // Reset the only row instead of removing (keep at least one)
        const empty = createEmptyDoc();
        if (fileInputRefs.current[uid]) {
          fileInputRefs.current[uid].value = '';
        }
        return [empty];
      }
      if (fileInputRefs.current[uid]) {
        delete fileInputRefs.current[uid];
      }
      return prev.filter((d) => d.uid !== uid);
    });
  };

  const handleTypeChange = (uid, e) => {
    updateDoc(uid, { type: e.target.value });
  };

  const handleDateChange = (uid, field, value) => {
    updateDoc(uid, { [field]: value });
  };

  const handleFileChange = (uid, e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      updateDoc(uid, {
        file: null,
        fileError: 'Please upload a PDF, JPG, JPEG, or PNG file',
      });
      e.target.value = '';
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      updateDoc(uid, {
        file: null,
        fileError: 'File size must be less than 5MB',
      });
      e.target.value = '';
      return;
    }

    updateDoc(uid, { file: selectedFile, fileError: '' });
  };

  const removeFile = (uid) => {
    updateDoc(uid, { file: null, fileError: '' });
    if (fileInputRefs.current[uid]) {
      fileInputRefs.current[uid].value = '';
    }
  };

  // ---------- Submit ----------
 const handleSubmit = async (e) => {
  e.preventDefault();
  setGlobalError('');

  if (!selectedCustomerId) {
    setGlobalError('Please select a customer');
    return;
  }

  // Validate each row
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    if (!d.type) {
      setGlobalError(`Document #${i + 1}: Please select a document type`);
      return;
    }
    if (!d.file) {
      setGlobalError(`Document #${i + 1}: Please choose a file`);
      return;
    }
  }

  const authToken = token || localStorage.getItem('token');
  if (!authToken) {
    setGlobalError('You are not authenticated. Please login again.');
    return;
  }

  setLoading(true);

  try {
    // ✅ ONE request for all documents
    const formDataToSend = new FormData();

    // All files under the same 'files' key, in row order
    docs.forEach((d) => {
      formDataToSend.append('files', d.file);
    });

    // Per-file metadata — MUST be in the same order as the files above
    formDataToSend.append(
      'documents',
      JSON.stringify(
        docs.map((d) => ({
          type: d.type,
          name: d.type,
          entryDate: d.entryDate || undefined,
          expiryDate: d.expiryDate || undefined,
        }))
      )
    );

    formDataToSend.append('customerId', selectedCustomerId);

    const result = await dispatch(uploadDocumentsBulk(formDataToSend)).unwrap();

    // Optional: warn if some failed
    if (result?.failed?.length > 0) {
      console.warn('Some documents failed:', result.failed);
      // Still call onSuccess because partial success is likely fine
    }

    onSuccess();
  } catch (error) {
    console.error('Bulk upload error in component:', error);
    setGlobalError(
      error?.message || 'Some documents failed to upload. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-5 sm:p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-slate-800">
          Upload Document{docs.length > 1 ? 's' : ''}
        </h2>
        <span className="text-xs text-slate-400">
          {docs.length} document{docs.length > 1 ? 's' : ''}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* ---------- Customer Selection ---------- */}
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
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}{' '}
                    {customer.company ? `- ${customer.company}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ---------- Document Rows ---------- */}
          <div className="space-y-3">
            {docs.map((doc, index) => {
              const hasDates = doc.entryDate || doc.expiryDate;
              return (
                <div
                  key={doc.uid}
                  className="relative border border-slate-200 rounded-xl p-3.5 bg-slate-50/40"
                >
                  {/* Row header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Document #{index + 1}
                    </span>
                    {docs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDoc(doc.uid)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                        aria-label="Remove document"
                        title="Remove this document"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Type */}
                    <SearchableSelect
                      label="Document Type *"
                      name={`type-${doc.uid}`}
                      value={doc.type}
                      onChange={(e) => handleTypeChange(doc.uid, e)}
                      options={DOCUMENT_TYPES}
                      placeholder="Select type"
                      searchPlaceholder="Search document type..."
                      allowClear
                    />

                    {/* Dates with + button */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`${labelClass} mb-0`}>
                          Validity Dates
                        </label>
                        {!doc.showDates && !hasDates && (
                          <button
                            type="button"
                            onClick={() =>
                              updateDoc(doc.uid, { showDates: true })
                            }
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            <FiPlus size={14} /> Add dates
                          </button>
                        )}
                        {doc.showDates && (
                          <button
                            type="button"
                            onClick={() =>
                              updateDoc(doc.uid, {
                                showDates: false,
                                entryDate: '',
                                expiryDate: '',
                              })
                            }
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <FiTrash2 size={14} /> Remove dates
                          </button>
                        )}
                      </div>

                      {doc.showDates ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white rounded-lg border border-slate-100">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                              Entry Date
                            </label>
                            <input
                              type="date"
                              value={doc.entryDate}
                              onChange={(e) =>
                                handleDateChange(
                                  doc.uid,
                                  'entryDate',
                                  e.target.value
                                )
                              }
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
                              onChange={(e) =>
                                handleDateChange(
                                  doc.uid,
                                  'expiryDate',
                                  e.target.value
                                )
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      ) : hasDates ? (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <FiCalendar size={12} />
                          {doc.entryDate && (
                            <span>Entry: {doc.entryDate}</span>
                          )}
                          {doc.entryDate && doc.expiryDate && <span>•</span>}
                          {doc.expiryDate && (
                            <span>Expiry: {doc.expiryDate}</span>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Compact File Upload */}
                    <div>
                      <label className={labelClass}>
                        File (PDF, JPG, JPEG, PNG) *
                      </label>

                      {!doc.file ? (
                        <div className="flex items-center gap-3">
                          <label
                            htmlFor={`doc-file-input-${doc.uid}`}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                          >
                            <FiUploadCloud size={16} className="text-slate-500" />
                            Choose file
                          </label>
                          <span className="text-xs text-slate-400">
                            Max 5MB
                          </span>
                          <input
                            id={`doc-file-input-${doc.uid}`}
                            ref={(el) => (fileInputRefs.current[doc.uid] = el)}
                            type="file"
                            onChange={(e) => handleFileChange(doc.uid, e)}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 px-3 py-2 border border-green-200 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <FiCheckCircle
                              size={16}
                              className="text-green-600 shrink-0"
                            />
                            <span className="text-sm text-green-800 truncate">
                              {doc.file.name}
                            </span>
                            <span className="text-xs text-green-600 shrink-0">
                              ({(doc.file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(doc.uid)}
                            className="text-slate-400 hover:text-red-600 transition-colors shrink-0 p-1"
                            aria-label="Remove file"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}

                      {doc.fileError && (
                        <p className="text-sm text-red-600 mt-2">
                          {doc.fileError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---------- Add Another Document ---------- */}
          <button
            type="button"
            onClick={addDoc}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <FiPlus size={16} /> Add Another Document
          </button>

          {/* ---------- Global Notes (optional, applies to all) ---------- */}
          {/* Removed per-doc notes; add global notes if you want */}
          {/* <div>
            <label className={labelClass}>Notes</label>
            <textarea ... />
          </div> */}

          {globalError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {globalError}
            </p>
          )}
        </div>

        {/* ---------- Actions ---------- */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading {docs.length > 1 ? `${docs.length} documents` : ''}...
              </span>
            ) : (
              `Upload ${docs.length > 1 ? `${docs.length} Documents` : 'Document'}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;