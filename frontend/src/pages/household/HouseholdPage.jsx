import React, { useState, useEffect } from "react";
import api from "../../services/api";

function HouseholdPage() {
  const [households, setHouseholds] = useState([]);
  const [activeHousehold, setActiveHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [occupants, setOccupants] = useState("1");
  const [kwhTarget, setKwhTarget] = useState("");
  const [costTarget, setCostTarget] = useState("");
  const [currency, setCurrency] = useState("LKR");

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      const response = await api.get("/households");
      setHouseholds(response.data);

      if (response.data.length > 0) {
        // Find if we had one previously selected
        const savedId = localStorage.getItem("selectedHouseholdId") || localStorage.getItem("activeHouseholdId");
        const found = response.data.find(h => h._id === savedId) || response.data[0];
        setActiveHousehold(found);
        localStorage.setItem("selectedHouseholdId", found._id);
      }
    } catch (error) {
      console.error("Failed to fetch households:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHousehold = async () => {
    if (!name || !city || !kwhTarget || !costTarget || !occupants) {
      alert("Please fill in all fields.");
      return;
    }

    const payload = {
      name,
      city,
      occupants: Number(occupants),
      monthlyKwhTarget: Number(kwhTarget),
      monthlyCostTarget: Number(costTarget),
      currency
    };

    try {
      if (activeHousehold) {
        // Update
        const res = await api.put(`/households/${activeHousehold._id}`, payload);
        setActiveHousehold(res.data);
      } else {
        // Create
        const res = await api.post("/households", payload);
        setActiveHousehold(res.data);
        localStorage.setItem("selectedHouseholdId", res.data._id);
      }
      setShowPopup(false);
      fetchHouseholds();
    } catch (error) {
      console.error("Failed to save household:", error);
      alert("Error saving household. Please try again.");
    }
  };

  const handleEditClick = () => {
    if (activeHousehold) {
      setName(activeHousehold.name);
      setCity(activeHousehold.city);
      setOccupants(activeHousehold.occupants || "1");
      setKwhTarget(activeHousehold.monthlyKwhTarget || "");
      setCostTarget(activeHousehold.monthlyCostTarget || "");
      setCurrency(activeHousehold.currency || "LKR");
    } else {
      setName("");
      setCity("");
      setOccupants("1");
      setKwhTarget("");
      setCostTarget("");
      setCurrency("LKR");
    }
    setShowPopup(true);
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

  const statCard = {
    background: "white",
    borderRadius: "24px",
    padding: "24px",
    textAlign: "center",
    border: "1px solid #f1f5f9",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.3s ease",
  };

  const iconCircle = (bg) => ({
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    marginBottom: "12px",
    boxShadow: `0 8px 16px ${bg}44`,
  });

  if (loading) return (
    <div style={{ ...containerStyle, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "50px", animation: "pulse 2s infinite" }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
        </div>
        <h2 style={{ fontWeight: "600", color: "#059669" }}>Loading Household Environment...</h2>
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
            Configuration Mode
          </span>
          <h1 style={{ fontSize: "56px", fontWeight: "900", margin: "12px 0 8px 0", color: "#0f172a", letterSpacing: "-1px" }}>
            Household
          </h1>
          <p style={{ margin: 0, fontSize: "22px", color: "#64748b", display: "flex", alignItems: "center", gap: "10px" }}>
            Manage your family profile and energy targets
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </p>
        </div>

        <button
          onClick={handleEditClick}
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
          {activeHousehold ? "Edit Details" : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Create Household
            </>
          )}
        </button>
      </div>

      {!activeHousehold ? (
        <div style={{ ...glassPanel, textAlign: "center", padding: "100px", maxWidth: "800px", margin: "40px auto" }}>
          <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
              <path d="M13 21v-7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v7"></path>
              <path d="M2 21h20"></path>
              <path d="M9 3.27a2 2 0 0 1 2 2v3.47"></path>
              <path d="M20 7v9"></path>
              <path d="M1.24 15a10 10 0 0 1 15.66-8.5"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#0f172a" }}>No Active Household</h2>
          <p style={{ fontSize: "20px", color: "#64748b", maxWidth: "500px", margin: "0 auto 40px auto" }}>To start tracking your energy footprint, please set up your primary household profile.</p>
          <button
            onClick={handleEditClick}
            style={{
              background: "#059669",
              color: "white",
              padding: "18px 48px",
              border: "none",
              borderRadius: "20px",
              fontWeight: "700",
              fontSize: "18px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(5, 150, 105, 0.3)"
            }}
          >
            Create My Profile
          </button>
        </div>
      ) : (
        <>
          <div style={glassPanel}>
            <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
              <div style={{
                width: "120px",
                height: "120px",
                borderRadius: "32px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "60px",
                color: "white",
                boxShadow: "0 12px 30px rgba(16, 185, 129, 0.3)"
              }}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: "0 0 8px 0", fontSize: "40px", color: "#0f172a", fontWeight: "900", letterSpacing: "-1px" }}>
                  {activeHousehold.name}
                </h2>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "18px", fontWeight: "600" }}>
                    {activeHousehold.city || "Global Location"}
                  </span>
                  <span style={{ color: "#cbd5e1" }}>|</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "18px", fontWeight: "600" }}>
                    Primary Residence
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "32px" }}>
            <div style={statCard}>
              <div style={iconCircle("#f0fdf4")}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Status</div>
              <div style={{ fontSize: "24px", fontWeight: "900", color: "#166534" }}>Operational</div>
            </div>

            <div style={statCard}>
              <div style={iconCircle("#f5f3ff")}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#5b21b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Occupants</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#5b21b6" }}>{activeHousehold.occupants || 0} Members</div>
            </div>

            <div style={statCard}>
              <div style={iconCircle("#fff7ed")}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div style={{ color: "#64748b", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Cost Limit</div>
              <div style={{ fontSize: "28px", fontWeight: "900", color: "#9a3412" }}>
                <span style={{ fontSize: "16px", color: "#94a3b8", marginRight: "4px" }}>{activeHousehold.currency}</span>
                {activeHousehold.monthlyCostTarget?.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={glassPanel}>
            <h2 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 32px 0", color: "#0f172a", letterSpacing: "-1px" }}>
              Resource Profiles
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
              <div style={{ background: "white", borderRadius: "24px", padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Energy Goal</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <span style={{ fontSize: "40px", fontWeight: "900", color: "#059669" }}>{activeHousehold.monthlyKwhTarget}</span>
                  <span style={{ fontSize: "20px", fontWeight: "700", color: "#94a3b8" }}>kWh / mo</span>
                </div>
                <div style={{ marginTop: "20px", height: "8px", background: "#f1f5f9", borderRadius: "4px" }}>
                  <div style={{ width: "65%", height: "100%", background: "#10b981", borderRadius: "4px" }}></div>
                </div>
              </div>

              <div style={{ background: "white", borderRadius: "24px", padding: "28px", border: "1px solid #f1f5f9", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Budget Allocation</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                  <span style={{ fontSize: "40px", fontWeight: "900", color: "#0284c7" }}>{activeHousehold.monthlyCostTarget?.toLocaleString()}</span>
                  <span style={{ fontSize: "20px", fontWeight: "700", color: "#94a3b8" }}>{activeHousehold.currency} / mo</span>
                </div>
                <div style={{ marginTop: "20px", height: "8px", background: "#f1f5f9", borderRadius: "4px" }}>
                  <div style={{ width: "40%", height: "100%", background: "#3b82f6", borderRadius: "4px" }}></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showPopup && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "20px", width: "450px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <h2>{activeHousehold ? "Edit Household" : "Create Household"}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
              <div>
                <label style={{ fontSize: "14px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Household Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Silva Family Home" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: "14px", fontWeight: "700", display: "block", marginBottom: "4px" }}>City / Location</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Colombo" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>

              <div>
                <label style={{ fontSize: "14px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Family Members (Occupants)</label>
                <input type="number" value={occupants} onChange={(e) => setOccupants(e.target.value)} min="1" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: "700", display: "block", marginBottom: "4px" }}>kWh Target</label>
                  <input type="number" value={kwhTarget} onChange={(e) => setKwhTarget(e.target.value)} placeholder="150" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "14px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Cost Target</label>
                  <input type="number" value={costTarget} onChange={(e) => setCostTarget(e.target.value)} placeholder="6500" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ccc", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: "30px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowPopup(false)}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "#d1d5db", fontWeight: "700", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveHousehold}
                style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: "#0b8f3a", color: "white", fontWeight: "700", cursor: "pointer" }}
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

export default HouseholdPage;