import React from "react";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ title = "Dashboard" }) => {
  const { user } = useAuth();

  return (
    <header className="navbar navbar-expand bg-white border-bottom shadow-sm px-4 py-2 sticky-top">
      <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0 fw-bold text-dark">{title}</h5>
          <small className="text-muted">
            {user?.department_name ? `${user.department_name} Department • ` : ""}
            {user?.email}
          </small>
        </div>

        <div className="d-flex align-items-center gap-3">
          <div className="d-none d-md-flex align-items-center gap-2 bg-light px-3 py-1.5 rounded-pill border">
            <span className="badge bg-success p-1 rounded-circle"></span>
            <small className="fw-semibold text-secondary">System Online</small>
          </div>
          {user && (
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-primary bg-opacity-10 text-primary rounded-circle fw-bold d-flex align-items-center justify-content-center overflow-hidden border"
                style={{ width: "34px", height: "34px", fontSize: "14px" }}
              >
                {user.image_url ? (
                  <img
                    src={user.image_url.startsWith("http") ? user.image_url : `http://localhost:3000${user.image_url}`}
                    alt={user.name || "User"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  (user.name || user.email)?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
