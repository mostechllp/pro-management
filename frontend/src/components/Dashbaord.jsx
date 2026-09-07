import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  FiUsers, 
  FiFileText, 
  FiAlertCircle, 
  FiClock,
  FiUserPlus,
  FiUpload,
  FiMail,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { getDashboardStats, clearDashboard } from '../store/slices/dashboardSlice';
import { openModal } from '../store/slices/uiSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    // Load dashboard stats when component mounts
    dispatch(getDashboardStats());
    
    // Cleanup on unmount
    return () => {
      dispatch(clearDashboard());
    };
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getDashboardStats());
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'addCustomer':
        dispatch(openModal({ type: 'addCustomer' }));
        break;
      case 'uploadDocument':
        navigate('/documents');
        break;
      case 'sendReminders':
        // Implement send reminders functionality
        break;
      case 'exportReport':
        // Implement export functionality
        break;
      default:
        break;
    }
  };

  if (loading && !stats) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <FiAlertCircle className="text-red-500 mx-auto mb-2" size={32} />
          <p className="text-red-600">Error loading dashboard</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const statsData = stats || {};

  return (
    <div className="p-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Overview of your customers, documents and upcoming expiries</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<FiUsers className="text-blue-500" size={24} />}
          title="Customers"
          value={statsData.customers?.total || 0}
          change="+12 this month"
          changeType="up"
          onClick={() => navigate('/customers')}
        />
        <StatCard 
          icon={<FiFileText className="text-green-500" size={24} />}
          title="Documents"
          value={statsData.documents?.total || 0}
          change="+124 this month"
          changeType="up"
          onClick={() => navigate('/documents')}
        />
        <StatCard 
          icon={<FiClock className="text-yellow-500" size={24} />}
          title="Expiring Soon"
          value={statsData.expiringSoon?.total || 0}
          subtitle="Next 30 days"
          onClick={() => navigate('/expiry')}
        />
        <StatCard 
          icon={<FiAlertCircle className="text-red-500" size={24} />}
          title="Expired"
          value={statsData.expired?.total || 0}
          subtitle="Needs attention"
          changeType="danger"
          onClick={() => navigate('/expiry')}
        />
      </div>

      {/* Upcoming Renewals Table */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Upcoming Renewals</h2>
          <button 
            onClick={() => navigate('/expiry')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statsData.upcomingRenewals?.length > 0 ? (
                statsData.upcomingRenewals.map((doc, index) => (
                  <tr key={doc._id || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium">{doc.customer?.name}</p>
                        <p className="text-sm text-gray-500">{doc.customer?.company}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(doc.expiryDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-semibold ${
                        doc.daysLeft <= 7 ? 'text-red-600' : 
                        doc.daysLeft <= 30 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {doc.daysLeft} days
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${doc.status === 'Critical' ? 'bg-red-100 text-red-800' : 
                          doc.status === 'Soon' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => navigate(`/customers/${doc.customer?._id}`)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No upcoming renewals. All documents are valid!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Status and Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Status */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Documents Status</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer" onClick={() => navigate('/documents')}>
                <p className="text-2xl font-bold text-blue-600">{statsData.documentStatus?.totalDocuments || 0}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer" onClick={() => navigate('/documents')}>
                <p className="text-2xl font-bold text-green-600">{statsData.documentStatus?.valid || 0}</p>
                <p className="text-sm text-gray-600">Valid</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer" onClick={() => navigate('/expiry')}>
                <p className="text-2xl font-bold text-yellow-600">{statsData.documentStatus?.expiringSoon || 0}</p>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                {statsData.documentStatus?.expiringLessThan7Days > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    {statsData.documentStatus.expiringLessThan7Days} expiring in &lt; 7 days
                  </p>
                )}
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer" onClick={() => navigate('/expiry')}>
                <p className="text-2xl font-bold text-red-600">{statsData.documentStatus?.expired || 0}</p>
                <p className="text-sm text-gray-600">Expired</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Customers</h2>
            <button 
              onClick={() => navigate('/customers')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statsData.recentCustomers?.length > 0 ? (
                  statsData.recentCustomers.map((customer, index) => (
                    <tr 
                      key={customer._id || index}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/customers/${customer._id}`)}
                    >
                      <td className="px-4 py-2 whitespace-nowrap font-medium">{customer.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{customer.company}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{customer.documents?.length || 0}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${customer.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            customer.status === 'Inactive' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {customer.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction 
          icon={<FiUserPlus size={24} />} 
          title="Add Customer" 
          description="Register a new customer"
          onClick={() => handleQuickAction('addCustomer')}
        />
        <QuickAction 
          icon={<FiUpload size={24} />} 
          title="Upload Document" 
          description="Add a new document"
          onClick={() => handleQuickAction('uploadDocument')}
        />
        <QuickAction 
          icon={<FiMail size={24} />} 
          title="Send Reminders" 
          description="Notify about upcoming expiries"
          onClick={() => handleQuickAction('sendReminders')}
        />
        <QuickAction 
          icon={<FiDownload size={24} />} 
          title="Export Report" 
          description="Download data as PDF or Excel"
          onClick={() => handleQuickAction('exportReport')}
        />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, change, changeType, subtitle, onClick }) => (
  <div 
    className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      </div>
      {change && (
        <span className={`text-sm font-medium ${
          changeType === 'up' ? 'text-green-600' : 
          changeType === 'danger' ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          {change}
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

// Quick Action Component
const QuickAction = ({ icon, title, description, onClick }) => (
  <div 
    className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
    onClick={onClick}
  >
    <div className="flex flex-col items-center text-center">
      <div className="text-blue-600 mb-2">{icon}</div>
      <h3 className="font-medium text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  </div>
);

export default Dashboard;