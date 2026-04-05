import React, { useEffect, useState } from "react";

function RoomsPage() {
  const defaultRooms = [
    {
      id: 1,
      name: "Living Room",
      appliances: 3,
      floor: "Ground Floor",
      status: "Active",
      icon: "🛋️",
      bg: "#fbf1db",
    },
    {
      id: 2,
      name: "Kitchen",
      appliances: 2,
      floor: "Ground Floor",
      status: "Active",
      icon: "🍴",
      bg: "#e4f1ea",
    },
    {
      id: 3,
      name: "Bedroom",
      appliances: 1,
      floor: "First Floor",
      status: "Active",
      icon: "🛏️",
      bg: "#f8e9e9",
    },
  ];

  const [showPopup, setShowPopup] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [editId, setEditId] = useState(null);

  const [rooms, setRooms] = useState(() => {
    const savedRooms = localStorage.getItem("rooms");
    return savedRooms ? JSON.parse(savedRooms) : defaultRooms;
  });

  useEffect(() => {
    localStorage.setItem("rooms", JSON.stringify(rooms));
  }, [rooms]);

  const pageCard = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  const roomCard = (bg) => ({
    background: bg,
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  });

  const getRoomStyle = (name) => {
    const lower = name.toLowerCase();

    if (lower.includes("living")) return { icon: "🛋️", bg: "#fbf1db" };
    if (lower.includes("kitchen")) return { icon: "🍴", bg: "#e4f1ea" };
    if (lower.includes("bed")) return { icon: "🛏️", bg: "#f8e9e9" };
    if (lower.includes("bath")) return { icon: "🛁", bg: "#eef2ff" };
    if (lower.includes("study")) return { icon: "📚", bg: "#fef3c7" };
    if (lower.includes("gym")) return { icon: "🏋️", bg: "#ede9fe" };

    return { icon: "🏠", bg: "#eef2ff" };
  };

  const handleSaveRoom = () => {
    if (roomName.trim() === "") {
      alert("Please enter room name");
      return;
    }

    const roomStyle = getRoomStyle(roomName);

    if (editId) {
      const updatedRooms = rooms.map((room) =>
        room.id === editId
          ? {
              ...room,
              name: roomName,
              icon: roomStyle.icon,
              bg: roomStyle.bg,
            }
          : room
      );

      setRooms(updatedRooms);
      setEditId(null);
    } else {
      const newRoom = {
        id: rooms.length + 1,
        name: roomName,
        appliances: 0,
        floor: "New Floor",
        status: "Active",
        icon: roomStyle.icon,
        bg: roomStyle.bg,
      };

      setRooms([...rooms, newRoom]);
    }

    setRoomName("");
    setShowPopup(false);
  };

  const handleDeleteRoom = (id) => {
    const filteredRooms = rooms.filter((room) => room.id !== id);
    setRooms(filteredRooms);
  };

  const handleEditRoom = (room) => {
    setRoomName(room.name);
    setEditId(room.id);
    setShowPopup(true);
  };

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "48px", fontWeight: "800" }}>Rooms</h1>
          <p style={{ fontSize: "20px", color: "#374151" }}>
            Manage rooms and appliance distribution
          </p>
        </div>

        <button
          onClick={() => {
            setEditId(null);
            setRoomName("");
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
          }}
        >
          + Add Room
        </button>
      </div>

      <div style={pageCard}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {rooms.map((room) => (
            <div key={room.id} style={roomCard(room.bg)}>
              <div style={{ fontSize: "42px", marginBottom: "12px" }}>
                {room.icon}
              </div>

              <h2 style={{ fontSize: "28px" }}>{room.name}</h2>

              <p>Appliances: {room.appliances}</p>
              <p>Floor: {room.floor}</p>
              <p>Status: {room.status}</p>

              <div
                style={{
                  marginTop: "15px",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => handleEditRoom(room)}
                  style={{
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteRoom(room.id)}
                  style={{
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "10px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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