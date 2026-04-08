import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiBarChart2, FiSettings, FiUsers, FiLayout, FiBookOpen } from "react-icons/fi";

function AdminSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: "Control Center", path: "/admin/dashboard", icon: <FiLayout className="w-4 h-4" /> },
    { name: "User Management", path: "/admin/users", icon: <FiUsers className="w-4 h-4" /> },
    { name: "System Settings", path: "/admin/settings", icon: <FiSettings className="w-4 h-4" /> },
    { name: "Usage & Billing", path: "/admin/usage-billing", icon: <FiBarChart2 className="w-4 h-4" /> },
  ];

  const recommendationItems = [
    {
      name: "Templates",
      path: "/admin/recommendations/templates",
      icon: <FiBookOpen className="w-4 h-4" />,
    },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const linkStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    marginBottom: "4px",
    borderRadius: "12px",
    color: isActive(path) ? "white" : "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: isActive(path) ? "600" : "400",
    background: isActive(path) ? "rgba(255,255,255,0.15)" : "transparent",
    transition: "all 0.2s ease",
    borderLeft: isActive(path) ? "3px solid #fca5a5" : "3px solid transparent",
  });

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>
          <span style={{ color: "white" }}>ENERGY</span>
          <span style={{ color: "#4ade80" }}>MATE</span>
          <span style={styles.adminBadge}>ADMIN</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", marginTop: "2px", letterSpacing: "1px" }}>
          ADMIN CONSOLE
        </p>
      </div>

      {/* User Card */}
      <div style={styles.welcomeBox}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f87171, #fb923c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div>
            <div style={{ fontWeight: "600", fontSize: "14px" }}>{user?.name || "Admin"}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>Administrator</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        <p style={styles.sectionLabel}>MAIN</p>
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} style={linkStyle(item.path)}>
            <span style={{ opacity: 0.85 }}>{item.icon}</span>
            {item.name}
          </Link>
        ))}

        <p style={{ ...styles.sectionLabel, marginTop: "16px" }}>RECOMMENDATIONS</p>
        {recommendationItems.map((item) => (
          <Link key={item.path} to={item.path} style={linkStyle(item.path)}>
            <span style={{ opacity: 0.85 }}>{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    minHeight: "100vh",
    background: "linear-gradient(180deg, #7f1d1d 0%, #450a0a 60%, #2d0606 100%)",
    color: "white",
    padding: "20px 16px",
    borderRadius: "0 24px 24px 0",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  adminBadge: {
    fontSize: "10px",
    marginLeft: "8px",
    color: "#fca5a5",
    border: "1px solid rgba(252,165,165,0.5)",
    padding: "2px 6px",
    borderRadius: "6px",
    verticalAlign: "middle",
    letterSpacing: "0.5px",
  },
  welcomeBox: {
    background: "rgba(255,255,255,0.08)",
    padding: "12px 14px",
    borderRadius: "14px",
    marginBottom: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.2px",
    marginBottom: "8px",
    paddingLeft: "14px",
  },
};

export default AdminSidebar;