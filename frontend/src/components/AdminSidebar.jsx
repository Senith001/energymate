import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiBarChart2 } from "react-icons/fi";

function AdminSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: "Control Center", path: "/admin/dashboard", icon: "⚙" },
    { name: "User Management", path: "/admin/users", icon: "👥" },
    { name: "System Settings", path: "/admin/settings", icon: "🛠" },
    { name: "Usage & Billing", path: "/admin/usage-billing", icon: <FiBarChart2 /> },
  ];

  return (
    <div style={styles.sidebar}>
      <h1 style={{ marginBottom: "20px" }}>
        <span style={{ color: "white" }}>Power</span>
        <span style={{ color: "#22c55e" }}>Save</span>
        <span style={styles.adminBadge}>ADMIN</span>
      </h1>

      <div style={styles.welcomeBox}>
        <h3>Welcome,</h3>
        <h2>{user?.name || "Admin"}</h2>
      </div>

      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            ...styles.link,
            background: location.pathname === item.path ? "#b91c1c" : "transparent",
          }}
        >
          {item.icon} {item.name}
        </Link>
      ))}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "280px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #7f1d1d, #450a0a)",
    color: "white",
    padding: "20px",
    borderRadius: "0 30px 30px 0",
  },
  adminBadge: {
    fontSize: "12px",
    marginLeft: "10px",
    color: "#fca5a5",
    border: "1px solid #fca5a5",
    padding: "2px 5px",
    borderRadius: "4px"
  },
  welcomeBox: {
    background: "rgba(255,255,255,0.1)",
    padding: "15px",
    borderRadius: "20px",
    marginBottom: "20px",
  },
  link: {
    display: "block",
    padding: "15px",
    marginBottom: "10px",
    borderRadius: "15px",
    color: "white",
    textDecoration: "none",
    transition: "0.3s ease",
  }
};

export default AdminSidebar;