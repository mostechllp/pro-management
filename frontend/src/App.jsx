import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store/store';
import { Toaster } from 'react-hot-toast';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/Forgetpassword';
import ResetPassword from './components/auth/ResetPassword';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './layout/Layout';
import Dashboard from './components/Dashbaord';
import Customers from './components/customer/Customers';
import CustomerDetail from './components/customer/CustomerDetails';
import Documents from './components/documents/Documents';
import Expiry from './components/expiry/Expiry';

function App() {
  return (
     <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/expiry" element={<Expiry />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;