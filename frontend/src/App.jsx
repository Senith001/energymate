import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

// Layouts & Route Guards
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminLoginPage from "./pages/auth/AdminLoginPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsagePage from "./pages/usage/AdminUsagePage";
import AdminUsageBillingPage from "./pages/usage/AdminUsageBillingPage";
import AdminBillingPage from "./pages/bill/AdminBillingPage";
import AdminTariffPage from "./pages/bill/AdminTariffPage";

// Admin Recommendation Pages
import AdminTemplates from "./pages/recommendation/AdminTemplates";

// User Pages
import UserProfile from "./pages/user/UserProfile";
import Dashboard from "./pages/user/Dashboard";

// Team Member Pages
import HouseholdPage from "./pages/HouseholdPage";
import RoomsPage from "./pages/RoomsPage";
import AppliancesPage from "./pages/AppliancesPage";
import FeedbackPage from "./pages/FeedbackPage";
import SupportTicketsPage from "./pages/SupportTicketsPage";
import UsagePage from "./pages/usage/UsagePage";
import BillingPage from "./pages/bill/BillingPage";

// Recommendation / AI Pages
import UserRecommendations from "./pages/recommendation/UserRecommendations";
import EnergyTips from "./pages/recommendation/EnergyTips";
import CostStrategies from "./pages/recommendation/CostStrategies";
import Predictions from "./pages/recommendation/Predictions";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public Auth Routes ───────────────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin-portal" element={<AdminLoginPage />} />

            {/* ── Admin Layout Routes ──────────────────── */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="usage-billing" element={<AdminUsageBillingPage />} />
              <Route path="usage-billing/usage" element={<AdminUsagePage />} />
              <Route path="usage-billing/billing" element={<AdminBillingPage />} />
              <Route path="usage-billing/tariffs" element={<AdminTariffPage />} />
              {/* Admin Recommendation Routes */}
              <Route
                path="recommendations/templates"
                element={<AdminTemplates />}
              />
            </Route>

            {/* ── Protected User Routes ─────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<UserProfile />} />

              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="households" element={<HouseholdPage />} />
                <Route path="rooms" element={<RoomsPage />} />
                <Route path="appliances" element={<AppliancesPage />} />
                <Route path="usage" element={<UsagePage />} />
                <Route path="billing" element={<BillingPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="tickets" element={<SupportTicketsPage />} />

                {/* ── Recommendation & AI Routes ─── */}
                <Route path="recommendations" element={<UserRecommendations />} />
                <Route path="energy-tips" element={<EnergyTips />} />
                <Route path="cost-strategies" element={<CostStrategies />} />
                <Route path="predictions" element={<Predictions />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
