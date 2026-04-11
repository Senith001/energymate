import React, { useEffect, useState } from "react";
import api from "../../services/api";

function RoomsPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [editId, setEditId] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHouseholdId, setActiveHouseholdId] = useState(localStorage.getItem("selectedHouseholdId") || localStorage.getItem("activeHouseholdId"));

  useEffect(() => {
    if (activeHouseholdId) {
      fetchRooms();
    } else {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/households/${activeHouseholdId}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    setEditId(room._id);
    setRoomName(room.name);
    setShowPopup(true);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to remove this room?")) return;
    try {
      await api.delete(`/households/${activeHouseholdId}/rooms/${roomId}`);
      setRooms(rooms.filter((r) => r._id !== roomId));
    } catch (error) {
      console.error("Failed to delete room:", error);
      alert("Error deleting room. Please try again.");
    }
  };

  const handleSaveRoom = async () => {
    if (!roomName.trim()) {
      alert("Please enter a room name.");
      return;
    }

    try {
      if (editId) {
        // Update
        const response = await api.put(`/households/${activeHouseholdId}/rooms/${editId}`, {
          name: roomName
        });
        setRooms(rooms.map(r => r._id === editId ? response.data : r));
      } else {
        // Create
        const response = await api.post(`/households/${activeHouseholdId}/rooms`, {
          name: roomName
        });
        setRooms([response.data, ...rooms]);
      }
      setShowPopup(false);
      setRoomName("");
      setEditId(null);
    } catch (error) {
      console.error("Failed to save room:", error);
      alert("Error saving room. Please try again.");
    }
  };

  const containerStyle = {
    background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    color: "#1e293b",
  };

  const glassPanel = {
    background: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "32px",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
    padding: "32px",
  };

  const roomCard = (bg) => ({
    background: "white",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
    border: "1px solid #f1f5f9",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    position: "relative",
    overflow: "hidden",
  });

  const iconGlow = (bg) => ({
    width: "64px",
    height: "64px",
    borderRadius: "20px",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    boxShadow: `0 8px 20px ${bg}66`,
    marginBottom: "8px",
  });

  const getRoomStyle = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("living")) return { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"></path>
          <rect x="2" y="9" width="20" height="8" rx="2"></rect>
          <path d="M4 17v2"></path>
          <path d="M20 17v2"></path>
        </svg>
      ), 
      bg: "#fef3c7" 
    };
    if (lower.includes("kitchen")) return { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
          <path d="M7 2v20"></path>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
        </svg>
      ), 
      bg: "#dcfce7" 
    };
    if (lower.includes("bed")) return { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4v16"></path>
          <path d="M2 8h18a2 2 0 0 1 2 2v10"></path>
          <path d="M2 17h20"></path>
          <path d="M6 8v9"></path>
        </svg>
      ), 
      bg: "#fee2e2" 
    };
    if (lower.includes("bath")) return { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-2.12 0 1.5 1.5 0 0 0 0 2.12L7 8"></path>
          <path d="M2 11h20c0 4.42-3.58 8-8 8H10c-4.42 0-8-3.58-8-8Z"></path>
          <path d="M7 19v2"></path>
          <path d="M17 19v2"></path>
        </svg>
      ), 
      bg: "#dbeafe" 
    };
    if (lower.includes("study")) return { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      ), 
      bg: "#fef3c7" 
    };
    if (lower.includes("gym")) return { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6.5 6.5 11 11"></path>
          <path d="m3 21 3.5-3.5"></path>
          <path d="m21 3-3.5 3.5"></path>
          <path d="m18 10 3-3"></path>
          <path d="m3 17 3 3"></path>
          <path d="m14 6 3-3"></path>
          <path d="m4 20 3-3"></path>
        </svg>
      ), 
      bg: "#ede9fe" 
    };
    return { 
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ), 
      bg: "#f1f5f9" 
    };
  };

  if (loading) return (
    <div style={{ ...containerStyle, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "50px", animation: "pulse 2s infinite", display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"></path>
            <rect x="2" y="9" width="20" height="8" rx="2"></rect>
          </svg>
        </div>
        <h2 style={{ fontWeight: "600", color: "#059669" }}>Organizing Living Spaces...</h2>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "48px",
        }}
      >
        <div>
          <span style={{ background: "#dcfce7", color: "#166534", padding: "6px 14px", borderRadius: "999px", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
            Interior Mapping
          </span>
          <h1 style={{ fontSize: "56px", fontWeight: "900", margin: "12px 0 8px 0", color: "#0f172a", letterSpacing: "-1px" }}>
            Rooms
          </h1>
          <p style={{ fontSize: "22px", color: "#64748b", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            Configure your home's thermal and energy zones
           
          </p>
        </div>

        <button
          onClick={() => {
            setEditId(null);
            setRoomName("");
            setShowPopup(true);
          }}
          style={{
            background: "linear-gradient(to right, #10b981, #059669)", 
            color: "white", 
            border: "none",
            borderRadius: "20px",
            padding: "18px 32px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg> 
          Add New Space
        </button>
      </div>

      <div style={glassPanel}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {rooms.length === 0 ? (
            <div style={{ textAlign: "center", gridColumn: "1 / -1", padding: "80px 40px" }}>
              <div style={{ marginBottom: "20px", display: "flex", justifyContent: "center" }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
              </div>
              <h3 style={{ fontSize: "28px", fontWeight: "800", color: "#64748b" }}>Your home is a blank canvas.</h3>
              <p style={{ color: "#94a3b8", fontSize: "18px" }}>Start by adding a room to map your energy consumption.</p>
            </div>
          ) : (
            rooms.map((room) => {
              const { icon, bg } = getRoomStyle(room.name);
              return (
                <div key={room._id} style={roomCard()}>
                  <div style={iconGlow(bg)}>{icon}</div>

                  <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", margin: "4px 0" }}>{room.name}</h2>

                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      gap: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid #f1f5f9"
                    }}
                  >
                    <button
                      onClick={() => handleDeleteRoom(room._id)}
                      style={{
                        flex: 1,
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "none",
                        padding: "12px",
                        borderRadius: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "20px",
              width: "400px",
            }}
          >
            <h2>{editId ? "Edit Room" : "Add Room"}</h2>

            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "10px",
                borderRadius: "10px",
                border: "1px solid #ccc",
              }}
            />

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowPopup(false)}
                style={{
                  padding: "10px 20px",
                  background: "#d1d5db",
                  border: "none",
                  borderRadius: "10px",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveRoom}
                style={{
                  padding: "10px 20px",
                  background: "#0b8f3a",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomsPage;
