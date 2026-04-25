import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaBolt,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import {
  FiHome,
  FiMessageSquare,
  FiLifeBuoy,
  FiZap,
  FiTrendingDown,
  FiBarChart2,
  FiBookOpen,
} from "react-icons/fi";

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FiHome className="w-4 h-4" /> },
    { name: "Household", path: "/households", icon: "🏠" },
    { name: "Rooms", path: "/rooms", icon: "🚪" },
    { name: "Appliances", path: "/appliances", icon: "📱" },
    { name: "Usage", path: "/usage", icon: <FaBolt className="w-4 h-4" /> },
    {
      name: "Billing & Cost",
      path: "/billing",
      icon: <FaFileInvoiceDollar className="w-4 h-4" />,
    },
    { name: "Feedback", path: "/feedback", icon: <FiMessageSquare className="w-4 h-4" /> },
    { name: "Support Tickets", path: "/tickets", icon: <FiLifeBuoy className="w-4 h-4" /> },
  ];

  const recommendationItems = [
    {
      name: "My Recommendations",
      path: "/recommendations",
      icon: <FiBookOpen className="w-4 h-4" />,
    },
    {
      name: "Energy Tips",
      path: "/energy-tips",
      icon: <FiZap className="w-4 h-4" />,
    },
    {
      name: "Cost Strategies",
      path: "/cost-strategies",
      icon: <FiTrendingDown className="w-4 h-4" />,
    },
    {
      name: "Predictions",
      path: "/predictions",
      icon: <FiBarChart2 className="w-4 h-4" />,
    },
  ];

  const isActive = (path) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  const linkStyle = (path) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    marginBottom: "4px",
    borderRadius: "12px",
    color: isActive(path) ? "#065f46" : "#64748b",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: isActive(path) ? "700" : "500",
    background: isActive(path) ? "#ecfdf5" : "transparent",
    transition: "all 0.2s ease",
    borderLeft: isActive(path) ? "3px solid #10b981" : "3px solid transparent",
  });

  return (
    <div
      style={{
        width: "260px",
        minHeight: "100vh",
        background: "white",
        borderRight: "1px solid #e2e8f0",
        color: "#0f172a",
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ textDecoration: "none" }}>
        <div style={{ marginBottom: "24px", paddingTop: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo.png" alt="EnergyMate" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }} />
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "900", margin: 0, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              <span style={{ color: "#0f172a" }}>ENERGY</span><span style={{ color: "#10b981" }}>MATE</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "10px", marginTop: "2px", letterSpacing: "1px", margin: 0 }}>
              ENERGY MANAGEMENT
            </p>
          </div>
        </div>
      </Link>

      {/* User Card */}
      <div
        style={{
          background: "#f8fafc",
          padding: "12px 14px",
          borderRadius: "14px",
          marginBottom: "20px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#ecfdf5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: "700",
                fontSize: "14px",
                color: "#1e293b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name || "Guest"}
            </div>
            <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "500" }}>
              Household Member
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, overflowY: "auto" }}>
        <p
          style={{
            color: "#64748b",
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1px",
            marginBottom: "8px",
            paddingLeft: "14px",
          }}
        >
          MAIN MENU
        </p>
        {menuItems.map((item) => (
          <Link key={item.path} to={item.path} style={linkStyle(item.path)}>
            <span style={{ opacity: 0.85 }}>{item.icon}</span>
            {item.name}
          </Link>
        ))}

        {/* AI / Recommendations Section */}
        <p
          style={{
            color: "#64748b",
            fontSize: "11px",
            fontWeight: "800",
            letterSpacing: "1px",
            margin: "24px 0 8px",
            paddingLeft: "14px",
          }}
        >
          AI RECOMMENDATIONS
        </p>
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

export default Sidebar;