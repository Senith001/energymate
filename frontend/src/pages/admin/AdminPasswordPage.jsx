import React, { useState } from "react";
import api from "../../services/api";

const AdminPasswordPage = () => {
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [errors, setErrors] = useState({});

  const validateField = (name, value, allData = {}) => {
    let err = null;
    switch (name) {
      case "newPassword":
        if (value) {
          if (value.length < 8) err = "Password must be at least 8 characters long";
          else if (!/[a-z]/.test(value)) err = "Password must contain at least one lowercase letter";
          else if (!/[A-Z]/.test(value)) err = "Password must contain at least one uppercase letter";
          else if (!/\d/.test(value)) err = "Password must contain at least one number";
          else if (!/[^A-Za-z0-9]/.test(value)) err = "Password must contain at least one special character";
        }
        break;
      case "confirmPassword":
        if (value && value !== allData.newPassword) err = "Passwords must match";
        break;
      default:
        break;
    }
    return err;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    const updatedPwdData = { ...passwordData, [name]: value };
    setPasswordData(updatedPwdData);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value, updatedPwdData) }));
    setError("");
    setSuccess("");
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsSaving(true);
    try {
      await api.put("/users/me/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess("Passkey updated successfully!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update passkey");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Security Settings</h1>
        <p style={styles.subtitle}>Update your administrative passkey</p>
      </div>

      <div style={styles.card}>
        {error && <div style={styles.alertError}>{error}</div>}
        {success && <div style={styles.alertSuccess}>{success}</div>}
        
        <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={styles.label}>Current Passkey</label>
            <input
              type="password"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label style={styles.label}>New Passkey</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              style={{ ...styles.input, borderColor: errors.newPassword ? "#fda4af" : "#e2e8f0" }}
              placeholder="••••••••"
            />
            {errors.newPassword && <p style={styles.fieldError}>{errors.newPassword}</p>}
          </div>
          <div>
            <label style={styles.label}>Confirm New Passkey</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              style={{ ...styles.input, borderColor: errors.confirmPassword ? "#fda4af" : "#e2e8f0" }}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p style={styles.fieldError}>{errors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={isSaving || Object.values(errors).some(e => e !== null)} style={{ ...styles.button, opacity: (isSaving || Object.values(errors).some(e => e !== null)) ? 0.5 : 1 }}>
            {isSaving ? "Applying..." : "Update Passkey"}
          </button>
        </form>
      </div>
    </div>
  );
};

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
  card: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
    maxWidth: "500px",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
    marginLeft: "4px"
  },
  fieldError: {
    margin: "6px 0 0 4px",
    fontSize: "9px",
    fontWeight: "900",
    color: "#f43f5e",
    textTransform: "uppercase"
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
    fontWeight: "600",
    boxSizing: "border-box"
  },
  button: {
    padding: "16px",
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "10px",
  },
  alertError: {
    padding: "14px",
    backgroundColor: "#fef2f2",
    color: "#ef4444",
    borderRadius: "12px",
    marginBottom: "20px",
    fontWeight: "bold",
    fontSize: "14px",
    border: "1px solid #fee2e2",
  },
  alertSuccess: {
    padding: "14px",
    backgroundColor: "#ecfdf5",
    color: "#10b981",
    borderRadius: "12px",
    marginBottom: "20px",
    fontWeight: "bold",
    fontSize: "14px",
    border: "1px solid #dcfce7",
  }
};

export default AdminPasswordPage;
