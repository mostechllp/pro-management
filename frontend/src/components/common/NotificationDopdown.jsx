// src/components/Common/NotificationDropdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FiBell, 
  FiX, 
  FiClock, 
  FiAlertTriangle, 
  FiCheckCircle,
  FiFileText,
  FiCheck,
  FiFilter,
} from 'react-icons/fi';
import { MdDoneAll } from "react-icons/md";
import { 
  fetchNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  deleteNotification 
} from '../../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from './DeleteModal';

const NotificationDropdown = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(true);
  const dropdownRef = useRef(null);
  
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    message: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { notifications, unreadCount, loading, pagination } = useSelector(
    (state) => state.notifications
  );

  // Filter notifications based on showUnreadOnly
  const filteredNotifications = showUnreadOnly
    ? notifications.filter(n => !n.read)
    : notifications;

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ page: 1, limit: 50 }));
    }
  }, [isOpen, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (notificationId, e) => {
    e.stopPropagation();
    await dispatch(markNotificationRead(notificationId)).unwrap();
  };

  const handleMarkAllRead = async () => {
    await dispatch(markAllNotificationsRead()).unwrap();
    toast.success('All notifications marked as read');
  };

  const handleDeleteClick = (notificationId, message, e) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      id: notificationId,
      message: message,
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await dispatch(deleteNotification(deleteModal.id)).unwrap();
      toast.success('Notification deleted');
      setDeleteModal({ isOpen: false, id: null, message: '' });
    } catch (error) {
      toast.error('Failed to delete notification');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, id: null, message: '' });
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'EXPIRING_1_DAY':
        return <FiAlertTriangle className="text-red-500" size={16} />;
      case 'EXPIRING_7_DAYS':
        return <FiClock className="text-amber-500" size={16} />;
      case 'EXPIRED':
        return <FiAlertTriangle className="text-red-500" size={16} />;
      default:
        return <FiFileText className="text-blue-500" size={16} />;
    }
  };

  const getUrgencyColor = (type) => {
    switch (type) {
      case 'EXPIRING_1_DAY':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'EXPIRING_7_DAYS':
        return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
      case 'EXPIRED':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      default:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markNotificationRead(notification._id));
    }
    setIsOpen(false);
    navigate('/documents');
  };

  const displayCount = showUnreadOnly ? unreadCount : notifications.length;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Icon */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative text-slate-500 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-slate-100"
        >
          <FiBell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-100 max-w-[90vw] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-800 text-sm">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Filter toggle */}
                <button
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  className={`p-1 text-xs rounded transition-colors flex items-center gap-1 ${
                    showUnreadOnly 
                      ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-50' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  title={showUnreadOnly ? 'Show all notifications' : 'Show unread only'}
                >
                  <FiFilter size={14} />
                  {showUnreadOnly ? 'Unread' : 'All'}
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <MdDoneAll size={14} /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Content with custom scrollbar */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <FiCheckCircle className="text-green-500 mb-2" size={32} />
                  <p className="text-slate-600 font-medium text-sm">
                    {showUnreadOnly ? 'No unread notifications' : 'All caught up!'}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {showUnreadOnly && notifications.length > 0 
                      ? 'You have read all notifications' 
                      : 'No notifications'}
                  </p>
                  {showUnreadOnly && notifications.length > 0 && (
                    <button
                      onClick={() => setShowUnreadOnly(false)}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Show all notifications
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      onDelete={handleDeleteClick}
                      onClick={handleNotificationClick}
                      icon={getNotificationIcon(notification.type)}
                      colorClass={getUrgencyColor(notification.type)}
                    />
                  ))}

                  {/* Show all link if filtering unread and there are read notifications */}
                  {showUnreadOnly && notifications.length > filteredNotifications.length && (
                    <div className="px-4 py-2 text-center border-t border-slate-100">
                      <button
                        onClick={() => setShowUnreadOnly(false)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Show all {notifications.length} notifications
                      </button>
                    </div>
                  )}

                  {/* Load More */}
                  {pagination.pages > pagination.page && (
                    <div className="p-2 border-t border-slate-100">
                      <button
                        onClick={() => {
                          dispatch(fetchNotifications({ 
                            page: pagination.page + 1, 
                            limit: pagination.limit 
                          }));
                        }}
                        className="w-full py-2 text-sm text-center text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Load more...
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* View All Button */}
            <div className="p-2 border-t border-slate-100">
              <button
                onClick={handleViewAll}
                className="w-full py-2 text-sm text-center text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors"
              >
                View All Notifications →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        itemName={deleteModal.message ? `"${deleteModal.message.substring(0, 50)}${deleteModal.message.length > 50 ? '...' : ''}"` : ''}
        loading={isDeleting}
      />
    </>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkRead, onDelete, onClick, icon, colorClass }) => {
  const formattedDate = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer ${
        !notification.read ? 'bg-blue-50/30' : ''
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="mt-1 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">
            {formattedDate}
          </span>
          {!notification.read ? (
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          ) : (
            <span className="text-[10px] text-slate-400">✓ Read</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!notification.read && (
          <button
            onClick={(e) => onMarkRead(notification._id, e)}
            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="Mark as read"
          >
            <FiCheck size={14} />
          </button>
        )}
        <button
          onClick={(e) => onDelete(notification._id, notification.message, e)}
          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          <FiX size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;