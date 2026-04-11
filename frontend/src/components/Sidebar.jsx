import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FaBolt, 
  FaFileInvoiceDollar, 
  FaThLarge, 
  FaHome, 
  FaCouch, 
  FaTv, 
  FaChartLine, 
  FaComments, 
  FaHeadset 
} from "react-icons/fa";

function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaThLarge /> },
    { name: "Household", path: "/households", icon: <FaHome /> },
    { name: "Rooms", path: "/rooms", icon: <FaCouch /> },
    { name: "Appliances", path: "/appliances", icon: <FaTv /> },
    { name: "Usage", path: "/usage", icon: <FaBolt /> },
    { name: "Billing", path: "/billing", icon: <FaFileInvoiceDollar /> },
    { name: "Feedback", path: "/feedback", icon: <FaComments /> },
    { name: "Support Tickets", path: "/tickets", icon: <FaHeadset /> },
  ];

  return (
    <div style={styles.sidebarContainer}>
      <div style={styles.brandContainer}>
        <div style={styles.logoCircle}>
          <FaBolt style={{ color: "white", fontSize: "20px" }} />
        </div>
        <h1 style={styles.logoText}>
          ENERGY<span style={{ color: "#10b981" }}>MATE</span>
        </h1>
      </div>

      <div style={styles.userSection}>
        <div style={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div style={styles.userInfo}>
          <p style={styles.welcomeText}>Welcome back,</p>
          <p style={styles.userName}>{user ? user.name : "Guest User"}</p>
        </div>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.link,
                background: isActive ? "rgba(16, 185, 129, 0.15)" : "transparent",
                color: isActive ? "#10b981" : "#94a3b8",
                borderRight: isActive ? "3px solid #10b981" : "3px solid transparent",
              }}
            >
              <span style={{ 
                ...styles.icon, 
                color: isActive ? "#10b981" : "#64748b" 
              }}>
                {item.icon}
              </span>
              <span style={styles.linkText}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <p style={styles.footerText}>v1.0.2 Stable</p>
      </div>
    </div>
  );
}

const styles = {
  sidebarContainer: {
    width: "280px",
    minHeight: "100vh",
    background: "#0f172a", // Deep slate
    display: "flex",
    flexDirection: "column",
    padding: "0",
    position: "relative",
    borderRight: "1px solid rgba(255,255,255,0.05)",
  },
  brandContainer: {
    padding: "32px 24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "800",
    color: "white",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  userSection: {
    margin: "0 20px 32px 20px",
    padding: "16px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "18px",
  },
  userInfo: {
    overflow: "hidden",
  },
  welcomeText: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0,
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#f1f5f9",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  nav: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "0 12px",
  },
  link: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    marginBottom: "4px",
    borderRadius: "12px",
    textDecoration: "none",
    transition: "all 0.2s ease",
    fontSize: "15px",
    fontWeight: "500",
  },
  icon: {
    fontSize: "18px",
    marginRight: "16px",
    display: "flex",
    alignItems: "center",
  },
  linkText: {
    whiteSpace: "nowrap",
  },
  footer: {
    padding: "24px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  footerText: {
    fontSize: "12px",
    color: "#475569",
    margin: 0,
    textAlign: "center",
  },
};

export default Sidebar;