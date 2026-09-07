import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  loading: false,
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  sidebarOpen: true,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showNotification: (state, action) => {
      const { message, type = 'info', duration = 3000 } = action.payload;
      state.notifications.push({
        id: Date.now(),
        message,
        type,
        duration,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    openModal: (state, action) => {
      state.modal.isOpen = true;
      state.modal.type = action.payload.type;
      state.modal.data = action.payload.data || null;
    },
    closeModal: (state) => {
      state.modal.isOpen = false;
      state.modal.type = null;
      state.modal.data = null;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
  },
});

export const {
  showNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  openModal,
  closeModal,
  toggleSidebar,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;