import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // 1. Wait for the auth state to finish initializing
  if (loading) {
    return <div style={{ padding: "50px", textAlign: "center" }}>Authenticating...</div>;
  }

  // 2. If there is no user, kick them to the login page immediately
  if (!user) {
    // The "replace" attribute ensures they can't click the browser's "Back" button to bypass this!
    return <Navigate to="/login" replace />;
  }

  // 3. If they are logged in, allow them to pass through to the requested route
  return <Outlet />;
};

export default ProtectedRoute;