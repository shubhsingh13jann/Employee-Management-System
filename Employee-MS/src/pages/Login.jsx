import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, getDefaultRouteForRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please enter both email and password.");

    try {
      setError("");
      setSubmitting(true);
      const res = await login(email, password, role);
      const targetRoute = getDefaultRouteForRole(res.user.role);
      navigate(targetRoute, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to sign in. Please check credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword, demoRole) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setError("");
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-dark p-3" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden" style={{ maxWidth: "480px", width: "100%" }}>
        {/* Header Banner */}
        <div className="bg-primary text-white p-4 text-center">
          <div className="d-inline-flex p-3 bg-white bg-opacity-25 rounded-circle mb-3">
            <i className="bi bi-buildings-fill fs-2"></i>
          </div>
          <h4 className="fw-bold mb-1">Enterprise EMS Portal</h4>
          <p className="mb-0 text-white-50" style={{ fontSize: "13px" }}>4-Tier Role-Based Workforce Management</p>
        </div>

        <div className="card-body p-4 bg-white">
          {error && <div className="alert alert-danger py-2 d-flex align-items-center gap-2 mb-3"><i className="bi bi-exclamation-triangle-fill"></i><span>{error}</span></div>}

          <form onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">SELECT PORTAL / ROLE</label>
              <select
                className="form-select rounded-3 py-2 fw-semibold"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">👑 HR / Super Admin</option>
                <option value="manager">👔 Department Manager</option>
                <option value="supervisor">👷 Operational Supervisor</option>
                <option value="employee">💼 Staff Employee</option>
              </select>
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">WORK EMAIL</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  className="form-control rounded-end-3 py-2"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small">PASSWORD</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
                <input
                  type="password"
                  className="form-control rounded-end-3 py-2"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-100 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
            >
              {submitting ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-box-arrow-in-right"></i>}
              <span>Sign In to Portal</span>
            </button>
          </form>

          {/* Quick Fill Testing Box */}
          <div className="mt-4 pt-3 border-top">
            <p className="text-muted small fw-bold mb-2 text-center text-uppercase" style={{ fontSize: "11px" }}>One-Click Demo Credentials</p>
            <div className="d-grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-flex align-items-center justify-content-center gap-1 py-1.5 rounded-2"
                onClick={() => handleQuickFill("shubhsingh.13jan@gmail.com", "8859574934", "admin")}
              >
                <span>👑 HR Admin (Shubh)</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center gap-1 py-1.5 rounded-2"
                onClick={() => handleQuickFill("manager@company.com", "Manager@123", "manager")}
              >
                <span>👔 Manager</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-success d-flex align-items-center justify-content-center gap-1 py-1.5 rounded-2"
                onClick={() => handleQuickFill("supervisor@company.com", "Supervisor@123", "supervisor")}
              >
                <span>👷 Supervisor</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center gap-1 py-1.5 rounded-2"
                onClick={() => handleQuickFill("employee@company.com", "Employee@123", "employee")}
              >
                <span>💼 Employee</span>
              </button>
            </div>

            {/* Link to Signup page */}
            <div className="text-center mt-3 pt-2">
              <span className="text-muted small">Need an employee or supervisor account? </span>
              <Link to="/signup" className="fw-bold text-primary text-decoration-none small hover-underline d-block mt-1">
                Create Account / Sign Up Here →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
