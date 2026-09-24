import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated, getDefaultRouteForRole } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="spinner-border text-blue-600 mb-6" style={{ width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
        <h5 className="text-gray-600 font-semibold">Authenticating Enterprise EMS Session...</h5>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
