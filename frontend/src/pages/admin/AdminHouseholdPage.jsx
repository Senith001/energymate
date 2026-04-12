import React, { useEffect, useState } from "react";
import api from "../../services/api";

const AdminHouseholdPage = () => {
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // 'rooms' or 'appliances'
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedHouseholdName, setSelectedHouseholdName] = useState("");

  const fetchHouseholds = async (page) => {
    try {
      setLoading(true);
      const response = await api.get(`/households?page=${page}&limit=15`);
      setHouseholds(response.data.households);
      setTotalPages(response.data.pages);
      setTotalCount(response.data.total);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error("Failed to fetch households", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (type, householdId, householdName) => {
    try {
      setModalLoading(true);
      setModalType(type);
      setSelectedHouseholdName(householdName);
      setShowModal(true);
      
      const endpoint = type === "rooms" 
        ? `/households/${householdId}/rooms` 
        : `/households/${householdId}/appliances`;
        
      const response = await api.get(endpoint);
      setModalData(response.data);
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error);
      alert(`Error loading ${type} details.`);
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Household Management</h1>
        <p style={styles.subtitle}>Overview of all user households registered in the system</p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Registered Households ({totalCount})</h3>
        
        {loading ? (
          <p style={{ color: "#64748b" }}>Loading households...</p>
        ) : households.length === 0 ? (
          <p style={{ color: "#64748b" }}>No households found in the system.</p>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Owner Name</th>
                    <th style={styles.th}>Household Name</th>
                    <th style={styles.th}>City</th>
                    <th style={styles.th}>Rooms</th>
                    <th style={styles.th}>Appliances</th>
                    <th style={styles.th}>kWh Target</th>
                    <th style={styles.th}>Cost Target</th>
                  </tr>
                </thead>
                <tbody>
                  {households.map((h) => (
                    <tr key={h._id} style={styles.tableRow}>
                      <td style={styles.td}>{h.userId?.name || "Unknown"}</td>
                      <td style={styles.td} fontWeight="bold">{h.name}</td>
                      <td style={styles.td}>{h.city}</td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => fetchDetails("rooms", h._id, h.name)}
                          style={{ ...styles.badgeBtn, background: "#1e3a8a", color: "#bfdbfe" }}
                        >
                          {h.roomCount || 0} Rooms
                        </button>
                      </td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => fetchDetails("appliances", h._id, h.name)}
                          style={{ ...styles.badgeBtn, background: "#064e3b", color: "#d1fae5" }}
                        >
                          {h.applianceCount || 0} Devices
                        </button>
                      </td>
                      <td style={styles.td}>{h.monthlyKwhTarget} kWh</td>
                      <td style={styles.td}>{h.currency} {h.monthlyCostTarget?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={styles.pagination}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              
              <span style={styles.pageInfo}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>
                {modalType === "rooms" ? "Rooms List" : "Appliances List"} - {selectedHouseholdName}
              </h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>×</button>
            </div>

            <div style={styles.modalBody}>
              {modalLoading ? (
                <p>Loading details...</p>
              ) : modalData.length === 0 ? (
                <p>No {modalType} found for this household.</p>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.th}>Name</th>
                      {modalType === "appliances" && (
                        <>
                          <th style={styles.th}>Room</th>
                          <th style={styles.th}>Wattage</th>
                          <th style={styles.th}>Usage/Day</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.map((item) => (
                      <tr key={item._id} style={styles.tableRow}>
                        <td style={styles.td}>{item.name}</td>
                        {modalType === "appliances" && (
                          <>
                            <td style={styles.td}>{item.roomId?.name || "Unassigned"}</td>
                            <td style={styles.td}>{item.wattage}W</td>
                            <td style={styles.td}>{item.defaultHoursPerDay} hrs</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "40px", color: "#666", fontSize: "14px" }}>
        © 2025 PowerSave Admin Portal | Data strictly monitored for system integrity 🌱
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "10px",
    backgroundColor: "transparent", 
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
    fontSize: "32px",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontWeight: "500", 
  },
  card: {
    backgroundColor: "white", 
    padding: "30px",
    borderRadius: "20px",
    border: "1px solid #e2e8f0", 
    boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
  },
  cardTitle: {
    marginTop: 0,
    color: "#0f172a", 
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "16px",
    marginBottom: "20px",
    fontWeight: "700",
    fontSize: "18px",
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
    padding: "16px 12px",
    color: "#475569", 
    fontWeight: "700",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid #e2e8f0"
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s",
  },
  td: {
    padding: "16px 12px",
    color: "#334155", 
    fontSize: "14px",
    fontWeight: "500",
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "25px",
    padding: "16px 20px",
    background: "#f8fafc",
    borderRadius: "16px",
    border: "1px solid #e2e8f0"
  },
  pageBtn: {
    padding: "10px 24px",
    background: "white", 
    color: "#0f172a",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  pageInfo: {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "500"
  },
  badgeBtn: {
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    border: "none",
    cursor: "pointer",
    transition: "transform 0.1s",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(6px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    width: "70%",
    maxWidth: "800px",
    maxHeight: "80vh",
    borderRadius: "24px",
    padding: "36px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "16px",
    color: "#0f172a"
  },
  modalBody: {
    flex: 1,
    overflowY: "auto",
    padding: "10px 0",
    color: "#334155"
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#64748b",
    fontSize: "32px",
    cursor: "pointer",
    lineHeight: 1,
  }
};

export default AdminHouseholdPage;
