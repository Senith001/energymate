import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { FaHome, FaUsers, FaBed, FaBolt, FaWallet, FaEdit, FaMapMarkerAlt, FaCheck, FaTimes } from "react-icons/fa";

function HouseholdPage() {
  const { user } = useAuth();
  const [household, setHousehold] = useState(null);
  const [counts, setCounts] = useState({ rooms: 0, appliances: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    occupants: 1,
    monthlyKwhTarget: 0,
    monthlyCostTarget: 0,
  });

  useEffect(() => {
    fetchHousehold();
  }, []);

  const fetchHousehold = async () => {
    try {
      setLoading(true);
      const hResponse = await api.get("/households");
      if (hResponse.data && hResponse.data.length > 0) {
        const h = hResponse.data[0];
        setHousehold(h);
        setFormData({
          name: h.name,
          city: h.city,
          occupants: h.occupants,
          monthlyKwhTarget: h.monthlyKwhTarget,
          monthlyCostTarget: h.monthlyCostTarget,
        });

        // Fetch counts for Rooms and Appliances
        const [roomsRes, appsRes] = await Promise.all([
          api.get(`/households/${h._id}/rooms`),
          api.get(`/households/${h._id}/appliances`),
        ]);
        
        setCounts({
          rooms: roomsRes.data ? roomsRes.data.length : 0,
          appliances: appsRes.data ? appsRes.data.length : 0,
        });
      }
    } catch (err) {
      setError("Failed to load household data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (household) {
        const response = await api.put(`/households/${household._id}`, formData);
        setHousehold(response.data);
      } else {
        const response = await api.post("/households", formData);
        setHousehold(response.data);
      }
      setEditMode(false);
      alert("Household saved successfully! 🎉");
    } catch (err) {
      alert("Failed to save household. Please check your inputs.");
      console.error(err);
    }
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    padding: "24px",
    border: "1px solid #f1f5f9",
  };

  const statCardStyle = (accent) => ({
    ...cardStyle,
    padding: "20px",
    textAlign: "center",
    borderBottom: `4px solid ${accent}`,
  });

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading your home... 🏠</div>;

  return (
    <div style={{ paddingBottom: "40px" }}>
      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Household</h1>
          <p style={styles.subtitle}>View your household details and family information 🏠</p>
        </div>

        <button onClick={() => setEditMode(true)} style={styles.primaryButton}>
          <FaEdit style={{ marginRight: "8px" }} /> {household ? "Edit Household" : "Create Household"}
        </button>
      </div>

      {!household && !editMode && (
        <div style={{ ...cardStyle, textAlign: "center", color: "#64748b", margin: "40px 0" }}>
          <h2>No Household Found</h2>
          <p>Please click "Create Household" to get started with your energy tracking!</p>
        </div>
      )}

      {household && (
        <>
          {/* Profile Card */}
          <div style={{ ...cardStyle, marginBottom: "24px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <div style={styles.avatarLarge}>
              <FaHome style={{ color: "#10b981", fontSize: "36px" }} />
            </div>

            <div>
              <h2 style={styles.familyName}>{household.name}</h2>
              <div style={styles.roleBadge}>Registered Household</div>
              <div style={styles.locationInfo}>
                <FaMapMarkerAlt style={{ marginRight: "6px" }} /> {household.city}, Sri Lanka
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            <div style={statCardStyle("#10b981")}>
              <div style={{ ...styles.statIcon, background: "#dcfce7", color: "#059669" }}><FaUsers /></div>
              <div style={styles.statLabel}>Members</div>
              <div style={styles.statValue}>{household.occupants}</div>
            </div>

            <div style={statCardStyle("#3b82f6")}>
              <div style={{ ...styles.statIcon, background: "#dbeafe", color: "#2563eb" }}><FaBed /></div>
              <div style={styles.statLabel}>Rooms</div>
              <div style={styles.statValue}>{counts.rooms}</div>
            </div>

            <div style={statCardStyle("#f59e0b")}>
              <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#d97706" }}><FaBolt /></div>
              <div style={styles.statLabel}>Appliances</div>
              <div style={styles.statValue}>{counts.appliances}</div>
            </div>

            <div style={statCardStyle("#ec4899")}>
              <div style={{ ...styles.statIcon, background: "#fce7f3", color: "#db2777" }}><FaWallet /></div>
              <div style={styles.statLabel}>Budget</div>
              <div style={styles.statValue}>LKR {household.monthlyCostTarget.toLocaleString()}</div>
            </div>
          </div>

          {/* Details Section */}
          <div style={cardStyle}>
            <h2 style={{ ...styles.cardTitle, marginBottom: "20px" }}>Detailed Information</h2>

            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Household Name</span>
                <span style={styles.detailValue}>{household.name}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Primary Location</span>
                <span style={styles.detailValue}>{household.city}</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Monthly Energy Target</span>
                <span style={{ ...styles.detailValue, color: "#10b981" }}>{household.monthlyKwhTarget} kWh</span>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Budget Limit</span>
                <span style={{ ...styles.detailValue, color: "#ef4444" }}>LKR {household.monthlyCostTarget.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit/Create Modal */}
      {editMode && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0 }}>{household ? "Edit Information" : "Setup Household"}</h2>
              <button onClick={() => setEditMode(false)} style={styles.closeBtn}><FaTimes /></button>
            </div>

            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Household/Family Name</label>
                <input
                  type="text"
                  required
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Silva Family"
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    required
                    style={styles.input}
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Colombo"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Occupants</label>
                  <input
                    type="number"
                    min="1"
                    style={styles.input}
                    value={formData.occupants}
                    onChange={(e) => setFormData({ ...formData, occupants: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Target kWh / Mo</label>
                  <input
                    type="number"
                    min="0"
                    style={styles.input}
                    value={formData.monthlyKwhTarget}
                    onChange={(e) => setFormData({ ...formData, monthlyKwhTarget: parseInt(e.target.value) })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Budget (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    style={styles.input}
                    value={formData.monthlyCostTarget}
                    onChange={(e) => setFormData({ ...formData, monthlyCostTarget: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEditMode(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>
                  <FaCheck style={{ marginRight: "8px" }} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        © 2025 ENERGYMATE | Smart Efficiency for a Greener Future 🌱
      </footer>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "20px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
  },
  primaryButton: {
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 20px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
  },
  avatarLarge: {
    width: "80px",
    height: "80px",
    borderRadius: "24px",
    background: "#f0fdf4",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid #dcfce7",
  },
  familyName: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  roleBadge: {
    display: "inline-block",
    padding: "4px 12px",
    background: "#e2e8f0",
    color: "#475569",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  locationInfo: {
    display: "flex",
    alignItems: "center",
    fontSize: "15px",
    color: "#64748b",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "24px",
  },
  statIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "20px",
    margin: "0 auto 12px auto",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
  },
  cardTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  detailItem: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    border: "1px solid #f1f5f9",
  },
  detailLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#334155",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(15, 23, 42, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    padding: "32px",
    borderRadius: "24px",
    width: "100%",
    maxWidth: "500px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#94a3b8",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formRow: {
    display: "flex",
    gap: "16px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    fontWeight: "600",
    cursor: "pointer",
  },
  saveBtn: {
    flex: 2,
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: "#10b981",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px",
  },
};

export default HouseholdPage;