import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { 
  getMonthlySummary, 
  getUsages, 
  getUsageByRooms, 
  getUsageByAppliances 
} from "../../utils/usageAPI";

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeHousehold, setActiveHousehold] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [usageSummary, setUsageSummary] = useState(null);
  const [recentUsages, setRecentUsages] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [roomUsageData, setRoomUsageData] = useState([]);
  const [applianceUsageData, setApplianceUsageData] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [hoveredAppliance, setHoveredAppliance] = useState(null);

  const [activeHouseholdId, setActiveHouseholdId] = useState(
    localStorage.getItem("selectedHouseholdId") ||
    localStorage.getItem("activeHouseholdId")
  );

  useEffect(() => {
    const discoverDataHome = async () => {
      try {
        setLoading(true);
        console.log("🔍 Starting Smart Data Discovery...");

        // 1. Fetch ALL usages for this user first (the source of truth)
        const usagePayload = await getUsages();
        const allUsages = usagePayload.data || [];

        // 2. Resolve target household ID
        let targetId = activeHouseholdId;

        // If no active ID, or if the current active has no usage but others do...
        if (!targetId || (allUsages.length > 0 && !allUsages.some(u => u.householdId === targetId))) {
          if (allUsages.length > 0) {
            targetId = allUsages[0].householdId; // Use the home with the most recent log
            console.log("✅ Discovered active data in household:", targetId);
            localStorage.setItem("selectedHouseholdId", targetId);
            setActiveHouseholdId(targetId);
          }
        }

        if (targetId) {
          await fetchDashboardData(targetId, allUsages);
        } else {
          // No households or usages found at all
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Smart Discovery failed:", error);
        setLoading(false);
      }
    };

    discoverDataHome();
  }, []);

  const fetchDashboardData = async (targetId, allUsages = []) => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [householdRes, roomsRes, appliancesRes, summaryPayload, roomBreakdownPayload, applianceBreakdownPayload] = await Promise.all([
        api.get(`/households/${targetId}`),
        api.get(`/households/${targetId}/rooms`),
        api.get(`/households/${targetId}/appliances`),
        getMonthlySummary(targetId, month, year),
        getUsageByRooms(targetId, month, year),
        getUsageByAppliances(targetId, month, year)
      ]);
 
      setActiveHousehold(householdRes.data);
      setRooms(roomsRes.data || []);
      setAppliances(appliancesRes.data || []);
      setUsageSummary(summaryPayload.data);
      setRoomUsageData(roomBreakdownPayload?.data?.breakdown || []);
      setApplianceUsageData(applianceBreakdownPayload?.data?.breakdown || []);

      // Filter and process chart data
      const targetUsages = allUsages.filter(u => u.householdId === targetId || (u.householdId?._id || u.householdId) === targetId);
      setRecentUsages(targetUsages.slice(0, 3));

      // Process Trend Data
      const grouped = targetUsages.reduce((acc, current) => {
        const dateStr = new Date(current.date).toISOString().split("T")[0];
        if (!acc[dateStr]) acc[dateStr] = 0;
        acc[dateStr] += current.unitsUsed;
        return acc;
      }, {});

      const sortedTrend = Object.keys(grouped)
        .sort()
        .map(date => ({ date, units: grouped[date] }))
        .slice(-15); // Last 15 days of data

      setChartData(sortedTrend);

    } catch (error) {
      console.error("Failed to load dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    background: "linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)",
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "'Inter', sans-serif",
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
  };

  const statCard = () => ({
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(16px)",
    borderRadius: "24px",
    padding: "24px",
    flex: 1,
    boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
    textAlign: "center",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "200px",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  });

  const iconCircle = (bg) => ({
    width: "70px",
    height: "70px",
    borderRadius: "22px",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    marginBottom: "16px",
    boxShadow: `0 8px 16px ${bg}44`,
  });

  const getRoomIcon = (name) => {
    if (!name) return { icon: "", color: "#f1f5f9" };
    const lower = name.toLowerCase();
    if (lower.includes("living")) return { icon: "", color: "#fef3c7" };
    if (lower.includes("kitchen")) return { icon: "", color: "#dcfce7" };
    if (lower.includes("bed")) return { icon: "", color: "#fee2e2" };
    if (lower.includes("bath")) return { icon: "", color: "#dbeafe" };
    return { icon: "", color: "#f1f5f9" };
  };

  if (loading) return (
    <div style={{ ...containerStyle, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "50px", animation: "pulse 2s infinite" }}>🌱</div>
        <h2 style={{ fontWeight: "600", color: "#059669" }}>Syncing Home Intelligence...</h2>
      </div>
    </div>
  );

  if (!activeHousehold) {
    return (
      <div style={containerStyle}>
        <div style={{ ...glassPanel, textAlign: "center", maxWidth: "600px", margin: "60px auto" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🌏</div>
          <h2 style={{ fontSize: "36px", fontWeight: "800", marginBottom: "16px", background: "linear-gradient(to right, #059669, #0284c7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Start Your Energy Journey
          </h2>
          <p style={{ fontSize: "20px", color: "#64748b", lineHeight: "1.6", marginBottom: "32px" }}>
            Connect your home to PowerSave to start tracking consumption and saving costs in real-time.
          </p>
          <button
            onClick={() => navigate("/household")}
            style={{
              background: "linear-gradient(to right, #10b981, #059669)",
              color: "white",
              padding: "18px 48px",
              border: "none",
              borderRadius: "20px",
              fontWeight: "700",
              fontSize: "18px",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
              transition: "all 0.3s ease"
            }}
          >
            Create My Household
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
        <div>
          <span style={{ background: "#dcfce7", color: "#166534", padding: "6px 14px", borderRadius: "999px", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
            System Active
          </span>
          <h1 style={{ fontSize: "56px", fontWeight: "900", margin: "12px 0 8px 0", color: "#0f172a", letterSpacing: "-1px" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "22px", color: "#64748b", margin: 0 }}>
            {activeHousehold.name} <span style={{ color: "#cbd5e1", margin: "0 10px" }}>|</span> {activeHousehold.city}
          </p>
        </div>
        <button
          onClick={() => navigate("/households")}
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            padding: "14px 28px",
            borderRadius: "18px",
            fontWeight: "700",
            fontSize: "16px",
            color: "#475569",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "all 0.3s ease"
          }}
        >
          Manage Home
        </button>
      </div>

      <div style={{ display: "flex", gap: "24px", marginBottom: "48px", flexWrap: "wrap" }}>
        <div style={statCard()}>
          <div style={iconCircle("#ecfdf5")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Total Rooms</div>
          <div style={{ fontSize: "36px", fontWeight: "900", color: "#0f172a" }}>{rooms.length}</div>
        </div>
        <div style={statCard()}>
          <div style={iconCircle("#eff6ff")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
              <polyline points="17 2 17 7"></polyline>
              <polyline points="7 2 7 7"></polyline>
            </svg>
          </div>
          <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Appliances</div>
          <div style={{ fontSize: "36px", fontWeight: "900", color: "#0f172a" }}>{appliances.length}</div>
        </div>
        <div style={statCard()}>
          <div style={iconCircle("#fff1f2")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
            </svg>
          </div>
          <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Month Usage</div>
          <div style={{ fontSize: "36px", fontWeight: "900", color: "#e11d48" }}>
            {Number(usageSummary?.totalUnits || 0).toFixed(1)} <span style={{ fontSize: "18px" }}>kWh</span>
          </div>
        </div>
        <div style={statCard()}>
          <div style={iconCircle("#fff7ed")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Monthly Budget</div>
          <div style={{ fontSize: "36px", fontWeight: "900", color: "#0f172a" }}>
            <span style={{ fontSize: "20px", color: "#94a3b8", marginRight: "4px" }}>{activeHousehold.currency}</span>
            {activeHousehold.monthlyCostTarget?.toLocaleString()}
          </div>
        </div>
        <div style={statCard()}>
          <div style={iconCircle("#f5f3ff")}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          <div style={{ color: "#64748b", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Monthly Cost</div>
          <div style={{ fontSize: "36px", fontWeight: "900", color: "#7c3aed" }}>
            <span style={{ fontSize: "20px", color: "#94a3b8", marginRight: "4px" }}>{activeHousehold.currency}</span>
            {Math.round(usageSummary?.totalCost || 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div style={{ ...glassPanel, marginBottom: "48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: 0 }}>Usage Trend</h2>
            <p style={{ color: "#64748b", margin: "4px 0 0 0", fontWeight: "600" }}>Energy footprint visualization (kWh)</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "700", color: "#059669" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }}></span> Active Zone
            </span>
          </div>
        </div>

        {chartData.length > 1 ? (
          <div style={{ height: "300px", width: "100%", position: "relative" }}>
            <svg viewBox="0 0 1000 300" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 1, 2, 3].map(i => (
                <line 
                  key={i}
                  x1="0" y1={300 - (i * 100)} x2="1000" y2={300 - (i * 100)} 
                  stroke="#f1f5f9" strokeWidth="1" 
                />
              ))}

              {/* Data Path */}
              {(() => {
                const maxVal = Math.max(...chartData.map(d => d.units), 10);
                const points = chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 1000;
                  const y = 300 - ((d.units / maxVal) * 250);
                  return `${x},${y}`;
                });

                return (
                  <>
                    <path
                      d={`M 0,300 ${points.map(p => `L ${p}`).join(" ")} L 1000,300 Z`}
                      fill="url(#usageGradient)"
                    />
                    <path
                      d={`M ${points[0]} ${points.slice(1).map(p => `L ${p}`).join(" ")}`}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 1000;
                      const y = 300 - ((d.units / maxVal) * 250);
                      return (
                        <circle 
                          key={i} 
                          cx={x} cy={y} r={hoveredPoint?.date === d.date ? "8" : "6"} 
                          fill="white" 
                          stroke="#10b981" 
                          strokeWidth="3" 
                          onMouseEnter={() => setHoveredPoint({ ...d, x, y })}
                          onMouseLeave={() => setHoveredPoint(null)}
                          style={{ cursor: "pointer", transition: "all 0.2s" }}
                        />
                      );
                    })}

                    {/* Simple detail tooltip */}
                    {hoveredPoint && (
                      <g transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y - 15})`}>
                        <rect 
                          x="-50" y="-45" width="100" height="42" 
                          rx="12" fill="white" 
                          stroke="#e2e8f0" strokeWidth="1"
                          style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.05))" }}
                        />
                        <text y="-28" textAnchor="middle" fill="#0f172a" style={{ fontSize: "14px", fontWeight: "800" }}>
                          {hoveredPoint.units.toFixed(1)} kWh
                        </text>
                        <text y="-14" textAnchor="middle" fill="#94a3b8" style={{ fontSize: "11px", fontWeight: "600" }}>
                          {new Date(hoveredPoint.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </text>
                      </g>
                    )}
                  </>
                );
              })()}

              {/* X Axis Labels */}
              {chartData.map((d, i) => {
                if (i % 2 !== 0 && chartData.length > 8) return null;
                const x = (i / (chartData.length - 1)) * 1000;
                return (
                  <text 
                    key={i} 
                    x={x} y="325" 
                    textAnchor="middle" 
                    fill="#94a3b8" 
                    style={{ fontSize: "12px", fontWeight: "700" }}
                  >
                    {new Date(d.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </text>
                );
              })}
            </svg>
          </div>
        ) : (
          <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #e2e8f0" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📈</div>
              <p style={{ color: "#64748b", fontWeight: "600" }}>Insufficient data to generate usage trend.</p>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>Start logging your energy usage to see your progress.</p>
            </div>
          </div>
        )}
      </div>


      <div style={{ ...glassPanel, marginBottom: "48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 4px 0", color: "#0f172a", letterSpacing: "-1px" }}>Room Distribution</h2>
            <p style={{ margin: 0, color: "#64748b", fontWeight: "600" }}>Energy usage breakdown across your active spaces</p>
          </div>
          <div style={{ background: "#f1f5f9", padding: "8px 16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "14px", fontWeight: "800", color: "#64748b" }}>SPACE ALLOCATION</span>
          </div>
        </div>

        {roomUsageData.length > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "64px", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ position: "relative", width: "280px", height: "280px" }}>
              <svg width="280" height="280" viewBox="0 0 100 100">
                {(() => {
                  const total = roomUsageData.reduce((sum, r) => sum + r.allocatedUsage, 0);
                  let currentOffset = 0;
                  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

                  return (
                    <>
                      {roomUsageData.map((r, i) => {
                        const percentage = total > 0 ? (r.allocatedUsage / total) * 100 : 0;
                        const strokeDash = `${percentage} ${100 - percentage}`;
                        const rotation = (currentOffset / 100) * 360 - 90;
                        const color = colors[i % colors.length];
                        currentOffset += percentage;

                        return (
                          <circle
                            key={i}
                            cx="50" cy="50" r="40"
                            fill="transparent"
                            stroke={color}
                            strokeWidth="12"
                            strokeDasharray={strokeDash}
                            strokeDashoffset="0"
                            transform={`rotate(${rotation} 50 50)`}
                            onMouseEnter={() => setHoveredSlice({ ...r, color })}
                            onMouseLeave={() => setHoveredSlice(null)}
                            style={{ 
                              cursor: "pointer", 
                              transition: "all 0.3s ease",
                              opacity: hoveredSlice?.roomId === r.roomId ? 1 : 0.85
                            }}
                          />
                        );
                      })}
                      <circle cx="50" cy="50" r="30" fill="white" />
                      <text x="50" y="48" textAnchor="middle" fill="#64748b" style={{ fontSize: "6px", fontWeight: "700" }}>TOTAL</text>
                      <text x="50" y="58" textAnchor="middle" fill="#0f172a" style={{ fontSize: "10px", fontWeight: "900" }}>{Math.round(total)} kWh</text>
                    </>
                  );
                })()}
              </svg>
            </div>

            <div style={{ flex: 1, minWidth: "300px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
              {roomUsageData.map((r, i) => {
                const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
                const color = colors[i % colors.length];
                const total = roomUsageData.reduce((sum, item) => sum + item.allocatedUsage, 0);
                const pct = total > 0 ? Math.round((r.allocatedUsage / total) * 100) : 0;

                return (
                  <div key={i} style={{ 
                    display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "16px",
                    background: hoveredSlice?.roomId === r.roomId ? "#f8fafc" : "transparent",
                    border: hoveredSlice?.roomId === r.roomId ? "1px solid #e2e8f0" : "1px solid transparent"
                  }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: color }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "800", color: "#1e293b" }}>{r.roomName}</div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>{r.applianceCount} Devices • {pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #e2e8f0" }}>
            <p style={{ color: "#64748b", fontWeight: "600" }}>No distribution data available.</p>
          </div>
        )}
      </div>

      <div style={{ ...glassPanel, marginBottom: "48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: "900", margin: "0 0 4px 0", color: "#0f172a", letterSpacing: "-1px" }}>Consumption Leaders</h2>
            <p style={{ margin: 0, color: "#64748b", fontWeight: "600" }}>Individual appliance usage breakdown</p>
          </div>
          <div style={{ background: "#f1f5f9", padding: "8px 16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "14px", fontWeight: "800", color: "#64748b" }}>TOP APPLIANCES</span>
          </div>
        </div>

        {applianceUsageData.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {applianceUsageData
              .sort((a, b) => b.allocatedUsage - a.allocatedUsage)
              .slice(0, 7)
              .map((app, i) => {
                const maxUsage = Math.max(...applianceUsageData.map(a => a.allocatedUsage), 0.1);
                const barWidth = (app.allocatedUsage / maxUsage) * 100;
                
                return (
                  <div key={i} style={{ position: "relative", padding: "4px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", position: "relative", zIndex: 2 }}>
                      <span style={{ fontWeight: "800", color: "#334155", fontSize: "15px" }}>{app.name}</span>
                      <span style={{ fontWeight: "900", color: "#0f172a", fontSize: "15px" }}>{app.allocatedUsage.toFixed(1)} kWh</span>
                    </div>
                    <div style={{ height: "12px", background: "#f1f5f9", borderRadius: "6px", overflow: "hidden" }}>
                      <div style={{ 
                        height: "100%", 
                        width: `${barWidth}%`, 
                        background: "linear-gradient(to right, #10b981, #3b82f6)", 
                        borderRadius: "6px",
                        transition: "width 1s ease-out" 
                      }}></div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #e2e8f0" }}>
            <p style={{ color: "#64748b", fontWeight: "600" }}>Insufficient appliance usage data found.</p>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", minHeight: "500px" }}>
        <div style={glassPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>Active Spaces</h2>
            <button
              onClick={() => navigate("/rooms")}
              style={{ color: "#10b981", background: "#f0fdf4", border: "none", padding: "8px 16px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}
            >
              Explore All →
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
            {rooms.length > 0 ? rooms.slice(0, 4).map(room => {
              const style = getRoomIcon(room.name);
              return (
                <div key={room._id} style={{
                  background: "white",
                  padding: "24px",
                  borderRadius: "24px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                }}>
                  <div style={{ fontSize: "36px", marginBottom: "16px" }}>{style.icon}</div>
                  <div style={{ fontWeight: "800", fontSize: "20px", color: "#1e293b", marginBottom: "4px" }}>{room.name}</div>
                  <div style={{ color: "#64748b", fontSize: "15px", fontWeight: "500" }}>
                    <span style={{ color: "#10b981", fontWeight: "700" }}>●</span> {appliances.filter(a => (a.roomId?._id || a.roomId) === room._id).length} Connected
                  </div>
                </div>
              );
            }) : (
              <div style={{ textAlign: "center", padding: "40px", gridColumn: "span 2", color: "#94a3b8" }}>
                No active rooms monitored.
              </div>
            )}
          </div>
        </div>

        <div style={glassPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>Energy Activities</h2>
            <button
              onClick={() => navigate("/usage")}
              style={{ color: "#0284c7", background: "#f0f9ff", border: "none", padding: "8px 16px", borderRadius: "12px", fontWeight: "700", cursor: "pointer" }}
            >
              Real-Time Tracker →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {recentUsages.length > 0 ? recentUsages.map((usage) => (
              <div key={usage._id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px",
                background: "white",
                borderRadius: "20px",
                border: "1px solid #f1f5f9",
                boxShadow: "0 4px 12px rgba(0,0,0,0.01)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "44px", height: "44px", background: "#f8fafc", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                    {usage.entryType === "meter" ? "📊" : "⚡"}
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "17px", color: "#1e293b" }}>{usage.entryType === "meter" ? "Meter Reading" : "Direct Units"}</div>
                    <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600" }}>{new Date(usage.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#10b981", fontSize: "18px", fontWeight: "900" }}>+{usage.unitsUsed} <span style={{ fontSize: "12px" }}>kWh</span></div>
                </div>
              </div>
            )) : (
              <div style={{ textAlign: "center", padding: "40px", background: "#fdf2f2", borderRadius: "24px", border: "1px dashed #fecaca" }}>
                <p style={{ color: "#ef4444", fontWeight: "700", marginBottom: "16px" }}>Historical data pending for this zone.</p>
                <button
                  onClick={() => navigate("/usage")}
                  style={{ background: "#ef4444", color: "white", border: "none", padding: "10px 24px", borderRadius: "14px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }}
                >
                  Configure My Usage
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "80px", borderTop: "1px solid #e2e8f0", paddingTop: "40px" }}>
        <p style={{ color: "#94a3b8", fontSize: "15px", fontWeight: "500" }}>
          © 2025 <span style={{ color: "#10b981", fontWeight: "800" }}>PowerSave</span> | Dynamic Household Intelligence 🌱
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
