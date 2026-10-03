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
    <aside
      className="sidebar-container text-white flex flex-col px-3.5 py-4 h-screen sticky top-0 shadow-xl relative overflow-hidden select-none"
      style={{ width: "240px", minWidth: "240px", zIndex: 1000, fontSize: "0.82rem" }}
    >
      {/* Micro-Lightning Wave Effect Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Micro Lightning / Harmonic Wave SVG Curves */}
        <svg
          className="absolute right-0 bottom-10 w-full h-[68%] text-cyan-400 micro-lightning-waves opacity-80"
          viewBox="0 0 240 500"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="sidebarWaveGradient" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="sidebarWaveCyan" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Primary Harmonic Wave Ribbon */}
          {Array.from({ length: 22 }).map((_, i) => {
            const startX = 250;
            const startY = 480 - i * 11;
            const cp1x = 110 - i * 2.8;
            const cp1y = 360 - i * 9;
            const cp2x = 90 + i * 2.2;
            const cp2y = 230 - i * 6.5;
            const endX = 250;
            const endY = 120 - i * 4.5;
            const opacity = 0.08 + Math.sin((i / 22) * Math.PI) * 0.28;
            return (
              <path
                key={`wave-main-${i}`}
                d={`M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                stroke="url(#sidebarWaveGradient)"
                strokeWidth={i % 3 === 0 ? "1.2" : "0.75"}
                strokeOpacity={opacity}
              />
            );
          })}

          {/* Secondary Delicate Cross Wave */}
          {Array.from({ length: 14 }).map((_, i) => {
            const startX = 250;
            const startY = 430 - i * 13;
            const cp1x = 140 - i * 3.5;
            const cp1y = 310 - i * 8;
            const cp2x = 70 + i * 3;
            const cp2y = 180 - i * 5;
            const endX = 240;
            const endY = 70 - i * 3.5;
            const opacity = 0.05 + Math.sin((i / 14) * Math.PI) * 0.2;
            return (
              <path
                key={`wave-cross-${i}`}
                d={`M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                stroke="url(#sidebarWaveCyan)"
                strokeWidth="0.8"
                strokeOpacity={opacity}
              />
            );
          })}
        </svg>
      </div>

      {/* Brand Header */}
      <div className="relative z-10 pb-3.5 mb-3.5 border-b border-white/10">
        <BrandLogo
          theme="dark"
          size="normal"
          to={getDefaultRouteForRole ? getDefaultRouteForRole(user?.role) : "/"}
        />
      </div>

      {/* User Chip */}
      <div className="relative z-10 bg-white/5 border border-white/10 hover:border-indigo-500/30 rounded-2xl p-2.5 mb-3.5 flex items-center justify-between gap-2 shadow-xs transition-colors backdrop-blur-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm relative shrink-0">
            <span>{user?.name ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2) : "SS"}</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-[#070d24] rounded-full"></span>
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="mb-0 font-bold truncate text-white text-xs leading-tight">{user?.name || "User"}</p>
            <div className="flex items-center mt-0.5">{getRoleBadge(user?.role)}</div>
          </div>
        </div>
        <i className="bi bi-chevron-right text-slate-400 text-xs shrink-0"></i>
      </div>

      {/* Navigation Menu */}
      <ul className="relative z-10 nav nav-pills flex-col mb-auto sidebar-scroll overflow-y-auto" style={{ maxHeight: "calc(100vh - 230px)" }}>
        {renderNavLinks()}
      </ul>

      {/* Bottom Actions */}
      <div className="relative z-10 pt-3 mt-auto border-t border-white/10">
        {/* System Status Card */}
        <div className="bg-[#0b1338]/80 border border-indigo-900/40 rounded-xl p-2.5 mb-2.5 backdrop-blur-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <div>
              <span className="text-[11px] font-bold text-white block leading-tight">System Status</span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                <span className="text-emerald-400">◆</span> All systems operational
              </span>
            </div>
          </div>
          <i className="bi bi-chevron-right text-slate-400 text-xs"></i>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/20 hover:bg-rose-900/40 border border-rose-600/40 hover:border-rose-500 transition-all duration-200 cursor-pointer shadow-xs"
        >
          <i className="bi bi-box-arrow-right text-sm"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
