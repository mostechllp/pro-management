import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiTrash2, 
  FiPlus, 
  FiFileText,
  FiEye,
  FiCalendar,
  FiRefreshCw
} from 'react-icons/fi';
import { 
  getCustomer, 
  clearSelectedCustomer 
} from '../../store/slices/customerSlice';
import { deleteDocument } from '../../store/slices/documentSlice';
import { openModal, closeModal } from '../../store/slices/uiSlice';
import Modal from '../Common/Modal';
import DocumentForm from '../documents/DocumentForm';
import CustomerForm from './CustomerForm';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { selectedCustomer: customer, loading, error } = useSelector((state) => state.customers);
  const { modal } = useSelector((state) => state.ui);

  useEffect(() => {
    // Load customer details when component mounts
    if (id) {
      dispatch(getCustomer(id));
    }

    // Cleanup on unmount
    return () => {
      dispatch(clearSelectedCustomer());
    };
  }, [dispatch, id]);

  const handleRefresh = () => {
    dispatch(getCustomer(id));
  };

  const handleDeleteDocument = (docId, docName) => {
    if (window.confirm(`Are you sure you want to delete "${docName}"?`)) {
      dispatch(deleteDocument(docId)).then(() => {
        // Refresh customer data after document deletion
        dispatch(getCustomer(id));
      });
    }
  };

  const handleViewDocument = (docId) => {
    try {
      window.open(`${import.meta.env.VITE_API_URL}/documents/${docId}/view`, '_blank');
    } catch (error) {
      console.error('Failed to view document:', error);
    }
  };

  const handleAddDocument = () => {
    setIsDocumentModalOpen(true);
  };

  const handleEditCustomer = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseDocumentModal = () => {
    setIsDocumentModalOpen(false);
    dispatch(closeModal());
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    dispatch(closeModal());
  };

  const handleDocumentUploadSuccess = () => {
    // Refresh customer data after document upload
    dispatch(getCustomer(id));
    setIsDocumentModalOpen(false);
  };

  const handleCustomerUpdateSuccess = () => {
    // Refresh customer data after update
    dispatch(getCustomer(id));
    setIsEditModalOpen(false);
  };

  // Loading state
  if (loading && !customer) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Error loading customer details</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
          <div className="mt-4 flex gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/customers')}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back to Customers
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no customer data
  if (!customer) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-600 font-medium">Customer not found</p>
          <button
            onClick={() => navigate('/customers')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-gray-600">{customer.company}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleEditCustomer}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <FiEdit /> Edit
          </button>
          <button
            onClick={handleAddDocument}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Add Document
          </button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Contact</p>
          <p className="font-medium">{customer.contact}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium">{customer.email || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Status</p>
          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : 
              customer.status === 'Inactive' ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'}`}>
            {customer.status}
          </span>
        </div>
      </div>

      {/* Address */}
      {customer.address && (customer.address.street || customer.address.city) && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-2">Address</h3>
          <p className="text-gray-600">
            {customer.address.street && `${customer.address.street}, `}
            {customer.address.city && `${customer.address.city}, `}
            {customer.address.state && `${customer.address.state}, `}
            {customer.address.country && `${customer.address.country}`}
            {customer.address.zipCode && ` - ${customer.address.zipCode}`}
          </p>
        </div>
      )}

      {/* Notes */}
      {customer.notes && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-gray-600">{customer.notes}</p>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Documents</h2>
          <span className="text-sm text-gray-500">
            {customer.documents?.length || 0} documents
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customer.documents?.length > 0 ? (
                customer.documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiFileText className="text-gray-400" />
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(doc.entryDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-400" size={14} />
                        {format(new Date(doc.expiryDate), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${doc.status === 'Valid' ? 'bg-green-100 text-green-800' : 
                          doc.status === 'Critical' ? 'bg-red-100 text-red-800' : 
                          doc.status === 'Expiring Soon' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewDocument(doc._id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Document"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc._id, doc.name)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete Document"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FiFileText className="text-gray-400 mb-2" size={48} />
                      <p className="text-gray-500 font-medium">No documents found</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Add a document for this customer
                      </p>
                      <button
                        onClick={handleAddDocument}
                        className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add Document
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Document Modal */}
      <Modal 
        isOpen={isDocumentModalOpen} 
        onClose={handleCloseDocumentModal}
        size="lg"
      >
        <DocumentForm
          customerId={id}
          customerName={customer.name}
          onClose={handleCloseDocumentModal}
          onSuccess={handleDocumentUploadSuccess}
        />
      </Modal>

      {/* Edit Customer Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal}
        size="lg"
      >
        <CustomerForm
          customer={customer}
          onClose={handleCloseEditModal}
          onSuccess={handleCustomerUpdateSuccess}
        />
      </Modal>
    </div>
  );
};

export default CustomerDetail;