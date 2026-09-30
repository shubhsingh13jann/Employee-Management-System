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
    `nav-link d-flex align-items-center gap-2 px-2.5 py-1.5 rounded-lg sidebar-nav-link text-xs font-medium transition-all ${isActive ? "active" : ""}`;

  const renderNavLinks = () => {
    switch (user?.role) {
      case "admin":
        return (
          <>
            <li className="nav-item mb-1">
              <NavLink to="/admin/dashboard" end className={linkClass}>
                <i className="bi bi-grid-1x2-fill text-sm"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/admin/departments" className={linkClass}>
                <i className="bi bi-buildings-fill text-sm"></i>
                <span>Departments</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/admin/users" className={linkClass}>
                <i className="bi bi-people-fill text-sm"></i>
                <span>User Directory</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/admin/hierarchy" className={linkClass}>
                <i className="bi bi-diagram-3-fill text-sm"></i>
                <span>Team Hierarchy</span>
              </NavLink>
            </li>
          </>
        );

      case "manager":
        return (
          <>
            <li className="nav-item mb-1">
              <NavLink to="/manager/dashboard" end className={linkClass}>
                <i className="bi bi-grid-1x2-fill text-sm"></i>
                <span>Manager Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/manager/projects" className={linkClass}>
                <i className="bi bi-kanban-fill text-sm"></i>
                <span>Projects & Milestones</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/manager/supervisors" className={linkClass}>
                <i className="bi bi-person-badge-fill text-sm"></i>
                <span>Dept Supervisors</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/manager/leaves" className={linkClass}>
                <i className="bi bi-calendar-check-fill text-sm"></i>
                <span>Escalated Leaves</span>
              </NavLink>
            </li>
          </>
        );

      case "supervisor":
        return (
          <>
            <li className="nav-item mb-1">
              <NavLink to="/supervisor/dashboard" end className={linkClass}>
                <i className="bi bi-grid-1x2-fill text-sm"></i>
                <span>Team Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/supervisor/team" className={linkClass}>
                <i className="bi bi-people-fill text-sm"></i>
                <span>Assigned Team</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/supervisor/tasks" className={linkClass}>
                <i className="bi bi-list-check text-sm"></i>
                <span>Task Delegation</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/supervisor/leaves" className={linkClass}>
                <i className="bi bi-calendar-plus-fill text-sm"></i>
                <span>Routine Leaves</span>
              </NavLink>
            </li>
          </>
        );

      case "employee":
        return (
          <>
            <li className="nav-item mb-1">
              <NavLink to="/employee/dashboard" end className={linkClass}>
                <i className="bi bi-grid-1x2-fill text-sm"></i>
                <span>My Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/employee/tasks" className={linkClass}>
                <i className="bi bi-card-checklist text-sm"></i>
                <span>My Tasks</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/employee/leaves" className={linkClass}>
                <i className="bi bi-calendar-event-fill text-sm"></i>
                <span>Apply / Track Leave</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/employee/profile" className={linkClass}>
                <i className="bi bi-person-circle text-sm"></i>
                <span>My Profile</span>
              </NavLink>
            </li>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="sidebar-container text-white flex flex-col px-3.5 py-4 h-screen sticky top-0 shadow-lg" style={{ width: "240px", minWidth: "240px", zIndex: 1000, fontSize: "0.82rem" }}>
      {/* Brand Header */}
      <div className="pb-3.5 mb-3.5 border-b border-white/10">
        <BrandLogo
          theme="dark"
          size="sm"
          to={getDefaultRouteForRole ? getDefaultRouteForRole(user?.role) : "/"}
        />
      </div>

      {/* User Chip */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-2 mb-3.5 flex items-center gap-2.5 shadow-xs">
        <div className="sidebar-active-gradient rounded-full text-white flex items-center justify-center font-bold shadow-sm" style={{ width: "32px", height: "32px", background: "var(--sidebar-active-gradient)", fontSize: "13px" }}>
          {user?.name?.charAt(0) || "U"}
        </div>
        <div className="overflow-hidden">
          <p className="mb-0 font-bold text-truncate text-white" style={{ fontSize: "12px" }}>{user?.name || "User"}</p>
          <div className="flex items-center mt-0.5">{getRoleBadge(user?.role)}</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <ul className="nav nav-pills flex-col mb-auto sidebar-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 230px)" }}>
        {renderNavLinks()}
      </ul>

      {/* Bottom Actions */}
      <div className="pt-3 mt-auto border-t border-white/10">
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <small className="text-slate-400 font-medium text-[10.5px]">System Status: Operational</small>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-600 transition-all duration-200 cursor-pointer shadow-xs"
        >
          <i className="bi bi-box-arrow-right text-sm"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
