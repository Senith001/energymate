import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { FiTrash2, FiPlus, FiShield } from "react-icons/fi";

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/superadmin/admins");
      setAdmins(res.data.admins || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load admins.");
    } finally {
      setLoading(false);
    }
  };

  // --- Create Admin Handler ---
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post("/users/admin/create", newAdminData);
      alert("Admin created successfully!");
      setShowCreateModal(false);
      setNewAdminData({ name: "", email: "", password: "" });
      fetchAdmins(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create admin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete Admin Handler ---
  const handleDeleteAdmin = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${name}?`)) return;
    try {
      await api.delete(`/users/superadmin/admins/${id}`);
      setAdmins(admins.filter(a => (a._id || a.id) !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete admin.");
    }
  };

  if (loading) return <div style={styles.center}>Loading admins...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Management</h1>
          <p style={styles.subtitle}>Create and manage system administrator access.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
          <FiPlus style={{ marginRight: "8px" }} /> Add New Admin
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.card}>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Admin ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Clearance</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length > 0 ? (
                admins.map((admin) => {
                  const customId = admin.userId || admin.id || admin._id;
                  return (
                    <tr key={admin._id} style={styles.tableRow}>
                      <td style={styles.td}><strong>{customId}</strong></td>
                      <td style={styles.td}><strong>{admin.name}</strong></td>
                      <td style={styles.td}>{admin.email}</td>
                      <td style={styles.td}>
                        <span style={styles.roleBadge}><FiShield style={{marginRight: "4px"}}/> {admin.role}</span>
                      </td>
                      <td style={styles.td}>
                        <button onClick={() => handleDeleteAdmin(customId, admin.name)} style={styles.deleteBtn} title="Revoke Access">
                          <FiTrash2 /> Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="5" style={styles.noData}>No standard admins found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ margin: "0 0 5px 0", color: "#111827", fontSize: "20px" }}>Create New Admin</h3>
            <p style={{ margin: "0 0 20px 0", color: "#6b7280", fontSize: "14px" }}>Grant standard administrative access to a new user.</p>
            
            <form onSubmit={handleCreateAdmin}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input type="text" value={newAdminData.name} onChange={(e) => setNewAdminData({...newAdminData, name: e.target.value})} required style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Work Email</label>
                <input type="email" value={newAdminData.email} onChange={(e) => setNewAdminData({...newAdminData, email: e.target.value})} required style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Temporary Password</label>
                <input type="password" value={newAdminData.password} onChange={(e) => setNewAdminData({...newAdminData, password: e.target.value})} required minLength="6" style={styles.input} />
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={styles.confirmBtn}>
                  {isSubmitting ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#6b7280" },
  container: { padding: "30px", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" },
  title: { margin: "0 0 8px 0", fontSize: "28px", color: "#111827", fontWeight: "700" },
  subtitle: { margin: 0, fontSize: "15px", color: "#6b7280" },
  createBtn: { display: "flex", alignItems: "center", padding: "10px 20px", backgroundColor: "#111827", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
  errorBox: { padding: "12px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px" },
  card: { backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflow: "hidden" },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeader: { backgroundColor: "#f9fafb", color: "#374151", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" },
  th: { padding: "15px 20px", fontWeight: "600", borderBottom: "1px solid #e5e7eb" },
  tableRow: { borderBottom: "1px solid #e5e7eb" },
  td: { padding: "15px 20px", color: "#4b5563", fontSize: "14px" },
  roleBadge: { display: "inline-flex", alignItems: "center", padding: "4px 10px", backgroundColor: "#fef3c7", color: "#92400e", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "capitalize" },
  deleteBtn: { display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  noData: { padding: "30px", textAlign: "center", color: "#6b7280" },
  
  // Modals
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "white", padding: "30px", borderRadius: "12px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "15px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "25px" },
  cancelBtn: { padding: "10px 15px", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", color: "#374151", fontWeight: "600" },
  confirmBtn: { padding: "10px 15px", backgroundColor: "#111827", border: "none", borderRadius: "6px", cursor: "pointer", color: "white", fontWeight: "600" }
};

export default AdminManagement;