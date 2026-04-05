import React, { useEffect, useState } from "react";

function SupportTicketsPage() {
  const defaultTickets = [
    {
      id: "T001",
      subject: "Appliance not updating",
      category: "Appliance Issue",
      priority: "High",
      description: "The appliance usage data is not updating correctly.",
      date: "2026-04-01",
      status: "Open",
    },
    {
      id: "T002",
      subject: "Room details missing",
      category: "Room Issue",
      priority: "Medium",
      description: "One room is not visible on dashboard.",
      date: "2026-03-29",
      status: "In Progress",
    },
  ];

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Appliance Issue");
  const [priority, setPriority] = useState("High");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);

  const [tickets, setTickets] = useState(() => {
    const savedTickets = localStorage.getItem("supportTickets");
    return savedTickets ? JSON.parse(savedTickets) : defaultTickets;
  });

  useEffect(() => {
    localStorage.setItem("supportTickets", JSON.stringify(tickets));
  }, [tickets]);

  const pageCard = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  const fieldCard = (bg) => ({
    background: bg,
    borderRadius: "18px",
    padding: "18px",
  });

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
  };

  const badgeStyle = (bg, color = "#111827") => ({
    display: "inline-block",
    background: bg,
    color,
    borderRadius: "999px",
    padding: "8px 16px",
    fontWeight: "700",
    fontSize: "15px",
  });

  const buttonStyle = {
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    cursor: "pointer",
    color: "white",
    fontWeight: "600",
  };

  const getStatusBadge = (status) => {
    if (status === "Open") return badgeStyle("#fef3c7", "#b45309");
    if (status === "In Progress") return badgeStyle("#dbeafe", "#1d4ed8");
    if (status === "Resolved") return badgeStyle("#dff3e8", "#166534");
    return badgeStyle("#e5e7eb", "#374151");
  };

  const resetForm = () => {
    setSubject("");
    setCategory("Appliance Issue");
    setPriority("High");
    setDescription("");
    setEditId(null);
  };

  const handleSaveTicket = () => {
    if (subject.trim() === "" || description.trim() === "") {
      alert("Please fill all fields");
      return;
    }

    if (editId) {
      const updatedTickets = tickets.map((ticket) =>
        ticket.id === editId
          ? {
              ...ticket,
              subject,
              category,
              priority,
              description,
            }
          : ticket
      );

      setTickets(updatedTickets);
      alert("Ticket updated successfully");
    } else {
      const newTicket = {
        id: `T${String(tickets.length + 1).padStart(3, "0")}`,
        subject,
        category,
        priority,
        description,
        date: new Date().toISOString().split("T")[0],
        status: "Open",
      };

      setTickets([newTicket, ...tickets]);
      alert("Support ticket created successfully");
    }

    resetForm();
  };

  const handleEditTicket = (ticket) => {
    setSubject(ticket.subject);
    setCategory(ticket.category);
    setPriority(ticket.priority);
    setDescription(ticket.description);
    setEditId(ticket.id);
  };

  const handleDeleteTicket = (id) => {
    const updatedTickets = tickets.filter((ticket) => ticket.id !== id);
    setTickets(updatedTickets);
  };

  const handleStatusChange = (id, newStatus) => {
    const updatedTickets = tickets.map((ticket) =>
      ticket.id === id ? { ...ticket, status: newStatus } : ticket
    );
    setTickets(updatedTickets);
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
            Support Tickets
          </h1>
          <p style={{ margin: 0, fontSize: "20px", color: "#374151" }}>
            Create and track your own support requests 🎫
          </p>
        </div>

        <button
          onClick={handleSaveTicket}
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
          {editId ? "Update Ticket" : "Create Ticket"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.75fr",
          gap: "20px",
        }}
      >
        <div style={pageCard}>
          <h2
            style={{
              fontSize: "30px",
              margin: "0 0 18px 0",
              color: "#111827",
            }}
          >
            {editId ? "Edit Ticket" : "Create New Ticket"}
          </h2>

          <div style={{ display: "grid", gap: "18px" }}>
            <div style={fieldCard("#fbf5e7")}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Subject
              </label>
              <input
                type="text"
                placeholder="Enter ticket subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldCard("#e8f7ed")}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={inputStyle}
              >
                <option>Appliance Issue</option>
                <option>Room Issue</option>
                <option>Energy Target Issue</option>
                <option>Billing Issue</option>
                <option>Other</option>
              </select>
            </div>

            <div style={fieldCard("#eef2ff")}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={inputStyle}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <div style={fieldCard("#fdf2f8")}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Description
              </label>
              <textarea
                rows="6"
                placeholder="Describe your issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...inputStyle, resize: "none" }}
              ></textarea>
            </div>

            {editId && (
              <button
                onClick={resetForm}
                style={{
                  background: "#d1d5db",
                  color: "#111827",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        <div style={pageCard}>
          <h2
            style={{
              fontSize: "28px",
              margin: "0 0 18px 0",
              color: "#111827",
            }}
          >
            Your Recent Tickets
          </h2>

          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                background: "#fbf5e7",
                borderRadius: "18px",
                padding: "18px",
                marginBottom: "14px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "22px",
                  color: "#111827",
                }}
              >
                {ticket.id} - {ticket.subject}
              </h3>

              <p style={{ margin: "0 0 8px 0", color: "#374151" }}>
                Category: {ticket.category}
              </p>

              <p style={{ margin: "0 0 8px 0", color: "#374151" }}>
                Priority: {ticket.priority}
              </p>

              <p style={{ margin: "0 0 8px 0", color: "#374151" }}>
                Created: {ticket.date}
              </p>

              <p style={{ margin: "0 0 10px 0", color: "#374151" }}>
                {ticket.description}
              </p>

              <div style={{ marginBottom: "12px" }}>
                <span style={getStatusBadge(ticket.status)}>{ticket.status}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "10px",
                }}
              >
                <button
                  onClick={() => handleEditTicket(ticket)}
                  style={{ ...buttonStyle, background: "#2563eb" }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDeleteTicket(ticket.id)}
                  style={{ ...buttonStyle, background: "#dc2626" }}
                >
                  Delete
                </button>

                <button
                  onClick={() => handleStatusChange(ticket.id, "In Progress")}
                  style={{ ...buttonStyle, background: "#1d4ed8" }}
                >
                  In Progress
                </button>

                <button
                  onClick={() => handleStatusChange(ticket.id, "Resolved")}
                  style={{ ...buttonStyle, background: "#15803d" }}
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SupportTicketsPage;