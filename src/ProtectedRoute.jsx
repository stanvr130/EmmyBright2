import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, user, requiredRole }) {
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

  // 🛡️ Access Control Check — Step 1: must always have an active session
  if (!token || !userData) {
    alert('Access Denied: Please log in to continue.');
    return <Navigate to="/" replace />;
  }

  // 🔄 FIX: only enforce a specific role when one was actually requested.
  // Previously, omitting requiredRole silently defaulted to 'admin', which
  // would have blocked ordinary logged-in customers from any route that
  // didn't explicitly pass requiredRole (e.g. a plain account page).
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