import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "./BrandLogo";

const Sidebar = () => {
  const { user, logout, getDefaultRouteForRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">👑 HR Super Admin</span>;
      case "manager":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">👔 Manager</span>;
      case "supervisor":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">👷 Supervisor</span>;
      case "employee":
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">💼 Employee</span>;
      default:
        return null;
    }
  };

  const linkClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 sidebar-nav-link fw-medium ${isActive ? "active" : ""}`;

  const renderNavLinks = () => {
    switch (user?.role) {
      case "admin":
        return (
          <>
            <li className="nav-item mb-2">
              <NavLink to="/admin/dashboard" end className={linkClass}>
                <i className="bi bi-grid-1x2-fill text-base"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/admin/departments" className={linkClass}>
                <i className="bi bi-buildings-fill text-base"></i>
                <span>Departments</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/admin/users" className={linkClass}>
                <i className="bi bi-people-fill text-base"></i>
                <span>User Directory</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/admin/hierarchy" className={linkClass}>
                <i className="bi bi-diagram-3-fill text-base"></i>
                <span>Team Hierarchy</span>
              </NavLink>
            </li>
          </>
        );

      case "manager":
        return (
          <>
            <li className="nav-item mb-2">
              <NavLink to="/manager/dashboard" end className={linkClass}>
                <i className="bi bi-grid-1x2-fill text-base"></i>
                <span>Manager Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/manager/projects" className={linkClass}>
                <i className="bi bi-kanban-fill text-base"></i>
                <span>Projects & Milestones</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/manager/supervisors" className={linkClass}>
                <i className="bi bi-person-badge-fill text-base"></i>
                <span>Dept Supervisors</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/manager/leaves" className={linkClass}>
                <i className="bi bi-calendar-check-fill text-base"></i>
                <span>Escalated Leaves</span>
              </NavLink>
            </li>
          </>
        );

      case "supervisor":
        return (
          <>
            <li className="nav-item mb-2">
              <NavLink to="/supervisor/dashboard" end className={linkClass}>
                <i className="bi bi-grid-1x2-fill text-base"></i>
                <span>Team Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/supervisor/team" className={linkClass}>
                <i className="bi bi-people-fill text-base"></i>
                <span>Assigned Team</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/supervisor/tasks" className={linkClass}>
                <i className="bi bi-list-check text-base"></i>
                <span>Task Delegation</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/supervisor/leaves" className={linkClass}>
                <i className="bi bi-calendar-plus-fill text-base"></i>
                <span>Routine Leaves</span>
              </NavLink>
            </li>
          </>
        );

      case "employee":
        return (
          <>
            <li className="nav-item mb-2">
              <NavLink to="/employee/dashboard" end className={linkClass}>
                <i className="bi bi-grid-1x2-fill text-base"></i>
                <span>My Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/employee/tasks" className={linkClass}>
                <i className="bi bi-card-checklist text-base"></i>
                <span>My Tasks</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/employee/leaves" className={linkClass}>
                <i className="bi bi-calendar-event-fill text-base"></i>
                <span>Apply / Track Leave</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/employee/profile" className={linkClass}>
                <i className="bi bi-person-circle text-base"></i>
                <span>My Profile</span>
              </NavLink>
            </li>
          </>
        );

      default:
        return null;
    }
  };

      return ( <aside className="sidebar-container text-white flex flex-col p-6 h-screen sticky top-0 shadow-lg" style={{ width: "250px", minWidth: "250px", zIndex: 1000, fontSize: "0.9rem" }}>
      {/* Brand Header */}
      <div className="pb-6 mb-6 border-b border-gray-200 border-secondary border-opacity-25">
        <BrandLogo
          theme="dark"
          size="sm"
          to={getDefaultRouteForRole ? getDefaultRouteForRole(user?.role) : "/"}
        />
      </div>

      {/* User Chip */}
      <div className="bg-white bg-opacity-10 border border-gray-200 border-gray-200 border-white border-opacity-10 rounded-xl p-2 mb-6 flex items-center gap-2 shadow-sm">
        <div className="sidebar-active-gradient rounded-full text-white flex items-center justify-center font-bold shadow-sm" style={{ width: "36px", height: "36px", background: "var(--sidebar-active-gradient)", fontSize: "14px" }}>
          {user?.name?.charAt(0) || "U"}
        </div>
        <div className="overflow-hidden">
          <p className="mb-0 font-bold text-truncate text-white" style={{ fontSize: "13px" }}>{user?.name || "User"}</p>
          <div className="flex items-center mt-1">{getRoleBadge(user?.role)}</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <ul className="nav nav-pills flex-col mb-auto sidebar-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
        {renderNavLinks()}
      </ul>

      {/* Bottom Actions */}
      <div className="pt-4 mt-auto">
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <small className="text-slate-400 font-medium text-[11px]">System Status: Operational</small>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 transition-all duration-200 cursor-pointer shadow-sm"
        >
          <i className="bi bi-box-arrow-right text-base"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
