import React, { useEffect, useState } from "react";
import api from "../../services/api";

const AdminSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get("/support");
      setTickets(response.data);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/support/${id}/status`, { status });
      fetchTickets();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === "High") return "#ef4444";
    if (priority === "Medium") return "#f59e0b";
    return "#10b981";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Support Ticket Oversight</h1>
        <p style={styles.subtitle}>Track and resolve system-wide user support requests 🎫</p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Tickets Management ({tickets.length})</h3>
        
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading tickets...</p>
        ) : tickets.length === 0 ? (
          <p style={{ color: "#64748b" }}>No support tickets found.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>User</th>
                  <th style={styles.th}>Subject & Description</th>
                  <th style={styles.th}>Priority</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id} style={styles.tableRow}>
                    <td style={styles.td}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: "bold", color: "#0f172a" }}>{t.userId?.name || "Unknown User"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{t.userId?.email || ""}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: "bold", color: "#0f172a" }}>{t.subject}</div>
                      <div style={{ fontSize: "13px", marginTop: "4px", color: "#475569" }}>{t.description}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        color: getPriorityColor(t.priority), 
                        fontWeight: "800",
                        fontSize: "13px"
                      }}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ 
                        ...styles.statusBadge, 
                        background: t.status === "Resolved" ? "#dcfce7" : t.status === "In Progress" ? "#dbeafe" : "#fee2e2",
                        color: t.status === "Resolved" ? "#166534" : t.status === "In Progress" ? "#1e40af" : "#991b1b"
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {t.status === "Open" && (
                          <button 
                            onClick={() => handleUpdateStatus(t._id, "In Progress")}
                            style={{ ...styles.actionBtn, background: "#3b82f6" }}
                          >
                            In Progress
                          </button>
                        )}
                        {t.status !== "Resolved" && (
                          <button 
                            onClick={() => handleUpdateStatus(t._id, "Resolved")}
                            style={{ ...styles.actionBtn, background: "#10b981" }}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
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
  statusBadge: { padding: "6px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: "700" },
  actionBtn: { padding: "8px 14px", border: "none", borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: "700", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }
};

export default AdminSupportPage;
