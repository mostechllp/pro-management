// src/components/notifications/Notifications.jsx
import React, { useState, useEffect } from 'react';
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
  FiArrowLeft,
  FiRefreshCw,
} from 'react-icons/fi';
import { MdDoneAll } from 'react-icons/md';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../store/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import DeleteConfirmationModal from './common/DeleteModal';

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    message: '',
  });

  const { notifications, unreadCount, loading, pagination } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    dispatch(fetchNotifications({ page, limit: 20 }));
  }, [dispatch, page]);

  const handleRefresh = () => {
    dispatch(fetchNotifications({ page, limit: 20 }));
  };

  const handleMarkRead = async (notificationId) => {
    await dispatch(markNotificationRead(notificationId)).unwrap();
  };

  const handleMarkAllRead = async () => {
    await dispatch(markAllNotificationsRead()).unwrap();
    toast.success('All notifications marked as read');
  };

  const handleDeleteClick = (notificationId, message) => {
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

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      dispatch(markNotificationRead(notification._id));
    }
    navigate('/documents');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'EXPIRING_1_DAY':
        return <FiAlertTriangle className="text-red-500" size={20} />;
      case 'EXPIRING_7_DAYS':
        return <FiClock className="text-amber-500" size={20} />;
      case 'EXPIRED':
        return <FiAlertTriangle className="text-red-500" size={20} />;
      default:
        return <FiFileText className="text-blue-500" size={20} />;
    }
  };

  const getUrgencyColor = (type) => {
    switch (type) {
      case 'EXPIRING_1_DAY':
        return 'bg-red-50 border-red-200';
      case 'EXPIRING_7_DAYS':
        return 'bg-amber-50 border-amber-200';
      case 'EXPIRED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getStatusBadge = (notification) => {
    if (notification.read) {
      return <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Read</span>;
    }
    return <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Unread</span>;
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 text-sm">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
            <p className="text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <MdDoneAll size={16} /> Mark all read
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-1 shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium text-slate-800">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(notification)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notification.read) {
                              handleMarkRead(notification._id);
                            }
                          }}
                          className={`p-1 rounded transition-colors ${
                            !notification.read
                              ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'
                              : 'text-slate-300 cursor-default'
                          }`}
                          title="Mark as read"
                          disabled={notification.read}
                        >
                          <FiCheck size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(notification._id, notification.message);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {notification.type && (
                        <span className="text-xs text-slate-400">
                          • {notification.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs text-slate-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} notifications
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg">
                    {pagination.page} of {pagination.pages}
                  </span>
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
              <FiCheckCircle className="text-green-500" size={40} />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">All caught up!</h3>
            <p className="text-sm text-slate-500">You have no notifications</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
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
        itemName={
          deleteModal.message
            ? `"${deleteModal.message.substring(0, 50)}${deleteModal.message.length > 50 ? '...' : ''}"`
            : ''
        }
        loading={isDeleting}
      />
    </div>
  );
};

export default Notifications;