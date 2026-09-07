import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FiSearch, 
  FiEye, 
  FiTrash2, 
  FiCalendar,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiFilter,
  FiDownload
} from 'react-icons/fi';
import { 
  getDocuments, 
  deleteDocument,
  clearSelectedDocument 
} from '../../store/slices/documentSlice';
import { openModal, closeModal } from '../../store/slices/uiSlice';
import { viewDocumentInNewTab, downloadDocument } from '../../utils/documentHelpers';
import Modal from '../Common/Modal';
import DocumentForm from './DocumentForm';
import toast from 'react-hot-toast';

const Documents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { documents, loading, pagination } = useSelector((state) => state.documents);

  useEffect(() => {
    // Load documents when component mounts or filters change
    dispatch(getDocuments({ 
      search, 
      status: statusFilter,
      page, 
      limit: 10 
    }));
    
    return () => {
      dispatch(clearSelectedDocument());
    };
  }, [dispatch, search, statusFilter, page]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    dispatch(getDocuments({ 
      search, 
      status: statusFilter,
      page, 
      limit: 10 
    }));
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      dispatch(deleteDocument(id));
    }
  };

  const handleViewDocument = (docId) => {
    viewDocumentInNewTab(docId);
  };

  const handleDownloadDocument = async (docId, fileName) => {
    try {
      await downloadDocument(docId);
      toast.success(`Downloading ${fileName || 'document'}...`);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleAddDocument = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    dispatch(closeModal());
  };

  const handleDocumentUploadSuccess = () => {
    // Refresh the documents list
    dispatch(getDocuments({ 
      search, 
      status: statusFilter,
      page, 
      limit: 10 
    }));
    setIsModalOpen(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Valid': 'bg-green-100 text-green-800',
      'Critical': 'bg-red-100 text-red-800',
      'Expiring Soon': 'bg-yellow-100 text-yellow-800',
      'Expired': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Loading state
  if (loading && documents.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-gray-600">Manage all your documents</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddDocument}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Upload Document
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by name or customer..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={handleStatusFilter}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="">All Status</option>
            <option value="Valid">Valid</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Critical">Critical</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
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
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{doc.customer?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{doc.customer?.company || ''}</p>
                      </div>
                    </td>
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
                      <div className="flex items-center gap-2">
                        <FiCalendar className="text-gray-400" size={14} />
                        <span>{format(new Date(doc.expiryDate), 'dd MMM yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDocument(doc._id)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="View Document"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc._id, doc.name)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Download Document"
                        >
                          <FiDownload size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id, doc.name)}
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
                        {search || statusFilter ? 'Try adjusting your filters' : 'Upload your first document'}
                      </p>
                      {!search && !statusFilter && (
                        <button
                          onClick={handleAddDocument}
                          className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Upload Document
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg">
                {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        size="lg"
      >
        <DocumentForm
          onClose={handleCloseModal}
          onSuccess={handleDocumentUploadSuccess}
        />
      </Modal>
    </div>
  );
};

export default Documents;