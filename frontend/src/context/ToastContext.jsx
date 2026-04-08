import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

const ToastContext = createContext(null);

const ICONS = {
  success: <FiCheckCircle className="w-5 h-5 flex-shrink-0" />,
  error: <FiXCircle className="w-5 h-5 flex-shrink-0" />,
  warning: <FiAlertCircle className="w-5 h-5 flex-shrink-0" />,
  info: <FiInfo className="w-5 h-5 flex-shrink-0" />,
};

const STYLES = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const ICON_STYLES = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-yellow-500",
  info: "text-blue-500",
};

function Toast({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  const handleRemove = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const timer = setTimeout(handleRemove, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [handleRemove, toast.duration]);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-full
        ${STYLES[toast.type] || STYLES.info}
        ${exiting ? "toast-exit" : "toast-enter"}`}
    >
      <span className={ICON_STYLES[toast.type] || ICON_STYLES.info}>
        {ICONS[toast.type] || ICONS.info}
      </span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-semibold text-sm leading-tight mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm leading-snug opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={handleRemove}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <FiX className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", options = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [
      ...prev,
      { id, message, type, ...options },
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, opts) => addToast(message, "success", opts),
    error: (message, opts) => addToast(message, "error", opts),
    warning: (message, opts) => addToast(message, "warning", opts),
    info: (message, opts) => addToast(message, "info", opts),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
