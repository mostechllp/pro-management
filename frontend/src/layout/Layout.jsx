// src/layout/Layout.jsx
import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiHome,
  FiUsers,
  FiFileText,
  FiBell,
  FiLogOut,
  FiSettings,
  FiChevronDown,
} from 'react-icons/fi';
import { logout } from '../store/slices/authSlice';
import NotificationDropdown from '../components/common/NotificationDopdown'; // ✅ Import
import { fetchNotifications } from '../store/slices/notificationSlice'; // ✅ Import

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.dashboard);
  const { notifications } = useSelector((state) => state.notifications);

  // ✅ Fetch notifications on mount and periodically
  useEffect(() => {
    dispatch(fetchNotifications());
    
    // Refresh notifications every 5 minutes
    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/customers', icon: FiUsers, label: 'Customers' },
    { path: '/documents', icon: FiFileText, label: 'Documents' },
    { path: '/expiry', icon: FiBell, label: 'Expiry' },
  ];

  // ✅ Get notification count from notifications slice
  const notificationCount = notifications?.counts?.total || 0;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#0B1526] flex flex-col fixed h-full z-30">
        {/* Logo */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              P
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              PRO Management
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-snug">
            Customer Document &amp; Expiry Management
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' &&
                location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-3 border-t border-white/10" />

          <button
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname.startsWith('/settings')
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <FiSettings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* User Info */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.role || 'Administrator'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-1 flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        {/* Top Header */}
        <div className="h-[76px] px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {menuItems.find((item) => item.path === location.pathname)
                ?.label || 'Dashboard'}
            </h2>
            {location.pathname === '/dashboard' && (
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of your customers, documents and upcoming expiries
              </p>
            )}
          </div>
          <div className="flex items-center gap-5">
            {/* ✅ Replace the old bell button with NotificationDropdown */}
            <NotificationDropdown />
            
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.name || 'User'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {user?.role || 'Administrator'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;