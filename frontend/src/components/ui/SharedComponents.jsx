import React from "react";

/**
 * LoadingSpinner — centered full-page or inline spinner
 * Props: size ("sm"|"md"|"lg"), fullPage (bool), text (string)
 */
export function LoadingSpinner({ size = "md", fullPage = false, text }) {
  const sizeMap = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} rounded-full border-blue-200 border-t-blue-600 animate-spin`}
      />
      {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * EmptyState — friendly empty state with icon and optional action
 */
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm mb-5 max-w-xs">{description}</p>}
      {action && action}
    </div>
  );
}

/**
 * ErrorState — error display with retry option
 */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-3xl mb-4">
        ⚠️
      </div>
      <h3 className="text-lg font-semibold text-red-700 mb-1">Something went wrong</h3>
      <p className="text-gray-500 text-sm mb-5 max-w-xs">{message || "An unexpected error occurred."}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * PageHeader — consistent page header with title, subtitle, and optional actions
 */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-3 flex-shrink-0">{children}</div>}
    </div>
  );
}

/**
 * Modal — generic modal wrapper with backdrop
 */
export function Modal({ isOpen, onClose, title, size = "md", children }) {
  if (!isOpen) return null;

  const sizeMap = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizeMap[size]} max-h-[90vh] flex flex-col fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * PriorityBadge — colored badge for priority levels
 */
export function PriorityBadge({ priority }) {
  const map = {
    high: "bg-red-50 text-red-600 border border-red-200",
    medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    low: "bg-green-50 text-green-700 border border-green-200",
  };
  const label = priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "—";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        map[priority?.toLowerCase()] || "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </span>
  );
}

/**
 * CategoryBadge — colored badge for categories
 */
export function CategoryBadge({ category }) {
  const map = {
    lighting: "bg-yellow-100 text-yellow-700",
    appliances: "bg-blue-100 text-blue-700",
    hvac: "bg-cyan-100 text-cyan-700",
    "water heating": "bg-orange-100 text-orange-700",
    insulation: "bg-purple-100 text-purple-700",
    solar: "bg-green-100 text-green-700",
    behavior: "bg-pink-100 text-pink-700",
    general: "bg-gray-100 text-gray-700",
  };

  const key = category?.toLowerCase() || "";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        map[key] || "bg-gray-100 text-gray-600"
      }`}
    >
      {category || "General"}
    </span>
  );
}

/**
 * Toggle — styled toggle switch
 */
export function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${checked ? "bg-green-500" : "bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
          ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
