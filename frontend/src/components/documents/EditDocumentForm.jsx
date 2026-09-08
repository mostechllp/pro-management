import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

const EditDocumentForm = ({ document, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    entryDate: '',
    expiryDate: '',
    notes: '',
  });

  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || '',
        type: document.type || '',
        entryDate: document.entryDate ? new Date(document.entryDate).toISOString().split('T')[0] : '',
        expiryDate: document.expiryDate ? new Date(document.expiryDate).toISOString().split('T')[0] : '',
        notes: document.notes || '',
      });
    }
  }, [document]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Please enter a document name');
      return;
    }

    if (!formData.type) {
      alert('Please select a document type');
      return;
    }

    if (!formData.expiryDate) {
      alert('Please select an expiry date');
      return;
    }

    setLoading(true);

    try {
      await onSuccess(formData);
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!document) return null;

  return (
    <div className="p-5 sm:p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-slate-800">Edit Document</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Document Name */}
          <div>
            <label className={labelClass}>Document Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Trade License 2024"
              className={inputClass}
            />
          </div>

          {/* Document Type */}
          <div>
            <label className={labelClass}>Document Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select type</option>
              <option value="Trade License">Trade License</option>
              <option value="Emirates ID">Emirates ID</option>
              <option value="Passport">Passport</option>
              <option value="Visa">Visa</option>
              <option value="Labour Card">Labour Card</option>
              <option value="VAT Certificate">VAT Certificate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Entry Date</label>
              <input
                type="date"
                name="entryDate"
                value={formData.entryDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Expiry Date *</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Additional notes about this document"
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
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
                Updating...
              </span>
            ) : (
              'Update Document'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDocumentForm;