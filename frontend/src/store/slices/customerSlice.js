import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';
import { showNotification } from './uiSlice';

const initialState = {
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

// Get all customers
export const getCustomers = createAsyncThunk(
  'customers/getAll',
  async ({ search = '', page = 1, limit = 10 } = {}, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get('/customers', {
        params: { search, page, limit },
      });
      return response.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to fetch customers',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
    }
  }
);

// Get single customer
export const getCustomer = createAsyncThunk(
  'customers/getOne',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get(`/customers/${id}`);
      return response.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to fetch customer',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch customer');
    }
  }
);

// Create customer
export const createCustomer = createAsyncThunk(
  'customers/create',
  async (customerData, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post('/customers', customerData);
      dispatch(
        showNotification({
          message: 'Customer created successfully!',
          type: 'success',
        })
      );
      return response.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to create customer',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to create customer');
    }
  }
);

// Update customer
export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, data }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.put(`/customers/${id}`, data);
      dispatch(
        showNotification({
          message: 'Customer updated successfully!',
          type: 'success',
        })
      );
      return response.data.data;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to update customer',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
    }
  }
);

// Delete customer
export const deleteCustomer = createAsyncThunk(
  'customers/delete',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.delete(`/customers/${id}`);
      dispatch(
        showNotification({
          message: 'Customer deleted successfully!',
          type: 'success',
        })
      );
      return id;
    } catch (error) {
      dispatch(
        showNotification({
          message: error.response?.data?.message || 'Failed to delete customer',
          type: 'error',
        })
      );
      return rejectWithValue(error.response?.data?.message || 'Failed to delete customer');
    }
  }
);

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all customers
      .addCase(getCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get single customer
      .addCase(getCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
        state.error = null;
      })
      .addCase(getCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create customer
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.unshift(action.payload);
      })
      // Update customer
      .addCase(updateCustomer.fulfilled, (state, action) => {
        const index = state.customers.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
        if (state.selectedCustomer?._id === action.payload._id) {
          state.selectedCustomer = action.payload;
        }
      })
      // Delete customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c._id !== action.payload);
        if (state.selectedCustomer?._id === action.payload) {
          state.selectedCustomer = null;
        }
      });
  },
});

export const { clearSelectedCustomer, setPagination } = customerSlice.actions;
export default customerSlice.reducer;