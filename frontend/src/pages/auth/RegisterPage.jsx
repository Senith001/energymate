import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- STATES ---
  // If the user clicks "Back" from the Summary page, repopulate the form!
  const [formData, setFormData] = useState({
    firstName: location.state?.formData?.firstName || "",
    lastName: location.state?.formData?.lastName || "",
    email: location.state?.formData?.email || "",
    phone: location.state?.formData?.phone || "",
    password: location.state?.formData?.password || "",
    confirmPassword: location.state?.formData?.confirmPassword || "",
  });

  const [errors, setErrors] = useState({});

  // --- REAL-TIME VALIDATION ENGINE ---
  const validateField = (name, value, allData) => {
    let error = null;
    const nameRegex = /^[A-Za-z]+$/; 

    switch (name) {
      case "firstName":
        if (!value.trim()) error = "First name is required";
        else if (!nameRegex.test(value.trim())) error = "English letters only";
        else if (`${value.trim()} ${allData.lastName.trim()}`.length > 20) error = "Combined name must be max 20 chars";
        break;
      case "lastName":
        if (!value.trim()) error = "Last name is required";
        else if (!nameRegex.test(value.trim())) error = "English letters only";
        else if (`${allData.firstName.trim()} ${value.trim()}`.length > 20) error = "Combined name must be max 20 chars";
        break;
      case "email":
        if (!value.trim()) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email address";
        break;
      case "phone":
        if (!value.trim()) error = "Phone number is required";
        else if (!/^(0[0-9]{9}|(77|76|74|78|75|71|70|72)[0-9]{7})$/.test(value.replace(/[\s-]/g, ''))) error = "Enter a valid phone number";
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
      default:
        break;
    }
    return error;
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);

    const fieldError = validateField(name, value, updatedData);
    setErrors((prevErrors) => ({ ...prevErrors, [name]: fieldError }));
  };

  const handleNext = (e) => {
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

    // Pass the validated data to the Summary Page
    navigate("/summary", { state: { formData } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.splitCard}>
        
        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <h1 style={styles.brandTitle}>⚡ ENERGYMATE</h1>
          <h2 style={styles.welcomeTitle}>Welcome to EnergyMate</h2>
          <p style={styles.welcomeText}>
            Join us to track your electricity usage, manage your household appliances, and reduce your energy bills efficiently.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          
          {/* Progress Indicator - Step 1 */}
          <div style={styles.progressRow}>
            <div style={{...styles.progressLine, background: "#1d4ed8"}}></div>
            <div style={styles.progressLine}></div>
            <div style={styles.progressLine}></div>
          </div>

          <h3 style={styles.formTitle}>Personal Information</h3>
          <p style={styles.formSubtitle}>Please fill the below form fields</p>

          <form onSubmit={handleNext} style={styles.form}>
            <div style={styles.grid}>
              
              <div style={styles.inputWrapper}>
                <label style={styles.label}>First name <span style={styles.asterisk}>*</span></label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} style={{...styles.input, borderColor: errors.firstName ? "#ef4444" : "#d1d5db", backgroundColor: errors.firstName ? "#fef2f2" : "white"}} placeholder="e.g. John" />
                {errors.firstName && <span style={styles.errorText}>{errors.firstName}</span>}
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Last name <span style={styles.asterisk}>*</span></label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} style={{...styles.input, borderColor: errors.lastName ? "#ef4444" : "#d1d5db", backgroundColor: errors.lastName ? "#fef2f2" : "white"}} placeholder="e.g. Doe" />
                {errors.lastName && <span style={styles.errorText}>{errors.lastName}</span>}
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Email <span style={styles.asterisk}>*</span></label>
                <input type="text" name="email" value={formData.email} onChange={handleChange} style={{...styles.input, borderColor: errors.email ? "#ef4444" : "#d1d5db", backgroundColor: errors.email ? "#fef2f2" : "white"}} placeholder="Enter your email" />
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Number <span style={styles.asterisk}>*</span></label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input type="text" value="+94" readOnly style={{...styles.input, width: "60px", backgroundColor: "#f3f4f6", textAlign: "center"}} />
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{...styles.input, flex: 1, borderColor: errors.phone ? "#ef4444" : "#d1d5db", backgroundColor: errors.phone ? "#fef2f2" : "white"}} placeholder="771234567" />
                </div>
                {errors.phone && <span style={styles.errorText}>{errors.phone}</span>}
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Password <span style={styles.asterisk}>*</span></label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} style={{...styles.input, borderColor: errors.password ? "#ef4444" : "#d1d5db", backgroundColor: errors.password ? "#fef2f2" : "white"}} placeholder="Enter your password" />
                {errors.password && <span style={styles.errorText}>{errors.password}</span>}
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Confirm Password <span style={styles.asterisk}>*</span></label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={{...styles.input, borderColor: errors.confirmPassword ? "#ef4444" : "#d1d5db", backgroundColor: errors.confirmPassword ? "#fef2f2" : "white"}} placeholder="Enter your password" />
                {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
              </div>
            </div>

            <div style={styles.actionRow}>
              <button type="button" onClick={() => navigate("/login")} style={styles.backBtn}>Back</button>
              <button type="submit" disabled={Object.values(errors).some(e => e !== null)} style={{...styles.nextBtn, opacity: Object.values(errors).some(e => e !== null) ? 0.7 : 1}}>
                Next
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#ffffff", padding: "20px", fontFamily: "'Inter', Arial, sans-serif" }, // White background
  splitCard: { display: "flex", width: "100%", maxWidth: "1000px", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", minHeight: "550px" },
  leftPanel: { flex: 1, padding: "50px", color: "white", display: "flex", flexDirection: "column", justifyContent: "center" },
  brandTitle: { fontSize: "24px", fontWeight: "800", letterSpacing: "1px", marginBottom: "40px" },
  welcomeTitle: { fontSize: "32px", fontWeight: "700", marginBottom: "15px", lineHeight: "1.2" },
  welcomeText: { fontSize: "16px", lineHeight: "1.6", color: "#e0f2fe" },
  rightPanel: { flex: 1.3, padding: "40px 50px", display: "flex", flexDirection: "column", backgroundColor: "white", borderRadius: "12px", margin: "10px" }, // Inner white card
  progressRow: { display: "flex", gap: "8px", marginBottom: "30px" },
  progressLine: { height: "5px", flex: 1, backgroundColor: "#e2e8f0", borderRadius: "4px" },
  formTitle: { margin: "0 0 5px 0", fontSize: "20px", color: "#1e3a8a", fontWeight: "700" },
  formSubtitle: { margin: "0 0 30px 0", fontSize: "14px", color: "#64748b" },
  form: { display: "flex", flexDirection: "column", flex: 1 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" },
  inputWrapper: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  asterisk: { color: "#ef4444" },
  input: { padding: "12px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", transition: "all 0.2s" },
  errorText: { fontSize: "12px", color: "#dc2626", fontWeight: "500", marginTop: "2px" },
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "20px" },
  backBtn: { padding: "12px 30px", backgroundColor: "transparent", color: "#1e3a8a", border: "1px solid #1e3a8a", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  nextBtn: { padding: "12px 30px", backgroundColor: "#1d4ed8", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "0.2s" },
};

export default RegisterPage;