import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    department_id: "1",
    phone: "",
    address: ""
  });

  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get("/api/admin/departments");
        if (res.data.status) {
          setDepartments(res.data.departments);
        }
      } catch {
        // Fallback default departments if not authenticated
        setDepartments([
          { id: 1, name: "Engineering" },
          { id: 2, name: "Marketing" },
          { id: 3, name: "Human Resources" },
          { id: 4, name: "Finance" }
        ]);
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department_id: Number(form.department_id) || 1,
        phone: form.phone,
        address: form.address
      });

      if (res.data.status) {
        setSuccess("Account created successfully! Redirecting you to the login portal...");
        setTimeout(() => {
          navigate("/login");
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please check your information and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card shadow-lg border-0 rounded-4 overflow-hidden bg-white w-100" style={{ maxWidth: "520px" }}>
        {/* Header Ribbon */}
        <div className="p-4 text-center text-white" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}>
          <div className="d-inline-flex align-items-center justify-content-center p-3 bg-white bg-opacity-20 rounded-circle mb-2 shadow-sm">
            <i className="bi bi-person-plus-fill fs-3 text-white"></i>
          </div>
          <h3 className="fw-bold mb-1">Create an Account</h3>
          <p className="small mb-0 text-white-50">Join your organization on Enterprise EMS</p>
        </div>

        <div className="card-body p-4 p-sm-5">
          {error && <div className="alert alert-danger py-2 px-3 small rounded-3">{error}</div>}
          {success && <div className="alert alert-success py-2 px-3 small rounded-3">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">FULL NAME *</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-person"></i></span>
                <input
                  type="text"
                  className="form-control rounded-end-3 py-2"
                  placeholder="e.g. Alex Turner"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">WORK EMAIL *</label>
              <div className="input-group">
                <span className="input-group-text bg-light"><i className="bi bi-envelope"></i></span>
                <input
                  type="email"
                  className="form-control rounded-end-3 py-2"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* 4 Role Selector Buttons */}
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small mb-2">SELECT YOUR ROLE (ALL 4 TIERS) *</label>
              <div className="row g-2">
                {[
                  { id: "admin", label: "HR Admin", icon: "bi-shield-lock-fill" },
                  { id: "manager", label: "Manager", icon: "bi-person-badge-fill" },
                  { id: "supervisor", label: "Supervisor", icon: "bi-person-check-fill" },
                  { id: "employee", label: "Employee", icon: "bi-person-fill" }
                ].map((r) => (
                  <div key={r.id} className="col-3">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, role: r.id })}
                      className={`btn w-100 py-2 rounded-3 d-flex flex-column align-items-center justify-content-center gap-1 transition-all ${
                        form.role === r.id
                          ? "btn-primary shadow-xs fw-bold"
                          : "btn-light border text-secondary hover-light"
                      }`}
                      style={{ fontSize: "11px" }}
                    >
                      <i className={`bi ${r.icon} fs-6`}></i>
                      <span style={{ fontSize: "10px" }}>{r.label}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Role & Department Details */}
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fw-bold text-secondary small">ROLE CONFIRMATION *</label>
                <select
                  className="form-select py-2"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="admin">👑 HR Administrator</option>
                  <option value="manager">👔 Department Manager</option>
                  <option value="supervisor">👷 Operational Supervisor</option>
                  <option value="employee">💼 Staff Employee</option>
                </select>
              </div>
              <div className="col-6">
                <label className="form-label fw-bold text-secondary small">DEPARTMENT *</label>
                <select
                  className="form-select py-2"
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  disabled={form.role === "admin"}
                >
                  {form.role === "admin" ? (
                    <option value="">HQ / Executive</option>
                  ) : (
                    departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fw-bold text-secondary small">PASSWORD *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><i className="bi bi-lock"></i></span>
                  <input
                    type="password"
                    className="form-control py-2"
                    placeholder="Min 6 chars"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <label className="form-label fw-bold text-secondary small">CONFIRM *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light"><i className="bi bi-shield-lock"></i></span>
                  <input
                    type="password"
                    className="form-control py-2"
                    placeholder="Re-enter password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Phone & Address */}
            <div className="row g-2 mb-4">
              <div className="col-6">
                <label className="form-label fw-bold text-secondary small">PHONE NUMBER</label>
                <input
                  type="text"
                  className="form-control py-2"
                  placeholder="+1 555-0123"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="col-6">
                <label className="form-label fw-bold text-secondary small">LOCATION / DESK</label>
                <input
                  type="text"
                  className="form-control py-2"
                  placeholder="Building A, Fl 2"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-100 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)", border: "none" }}
            >
              {submitting ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-person-check-fill"></i>}
              <span>Create Account & Sign In</span>
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center mt-4 pt-3 border-top">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="fw-bold text-primary text-decoration-none small hover-underline">
              Sign In Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
