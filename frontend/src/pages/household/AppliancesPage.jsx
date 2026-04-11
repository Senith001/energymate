import React, { useEffect, useState } from "react";
import api from "../../services/api";

function AppliancesPage() {
  const [showPopup, setShowPopup] = useState(false);
  const [editId, setEditId] = useState(null);
  const [appliances, setAppliances] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeHouseholdId, setActiveHouseholdId] = useState(localStorage.getItem("selectedHouseholdId") || localStorage.getItem("activeHouseholdId"));

  // Form fields
  const [applianceName, setApplianceName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [wattage, setWattage] = useState("");
  const [dailyUsage, setDailyUsage] = useState("");

  useEffect(() => {
    if (activeHouseholdId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [activeHouseholdId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [applianceRes, roomRes] = await Promise.all([
        api.get(`/households/${activeHouseholdId}/appliances`),
        api.get(`/households/${activeHouseholdId}/rooms`)
      ]);
      setAppliances(applianceRes.data);
      setRooms(roomRes.data);
      if (roomRes.data.length > 0) {
        setSelectedRoomId(roomRes.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch appliances/rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = (watt, hours) => {
    const wattValue = parseFloat(watt);
    const hourValue = parseFloat(hours);
    if (isNaN(wattValue) || isNaN(hourValue)) return "LKR 0";
    // Assuming 0.6 is a mock rate factor, same as in original code
    const cost = Math.round((wattValue * hourValue * 30 * 0.6) / 10);
    return `LKR ${cost.toLocaleString()}`;
  };

  const resetForm = () => {
    setApplianceName("");
    if (rooms.length > 0) setSelectedRoomId(rooms[0]._id);
    setWattage("");
    setDailyUsage("");
    setEditId(null);
  };

  const handleSaveAppliance = async () => {
    if (!applianceName || !wattage || !dailyUsage || !selectedRoomId) {
      alert("Please fill all fields");
      return;
    }

    const payload = {
      name: applianceName,
      roomId: selectedRoomId,
      wattage: Number(wattage),
      defaultHoursPerDay: Number(dailyUsage),
      householdId: activeHouseholdId
    };

    try {
      if (editId) {
        const res = await api.put(`/households/${activeHouseholdId}/appliances/${editId}`, payload);
        setAppliances(appliances.map(a => a._id === editId ? res.data : a));
      } else {
        const res = await api.post(`/households/${activeHouseholdId}/appliances`, payload);
        setAppliances([res.data, ...appliances]);
      }
      resetForm();
      setShowPopup(false);
    } catch (error) {
      console.error("Failed to save appliance:", error);
      alert("Error saving appliance.");
    }
  };

  const handleEditAppliance = (item) => {
    setApplianceName(item.name);
    setSelectedRoomId(item.roomId?._id || item.roomId || "");
    setWattage(item.wattage);
    setDailyUsage(item.defaultHoursPerDay || 0);
    setEditId(item._id);
    setShowPopup(true);
  };

  const handleDeleteAppliance = async (id) => {
    if (!window.confirm("Are you sure you want to delete this appliance?")) return;
    try {
      await api.delete(`/households/${activeHouseholdId}/appliances/${id}`);
      setAppliances(appliances.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Failed to delete appliance:", error);
      alert("Error deleting appliance.");
    }
  };

  const pageCard = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  const badgeStyle = (bg, color = "#111827") => ({
    display: "inline-block",
    background: bg,
    color,
    borderRadius: "999px",
    padding: "8px 16px",
    fontWeight: "700",
    fontSize: "16px",
  });

  const buttonStyle = {
    border: "none",
    borderRadius: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    color: "white",
    fontWeight: "600",
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}><h2>Loading appliances...</h2></div>;

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "48px", fontWeight: "800", margin: "0 0 8px 0", color: "#111827" }}>
            Appliances
          </h1>
          <p style={{ margin: 0, fontSize: "20px", color: "#374151" }}>
            Manage your household appliances and monitor energy use 
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowPopup(true);
          }}
          style={{
            background: "#0b8f3a",
            color: "white",
            border: "none",
            borderRadius: "16px",
            padding: "16px 24px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          + Add Appliance
        </button>
      </div>

      <div style={pageCard}>
        {appliances.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h3>No appliances found. Add one to start tracking!</h3>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>Appliance</th>
                <th style={{ padding: "16px" }}>Room</th>
                <th style={{ padding: "16px" }}>Wattage</th>
                <th style={{ padding: "16px" }}>Daily Usage</th>
                <th style={{ padding: "16px" }}>Cost/Month</th>
                <th style={{ padding: "16px" }}>Status</th>
                <th style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appliances.map((item) => {
                const roomName = item.roomId?.name || (rooms.find(r => r._id === item.roomId)?.name) || "Global";
                const cost = calculateCost(item.wattage, item.defaultHoursPerDay);
                return (
                  <tr key={item._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "18px 16px" }}>{item.name}</td>
                    <td style={{ padding: "18px 16px" }}>{roomName}</td>
                    <td style={{ padding: "18px 16px" }}>{item.wattage} W</td>
                    <td style={{ padding: "18px 16px" }}>
                      <span style={item.defaultHoursPerDay >= 24 ? badgeStyle("#dff3e8", "#166534") : badgeStyle("#fbf1db")}>
                        {item.defaultHoursPerDay} hrs
                      </span>
                    </td>
                    <td style={{ padding: "18px 16px" }}>{cost}</td>
                    <td style={{ padding: "18px 16px" }}>
                      <span style={badgeStyle("#dff3e8", "#166534")}>Active</span>
                    </td>
                    <td style={{ padding: "18px 16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleEditAppliance(item)} style={{ ...buttonStyle, background: "#2563eb" }}>Edit</button>
                        <button onClick={() => handleDeleteAppliance(item._id)} style={{ ...buttonStyle, background: "#dc2626" }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showPopup && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "20px", width: "430px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <h2 style={{ marginTop: 0 }}>{editId ? "Edit Appliance" : "Add Appliance"}</h2>
            <div style={{ display: "grid", gap: "12px" }}>
              <input type="text" placeholder="Enter appliance name" value={applianceName} onChange={(e) => setApplianceName(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              
              <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }}>
                <option value="">Select Room</option>
                {rooms.map(room => (
                  <option key={room._id} value={room._id}>{room.name}</option>
                ))}
              </select>

              <input type="number" placeholder="Enter wattage" value={wattage} onChange={(e) => setWattage(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              <input type="number" placeholder="Enter daily usage (hours)" value={dailyUsage} onChange={(e) => setDailyUsage(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button onClick={() => { resetForm(); setShowPopup(false); }} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "#d1d5db", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSaveAppliance} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "#0b8f3a", color: "white", cursor: "pointer" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppliancesPage;
