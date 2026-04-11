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
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import SummaryPage from "./pages/auth/SummaryPage";
import LandingPage from "./pages/LandingPage";
import PostDetails from "./pages/PostDetails";
import AIHubPage from "./pages/AIHubPage";

//Admin Pages
import AdminLoginPage from "./pages/auth/AdminLoginPage";

// Admin Recommendation Pages
import AdminTemplates from "./pages/recommendation/AdminTemplates";
import AdminPosts from "./pages/admin/AdminPosts";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHouseholdPage from "./pages/admin/AdminHouseholdPage";
import AdminFeedbackPage from "./pages/admin/AdminFeedbackPage";
import AdminSupportPage from "./pages/admin/AdminSupportPage";
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


// Recommendation / AI Pages
import UserRecommendations from "./pages/recommendation/UserRecommendations";
import EnergyTips from "./pages/recommendation/EnergyTips";
import CostStrategies from "./pages/recommendation/CostStrategies";
import Predictions from "./pages/recommendation/Predictions";

function App() {
  console.log("App router mounting. Current path:", window.location.pathname);
  return (
    // We wrap the entire app in AuthProvider so every route has access to user data
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/home" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/news/:id" element={<PostDetails />} />

          {/* Protected AI Hub Route (outside MainLayout so it has its own full-page style) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/ai" element={<AIHubPage />} />
          </Route>

          {/* Admin Login Route */}
          <Route path="/admin-portal" element={<AdminLoginPage />} />

          {/* Protected Admin Layout Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="households" element={<AdminHouseholdPage />} />
            <Route path="feedback" element={<AdminFeedbackPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="usage-billing" element={<AdminUsageBillingPage />} />
            <Route path="usage-billing/usage" element={<AdminUsagePage />} />
            <Route path="usage-billing/billing" element={<AdminBillingPage />} />
            <Route path="usage-billing/tariffs" element={<AdminTariffPage />} />

            {/* Admin Recommendation Routes */}
            <Route
              path="recommendations/templates"
              element={<AdminTemplates />}
            />

            {/* Admin Public Post Routes */}
            <Route path="posts" element={<AdminPosts />} />
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

              {/* ── Recommendation & AI Routes ─── */}
              <Route path="recommendations" element={<UserRecommendations />} />
              <Route path="energy-tips" element={<EnergyTips />} />
              <Route path="cost-strategies" element={<CostStrategies />} />
              <Route path="predictions" element={<Predictions />} />
            </Route>

          </Route>







        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
