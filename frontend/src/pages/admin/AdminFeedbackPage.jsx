import React, { useEffect, useState } from "react";
import api from "../../services/api";

const AdminFeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await api.get("/feedback");
      setFeedbacks(response.data);
    } catch (error) {
      console.error("Failed to fetch feedback", error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleHomeVisibility = async (id) => {
    try {
      await api.patch(`/feedback/${id}/toggle-home`);
      // Update local state
      setFeedbacks(prev => prev.map(f => 
        f._id === id ? { ...f, showOnHome: !f.showOnHome } : f
      ));
    } catch (error) {
      console.error("Failed to toggle home visibility", error);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Feedback Management</h1>
        <p style={styles.subtitle}>Review user experience and system suggestions 💬</p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Recent Feedback ({feedbacks.length})</h3>
        
        {loading ? (
          <p style={{ color: "#fca5a5" }}>Loading feedback...</p>
        ) : feedbacks.length === 0 ? (
          <p style={{ color: "#fca5a5" }}>No feedback found in the system.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Subject & Message</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Show on Home</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f) => (
                  <tr key={f._id} style={styles.tableRow}>
                    <td style={styles.td}>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: "bold", fontSize: "14px" }}>{f.subject}</div>
                      <div style={{ fontSize: "12px", color: "#fca5a5", marginTop: "4px" }}>{f.message}</div>
                    </td>
                    <td style={styles.td}>{f.category}</td>
                    <td style={styles.td}>{"⭐".repeat(f.rating)} <span style={{fontSize: "12px", opacity: 0.7}}>({f.rating}/5)</span></td>
                    <td style={styles.td}>
                      <button 
                        onClick={() => toggleHomeVisibility(f._id)}
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: f.showOnHome ? "#10b981" : "#4b5563",
                          minWidth: "100px"
                        }}
                      >
                        {f.showOnHome ? "Featured ✓" : "Off"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: "10px", color: "#0f172a", fontFamily: "'Inter', sans-serif" },
  header: { marginBottom: "30px", borderBottom: "1px solid #e2e8f0", paddingBottom: "20px" },
  title: { margin: "0 0 10px 0", color: "#0f172a", fontWeight: "900", letterSpacing: "-0.5px", fontSize: "32px" },
  subtitle: { margin: 0, color: "#64748b", fontWeight: "500" },
  card: { backgroundColor: "white", padding: "30px", borderRadius: "20px", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)" },
  cardTitle: { marginTop: 0, color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px", marginBottom: "20px", fontWeight: "700", fontSize: "18px" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeader: { backgroundColor: "#f8fafc" },
  th: { padding: "16px 12px", color: "#475569", fontSize: "12px", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0" },
  tableRow: { borderBottom: "1px solid #f1f5f9", transition: "background-color 0.2s" },
  td: { padding: "16px 12px", color: "#334155", fontSize: "14px", fontWeight: "500" },
  actionBtn: { padding: "10px 16px", border: "none", borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: "800", transition: "0.2s", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }
};

export default AdminFeedbackPage;
