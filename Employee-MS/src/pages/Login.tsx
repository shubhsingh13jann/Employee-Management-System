import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import CharacterStage from "../components/auth/CharacterStage";
import BriefcaseLoader from "../components/auth/BriefcaseLoader";
import { UserRole, AuthStatus } from "../components/auth/auth.types";
import "../components/auth/authInteractive.css";

/**
 * Unified Auth Hub: Seamlessly handles both Sign In and Sign Up
 * with the interactive character crew, caret tracking, privacy hands,
 * and the articulated walking briefcase opening animation.
 */
interface LoginProps {
  initialMode?: "login" | "signup";
}

const Login: React.FC<LoginProps> = ({ initialMode = "login" }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<"login" | "signup">(() => {
    if (initialMode === "signup" || location.pathname.includes("signup")) {
      return "signup";
    }
    return "login";
  });

  // Sync mode if URL route changes
  useEffect(() => {
    if (location.pathname.includes("signup")) {
      setAuthMode("signup");
    } else if (location.pathname.includes("login")) {
      setAuthMode("login");
    }
  }, [location.pathname]);

  // Form State
  const [role, setRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Sign Up Specific Fields
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("1");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [departments, setDepartments] = useState([
    { id: 1, name: "Engineering" },
    { id: 2, name: "Marketing" },
    { id: 3, name: "Human Resources" },
    { id: 4, name: "Finance" }
  ]);

  // Interaction & Animation States
  const [activeField, setActiveField] = useState<"email" | "password" | null>(null);
  const [caretProgress, setCaretProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Briefcase Intro State (Link 3)
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("ems_intro_seen");
  });

  const { login, getDefaultRouteForRole } = useAuth();
  const containerRef = useRef(null);

  // Fetch departments for registration
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get("/api/admin/departments");
        if (res.data.status) {
          setDepartments(res.data.departments);
        }
      } catch {
        // Fallback default departments
      }
    };
    fetchDepts();
  }, []);

  // 360° Mouse Cursor Kinematics
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setCaretProgress(Math.min(val.length / 28, 1));
  };

  // Submission handler for both Sign In and Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (authMode === "login") {
      // SIGN IN LOGIC
      if (!email || !password) {
        setError("Please enter both email and password.");
        setAuthStatus("error");
        setTimeout(() => setAuthStatus("idle"), 1200);
        return;
      }

      try {
        setSubmitting(true);
        setAuthStatus("submitting");
        const res = await login(email, password, role);
        setAuthStatus("success");

        setTimeout(() => {
          const targetRoute = getDefaultRouteForRole(res.user.role);
          navigate(targetRoute, { replace: true });
        }, 700);
      } catch (err) {
        setError(err.response?.data?.error || err.message || "Failed to sign in. Please verify credentials.");
        setAuthStatus("error");
        setTimeout(() => setAuthStatus("idle"), 1400);
      } finally {
        setSubmitting(false);
      }
    } else {
      // SIGN UP LOGIC
      if (!name.trim() || !email.trim() || !password) {
        setError("Please fill in all required fields.");
        setAuthStatus("error");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter.");
        setAuthStatus("error");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setAuthStatus("error");
        return;
      }

      try {
        setSubmitting(true);
        setAuthStatus("submitting");
        const res = await api.post("/api/auth/register", {
          name,
          email,
          password,
          role,
          department_id: Number(departmentId) || 1,
          phone,
          address
        });

        if (res.data.status) {
          setAuthStatus("success");
          setSuccessMsg("Account created successfully! Switching you to Sign In...");
          setTimeout(() => {
            setAuthMode("login");
            setSuccessMsg("");
            setAuthStatus("idle");
          }, 1500);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Registration failed. Please check information.");
        setAuthStatus("error");
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Demo Credentials helper
  const handleQuickFill = (demoEmail, demoPassword, demoRole) => {
    setAuthMode("login");
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setCaretProgress(Math.min(demoEmail.length / 28, 1));
    setError("");
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem("ems_intro_seen", "true");
    setShowIntro(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="auth-split-wrapper position-relative"
    >
      {/* Briefcase Loading Opening Sequence (Link 3) */}
      <AnimatePresence>
        {showIntro && <BriefcaseLoader onComplete={handleIntroComplete} />}
      </AnimatePresence>

      {/* Top Navbar Brand & Replay Intro Control */}
      <div className="position-absolute top-0 start-0 w-100 p-3 px-md-4 d-flex align-items-center justify-content-between">
        <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-3 text-white shadow-xs"
            style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" }}
          >
            <i className="bi bi-box-fill small"></i>
          </div>
          <span className="fw-bold text-white small tracking-wide">Enterprise EMS</span>
        </Link>

        <button
          type="button"
          onClick={() => setShowIntro(true)}
          className="btn btn-sm btn-outline-light rounded-pill px-2.5 py-1 d-flex align-items-center gap-1.5 shadow-2xs"
          style={{ fontSize: "11px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}
          title="Replay Suitcase Opening Intro"
        >
          <i className="bi bi-play-circle"></i>
          <span className="d-none d-sm-inline">Replay Intro</span>
        </button>
      </div>

      {/* MASTER 2-PANEL SPLIT CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="auth-split-card"
      >
        {/* ============================================================
            LEFT PANEL: INTERACTIVE COMPANION BOT RIG & PRIVACY HANDS
            ============================================================ */}
        <div className="auth-character-stage">
          <CharacterStage
            mousePos={mousePos}
            activeField={activeField}
            caretProgress={caretProgress}
            showPassword={showPassword}
            selectedRole={role}
            authStatus={authStatus}
          />
        </div>

        {/* ============================================================
            RIGHT PANEL: UNIFIED AUTH FORM (SIGN IN <--> SIGN UP)
            ============================================================ */}
        <div className="auth-form-panel">
          
          {/* Sliding Pill Mode Switcher (Option 4: Seamless Switch) */}
          <div className="d-flex justify-content-center mb-3">
            <div className="d-inline-flex p-1 bg-slate-100 rounded-pill border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold transition-all ${
                  authMode === "login"
                    ? "bg-dark text-white shadow-xs"
                    : "text-secondary hover-dark border-0 bg-transparent"
                }`}
                style={{ fontSize: "11.5px" }}
              >
                <i className="bi bi-box-arrow-in-right me-1"></i>
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`btn btn-sm rounded-pill px-3 py-1 fw-bold transition-all ${
                  authMode === "signup"
                    ? "bg-dark text-white shadow-xs"
                    : "text-secondary hover-dark border-0 bg-transparent"
                }`}
                style={{ fontSize: "11.5px" }}
              >
                <i className="bi bi-person-plus-fill me-1"></i>
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-3">
            <h3 className="fw-bold text-dark mb-1 tracking-tight" style={{ fontSize: "22px" }}>
              {authMode === "login" ? "Welcome back!" : "Join Enterprise EMS"}
            </h3>
            <p className="text-muted small mb-0" style={{ fontSize: "12.5px" }}>
              {authMode === "login"
                ? "Enter your credentials to access your portal"
                : "Register your workforce account for access"}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-danger py-2 px-3 rounded-3 small d-flex align-items-center gap-2 mb-3 border-0"
              style={{ background: "#fef2f2", color: "#991b1b" }}
            >
              <i className="bi bi-exclamation-circle-fill"></i>
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="alert alert-success py-2 px-3 rounded-3 small d-flex align-items-center gap-2 mb-3 border-0"
              style={{ background: "#f0fdf4", color: "#166534" }}
            >
              <i className="bi bi-check-circle-fill"></i>
              <span>{successMsg}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 4-Tier Role Selection Pills */}
            <div className="mb-2.5">
              <label className="auth-clean-label">Select Role Tier</label>
              <div className="d-flex flex-wrap gap-1.5">
                {[
                  { id: "admin", label: "HR Admin", icon: "👑" },
                  { id: "manager", label: "Manager", icon: "👔" },
                  { id: "supervisor", label: "Supervisor", icon: "👷" },
                  { id: "employee", label: "Employee", icon: "💼" }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`role-pill-btn ${role === r.id ? "active" : ""}`}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* If Sign Up Mode: Full Name */}
            {authMode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="auth-clean-input-group"
              >
                <label className="auth-clean-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Turner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-clean-input"
                />
                <div className="auth-input-focus-line"></div>
              </motion.div>
            )}

            {/* Email Field (With Caret Tracking) */}
            <div className="auth-clean-input-group">
              <label className="auth-clean-label">Work Email *</label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="name@company.com"
                value={email}
                onChange={handleEmailChange}
                onFocus={() => setActiveField("email")}
                onBlur={() => setActiveField(null)}
                className="auth-clean-input"
              />
              <div className="auth-input-focus-line"></div>
            </div>

            {/* If Sign Up Mode: Department & Phone */}
            {authMode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="row g-2 mb-2"
              >
                <div className="col-6">
                  <label className="auth-clean-label">Department</label>
                  <select
                    className="form-select form-select-sm rounded-2 py-1.5"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    style={{ fontSize: "12px" }}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <label className="auth-clean-label">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="auth-clean-input py-1"
                    style={{ fontSize: "12.5px" }}
                  />
                </div>
              </motion.div>
            )}

            {/* Password Field (With Hands-Over-Eyes & Eye Peek Toggle) */}
            <div className="auth-clean-input-group">
              <label className="auth-clean-label">Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setActiveField("password")}
                onBlur={() => setActiveField(null)}
                className="auth-clean-input"
              />
              <div className="auth-input-focus-line"></div>

              {/* Eye Toggle Button */}
              <button
                type="button"
                className="auth-eye-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowPassword((prev) => !prev);
                  setActiveField("password");
                }}
                title={showPassword ? "Hide password" : "Show password & peek"}
              >
                <i className={showPassword ? "bi bi-eye-slash-fill text-primary" : "bi bi-eye-fill"}></i>
              </button>
            </div>

            {/* If Sign Up Mode: Confirm Password */}
            {authMode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="auth-clean-input-group"
              >
                <label className="auth-clean-label">Confirm Password *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setActiveField("password")}
                  onBlur={() => setActiveField(null)}
                  className="auth-clean-input"
                />
                <div className="auth-input-focus-line"></div>
              </motion.div>
            )}

            {/* Remember Me & Forgot Password (Only in Login Mode) */}
            {authMode === "login" && (
              <div className="d-flex align-items-center justify-content-between mb-3">
                <label className="d-flex align-items-center gap-2 cursor-pointer m-0">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="form-check-input mt-0 rounded"
                    style={{ width: "15px", height: "15px" }}
                  />
                  <span className="text-secondary small" style={{ fontSize: "12px" }}>
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => alert("Password reset instructions have been dispatched to your work email.")}
                  className="btn btn-link p-0 text-decoration-none small text-secondary"
                  style={{ fontSize: "12px" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="auth-submit-btn mt-2"
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>{authMode === "login" ? "Verifying..." : "Creating Account..."}</span>
                </>
              ) : (
                <>
                  <span>{authMode === "login" ? "Sign In to Portal" : "Complete Registration"}</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demo Credentials Bar (Only in Login Mode) */}
          {authMode === "login" ? (
            <div className="mt-3 pt-2 border-top border-slate-100">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
                  1-Click Demo Credentials
                </span>
                <span className="badge bg-slate-100 text-secondary" style={{ fontSize: "9px" }}>Instant Fill</span>
              </div>

              <div className="auth-demo-grid">
                <button
                  type="button"
                  className="auth-demo-pill"
                  onClick={() => handleQuickFill("shubhsingh.13jan@gmail.com", "8859574934", "admin")}
                >
                  <span>👑</span>
                  <span className="text-truncate">Admin (Shubh)</span>
                </button>
                <button
                  type="button"
                  className="auth-demo-pill"
                  onClick={() => handleQuickFill("manager@company.com", "Manager@123", "manager")}
                >
                  <span>👔</span>
                  <span className="text-truncate">Manager</span>
                </button>
                <button
                  type="button"
                  className="auth-demo-pill"
                  onClick={() => handleQuickFill("supervisor@company.com", "Supervisor@123", "supervisor")}
                >
                  <span>👷</span>
                  <span className="text-truncate">Supervisor</span>
                </button>
                <button
                  type="button"
                  className="auth-demo-pill"
                  onClick={() => handleQuickFill("employee@company.com", "Employee@123", "employee")}
                >
                  <span>💼</span>
                  <span className="text-truncate">Employee</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center mt-3 pt-2 border-top border-slate-100">
              <span className="text-muted small" style={{ fontSize: "12px" }}>
                Already registered with an organization?{" "}
              </span>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="btn btn-link p-0 fw-bold text-dark text-decoration-none small hover-underline"
              >
                Sign In Here →
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
