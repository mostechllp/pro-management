
import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';

import authReducer from './slices/authSlice';
import customerReducer from './slices/customerSlice';
import documentReducer from './slices/documentSlice';
import dashboardReducer from './slices/dashboardSlice';
import expiryReducer from './slices/expirySlice'; 
import settingsReducer from './slices/settingsSlice'; 
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';

// Explicit browser storage adapter
const storage = {
  getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),

  setItem: (key, value) => {
    window.localStorage.setItem(key, value);
    return Promise.resolve(value);
  },

  removeItem: (key) => {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  customers: customerReducer,
  documents: documentReducer,
  dashboard: dashboardReducer,
  expiry: expiryReducer,
  settings: settingsReducer,
  ui: uiReducer,
  notifications: notificationReducer,
});

const persistedReducer = persistReducer(
  persistConfig,
  rootReducer
);

export const store = configureStore({
  reducer: persistedReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/PAUSE',
          'persist/FLUSH',
          'persist/PURGE',
        ],
      },
    }),
});

export const persistor = persistStore(store);