import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const firstName = user?.name?.split(' ')[0] || "User";
  const path = location.pathname.toLowerCase();
  const isDepartmentsPage = path.includes("department");
  const isUsersPage = path.includes("user");

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    headerRef.current.style.setProperty("--mouse-x", `${x}px`);
  };

  return (
    <header 
      ref={headerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-[68px] min-h-[68px] max-h-[68px] box-border navbar-frosted-glass px-6 lg:px-8 sticky top-0 z-30 transition-colors duration-300 flex items-center relative overflow-hidden"
    >
      {/* 1px "Linear Edge" Laser Border Horizon (Option 1) */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none z-10">
        <div className="absolute inset-0 bg-slate-200/60" />
        <div className="navbar-laser-beam" />
      </div>

      {/* Interactive Cursor Spotlight Bottom Border Highlight (Option 2) */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] pointer-events-none z-15 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(160px circle at var(--mouse-x, -250px) 50%, rgba(56, 189, 248, 0.95), rgba(99, 102, 241, 0.7), transparent 75%)`,
            filter: "drop-shadow(0 0 6px rgba(56, 189, 248, 0.85)) drop-shadow(0 0 12px rgba(99, 102, 241, 0.6))",
          }}
        />
      </div>

      {/* Fiber-Optic Wave Pulses (Option 3) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fiberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </linearGradient>
          <filter id="pulseNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Base harmonic waves */}
        <path d="M 0,68 C 200,48 400,28 600,68 C 800,108 1000,48 1200,68" stroke="url(#fiberGradient)" strokeWidth="1.5" fill="none" />
        
        {/* Pulse Track 1: Luminous Photon Head Node */}
        <g filter="url(#pulseNeonGlow)">
          <circle r="4" fill="#38bdf8" opacity="0.6">
            <animateMotion path="M -40,68 C 200,48 400,28 600,68 C 800,108 1000,48 1200,68" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle r="1.5" fill="#ffffff">
            <animateMotion path="M -40,68 C 200,48 400,28 600,68 C 800,108 1000,48 1200,68" dur="6s" repeatCount="indefinite" />
          </circle>
        </g>
        {/* Pulse Track 2 */}
        <g filter="url(#pulseNeonGlow)">
          <circle r="4" fill="#a855f7" opacity="0.6">
            <animateMotion path="M -40,68 C 200,48 400,28 600,68 C 800,108 1000,48 1200,68" dur="7s" begin="2s" repeatCount="indefinite" />
          </circle>
          <circle r="1.5" fill="#ffffff">
            <animateMotion path="M -40,68 C 200,48 400,28 600,68 C 800,108 1000,48 1200,68" dur="7s" begin="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>

      <div className="w-full h-full flex justify-between items-center relative z-20">
        {/* Welcome / Page Title Section */}
        {isDepartmentsPage ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50/80 border border-purple-100/80 flex items-center justify-center text-purple-600 shadow-2xs backdrop-blur-xs shrink-0">
              <i className="bi bi-building text-lg"></i>
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h5 className="font-bold text-slate-900 mb-0 text-base tracking-tight leading-tight truncate">
                Department Management
              </h5>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium truncate">
                <span className="hover:text-slate-600 transition-colors cursor-pointer">Home</span>
                <i className="bi bi-chevron-right text-[9px] text-slate-300"></i>
                <span className="text-slate-600">Departments</span>
              </div>
            </div>
          </div>
        ) : isUsersPage ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50/80 border border-purple-100/80 flex items-center justify-center text-purple-600 shadow-2xs shrink-0 backdrop-blur-xs">
              <i className="bi bi-people-fill text-lg"></i>
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <h5 className="font-bold text-slate-900 mb-0 text-base tracking-tight leading-tight truncate">
                User Directory
              </h5>
              <p className="text-slate-500 mb-0 font-normal text-xs leading-normal truncate">
                Manage your workforce, roles, departments and reporting structure.
              </p>
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex flex-col justify-center">
            <h5 className="font-bold text-slate-900 mb-0 flex items-center gap-2 text-base tracking-tight leading-tight truncate">
              Welcome back, {firstName}! <span className="text-lg">👋</span>
            </h5>
            <p className="text-slate-500 mb-0 font-medium text-xs leading-normal truncate">
              Here's what's happening in your organization today.
            </p>
          </div>
        )}

        {/* Global Search & Actions */}
        <div className="flex items-center gap-6">
          
          {/* Search Bar */}
          <div className="hidden md:flex items-center bg-slate-50/80 hover:bg-white border border-slate-200/90 rounded-full px-4 py-1.5 w-64 lg:w-80 transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white shadow-2xs backdrop-blur-xs">
            <i className="bi bi-search text-slate-400 text-xs mr-2"></i>
            <input 
              type="text" 
              className="w-full text-xs bg-transparent border-none outline-none focus:outline-none placeholder:text-slate-400 text-slate-700" 
              placeholder="Search by name, email, department..." 
            />
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 shadow-2xs ml-1 shrink-0">Ctrl K</span>
          </div>

          {/* Icon Actions */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-white/70 hover:bg-slate-100/80 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 shadow-2xs">
              <i className="bi bi-moon-stars text-sm"></i>
            </button>
            <button className="w-9 h-9 rounded-full bg-white/70 hover:bg-slate-100/80 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 shadow-2xs relative">
              <i className="bi bi-bell text-sm"></i>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
          </div>

          {/* User Profile Dropdown Placeholder */}
          {user && (
            <div className="flex items-center gap-2 border-l border-gray-200 ps-3 ml-1">
              <div
                className="rounded-full text-white font-bold flex items-center justify-center overflow-hidden shadow-sm"
                style={{ width: "34px", height: "34px", fontSize: "14px", background: "var(--sidebar-active-gradient)" }}
              >
                {user.image_url ? (
                  <img
                    src={user.image_url.startsWith("http") ? user.image_url : `http://localhost:3000${user.image_url}`}
                    alt={user.name || "User"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  firstName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden md:block" style={{ lineHeight: "1.2" }}>
                <p className="mb-0 font-bold text-gray-900" style={{ fontSize: "13px" }}>{user.name || "User"}</p>
                <small className="text-gray-500 font-medium" style={{ fontSize: "11px" }}>
                  {user.role === "admin" ? "HR Super Admin" : user.department_name ? `${user.department_name} • ` : ""}
                  {user.role !== "admin" && user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
                </small>
              </div>
              <i className="bi bi-chevron-down text-gray-500 ml-1" style={{ fontSize: "12px", cursor: "pointer" }}></i>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
