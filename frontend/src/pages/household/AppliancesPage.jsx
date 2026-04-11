import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { FaPlus, FaTrash, FaEdit, FaBolt, FaListUl, FaSearch, FaTimes } from "react-icons/fa";

function AppliancesPage() {
  const [household, setHousehold] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showPopup, setShowPopup] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [applianceName, setApplianceName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [wattage, setWattage] = useState("");
  const [dailyUsage, setDailyUsage] = useState("");

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    try {
      setLoading(true);
      // 1. Get the primary household
      const hLocal = await api.get("/households");
      if (hLocal.data && hLocal.data.length > 0) {
        const mainHousehold = hLocal.data[0];
        setHousehold(mainHousehold);
        
        // 2. Load rooms for this household (to populate dropdown)
        const roomsRes = await api.get(`/households/${mainHousehold._id}/rooms`);
        setRooms(roomsRes.data || []);
        if (roomsRes.data && roomsRes.data.length > 0) {
          setSelectedRoomId(roomsRes.data[0]._id);
        }

        // 3. Load appliances
        fetchAppliances(mainHousehold._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to init appliances page", err);
      setLoading(false);
    }
  };

  const fetchAppliances = async (hId) => {
    try {
      const response = await api.get(`/households/${hId}/appliances`);
      setAppliances(response.data || []);
    } catch (err) {
      console.error("Failed to fetch appliances", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = (watt, hours) => {
    const wattValue = parseFloat(watt);
    const hourValue = parseFloat(hours);
    if (isNaN(wattValue) || isNaN(hourValue)) return "LKR 0";
    // Mock cost logic same as before but using real values
    const cost = Math.round((wattValue * hourValue * 30 * 0.6) / 10);
    return `LKR ${cost.toLocaleString()}`;
  };

  const handleSaveAppliance = async () => {
    if (!applianceName || !wattage || !dailyUsage || !household) return;

    const payload = {
      name: applianceName,
      wattage: parseFloat(wattage),
      defaultHoursPerDay: parseFloat(dailyUsage),
      roomId: selectedRoomId || null,
      quantity: 1, 
    };

    try {
      if (editId) {
        // Update existing
        const response = await api.put(`/households/${household._id}/appliances/${editId}`, payload);
        setAppliances(appliances.map(a => a._id === editId ? response.data : a));
      } else {
        // Create new
        const response = await api.post(`/households/${household._id}/appliances`, payload);
        setAppliances([response.data, ...appliances]);
      }
      setShowPopup(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save appliance", err);
      alert("Failed to save appliance. Please check the backend connectivity.");
    }
  };

  const handleDeleteAppliance = async (aId) => {
    if (!window.confirm("Are you sure you want to delete this appliance?")) return;
    try {
      await api.delete(`/households/${household._id}/appliances/${aId}`);
      setAppliances(appliances.filter(a => a._id !== aId));
    } catch (err) {
      console.error("Failed to delete appliance", err);
      alert("Failed to delete appliance.");
    }
  };

  const resetForm = () => {
    setApplianceName("");
    if (rooms && rooms.length > 0) {
      setSelectedRoomId(rooms[0]._id);
    } else {
      setSelectedRoomId("");
    }
    setWattage("");
    setDailyUsage("");
    setEditId(null);
  };

  const getRoomName = (rId) => {
    const room = rooms.find(r => r._id === rId);
    return room ? room.name : "Unassigned";
  };

  const filteredAppliances = appliances.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading appliances... ⚡</div>;

  if (!household) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <h2>Initialize Household First</h2>
        <p>You need to create a Household in the Household page before adding appliances.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Appliances</h1>
          <p style={styles.subtitle}>Monitor and manage all household equipment ⚡</p>
        </div>

        <button onClick={() => { resetForm(); setShowPopup(true); }} style={styles.primaryButton}>
          <FaPlus style={{ marginRight: "8px" }} /> Add Appliance
        </button>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableToolbar}>
          <div style={styles.searchWrapper}>
            <FaSearch style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search appliances..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.filterInfo}>{filteredAppliances.length} items found</div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Appliance</th>
              <th style={styles.th}>Power (W)</th>
              <th style={styles.th}>Usage (Hrs)</th>
              <th style={styles.th}>Est. Cost/Mo</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppliances.map((item) => (
              <tr key={item._id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.nameCell}>
                    <div style={styles.iconBox}><FaBolt /></div>
                    <span style={styles.itemName}>{item.name}</span>
                  </div>
                </td>
                <td style={styles.td}>{item.wattage}W</td>
                <td style={styles.td}>
                  <span style={{ 
                    ...styles.usageBadge, 
                    background: (item.defaultHoursPerDay || 0) >= 10 ? "#fffbeb" : "#f0fdf4",
                    color: (item.defaultHoursPerDay || 0) >= 10 ? "#854d0e" : "#166534"
                  }}>
                    {item.defaultHoursPerDay || 0} hrs
                  </span>
                </td>
                <td style={{ ...styles.td, fontWeight: "700", color: "#1e293b" }}>
                  {calculateCost(item.wattage, item.defaultHoursPerDay)}
                </td>
                <td style={styles.td}>
                  <span style={styles.roomTag}>{getRoomName(item.roomId)}</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button 
                      onClick={() => { 
                        setApplianceName(item.name); 
                        setEditId(item._id); 
                        setSelectedRoomId(item.roomId || (rooms.length > 0 ? rooms[0]._id : "")); 
                        setWattage(item.wattage); 
                        setDailyUsage(item.defaultHoursPerDay); 
                        setShowPopup(true); 
                      }} 
                      style={styles.editBtn}
                    >
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDeleteAppliance(item._id)} style={styles.deleteBtn}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAppliances.length === 0 && (
          <div style={styles.emptyState}>No appliances found. Start by adding one!</div>
        )}
      </div>

      {showPopup && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ margin: 0 }}>{editId ? "Edit Appliance" : "New Appliance"}</h2>
              <button onClick={() => setShowPopup(false)} style={styles.closeBtn}><FaTimes /></button>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Name</label>
              <input type="text" value={applianceName} onChange={e => setApplianceName(e.target.value)} placeholder="e.g. Rice Cooker" style={styles.input} />
            </div>

            <div style={styles.formRow}>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Wattage (W)</label>
                <input type="number" value={wattage} onChange={e => setWattage(e.target.value)} placeholder="0" style={styles.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.label}>Daily Usage (Hrs)</label>
                <input type="number" value={dailyUsage} onChange={e => setDailyUsage(e.target.value)} placeholder="0" style={styles.input} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Placement Room</label>
              <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} style={styles.select}>
                {rooms.length === 0 ? (
                  <option value="">No rooms available</option>
                ) : (
                  rooms.map(room => (
                    <option key={room._id} value={room._id}>{room.name}</option>
                  ))
                )}
              </select>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowPopup(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSaveAppliance} style={styles.saveBtn}>Save Appliance</button>
            </div>
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
  tableContainer: {
    background: "white",
    borderRadius: "20px",
    padding: "0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #f1f5f9",
    overflow: "hidden",
  },
  tableToolbar: {
    padding: "20px 24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchWrapper: {
    position: "relative",
    width: "300px",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "10px 10px 10px 36px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  filterInfo: {
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "600",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "16px 24px",
    textAlign: "left",
    background: "#f8fafc",
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "16px 24px",
    fontSize: "14px",
    color: "#475569",
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "#f0fdf4",
    color: "#10b981",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "14px",
  },
  itemName: {
    fontWeight: "600",
    color: "#1e293b",
  },
  usageBadge: {
    padding: "4px 10px",
    borderRadius: "6px",
    fontWeight: "700",
    fontSize: "12px",
  },
  roomTag: {
    padding: "4px 8px",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  editBtn: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    cursor: "pointer",
    fontSize: "16px",
    padding: "5px",
  },
  deleteBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "16px",
    padding: "5px",
  },
  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "15px",
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
    maxWidth: "450px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
    marginBottom: "6px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
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
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    color: "#94a3b8",
    cursor: "pointer",
  },
  footer: {
    marginTop: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px",
  },
};

export default AppliancesPage;