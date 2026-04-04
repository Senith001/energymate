import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminNavbar from "../components/AdminNavbar";
import { useAuth } from "../context/AuthContext";

function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "50px", textAlign: "center", color: "white" }}>Verifying security clearance...</div>;
  }

  // STRICT SECURITY: Kick out anyone who isn't an admin
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return <Navigate to="/admin-portal" replace />;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f3f4f6", // Dark red/black background for admin theme
      }}
    >
      <AdminSidebar />

      <div
        style={{
          flex: 1,
          padding: "30px",
          boxSizing: "border-box",
          overflowX: "auto",
        }}
      >
        <AdminNavbar />
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;