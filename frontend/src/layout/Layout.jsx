// src/layout/Layout.jsx
import React, { useEffect, useState } from 'react';
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
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { logout } from '../store/slices/authSlice';
import NotificationDropdown from '../components/common/NotificationDopdown';
import { fetchNotifications } from '../store/slices/notificationSlice';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { stats } = useSelector((state) => state.dashboard);
  const { notifications } = useSelector((state) => state.notifications);
  
  // State for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Fetch notifications on mount and periodically
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

  // Get notification count from notifications slice
  const notificationCount = notifications?.counts?.total || 0;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Sidebar content (reused for both mobile and desktop)
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 sm:px-5 py-4 sm:py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
            P
          </div>
          <span className="text-white font-bold text-base sm:text-lg tracking-tight">
            PRO Management
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 sm:mt-2 leading-snug">
          Customer Document &amp; Expiry Management
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 sm:px-3 pt-1 sm:pt-2 overflow-y-auto">
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
              className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg mb-0.5 sm:mb-1 text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="my-2 sm:my-3 border-t border-white/10" />

        <button
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            location.pathname.startsWith('/settings')
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <FiSettings size={16} className="sm:w-[18px] sm:h-[18px]" />
          <span>Settings</span>
        </button>
      </nav>

      {/* User Info */}
      <div className="p-2 sm:p-3 border-t border-white/10">
        <div className="flex items-center gap-2 sm:gap-2.5 px-2 py-1.5 sm:py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-white truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">
              {user?.role || 'Administrator'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-0.5 sm:mt-1 flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <FiLogOut size={14} className="sm:w-4 sm:h-4" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:w-64 bg-[#0B1526] flex-col fixed h-full z-30">
        <SidebarContent />
      </div>

      {/* Sidebar - Mobile (Slide-in) */}
      <div
        className={`
          lg:hidden fixed top-0 left-0 h-full w-72 sm:w-80 bg-[#0B1526] z-50 
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Mobile Close Button */}
          <button
            onClick={closeSidebar}
            className="absolute top-3 right-3 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10"
          >
            <FiX size={22} />
          </button>
          <SidebarContent />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0 w-full">
        {/* Top Header */}
        <div className="h-[60px] sm:h-[68px] lg:h-[76px] px-3 sm:px-4 lg:px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={20} className="sm:w-6 sm:h-6" />
            </button>

            <div className="min-w-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 truncate">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.label || 'Dashboard'}
              </h2>
              {location.pathname === '/dashboard' && (
                <p className="hidden sm:block text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                  Overview of your customers, documents and upcoming expiries
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 lg:gap-5">
            {/* Notification Dropdown */}
            <NotificationDropdown />
            
            <div className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm overflow-hidden shrink-0">
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
              <div className="hidden sm:block leading-tight">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-[80px] lg:max-w-none">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[80px] lg:max-w-none">
                  {user?.role || 'Administrator'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;