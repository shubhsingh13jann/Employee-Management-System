import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <span className="badge bg-danger">👑 HR Admin</span>;
      case "manager":
        return <span className="badge bg-primary">👔 Manager</span>;
      case "supervisor":
        return <span className="badge bg-success">👷 Supervisor</span>;
      case "employee":
        return <span className="badge bg-info text-dark">💼 Employee</span>;
      default:
        return null;
    }
  };

  const renderNavLinks = () => {
    switch (user?.role) {
      case "admin":
        return (
          <>
            <li className="nav-item mb-1">
              <NavLink to="/admin/dashboard" end className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-speedometer2 fs-5"></i>
                <span>Admin Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/admin/departments" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-building fs-5"></i>
                <span>Departments</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/admin/users" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-people fs-5"></i>
                <span>User Directory</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/admin/hierarchy" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-diagram-3 fs-5"></i>
                <span>Team Hierarchy</span>
              </NavLink>
            </li>
          </>
        );

      case "manager":
        return (
          <>
            <li className="nav-item mb-1">
              <NavLink to="/manager/dashboard" end className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-speedometer2 fs-5"></i>
                <span>Manager Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/manager/projects" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-kanban fs-5"></i>
                <span>Projects & Milestones</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/manager/supervisors" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-person-badge fs-5"></i>
                <span>Dept Supervisors</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/manager/leaves" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-calendar2-check fs-5"></i>
                <span>Escalated Leaves</span>
              </NavLink>
            </li>
          </>
        );

      case "supervisor":
        return (
          <>
            <li className="nav-item mb-1">
              <NavLink to="/supervisor/dashboard" end className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-speedometer2 fs-5"></i>
                <span>Team Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/supervisor/team" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-people fs-5"></i>
                <span>Assigned Team</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/supervisor/tasks" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-list-check fs-5"></i>
                <span>Task Delegation</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/supervisor/leaves" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-calendar-check fs-5"></i>
                <span>Routine Leaves</span>
              </NavLink>
            </li>
          </>
        );

      case "employee":
        return (
          <>
            <li className="nav-item mb-1">
              <NavLink to="/employee/dashboard" end className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-speedometer2 fs-5"></i>
                <span>My Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/employee/tasks" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-card-checklist fs-5"></i>
                <span>My Tasks</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/employee/leaves" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-calendar-plus fs-5"></i>
                <span>Apply / Track Leave</span>
              </NavLink>
            </li>
            <li className="nav-item mb-1">
              <NavLink to="/employee/profile" className={({ isActive }) => `nav-link text-white d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${isActive ? "bg-primary" : "hover-dark"}`}>
                <i className="bi bi-person-circle fs-5"></i>
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
    <aside className="bg-dark text-white d-flex flex-column p-3 vh-100 position-sticky top-0" style={{ width: "260px", minWidth: "260px" }}>
      {/* Brand Header */}
      <div className="pb-3 mb-3 border-bottom border-secondary d-flex align-items-center gap-2">
        <div className="bg-primary text-white rounded p-2 d-flex align-items-center justify-content-center" style={{ width: "38px", height: "38px" }}>
          <i className="bi bi-buildings-fill fs-5"></i>
        </div>
        <div>
          <h6 className="mb-0 fw-bold tracking-tight text-white">Enterprise EMS</h6>
          <small className="text-muted" style={{ fontSize: "11px" }}>4-Tier Portal System</small>
        </div>
      </div>

      {/* User Chip */}
      <div className="bg-secondary bg-opacity-25 rounded p-2 mb-3 d-flex align-items-center gap-2">
        <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: "36px", height: "36px" }}>
          {user?.name?.charAt(0) || "U"}
        </div>
        <div className="overflow-hidden">
          <p className="mb-0 fw-semibold text-truncate text-white" style={{ fontSize: "13px" }}>{user?.name || "User"}</p>
          <div className="d-flex align-items-center gap-1">{getRoleBadge(user?.role)}</div>
        </div>
      </div>

      {/* Navigation Menu */}
      <ul className="nav nav-pills flex-column mb-auto overflow-y-auto" style={{ maxHeight: "calc(100vh - 230px)" }}>
        {renderNavLinks()}
      </ul>

      {/* Logout Footer */}
      <div className="pt-3 border-top border-secondary mt-auto">
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2"
        >
          <i className="bi bi-box-arrow-right fs-5"></i>
          <span className="fw-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
