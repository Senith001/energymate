import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";

// Auth Pages (Your new files in the subfolder)
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Team Member's Pages (Kept in their original location)
import Dashboard from "./pages/user/Dashboard";
import HouseholdPage from "./pages/HouseholdPage";
import RoomsPage from "./pages/RoomsPage";
import AppliancesPage from "./pages/AppliancesPage";
import FeedbackPage from "./pages/FeedbackPage";
import SupportTicketsPage from "./pages/SupportTicketsPage";
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
