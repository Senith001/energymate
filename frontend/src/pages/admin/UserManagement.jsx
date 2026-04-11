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
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "100%", fontSize: "18px", color: "#6b7280" },
  container: { padding: "30px", backgroundColor: "#f3f4f6", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
  header: { marginBottom: "30px" },
  title: { margin: "0 0 8px 0", fontSize: "28px", color: "#111827", fontWeight: "700" },
  subtitle: { margin: 0, fontSize: "15px", color: "#6b7280" },
  errorBox: { padding: "12px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px", marginBottom: "20px", border: "1px solid #fecaca" },
  card: { backgroundColor: "white", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", overflow: "hidden" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" },
  searchBox: { display: "flex", alignItems: "center", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "8px", width: "300px", overflow: "hidden" },
  searchInput: { border: "none", outline: "none", padding: "10px", width: "100%", fontSize: "14px" },
  userCount: { fontSize: "14px", color: "#4b5563" },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  tableHeader: { backgroundColor: "#f3f4f6", color: "#374151", fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.05em" },
  th: { padding: "15px 20px", fontWeight: "600", borderBottom: "1px solid #e5e7eb" },
  tableRow: { borderBottom: "1px solid #e5e7eb", transition: "background-color 0.2s" },
  td: { padding: "15px 20px", color: "#4b5563", fontSize: "15px" },
  actionButtons: { display: "flex", gap: "10px" },
  deleteBtn: { padding: "8px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", cursor: "pointer", transition: "0.2s" },
  noData: { padding: "30px", textAlign: "center", color: "#6b7280" },
  
  // Modal Styles
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { backgroundColor: "white", padding: "30px", borderRadius: "12px", width: "400px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" },
  cancelBtn: { padding: "10px 15px", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", color: "#374151", fontWeight: "600" },
  confirmDeleteBtn: { padding: "10px 15px", backgroundColor: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", color: "white", fontWeight: "600" }
};

export default UserManagement;