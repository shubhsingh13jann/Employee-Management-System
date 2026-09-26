import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const firstName = user?.name?.split(' ')[0] || "User";
  const isDepartmentsPage = location.pathname.includes("/admin/departments");

  return (
    <header className="w-full bg-white border-b border-slate-200/90 px-6 lg:px-8 py-3.5 sticky top-0 shadow-xs z-30">
      <div className="w-full flex justify-between items-center">
        {/* Welcome / Page Title Section */}
        {isDepartmentsPage ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shadow-2xs">
              <i className="bi bi-building text-lg"></i>
            </div>
            <div>
              <h5 className="font-bold text-slate-900 mb-0 text-base lg:text-lg tracking-tight">
                Department Management
              </h5>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="hover:text-slate-600 transition-colors cursor-pointer">Home</span>
                <i className="bi bi-chevron-right text-[9px] text-slate-300"></i>
                <span className="text-slate-600">Departments</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h5 className="font-bold text-gray-900 mb-0 flex items-center gap-2 text-base lg:text-lg">
              Welcome back, {firstName}! <span className="text-lg">👋</span>
            </h5>
            <p className="text-slate-500 mb-0 font-medium text-xs lg:text-sm">
              Here's what's happening in your organization today.
            </p>
          </div>
        )}

        {/* Global Search & Actions */}
        <div className="flex items-center gap-6">
          
          {/* Search Bar */}
          <div className="hidden xl:flex items-center bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 min-w-[280px] transition-all focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white">
            <i className="bi bi-search text-slate-400 text-xs mr-2"></i>
            <input 
              type="text" 
              className="w-full text-xs bg-transparent border-none outline-none focus:outline-none placeholder:text-slate-400 text-slate-700" 
              placeholder="Search users, departments..." 
            />
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 shadow-xs ml-1">⌘K</span>
          </div>

          {/* Icon Actions */}
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80">
              <i className="bi bi-moon-stars text-sm"></i>
            </button>
            <button className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/80 relative">
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
                <small className="text-gray-600 font-medium" style={{ fontSize: "11px" }}>
                  {user.department_name ? `${user.department_name} • ` : ""}
                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
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
