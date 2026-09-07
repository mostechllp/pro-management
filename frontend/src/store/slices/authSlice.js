import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { showNotification } from './uiSlice';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  loading: false,
  error: null,
  passwordResetSent: false,
};

// Async thunks

// Login user
// Make sure your login thunk is properly setting the token
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // The token should be in the response
      console.log('Login successful, token saved');
      
      dispatch(
        showNotification({
          message: 'Login successful!',
          type: 'success',
        })
      );
      
      return { token, user };
    } catch (error) {
      console.error('Login error:', error);
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Login failed',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Register user (admin)
export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      dispatch(
        showNotification({
          message: 'Registration successful!',
          type: 'success',
        })
      );
      
      return { token, user };
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Registration failed',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

// Get current user
export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.user;
    } catch (error) {
      // If token is invalid, clear it
      localStorage.removeItem('token');
      dispatch(showNotification({
        message: 'Session expired. Please login again.',
        type: 'error',
      }));
      return rejectWithValue(error.response?.data?.message || 'Failed to load user');
    }
  }
);

// Forgot password
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      dispatch(
        showNotification({
          message: 'Password reset email sent!',
          type: 'success',
        })
      );
      return response.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to send reset email',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to send reset email');
    }
  }
);

// Reset password
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.put(`/auth/reset-password/${token}`, { password });
      dispatch(
        showNotification({
          message: 'Password reset successful!',
          type: 'success',
        })
      );
      return response.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to reset password',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    clearPasswordReset: (state) => {
      state.passwordResetSent = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Load user
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload;
      })
      // Forgot password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.passwordResetSent = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.passwordResetSent = false;
        state.error = action.payload;
      })
      // Reset password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, clearPasswordReset } = authSlice.actions;
export default authSlice.reducer;