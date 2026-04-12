import React, { useState, useEffect } from "react";
import api from "../../services/api";

// Icons
import { FiTrash2, FiSearch } from "react-icons/fi"; // Removed FiKey

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [deleteModal, setDeleteModal] = useState({ show: false, targetId: null, userName: "" });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/admin/users"); 
      
      const allFetchedUsers = res.data.users || res.data;
      const standardUsers = allFetchedUsers.filter(u => u.role === "user");
      
      setUsers(standardUsers);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handleDeleteUser = async () => {
    if (!deleteModal.targetId) return alert("Error: User ID is missing.");

    try {
      setActionLoading(true);
      await api.delete(`/users/admin/users/${deleteModal.targetId}`);
      
      setUsers(users.filter(u => (u.userId || u.id || u._id) !== deleteModal.targetId));
      setDeleteModal({ show: false, targetId: null, userName: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user.");
      setDeleteModal({ show: false, targetId: null, userName: "" }); 
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.userId && user.userId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div style={styles.center}>Loading users...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>User Management</h1>
        <p style={styles.subtitle}>Manage standard system users and remove accounts.</p>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <FiSearch style={{ color: "#9ca3af", marginLeft: "10px" }} />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.userCount}>
            Total Users: <strong>{filteredUsers.length}</strong>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Member ID</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const customId = user.userId || user.id || user._id;

                  return (
                    <tr key={user._id} style={styles.tableRow}>
                      <td style={styles.td}><strong>{customId}</strong></td>
                      <td style={styles.td}><strong>{user.name}</strong></td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button 
                            onClick={() => setDeleteModal({ show: true, targetId: customId, userName: user.name })}
                            style={styles.deleteBtn}
                            title="Permanently Delete User"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={styles.noData}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteModal.show && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ marginTop: 0, color: "#991b1b" }}>Confirm Deletion</h3>
            <p>Are you sure you want to permanently delete <strong>{deleteModal.userName}</strong>? This action cannot be undone.</p>
            <div style={styles.modalActions}>
              <button onClick={() => setDeleteModal({ show: false, targetId: null, userName: "" })} style={styles.cancelBtn} disabled={actionLoading}>Cancel</button>
              <button onClick={handleDeleteUser} disabled={actionLoading} style={styles.confirmDeleteBtn}>
                {actionLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const styles = {
  center: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontSize: "18px", color: "#64748b", fontFamily: "'Inter', sans-serif" },
  container: { padding: "40px", backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "#0f172a" },
  header: { marginBottom: "30px", borderBottom: "1px solid #e2e8f0", paddingBottom: "20px" },
  title: { margin: "0 0 10px 0", fontSize: "32px", color: "#0f172a", fontWeight: "900", letterSpacing: "-0.5px" },
  subtitle: { margin: 0, fontSize: "15px", color: "#64748b", fontWeight: "500" },
  errorBox: { padding: "12px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px", border: "1px solid #fee2e2" },
  card: { backgroundColor: "white", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0", overflow: "hidden" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 30px", borderBottom: "1px solid #e2e8f0", backgroundColor: "white" },
  searchBox: { display: "flex", alignItems: "center", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", width: "300px", overflow: "hidden", transition: "0.2s" },
  searchInput: { border: "none", outline: "none", padding: "12px", width: "100%", fontSize: "14px", backgroundColor: "transparent" },
  userCount: { fontSize: "14px", color: "#64748b", fontWeight: "600" },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeader: { backgroundColor: "#f8fafc", color: "#475569", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" },
  th: { padding: "16px 30px", borderBottom: "1px solid #e2e8f0" },
  tableRow: { borderBottom: "1px solid #f1f5f9", transition: "background-color 0.2s" },
  td: { padding: "16px 30px", color: "#334155", fontSize: "14px", fontWeight: "500" },
  actionButtons: { display: "flex", gap: "10px" },
  deleteBtn: { padding: "8px", backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: "8px", cursor: "pointer", transition: "0.2s" },
  noData: { padding: "30px", textAlign: "center", color: "#64748b" },
  
  // Modal Styles
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "white", padding: "32px", borderRadius: "20px", width: "400px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #e2e8f0" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" },
  cancelBtn: { padding: "10px 16px", backgroundColor: "white", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", color: "#475569", fontWeight: "600" },
  confirmDeleteBtn: { padding: "10px 16px", backgroundColor: "#ef4444", border: "none", borderRadius: "8px", cursor: "pointer", color: "white", fontWeight: "600", boxShadow: "0 2px 8px rgba(239,68,68,0.25)" }
};

export default UserManagement;