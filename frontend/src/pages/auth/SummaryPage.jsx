import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { BsX, BsStarFill } from "react-icons/bs"; 

const SummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const formData = location.state?.formData;

  // Protect route: If someone navigates here directly without data, send them back
  useEffect(() => {
    if (!formData) {
      navigate("/register");
    }
  }, [formData, navigate]);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  const [errorModal, setErrorModal] = useState({ show: false, message: "" });

  const handleRegister = async () => {
    if (!termsAccepted) return;
    setIsLoading(true);
    setGlobalError(null);

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      await api.post("/users/register", {
        name: fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone 
      });

      // Navigate to OTP upon successful registration creation
      navigate("/verify-otp", { state: { email: formData.email } });
      
    } catch (err) {
      const responseData = err.response?.data;
      const serverMessage = responseData?.message || "";

      // Trigger the Modal if email exists
      if (serverMessage.toLowerCase().includes("already registered") || serverMessage.toLowerCase().includes("exists")) {
        setErrorModal({ show: true, message: serverMessage });
      } 
      // Generic fallback
      else {
        setGlobalError(serverMessage || "Cannot connect to the server. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to register and pass the form data so inputs remain filled
    navigate("/register", { state: { formData } });
  };

  if (!formData) return null; // Prevent rendering if redirecting

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
          {/* Progress Indicator - Step 2 */}
          <div style={styles.progressRow}>
            <div style={{...styles.progressLine, background: "#1d4ed8"}}></div>
            <div style={{...styles.progressLine, background: "#1d4ed8"}}></div>
            <div style={styles.progressLine}></div>
          </div>

        <h2 style={styles.title}>Summary</h2>
        <p style={styles.subtitle}>Please check the information is correct before continue</p>

        {/* Member Badge Area */}
        <div style={styles.badgeArea}>
          <div style={styles.badgeIcon}>
            <BsStarFill color="#60a5fa" size={20} />
          </div>
          <span style={styles.badgeText}>Standard Account</span>
        </div>

        {globalError && <div style={styles.globalErrorBox}>{globalError}</div>}

        {/* Data Grid */}
        <div style={styles.grid}>
          <div style={styles.dataBlock}>
            <span style={styles.dataLabel}>First name</span>
            <span style={styles.dataValue}>{formData.firstName.toUpperCase()}</span>
          </div>
          <div style={styles.dataBlock}>
            <span style={styles.dataLabel}>Last name</span>
            <span style={styles.dataValue}>{formData.lastName.toUpperCase()}</span>
          </div>
          <div style={styles.dataBlock}>
            <span style={styles.dataLabel}>Mobile number</span>
            <span style={styles.dataValue}>+94 {formData.phone}</span>
          </div>
          <div style={styles.dataBlock}>
            <span style={styles.dataLabel}>Email</span>
            <span style={styles.dataValue}>{formData.email}</span>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div style={styles.termsWrapper}>
          <input 
            type="checkbox" 
            id="terms" 
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={styles.checkbox}
          />
          <label htmlFor="terms" style={styles.termsLabel}>
            I agree to the <span style={styles.linkText}>terms and conditions</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionRow}>
          <button onClick={handleBack} disabled={isLoading} style={styles.backBtn}>Back</button>
          <button 
            onClick={handleRegister} 
            disabled={!termsAccepted || isLoading} 
            style={{...styles.registerBtn, opacity: (!termsAccepted || isLoading) ? 0.7 : 1}}
          >
            {isLoading ? "Processing..." : "Register"}
          </button>
        </div>
        </div>
      </div>

      {/* ✅ POPUP MODAL FOR 'ALREADY REGISTERED' ERRORS */}
      {errorModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <button onClick={() => setErrorModal({ show: false, message: "" })} style={styles.closeBtn}>
                <BsX size={28} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.errorCircle}>
                <BsX size={40} color="white" />
              </div>
              <h3 style={styles.modalMessage}>{errorModal.message}</h3>
            </div>
          </div>
        </div>
      )}

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
  title: { margin: "0 0 5px 0", fontSize: "22px", color: "#1e3a8a", fontWeight: "700" },
  subtitle: { margin: "0 0 30px 0", fontSize: "14px", color: "#64748b" },
  badgeArea: { display: "flex", alignItems: "center", gap: "15px", paddingBottom: "30px", borderBottom: "1px solid #f1f5f9", marginBottom: "30px" },
  badgeIcon: { width: "45px", height: "45px", borderRadius: "50%", backgroundColor: "#eff6ff", border: "2px solid #93c5fd", display: "flex", justifyContent: "center", alignItems: "center" },
  badgeText: { fontSize: "16px", color: "#1e3a8a", fontWeight: "600" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "40px" },
  dataBlock: { display: "flex", flexDirection: "column", gap: "6px" },
  dataLabel: { fontSize: "13px", color: "#64748b", fontWeight: "500" },
  dataValue: { fontSize: "16px", color: "#0f172a", fontWeight: "600" },
  termsWrapper: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px" },
  checkbox: { width: "18px", height: "18px", cursor: "pointer" },
  termsLabel: { fontSize: "14px", color: "#64748b", cursor: "pointer" },
  linkText: { color: "#1d4ed8", fontWeight: "600" },
  actionRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { padding: "12px 35px", backgroundColor: "white", color: "#1e3a8a", border: "1px solid #1e3a8a", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer" },
  registerBtn: { padding: "12px 35px", backgroundColor: "#1d4ed8", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "600", cursor: "pointer", transition: "0.2s" },
  globalErrorBox: { padding: "12px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center", border: "1px solid #fecaca" },

  // Modal Styles
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: "blur(4px)" },
  modalContent: { backgroundColor: "white", borderRadius: "16px", width: "90%", maxWidth: "450px", padding: "20px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" },
  modalHeader: { display: "flex", justifyContent: "flex-end" },
  closeBtn: { background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "5px" },
  modalBody: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px 40px" },
  errorCircle: { width: "70px", height: "70px", backgroundColor: "#dc2626", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "25px", boxShadow: "0 4px 10px rgba(220, 38, 38, 0.3)" },
  modalMessage: { margin: 0, fontSize: "20px", color: "#374151", textAlign: "center", fontWeight: "600" }
};

export default SummaryPage;