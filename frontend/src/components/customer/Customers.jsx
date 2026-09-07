import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiSearch, FiPlus, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { 
  getCustomers, 
  deleteCustomer, 
  clearSelectedCustomer 
} from '../../store/slices/customerSlice';
import { openModal, closeModal } from '../../store/slices/uiSlice';
import Modal from '../Common/Modal';
import CustomerForm from './CustomerForm';

const Customers = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log('Token:', token);
    console.log('User:', user);
    console.log('Is Authenticated:', !!token);
  }, [token, user]);
  
  const { customers, loading, pagination } = useSelector((state) => state.customers);
  const { modal } = useSelector((state) => state.ui);

  useEffect(() => {
    dispatch(getCustomers({ search, page, limit: 10 }));
  }, [dispatch, search, page]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      dispatch(deleteCustomer(id));
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
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
          onClick={handleAddCustomer}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FiPlus /> Add Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name or company..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/customers/${customer._id}`} className="text-blue-600 hover:underline">
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{customer.documents?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : 
                        customer.status === 'Inactive' ? 'bg-red-100 text-red-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Link to={`/customers/${customer._id}`}>
                        <button className="text-blue-600 hover:text-blue-900">
                          <FiEye />
                        </button>
                      </Link>
                      <button onClick={() => handleEdit(customer)} className="text-green-600 hover:text-green-900">
                        <FiEdit />
                      </button>
                      <button onClick={() => handleDelete(customer._id, customer.name)} className="text-red-600 hover:text-red-900">
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {customers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No customers found. Add your first customer!
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
};

export default Customers;