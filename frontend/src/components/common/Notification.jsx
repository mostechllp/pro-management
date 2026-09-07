import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeNotification } from '../../store/slices/uiSlice';

const Notification = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.ui.notifications);

  useEffect(() => {
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, notification.duration || 3000);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg text-white ${
            notification.type === 'success'
              ? 'bg-green-500'
              : notification.type === 'error'
              ? 'bg-red-500'
              : notification.type === 'warning'
              ? 'bg-yellow-500'
              : 'bg-blue-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <p>{notification.message}</p>
            <button
              onClick={() => dispatch(removeNotification(notification.id))}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notification;