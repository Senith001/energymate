import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts & Route Guards
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages (Your new files in the subfolder)
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import VerifyOtpPage from "./pages/auth/VerifyOtpPage";

//Admin Pages
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement"; // ✅ Imported User Management
import AdminUsagePage from "./pages/usage/AdminUsagePage";
import AdminUsageBillingPage from "./pages/usage/AdminUsageBillingPage";
import AdminBillingPage from "./pages/bill/AdminBillingPage";
import AdminTariffPage from "./pages/bill/AdminTariffPage";

//User Pages
import UserProfile from "./pages/user/UserProfile";

// Team Member's Pages (Kept in their original location)
import Dashboard from "./pages/user/Dashboard";
import HouseholdPage from "./pages/household/HouseholdPage";
import RoomsPage from "./pages/household/RoomsPage";
import AppliancesPage from "./pages/household/AppliancesPage";
import FeedbackPage from "./pages/feedback & support/FeedbackPage";
import SupportTicketsPage from "./pages/feedback & support/SupportTicketsPage";
import UsagePage from "./pages/usage/UsagePage";
import BillingPage from "./pages/bill/BillingPage";

function App() {
  return (
    // We wrap the entire app in AuthProvider so every route has access to user data
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/summary" element={<SummaryPage />} />

          {/* Admin Login Route */}
          <Route path="/admin-portal" element={<AdminLoginPage />} />

          {/* 🔴 SECURE ADMIN ROUTES (Nested inside AdminLayout) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} /> {/* ✅ Added User Management Route */}
            <Route path="usage-billing" element={<AdminUsageBillingPage />} />
            <Route path="usage-billing/usage" element={<AdminUsagePage />} />
            <Route path="usage-billing/billing" element={<AdminBillingPage />} />
            <Route path="usage-billing/tariffs" element={<AdminTariffPage />} />
          </Route>

          {/* 🔵 SECURE USER ROUTES (Wrapped in ProtectedRoute) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<UserProfile />} />

            {/* Protected Main Layout Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="households" element={<HouseholdPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="appliances" element={<AppliancesPage />} />
              <Route path="usage" element={<UsagePage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="tickets" element={<SupportTicketsPage />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;