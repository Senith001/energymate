import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { FaPlus, FaTrash, FaEdit, FaCouch, FaUtensils, FaBed, FaBath, FaBook, FaDumbbell, FaHome } from "react-icons/fa";

function RoomsPage() {
  const [household, setHousehold] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    initPage();
  }, []);

  const initPage = async () => {
    try {
      setLoading(true);
      // 1. Get the primary household
      const hLocal = await api.get("/households");
      if (hLocal.data && hLocal.data.length > 0) {
        setHousehold(hLocal.data[0]);
        // 2. Load rooms for this household
        fetchRooms(hLocal.data[0]._id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to init rooms page", err);
      setLoading(false);
    }
  };

  const fetchRooms = async (hId) => {
    try {
      const response = await api.get(`/households/${hId}/rooms`);
      setRooms(response.data || []);
    } catch (err) {
      console.error("Failed to fetch rooms", err);
    } finally {
      setLoading(false);
    }
  };

  const getRoomStyle = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("living")) return { icon: <FaCouch />, bg: "#f0fdf4", accent: "#10b981" };
    if (lower.includes("kitchen")) return { icon: <FaUtensils />, bg: "#fffbeb", accent: "#f59e0b" };
    if (lower.includes("bed")) return { icon: <FaBed />, bg: "#fdf2f8", accent: "#ec4899" };
    if (lower.includes("bath")) return { icon: <FaBath />, bg: "#eff6ff", accent: "#3b82f6" };
    if (lower.includes("study")) return { icon: <FaBook />, bg: "#faf5ff", accent: "#8b5cf6" };
    if (lower.includes("gym")) return { icon: <FaDumbbell />, bg: "#f0fdfa", accent: "#14b8a6" };
    return { icon: <FaHome />, bg: "#f8fafc", accent: "#64748b" };
  };

  const handleSaveRoom = async () => {
    if (roomName.trim() === "" || !household) return;

    try {
      if (editId) {
        // Update existing
        const response = await api.put(`/households/${household._id}/rooms/${editId}`, { name: roomName });
        setRooms(rooms.map(room => room._id === editId ? response.data : room));
      } else {
        // Create new
        const response = await api.post(`/households/${household._id}/rooms`, { name: roomName });
        setRooms([response.data, ...rooms]);
      }
      setRoomName("");
      setEditId(null);
      setShowPopup(false);
    } catch (err) {
      console.error("Failed to save room", err);
      alert("Failed to save room. Please try again.");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;
    try {
      await api.delete(`/households/${household._id}/rooms/${roomId}`);
      setRooms(rooms.filter(r => r._id !== roomId));
    } catch (err) {
      console.error("Failed to delete room", err);
      alert("Failed to delete room.");
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading rooms...  couch:</div>;

  if (!household) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
        <h2>Initialize Household First</h2>
        <p>You need to create a Household in the Household page before adding rooms.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Rooms</h1>
          <p style={styles.subtitle}>Manage household rooms and appliance distribution 🛋️</p>
        </div>

        <button onClick={() => { setEditId(null); setRoomName(""); setShowPopup(true); }} style={styles.primaryButton}>
          <FaPlus style={{ marginRight: "8px" }} /> Add Room
        </button>
      </div>

      <div style={styles.roomsGrid}>
        {rooms.map((room) => {
          const style = getRoomStyle(room.name);
          return (
            <div key={room._id} style={{ ...styles.roomCard, borderTop: `4px solid ${style.accent}` }}>
              <div style={{ ...styles.iconCircle, background: `${style.accent}15`, color: style.accent }}>
                {style.icon}
              </div>
              
              <h3 style={styles.roomName}>{room.name}</h3>
              
              <div style={styles.roomStats}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Status</span>
                  <span style={styles.statValue}>Connected</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>ID</span>
                  <span style={styles.statValue}>{room._id.slice(-4).toUpperCase()}</span>
                </div>
              </div>

              <div style={styles.cardActions}>
                <button onClick={() => { setRoomName(room.name); setEditId(room._id); setShowPopup(true); }} style={styles.actionBtnEdit}>
                  <FaEdit />
                </button>
                <button onClick={() => handleDeleteRoom(room._id)} style={styles.actionBtnDelete}>
                  <FaTrash />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {rooms.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
          <p>No rooms found. Start by adding a new one!</p>
        </div>
      )}

      {showPopup && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={{ margin: "0 0 20px 0" }}>{editId ? "Edit Room" : "Add New Room"}</h2>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Master Bedroom"
              style={styles.input}
              autoFocus
            />
            <div style={styles.modalActions}>
              <button onClick={() => setShowPopup(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSaveRoom} style={styles.saveBtn}>Save Room</button>
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
  roomsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
  roomCard: {
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  iconCircle: {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "24px",
    marginBottom: "16px",
  },
  roomName: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 16px 0",
  },
  roomStats: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  cardActions: {
    display: "flex",
    gap: "8px",
  },
  actionBtnEdit: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    background: "#eff6ff",
    color: "#2563eb",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnDelete: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    background: "#fef2f2",
    color: "#dc2626",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
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
    maxWidth: "400px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  input: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "16px",
    boxSizing: "border-box",
    marginBottom: "24px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
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
  footer: {
    marginTop: "40px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "14px",
  },
};

export default RoomsPage;