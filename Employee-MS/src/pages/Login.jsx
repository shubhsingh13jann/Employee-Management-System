import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import CharacterStage from "../components/auth/CharacterStage";
import BriefcaseLoader from "../components/auth/BriefcaseLoader";
import "../components/auth/authInteractive.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Character Stage Interaction States
  const [activeField, setActiveField] = useState(null); // 'email' | 'password' | null
  const [caretProgress, setCaretProgress] = useState(0); // 0 to 1
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [authStatus, setAuthStatus] = useState("idle"); // 'idle' | 'submitting' | 'success' | 'error'

  // Briefcase Intro State (Link 3)
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem("ems_intro_seen");
  });

  const { login, getDefaultRouteForRole } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // Mouse Movement tracking for 360° eye kinematics
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setMousePos({ x, y });
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    // Approximate caret position ratio across normal email length (max 30 chars)
    setCaretProgress(Math.min(val.length / 28, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      setAuthStatus("error");
      setTimeout(() => setAuthStatus("idle"), 1200);
      return;
    }

    try {
      setError("");
      setSubmitting(true);
      setAuthStatus("submitting");

      const res = await login(email, password, role);
      setAuthStatus("success");

      // Celebrate briefly before transitioning
      setTimeout(() => {
        const targetRoute = getDefaultRouteForRole(res.user.role);
        navigate(targetRoute, { replace: true });
      }, 700);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to sign in. Please check credentials.");
      setAuthStatus("error");
      setTimeout(() => setAuthStatus("idle"), 1400);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword, demoRole) => {
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

      {/* Background Ambient Glow Orbs */}
      <div
        className="position-absolute rounded-circle"
        style={{
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)",
          top: "10%",
          left: "15%",
          pointerEvents: "none"
        }}
      />
      <div
        className="position-absolute rounded-circle"
        style={{
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0) 70%)",
          bottom: "10%",
          right: "15%",
          pointerEvents: "none"
        }}
      />

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
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
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
            RIGHT PANEL: MODERN MINIMALIST AUTH FORM (FROM USER IMAGE)
            ============================================================ */}
        <div className="auth-form-panel">
          
          {/* Top EMS Hex / Delta Logo (Matching Uploaded Image) */}
          <div className="d-flex justify-content-center mb-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: "44px",
                height: "44px",
                background: "#0f172a",
                color: "#ffffff",
                transform: "rotate(45deg)",
                boxShadow: "0 8px 16px -4px rgba(15, 23, 42, 0.2)"
              }}
            >
              <i className="bi bi-box-fill fs-5" style={{ transform: "rotate(-45deg)" }}></i>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-4">
            <h3 className="fw-bold text-dark mb-1 tracking-tight" style={{ fontSize: "24px" }}>
              Welcome back!
            </h3>
            <p className="text-muted small mb-0" style={{ fontSize: "13px" }}>
              Please enter your details to sign in
            </p>
          </div>

          {/* Error Message */}
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

          <form onSubmit={handleSubmit}>
            {/* 4-Tier Role Selection Pills */}
            <div className="mb-3">
              <label className="auth-clean-label">Select Portal Role</label>
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
                    onClick={() => setRole(r.id)}
                    className={`role-pill-btn ${role === r.id ? "active" : ""}`}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Field (With Caret Tracking) */}
            <div className="auth-clean-input-group">
              <label className="auth-clean-label">Work Email</label>
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

            {/* Password Field (With Hands-Over-Eyes & Eye Peek Toggle) */}
            <div className="auth-clean-input-group">
              <label className="auth-clean-label">Password</label>
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
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password & peek"}
              >
                <i className={showPassword ? "bi bi-eye-slash-fill text-primary" : "bi bi-eye-fill"}></i>
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="d-flex align-items-center justify-content-between mb-4">
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

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="auth-submit-btn"
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Demo Credentials Bar */}
          <div className="mt-4 pt-3 border-top border-slate-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted fw-bold text-uppercase" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
                1-Click Demo Credentials
              </span>
              <span className="badge bg-slate-100 text-secondary" style={{ fontSize: "9px" }}>Quick Test</span>
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

            {/* Sign Up Link */}
            <div className="text-center mt-3 pt-1">
              <span className="text-muted small" style={{ fontSize: "12px" }}>
                Don't have an account?{" "}
              </span>
              <Link to="/signup" className="fw-bold text-dark text-decoration-none small hover-underline">
                Create Account / Sign Up
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
