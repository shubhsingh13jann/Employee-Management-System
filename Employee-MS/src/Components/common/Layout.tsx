import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--dashboard-bg)" }}>
      {/* Sidebar - fixed left */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        {/* Top Navigation - Strictly Pinned at Top */}
        <div className="shrink-0 z-30">
          <Navbar />
        </div>
        
        {/* Main Workspace - Scrollable */}
        <main className="p-6 lg:p-8 flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
