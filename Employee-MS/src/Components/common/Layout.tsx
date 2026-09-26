import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--dashboard-bg)" }}>
      {/* Sidebar - fixed left */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
        {/* Top Navigation */}
        <Navbar />
        
        {/* Main Workspace */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
