import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ✅ 1. Import professional icons from the react-icons library
import { BsBellFill, BsPersonFill, BsChevronDown, BsChevronUp } from "react-icons/bs";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State to manage the dropdown visibility
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Safely extract the URL whether it's an object (from the DB) or a string (from immediate upload)
  const avatarSrc = user?.avatar?.url || (typeof user?.avatar === 'string' ? user.avatar : null);

  // Close dropdown if user clicks anywhere else on the screen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(isAdmin ? "/admin-portal" : "/login");
  };

  return (
    <div style={styles.navWrapper}>
      <div style={styles.rightSection}>
        {/* Notification Bell */}
        <div style={{ ...styles.iconCircle, background: isAdmin ? "rgba(255,255,255,0.05)" : "#f3f4f6" }}>
          
          {/* ✅ 2. Beautiful Bell Icon replacing the emoji */}
          <BsBellFill size={22} color={isAdmin ? "#fca5a5" : "#6b7280"} />
          
          <div style={styles.notifBadge}>1</div>
        </div>

        {/* User Profile Area with Dropdown */}
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              ...styles.profilePill,
              background: isAdmin ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
              border: isAdmin ? "1px solid #450a0a" : "none",
            }}
          >
            <div style={{ ...styles.avatar, background: isAdmin ? "#ef4444" : "#e5e7eb" }}>
              {/* ✅ 3. Profile Image OR Default Person Icon */}
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" style={styles.avatarImg} />
              ) : (
                <BsPersonFill size={26} color={isAdmin ? "white" : "#9ca3af"} />
              )}
            </div>

            <div style={{ ...styles.name, color: isAdmin ? "#f9fafb" : "#111827" }}>
              {user ? user.name : "Guest"}
            </div>

            <div style={{ ...styles.arrow, color: isAdmin ? "#fca5a5" : "#6b7280" }}>
              {/* ✅ 4. Sleek Chevron Arrows replacing text arrows */}
              {isDropdownOpen ? <BsChevronUp size={12} strokeWidth={1} /> : <BsChevronDown size={12} strokeWidth={1} />}
            </div>
          </div>

          {/* The Dropdown Menu */}
          {isDropdownOpen && (
            <div style={styles.dropdown}>
              <div 
                style={styles.dropdownItem} 
                onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }}
                onMouseEnter={(e) => e.target.style.background = "#f9fafb"}
                onMouseLeave={(e) => e.target.style.background = "white"}
              >
                Profile
              </div>
              <div 
                style={{ ...styles.dropdownItem, color: "#ef4444" }} 
                onClick={handleLogout}
                onMouseEnter={(e) => e.target.style.background = "#f9fafb"}
                onMouseLeave={(e) => e.target.style.background = "white"}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  navWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: "18px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },
  iconCircle: {
    width: "62px",
    height: "62px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  notifBadge: {
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
  },
  profilePill: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "10px 18px",
    borderRadius: "999px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },
  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  name: {
    fontSize: "16px",
    fontWeight: "700",
  },
  arrow: {
    display: "flex",
    alignItems: "center",
    marginLeft: "4px",
  },
  dropdown: {
    position: "absolute",
    top: "70px",
    right: "0",
    width: "180px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    padding: "8px 0",
    zIndex: 1000,
    border: "1px solid #f3f4f6",
  },
  dropdownItem: {
    padding: "12px 20px",
    fontSize: "15px",
    color: "#4b5563",
    cursor: "pointer",
    transition: "0.2s",
  },
};

export default Navbar;