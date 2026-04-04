import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaBolt, FaFileInvoiceDollar } from "react-icons/fa";

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth(); // Grab the logged-in user

  const menuItems = [
    { name: "Dashboard", path: "/", icon: "⌂" },
    { name: "Household", path: "/households", icon: "⌂" },
    { name: "Rooms", path: "/rooms", icon: "✉" },
    { name: "Appliances", path: "/appliances", icon: "◫" },
    { name: "Usage", path: "/usage", icon: <FaBolt /> },
    { name: "Billing and Cost Analysis", path: "/billing", icon: <FaFileInvoiceDollar /> },
    { name: "Feedback", path: "/feedback", icon: "💬" },
    { name: "Support Tickets", path: "/tickets", icon: "🧾" },
  ];

  return (
    <div
      style={{
        width: "280px",
        minHeight: "100vh",
        background: "linear-gradient(180deg,#033b4a,#022c3a)",
        color: "white",
        padding: "20px",
        borderRadius: "0 30px 30px 0",
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>
        <span style={{ color: "white" }}>Power</span>
        <span style={{ color: "#22c55e" }}>Save</span>
      </h1>

      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          padding: "15px",
          borderRadius: "20px",
          marginBottom: "20px",
        }}
      >
        <h3>Welcome,</h3>
        {/* Dynamically display the logged-in user's name */}
        <h2>{user ? user.name : "Guest"}</h2>
      </div>

      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            display: "block",
            padding: "15px",
            marginBottom: "10px",
            borderRadius: "15px",
            color: "white",
            textDecoration: "none",
            background:
              location.pathname === item.path
                ? "#0f766e"
                : "transparent",
            transition: "0.3s ease",
            boxShadow:
              location.pathname === item.path
                ? "0 4px 15px rgba(0,0,0,0.15)"
                : "none",
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== item.path) {
              e.target.style.background = "rgba(255,255,255,0.08)";
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== item.path) {
              e.target.style.background = "transparent";
            }
          }}
        >
          {item.icon} {item.name}
        </Link>
      ))}
    </div>
  );
}

export default Sidebar;