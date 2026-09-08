import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch,
  FiEye,
  FiTrash2,
  FiCalendar,
  FiFileText,
  FiRefreshCw,
  FiAlertTriangle,
  FiClock,
  FiEdit, 
} from 'react-icons/fi';
import { getExpiringDocuments, deleteExpiringDocument, clearExpiryState } from '../../store/slices/expirySlice';
import { updateDocument } from '../../store/slices/documentSlice'; 
import { viewDoc } from '../../utils/documentHelpers';
import Modal from '../common/Modal'; 
import EditDocumentForm from '../documents/EditDocumentForm'; 
import toast from 'react-hot-toast';
import DeleteConfirmationModal from '../common/DeleteModal';
import FormattedDate from '../common/FormattedDate'; // ✅ Import FormattedDate
import { usePreferences } from '../../hooks/usePreferences'; // ✅ Import usePreferences
import { getDaysLeft, formatDaysLeft } from '../../utils/dateUtils'; // ✅ Import date utilities

const STATUS_STYLES = {
  Critical: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  'Expiring Soon': { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES['Expiring Soon'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

const Expiry = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('expiryDate');
  const [sortOrder, setSortOrder] = useState('asc');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const { documents, loading, total } = useSelector((state) => state.expiry);
  
  // ✅ Get preferences for date formatting
  const preferences = usePreferences();

  useEffect(() => {
    dispatch(getExpiringDocuments({ search, page, limit: 10 }));
    return () => {
      dispatch(clearExpiryState());
    };
  }, [dispatch, search, page]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleRefresh = () => {
    dispatch(getExpiringDocuments({ search, page, limit: 10 }));
  };

  // Handle delete - opens the delete modal
  const handleDeleteClick = (id, name) => {
    setDeleteModal({
      isOpen: true,
      id: id,
      name: name,
    });
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteExpiringDocument(deleteModal.id)).unwrap();
      toast.success(`"${deleteModal.name}" deleted successfully`);
      setDeleteModal({ isOpen: false, id: null, name: '' });
      // Refresh the list
      dispatch(getExpiringDocuments({ search, page, limit: 10 }));
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  // Close delete modal
  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, id: null, name: '' });
    }
  };

  // Handle edit - opens the edit modal
  const handleEditClick = (document) => {
    setEditingDocument(document);
    setIsEditModalOpen(true);
  };

  // Handle edit document submit
  const handleEditSubmit = async (formData) => {
    try {
      await dispatch(updateDocument({
        id: editingDocument._id,
        data: formData
      })).unwrap();
      toast.success('Document updated successfully!');
      setIsEditModalOpen(false);
      setEditingDocument(null);
      // Refresh the expiring documents list
      dispatch(getExpiringDocuments({ search, page, limit: 10 }));
    } catch (error) {
      toast.error('Failed to update document');
    }
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDocument(null);
  };

  const handleViewDocument = async (docId, fileName) => {
    try {
      await viewDoc(docId, fileName);
      toast.success(`Downloading ${fileName || "document"}...`);
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // ✅ Use getDaysLeft utility instead of inline function
  const getDaysLeftForDoc = (doc) => getDaysLeft(doc.expiryDate);

  const sortedDocuments = [...documents].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'expiryDate') {
      comparison = new Date(a.expiryDate) - new Date(b.expiryDate);
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'customer') {
      comparison = (a.customer?.name || '').localeCompare(b.customer?.name || '');
    } else if (sortBy === 'daysLeft') {
      comparison = getDaysLeftForDoc(a) - getDaysLeftForDoc(b);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // ✅ Use getDaysLeft utility
  const hasUrgent = documents.some((doc) => getDaysLeft(doc.expiryDate) <= 7);
  const criticalCount = documents.filter((doc) => getDaysLeft(doc.expiryDate) <= 7).length;
  const soonCount = documents.filter((doc) => {
    const d = getDaysLeft(doc.expiryDate);
    return d > 7 && d <= 30;
  }).length;

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 text-sm">Loading expiring documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-sm text-slate-500">Documents expiring in the next 30 days</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-amber-50 text-amber-700 px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm">
            <FiClock size={15} />
            <span className="font-bold">{total}</span>
            <span>expiring soon</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {hasUrgent && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <FiAlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-red-700 font-semibold text-sm">Urgent attention required</p>
            <p className="text-red-600 text-xs mt-0.5">
              Some documents are expiring within 7 days. Please take immediate action.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {documents.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Expiring</p>
              <p className="text-2xl font-extrabold text-slate-800">{total}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <FiClock className="text-amber-500" size={18} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Critical (&le; 7 days)</p>
              <p className="text-2xl font-extrabold text-red-600">{criticalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <FiAlertTriangle className="text-red-500" size={18} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Expiring Soon (8-30 days)</p>
              <p className="text-2xl font-extrabold text-amber-600">{soonCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <FiClock className="text-amber-500" size={18} />
            </div>
          </div>
        </div>
      )}

      {/* Search and Sort */}
      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search expiring documents by name or customer..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSort('expiryDate')}
            className="px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <FiCalendar size={14} />
            Date
            {sortBy === 'expiryDate' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
          </button>
          <button
            onClick={() => handleSort('daysLeft')}
            className="px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <FiClock size={14} />
            Days Left
            {sortBy === 'daysLeft' && <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Document Name</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Days Left</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDocuments.length > 0 ? (
                sortedDocuments.map((doc) => {
                  // ✅ Use getDaysLeft utility
                  const daysLeft = getDaysLeft(doc.expiryDate);
                  const isCritical = daysLeft <= 7;
                  return (
                    <tr key={doc._id} className={`hover:bg-slate-50 transition-colors ${isCritical ? 'bg-red-50/40' : ''}`}>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{doc.customer?.name || 'N/A'}</p>
                        <p className="text-xs text-slate-500">{doc.customer?.company || ''}</p>
                      </td>
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
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <FiCalendar className="text-slate-400" size={13} />
                          {/* ✅ Use FormattedDate for expiry date */}
                          <FormattedDate 
                            date={doc.expiryDate} 
                            format={preferences?.dateFormat} 
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                          {/* ✅ Use formatDaysLeft utility */}
                          {formatDaysLeft(daysLeft)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <StatusBadge status={doc.status} />
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
                            onClick={() => handleEditClick(doc)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit Document"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(doc._id, doc.name)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Document"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards (mobile) */}
        <div className="md:hidden divide-y divide-slate-100">
          {sortedDocuments.length > 0 ? (
            sortedDocuments.map((doc) => {
              // ✅ Use getDaysLeft utility
              const daysLeft = getDaysLeft(doc.expiryDate);
              const isCritical = daysLeft <= 7;
              return (
                <div key={doc._id} className={`p-4 ${isCritical ? 'bg-red-50/40' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FiFileText className="text-slate-400 shrink-0" size={14} />
                      <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {doc.customer?.name || 'N/A'} {doc.customer?.company ? `· ${doc.customer.company}` : ''}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-500">
                      <FiCalendar size={12} />
                      {/* ✅ Use FormattedDate for mobile expiry date */}
                      <FormattedDate 
                        date={doc.expiryDate} 
                        format={preferences?.dateFormat} 
                      />
                    </span>
                    <span className={`font-bold ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                      {/* ✅ Use formatDaysLeft utility */}
                      {formatDaysLeft(daysLeft)} left
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
                      onClick={() => handleEditClick(doc)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      <FiEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(doc._id, doc.name)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8">
              <EmptyState />
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-slate-500">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} expiring documents
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-lg">
                Page {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Document Modal */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} size="lg">
        <EditDocumentForm
          document={editingDocument}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSubmit}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Document"
        message="Are you sure you want to delete this expiring document?"
        itemName={deleteModal.name}
        loading={isDeleting}
      />
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center">
    <FiFileText className="text-slate-300 mb-2" size={40} />
    <p className="text-slate-500 font-medium text-sm">No documents expiring soon</p>
    <p className="text-slate-400 text-xs mt-1">All documents are valid and up to date.</p>
  </div>
);

export default Expiry;