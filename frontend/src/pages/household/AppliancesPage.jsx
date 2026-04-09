import React, { useEffect, useState } from "react";

function AppliancesPage() {
  const defaultAppliances = [
    {
      id: 1,
      name: "Rice Cooker",
      room: "Kitchen",
      wattage: "700",
      usage: "1.5",
      cost: "LKR 1,260",
      status: "Active",
    },
    {
      id: 2,
      name: "Refrigerator",
      room: "Kitchen",
      wattage: "150",
      usage: "24",
      cost: "LKR 3,240",
      status: "Active",
    },
    {
      id: 3,
      name: "AC (1.5 Ton)",
      room: "Living Room",
      wattage: "1800",
      usage: "5",
      cost: "LKR 2,700",
      status: "Active",
    },
    {
      id: 4,
      name: "LED TV",
      room: "Living Room",
      wattage: "120",
      usage: "4",
      cost: "LKR 860",
      status: "Active",
    },
  ];

  const [showPopup, setShowPopup] = useState(false);
  const [editId, setEditId] = useState(null);

  const [applianceName, setApplianceName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("Living Room");
  const [wattage, setWattage] = useState("");
  const [dailyUsage, setDailyUsage] = useState("");

  const [appliances, setAppliances] = useState(() => {
    const savedAppliances = localStorage.getItem("appliances");
    return savedAppliances ? JSON.parse(savedAppliances) : defaultAppliances;
  });

  useEffect(() => {
    localStorage.setItem("appliances", JSON.stringify(appliances));
  }, [appliances]);

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

  const calculateCost = (watt, hours) => {
    const wattValue = parseFloat(watt);
    const hourValue = parseFloat(hours);

    if (isNaN(wattValue) || isNaN(hourValue)) {
      return "LKR 0";
    }

    const cost = Math.round((wattValue * hourValue * 30 * 0.6) / 10);
    return `LKR ${cost.toLocaleString()}`;
  };

  const resetForm = () => {
    setApplianceName("");
    setSelectedRoom("Living Room");
    setWattage("");
    setDailyUsage("");
    setEditId(null);
  };

  const handleSaveAppliance = () => {
    if (
      applianceName.trim() === "" ||
      wattage.trim() === "" ||
      dailyUsage.trim() === ""
    ) {
      alert("Please fill all fields");
      return;
    }

    const updatedCost = calculateCost(wattage, dailyUsage);

    if (editId) {
      const updatedAppliances = appliances.map((item) =>
        item.id === editId
          ? {
              ...item,
              name: applianceName,
              room: selectedRoom,
              wattage,
              usage: dailyUsage,
              cost: updatedCost,
            }
          : item
      );

      setAppliances(updatedAppliances);
    } else {
      const newAppliance = {
        id: appliances.length > 0 ? Math.max(...appliances.map((a) => a.id)) + 1 : 1,
        name: applianceName,
        room: selectedRoom,
        wattage,
        usage: dailyUsage,
        cost: updatedCost,
        status: "Active",
      };

      setAppliances([...appliances, newAppliance]);
    }

    resetForm();
    setShowPopup(false);
  };

  const handleEditAppliance = (item) => {
    setApplianceName(item.name);
    setSelectedRoom(item.room);
    setWattage(item.wattage);
    setDailyUsage(item.usage);
    setEditId(item.id);
    setShowPopup(true);
  };

  const handleDeleteAppliance = (id) => {
    const updatedAppliances = appliances.filter((item) => item.id !== id);
    setAppliances(updatedAppliances);
  };

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "800",
              margin: "0 0 8px 0",
              color: "#111827",
            }}
          >
            Appliances
          </h1>
          <p style={{ margin: 0, fontSize: "20px", color: "#374151" }}>
            Manage your household appliances and monitor energy use ⚡
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
            {appliances.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "18px 16px" }}>{item.name}</td>
                <td style={{ padding: "18px 16px" }}>{item.room}</td>
                <td style={{ padding: "18px 16px" }}>{item.wattage} W</td>
                <td style={{ padding: "18px 16px" }}>
                  <span
                    style={
                      String(item.usage).includes("24")
                        ? badgeStyle("#dff3e8", "#166534")
                        : badgeStyle("#fbf1db")
                    }
                  >
                    {item.usage} hrs
                  </span>
                </td>
                <td style={{ padding: "18px 16px" }}>{item.cost}</td>
                <td style={{ padding: "18px 16px" }}>
                  <span style={badgeStyle("#dff3e8", "#166534")}>{item.status}</span>
                </td>
                <td style={{ padding: "18px 16px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleEditAppliance(item)}
                      style={{ ...buttonStyle, background: "#2563eb" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAppliance(item.id)}
                      style={{ ...buttonStyle, background: "#dc2626" }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "30px",
              borderRadius: "20px",
              width: "430px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {editId ? "Edit Appliance" : "Add Appliance"}
            </h2>

            <div style={{ display: "grid", gap: "12px" }}>
              <input
                type="text"
                placeholder="Enter appliance name"
                value={applianceName}
                onChange={(e) => setApplianceName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />

              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              >
                <option>Living Room</option>
                <option>Kitchen</option>
                <option>Bedroom</option>
                <option>Bathroom</option>
                <option>Gym Room</option>
                <option>Study Room</option>
              </select>

              <input
                type="number"
                placeholder="Enter wattage"
                value={wattage}
                onChange={(e) => setWattage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />

              <input
                type="number"
                placeholder="Enter daily usage (hours)"
                value={dailyUsage}
                onChange={(e) => setDailyUsage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  resetForm();
                  setShowPopup(false);
                }}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#d1d5db",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveAppliance}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#0b8f3a",
                  color: "white",
                  cursor: "pointer",
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

export default AppliancesPage;