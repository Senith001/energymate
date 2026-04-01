import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import HouseholdPage from "./pages/HouseholdPage";
import RoomsPage from "./pages/RoomsPage";
import AppliancesPage from "./pages/AppliancesPage";
import FeedbackPage from "./pages/FeedbackPage";
import SupportTicketsPage from "./pages/SupportTicketsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="households" element={<HouseholdPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="appliances" element={<AppliancesPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
          <Route path="tickets" element={<SupportTicketsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;