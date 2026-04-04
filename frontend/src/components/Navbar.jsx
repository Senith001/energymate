import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        {/* Notification Bell */}
        <div
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            position: "relative",
            boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
          }}
        >
          🔔
          <div
            style={{
              position: "absolute",
              top: "6px",
              right: "8px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#ef4444",
              color: "white",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
            }}
          >
            1
          </div>
        </div>

        {/* User Profile Area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "#f3f4f6",
            padding: "10px 18px",
            borderRadius: "999px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
            }}
          >
            👤
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            {/* Dynamically display the logged-in user's name */}
            {user ? user.name : "Guest"}
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            style={{ 
              fontSize: "14px", 
              color: "#ef4444", 
              background: "none", 
              border: "none", 
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Navbar;