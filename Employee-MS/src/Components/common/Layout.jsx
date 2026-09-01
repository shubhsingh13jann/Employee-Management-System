import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/admin/dashboard")) return "HR Super Admin Command Center";
    if (path.includes("/admin/departments")) return "Department Management";
    if (path.includes("/admin/users")) return "User & Workforce Directory";
    if (path.includes("/admin/hierarchy")) return "Team Hierarchy & Mapping Matrix";

    if (path.includes("/manager/dashboard")) return "Department Manager Command Center";
    if (path.includes("/manager/projects")) return "Project Milestones & Allocation";
    if (path.includes("/manager/supervisors")) return "Department Supervisors";
    if (path.includes("/manager/leaves")) return "Tier-2 Escalated Leave Review";

    if (path.includes("/supervisor/dashboard")) return "Operational Team Dashboard";
    if (path.includes("/supervisor/team")) return "Direct Subordinates Directory";
    if (path.includes("/supervisor/tasks")) return "Task Delegation & Sprint Kanban";
    if (path.includes("/supervisor/leaves")) return "Tier-1 Routine Leave Review";

    if (path.includes("/employee/dashboard")) return "Employee Workspace Dashboard";
    if (path.includes("/employee/tasks")) return "My Assigned Tasks & Queue";
    if (path.includes("/employee/leaves")) return "Leave Application & Approvals Tracker";
    if (path.includes("/employee/profile")) return "Employee Profile & Details";

    return "Enterprise EMS Portal";
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1 overflow-x-hidden">
        <Navbar title={getPageTitle()} />
        <main className="p-4 flex-grow-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
