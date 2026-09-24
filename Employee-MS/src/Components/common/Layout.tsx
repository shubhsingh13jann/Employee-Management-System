import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: "var(--dashboard-bg)" }}>
      {/* Sidebar - fixed left */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="d-flex flex-column flex-grow-1 overflow-x-hidden">
        {/* Top Navigation */}
        <Navbar />
        
        {/* Main Workspace */}
        <main className="p-3 p-md-4 flex-grow-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
