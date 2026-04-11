import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const LoginPage = () => {
  // State for our form fields and UI feedback
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Hooks for navigation and global auth state
  const navigate = useNavigate();
  const { login } = useAuth();

const handleLogin = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing on submit
    setError(null);
    setIsLoading(true);

    try {
      // 1. Send credentials to your secure backend
      const response = await api.post("/users/login", {
        email,
        password,
      });

      // 2. Extract the data
      const { user, token } = response.data;

      // 3. THE SECURITY GUARD: Stop admins from logging in here! 👇
      if (user.role === "admin" || user.role === "superadmin") {
        setError("Admins must log in through the secure admin portal.");
        setIsLoading(false); // Stop the loading spinner
        return; // Exit the function immediately!
      }

      // 4. If they pass the check (they are a normal user), save their data
      login(user, token);

      // 5. Redirect the user to the Dashboard
      navigate("/");
      
    } catch (err) {
      // If the backend sends a 401 (Invalid Credentials) or 404 (User not found)
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Invalid email or password");
      } else {
        setError("Cannot connect to the server. Please try again later.");
      }
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
          <h2 style={styles.welcomeTitle}>Welcome Back!</h2>
          <p style={styles.welcomeText}>
            Log in to manage your electricity usage and track your household appliances securely.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          <h2 style={styles.formTitle}>Login</h2>
          <p style={styles.formSubtitle}>Please enter your credentials to access your account</p>

          {/* Display backend errors securely to the user */}
          {error && <div style={styles.errorBox}>{error}</div>}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter your email"
              />
            </div>

            <div style={styles.inputWrapper}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Enter your password"
              />
            </div>

            <div style={styles.actionRow}>
              <button type="submit" disabled={isLoading} style={{...styles.nextBtn, opacity: isLoading ? 0.7 : 1}}>
                {isLoading ? "Logging in..." : "Log In"}
              </button>
            </div>
          </form>

          <p style={styles.footerText}>
            Don't have an account? <Link to="/register" style={styles.link}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  container: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#ffffff", padding: "20px", fontFamily: "'Inter', Arial, sans-serif" }, 
  splitCard: { display: "flex", width: "100%", maxWidth: "1000px", background: "linear-gradient(135deg, #0ea5e9, #0284c7)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", minHeight: "550px" },
  leftPanel: { flex: 1, padding: "50px", color: "white", display: "flex", flexDirection: "column", justifyContent: "center" },
  brandTitle: { fontSize: "24px", fontWeight: "800", letterSpacing: "1px", marginBottom: "40px" },
  welcomeTitle: { fontSize: "32px", fontWeight: "700", marginBottom: "15px", lineHeight: "1.2" },
  welcomeText: { fontSize: "16px", lineHeight: "1.6", color: "#e0f2fe" },
  rightPanel: { flex: 1.3, padding: "40px 50px", display: "flex", flexDirection: "column", backgroundColor: "white", borderRadius: "12px", margin: "10px", justifyContent: "center" },
  formTitle: { margin: "0 0 5px 0", fontSize: "24px", color: "#1e3a8a", fontWeight: "700" },
  formSubtitle: { margin: "0 0 30px 0", fontSize: "14px", color: "#64748b" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputWrapper: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569" },
  input: { padding: "12px 15px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", transition: "all 0.2s" },
  actionRow: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "10px" },
  nextBtn: { padding: "14px 30px", width: "100%", backgroundColor: "#1d4ed8", color: "white", border: "none", borderRadius: "8px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "0.2s" },
  errorBox: { padding: "12px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", marginBottom: "20px", textAlign: "center", fontSize: "14px", fontWeight: "500" },
  footerText: { textAlign: "center", marginTop: "30px", fontSize: "14px", color: "#64748b" },
  link: { color: "#1d4ed8", textDecoration: "none", fontWeight: "600" },
};

export default LoginPage;