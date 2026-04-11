import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  FaRegQuestionCircle,
  FaSync,
  FaRobot,
  FaCouch,
  FaUtensils,
  FaBed,
  FaBath,
  FaBolt,
  FaLeaf,
  FaWallet,
  FaLightbulb,
  FaHome,
  FaPlug,
  FaArrowUp,
} from "react-icons/fa";

function Dashboard() {
  const { user } = useAuth();
  
  // State for Real Data
  const [household, setHousehold] = useState(null);
  const [summary, setSummary] = useState({ totalUnits: 0, totalCost: 0 });
  const [rooms, setRooms] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [aiTip, setAiTip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

        // 1. Fetch Households
        const hRes = await api.get("/households");
        if (hRes.data && hRes.data.length > 0) {
          // Find the household that actually has content (if the first one is empty)
          // We'll prioritize the newest updated one (already sorted by backend now)
          let targetHousehold = hRes.data[0];
          
          setHousehold(targetHousehold);

          // 2. Fetch Aggregated Metrics individually to ensure resilience
          const [summRes, roomsRes, appsRes, aiRes] = await Promise.all([
            api.get(`/households/${targetHousehold._id}/monthly-summary`, { params: { month, year } }).catch(() => null),
            api.get(`/households/${targetHousehold._id}/rooms`).catch(() => null),
            api.get(`/households/${targetHousehold._id}/by-appliances`, { params: { month, year } }).catch(() => null),
            api.post(`/households/${targetHousehold._id}/ai/energy-tips`).catch(() => null)
          ]);

          if (summRes && summRes.data && summRes.data.success) {
            setSummary(prev => ({ ...prev, ...summRes.data.data }));
          }
          
          if (roomsRes && roomsRes.data) {
            setRooms(roomsRes.data);
          }

          if (appsRes && appsRes.data && appsRes.data.success) {
            const breakdown = appsRes.data.data.breakdown || [];
            if (breakdown.length > 0) {
              setAppliances(breakdown);
            } else {
              // Fallback: If breakdown is empty, fetch raw appliances for this household
              api.get(`/households/${targetHousehold._id}/appliances`).then(res => {
                if (res.data) setAppliances(res.data);
              });
            }
            setSummary(prev => ({ ...prev, totalEstimatedUsage: appsRes.data.data.totalEstimatedUsage }));
          } else {
            // Error Fallback: Fetch raw appliances directly
            api.get(`/households/${targetHousehold._id}/appliances`).then(res => {
              if (res.data) setAppliances(res.data);
            });
          }


          if (aiRes && aiRes.data && aiRes.data.success) {
            setAiTip(aiRes.data.data.tips[0]);
          }
        }

    } catch (err) {
      console.error("Dashboard data fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const getPercent = (value, target) => {
    if (!target) return 0;
    return Math.min(Math.round((value / target) * 100), 100);
  };

  const getGaugeColor = (percent) => {
    if (percent < 70) return "#10b981"; // Green
    if (percent < 90) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const getRoomStyle = (name) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("living")) return { icon: <FaCouch />, bg: "#f0fdf4", accent: "#10b981" };
    if (lower.includes("kitchen")) return { icon: <FaUtensils />, bg: "#fffbeb", accent: "#f59e0b" };
    if (lower.includes("bed")) return { icon: <FaBed />, bg: "#fdf2f8", accent: "#ec4899" };
    if (lower.includes("bath")) return { icon: <FaBath />, bg: "#eff6ff", accent: "#3b82f6" };
    return { icon: <FaHome />, bg: "#f8fafc", accent: "#64748b" };
  };

  if (loading) {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#64748b", fontSize: "18px" }}>
      Processing Live Metrics... ⚡
    </div>;
  }

  const powerPercent = getPercent(summary.isProjected ? summary.totalEstimatedUsage : summary.totalUnits, household?.monthlyKwhTarget || 150);
  const costPercent = getPercent(summary.isProjected ? summary.projectedCost : summary.totalCost, household?.monthlyCostTarget || 6500);

  return (
    <div style={styles.dashboardContainer}>
      {/* Header Section */}
      <div style={styles.header}>
        <div style={styles.welcomeInfo}>
          <h1 style={styles.greeting}>Hello, {user?.name || "Member"}!</h1>
          <p style={styles.subGreeting}>Your home is operating with {powerPercent < 80 ? "optimal" : "moderate"} efficiency today.</p>
        </div>

        <div style={styles.topStats}>
          <div style={styles.headerStat}>
            <span style={styles.statLabel}>Family</span>
            <span style={styles.statValue}>{household?.occupants || 1} Members</span>
          </div>
          <div style={styles.divider} />
          <div style={styles.headerStat}>
            <span style={styles.statLabel}>Target</span>
            <span style={styles.statValue}>LKR {household?.monthlyCostTarget?.toLocaleString() || "0"}</span>
          </div>
          <button style={styles.refreshBtn} onClick={fetchDashboardData}>
            <FaSync />
          </button>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div style={styles.heroGrid}>
        {/* Main Consumption Gauge (Glassmorphism) */}
        <div style={styles.gaugeCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIconBox}><FaBolt /></div>
            <h2 style={styles.cardTitle}>Current Consumption</h2>
            <FaRegQuestionCircle style={styles.infoIcon} />
          </div>

          <div style={styles.gaugeContainer}>
            <svg width="220" height="220" viewBox="0 0 220 220">
              {/* Background Track */}
              <circle cx="110" cy="110" r="95" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              {/* Progress Track */}
              <circle
                cx="110"
                cy="110"
                r="95"
                fill="none"
                stroke={getGaugeColor(powerPercent)}
                strokeWidth="12"
                strokeDasharray={`${(powerPercent / 100) * 597} 597`}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
                style={{ transition: "stroke-dasharray 1s ease-in-out, stroke 0.5s ease" }}
              />
              {/* Inner Text */}
              <text x="110" y="105" textAnchor="middle" style={styles.gaugeLabel}>{summary.isProjected ? "PROJECTED" : "LIVE UNITS"}</text>
              <text x="110" y="135" textAnchor="middle" style={styles.gaugeValue}>{summary.isProjected ? summary.totalEstimatedUsage : summary.totalUnits}</text>
              <text x="110" y="160" textAnchor="middle" style={styles.gaugeUnit}>kWh / MONTH</text>
            </svg>
          </div>

          <div style={styles.gaugeFooter}>
            <div style={styles.footerStat}>
              <FaArrowUp style={{ color: "#ef4444", marginBottom: "4px" }} />
              <span style={styles.footerVal}>+12%</span>
              <span style={styles.footerLab}>vs Last Week</span>
            </div>
            <div style={styles.footerDivider} />
            <div style={styles.footerStat}>
              <FaLeaf style={{ color: "#10b981", marginBottom: "4px" }} />
              <span style={styles.footerVal}>A+ Grade</span>
              <span style={styles.footerLab}>Home Rating</span>
            </div>
          </div>
        </div>

        {/* Projection and Insight Section */}
        <div style={styles.rightHeroCol}>
          {/* Cost Projection Card */}
          <div style={styles.financeCard}>
            <div style={styles.financeHeader}>
              <div style={styles.estMeta}>
                <h3 style={styles.estTitle}>Total Estimate</h3>
                <span style={styles.estDate}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div style={styles.financeIcon}><FaWallet /></div>
            </div>
            
            <div style={styles.estMain}>
              <span style={styles.currency}>LKR</span>
              <span style={styles.mainValue}>{(summary.isProjected ? summary.projectedCost : summary.totalCost)?.toLocaleString()}</span>
            </div>

            <div style={styles.budgetStatus}>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Budget Status</span>
                <span style={styles.statusBadge}>{summary.isProjected ? "BASED ON PROFILE" : "ACTUAL BILL"}</span>
              </div>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${costPercent}%`, background: getGaugeColor(costPercent) }} />
              </div>
            </div>
          </div>

          <div style={styles.pulseCard}>
            <div style={styles.pulseHeader}>
              <h3 style={styles.pulseTitle}>Efficiency Pulse</h3>
              <div style={styles.viewBadge}>
                <span style={styles.pulseDot} /> LIVE
              </div>
            </div>
            <div style={styles.pulseChartArea}>
               <svg width="100%" height="60" viewBox="0 0 300 60" style={styles.svgPulse}>
                 <path 
                  d={summary.totalUnits > 0 ? "M0 45 Q 40 10, 80 35 T 160 25 T 240 40 T 300 15" : "M0 30 L 300 30"}
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={styles.pathAnimation}
                />
                <circle cx="300" cy={summary.totalUnits > 0 ? 15 : 30} r="4" fill="#10b981" />
                <circle cx="300" cy={summary.totalUnits > 0 ? 15 : 30} r="8" fill="#10b981" fillOpacity="0.2">
                  <animate attributeName="r" from="4" to="12" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.6" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
               </svg>
            </div>
            <div style={styles.pulseStats}>
              <div style={styles.pulseItem}>
                <span style={styles.pulseLab}>Power Quota</span>
                <span style={{ ...styles.pulseVal, color: getGaugeColor(powerPercent) }}>{powerPercent}%</span>
              </div>
              <div style={styles.pulseItem}>
                <span style={styles.pulseLab}>Finance Limit</span>
                <span style={{ ...styles.pulseVal, color: getGaugeColor(costPercent) }}>{costPercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.secondaryGrid}>
        <div style={styles.roomSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Smart Residence</h2>
            <button style={styles.linkButton}>View All Rooms</button>
          </div>
          
          <div style={styles.roomScroll}>
            {rooms.length > 0 ? (
              rooms.map((room) => {
                const style = getRoomStyle(room.name);
                return (
                  <div key={room._id} style={styles.roomCard}>
                    <div style={{ ...styles.roomIcon, color: style.accent }}>{style.icon}</div>
                    <div style={styles.roomInfo}>
                      <h4 style={styles.roomName}>{room.name}</h4>
                      <p style={styles.roomDetail}>Connected</p>
                    </div>
                    <div style={styles.roomBadge}>Active</div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "20px", color: "#94a3b8", fontSize: "14px", background: "#f8fafc", borderRadius: "16px", width: "100%" }}>
                No rooms found in your household.
              </div>
            )}
          </div>
        </div>

        <div style={styles.insightCard}>
          <div style={styles.aiHeader}>
            <div style={styles.aiTag}><FaRobot style={{marginRight: "6px"}} /> AI ANALYST</div>
            <h3 style={styles.insightTitle}>Performance Insight</h3>
          </div>
          <p style={styles.insightText}>
            {aiTip ? aiTip.tip : "Your home usage is looking stable. Keep monitoring your high-wattage appliances during peak hours."}
          </p>
          <div style={styles.insightAction}>
            <div style={styles.tagGroup}>
              <span style={styles.tag}>#EnergySaving</span>
              <span style={styles.tag}>#Optimization</span>
            </div>
            <FaLightbulb style={{color: "#f59e0b"}} />
          </div>
        </div>
      </div>

      {/* Activity Table (Unit Distribution) */}
      <div style={styles.activityCard}>
        <div style={styles.headerWithAction}>
          <h2 style={styles.sectionTitle}>Unit Distribution Breakdown</h2>
          <div style={styles.dropdownPlaceholder}>Monthly Aggregate</div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Equipment Name</th>
              <th style={styles.th}>Power Rating</th>
              <th style={styles.th}>Usage Hours</th>
              <th style={styles.th}>Unit Share</th>
              <th style={styles.th}>Est. Monthly LKR</th>
            </tr>
          </thead>
          <tbody>
            {(appliances.length > 0 ? appliances : []).map((app, i) => (
              <tr key={app.applianceId || i} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.appCell}>
                    <div style={styles.appIcon}><FaPlug /></div>
                    {app.name}
                  </div>
                </td>
                <td style={styles.td}>{app.wattage}W</td>
                <td style={styles.td}>{app.hoursUsed} hrs</td>
                <td style={styles.td}>
                  <div style={styles.unitBar}>
                    <div style={{ 
                      ...styles.unitFill, 
                      width: `${Math.max(5, Math.min(((app.allocatedUsage || app.estimatedUsage) / (summary.totalUnits || summary.totalEstimatedUsage || 1)) * 100, 100))}%`,
                      background: app.allocatedUsage > 0 ? "#3b82f6" : "#cbd5e1"
                    }} />
                  </div>
                  <span style={styles.unitText}>{app.allocatedUsage > 0 ? `${app.allocatedUsage} kWh` : `Est. ${app.estimatedUsage} kWh`}</span>
                </td>
                <td style={{ ...styles.td, fontWeight: "700", color: "#1e293b" }}>
                  LKR {app.allocatedUsage > 0 
                    ? Math.round(app.allocatedUsage * (summary.totalCost / (summary.totalUnits || 1))).toLocaleString()
                    : Math.round(app.estimatedUsage * 10).toLocaleString() + "*"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {appliances.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
            Add appliances to see your consumption breakdown!
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  dashboardContainer: {
    paddingBottom: "40px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "20px",
  },
  greeting: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px",
  },
  subGreeting: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
  },
  topStats: {
    display: "flex",
    alignItems: "center",
    background: "white",
    padding: "10px 20px",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    gap: "20px",
  },
  headerStat: {
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#1e293b",
  },
  divider: {
    width: "1px",
    height: "24px",
    background: "#e2e8f0",
  },
  refreshBtn: {
    background: "#f1f5f9",
    border: "none",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(340px, 400px) 1fr",
    gap: "24px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  gaugeCard: {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(20px)",
    borderRadius: "32px",
    padding: "32px",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0 20px 50px -12px rgba(16, 185, 129, 0.15)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  cardHeader: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
  },
  cardIconBox: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#dcfce7",
    color: "#059669",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginRight: "12px",
  },
  cardTitle: {
    flex: 1,
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  infoIcon: {
    color: "#cbd5e1",
    cursor: "pointer",
  },
  gaugeContainer: {
    position: "relative",
    margin: "12px 0",
  },
  gaugeLabel: {
    fontSize: "11px",
    fontWeight: "800",
    fill: "#94a3b8",
    letterSpacing: "1px",
  },
  gaugeValue: {
    fontSize: "44px",
    fontWeight: "900",
    fill: "#0f172a",
  },
  gaugeUnit: {
    fontSize: "12px",
    fontWeight: "700",
    fill: "#64748b",
  },
  gaugeFooter: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "20px",
    background: "white",
    borderRadius: "20px",
  },
  footerStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  footerVal: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#1e293b",
  },
  footerLab: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  footerDivider: {
    width: "1px",
    height: "30px",
    background: "#f1f5f9",
  },
  rightHeroCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  financeCard: {
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "32px",
    padding: "32px",
    color: "white",
    boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.3)",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  financeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  financeTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#94a3b8",
    margin: "0 0 4px 0",
  },
  financeDate: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },
  financeIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "20px",
    color: "#10b981",
  },
  currency: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#64748b",
    marginRight: "8px",
  },
  mainValue: {
    fontSize: "48px",
    fontWeight: "800",
    letterSpacing: "-1px",
  },
  budgetStatus: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  statusBadge: {
    padding: "4px 8px",
    fontSize: "10px",
    fontWeight: "800",
    borderRadius: "6px",
    background: "rgba(255,255,255,0.1)",
    color: "#10b981",
  },
  estMain: {
    display: "flex",
    alignItems: "baseline",
  },
  estMeta: {
    display: "flex",
    flexDirection: "column",
  },
  estTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#94a3b8",
    margin: "0 0 4px 0",
  },
  estDate: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },
  progressBar: {
    height: "8px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 1s ease-in-out",
  },
  pulseCard: {
    background: "white",
    borderRadius: "32px",
    padding: "24px 32px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    border: "1px solid #f1f5f9",
  },
  pulseHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pulseTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1e293b",
    margin: 0,
  },
  viewBadge: {
    padding: "4px 10px",
    background: "#fef2f2",
    color: "#ef4444",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
  },
  pulseStats: {
    display: "flex",
    gap: "32px",
  },
  pulseItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  pulseLab: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#94a3b8",
  },
  pulseVal: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#10b981",
  },
  secondaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "24px",
  },
  roomSection: {
    background: "white",
    borderRadius: "32px",
    padding: "32px",
    border: "1px solid #f1f5f9",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1e293b",
    margin: 0,
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#10b981",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  roomScroll: {
    display: "flex",
    gap: "16px",
    overflowX: "auto",
    paddingBottom: "10px",
  },
  roomCard: {
    minWidth: "160px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    border: "1px solid #f1f5f9",
  },
  roomIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    background: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#64748b",
    fontSize: "18px",
  },
  roomName: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#334155",
    margin: 0,
  },
  roomDetail: {
    fontSize: "11px",
    color: "#94a3b8",
    margin: 0,
  },
  roomBadge: {
    alignSelf: "flex-start",
    padding: "2px 8px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "10px",
    fontWeight: "800",
  },
  insightCard: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    borderRadius: "32px",
    padding: "32px",
    color: "white",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 40px -10px rgba(16, 185, 129, 0.25)",
  },
  aiHeader: {
    marginBottom: "16px",
  },
  aiTag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    marginBottom: "12px",
  },
  insightTitle: {
    fontSize: "24px",
    fontWeight: "800",
    margin: 0,
  },
  insightText: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "rgba(255,255,255,0.9)",
    margin: "0 0 24px 0",
    flex: 1,
  },
  insightAction: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  tagGroup: {
    display: "flex",
    gap: "8px",
  },
  tag: {
    fontSize: "12px",
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  activityCard: {
    background: "white",
    borderRadius: "32px",
    padding: "32px",
    border: "1px solid #f1f5f9",
  },
  headerWithAction: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  dropdownPlaceholder: {
    padding: "10px 16px",
    background: "#f1f5f9",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0 12px",
  },
  th: {
    padding: "0 12px 12px 12px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  tr: {
    transition: "transform 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
    }
  },
  td: {
    padding: "16px 12px",
    background: "#f8fafc",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    color: "#334155",
  },
  appCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: "600",
  },
  appIcon: {
    padding: "8px",
    background: "white",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#64748b",
  },
  unitBar: {
    width: "120px",
    height: "6px",
    background: "#e2e8f0",
    borderRadius: "3px",
    marginBottom: "6px",
    overflow: "hidden",
  },
  unitFill: {
    height: "100%",
    background: "#3b82f6",
    borderRadius: "3px",
  },
  unitText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
  },
};

export default Dashboard;