import React from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0] || "User";

  return (
    <header className="navbar navbar-expand bg-white border-b border-gray-200 px-6 py-2 sticky-top shadow-sm" style={{ zIndex: 900 }}>
      <div className="w-full px-6 p-0 flex justify-between items-center">
        {/* Welcome Section */}
        <div>
          <h5 className="font-bold text-gray-900 mb-0 flex items-center gap-2">
            Welcome back, {firstName}! <span className="text-lg">👋</span>
          </h5>
          <p className="text-gray-600 mb-0 font-medium" style={{ fontSize: "13px" }}>
            Here's what's happening in your organization today.
          </p>
        </div>

        {/* Global Search & Actions */}
        <div className="flex items-center gap-6">
          
          {/* Search Bar */}
          <div className="hidden xl:flex items-center bg-gray-50 border border-gray-200 border-gray-200 rounded-full px-6 py-1" style={{ minWidth: "260px", transition: "all 0.2s ease" }}>
            <i className="bi bi-search text-gray-500" style={{ fontSize: "14px" }}></i>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 bg-transparent shadow-none ml-2 py-1" 
              placeholder="Search..." 
              style={{ fontSize: "13px" }}
            />
            <span className="badge bg-white text-gray-600 border border-gray-200 border-gray-200 rounded-sm ml-2 px-2 py-1 shadow-sm" style={{ fontSize: "10px" }}>⌘K</span>
          </div>

          {/* Icon Actions */}
          <div className="flex items-center gap-2">
            <button className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-light rounded-full p-2 flex items-center justify-center text-gray-600 border border-gray-200 border-gray-200" style={{ width: "34px", height: "34px" }}>
              <i className="bi bi-moon-stars" style={{ fontSize: "14px" }}></i>
            </button>
            <button className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-light rounded-full p-2 flex items-center justify-center text-gray-600 border border-gray-200 border-gray-200 relative" style={{ width: "34px", height: "34px" }}>
              <i className="bi bi-bell" style={{ fontSize: "14px" }}></i>
              <span className="absolute top-0 left-full -translate-x-1/2 -translate-y-1/2 p-1 bg-red-600 border border-gray-200 border-gray-200 border-light rounded-full">
                <span className="visually-hidden">New alerts</span>
              </span>
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
