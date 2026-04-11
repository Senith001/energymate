import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get email from query parameters (e.g., /verify-otp?email=user@example.com)
  const queryParams = new URLSearchParams(location.search);
  const email = queryParams.get("email");

  useEffect(() => {
    if (!email) {
      setError("No email provided for verification. Please register again.");
    }
  }, [email]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/users/verify-otp", {
        email,
        otp,
      });

      // The backend returns user data and a token upon successful verification
      const { user, token } = response.data;
      
      // Log the user in automatically
      login(user, token);
      
      // Redirect to dashboard
      navigate("/");
      
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Verification failed");
      } else {
        setError("Cannot connect to the server. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Verify Your Account</h2>
        <p style={styles.subtitle}>
          Enter the 6-digit code sent to <strong>{email || "your email"}</strong>
        </p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleVerify} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              style={styles.input}
              placeholder="123456"
              maxLength="6"
              pattern="\d{6}"
              title="Please enter a 6-digit number"
            />
          </div>

          <button type="submit" disabled={isLoading || !email} style={styles.button}>
            {isLoading ? "Verifying..." : "Verify & Log In"}
          </button>
        </form>

        <p style={styles.footerText}>
          Didn't get a code? <span style={styles.link} onClick={() => navigate("/register")}>Try registering again</span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f4f7f6",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    marginTop: 0,
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    color: "#666",
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontWeight: "bold",
    fontSize: "14px",
    color: "#444",
  },
  input: {
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "20px",
    textAlign: "center",
    letterSpacing: "4px",
  },
  button: {
    padding: "12px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  },
  errorBox: {
    padding: "10px",
    backgroundColor: "#ffebee",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    borderRadius: "4px",
    marginBottom: "16px",
    textAlign: "center",
    fontSize: "14px",
  },
  footerText: {
    textAlign: "center",
    marginTop: "24px",
    fontSize: "14px",
    color: "#666",
  },
  link: {
    color: "#007bff",
    textDecoration: "none",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default VerifyOtpPage;
