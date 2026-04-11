import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

function MainLayout() {
  const { user, loading } = useAuth();

  // Show a blank screen or spinner while verifying the token
  if (loading) {
    return <div style={{ padding: "50px", textAlign: "center" }}>Loading application...</div>;
  }

  // SECURITY GUARD: If there is no user, kick them to the login page!
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "40px",
          boxSizing: "border-box",
          overflowY: "auto",
          background: "#f8fafc", // Softer slate-50 background
        }}
      >
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;