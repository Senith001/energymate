import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import { FiArrowLeft, FiChevronDown, FiEye, FiTrash2 } from "react-icons/fi";
import BillDetailsDialog from "../../components/billing/BillDetailsDialog";
import { getStatusTone } from "../../components/energy/dashboardTheme";
import {
  adminCardStyle,
  adminColors,
  adminInputStyle,
  formatAdminCurrency,
  formatAdminMonth,
} from "../../components/energy/adminTheme";

function AdminBillingPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [showUserOptions, setShowUserOptions] = useState(false);
  const [households, setHouseholds] = useState([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState("");
  const [householdQuery, setHouseholdQuery] = useState("");
  const [showHouseholdOptions, setShowHouseholdOptions] = useState(false);
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bills, setBills] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [deletingBillId, setDeletingBillId] = useState("");
  const [message, setMessage] = useState("");
  const [billsPage, setBillsPage] = useState(1);

  // Share the same household selector across admin oversight pages so period lookups stay consistent.
  useEffect(() => {
    async function loadLookups() {
      try {
        const [userResponse, householdResponse] = await Promise.all([api.get("/users/admin/users"), api.get("/households")]);
        // The selector only needs end users because households belong to regular user accounts, not admins.
        const nextUsers = toArray(userResponse.data?.data ?? userResponse.data?.users ?? userResponse.data).filter(
          (user) => user?.role === "user"
        );
        const nextHouseholds = toArray(householdResponse.data);
        setUsers(nextUsers);
        setHouseholds(nextHouseholds);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load admin lookup data.");
      }
    }

    loadLookups();
  }, []);

  // Reload billing oversight whenever the selected household or comparison period changes.
  useEffect(() => {
    async function loadBillingData() {
      if (!selectedHouseholdId && !selectedUserId) {
        setLoading(false);
        setBills([]);
        setComparison(null);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setMessage("");

        if (selectedHouseholdId) {
          const billsResponse = await api.get(`/bills/households/${selectedHouseholdId}`);
          const nextBills = toArray(billsResponse.data?.data ?? billsResponse.data);
          setBills(nextBills);

          // The summary cards now support two modes:
          // 1. year only -> latest bill within that year
          // 2. year + month -> exact selected billing period
          if (year !== "all") {
            const targetBill =
              month !== "all"
                ? nextBills.find((bill) => Number(bill.year) === Number(year) && Number(bill.month) === Number(month))
                : nextBills
                    .filter((bill) => Number(bill.year) === Number(year))
                    .sort(sortBillsNewestFirst)[0];

            if (targetBill) {
              const comparisonResponse = await api.get(
                `/bills/households/${selectedHouseholdId}/compare?month=${targetBill.month}&year=${targetBill.year}`
              );
              setComparison(comparisonResponse.data?.data || null);
            } else {
              setComparison(null);
            }
          } else {
            setComparison(null);
          }
        } else {
          // User-only selection shows bill records across that user's households without mixing in household-specific summary cards.
          const billResponses = await Promise.all(visibleHouseholds.map((household) => api.get(`/bills/households/${household._id}`)));
          const combinedBills = billResponses
            .flatMap((response) => toArray(response.data?.data ?? response.data))
            .sort(sortBillsNewestFirst);

          setBills(combinedBills);
          setComparison(null);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load bill history for this household.");
      } finally {
        setLoading(false);
      }
    }

    loadBillingData();
  }, [month, selectedHouseholdId, selectedUserId, year]);

  // The selected household label is reused in the page summary and the bill details dialog.
  const selectedHousehold = households.find((item) => item._id === selectedHouseholdId);
  const selectedUser = users.find((item) => item._id === selectedUserId);
  const visibleHouseholds = selectedUserId
    ? households.filter((household) => resolveHouseholdUserId(household) === selectedUserId)
    : households;
  const householdNameMap = new Map(households.map((household) => [household._id, household.name]));
  // Build the year dropdown from the bill records currently loaded for this admin scope.
  const availableYearOptions = buildYearOptions(bills, (bill) => Number(bill.year));

  useEffect(() => {
    if (selectedHousehold) {
      setHouseholdQuery(getHouseholdOptionLabel(selectedHousehold));
    } else if (!selectedHouseholdId) {
      setHouseholdQuery("");
    }
  }, [selectedHousehold, selectedHouseholdId]);

  useEffect(() => {
    if (selectedUser) {
      setUserQuery(getUserOptionLabel(selectedUser));
    } else if (!selectedUserId) {
      setUserQuery("");
    }
  }, [selectedUser, selectedUserId]);

  // Keep destructive admin actions inside this page so billing oversight stays self-contained.
  async function handleDeleteBill(billId) {
    const confirmed = window.confirm("Delete this bill permanently?");
    if (!confirmed) return;

    try {
      setDeletingBillId(billId);
      setError("");
      await api.delete(`/bills/${billId}`);
      setBills((current) => current.filter((bill) => bill._id !== billId));
      if (selectedBill?._id === billId) {
        setSelectedBill(null);
      }
      setMessage("Bill deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete this bill.");
    } finally {
      setDeletingBillId("");
    }
  }

  function handleHouseholdSearchChange(value) {
    setHouseholdQuery(value);
    setShowHouseholdOptions(true);
    if (!value.trim()) {
      setSelectedHouseholdId("");
    }
  }

  // Selecting a household switches billing oversight back to one household's history and comparison view.
  function handleHouseholdSelect(household) {
    setSelectedHouseholdId(household._id);
    setHouseholdQuery(getHouseholdOptionLabel(household));
    setShowHouseholdOptions(false);
  }

  function handleUserSearchChange(value) {
    setUserQuery(value);
    setShowUserOptions(true);
    if (!value.trim()) {
      setSelectedUserId("");
      setSelectedHouseholdId("");
      setHouseholdQuery("");
    }
  }

  // User changes clear any stale household choice that belongs to a different owner.
  function handleUserSelect(user) {
    setSelectedUserId(user._id);
    setUserQuery(getUserOptionLabel(user));
    setShowUserOptions(false);
    const householdStillMatches = households.some(
      (household) => household._id === selectedHouseholdId && resolveHouseholdUserId(household) === user._id
    );
    if (!householdStillMatches) {
      setSelectedHouseholdId("");
      setHouseholdQuery("");
    }
  }

  // Search labels are reused here so the dropdown can support both browsing and direct typing.
  const filteredUsers = users.filter((user) => {
    const selectedLabel = selectedUser ? getUserOptionLabel(selectedUser) : "";
    const searchText = userQuery.trim().toLowerCase();
    if (!searchText || userQuery === selectedLabel) return true;
    return getUserOptionLabel(user).toLowerCase().includes(searchText);
  });

  const filteredHouseholds = visibleHouseholds.filter((household) => {
    const selectedLabel = selectedHousehold ? getHouseholdOptionLabel(selectedHousehold) : "";
    const searchText = householdQuery.trim().toLowerCase();
    // When the field is only showing the current selection, keep the dropdown unfiltered for browsing.
    if (!searchText || householdQuery === selectedLabel) return true;
    return getHouseholdOptionLabel(household).toLowerCase().includes(searchText);
  });

  // Billing summary cards stay hidden for user-only mode because the comparison endpoint is household-specific.
  const shouldShowBillingCards = Boolean(selectedHouseholdId && year !== "all");
  const filteredBills = bills.filter((bill) => matchesBillPeriod(bill, month, year));
  // Follow the exact month when both filters are selected; otherwise show the latest bill within the chosen year.
  const latestBill =
    month !== "all" && year !== "all"
      ? bills.find((bill) => Number(bill.year) === Number(year) && Number(bill.month) === Number(month)) || null
      : bills.filter((bill) => year === "all" || Number(bill.year) === Number(year)).sort(sortBillsNewestFirst)[0] || null;
  const totalBillPages = Math.max(1, Math.ceil(filteredBills.length / BILLS_PER_PAGE));
  const visibleBills = filteredBills.slice((billsPage - 1) * BILLS_PER_PAGE, billsPage * BILLS_PER_PAGE);

  useEffect(() => {
    setBillsPage(1);
  }, [selectedUserId, selectedHouseholdId, month, year]);

  useEffect(() => {
    // If the chosen year disappears after filtering or deletion, fall back to the open-ended year filter.
    if (year !== "all" && !availableYearOptions.includes(String(year))) {
      setYear("all");
    }
  }, [availableYearOptions, year]);

  useEffect(() => {
    if (billsPage > totalBillPages) {
      setBillsPage(totalBillPages);
    }
  }, [billsPage, totalBillPages]);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "grid", gap: "8px" }}>
        <div>
          <Link to="/admin/usage-billing" style={backLinkStyle}>
            <FiArrowLeft size={16} />
            Back
          </Link>
        </div>
        <h1 style={{ margin: 0, color: adminColors.text, fontSize: "32px", fontWeight: "700", lineHeight: 1.2 }}>Billing Oversight</h1>
        <p style={{ margin: 0, color: adminColors.muted }}>
          Inspect household bill history, current amounts, and month-over-month changes from the admin portal.
        </p>
      </div>

      <div style={{ ...adminCardStyle, padding: "24px", display: "grid", gap: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1.1fr) minmax(260px, 1.4fr) repeat(2, minmax(120px, 140px))", gap: "14px", alignItems: "end" }}>
          <label style={labelStyle}>
            User
            <div style={{ position: "relative", display: "grid", gap: "8px" }}>
              <div style={searchShellStyle}>
                <input
                  style={searchInputStyle}
                  value={userQuery}
                  placeholder="Search user by name or email"
                  onFocus={() => setShowUserOptions(true)}
                  onChange={(event) => handleUserSearchChange(event.target.value)}
                  onBlur={(event) => {
                    const nextValue = event.target.value.trim();
                    window.setTimeout(() => {
                      setShowUserOptions(false);
                      if (!nextValue) {
                        setSelectedUserId("");
                        setUserQuery("");
                        setSelectedHouseholdId("");
                        setHouseholdQuery("");
                      } else if (selectedUser) {
                        setUserQuery(getUserOptionLabel(selectedUser));
                      }
                    }, 120);
                  }}
                />
                <button type="button" onMouseDown={() => setShowUserOptions((current) => !current)} style={dropdownToggleStyle}>
                  <FiChevronDown size={16} />
                </button>
              </div>
              {showUserOptions ? (
                <div style={optionListStyle}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      setSelectedUserId("");
                      setUserQuery("");
                      setSelectedHouseholdId("");
                      setHouseholdQuery("");
                      setShowUserOptions(false);
                    }}
                    style={getOptionButtonStyle(false)}
                    onMouseEnter={(event) => applyOptionHover(event, false)}
                    onMouseLeave={(event) => clearOptionHover(event, false)}
                  >
                    None
                  </button>
                  {filteredUsers.length === 0 ? (
                    <div style={emptyOptionStyle}>No matching users found.</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onMouseDown={() => handleUserSelect(user)}
                        style={getOptionButtonStyle(user._id === selectedUserId)}
                        onMouseEnter={(event) => applyOptionHover(event, user._id === selectedUserId)}
                        onMouseLeave={(event) => clearOptionHover(event, user._id === selectedUserId)}
                      >
                        {getUserOptionLabel(user)}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </label>
          <label style={labelStyle}>
            Household
            <div style={{ position: "relative", display: "grid", gap: "8px" }}>
              <div style={searchShellStyle}>
                <input
                  style={searchInputStyle}
                  value={householdQuery}
                  placeholder={selectedUserId ? "Search this user's households" : "Search household by name, city, or ID"}
                  onFocus={() => setShowHouseholdOptions(true)}
                  onChange={(event) => handleHouseholdSearchChange(event.target.value)}
                  onBlur={(event) => {
                    const nextValue = event.target.value.trim();
                    window.setTimeout(() => {
                      setShowHouseholdOptions(false);
                      if (!nextValue) {
                        setSelectedHouseholdId("");
                        setHouseholdQuery("");
                      } else if (selectedHousehold) {
                        setHouseholdQuery(getHouseholdOptionLabel(selectedHousehold));
                      }
                    }, 120);
                  }}
                />
                <button
                  type="button"
                  onMouseDown={() => setShowHouseholdOptions((current) => !current)}
                  style={dropdownToggleStyle}
                >
                  <FiChevronDown size={16} />
                </button>
              </div>
              {showHouseholdOptions ? (
                <div style={optionListStyle}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      setSelectedHouseholdId("");
                      setHouseholdQuery("");
                      setShowHouseholdOptions(false);
                    }}
                    style={getOptionButtonStyle(false)}
                    onMouseEnter={(event) => applyOptionHover(event, false)}
                    onMouseLeave={(event) => clearOptionHover(event, false)}
                  >
                    None (All households)
                  </button>
                  {filteredHouseholds.length === 0 ? (
                    <div style={emptyOptionStyle}>No matching households found.</div>
                  ) : (
                    filteredHouseholds.map((household) => (
                      <button
                        key={household._id}
                        type="button"
                        onMouseDown={() => handleHouseholdSelect(household)}
                        style={getOptionButtonStyle(household._id === selectedHouseholdId)}
                        onMouseEnter={(event) => applyOptionHover(event, household._id === selectedHouseholdId)}
                        onMouseLeave={(event) => clearOptionHover(event, household._id === selectedHouseholdId)}
                      >
                        {getHouseholdOptionLabel(household)}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </label>
          <label style={labelStyle}>
            Month
            <select style={adminInputStyle} value={month} onChange={(event) => setMonth(event.target.value)}>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Year
            <select style={adminInputStyle} value={year} onChange={(event) => setYear(event.target.value)}>
              {availableYearOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All Years" : option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ color: adminColors.muted, fontSize: "14px", lineHeight: 1.6, marginTop: "-4px" }}>
          {selectedHousehold
            ? `${selectedHousehold.name} is currently selected.`
            : selectedUser
              ? `Select one of ${selectedUser.name || selectedUser.email}'s households.`
              : "Select a user first, then a household, or search directly by household."}
        </div>

        {error ? <Message tone="error" text={error} /> : null}
        {message ? <Message tone="success" text={message} /> : null}
        {loading ? <Message tone="info" text="Loading bill history..." /> : null}
      </div>

      {shouldShowBillingCards ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
          <MetricCard label="Latest Bill" value={latestBill ? formatAdminCurrency(latestBill.totalCost) : "-"} tone="green" />
          <MetricCard label="Latest Period" value={latestBill ? formatAdminMonth(latestBill.month, latestBill.year) : "-"} tone="amber" />
          <MetricCard
            label="Current Delta"
            value={
              comparison?.difference?.costChangePercent !== undefined && comparison?.difference?.costChangePercent !== null
                ? `${comparison.difference.costChangePercent >= 0 ? "+" : ""}${Number(comparison.difference.costChangePercent).toFixed(1)}%`
                : "-"
            }
            tone="blue"
          />
        </div>
      ) : null}

      <div style={{ ...adminCardStyle, padding: "24px", display: "grid", gap: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: adminColors.text }}>Bill History</h3>
          <span style={{ color: adminColors.muted, fontSize: "14px" }}>
            {selectedHousehold
              ? `${selectedHousehold.name} has ${bills.length} stored bills.`
              : selectedUser
                ? `Bill records across ${selectedUser.name || selectedUser.email}'s households.`
                : "Select a household to inspect bill history."}
          </span>
        </div>

        {filteredBills.length === 0 ? (
          <Message
            tone="info"
            text={
              selectedHousehold
                ? "No bill records are available for this household yet."
                : selectedUser
                  ? "No bill records match the selected filters for this user's households."
                  : "Select a user or household to inspect bill history."
            }
          />
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${adminColors.border}` }}>
                    <TableHead>Period</TableHead>
                    {!selectedHouseholdId ? <TableHead>Household</TableHead> : null}
                    <TableHead>Total Units</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead>Actions</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {visibleBills.map((bill) => (
                    <tr key={bill._id} style={{ borderBottom: `1px solid ${adminColors.border}` }}>
                      <TableCell>{formatAdminMonth(bill.month, bill.year)}</TableCell>
                      {!selectedHouseholdId ? <TableCell>{householdNameMap.get(bill.householdId) || "-"}</TableCell> : null}
                      <TableCell>{Number(bill.totalUnits || 0).toFixed(1)} kWh</TableCell>
                      <TableCell>{formatAdminCurrency(bill.totalCost)}</TableCell>
                      <TableCell>
                        <StatusBadge bill={bill} />
                      </TableCell>
                      <TableCell>{bill.paidAt ? new Date(bill.paidAt).toLocaleDateString("en-US") : "-"}</TableCell>
                      <TableCell>
                        <div style={actionRowStyle}>
                          <button type="button" onClick={() => setSelectedBill(bill)} style={iconButtonStyle("neutral")}>
                            <FiEye size={16} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBill(bill._id)}
                            disabled={deletingBillId === bill._id}
                            style={{ ...iconButtonStyle("danger"), opacity: deletingBillId === bill._id ? 0.7 : 1 }}
                          >
                            <FiTrash2 size={16} />
                            {deletingBillId === bill._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalBillPages > 1 ? (
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: adminColors.muted, fontSize: "14px" }}>
                  Page {billsPage} of {totalBillPages}
                </span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setBillsPage((current) => Math.max(1, current - 1))}
                    disabled={billsPage === 1}
                    style={{ ...iconButtonStyle("neutral"), opacity: billsPage === 1 ? 0.55 : 1 }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillsPage((current) => Math.min(totalBillPages, current + 1))}
                    disabled={billsPage === totalBillPages}
                    style={{ ...iconButtonStyle("neutral"), opacity: billsPage === totalBillPages ? 0.55 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <BillDetailsDialog
        open={Boolean(selectedBill)}
        bill={selectedBill}
        onClose={() => setSelectedBill(null)}
        householdName={selectedHousehold?.name || "Household"}
      />
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  const palette = tonePalettes[tone] || tonePalettes.blue;

  return (
    <div style={{ ...adminCardStyle, padding: "22px", background: palette.background, border: `1px solid ${palette.border}` }}>
      <div style={{ color: adminColors.muted, fontSize: "13px", fontWeight: "700", marginBottom: "10px" }}>{label}</div>
      <div style={{ color: adminColors.text, fontSize: "28px", fontWeight: "800" }}>{value}</div>
    </div>
  );
}

function Message({ tone, text }) {
  const palette =
    tone === "error"
      ? { background: "#fee2e2", color: adminColors.accent }
      : tone === "success"
        ? { background: adminColors.greenSoft, color: adminColors.green }
        : { background: adminColors.blueSoft, color: adminColors.blue };

  return (
    <div style={{ padding: "14px 16px", borderRadius: "16px", background: palette.background, color: palette.color, fontWeight: "600" }}>
      {text}
    </div>
  );
}

// Table cell helpers keep the oversight table readable inside the page component.
function TableHead({ children }) {
  return <th style={{ textAlign: "left", padding: "12px 14px", color: adminColors.muted, fontSize: "13px" }}>{children}</th>;
}

function TableCell({ children, style = {} }) {
  return <td style={{ padding: "14px", color: adminColors.text, ...style }}>{children}</td>;
}

// Admin billing uses colored badges so paid, pending, and overdue states are easier to scan in long tables.
function StatusBadge({ bill }) {
  const tone = getStatusTone(bill?.status, bill?.dueDate);
  const label = tone.label.charAt(0).toUpperCase() + tone.label.slice(1);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "86px",
        padding: "6px 12px",
        borderRadius: "999px",
        background: tone.background,
        color: tone.text,
        border: `1px solid ${tone.border}`,
        fontSize: "13px",
        fontWeight: "700",
      }}
    >
      {label}
    </span>
  );
}

const labelStyle = {
  display: "grid",
  gap: "8px",
  color: adminColors.text,
  fontWeight: "700",
};

const tonePalettes = {
  green: { background: "#e8f5ed", border: "rgba(21, 128, 61, 0.4)" },
  blue: { background: "#eaf2ff", border: "rgba(29, 78, 216, 0.38)" },
  amber: { background: "#fff3df", border: "rgba(180, 83, 9, 0.4)" },
};

function toArray(value) {
  return Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
}

// Duplicate household names are easier to distinguish when the selector shows city and a short ID.
function getHouseholdOptionLabel(household) {
  const parts = [household?.name || "Household"];
  if (household?.city) parts.push(household.city);
  if (household?._id) parts.push(`ID ${String(household._id).slice(-6)}`);
  return parts.join(" | ");
}

function getUserOptionLabel(user) {
  const parts = [user?.name || "User"];
  if (user?.email) parts.push(user.email);
  return parts.join(" | ");
}

// Household responses may carry either a raw user id or a populated user object depending on the backend query.
function resolveHouseholdUserId(household) {
  if (!household?.userId) return "";
  return typeof household.userId === "object" ? household.userId._id || "" : household.userId;
}

const actionRowStyle = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const backLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: adminColors.text,
  textDecoration: "none",
  fontWeight: "700",
  fontSize: "14px",
};

const searchShellStyle = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  border: `1px solid ${adminColors.border}`,
  borderRadius: "14px",
  background: "#ffffff",
  overflow: "hidden",
};

const searchInputStyle = {
  ...adminInputStyle,
  border: "none",
  borderRadius: 0,
};

const dropdownToggleStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "100%",
  border: "none",
  borderLeft: `1px solid ${adminColors.border}`,
  background: "#ffffff",
  color: adminColors.muted,
  cursor: "pointer",
};

const optionListStyle = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  right: 0,
  zIndex: 20,
  background: "#ffffff",
  border: `1px solid ${adminColors.border}`,
  borderRadius: "14px",
  boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
  maxHeight: "360px",
  overflowY: "auto",
};

const optionButtonStyle = {
  width: "100%",
  padding: "12px 14px",
  border: "none",
  borderBottom: `1px solid ${adminColors.border}`,
  textAlign: "left",
  color: adminColors.text,
  cursor: "pointer",
  fontSize: "14px",
};

function getOptionButtonStyle(selected) {
  return {
    ...optionButtonStyle,
    background: selected ? adminColors.blueSoft : "#ffffff",
  };
}

// Give the searchable dropdown rows a clearer hover state without overriding the selected row styling.
function applyOptionHover(event, selected) {
  if (!selected) {
    event.currentTarget.style.background = "#f5f9ff";
  }
}

function clearOptionHover(event, selected) {
  event.currentTarget.style.background = selected ? adminColors.blueSoft : "#ffffff";
}

const emptyOptionStyle = {
  padding: "12px 14px",
  color: adminColors.muted,
  fontSize: "14px",
};

// View and delete share one row, but the delete action gets a danger treatment and loading state.
function iconButtonStyle(kind) {
  if (kind === "danger") {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "8px 12px",
      borderRadius: "12px",
      border: "1px solid #fecaca",
      background: "#fff1f2",
      color: "#dc2626",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "13px",
    };
  }

  return {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "12px",
    border: `1px solid ${adminColors.border}`,
    background: "#ffffff",
    color: adminColors.text,
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  };
}

const monthOptions = [
  { value: "all", label: "All Months" },
  { value: "1", label: "Jan" },
  { value: "2", label: "Feb" },
  { value: "3", label: "Mar" },
  { value: "4", label: "Apr" },
  { value: "5", label: "May" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Jul" },
  { value: "8", label: "Aug" },
  { value: "9", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const BILLS_PER_PAGE = 8;

// Admin billing can now filter by month, year, both, or neither when browsing across a user's households.
function matchesBillPeriod(bill, month, year) {
  const monthMatches = month === "all" || Number(bill.month) === Number(month);
  const yearMatches = year === "all" || Number(bill.year) === Number(year);
  return monthMatches && yearMatches;
}

function buildYearOptions(records, getYear) {
  // Collect unique years from the loaded records so the filter reflects real data instead of a fixed date range.
  const years = Array.from(
    new Set(
      records
        .map(getYear)
        .filter((value) => Number.isInteger(value))
        .map((value) => String(value))
    )
  ).sort((a, b) => Number(b) - Number(a));

  return ["all", ...years];
}

function sortBillsNewestFirst(a, b) {
  if (Number(a.year) !== Number(b.year)) {
    return Number(b.year) - Number(a.year);
  }

  if (Number(a.month) !== Number(b.month)) {
    return Number(b.month) - Number(a.month);
  }

  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

export default AdminBillingPage;
