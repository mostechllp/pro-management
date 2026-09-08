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
  FiRefreshCw,
  FiPhone,
  FiMail,
  FiMapPin,
} from 'react-icons/fi';
import { getCustomer, clearSelectedCustomer } from '../../store/slices/customerSlice';
import { deleteDocument } from '../../store/slices/documentSlice';
import { closeModal } from '../../store/slices/uiSlice';
import Modal from '../Common/Modal';
import DocumentForm from '../documents/DocumentForm';
import CustomerForm from './CustomerForm';
import DeleteConfirmationModal from '../common/DeleteModal'; // ✅ Added
import toast from 'react-hot-toast';
import { viewDoc } from '../../utils/documentHelpers';

const STATUS_STYLES = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-700',
  Pending: 'bg-amber-100 text-amber-700',
};

const DOC_STATUS_STYLES = {
  Valid: 'bg-green-100 text-green-700',
  Critical: 'bg-red-100 text-red-700',
  'Expiring Soon': 'bg-amber-100 text-amber-700',
};

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // ✅ Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const { selectedCustomer: customer, loading, error } = useSelector((state) => state.customers);

  useEffect(() => {
    if (id) {
      dispatch(getCustomer(id));
    }
    return () => {
      dispatch(clearSelectedCustomer());
    };
  }, [dispatch, id]);

  const handleRefresh = () => {
    dispatch(getCustomer(id));
  };

  // ✅ Handle delete - opens the delete modal
  const handleDeleteClick = (id, name) => {
    setDeleteModal({
      isOpen: true,
      id: id,
      name: name,
    });
  };

  // ✅ Confirm delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteDocument(deleteModal.id)).unwrap();
      toast.success(`"${deleteModal.name}" deleted successfully`);
      setDeleteModal({ isOpen: false, id: null, name: '' });
      // Refresh the customer data
      dispatch(getCustomer(id));
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ Close delete modal
  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  const handleViewDocument = async (docId, fileName) => {
      try {
        await viewDoc(docId, fileName);
        toast.success(`Downloading ${fileName || "document"}...`);
      } catch (error) {
        toast.error("Failed to download document");
      }
    };

  const handleAddDocument = () => setIsDocumentModalOpen(true);
  const handleEditCustomer = () => setIsEditModalOpen(true);

  const handleCloseDocumentModal = () => {
    setIsDocumentModalOpen(false);
    dispatch(closeModal());
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    dispatch(closeModal());
  };

  const handleDocumentUploadSuccess = () => {
    dispatch(getCustomer(id));
    setIsDocumentModalOpen(false);
  };

  const handleCustomerUpdateSuccess = () => {
    dispatch(getCustomer(id));
    setIsEditModalOpen(false);
  };

  if (loading && !customer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 text-sm">Loading customer details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto mt-10">
        <p className="text-red-700 font-medium text-sm">Error loading customer details</p>
        <p className="text-red-500 text-xs mt-1">{error}</p>
        <div className="mt-4 flex gap-3 justify-center">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/customers')}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center max-w-md mx-auto mt-10">
        <p className="text-amber-700 font-medium text-sm">Customer not found</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate('/customers')}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">{customer.name}</h1>
            <p className="text-sm text-slate-500 truncate">{customer.company}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleEditCustomer}
            className="flex-1 sm:flex-none justify-center bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            <FiEdit size={15} /> Edit
          </button>
          <button
            onClick={handleAddDocument}
            className="flex-1 sm:flex-none justify-center bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiPlus size={15} /> Add Document
          </button>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <FiPhone size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Contact</p>
            <p className="font-semibold text-slate-800 truncate">{customer.contact}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
            <FiMail size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Email</p>
            <p className="font-semibold text-slate-800 truncate">{customer.email || 'N/A'}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Status</p>
            <span
              className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${
                STATUS_STYLES[customer.status] || STATUS_STYLES.Active
              }`}
            >
              {customer.status}
            </span>
          </div>
        </div>
      </div>

      {/* Address */}
      {customer.address && (customer.address.street || customer.address.city) && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <FiMapPin size={15} className="text-slate-400" /> Address
          </h3>
          <p className="text-sm text-slate-600">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Notes</h3>
          <p className="text-sm text-slate-600">{customer.notes}</p>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FiFileText className="text-blue-500" size={16} />
            Documents
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {customer.documents?.length || 0} documents
          </span>
        </div>

        {/* Table (desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Document Name</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Entry Date</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customer.documents?.length > 0 ? (
                customer.documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiFileText className="text-slate-400 shrink-0" size={14} />
                        <span className="font-medium text-slate-800">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      {format(new Date(doc.entryDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <FiCalendar className="text-slate-400" size={13} />
                        {format(new Date(doc.expiryDate), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${
                          DOC_STATUS_STYLES[doc.status] || 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDocument(doc._id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Document"
                        >
                          <FiEye size={16} />
                        </button>
                        <button
                          // ✅ Updated to use handleDeleteClick
                          onClick={() => handleDeleteClick(doc._id, doc.name)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Document"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <EmptyDocuments onAdd={handleAddDocument} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y divide-slate-100">
          {customer.documents?.length > 0 ? (
            customer.documents.map((doc) => (
              <div key={doc._id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FiFileText className="text-slate-400 shrink-0" size={14} />
                    <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${
                      DOC_STATUS_STYLES[doc.status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                    {doc.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar size={12} /> {format(new Date(doc.expiryDate), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <button
                    onClick={() => handleViewDocument(doc._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <FiEye size={16} />
                  </button>
                  <button
                    // ✅ Updated to use handleDeleteClick
                    onClick={() => handleDeleteClick(doc._id, doc.name)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8">
              <EmptyDocuments onAdd={handleAddDocument} />
            </div>
          )}
        </div>
      </div>

      {/* Add Document Modal */}
      <Modal isOpen={isDocumentModalOpen} onClose={handleCloseDocumentModal} size="lg">
        <DocumentForm
          customerId={id}
          customerName={customer.name}
          onClose={handleCloseDocumentModal}
          onSuccess={handleDocumentUploadSuccess}
        />
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} size="lg">
        <CustomerForm
          customer={customer}
          onClose={handleCloseEditModal}
          onSuccess={handleCustomerUpdateSuccess}
        />
      </Modal>

      {/* ✅ Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        itemName={deleteModal.name}
        loading={isDeleting}
      />
    </div>
  );
};

const EmptyDocuments = ({ onAdd }) => (
  <div className="flex flex-col items-center">
    <FiFileText className="text-slate-300 mb-2" size={40} />
    <p className="text-slate-500 font-medium text-sm">No documents found</p>
    <p className="text-slate-400 text-xs mt-1">Add a document for this customer</p>
    <button
      onClick={onAdd}
      className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-semibold"
    >
      + Add Document
    </button>
  </div>
);

export default CustomerDetail;