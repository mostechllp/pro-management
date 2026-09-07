import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { 
  FiSearch, 
  FiEye, 
  FiTrash2, 
  FiCalendar,
  FiFileText,
  FiRefreshCw,
  FiAlertTriangle,
  FiClock,
  FiFilter,
  FiDownload
} from 'react-icons/fi';
import { 
  getExpiringDocuments, 
  deleteExpiringDocument,
  clearExpiryState 
} from '../../store/slices/expirySlice';

const Expiry = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('expiryDate');
  const [sortOrder, setSortOrder] = useState('asc');

  const { documents, loading, total } = useSelector((state) => state.expiry);

  useEffect(() => {
    // Load expiring documents when component mounts or filters change
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

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      dispatch(deleteExpiringDocument(id));
    }
  };

  const handleViewDocument = (docId) => {
    // Open document in new tab
    window.open(`${process.env.REACT_APP_API_URL}/documents/${docId}/view`, '_blank');
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Critical': 'bg-red-100 text-red-800',
      'Expiring Soon': 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'Critical') {
      return <FiAlertTriangle className="text-red-500" size={16} />;
    }
    return <FiClock className="text-yellow-500" size={16} />;
  };

  // Sort documents
  const sortedDocuments = [...documents].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'expiryDate') {
      comparison = new Date(a.expiryDate) - new Date(b.expiryDate);
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'customer') {
      comparison = (a.customer?.name || '').localeCompare(b.customer?.name || '');
    } else if (sortBy === 'daysLeft') {
      const daysA = Math.ceil((new Date(a.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      const daysB = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      comparison = daysA - daysB;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Loading state
  if (loading && documents.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expiring documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FiAlertTriangle className="text-yellow-500" />
            Upcoming Expiry
          </h1>
          <p className="text-gray-600">Documents expiring in the next 30 days</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2">
            <FiClock />
            <span className="font-semibold">{total}</span>
            <span>documents expiring soon</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      {documents.some(doc => {
        const daysLeft = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7;
      }) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <FiAlertTriangle className="text-red-500" size={24} />
          <div>
            <p className="text-red-700 font-medium">⚠️ Urgent Attention Required</p>
            <p className="text-red-600 text-sm">
              Some documents are expiring within 7 days. Please take immediate action.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expiring documents by name or customer..."
            value={search}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSort('expiryDate')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <FiCalendar />
            Sort by Date
            {sortBy === 'expiryDate' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('daysLeft')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <FiClock />
            Sort by Days
            {sortBy === 'daysLeft' && (
              <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
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
                  Days Left
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
              {sortedDocuments.length > 0 ? (
                sortedDocuments.map((doc) => {
                  const daysLeft = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  const isCritical = daysLeft <= 7;
                  
                  return (
                    <tr 
                      key={doc._id} 
                      className={`hover:bg-gray-50 transition-colors ${isCritical ? 'bg-red-50' : ''}`}
                    >
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
                        <span className={`font-semibold ${isCritical ? 'text-red-600' : 'text-yellow-600'}`}>
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(doc.status)}
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </div>
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
                            onClick={() => handleDelete(doc._id, doc.name)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete Document"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <FiFileText className="text-gray-400 mb-2" size={48} />
                      <p className="text-gray-500 font-medium">No documents expiring soon</p>
                      <p className="text-gray-400 text-sm mt-1">
                        All documents are valid and up to date! 🎉
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-6 py-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} expiring documents
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg font-medium">
                Page {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {documents.length > 0 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expiring</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <FiClock className="text-yellow-500" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical (≤ 7 days)</p>
                <p className="text-2xl font-bold text-red-600">
                  {documents.filter(doc => {
                    const daysLeft = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return daysLeft <= 7;
                  }).length}
                </p>
              </div>
              <FiAlertTriangle className="text-red-500" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expiring Soon (8-30 days)</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {documents.filter(doc => {
                    const daysLeft = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return daysLeft > 7 && daysLeft <= 30;
                  }).length}
                </p>
              </div>
              <FiClock className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expiry;