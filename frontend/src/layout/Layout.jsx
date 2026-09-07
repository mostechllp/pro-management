import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiHome, 
  FiUsers, 
  FiFileText, 
  FiBell, 
  FiLogOut,
  FiMenu,
  FiX,
  FiUser
} from 'react-icons/fi';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar } from '../store/slices/uiSlice';

const Layout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);

  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/customers', icon: FiUsers, label: 'Customers' },
    { path: '/documents', icon: FiFileText, label: 'Documents' },
    { path: '/expiry', icon: FiBell, label: 'Expiry' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col fixed h-full z-30`}>
        {/* Logo */}
        <div className="p-4 border-b flex items-center justify-between">
          {sidebarOpen ? (
            <h1 className="text-xl font-bold text-blue-600">PRO Management</h1>
          ) : (
            <h1 className="text-xl font-bold text-blue-600">PRO</h1>
          )}
          <button
            onClick={handleToggleSidebar}
            className="p-1 rounded hover:bg-gray-100"
          >
            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase() || <FiUser />}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-4 bg-white shadow-sm sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Welcome, {user?.name || 'User'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;