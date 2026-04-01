import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function MainLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          padding: "30px",
          boxSizing: "border-box",
          overflowX: "auto",
        }}
      >
        <Navbar />
        <Outlet />
      </div>
    </div>
  );
}

export default MainLayout;