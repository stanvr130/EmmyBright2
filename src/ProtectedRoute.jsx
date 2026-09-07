import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, user, requiredRole }) {
  const location = useLocation();

  // Retrieve token and user data saved during login
  const token = localStorage.getItem('authToken');
  const storedUser = localStorage.getItem('userData');

  let userData = user || null;
  if (!userData && storedUser) {
    try {
      userData = JSON.parse(storedUser);
    } catch (error) {
      console.error('Failed to parse userData from localStorage:', error);
    }
  }

  // 🛡️ Access Control Check — Step 1: must always have an active session.
  // Redirect to /login (not /) and remember where they were headed so
  // they can be sent back there after signing in.
  if (!token || !userData) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Only enforce a specific role when one was actually requested.
  if (requiredRole) {
    const normalizedRequiredRole = String(requiredRole).toLowerCase();
    const normalizedUserRole = userData?.role ? String(userData.role).toLowerCase() : null;

    if (normalizedUserRole !== normalizedRequiredRole) {
      alert(`Access Denied: ${requiredRole} privileges required.`);
      return <Navigate to="/" replace />;
    }
  }

  // Render the protected component if checks pass
  return children;
}

export default ProtectedRoute;