import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadDocument } from '../../store/slices/documentSlice';
import { getCustomers } from '../../store/slices/customerSlice';
import { FiX, FiUploadCloud, FiCheckCircle } from 'react-icons/fi';

const inputClass =
  'w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

const DocumentForm = ({ customerId, customerName, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    customerId: customerId || '',
    entryDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const { customers } = useSelector((state) => state.customers);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!customerId) {
      dispatch(getCustomers({ limit: 100 }));
    }
  }, [dispatch, customerId]);

  useEffect(() => {
    if (customerId) {
      setFormData((prev) => ({
        ...prev,
        customerId: customerId,
      }));
    }
  }, [customerId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setFileError('Please upload a PDF, JPG, JPEG, or PNG file');
        setFile(null);
        return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
        setFileError('File size must be less than 5MB');
        setFile(null);
        return;
      }

      setFileError('');
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setFileError('Please select a file');
      return;
    }

    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    if (!formData.expiryDate) {
      alert('Please select an expiry date');
      return;
    }

    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      alert('You are not authenticated. Please login again.');
      return;
    }

    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('type', formData.type);
    formDataToSend.append('customerId', formData.customerId);
    formDataToSend.append('entryDate', formData.entryDate);
    formDataToSend.append('expiryDate', formData.expiryDate);
    formDataToSend.append('notes', formData.notes);

    try {
      const result = await dispatch(uploadDocument(formDataToSend)).unwrap();
      onSuccess();
    } catch (error) {
      console.error('Upload error in component:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-slate-800">Upload Document</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Customer Selection */}
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
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.company}
                      </option>
                    ))}
                  </select>
                )}
              </div>

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

              {/* File Upload */}
              <div>
                <label className={labelClass}>File (PDF, JPG, JPEG, PNG) *</label>
                <label
                  htmlFor="doc-file-input"
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer text-center"
                >
                  <FiUploadCloud className="text-slate-400" size={28} />
                  <span className="text-sm text-slate-600">
                    <span className="text-blue-600 font-semibold">Click to upload</span> or drag and drop
                  </span>
                  <span className="text-xs text-slate-400">Maximum file size: 5MB</span>
                  <input
                    id="doc-file-input"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    className="hidden"
                  />
                </label>
                {file && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1.5">
                    <FiCheckCircle size={14} /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
                {fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
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
                    Uploading...
                  </span>
                ) : (
                  'Upload Document'
                )}
              </button>
            </div>
          </form>
        </div>
  );
};

export default DocumentForm;