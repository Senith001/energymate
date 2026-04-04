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
    background: "rgba(255, 255, 255, 0.05)",
    padding: "10px 18px",
    borderRadius: "999px",
    border: "1px solid #450a0a"
  },
  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#ef4444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    color: "white"
  },
  name: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f9fafb",
  },
  logoutBtn: {
    fontSize: "14px",
    color: "#ef4444",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold"
  }
};

export default AdminNavbar;