import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function SupportTicketsPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Appliance Issue");
  const [priority, setPriority] = useState("High");
  const [description, setDescription] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get("/support/my");
      setTickets(response.data);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const resetForm = () => {
    setSubject("");
    setCategory("Appliance Issue");
    setPriority("High");
    setDescription("");
  };

  const handleSaveTicket = async () => {
    if (subject.trim() === "" || description.trim() === "") {
      alert("Please fill all fields");
      return;
    }

    try {
      const payload = {
        name: user?.name || "User",
        email: user?.email || "",
        subject,
        category,
        priority,
        description,
      };

      await api.post("/support", payload);
      alert("Support ticket created successfully");
      
      resetForm();
      fetchTickets();
    } catch (error) {
      console.error("Failed to save ticket:", error);
      alert("Error saving ticket. Please try again.");
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
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "32px",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
    padding: "32px",
    marginBottom: "32px",
  };

  const fieldCard = () => ({
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
  });

  const inputStyle = {
    width: "100%",
    padding: "16px 20px",
    borderRadius: "16px",
    border: "2px solid #f1f5f9",
    fontSize: "17px",
    fontWeight: "500",
    outline: "none",
    boxSizing: "border-box",
    background: "#f8fafc",
    transition: "border-color 0.2s, box-shadow 0.2s",
    marginTop: "10px",
  };

  const badgeStyle = (bg, color) => ({
    display: "inline-block",
    background: bg,
    color,
    borderRadius: "12px",
    padding: "8px 16px",
    fontWeight: "800",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    boxShadow: `0 4px 12px ${bg}44`,
  });

  const getStatusBadge = (status) => {
    if (status === "Open") return badgeStyle("#fef3c7", "#b45309");
    if (status === "In Progress") return badgeStyle("#dbeafe", "#1d4ed8");
    if (status === "Resolved") return badgeStyle("#dcfce7", "#166534");
    return badgeStyle("#f1f5f9", "#475569");
  };

  if (loading) return (
    <div style={{ ...containerStyle, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "50px", animation: "pulse 2s infinite" }}>🎫</div>
        <h2 style={{ fontWeight: "600", color: "#059669" }}>Syncing Ticket Central...</h2>
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
          gap: "16px",
        }}
      >
        <div>
          <span style={{ background: "#dcfce7", color: "#166534", padding: "6px 14px", borderRadius: "999px", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
            Issue Tracking
          </span>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: "900",
              margin: "12px 0 8px 0",
              color: "#0f172a",
              letterSpacing: "-1px"
            }}
          >
            Support Tickets
          </h1>
          <p style={{ margin: 0, fontSize: "22px", color: "#64748b" }}>
            Report technical issues and track resolutions 
          </p>
        </div>

        <button
          onClick={handleSaveTicket}
          style={{
            background: "linear-gradient(to right, #10b981, #059669)", 
            color: "white", 
            border: "none",
            borderRadius: "20px",
            padding: "18px 36px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
          }}
        >
          Create New Ticket
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "32px",
        }}
      >
        <div style={glassPanel}>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "900",
              margin: "0 0 32px 0",
              color: "#0f172a",
              letterSpacing: "-1px"
            }}
          >
            File a Request
          </h2>

          <div style={{ display: "grid", gap: "24px" }}>
            <div style={fieldCard()}>
              <label style={{ fontWeight: "800", color: "#475569", fontSize: "14px", textTransform: "uppercase" }}>Ticket Subject</label>
              <input
                type="text"
                placeholder="Briefly describe the issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={fieldCard()}>
                <label style={{ fontWeight: "800", color: "#475569", fontSize: "14px", textTransform: "uppercase" }}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  <option>Appliance Issue</option>
                  <option>Room Issue</option>
                  <option>Energy Target Issue</option>
                  <option>Billing Issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div style={fieldCard()}>
                <label style={{ fontWeight: "800", color: "#475569", fontSize: "14px", textTransform: "uppercase" }}>Urgency Level</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            <div style={fieldCard()}>
              <label style={{ fontWeight: "800", color: "#475569", fontSize: "14px", textTransform: "uppercase" }}>Full Description</label>
              <textarea
                rows="5"
                placeholder="Provide as much detail as possible..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...inputStyle, resize: "none" }}
              ></textarea>
            </div>
          </div>
        </div>

        <div style={glassPanel}>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "900",
              margin: "0 0 24px 0",
              color: "#0f172a",
              letterSpacing: "-1px"
            }}
          >
            Active Monitoring
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                No active tickets in your queue.
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  style={{
                    background: "white",
                    borderRadius: "24px",
                    padding: "24px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#1e293b" }}>{ticket.subject}</h3>
                    <span style={{ 
                      fontSize: "12px", 
                      fontWeight: "700", 
                      background: ticket.priority === "High" ? "#fee2e2" : "#f1f5f9",
                      color: ticket.priority === "High" ? "#991b1b" : "#475569",
                      padding: "4px 10px",
                      borderRadius: "8px"
                    }}>
                      {ticket.priority}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>
                    Category: {ticket.category}
                  </p>

                  <p style={{ margin: "0 0 16px 0", color: "#475569", fontSize: "15px", lineHeight: "1.5" }}>
                    {ticket.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
                    <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600" }}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    <span style={getStatusBadge(ticket.status || "Open")}>{ticket.status || "Open"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportTicketsPage;