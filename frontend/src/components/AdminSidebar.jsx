import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiBarChart2 } from "react-icons/fi";

function AdminSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: "Control Center", path: "/admin/dashboard", icon: "⚙️" },
    { name: "User Management", path: "/admin/users", icon: "👥" },
    ...(user?.role === "superadmin" ? [{ name: "Admin Management", path: "/admin/management", icon: "🛡️" }] : []),
    { name: "Household Management", path: "/admin/households", icon: "🏠" },
    { name: "Public Posts", path: "/admin/posts", icon: "📰" },
    { name: "Feedback", path: "/admin/feedback", icon: "💬" },
    { name: "Support Tickets", path: "/admin/support", icon: "🎫" },
    { name: "Usage & Billing", path: "/admin/usage-billing", icon: <FiBarChart2 /> },
    { name: "System Settings", path: "/admin/settings", icon: "🛠️" },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={{ marginBottom: "24px", paddingTop: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
        <img src="/logo.png" alt="EnergyMate" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }} />
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "900", display: "flex", alignItems: "center" }}>
          <div>
            <span style={{ color: "#0f172a" }}>Energy</span><span style={{ color: "#10b981" }}>Mate</span>
          </div>
          <span style={styles.adminBadge}>{user?.role === "superadmin" ? "SUPER ADMIN" : "ADMIN"}</span>
        </h1>
      </div>

      <div style={styles.welcomeBox}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Welcome,</h3>
        <h2 style={{ margin: 0, fontSize: "16px", color: "#0f172a", fontWeight: "800" }}>{user?.name || "Admin"}</h2>
      </div>

      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              background: isActive ? "#ecfdf5" : "transparent",
              color: isActive ? "#065f46" : "#64748b",
              fontWeight: isActive ? "700" : "500",
              borderLeft: isActive ? "3px solid #10b981" : "3px solid transparent",
            }}
          >
            {item.icon} {item.name}
          </Link>
        );
      })}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "280px",
    minHeight: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    color: "#0f172a",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  adminBadge: {
    fontSize: "10px",
    marginLeft: "10px",
    color: "#059669",
    backgroundColor: "#dcfce7",
    padding: "3px 6px",
    borderRadius: "6px",
    fontWeight: "800",
  },
  welcomeBox: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 14px",
    marginBottom: "4px",
    borderRadius: "12px",
    textDecoration: "none",
    transition: "0.2s ease",
    fontSize: "14px",
  }
};

export default AdminSidebar;