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
        return <span className="badge bg-warning text-dark border border-warning" style={{ fontSize: "0.7rem" }}>👑 HR Super Admin</span>;
      case "manager":
        return <span className="badge bg-primary border border-primary" style={{ fontSize: "0.7rem" }}>👔 Manager</span>;
      case "supervisor":
        return <span className="badge bg-success border border-success" style={{ fontSize: "0.7rem" }}>👷 Supervisor</span>;
      case "employee":
        return <span className="badge bg-info text-dark border border-info" style={{ fontSize: "0.7rem" }}>💼 Employee</span>;
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
                <i className="bi bi-grid-1x2-fill fs-6"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/admin/departments" className={linkClass}>
                <i className="bi bi-buildings-fill fs-6"></i>
                <span>Departments</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/admin/users" className={linkClass}>
                <i className="bi bi-people-fill fs-6"></i>
                <span>User Directory</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/admin/hierarchy" className={linkClass}>
                <i className="bi bi-diagram-3-fill fs-6"></i>
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
                <i className="bi bi-grid-1x2-fill fs-6"></i>
                <span>Manager Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/manager/projects" className={linkClass}>
                <i className="bi bi-kanban-fill fs-6"></i>
                <span>Projects & Milestones</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/manager/supervisors" className={linkClass}>
                <i className="bi bi-person-badge-fill fs-6"></i>
                <span>Dept Supervisors</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/manager/leaves" className={linkClass}>
                <i className="bi bi-calendar-check-fill fs-6"></i>
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
                <i className="bi bi-grid-1x2-fill fs-6"></i>
                <span>Team Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/supervisor/team" className={linkClass}>
                <i className="bi bi-people-fill fs-6"></i>
                <span>Assigned Team</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/supervisor/tasks" className={linkClass}>
                <i className="bi bi-list-check fs-6"></i>
                <span>Task Delegation</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/supervisor/leaves" className={linkClass}>
                <i className="bi bi-calendar-plus-fill fs-6"></i>
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
                <i className="bi bi-grid-1x2-fill fs-6"></i>
                <span>My Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/employee/tasks" className={linkClass}>
                <i className="bi bi-card-checklist fs-6"></i>
                <span>My Tasks</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/employee/leaves" className={linkClass}>
                <i className="bi bi-calendar-event-fill fs-6"></i>
                <span>Apply / Track Leave</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/employee/profile" className={linkClass}>
                <i className="bi bi-person-circle fs-6"></i>
                <span>My Profile</span>
              </NavLink>
            </li>
          </>
        );

      default:
        return null;
    }
  };

      return ( <aside className="sidebar-container text-white d-flex flex-column p-3 vh-100 position-sticky top-0 shadow-lg" style={{ width: "250px", minWidth: "250px", zIndex: 1000, fontSize: "0.9rem" }}>
      {/* Brand Header */}
      <div className="pb-3 mb-3 border-bottom border-secondary border-opacity-25">
        <BrandLogo
          theme="dark"
          size="sm"
          to={getDefaultRouteForRole ? getDefaultRouteForRole(user?.role) : "/"}
        />
      </div>

      {/* User Chip */}
      <div className="bg-white bg-opacity-10 border border-white border-opacity-10 rounded-4 p-2 mb-3 d-flex align-items-center gap-2 shadow-sm">
        <div className="sidebar-active-gradient rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: "36px", height: "36px", background: "var(--sidebar-active-gradient)", fontSize: "14px" }}>
          {user?.name?.charAt(0) || "U"}
        </div>
        <div className="overflow-hidden">
          <p className="mb-0 fw-bold text-truncate text-white" style={{ fontSize: "13px" }}>{user?.name || "User"}</p>
          <div className="d-flex align-items-center mt-1">{getRoleBadge(user?.role)}</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <ul className="nav nav-pills flex-column mb-auto sidebar-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}>
        {renderNavLinks()}
      </ul>

      {/* Bottom Actions */}
      <div className="pt-4 mt-auto">
        <div className="d-flex align-items-center gap-2 mb-3 px-2">
          <span className="badge bg-success p-1 rounded-circle"></span>
          <small className="text-secondary fw-medium" style={{ fontSize: "11px" }}>System Status: Operational</small>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2 rounded-3 fw-semibold border-opacity-50"
          style={{ transition: "all 0.2s ease" }}
        >
          <i className="bi bi-box-arrow-right fs-6"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
