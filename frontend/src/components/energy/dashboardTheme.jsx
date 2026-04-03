import React from "react";

export const colors = {
  background: "#f4f6f8",
  panel: "#ffffff",
  border: "#d9e1ea",
  text: "#0f172a",
  muted: "#667085",
  green: "#2a8c5f",
  greenSoft: "#eaf6ef",
  amber: "#f5b521",
  amberSoft: "#fff5db",
  blue: "#4f8df7",
  blueSoft: "#eaf1ff",
  red: "#ef4444",
  redSoft: "#fdecec",
  slateSoft: "#eef2f6",
};

export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const cardStyle = {
  background: colors.panel,
  borderRadius: "22px",
  border: `1px solid ${colors.border}`,
  boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
};

export function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

export function formatMonthYear(month, year) {
  return `${monthNames[(month || 1) - 1]} ${year}`;
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getStatusTone(status, dueDate) {
  if (status === "paid") {
    return {
      label: "paid",
      text: colors.green,
      background: colors.greenSoft,
      border: "rgba(42, 140, 95, 0.2)",
    };
  }

  const isOverdue = dueDate && new Date(dueDate) < new Date();
  if (isOverdue) {
    return {
      label: "overdue",
      text: colors.red,
      background: colors.redSoft,
      border: "rgba(239, 68, 68, 0.2)",
    };
  }

  return {
    label: "pending",
    text: colors.amber,
    background: colors.amberSoft,
    border: "rgba(245, 181, 33, 0.2)",
  };
}

export function Icon({ name, color = colors.text, size = 18, stroke = 2 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "zap") {
    return (
      <svg {...common}>
        <path d="M13 2 6 13h5l-1 9 7-11h-5l1-9Z" />
      </svg>
    );
  }

  if (name === "bill") {
    return (
      <svg {...common}>
        <path d="M7 3h10v18l-2-1-3 1-3-1-2 1Z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </svg>
    );
  }

  if (name === "thermo") {
    return (
      <svg {...common}>
        <path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" />
      </svg>
    );
  }

  if (name === "trend-up") {
    return (
      <svg {...common}>
        <path d="m4 15 6-6 4 4 6-7" />
        <path d="M14 6h6v6" />
      </svg>
    );
  }

  if (name === "cloud") {
    return (
      <svg {...common}>
        <path d="M6 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 5.2 9.2 4.5 4.5 0 0 0 6 18Z" />
        <path d="M17 5v2M21 9h-2M18.8 6.2l-1.4 1.4" />
      </svg>
    );
  }

  if (name === "drop") {
    return (
      <svg {...common}>
        <path d="M12 3c3.2 4.1 5 7 5 9.5A5 5 0 0 1 7 12.5C7 10 8.8 7.1 12 3Z" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...common}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "refresh") {
    return (
      <svg {...common}>
        <path d="M20 6v6h-6" />
        <path d="M20 12a8 8 0 1 1-2.34-5.66L20 8" />
      </svg>
    );
  }

  if (name === "eye") {
    return (
      <svg {...common}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...common}>
        <path d="m4 20 4.5-1 9.5-9.5-3.5-3.5L5 15.5 4 20Z" />
        <path d="M13.5 6l3.5 3.5" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...common}>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

