import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { showNotification } from './uiSlice';

const initialState = {
  stats: null,
  loading: false,
  error: null,
};

// Get dashboard stats
export const getDashboardStats = createAsyncThunk(
  'dashboard/getStats',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return response.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to fetch dashboard stats',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.stats = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(getDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;