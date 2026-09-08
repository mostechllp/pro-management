import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { showNotification } from './uiSlice';

const initialState = {
  profile: null,
  preferences: null,
  loading: false,
  savingProfile: false,
  savingPassword: false,
  savingPreferences: false,
  error: null,
};

export const getSettings = createAsyncThunk(
  'settings/get',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/settings');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load settings');
    }
  },
);

export const updateProfile = createAsyncThunk(
  'settings/updateProfile',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.put('/settings/profile', payload);
      dispatch(showNotification({ message: 'Profile updated successfully', type: 'success' }));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      dispatch(showNotification({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  },
);

export const updatePassword = createAsyncThunk(
  'settings/updatePassword',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.put('/settings/password', payload);
      dispatch(showNotification({ message: 'Password changed successfully', type: 'success' }));
      return response.data.message;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      dispatch(showNotification({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  },
);

export const updatePreferences = createAsyncThunk(
  'settings/updatePreferences',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.put('/settings/preferences', payload);
      dispatch(showNotification({ message: 'Preferences saved', type: 'success' }));
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save preferences';
      dispatch(showNotification({ message, type: 'error' }));
      return rejectWithValue(message);
    }
  },
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettingsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get settings
      .addCase(getSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.preferences = action.payload.preferences;
      })
      .addCase(getSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.savingProfile = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.savingProfile = false;
        state.profile = { ...state.profile, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state) => {
        state.savingProfile = false;
      })
      // Update password
      .addCase(updatePassword.pending, (state) => {
        state.savingPassword = true;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.savingPassword = false;
      })
      .addCase(updatePassword.rejected, (state) => {
        state.savingPassword = false;
      })
      // Update preferences
      .addCase(updatePreferences.pending, (state) => {
        state.savingPreferences = true;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.savingPreferences = false;
        state.preferences = action.payload;
        if (state.profile) state.profile.preferences = action.payload;
      })
      .addCase(updatePreferences.rejected, (state) => {
        state.savingPreferences = false;
      });
  },
});

export const { clearSettingsError } = settingsSlice.actions;
export default settingsSlice.reducer;