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
    { name: "Dashboard", path: "/", icon: <FiHome className="w-4 h-4" /> },
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
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

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
    backdropFilter: isActive(path) ? "blur(4px)" : "none",
    borderLeft: isActive(path) ? "3px solid #4ade80" : "3px solid transparent",
  });

  return (
    <div
      style={{
        width: "260px",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #033b4a 0%, #022c3a 60%, #011e28 100%)",
        color: "white",
        padding: "20px 16px",
        borderRadius: "0 24px 24px 0",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "24px", paddingTop: "4px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
          <span style={{ color: "white" }}>ENERGY</span>
          <span style={{ color: "#4ade80" }}>MATE</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", marginTop: "2px", letterSpacing: "1px" }}>
          ENERGY MANAGEMENT
        </p>
      </div>

      {/* User Card */}
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          padding: "12px 14px",
          borderRadius: "14px",
          marginBottom: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: "600",
                fontSize: "14px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name || "Guest"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
              Household Member
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav style={{ flex: 1, overflowY: "auto" }}>
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "1.2px",
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
            color: "rgba(255,255,255,0.35)",
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "1.2px",
            margin: "16px 0 8px",
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