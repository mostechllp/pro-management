import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from '../../store/slices/authSlice';

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // If we have a token but user is not authenticated, load user data
    if (token && !isAuthenticated && !loading) {
      dispatch(loadUser());
    }
  }, [token, isAuthenticated, loading, dispatch]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render child routes
  return <Outlet />;
};

export default ProtectedRoute;