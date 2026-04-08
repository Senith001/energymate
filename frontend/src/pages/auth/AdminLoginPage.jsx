import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post("/users/login", {
        email,
        password,
      });

      const { user, token } = response.data;

      if (user.role !== "admin" && user.role !== "superadmin") {
        setError("Access Denied: You do not have administrator privileges.");
        setIsLoading(false);
        return; 
      }

      login(user, token);

      // Redirect specifically to the new admin layout path
      navigate("/admin/dashboard");
      
    } catch (err) {
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
      <div style={styles.card}>
        <div style={styles.badge}>SECURE PORTAL</div>
        <h2 style={styles.title}>ENERGYMATE Admin</h2>
        <p style={styles.subtitle}>Authorized personnel only.</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Admin ID or Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={isLoading} style={styles.button}>
            {isLoading ? "Authenticating..." : "Secure Login"}
          </button>
        </form>
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
    backgroundColor: "#111827", 
    fontFamily: "Arial, sans-serif",
  },
  card: {
    backgroundColor: "#1f2937",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    width: "100%",
    maxWidth: "400px",
    borderTop: "4px solid #ef4444", 
  },
  badge: {
    backgroundColor: "#ef4444",
    color: "white",
    fontSize: "12px",
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
    marginBottom: "16px",
  },
  title: {
    marginTop: 0,
    color: "#f9fafb",
  },
  subtitle: {
    color: "#9ca3af",
    marginBottom: "24px",
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
    color: "#d1d5db",
  },
  input: {
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #374151",
    backgroundColor: "#374151",
    color: "white",
    fontSize: "16px",
  },
  button: {
    padding: "12px",
    backgroundColor: "#ef4444", 
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
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "1px solid #ef4444",
    borderRadius: "4px",
    marginBottom: "16px",
    textAlign: "center",
    fontSize: "14px",
  },
};

export default AdminLoginPage;