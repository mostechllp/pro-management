// src/store/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { showNotification } from './uiSlice';

const initialState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

// Fetch all notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get('/notifications', {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to fetch notifications',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

// Mark a single notification as read
export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (notificationId, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      dispatch(
        showNotification({
          message: 'Notification marked as read',
          type: 'success',
        })
      );
      return response.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to mark notification as read',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.put('/notifications/read-all');
      dispatch(
        showNotification({
          message: 'All notifications marked as read',
          type: 'success',
        })
      );
      return response.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to mark all as read',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

// Delete a notification
export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      dispatch(
        showNotification({
          message: 'Notification deleted',
          type: 'success',
        })
      );
      return notificationId;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to delete notification',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      };
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark one as read
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload._id);
        if (index !== -1) {
          state.notifications[index].read = true;
          state.notifications[index].readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.read = true;
          n.readAt = new Date().toISOString();
        });
        state.unreadCount = 0;
      })
      // Delete one
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload);
        if (index !== -1) {
          const wasUnread = !state.notifications[index].read;
          state.notifications.splice(index, 1);
          if (wasUnread) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.pagination.total = Math.max(0, state.pagination.total - 1);
        }
      });
  }
});

export const { clearNotifications, updateUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;