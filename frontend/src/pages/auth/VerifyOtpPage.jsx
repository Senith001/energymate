import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../services/api";

// Professional icons
import { BsEnvelopePaperFill, BsArrowLeft } from "react-icons/bs";

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const userEmail = location.state?.email || "your registered email"; 

  // --- STATES ---
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60); // 2 minute countdown
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState(""); // ✅ Added for clean UI feedback
  const [isLoading, setIsLoading] = useState(false);

  // If a user navigates here without an email in state, redirect them back
  useEffect(() => {
    if (!location.state?.email) {
      navigate("/register");
    }
  }, [location.state, navigate]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m : ${s < 10 ? '0' : ''}${s}s`;
  };

  // --- OTP INPUT HANDLERS ---
  const handleOtpInput = (e, index) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) return; 

    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);
    setError(null);
    setResendMessage(""); // Clear resend message when they start typing

    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  // --- API HANDLERS ---
  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otpValues.join("");

    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResendMessage("");

    try {
      await api.post("/users/verify-otp", { 
        email: userEmail, 
        otp: otpString 
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return; 
    
    setOtpValues(["", "", "", "", "", ""]);
    setError(null);
    setResendMessage("");
    setIsLoading(true);

    try {
      await api.post("/users/resend-otp", { email: userEmail });
      setTimeLeft(60); 
      setResendMessage("A new OTP has been sent to your email!"); // ✅ Display nice UI message
      
      // Auto-hide the message after 5 seconds
      setTimeout(() => setResendMessage(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
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
          <div style={styles.progressRow}>
            <div style={{...styles.progressLine, background: "#1d4ed8"}}></div>
            <div style={{...styles.progressLine, background: "#1d4ed8"}}></div>
            <div style={{...styles.progressLine, background: "#1d4ed8"}}></div>
          </div>
          
          <div style={styles.iconWrapper}>
            <BsEnvelopePaperFill size={36} color="#0284c7" />
          </div>

          <h2 style={styles.title}>Verify Your Email</h2>
          <p style={styles.subtitle}>
            We have sent a 6-digit confirmation code to <br/>
            <strong style={{color: "#1f2937"}}>{userEmail}</strong>.
          </p>

          {error && <div style={styles.errorBox}>{error}</div>}
          
          {/* ✅ Inline Success Message for Resend */}
          {resendMessage && <div style={styles.inlineSuccessText}>{resendMessage}</div>}
          
          {success ? (
            <div style={styles.successBox}>
              Email verified successfully! Redirecting to login...
            </div>
          ) : (
            <form onSubmit={handleVerify} style={{ width: "100%" }}>
              
              <div style={styles.timerRow}>
                <span>⏱️ Code expires in:</span>
                <strong style={{ color: timeLeft <= 30 ? "#ef4444" : "#0284c7" }}>
                  {formatTime(timeLeft)}
                </strong>
              </div>

              <div style={styles.otpContainer}>
                {otpValues.map((val, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={val}
                    onChange={(e) => handleOtpInput(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    style={{
                      ...styles.otpInput,
                      borderColor: val ? "#0284c7" : "#d1d5db",
                      backgroundColor: val ? "#f0f9ff" : "white"
                    }}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button 
                type="submit" 
                disabled={isLoading || otpValues.join("").length !== 6} 
                style={{
                  ...styles.verifyBtn,
                  opacity: (isLoading || otpValues.join("").length !== 6) ? 0.7 : 1
                }}
              >
                {isLoading ? "Processing..." : "Verify Account"}
              </button>
            </form>
          )}

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Didn't receive the code?{" "}
              <button 
                type="button" 
                onClick={handleResend} 
                disabled={timeLeft > 0 || isLoading}
                style={{
                  ...styles.resendBtn,
                  color: timeLeft > 0 ? "#9ca3af" : "#0284c7",
                  cursor: timeLeft > 0 ? "default" : "pointer"
                }}
              >
                Resend OTP
              </button>
            </p>
            
            <Link to="/login" style={styles.backLink}>
              <BsArrowLeft style={{ marginTop: "2px" }} /> Back to Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#ffffff", padding: "20px", fontFamily: "'Inter', Arial, sans-serif" }, 
  splitCard: { display: "flex", width: "100%", maxWidth: "1000px", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", minHeight: "550px" },
  leftPanel: { flex: 1, padding: "50px", color: "white", display: "flex", flexDirection: "column", justifyContent: "center" },
  brandTitle: { fontSize: "24px", fontWeight: "800", letterSpacing: "1px", marginBottom: "40px" },
  welcomeTitle: { fontSize: "32px", fontWeight: "700", marginBottom: "15px", lineHeight: "1.2" },
  welcomeText: { fontSize: "16px", lineHeight: "1.6", color: "#e0f2fe" },
  rightPanel: { flex: 1.3, padding: "40px 50px", display: "flex", flexDirection: "column", backgroundColor: "white", borderRadius: "12px", margin: "10px", alignItems: "center" }, 
  progressRow: { display: "flex", gap: "8px", marginBottom: "20px", width: "100%" },
  progressLine: { height: "5px", flex: 1, backgroundColor: "#e2e8f0", borderRadius: "4px" },
  iconWrapper: { width: "70px", height: "70px", borderRadius: "50%", backgroundColor: "#e0f2fe", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: "20px" },
  title: { margin: "0 0 10px 0", fontSize: "24px", color: "#1f2937", fontWeight: "700" },
  subtitle: { margin: "0 0 25px 0", fontSize: "15px", color: "#6b7280", textAlign: "center", lineHeight: "1.5" },
  timerRow: { display: "flex", justifyContent: "center", gap: "8px", fontSize: "14px", color: "#4b5563", fontWeight: "600", marginBottom: "20px" },
  otpContainer: { display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "30px", width: "100%" },
  otpInput: { width: "50px", height: "60px", fontSize: "24px", textAlign: "center", borderRadius: "10px", border: "2px solid #d1d5db", outline: "none", color: "#1f2937", fontWeight: "bold", transition: "all 0.2s" },
  verifyBtn: { width: "100%", padding: "14px", backgroundColor: "#0284c7", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "0.2s" },
  errorBox: { width: "100%", padding: "12px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", textAlign: "center", border: "1px solid #fecaca" },
  successBox: { width: "100%", padding: "16px", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "8px", textAlign: "center", fontSize: "15px", fontWeight: "600", border: "1px solid #bbf7d0" },
  inlineSuccessText: { color: "#16a34a", fontSize: "14px", fontWeight: "600", marginBottom: "15px", textAlign: "center" }, // ✅ Added style for resend success
  footer: { marginTop: "25px", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px", width: "100%", borderTop: "1px solid #f3f4f6", paddingTop: "20px" },
  footerText: { margin: 0, fontSize: "14px", color: "#6b7280" },
  resendBtn: { background: "none", border: "none", fontWeight: "700", padding: 0, marginLeft: "5px" },
  backLink: { display: "flex", alignItems: "center", gap: "6px", color: "#4b5563", textDecoration: "none", fontSize: "14px", fontWeight: "600", transition: "0.2s" }
};

export default VerifyOtpPage;