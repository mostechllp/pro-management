import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { showNotification } from './uiSlice';

const initialState = {
  types: [],
  loading: false,
  error: null,
  mutating: false, // for add/update/delete
};

// GET all
export const getDocumentTypes = createAsyncThunk(
  'documentTypes/getAll',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const res = await apiClient.get('/document-types');
      return res.data.data; // array of { _id, name, isDefault, ... }
    } catch (error) {
      dispatch(
        showNotification({
          message:
            error.response?.data?.message ||
            'Failed to fetch document types',
          type: 'error',
        })
      );
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch document types'
      );
    }
  }
);

// ADD
export const addDocumentType = createAsyncThunk(
  'documentTypes/add',
  async (name, { rejectWithValue, dispatch }) => {
    try {
      const res = await apiClient.post('/document-types', { name });
      dispatch(
        showNotification({
          message: `"${name}" added to document types`,
          type: 'success',
        })
      );
      return res.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message:
            error.response?.data?.message || 'Failed to add document type',
          type: 'error',
        })
      );
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add document type'
      );
    }
  }
);

// UPDATE
export const updateDocumentType = createAsyncThunk(
  'documentTypes/update',
  async ({ id, name }, { rejectWithValue, dispatch }) => {
    try {
      const res = await apiClient.put(`/document-types/${id}`, { name });
      dispatch(
        showNotification({
          message: 'Document type updated',
          type: 'success',
        })
      );
      return res.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message:
            error.response?.data?.message || 'Failed to update document type',
          type: 'error',
        })
      );
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update document type'
      );
    }
  }
);

// DELETE
export const deleteDocumentType = createAsyncThunk(
  'documentTypes/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.delete(`/document-types/${id}`);
      dispatch(
        showNotification({
          message: 'Document type deleted',
          type: 'success',
        })
      );
      return id;
    } catch (error) {
      dispatch(
        showNotification({
          message:
            error.response?.data?.message || 'Failed to delete document type',
          type: 'error',
        })
      );
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete document type'
      );
    }
  }
);

const documentTypeSlice = createSlice({
  name: 'documentTypes',
  initialState,
  reducers: {
    clearDocumentTypes: (state) => {
      state.types = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET
      .addCase(getDocumentTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDocumentTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.types = action.payload || [];
      })
      .addCase(getDocumentTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // ADD
      .addCase(addDocumentType.pending, (state) => {
        state.mutating = true;
      })
      .addCase(addDocumentType.fulfilled, (state, action) => {
        state.mutating = false;
        const exists = state.types.some((t) => t._id === action.payload._id);
        if (!exists) state.types.push(action.payload);
        state.types.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(addDocumentType.rejected, (state) => {
        state.mutating = false;
      })
      // UPDATE
      .addCase(updateDocumentType.pending, (state) => {
        state.mutating = true;
      })
      .addCase(updateDocumentType.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.types.findIndex((t) => t._id === action.payload._id);
        if (idx !== -1) state.types[idx] = action.payload;
        state.types.sort((a, b) => a.name.localeCompare(b.name));
      })
      .addCase(updateDocumentType.rejected, (state) => {
        state.mutating = false;
      })
      // DELETE
      .addCase(deleteDocumentType.pending, (state) => {
        state.mutating = true;
      })
      .addCase(deleteDocumentType.fulfilled, (state, action) => {
        state.mutating = false;
        state.types = state.types.filter((t) => t._id !== action.payload);
      })
      .addCase(deleteDocumentType.rejected, (state) => {
        state.mutating = false;
      });
  },
});

export const { clearDocumentTypes } = documentTypeSlice.actions;
export default documentTypeSlice.reducer;