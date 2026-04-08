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

// Dark red/burgundy styling to match the Admin theme
const styles = {
  container: {
    padding: "30px",
    backgroundColor: "#1a0505", 
    minHeight: "100vh",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    marginBottom: "30px",
    borderBottom: "1px solid #450a0a", 
    paddingBottom: "20px",
  },
  title: {
    margin: "0 0 10px 0",
    color: "#f87171", 
  },
  subtitle: {
    margin: 0,
    color: "#fca5a5", 
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
  },
  card: {
    backgroundColor: "#2b0909", 
    padding: "24px",
    borderRadius: "8px",
    border: "1px solid #450a0a", 
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
  },
  cardTitle: {
    marginTop: 0,
    color: "#f9fafb", 
    borderBottom: "1px solid #450a0a",
    paddingBottom: "10px",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  tableHeader: {
    backgroundColor: "#450a0a", 
  },
  th: {
    padding: "12px",
    color: "#fca5a5", 
    fontWeight: "bold",
    fontSize: "14px",
  },
  tableRow: {
    borderBottom: "1px solid #450a0a",
  },
  td: {
    padding: "12px",
    color: "#e5e7eb", 
    fontSize: "14px",
  },
  badge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)", 
    color: "#ef4444",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
    border: "1px solid rgba(239, 68, 68, 0.3)",
  },
};

export default AdminDashboard;