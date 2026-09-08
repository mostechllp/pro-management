import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  FiUsers,
  FiFileText,
  FiAlertCircle,
  FiClock,
  FiUserPlus,
  FiUpload,
  FiMail,
  FiDownload,
  FiRefreshCw,
  FiChevronRight,
  FiCalendar,
  FiArrowUp,
} from 'react-icons/fi';
import { getDashboardStats, clearDashboard } from '../store/slices/dashboardSlice';
import { openModal } from '../store/slices/uiSlice';
import FormattedDate from './common/FormattedDate';
import { usePreferences } from '../hooks/usePreferences';
import { getDaysLeft, formatDaysLeft } from '../utils/dateUtils';

// Days-left filter options shown as pill tabs above the renewals table
const RENEWAL_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 7, label: '7 Days' },
  { key: 30, label: '30 Days' },
  { key: 60, label: '60 Days' },
  { key: 90, label: '90 Days' },
];

// Colors used by the document-status donut
const STATUS_COLORS = {
  valid: '#16A34A',
  expiringSoon: '#F59E0B',
  expiringLessThan7Days: '#F97316',
  expired: '#EF4444',
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { stats, loading, error } = useSelector((state) => state.dashboard);
  const [renewalFilter, setRenewalFilter] = useState('all');
  
  // Get preferences for date formatting
  const preferences = usePreferences();

  useEffect(() => {
    dispatch(getDashboardStats());
    return () => {
      dispatch(clearDashboard());
    };
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getDashboardStats());
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'addCustomer':
        navigate('/customers');
        break;
      case 'uploadDocument':
        navigate('/documents');
        break;
      case 'expiry':
        navigate('/expiry');
        break;
      default:
        break;
    }
  };

  const statsData = stats || {};

  const filteredRenewals = useMemo(() => {
    const list = statsData.upcomingRenewals || [];
    if (renewalFilter === 'all') return list;
    return list.filter((doc) => doc.daysLeft <= renewalFilter);
  }, [statsData.upcomingRenewals, renewalFilter]);

  const docStatus = statsData.documentStatus || {};
  const donutData = [
    { key: 'valid', name: 'Valid', value: docStatus.valid || 0 },
    {
      key: 'expiringSoon',
      name: 'Expiring Soon',
      value: docStatus.expiringSoon || 0,
    },
    {
      key: 'expiringLessThan7Days',
      name: 'Expiring < 7 Days',
      value: docStatus.expiringLessThan7Days || 0,
    },
    { key: 'expired', name: 'Expired', value: docStatus.expired || 0 },
  ];
  const donutTotal = docStatus.totalDocuments || 0;

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto mt-10">
        <FiAlertCircle className="text-red-500 mx-auto mb-2" size={28} />
        <p className="text-red-700 text-sm font-medium">
          Error loading dashboard
        </p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Refresh action */}
      <div className="flex justify-end mb-3 sm:mb-4">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
        <StatCard
          icon={<FiUsers size={18} className="sm:w-[22px] sm:h-[22px] text-blue-600" />}
          iconBg="bg-blue-50"
          title="Customers"
          value={statsData.customers?.total || 0}
          change={
            statsData.customers?.newThisMonth
              ? `+${statsData.customers.newThisMonth} this month`
              : null
          }
          onClick={() => navigate('/customers')}
        />
        <StatCard
          icon={<FiFileText size={18} className="sm:w-[22px] sm:h-[22px] text-violet-600" />}
          iconBg="bg-violet-50"
          title="Documents"
          value={statsData.documents?.total || 0}
          change={
            statsData.documents?.newThisMonth
              ? `+${statsData.documents.newThisMonth} this month`
              : null
          }
          onClick={() => navigate('/documents')}
        />
        <StatCard
          icon={<FiClock size={18} className="sm:w-[22px] sm:h-[22px] text-amber-500" />}
          iconBg="bg-amber-50"
          title="Expiring Soon"
          value={statsData.expiringSoon?.total || 0}
          subtitle="Next 30 days"
          onClick={() => navigate('/expiry')}
        />
        <StatCard
          icon={<FiAlertCircle size={18} className="sm:w-[22px] sm:h-[22px] text-red-500" />}
          iconBg="bg-red-50"
          title="Expired"
          value={statsData.expired?.total || 0}
          subtitle="Needs attention"
          subtitleColor="text-red-500"
          onClick={() => navigate('/expiry')}
        />
      </div>

      {/* Row 2: Upcoming Renewals + Documents Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-4 sm:mb-6">
        {/* Upcoming Renewals */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-3 sm:px-4 lg:px-5 py-3 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-start sm:items-center">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FiCalendar className="text-blue-500" size={16} />
              Upcoming Renewals
            </h2>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex bg-slate-100 rounded-lg p-1 flex-wrap">
                {RENEWAL_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setRenewalFilter(f.key)}
                    className={`px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap ${
                      renewalFilter === f.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate('/expiry')}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-0.5 whitespace-nowrap"
              >
                View All <FiChevronRight size={14} />
              </button>
            </div>
          </div>
          
          {/* Mobile card view for renewals */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {filteredRenewals.length > 0 ? (
              filteredRenewals.slice(0, 6).map((doc, index) => {
                const daysLeft = getDaysLeft(doc.expiryDate);
                return (
                  <div key={doc._id || index} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <FiFileText className="text-blue-400 shrink-0" size={14} />
                        <div>
                          <p className="font-medium text-slate-800 text-sm">
                            {doc.customer?.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {doc.customer?.company}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1.5 text-xs">
                      <div>
                        <span className="text-slate-500">Document:</span>
                        <span className="ml-1 text-slate-700 font-medium">{doc.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expiry:</span>
                        <span className="ml-1 text-slate-700">
                          <FormattedDate date={doc.expiryDate} format={preferences?.dateFormat} />
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Days Left:</span>
                        <span className={`ml-1 font-semibold ${
                          daysLeft <= 7 ? 'text-red-600' : daysLeft <= 30 ? 'text-amber-600' : 'text-green-600'
                        }`}>
                          {formatDaysLeft(daysLeft)}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => navigate(`/customers/${doc.customer?._id}`)}
                          className="text-xs font-semibold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors w-full"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No upcoming renewals
              </div>
            )}
          </div>

          {/* Desktop table view for renewals */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Days Left
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRenewals.length > 0 ? (
                  filteredRenewals.slice(0, 6).map((doc, index) => {
                    const daysLeft = getDaysLeft(doc.expiryDate);
                    return (
                      <tr
                        key={doc._id || index}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FiFileText className="text-blue-400 shrink-0" size={14} />
                            <div>
                              <p className="font-medium text-slate-800">
                                {doc.customer?.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {doc.customer?.company}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap text-slate-600">
                          {doc.name}
                        </td>
                        <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap text-slate-600">
                          <FormattedDate 
                            date={doc.expiryDate} 
                            format={preferences?.dateFormat} 
                          />
                        </td>
                        <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              daysLeft <= 7
                                ? 'bg-red-50 text-red-600'
                                : daysLeft <= 30
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-green-50 text-green-600'
                            }`}
                          >
                            {formatDaysLeft(daysLeft)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap">
                          <button
                            onClick={() =>
                              navigate(`/customers/${doc.customer?._id}`)
                            }
                            className="text-xs font-semibold text-blue-600 border border-blue-200 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      No upcoming renewals
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Documents Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="px-3 sm:px-4 lg:px-5 py-3 sm:py-4 border-b border-slate-100 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FiFileText className="text-blue-500" size={16} />
              Documents Status
            </h2>
            <span className="text-[10px] sm:text-[11px] bg-blue-50 text-blue-600 font-semibold px-2 py-1 rounded-md">
              Total: {donutTotal.toLocaleString()}
            </span>
          </div>

          <div className="p-3 sm:p-4 lg:p-5 flex flex-col flex-1">
            <div className="relative h-[160px] xs:h-[180px] sm:h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-800">
                  {donutTotal.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400">Total</span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 space-y-2">
              {donutData.map((entry) => (
                <div
                  key={entry.key}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: STATUS_COLORS[entry.key] }}
                    />
                    <span className="text-slate-600 font-medium text-[11px] sm:text-xs">
                      {entry.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                      {entry.value.toLocaleString()}
                    </span>
                    <span className="text-slate-400 w-8 sm:w-9 text-right text-[10px] sm:text-xs">
                      {donutTotal
                        ? `${((entry.value / donutTotal) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/expiry')}
              className="mt-3 sm:mt-4 w-full bg-green-50 border border-green-100 rounded-lg p-2.5 sm:p-3 flex items-center justify-between hover:bg-green-100/70 transition-colors text-left"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <FiCalendar className="text-green-600 shrink-0" size={14} />
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-green-800">
                    Next 30 days
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-green-700 truncate">
                    {statsData.expiringSoon?.next30Days || 0} documents expiring
                  </p>
                </div>
              </div>
              <FiChevronRight className="text-green-600 shrink-0 ml-2" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Customers + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
        {/* Recent Customers */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-3 sm:px-4 lg:px-5 py-3 sm:py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FiUsers className="text-blue-500" size={16} />
              Recent Customers
            </h2>
            <button
              onClick={() => navigate('/customers')}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
            >
              View All <FiChevronRight size={14} />
            </button>
          </div>
          
          {/* Mobile card view for customers */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {statsData.recentCustomers?.length > 0 ? (
              statsData.recentCustomers.slice(0, 5).map((customer, index) => (
                <div
                  key={customer._id || index}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/customers/${customer._id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-blue-400 shrink-0" size={14} />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-400">{customer.company}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                        customer.status === 'Inactive'
                          ? 'bg-red-100 text-red-700'
                          : customer.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 self-center ${
                          customer.status === 'Inactive'
                            ? 'bg-red-500'
                            : customer.status === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}
                      />
                      {customer.status || 'Active'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-500">
                      Documents: {customer.documents?.length || 0}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customers/${customer._id}`);
                      }}
                      className="text-xs font-semibold text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No customers found
              </div>
            )}
          </div>

          {/* Desktop table view for customers */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 lg:px-5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statsData.recentCustomers?.length > 0 ? (
                  statsData.recentCustomers.slice(0, 5).map((customer, index) => (
                    <tr
                      key={customer._id || index}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/customers/${customer._id}`)}
                    >
                      <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap font-medium text-slate-800 flex items-center gap-2">
                        <FiFileText className="text-blue-400 shrink-0" size={14} />
                        {customer.name}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap text-slate-600">
                        {customer.company}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap text-slate-600">
                        {customer.documents?.length || 0}
                      </td>
                      <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                            customer.status === 'Inactive'
                              ? 'bg-red-100 text-red-700'
                              : customer.status === 'Pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 self-center ${
                              customer.status === 'Inactive'
                                ? 'bg-red-500'
                                : customer.status === 'Pending'
                                  ? 'bg-amber-500'
                                  : 'bg-green-500'
                            }`}
                          />
                          {customer.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 lg:px-5 py-3 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${customer._id}`);
                          }}
                          className="text-xs font-semibold text-blue-600 border border-blue-200 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 sm:mb-4">
            <FiArrowUp className="text-amber-500 rotate-45" size={16} />
            Quick Actions
          </h2>
          <div className="space-y-2.5 sm:space-y-3">
            <QuickAction
              icon={<FiUserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />}
              iconBg="bg-blue-500"
              title="Add Customer"
              description="Register a new customer"
              onClick={() => handleQuickAction('addCustomer')}
            />
            <QuickAction
              icon={<FiUpload size={16} className="sm:w-[18px] sm:h-[18px]" />}
              iconBg="bg-violet-500"
              title="Upload Document"
              description="Add a new document"
              onClick={() => handleQuickAction('uploadDocument')}
            />
            <QuickAction
              icon={<FiCalendar size={16} className="sm:w-[18px] sm:h-[18px]" />}
              iconBg="bg-green-500"
              title="Expiry of Documents"
              description="Notify about upcoming expiries"
              onClick={() => handleQuickAction('expiry')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component - Fully Responsive
const StatCard = ({
  icon,
  iconBg,
  title,
  value,
  change,
  subtitle,
  subtitleColor = 'text-slate-400',
  onClick,
}) => (
  <div
    className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 lg:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-between"
    onClick={onClick}
  >
    <div className="min-w-0">
      <div className="flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <span className="text-[11px] sm:text-xs lg:text-sm font-semibold text-slate-500 truncate">
          {title}
        </span>
      </div>
      <p className="text-xl sm:text-2xl lg:text-[26px] leading-none font-extrabold text-slate-900">
        {value.toLocaleString()}
      </p>
      {change && (
        <p className="text-[10px] sm:text-xs font-semibold text-green-600 mt-1.5 sm:mt-2 flex items-center gap-1">
          <FiArrowUp size={10} className="sm:w-[11px] sm:h-[11px]" /> {change}
        </p>
      )}
      {subtitle && (
        <p className={`text-[10px] sm:text-xs font-medium mt-1.5 sm:mt-2 ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
    </div>
    <FiChevronRight className="text-slate-300 shrink-0 ml-2" size={16} />
  </div>
);

// Status Badge - Responsive
const StatusBadge = ({ status }) => {
  const styles = {
    Critical: 'bg-red-100 text-red-700',
    Soon: 'bg-amber-100 text-amber-700',
    Upcoming: 'bg-blue-100 text-blue-700',
    Normal: 'bg-green-100 text-green-700',
  };
  const dotStyles = {
    Critical: 'bg-red-500',
    Soon: 'bg-amber-500',
    Upcoming: 'bg-blue-500',
    Normal: 'bg-green-500',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full ${
        styles[status] || styles.Normal
      }`}
    >
      <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${dotStyles[status] || dotStyles.Normal}`} />
      {status}
    </span>
  );
};

// Quick Action Component - Responsive
const QuickAction = ({ icon, iconBg, title, description, onClick }) => (
  <div
    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${iconBg} text-white flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div className="min-w-0">
      <h3 className="text-xs sm:text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{description}</p>
    </div>
  </div>
);

export default Dashboard;