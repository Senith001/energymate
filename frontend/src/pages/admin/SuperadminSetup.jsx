import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const SuperadminSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    adminSecret: "" // Required for the x-admin-secret header
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const validateField = (name, value, allData) => {
    let error = null;
    const nameRegex = /^[A-Za-z\s]+$/;

    switch (name) {
      case "name":
        if (!value.trim()) error = "Name is required";
        else if (!nameRegex.test(value.trim())) error = "English letters only";
        else if (value.trim().length > 20) error = "Name must be max 20 characters";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email address";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 8) error = "Password must be at least 8 characters long";
        else if (!/[a-z]/.test(value)) error = "Password must contain at least one lowercase letter";
        else if (!/[A-Z]/.test(value)) error = "Password must contain at least one uppercase letter";
        else if (!/\d/.test(value)) error = "Password must contain at least one number";
        else if (!/[^A-Za-z0-9]/.test(value)) error = "Password must contain at least one special character";
        break;
      case "confirmPassword":
        if (!value) error = "Confirm your password";
        else if (value !== allData.password) error = "Passwords do not match";
        break;
      case "adminSecret":
        if (!value) error = "Admin secret is required";
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    const fieldError = validateField(name, value, updatedData);
    setErrors((prevErrors) => ({ ...prevErrors, [name]: fieldError }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    let formIsValid = true;
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key], formData);
      if (err) {
        newErrors[key] = err;
        formIsValid = false;
      }
    });

    if (!formIsValid) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Pass the admin secret in the headers as expected by your backend
      const res = await api.post(
        "/users/admin/register", 
        {
          name: formData.name,
          email: formData.email,
          password: formData.password
        },
        {
          headers: {
            "x-admin-secret": formData.adminSecret
          }
        }
      );

      setMessage({ type: "success", text: "Superadmin created successfully! Redirecting to login..." });
      setTimeout(() => navigate("/admin-portal"), 2000);
    } catch (err) {
      setMessage({ 
        type: "error", 
        text: err.response?.data?.message || "Registration failed. Check your secret key." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>System Initialization</h1>
          <p style={styles.subtitle}>Register the master Superadmin account.</p>
        </div>

        {message.text && (
          <div style={{ ...styles.alert, backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2", color: message.type === "success" ? "#166534" : "#991b1b" }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Master Secret Key</label>
            <input 
              type="password" 
              name="adminSecret" 
              value={formData.adminSecret} 
              onChange={handleChange} 
              placeholder="Enter ADMIN_SECRET from .env"
              style={{...styles.input, borderColor: errors.adminSecret ? "#ef4444" : "#fbbf24", backgroundColor: errors.adminSecret ? "#fef2f2" : "#fffbeb"}} 
            />
            {errors.adminSecret && <span style={styles.errorText}>{errors.adminSecret}</span>}
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              style={{...styles.input, borderColor: errors.name ? "#ef4444" : "#d1d5db", backgroundColor: errors.name ? "#fef2f2" : "white"}} 
            />
            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Work Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              style={{...styles.input, borderColor: errors.email ? "#ef4444" : "#d1d5db", backgroundColor: errors.email ? "#fef2f2" : "white"}} 
            />
            {errors.email && <span style={styles.errorText}>{errors.email}</span>}
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              style={{...styles.input, borderColor: errors.password ? "#ef4444" : "#d1d5db", backgroundColor: errors.password ? "#fef2f2" : "white"}} 
            />
            {errors.password && <span style={styles.errorText}>{errors.password}</span>}
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input 
              type="password" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              style={{...styles.input, borderColor: errors.confirmPassword ? "#ef4444" : "#d1d5db", backgroundColor: errors.confirmPassword ? "#fef2f2" : "white"}} 
            />
            {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
          </div>
          
          <button type="submit" disabled={loading || Object.values(errors).some(e => e !== null)} style={{...styles.submitBtn, opacity: (loading || Object.values(errors).some(e => e !== null)) ? 0.7 : 1}}>
            {loading ? "Initializing..." : "Create Superadmin"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6", fontFamily: "'Inter', sans-serif" },
  card: { backgroundColor: "white", padding: "40px", borderRadius: "12px", width: "100%", maxWidth: "450px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
  header: { textAlign: "center", marginBottom: "30px" },
  title: { margin: "0 0 10px 0", fontSize: "24px", color: "#111827" },
  subtitle: { margin: 0, fontSize: "14px", color: "#6b7280" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", transition: "all 0.2s" },
  errorText: { fontSize: "12px", color: "#dc2626", fontWeight: "500", marginTop: "2px" },
  submitBtn: { width: "100%", padding: "12px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", marginTop: "10px", transition: "0.2s" },
  alert: { padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: "500", textAlign: "center" }
};

export default SuperadminSetup;