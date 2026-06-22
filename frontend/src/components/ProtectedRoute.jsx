import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="container py-5 text-center">
        <div className="card card-premium p-5 my-5 max-w-lg mx-auto" style={{ maxWidth: '500px' }}>
          <i className="bi bi-exclamation-shield text-danger display-3 mb-3"></i>
          <h3 className="fw-bold text-dark">Access Denied</h3>
          <p className="text-secondary my-3">
            You do not have the required role credentials to access this dashboard.
          </p>
          <div className="mt-3">
            <Navigate to="/" replace />
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
