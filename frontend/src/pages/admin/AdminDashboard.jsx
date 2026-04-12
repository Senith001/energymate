import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [fetchingLogs, setFetchingLogs] = useState(true);

  // Fetch the Audit Logs securely from the backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/users/superadmin/audit-logs");
        setLogs(response.data.logs);
      } catch (error) {
        console.error("Failed to fetch logs", error);
      } finally {
        setFetchingLogs(false);
      }
    };

    if (user && (user.role === "admin" || user.role === "superadmin")) {
      fetchLogs();
    }
  }, [user]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>System Control Center</h1>
        <p style={styles.subtitle}>Welcome back, {user?.name} (Privilege Level: {user?.role})</p>
      </div>

      <div style={styles.grid}>
        {/* Quick Stats Card */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>System Status</h3>
          <p style={{ color: "#10b981", fontWeight: "bold", fontSize: "24px", margin: "10px 0" }}>● All Systems Operational</p>
          <p style={{ color: "#fca5a5", marginTop: "10px", fontSize: "14px" }}>Database: Connected</p>
          <p style={{ color: "#fca5a5", fontSize: "14px" }}>Server: Online (Port 5001)</p>
        </div>

        {/* Audit Logs Card */}
        <div style={{ ...styles.card, gridColumn: "span 2" }}>
          <h3 style={styles.cardTitle}>Recent Security Activity (Audit Logs)</h3>
          
          {fetchingLogs ? (
            <p style={{ color: "#fca5a5" }}>Loading system logs...</p>
          ) : logs.length === 0 ? (
            <p style={{ color: "#fca5a5" }}>No recent activity found.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Admin ID</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Target ID</th>
                  <th style={styles.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={styles.tableRow}>
                    <td style={styles.td}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={styles.td}>{log.adminId}</td>
                    <td style={styles.td}>
                      <span style={styles.badge}>{log.action}</span>
                    </td>
                    <td style={styles.td}>{log.targetId || "N/A"}</td>
                    <td style={styles.td}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

// Clean Crisp Emerald Air styling to match the primary application
const styles = {
  container: {
    padding: "40px",
    backgroundColor: "#f8fafc", 
    minHeight: "100vh",
    color: "#0f172a",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    marginBottom: "30px",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "white", 
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0", 
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
  },
  cardTitle: {
    marginTop: 0,
    color: "#0f172a", 
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "16px",
    marginBottom: "20px",
    fontWeight: "700",
    fontSize: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeader: {
    backgroundColor: "#f8fafc", 
  },
  th: {
    padding: "14px 12px",
    color: "#475569", 
    fontWeight: "700",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #e2e8f0",
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "16px 12px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "#ecfdf5", 
    color: "#10b981",
    padding: "6px 12px",
    borderRadius: "99px",
    fontSize: "12px",
    fontWeight: "700",
    border: "1px solid #dcfce7",
  },
};

export default AdminDashboard;