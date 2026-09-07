import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { showNotification } from './uiSlice';

const initialState = {
  documents: [],
  loading: false,
  error: null,
  total: 0,
  lastFetched: null,
};

// Get expiring documents
export const getExpiringDocuments = createAsyncThunk(
  'expiry/getExpiringDocuments',
  async ({ search = '', page = 1, limit = 20 } = {}, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get('/documents', {
        params: { 
          search,
          status: 'Expiring Soon,Critical',
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to fetch expiring documents',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expiring documents');
    }
  }
);

// Delete document
export const deleteExpiringDocument = createAsyncThunk(
  'expiry/deleteDocument',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.delete(`/documents/${id}`);
      dispatch(
        showNotification({
          message: 'Document deleted successfully!',
          type: 'success',
        })
      );
      return id;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to delete document',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
    }
  }
);

// View document
export const viewExpiringDocument = createAsyncThunk(
  'expiry/viewDocument',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get(`/documents/${id}/view`, {
        responseType: 'blob',
      });
      return { id, blob: response.data };
    } catch (error) {
      dispatch(
        showNotification({
          message: 'Failed to view document',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to view document');
    }
  }
);

// Get expiry statistics
export const getExpiryStats = createAsyncThunk(
  'expiry/getStats',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get('/dashboard/stats');
      return response.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to fetch expiry statistics',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expiry statistics');
    }
  }
);

const expirySlice = createSlice({
  name: 'expiry',
  initialState,
  reducers: {
    clearExpiryState: (state) => {
      state.documents = [];
      state.error = null;
      state.loading = false;
      state.total = 0;
      state.lastFetched = null;
    },
    resetExpiryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get expiring documents
      .addCase(getExpiringDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getExpiringDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.data || [];
        state.total = action.payload.pagination?.total || 0;
        state.error = null;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(getExpiringDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete document
      .addCase(deleteExpiringDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(doc => doc._id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      // Get expiry stats
      .addCase(getExpiryStats.fulfilled, (state, action) => {
        // We can store stats if needed
        state.lastFetched = new Date().toISOString();
      });
  },
});

export const { clearExpiryState, resetExpiryError } = expirySlice.actions;
export default expirySlice.reducer;