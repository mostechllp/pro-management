import axios from 'axios';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { showNotification } from '../store/slices/uiSlice';

// Create axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add token to headers
apiClient.interceptors.request.use(
  (config) => {
    // Get token from Redux store
    const state = store.getState();
    let token = state.auth?.token;
    
    // If token not in Redux, try localStorage
    if (!token) {
      token = localStorage.getItem('token');
      if (token) {
        console.log('Token retrieved from localStorage');
      }
    }
    
    console.log('=== API Request ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Has Token:', !!token);
    console.log('Is FormData:', config.data instanceof FormData);
    
    // ALWAYS set the Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.warn('⚠️ No token found!');
    }
    
    // IMPORTANT: For FormData, we need to keep the Content-Type
    // but let the browser set it with the boundary
    if (config.data instanceof FormData) {
      // Don't delete Content-Type - let axios handle it
      // Just make sure we're not overriding it
      console.log('FormData detected');
    }
    
    console.log('Final headers:', {
      ...config.headers,
      Authorization: config.headers.Authorization ? 'Bearer [HIDDEN]' : undefined
    });
    console.log('====================');
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    console.log('=== API Response ===');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status);
    console.log('===================');
    return response;
  },
  (error) => {
    console.error('=== API Error ===');
    console.error('URL:', error.config?.url);
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('===================');
    
    const { response } = error;
    
    // Handle network errors
    if (!response) {
      store.dispatch(
        showNotification({
          message: 'Network error. Please check your connection.',
          type: 'error',
        })
      );
      return Promise.reject(error);
    }

    // Handle unauthorized errors
    if (response.status === 401) {
      console.error('🔒 Unauthorized! Token may be invalid or expired.');
      store.dispatch(logout());
      store.dispatch(
        showNotification({
          message: response.data?.message || 'Session expired. Please login again.',
          type: 'error',
        })
      );
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Handle forbidden errors
    if (response.status === 403) {
      store.dispatch(
        showNotification({
          message: response.data?.message || 'You do not have permission to perform this action.',
          type: 'error',
        })
      );
    }

    // Handle not found errors
    if (response.status === 404) {
      store.dispatch(
        showNotification({
          message: response.data?.message || 'Resource not found.',
          type: 'error',
        })
      );
    }

    // Handle validation errors
    if (response.status === 400 && response.data?.errors) {
      const errorMessages = response.data.errors.map(err => err.msg).join(', ');
      store.dispatch(
        showNotification({
          message: errorMessages || 'Validation error.',
          type: 'error',
        })
      );
    }

    // Handle server errors
    if (response.status >= 500) {
      store.dispatch(
        showNotification({
          message: response.data?.message || 'Server error. Please try again later.',
          type: 'error',
        })
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;