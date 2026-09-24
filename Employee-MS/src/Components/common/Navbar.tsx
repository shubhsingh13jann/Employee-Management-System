import React from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0] || "User";

  return (
    <header className="navbar navbar-expand bg-white border-bottom px-4 py-2 sticky-top shadow-sm" style={{ zIndex: 900 }}>
      <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
        {/* Welcome Section */}
        <div>
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            Welcome back, {firstName}! <span className="fs-5">👋</span>
          </h5>
          <p className="text-secondary mb-0 fw-medium" style={{ fontSize: "13px" }}>
            Here's what's happening in your organization today.
          </p>
        </div>

        {/* Global Search & Actions */}
        <div className="d-flex align-items-center gap-3">
          
          {/* Search Bar */}
          <div className="d-none d-xl-flex align-items-center bg-light border rounded-pill px-3 py-1" style={{ minWidth: "260px", transition: "all 0.2s ease" }}>
            <i className="bi bi-search text-muted" style={{ fontSize: "14px" }}></i>
            <input 
              type="text" 
              className="form-control border-0 bg-transparent shadow-none ms-2 py-1" 
              placeholder="Search..." 
              style={{ fontSize: "13px" }}
            />
            <span className="badge bg-white text-secondary border rounded-1 ms-2 px-2 py-1 shadow-sm" style={{ fontSize: "10px" }}>⌘K</span>
          </div>

          {/* Icon Actions */}
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center text-secondary border" style={{ width: "34px", height: "34px" }}>
              <i className="bi bi-moon-stars" style={{ fontSize: "14px" }}></i>
            </button>
            <button className="btn btn-light rounded-circle p-2 d-flex align-items-center justify-content-center text-secondary border position-relative" style={{ width: "34px", height: "34px" }}>
              <i className="bi bi-bell" style={{ fontSize: "14px" }}></i>
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            </button>
          </div>

          {/* User Profile Dropdown Placeholder */}
          {user && (
            <div className="d-flex align-items-center gap-2 border-start ps-3 ms-1">
              <div
                className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
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
              <div className="d-none d-md-block" style={{ lineHeight: "1.2" }}>
                <p className="mb-0 fw-bold text-dark" style={{ fontSize: "13px" }}>{user.name || "User"}</p>
                <small className="text-secondary fw-medium" style={{ fontSize: "11px" }}>
                  {user.department_name ? `${user.department_name} • ` : ""}
                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}
                </small>
              </div>
              <i className="bi bi-chevron-down text-muted ms-1" style={{ fontSize: "12px", cursor: "pointer" }}></i>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
