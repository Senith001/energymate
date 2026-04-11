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
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((f) => (
                  <tr key={f._id} style={styles.tableRow}>
                    <td style={styles.td}>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: "bold" }}>{f.subject}</div>
                      <div style={{ fontSize: "12px", color: "#fca5a5" }}>{f.message}</div>
                    </td>
                    <td style={styles.td}>{f.category}</td>
                    <td style={styles.td}>{"⭐".repeat(f.rating)} ({f.rating}/5)</td>
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
  container: { padding: "10px", color: "white" },
  header: { marginBottom: "30px", borderBottom: "1px solid #450a0a", paddingBottom: "20px" },
  title: { margin: "0 0 10px 0", color: "#f87171" },
  subtitle: { margin: 0, color: "#fca5a5" },
  card: { backgroundColor: "#2b0909", padding: "24px", borderRadius: "15px", border: "1px solid #450a0a" },
  cardTitle: { marginTop: 0, color: "#f9fafb", borderBottom: "1px solid #450a0a", paddingBottom: "15px", marginBottom: "20px" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeader: { backgroundColor: "#450a0a" },
  th: { padding: "15px", color: "#fca5a5", fontSize: "14px", textTransform: "uppercase" },
  tableRow: { borderBottom: "1px solid #450a0a" },
  td: { padding: "15px", color: "#e5e7eb", fontSize: "15px" },
  actionBtn: { padding: "8px 12px", border: "none", borderRadius: "8px", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: "700" }
};

export default AdminFeedbackPage;
