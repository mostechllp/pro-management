import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { showNotification } from './uiSlice';

const initialState = {
  documents: [],
  selectedDocument: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

// Get all documents
export const getDocuments = createAsyncThunk(
  'documents/getAll',
  async ({ customer = '', status = '', search = '', page = 1, limit = 10 } = {}, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get('/documents', {
        params: { customer, status, search, page, limit },
      });
      return response.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to fetch documents',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

// Upload document
export const uploadDocument = createAsyncThunk(
  'documents/upload',
  async (formData, { rejectWithValue, dispatch }) => {
    try {
      // apiClient will automatically add the token via interceptor
      const response = await apiClient.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      dispatch(
        showNotification({
          message: 'Document uploaded successfully!',
          type: 'success',
        })
      );
      return response.data.data;
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.response?.status === 401) {
        dispatch(
          showNotification({
            message: 'Authentication failed. Please login again.',
            type: 'error',
          })
        );
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        dispatch(
          showNotification({
            message: error.response?.data?.message || 'Failed to upload document',
            type: 'error',
          })
        );
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to upload document');
    }
  }
);

// Update document
export const updateDocument = createAsyncThunk(
  'documents/update',
  async ({ id, data }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.put(`/documents/${id}`, data);
      dispatch(
        showNotification({
          message: 'Document updated successfully!',
          type: 'success',
        })
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating document:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update document');
    }
  }
);

// Delete document
export const deleteDocument = createAsyncThunk(
  'documents/delete',
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
      console.error('Error deleting document:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete document');
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    clearSelectedDocument: (state) => {
      state.selectedDocument = null;
    },
    clearDocuments: (state) => {
      state.documents = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all documents
      .addCase(getDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.data || [];
        state.pagination = action.payload.pagination || { page: 1, limit: 10, total: 0, pages: 0 };
        state.error = null;
      })
      .addCase(getDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload document
      .addCase(uploadDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.documents.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update document
      .addCase(updateDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex(d => d._id === action.payload._id);
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
      })
      // Delete document
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(d => d._id !== action.payload);
      });
  },
});

export const { clearSelectedDocument, clearDocuments } = documentSlice.actions;
export default documentSlice.reducer;