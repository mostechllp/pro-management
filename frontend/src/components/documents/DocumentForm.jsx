import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadDocument } from "../../store/slices/documentSlice";
import { getCustomers } from "../../store/slices/customerSlice";
import { FiX } from "react-icons/fi";

const DocumentForm = ({ customerId, customerName, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    customerId: customerId || "",
    entryDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const { customers } = useSelector((state) => state.customers);
  const { token } = useSelector((state) => state.auth);

  // Debug: Log token when component mounts
  useEffect(() => {
    console.log("DocumentForm - Customer ID from prop:", customerId);
    console.log("DocumentForm - Token exists:", !!token);
    console.log(
      "DocumentForm - Token from localStorage:",
      !!localStorage.getItem("token"),
    );
    console.log("DocumentForm - Token value:", token);
  }, [token, customerId]);

  useEffect(() => {
    // Load customers for dropdown only if no customerId provided
    if (!customerId) {
      dispatch(getCustomers({ limit: 100 }));
    }
  }, [dispatch, customerId]);

  // Update formData when customerId prop changes
  useEffect(() => {
    if (customerId) {
      console.log("Setting customerId in form:", customerId);
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
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setFileError("Please upload a PDF, JPG, JPEG, or PNG file");
        setFile(null);
        return;
      }

      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setFileError("File size must be less than 5MB");
        setFile(null);
        return;
      }

      setFileError("");
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting form...");
    console.log("Customer ID:", formData.customerId);
    console.log("File:", file?.name);
    console.log("Token in component:", token);

    if (!file) {
      setFileError("Please select a file");
      return;
    }

    if (!formData.customerId) {
      alert("Please select a customer");
      return;
    }

    if (!formData.expiryDate) {
      alert("Please select an expiry date");
      return;
    }

    // Check if token exists
    const authToken = token || localStorage.getItem("token");
    if (!authToken) {
      alert("You are not authenticated. Please login again.");
      return;
    }

    setLoading(true);

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);
    formDataToSend.append("name", formData.name);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("customerId", formData.customerId);
    formDataToSend.append("entryDate", formData.entryDate);
    formDataToSend.append("expiryDate", formData.expiryDate);
    formDataToSend.append("notes", formData.notes);

    try {
      const result = await dispatch(uploadDocument(formDataToSend)).unwrap();
      console.log("Upload successful:", result);
      onSuccess();
    } catch (error) {
      console.error("Upload error in component:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Upload Document</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer *
            </label>
            {customerId ? (
              <input
                type="text"
                value={customerName || "Loading..."}
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            ) : (
              <select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Trade License 2024"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Date
              </label>
              <input
                type="date"
                name="entryDate"
                value={formData.entryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File (PDF, JPG, JPEG, PNG) *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-2">
                Maximum file size: 5MB
              </p>
              {file && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
              {fileError && (
                <p className="text-sm text-red-600 mt-1">{fileError}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Additional notes about this document"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
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
              "Upload Document"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm;
