import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiChevronDown, FiTrash2 } from "react-icons/fi";
import api from "../../services/api";
import {
  adminCardStyle,
  adminColors,
  adminInputStyle,
  formatAdminCurrency,
} from "../../components/energy/adminTheme";

function AdminUsagePage() {
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
  const [day, setDay] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [appliances, setAppliances] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [entries, setEntries] = useState([]);
  const [deletingUsageId, setDeletingUsageId] = useState("");
  const [message, setMessage] = useState("");
  const [entriesPage, setEntriesPage] = useState(1);

  // Load every household once so the admin pages can stay selector-driven instead of ID-driven.
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

  // Pull the selected household's usage overview whenever the admin changes the period or household.
  useEffect(() => {
    async function loadUsageData() {
      if (!selectedHouseholdId && !selectedUserId) {
        setLoading(false);
        setSummary(null);
        setEstimate(null);
        setAppliances([]);
        setRooms([]);
        setEntries([]);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setMessage("");

        if (selectedHouseholdId) {
          const supportsAnalyticsCards = month !== "all" && year !== "all";
          const requests = [api.get(`/usage?householdId=${selectedHouseholdId}`)];

          if (supportsAnalyticsCards) {
            requests.unshift(
              api.get(`/usage/households/${selectedHouseholdId}/monthly-summary?month=${month}&year=${year}`),
              api.get(`/usage/households/${selectedHouseholdId}/estimate?month=${month}&year=${year}`),
              api.get(`/usage/households/${selectedHouseholdId}/by-appliances?month=${month}&year=${year}`),
              api.get(`/usage/households/${selectedHouseholdId}/by-rooms?month=${month}&year=${year}`)
            );
          }

          const responses = await Promise.all(requests);
          const usageResponse = responses[responses.length - 1];
          const scopedEntries = toArray(usageResponse.data?.data ?? usageResponse.data);

          if (supportsAnalyticsCards) {
            const [summaryResponse, estimateResponse, applianceResponse, roomResponse] = responses;
            setSummary(summaryResponse.data?.data || null);
            setEstimate(estimateResponse.data?.data || null);
            setAppliances(normalizeApplianceBreakdown(applianceResponse.data?.data ?? applianceResponse.data));
            setRooms(normalizeRoomBreakdown(roomResponse.data?.data ?? roomResponse.data));
          } else {
            setSummary(null);
            setEstimate(null);
            setAppliances([]);
            setRooms([]);
          }

          setEntries(scopedEntries);
        } else {
          // User-only selection rolls up recent entries across that user's households, but skips household-specific analytics cards.
          const usageResponse = await api.get("/usage");
          const selectedHouseholdIds = new Set(visibleHouseholds.map((household) => household._id));
          const scopedEntries = toArray(usageResponse.data?.data ?? usageResponse.data).filter((entry) =>
            selectedHouseholdIds.has(entry.householdId)
          );

          setSummary(null);
          setEstimate(null);
          setAppliances([]);
          setRooms([]);
          setEntries(scopedEntries);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load usage data for this household.");
      } finally {
        setLoading(false);
      }
    }

    loadUsageData();
  }, [month, selectedHouseholdId, selectedUserId, year]);

  // Reuse the selected household label across helper text and empty states.
  const selectedHousehold = households.find((item) => item._id === selectedHouseholdId);
  const selectedUser = users.find((item) => item._id === selectedUserId);
  const visibleHouseholds = selectedUserId
    ? households.filter((household) => resolveHouseholdUserId(household) === selectedUserId)
    : households;
  const householdNameMap = new Map(households.map((household) => [household._id, household.name]));

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

  function handleHouseholdSearchChange(value) {
    setHouseholdQuery(value);
    setShowHouseholdOptions(true);
    if (!value.trim()) {
      setSelectedHouseholdId("");
    }
  }

  // Selecting a household locks the page back into the household-specific analytics mode.
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

  // Changing the selected user clears any household that no longer belongs to that user.
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

  // Keep both pickers searchable, but show the full list again when they only contain the current selection label.
  const filteredUsers = users.filter((user) => {
    const selectedLabel = selectedUser ? getUserOptionLabel(selectedUser) : "";
    const searchText = userQuery.trim().toLowerCase();
    if (!searchText || userQuery === selectedLabel) return true;
    return getUserOptionLabel(user).toLowerCase().includes(searchText);
  });

  const filteredHouseholds = visibleHouseholds.filter((household) => {
    const selectedLabel = selectedHousehold ? getHouseholdOptionLabel(selectedHousehold) : "";
    const searchText = householdQuery.trim().toLowerCase();
    // When the field is just showing the selected label, opening the menu should still reveal the full household list.
    if (!searchText || householdQuery === selectedLabel) return true;
    return getHouseholdOptionLabel(household).toLowerCase().includes(searchText);
  });
  // Build the year dropdown from the records currently in scope so older years stay selectable.
  const availableYearOptions = buildYearOptions(entries, (entry) => new Date(entry.date).getFullYear());

  // Admin delete stays in this page so data-cleanup actions remain scoped to the oversight view.
  async function handleDeleteUsage(usageId) {
    const confirmed = window.confirm("Delete this usage entry permanently?");
    if (!confirmed) return;

    try {
      setDeletingUsageId(usageId);
      setError("");
      const deletedEntry = entries.find((entry) => entry._id === usageId);
      await api.delete(`/usage/${usageId}`);
      setEntries((current) => current.filter((entry) => entry._id !== usageId));
      if (selectedHouseholdId) {
        setSummary((current) =>
          current
            ? {
                ...current,
                totalUnits: Math.max(0, Number(current.totalUnits || 0) - Number(deletedEntry?.unitsUsed || 0)),
                entryCount: Math.max(0, Number(current.entryCount || 0) - 1),
              }
            : current
        );
      }
      setMessage("Usage entry deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete this usage entry.");
    } finally {
      setDeletingUsageId("");
    }
  }

  // The analytics cards only make sense when one household is selected, while user-level browsing stays table-only.
  const shouldShowUsageCards = Boolean(selectedHouseholdId && month !== "all" && year !== "all");
  const filteredTableEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.date);
    if (!matchesPeriod(entryDate, month, year)) return false;
    if (day === "all") return true;
    return entryDate.getDate() === Number(day);
  });
  const totalEntryPages = Math.max(1, Math.ceil(filteredTableEntries.length / ENTRIES_PER_PAGE));
  const visibleEntries = filteredTableEntries.slice((entriesPage - 1) * ENTRIES_PER_PAGE, entriesPage * ENTRIES_PER_PAGE);

  useEffect(() => {
    setEntriesPage(1);
  }, [selectedUserId, selectedHouseholdId, month, year, day]);

  useEffect(() => {
    // Reset an out-of-range year filter after the available records change.
    if (year !== "all" && !availableYearOptions.includes(String(year))) {
      setYear("all");
    }
  }, [availableYearOptions, year]);

  useEffect(() => {
    if (entriesPage > totalEntryPages) {
      setEntriesPage(totalEntryPages);
    }
  }, [entriesPage, totalEntryPages]);

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "grid", gap: "8px" }}>
        <div>
          <Link to="/admin/usage-billing" style={backLinkStyle}>
            <FiArrowLeft size={16} />
            Back
          </Link>
        </div>
        <h1 style={{ margin: 0, color: adminColors.text, fontSize: "32px", fontWeight: "700", lineHeight: 1.2 }}>Usage Monitoring</h1>
        <p style={{ margin: 0, color: adminColors.muted }}>
          Review monthly household usage, estimated cost, and appliance or room breakdowns from the admin portal.
        </p>
      </div>

      <div style={{ ...adminCardStyle, padding: "24px", display: "grid", gap: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1.1fr) minmax(240px, 1.4fr) repeat(3, minmax(110px, 130px))", gap: "14px", alignItems: "end" }}>
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
            Date
            <select style={adminInputStyle} value={day} onChange={(event) => setDay(event.target.value)}>
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
        {loading ? <Message tone="info" text="Loading usage analytics..." /> : null}
      </div>

      {shouldShowUsageCards ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "18px" }}>
            <MetricCard label="Monthly Usage" value={`${Number(summary?.totalUnits || 0).toFixed(1)} kWh`} tone="amber" />
            <MetricCard
              label="Estimated Cost"
              // The estimate endpoint returns the same cost summary shape as billing, so the final amount lives in totalCost.
              value={formatAdminCurrency(estimate?.totalCost || 0)}
              tone="blue"
            />
            <MetricCard label="Entries Recorded" value={String(summary?.entryCount || entries.length || 0)} tone="green" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
            <BreakdownCard
              title="Usage by Appliance"
              items={appliances}
              emptyText={selectedHousehold ? "No appliance usage data is available for this period." : "Select a household to view appliance breakdowns."}
            />
            <BreakdownCard
              title="Usage by Room"
              items={rooms}
              emptyText={selectedHousehold ? "No room usage data is available for this period." : "Select a household to view room breakdowns."}
            />
          </div>
        </>
      ) : null}

      <div style={{ ...adminCardStyle, padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, color: adminColors.text, fontWeight: "700", fontSize: "20px" }}>Recent Usage Entries</h3>
          <span style={{ color: adminColors.muted, fontSize: "14px" }}>
            {selectedHousehold ? "Latest records for the selected household" : selectedUser ? "Recent records across the selected user's households" : "Select a user or household to inspect usage"}
          </span>
        </div>

        {filteredTableEntries.length === 0 ? (
          <Message
            tone="info"
            text={
              day !== "all"
                ? "No usage entries match the selected day."
                : selectedHousehold
                  ? "No usage entries found for this household yet."
                  : selectedUser
                    ? "No usage entries match the selected filters for this user's households."
                    : "Select a user or household to inspect recent usage entries."
            }
          />
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${adminColors.border}` }}>
                  <TableHead>Date</TableHead>
                  {!selectedHouseholdId ? <TableHead>Household</TableHead> : null}
                  <TableHead>Type</TableHead>
                  <TableHead>Units</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => (
                  <tr key={entry._id} style={{ borderBottom: `1px solid ${adminColors.border}` }}>
                    <TableCell>{new Date(entry.date).toLocaleDateString("en-US")}</TableCell>
                    {!selectedHouseholdId ? <TableCell>{householdNameMap.get(entry.householdId) || "-"}</TableCell> : null}
                    <TableCell>
                      <EntryTypeBadge entryType={entry.entryType} />
                    </TableCell>
                    <TableCell>{Number(entry.unitsUsed || 0).toFixed(1)}</TableCell>
                    <TableCell>{entry.previousReading ?? "-"}</TableCell>
                    <TableCell>{entry.currentReading ?? "-"}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleDeleteUsage(entry._id)}
                        disabled={deletingUsageId === entry._id}
                        style={{ ...usageActionButtonStyle("danger"), opacity: deletingUsageId === entry._id ? 0.7 : 1 }}
                      >
                        <FiTrash2 size={16} />
                        {deletingUsageId === entry._id ? "Deleting..." : "Delete"}
                      </button>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
            {totalEntryPages > 1 ? (
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ color: adminColors.muted, fontSize: "14px" }}>
                  Page {entriesPage} of {totalEntryPages}
                </span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setEntriesPage((current) => Math.max(1, current - 1))}
                    disabled={entriesPage === 1}
                    style={{ ...usageActionButtonStyle("neutral"), opacity: entriesPage === 1 ? 0.55 : 1 }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntriesPage((current) => Math.min(totalEntryPages, current + 1))}
                    disabled={entriesPage === totalEntryPages}
                    style={{ ...usageActionButtonStyle("neutral"), opacity: entriesPage === totalEntryPages ? 0.55 : 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
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

// Reuse the same card shell for both appliance and room breakdown lists.
function BreakdownCard({ title, items, emptyText }) {
  return (
    <div style={{ ...adminCardStyle, padding: "24px", display: "grid", gap: "16px" }}>
      <h3 style={{ margin: 0, color: adminColors.text, fontWeight: "700", fontSize: "20px" }}>{title}</h3>
      {items.length === 0 ? (
        <Message tone="info" text={emptyText} />
      ) : (
        items.slice(0, 6).map((item) => (
          <div
            key={item.name}
            style={{
              display: "grid",
              gap: "6px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
              <strong style={{ color: adminColors.text }}>{item.name}</strong>
              <strong style={{ color: adminColors.text }}>{Number(item.allocatedUsage || 0).toFixed(1)} kWh</strong>
            </div>
            <div style={{ color: adminColors.muted, fontSize: "13px" }}>
              {Number(item.percentage || 0).toFixed(1)}% of the selected month
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Message({ tone, text }) {
  const palette =
    tone === "error"
      ? { background: adminColors.accentSoft, color: adminColors.accent }
      : tone === "success"
        ? { background: adminColors.greenSoft, color: adminColors.green }
        : { background: adminColors.blueSoft, color: adminColors.blue };

  return (
    <div style={{ padding: "14px 16px", borderRadius: "16px", background: palette.background, color: palette.color, fontWeight: "600" }}>
      {text}
    </div>
  );
}

// Small table helpers keep the usage page JSX easier to scan once the admin table grows.
function TableHead({ children }) {
  return <th style={{ textAlign: "left", padding: "12px 14px", color: adminColors.muted, fontSize: "13px" }}>{children}</th>;
}

function TableCell({ children, style = {} }) {
  return <td style={{ padding: "14px", color: adminColors.text, ...style }}>{children}</td>;
}

// Match the customer-side usage table so meter and manual entries read consistently across both views.
function EntryTypeBadge({ entryType }) {
  const isMeter = entryType === "meter";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 12px",
        borderRadius: "999px",
        background: isMeter ? "#eaf6ef" : "#eef2f6",
        color: isMeter ? "#2a8c5f" : adminColors.text,
        fontSize: "13px",
        fontWeight: "700",
        textTransform: "lowercase",
      }}
    >
      {entryType}
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
  green: { background: adminColors.greenSoft, border: "rgba(21, 128, 61, 0.4)" },
  blue: { background: adminColors.blueSoft, border: "rgba(29, 78, 216, 0.38)" },
  amber: { background: adminColors.amberSoft, border: "rgba(180, 83, 9, 0.4)" },
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

function usageActionButtonStyle(kind) {
  if (kind === "neutral") {
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

const dayOptions = [
  { value: "all", label: "All Dates" },
  ...Array.from({ length: 31 }, (_, index) => ({
    value: String(index + 1),
    label: String(index + 1),
  })),
];
const ENTRIES_PER_PAGE = 8;

function toArray(value) {
  return Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
}

// Admin selectors need a searchable label that stays unique even when households share the same name.
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

// Household lookups may come back with either a raw owner id or a populated user object.
function resolveHouseholdUserId(household) {
  if (!household?.userId) return "";
  return typeof household.userId === "object" ? household.userId._id || "" : household.userId;
}

// Month and year can now be left open-ended, so table-style filtering needs to handle "all" values too.
function matchesPeriod(date, month, year) {
  const monthMatches = month === "all" || date.getMonth() + 1 === Number(month);
  const yearMatches = year === "all" || date.getFullYear() === Number(year);
  return monthMatches && yearMatches;
}

function normalizeApplianceBreakdown(value) {
  const breakdown = Array.isArray(value?.breakdown) ? value.breakdown : [];
  const totalUnits = Number(value?.totalUnits || 0);

  return breakdown.map((item) => ({
    name: item.name,
    allocatedUsage: Number(item.allocatedUsage || 0),
    percentage: totalUnits > 0 ? (Number(item.allocatedUsage || 0) / totalUnits) * 100 : 0,
  }));
}

function normalizeRoomBreakdown(value) {
  const breakdown = Array.isArray(value?.breakdown) ? value.breakdown : [];
  const totalUnits = Number(value?.totalUnits || 0);

  return breakdown.map((item) => ({
    name: item.roomName,
    allocatedUsage: Number(item.allocatedUsage || 0),
    percentage: totalUnits > 0 ? (Number(item.allocatedUsage || 0) / totalUnits) * 100 : 0,
  }));
}

// Build year filters from the records that actually exist in the current admin scope.
function buildYearOptions(records, getYear) {
  // Extract distinct years from the current record set, sort newest first, and prepend the open-ended option.
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

export default AdminUsagePage;
