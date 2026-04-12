import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin-portal"); // Admins go back to their specific portal
  };

  return (
    <div style={styles.navContainer}>
      <div style={styles.profileArea}>
        <div style={styles.avatar}>👤</div>
        <div style={styles.name}>{user?.name}</div>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  navContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "18px",
  },
  profileArea: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    background: "white",
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)"
  },
  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#ecfdf5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },
  name: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  logoutBtn: {
    fontSize: "14px",
    color: "#ef4444",
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    borderRadius: "8px",
    padding: "6px 14px",
    cursor: "pointer",
    fontWeight: "bold",
    marginLeft: "8px"
  }
};

export default AdminNavbar;