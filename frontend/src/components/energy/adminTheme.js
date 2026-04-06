export const adminColors = {
  page: "#f4f5f7",
  surface: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  accent: "#991b1b",
  accentSoft: "#fee2e2",
  green: "#15803d",
  greenSoft: "#e8f5ed",
  blue: "#1d4ed8",
  blueSoft: "#eaf2ff",
  amber: "#b45309",
  amberSoft: "#fff3df",
};

export const adminCardStyle = {
  background: adminColors.surface,
  border: `1px solid ${adminColors.border}`,
  borderRadius: "24px",
  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.06)",
};

// Keep admin inputs visually aligned with the rest of the dashboard controls.
export const adminInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "14px",
  border: `1px solid ${adminColors.border}`,
  background: "#ffffff",
  color: adminColors.text,
  fontSize: "14px",
  boxSizing: "border-box",
};

// Reuse the same primary and secondary button language across the admin pages.
export function adminButtonStyle(kind = "primary") {
  if (kind === "secondary") {
    return {
      padding: "11px 16px",
      borderRadius: "14px",
      border: `1px solid ${adminColors.border}`,
      background: "#ffffff",
      color: adminColors.text,
      fontWeight: "700",
      cursor: "pointer",
    };
  }

  return {
    padding: "11px 16px",
    borderRadius: "14px",
    border: "none",
    background: adminColors.accent,
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  };
}

// Billing values in admin pages follow the same LKR formatting as the user dashboard.
export function formatAdminCurrency(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

// Shared month formatting keeps admin billing tables and cards consistent.
export function formatAdminMonth(month, year) {
  if (!month || !year) return "-";
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}
