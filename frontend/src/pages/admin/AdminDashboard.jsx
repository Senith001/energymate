import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { FiBarChart2 } from "react-icons/fi";

const AdminDashboard = () => {
  const { user } = useAuth();

  const menuItems = [
    { name: "User Management", path: "/admin/users", icon: "👥" },
    ...(user?.role === "superadmin" ? [{ name: "Admin Management", path: "/admin/management", icon: "🛡️" }] : []),
    { name: "Household Management", path: "/admin/households", icon: "🏠" },
    { name: "Public Posts", path: "/admin/posts", icon: "📰" },
    { name: "Feedback", path: "/admin/feedback", icon: "💬" },
    { name: "Support Tickets", path: "/admin/support", icon: "🎫" },
    { name: "Usage & Billing", path: "/admin/usage-billing", icon: <FiBarChart2 style={{ width: '32px', height: '32px' }} /> },
    { name: "Security Settings", path: "/admin/password", icon: "🔐" },
  ];

  return (
    <>
      <style>
        {`
          .admin-tile {
            background-color: white;
            padding: 40px 24px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
            text-decoration: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            text-align: center;
            cursor: pointer;
            aspect-ratio: 1; /* Makes them square */
          }
          .admin-tile:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 30px rgba(16, 185, 129, 0.12);
            border-color: #10b981;
          }
        `}
      </style>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>System Control Center</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name} (Privilege Level: {user?.role})</p>
        </div>

        <div style={styles.grid}>
          {menuItems.map((item) => (
            <Link to={item.path} key={item.path} className="admin-tile">
              <div style={styles.iconWrapper}>
                {typeof item.icon === "string" ? <span style={{ fontSize: "32px", lineHeight: 1 }}>{item.icon}</span> : item.icon}
              </div>
              <h3 style={styles.tileTitle}>{item.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

// Clean Crisp Emerald Air styling to match the primary application
const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f8fafc", 
    minHeight: "100vh",
    color: "#0f172a",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    marginBottom: "40px",
    borderBottom: "1px solid #e2e8f0", 
    paddingBottom: "20px",
  },
  title: {
    margin: "0 0 10px 0",
    color: "#0f172a", 
    fontWeight: "900",
    letterSpacing: "-0.5px",
    fontSize: "32px",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontWeight: "500",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
  iconWrapper: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#ecfdf5",
    color: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.1)",
  },
  tileTitle: {
    margin: 0,
    color: "#0f172a", 
    fontWeight: "800",
    fontSize: "18px",
  },
};

export default AdminDashboard;