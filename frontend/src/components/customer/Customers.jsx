import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiEye, FiUsers } from 'react-icons/fi';
import {
  getCustomers,
  deleteCustomer,
  clearSelectedCustomer,
} from '../../store/slices/customerSlice';
import { openModal, closeModal } from '../../store/slices/uiSlice';
import Modal from '../common/Modal';
import CustomerForm from './CustomerForm';
import DeleteConfirmationModal from '../common/DeleteModal'; 
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  Active: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  Inactive: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  Pending: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Active;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${style.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status || 'Active'}
    </span>
  );
};

const RowActions = ({ customer, onEdit, onDelete }) => (
  <div className="flex items-center gap-1.5">
    <Link
      to={`/customers/${customer._id}`}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
      title="View"
    >
      <FiEye size={16} />
    </Link>
    <button
      onClick={() => onEdit(customer)}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 transition-colors"
      title="Edit"
    >
      <FiEdit size={16} />
    </button>
    <button
      onClick={() => onDelete(customer._id, customer.name)}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 transition-colors"
      title="Delete"
    >
      <FiTrash2 size={16} />
    </button>
  </div>
);

const Customers = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const { customers, loading, pagination } = useSelector((state) => state.customers);
  const { modal } = useSelector((state) => state.ui);

  useEffect(() => {
    dispatch(getCustomers({ search, page, limit: 10 }));
  }, [dispatch, search, page]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
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
      await dispatch(deleteCustomer(deleteModal.id)).unwrap();
      toast.success(`"${deleteModal.name}" deleted successfully`);
      setDeleteModal({ isOpen: false, id: null, name: '' });
    } catch (error) {
      toast.error('Failed to delete customer');
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

  const handleEdit = (customer) => {
    dispatch(openModal({ type: 'editCustomer', data: customer }));
  };

  const handleAddCustomer = () => {
    dispatch(openModal({ type: 'addCustomer' }));
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
    dispatch(clearSelectedCustomer());
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-sm text-slate-500">
          {pagination?.total || customers.length} customers on file
        </p>
        <button
          onClick={handleAddCustomer}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
        >
          <FiPlus size={16} /> Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search customers by name or company..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Customers Table (desktop) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Documents</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <Link
                      to={`/customers/${customer._id}`}
                      className="font-medium text-slate-800 hover:text-blue-600 transition-colors"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{customer.company}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{customer.contact}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">{customer.documents?.length || 0}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <StatusBadge status={customer.status} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <RowActions customer={customer} onEdit={handleEdit} onDelete={handleDeleteClick} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Customers Cards (mobile) */}
        <div className="md:hidden divide-y divide-slate-100">
          {customers.map((customer) => (
            <div key={customer._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/customers/${customer._id}`}
                    className="font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate block"
                  >
                    {customer.name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{customer.company}</p>
                </div>
                <StatusBadge status={customer.status} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{customer.contact}</span>
                <span>{customer.documents?.length || 0} docs</span>
              </div>
              <div className="mt-3 flex justify-end">
                <RowActions customer={customer} onEdit={handleEdit} onDelete={handleDeleteClick} />
              </div>
            </div>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="p-10 text-center">
            <FiUsers className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="text-slate-500 text-sm">No customers found. Add your first customer!</p>
          </div>
        )}

        {/* Pagination */}
        {pagination?.total > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modal.isOpen} onClose={handleCloseModal}>
        <CustomerForm
          customer={modal.data || null}
          onClose={handleCloseModal}
          onSuccess={() => {
            dispatch(getCustomers({ search, page, limit: 10 }));
            handleCloseModal();
          }}
        />
      </Modal>

      {/* ✅ Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Customer"
        message="Are you sure you want to delete this customer?"
        itemName={deleteModal.name}
        loading={isDeleting}
      />
    </div>
  );
};

export default Customers;