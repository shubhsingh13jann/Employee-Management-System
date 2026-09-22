import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import CharacterStage from "../components/auth/CharacterStage/CharacterStage";
import RadialRevealTransition, { RevealOrigin } from "../components/common/RadialRevealTransition";
import { UserRole, AuthStatus } from "../components/auth/auth.types";
import "../components/auth/authInteractive.css";

/**
 * Unified Auth Hub: Seamlessly handles both Sign In and Sign Up
 * with the interactive character crew, caret tracking, privacy hands,
 * and interactive feedback.
 */
interface LoginProps {
  initialMode?: "login" | "signup";
}

const Login: React.FC<LoginProps> = ({ initialMode = "login" }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract radial reveal origin coordinates from navigation state (from button click)
  const locationState = location.state as { revealOrigin?: RevealOrigin } | null;
  const revealOrigin = locationState?.revealOrigin;

  // Mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<"login" | "signup">(() => {
    if (initialMode === "signup" || location.pathname.includes("signup")) {
      return "signup";
    }
    return "login";
  });

  // Lock body scroll while auth overlay is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

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
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [capsLockWarningVisible, setCapsLockWarningVisible] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, verify2FA, resend2FA, getDefaultRouteForRole } = useAuth();
  const containerRef = useRef(null);

  // 2FA Verification Modal State
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ tempToken: string; maskedEmail: string } | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(45);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccessMsg, setResendSuccessMsg] = useState("");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Brute-force Lockout Countdown State & Timer
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    let timer: any;
    if (lockoutSeconds > 0) {
      timer = setInterval(() => {
        setLockoutSeconds((prev) => {
          if (prev <= 1) {
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Profile Picture Upload State (Sign Up)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar image must be smaller than 5MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setError("Please select a valid image file (.png, .jpg, .webp).");
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setError("");
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  // 2FA Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (twoFactorOpen && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [twoFactorOpen, resendCooldown]);

  // Auto-focus first input when 2FA modal opens
  useEffect(() => {
    if (twoFactorOpen) {
      setOtpDigits(["", "", "", "", "", ""]);
      setTwoFactorError("");
      setResendSuccessMsg("");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 250);
    }
  }, [twoFactorOpen]);

  // 2FA Input Change Handler
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    const digit = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setTwoFactorError("");

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d.length === 1)) {
      handleVerify2FASubmit(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);
    setTwoFactorError("");

    const nextFocusIndex = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextFocusIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerify2FASubmit(pastedData);
    }
  };

  const handleVerify2FASubmit = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join("");
    if (code.length !== 6) {
      setTwoFactorError("Please enter the complete 6-digit verification code.");
      return;
    }
    if (!twoFactorData?.tempToken) {
      setTwoFactorError("Verification session expired. Please sign in again.");
      return;
    }

    try {
      setTwoFactorLoading(true);
      setTwoFactorError("");
      const res = await verify2FA(twoFactorData.tempToken, code);
      setAuthStatus("success");
      setTwoFactorOpen(false);

      // Remember Me persistence
      try {
        if (rememberMe) {
          localStorage.setItem("ems_remember_email", email);
        } else {
          localStorage.removeItem("ems_remember_email");
        }
      } catch {}

      setTimeout(() => {
        const targetRoute = getDefaultRouteForRole(res.user.role);
        navigate(targetRoute, { replace: true });
      }, 600);
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.error || err.message || "Invalid or expired verification code.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleResend2FA = async () => {
    if (resendCooldown > 0 || !twoFactorData?.tempToken || resendLoading) return;
    try {
      setResendLoading(true);
      setTwoFactorError("");
      const res = await resend2FA(twoFactorData.tempToken);
      if (res.status) {
        setResendSuccessMsg("A new verification code has been dispatched.");
        setResendCooldown(45);
        setTimeout(() => setResendSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      setTwoFactorError(err.response?.data?.error || "Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // Caps Lock Warning Auto-Hide
  useEffect(() => {
    let timeout: any;
    if (capsLockOn && activeField === "password") {
      setCapsLockWarningVisible(true);
      timeout = setTimeout(() => {
        setCapsLockWarningVisible(false);
      }, 4000); // 4 seconds visibility
    } else {
      setCapsLockWarningVisible(false);
    }
    return () => clearTimeout(timeout);
  }, [capsLockOn, activeField]);

  // Remember Me: Load saved email on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("ems_remember_email");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
        setCaretProgress(Math.min(savedEmail.length / 28, 1));
      }
    } catch {}
  }, []);

  // Live Password Strength Evaluator (for Sign Up mode)
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score: 1, label: "Weak", color: "#f87171" };
    if (score <= 3) return { score: 2, label: "Medium", color: "#fbbf24" };
    return { score: 3, label: "Strong", color: "#34d399" };
  };

  // Forgot Password Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

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

        if (res.requires2FA) {
          setSubmitting(false);
          setAuthStatus("idle");
          setTwoFactorData({
            tempToken: res.tempToken,
            maskedEmail: res.maskedEmail || email
          });
          setTwoFactorOpen(true);
          return;
        }

        setAuthStatus("success");

        // Remember Me persistence
        try {
          if (rememberMe) {
            localStorage.setItem("ems_remember_email", email);
          } else {
            localStorage.removeItem("ems_remember_email");
          }
        } catch {}

        setTimeout(() => {
          const targetRoute = getDefaultRouteForRole(res.user.role);
          navigate(targetRoute, { replace: true });
        }, 700);
      } catch (err: any) {
        const backendError = err.response?.data?.error || err.message || "Failed to sign in. Please verify credentials.";
        const securityAlert = err.response?.data?.securityAlertSent
          ? " (⚠️ Security warning email dispatched)"
          : "";
        const isLocked = err.response?.data?.locked;
        const remainingSec = err.response?.data?.remainingSeconds;
        if (isLocked && remainingSec) {
          setLockoutSeconds(Number(remainingSec));
        }
        setError(backendError + securityAlert);
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

        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("email", email.trim());
        formData.append("password", password);
        formData.append("role", role);
        formData.append("department_id", String(Number(departmentId) || 1));
        if (phone) formData.append("phone", phone);
        if (address) formData.append("address", address);
        if (avatarFile) formData.append("image", avatarFile);

        const res = await api.post("/api/auth/register", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (res.data.status) {
          setAuthStatus("success");
          setSuccessMsg("Account created successfully! Switching you to Sign In...");
          setAvatarFile(null);
          if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
            setAvatarPreview(null);
          }
          setTimeout(() => {
            setAuthMode("login");
            setSuccessMsg("");
            setAuthStatus("idle");
          }, 1500);
        }
      } catch (err: any) {
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

  return (
    <RadialRevealTransition
      origin={revealOrigin}
      role={role}
      onClose={() => navigate("/")}
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`auth-split-wrapper position-relative theme-${role}`}
      >


      {/* MASTER 2-PANEL SPLIT CARD */}
      <div className="auth-split-card">
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
          <div className="d-flex justify-content-center mb-2">
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
                style={{ fontSize: "11px" }}
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
                style={{ fontSize: "11px" }}
              >
                <i className="bi bi-person-plus-fill me-1"></i>
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-2">
            <h3 className="fw-bold text-white mb-0.5 tracking-tight" style={{ fontSize: "19px" }}>
              {authMode === "login" ? "Welcome back!" : "Join Enterprise EMS"}
            </h3>
            <p className="text-white-50 small mb-0" style={{ fontSize: "12px" }}>
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
              className="alert alert-danger py-1.5 px-2.5 rounded-3 small d-flex align-items-center gap-2 mb-2 border-0"
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
              className="alert alert-success py-1.5 px-2.5 rounded-3 small d-flex align-items-center gap-2 mb-2 border-0"
              style={{ background: "#f0fdf4", color: "#166534" }}
            >
              <i className="bi bi-check-circle-fill"></i>
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Brute-force Account Lockout Alert Banner */}
          {lockoutSeconds > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-2.5 rounded-3 mb-2.5 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.2)"
              }}
            >
              <div className="d-flex align-items-center justify-content-center gap-2 mb-1 flex-wrap">
                <div className="d-flex align-items-center gap-1.5 text-danger fw-bold small">
                  <i className="bi bi-shield-lock-fill fs-6"></i>
                  <span>Account Temporarily Locked</span>
                </div>
                <span
                  className="badge d-inline-flex align-items-center gap-1 px-2 py-0.5 rounded-pill font-monospace"
                  style={{
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(239, 68, 68, 0.45)",
                    color: "#fca5a5",
                    fontSize: "11.5px",
                    letterSpacing: "0.5px"
                  }}
                >
                  <i className="bi bi-stopwatch text-danger" style={{ fontSize: "10px" }}></i>
                  {formatLockoutTime(lockoutSeconds)}
                </span>
              </div>
              <p className="text-white-50 small mb-1.5" style={{ fontSize: "11px" }}>
                Too many invalid password attempts. Login is temporarily disabled.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || "");
                    setForgotSent(false);
                    setForgotError("");
                    setForgotModalOpen(true);
                  }}
                  className="btn btn-link p-0 text-white-50 small text-decoration-underline"
                  style={{ fontSize: "11px" }}
                >
                  Forgot password? Recover account
                </button>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 4-Tier Role Selection Pills */}
            <div className="auth-role-selection-group mb-2.5">
              <label className="auth-clean-label mb-1.5">Select Role Tier</label>
              <div className="role-pills-grid">
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

            {/* If Sign Up Mode: Avatar Upload with Live Circular Preview */}
            {authMode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2.5"
              >
                <input
                  type="file"
                  ref={avatarInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />

                <div
                  className="p-2.5 rounded-3 d-flex align-items-center gap-3"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px dashed rgba(255, 255, 255, 0.2)"
                  }}
                >
                  {/* Clickable Circular Avatar Container */}
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="position-relative rounded-circle d-flex align-items-center justify-content-center cursor-pointer flex-shrink-0"
                    style={{
                      width: "56px",
                      height: "56px",
                      background: avatarPreview ? "#0f172a" : "rgba(255, 255, 255, 0.08)",
                      border: "2px solid rgba(255, 255, 255, 0.25)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                      overflow: "hidden"
                    }}
                    title="Click to choose profile picture"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <i className="bi bi-camera-fill text-white-50 fs-5"></i>
                    )}

                    {/* Camera icon badge */}
                    <div
                      className="position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: "18px",
                        height: "18px",
                        background: "#3b82f6",
                        color: "#ffffff",
                        fontSize: "9px",
                        border: "1.5px solid #0f172a"
                      }}
                    >
                      <i className="bi bi-pencil-fill"></i>
                    </div>
                  </div>

                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                      <label className="auth-clean-label mb-0" style={{ fontSize: "11px" }}>
                        Profile Picture <span className="text-white-50 fw-normal">(Optional)</span>
                      </label>
                      {avatarFile && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="btn btn-link p-0 text-danger small text-decoration-none"
                          style={{ fontSize: "10.5px" }}
                        >
                          <i className="bi bi-trash me-1"></i>Remove
                        </button>
                      )}
                    </div>
                    <p className="text-white-50 mb-1.5" style={{ fontSize: "10px", lineHeight: 1.3 }}>
                      {avatarFile ? avatarFile.name : "Upload your work photo (PNG, JPG, WEBP • Max 5MB)"}
                    </p>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="btn btn-sm btn-outline-light py-0.5 px-2.5 rounded-2"
                      style={{ fontSize: "10.5px", borderColor: "rgba(255, 255, 255, 0.25)" }}
                    >
                      <i className="bi bi-upload me-1"></i>
                      {avatarFile ? "Change Image" : "Choose File"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

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
                  <label className="auth-clean-label">Phone (+91)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      let num = digits.startsWith("91") ? digits.slice(2) : digits;
                      num = num.slice(0, 10);
                      if (!num) {
                        setPhone("");
                      } else if (num.length <= 5) {
                        setPhone(`+91 ${num}`);
                      } else {
                        setPhone(`+91 ${num.slice(0, 5)} ${num.slice(5)}`);
                      }
                    }}
                    className="auth-clean-input py-1"
                    style={{ fontSize: "12.5px" }}
                  />
                </div>
              </motion.div>
            )}

              {/* Password Field (With Hands-Over-Eyes & Eye Peek Toggle) */}
              <div className="auth-clean-input-group position-relative">
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="auth-clean-label mb-0">Password *</label>
                  <AnimatePresence>
                    {capsLockWarningVisible && (
                      <motion.div
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "#f8fafc",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "9999px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <i className="bi bi-capslock-fill text-warning"></i> Caps Lock ON
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="            "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onFocus={() => {
                    setActiveField("password");
                  }}
                  onBlur={() => setActiveField(null)}
                  className="auth-clean-input"
                />
                <div className="auth-input-focus-line"></div>

                {/* Real-time Password Strength Meter (Only in Sign Up Mode) */}
                {authMode === "signup" && password.length > 0 && (
                  <div className="mt-1.5 d-flex align-items-center justify-content-between">
                    <div className="d-flex gap-1 flex-grow-1 me-2" style={{ height: "3px" }}>
                      {[1, 2, 3].map((step) => {
                        const strength = getPasswordStrength(password);
                        const isActive = strength.score >= step;
                        return (
                          <div
                            key={step}
                            className="flex-grow-1 rounded-pill"
                            style={{
                              background: isActive ? strength.color : "rgba(255, 255, 255, 0.15)",
                              transition: "background 0.25s ease"
                            }}
                          />
                        );
                      })}
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        color: getPasswordStrength(password).color
                      }}
                    >
                      {getPasswordStrength(password).label}
                    </span>
                  </div>
                )}

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
                className="auth-clean-input-group position-relative"
              >
                <div className="d-flex align-items-center justify-content-between mb-1">
                  <label className="auth-clean-label mb-0">Confirm Password *</label>
                  <div className="d-flex align-items-center gap-2">
                    {confirmPassword.length > 0 && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          color: confirmPassword === password ? "#34d399" : "#f87171"
                        }}
                      >
                        {confirmPassword === password ? "✓ Match" : "✗ Do not match"}
                      </span>
                    )}
                    <AnimatePresence>
                      {capsLockWarningVisible && (
                        <motion.div
                          initial={{ opacity: 0, x: 5 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 5 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            color: "#f8fafc",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            fontSize: "10px",
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                        >
                          <i className="bi bi-capslock-fill text-warning"></i> Caps Lock ON
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onFocus={() => {
                    setActiveField("password");
                  }}
                  onBlur={() => setActiveField(null)}
                  className="auth-clean-input"
                />
                <div className="auth-input-focus-line"></div>
              </motion.div>
            )}

            {/* Remember Me & Forgot Password (Only in Login Mode) */}
            {authMode === "login" && (
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="d-flex align-items-center gap-2 cursor-pointer m-0">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="form-check-input mt-0 rounded"
                    style={{ width: "14px", height: "14px" }}
                  />
                  <span className="text-secondary small" style={{ fontSize: "11.5px" }}>
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || "");
                    setForgotSent(false);
                    setForgotError("");
                    setForgotModalOpen(true);
                  }}
                  className="btn btn-link p-0 text-decoration-none small text-secondary"
                  style={{ fontSize: "11.5px" }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={submitting || (authMode === "login" && lockoutSeconds > 0)}
              className={`auth-submit-btn mt-1.5 theme-${role}`}
              style={{
                opacity: authMode === "login" && lockoutSeconds > 0 ? 0.6 : 1,
                cursor: authMode === "login" && lockoutSeconds > 0 ? "not-allowed" : "pointer"
              }}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>{authMode === "login" ? "Verifying..." : "Creating Account..."}</span>
                </>
              ) : authMode === "login" && lockoutSeconds > 0 ? (
                <>
                  <i className="bi bi-shield-lock-fill"></i>
                  <span>Account Locked ({formatLockoutTime(lockoutSeconds)})</span>
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
            <div className="mt-2 pt-1.5 border-top border-slate-100">
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <span className="text-white-50 fw-bold text-uppercase" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
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
              <span className="text-white-50 small" style={{ fontSize: "12px" }}>
                Already registered with an organization?{" "}
              </span>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="btn btn-link p-0 fw-bold text-white text-decoration-none small hover-underline"
              >
                Sign In Here →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          MODERN GLASSMORPHIC FORGOT PASSWORD MODAL
          ============================================================ */}
      <AnimatePresence>
        {forgotModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="position-fixed inset-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{
              zIndex: 99999,
              background: "rgba(3, 7, 18, 0.75)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              pointerEvents: "auto"
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setForgotModalOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="p-4 rounded-4 position-relative"
              style={{
                maxWidth: "420px",
                width: "100%",
                background: "rgba(15, 23, 42, 0.92)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
                color: "#ffffff"
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="btn btn-sm btn-link text-white-50 p-1 position-absolute top-0 end-0 m-3"
                title="Close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: "14px" }}></i>
              </button>

              {!forgotSent ? (
                <div>
                  <div className="d-flex align-items-center gap-2.5 mb-2">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: "38px",
                        height: "38px",
                        background: "rgba(59, 130, 246, 0.15)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        color: "#60a5fa"
                      }}
                    >
                      <i className="bi bi-key-fill" style={{ fontSize: "18px" }}></i>
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0 text-white" style={{ fontSize: "17px" }}>
                        Reset Password
                      </h5>
                      <small className="text-white-50" style={{ fontSize: "11px" }}>
                        Enterprise Account Recovery
                      </small>
                    </div>
                  </div>

                  <p className="text-secondary small mb-3" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                    Enter your registered workforce email and we'll dispatch secure recovery instructions to your inbox.
                  </p>

                  {forgotError && (
                    <div className="alert alert-danger py-1.5 px-2.5 rounded-3 small mb-2 border-0" style={{ fontSize: "11.5px" }}>
                      {forgotError}
                    </div>
                  )}

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!forgotEmail.trim()) {
                        setForgotError("Please enter your work email.");
                        return;
                      }
                      try {
                        setForgotLoading(true);
                        setForgotError("");
                        const res = await api.post("/api/auth/forgot-password", { email: forgotEmail.trim() });
                        if (res.data.status) {
                          setForgotSent(true);
                        }
                      } catch (err: any) {
                        setForgotError(err.response?.data?.error || "Failed to dispatch recovery link.");
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                  >
                    <div className="auth-clean-input-group mb-3">
                      <label className="auth-clean-label">Work Email</label>
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="auth-clean-input"
                        autoFocus
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(false)}
                        className="btn btn-sm btn-outline-secondary w-50 rounded-3 text-white border-secondary"
                        style={{ fontSize: "12.5px" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="btn btn-sm btn-primary w-50 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-1.5"
                        style={{ fontSize: "12.5px" }}
                      >
                        {forgotLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Link</span>
                            <i className="bi bi-send-fill" style={{ fontSize: "11px" }} />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="text-center py-2">
                  <div
                    className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-2.5"
                    style={{
                      width: "50px",
                      height: "50px",
                      background: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      color: "#34d399",
                      fontSize: "24px"
                    }}
                  >
                    <i className="bi bi-check-lg"></i>
                  </div>
                  <h5 className="fw-bold text-white mb-1" style={{ fontSize: "17px" }}>
                    Recovery Link Dispatched
                  </h5>
                  <p className="text-secondary small mb-3" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                    We have dispatched password reset instructions to <strong className="text-white">{forgotEmail}</strong>. Please check your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="btn btn-sm btn-primary w-100 rounded-3 fw-bold"
                    style={{ fontSize: "12.5px" }}
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* ============================================================
            TWO-STEP VERIFICATION (2FA / OTP) MODAL
            ============================================================ */}
        {twoFactorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{
              background: "rgba(11, 17, 32, 0.78)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              zIndex: 1000,
              pointerEvents: "auto"
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="p-4 rounded-4 position-relative"
              style={{
                maxWidth: "440px",
                width: "100%",
                background: "rgba(15, 23, 42, 0.94)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1) inset",
                color: "#ffffff"
              }}
            >
              {/* Close / Cancel Button */}
              <button
                type="button"
                onClick={() => {
                  setTwoFactorOpen(false);
                  setTwoFactorData(null);
                  setSubmitting(false);
                }}
                className="btn btn-sm btn-link text-white-50 p-1 position-absolute top-0 end-0 m-3"
                title="Cancel"
              >
                <i className="bi bi-x-lg" style={{ fontSize: "14px" }}></i>
              </button>

              <div>
                <div className="d-flex align-items-center gap-2.5 mb-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: "42px",
                      height: "42px",
                      background: "rgba(99, 102, 241, 0.18)",
                      border: "1px solid rgba(99, 102, 241, 0.35)",
                      color: "#818cf8"
                    }}
                  >
                    <i className="bi bi-shield-lock-fill" style={{ fontSize: "20px" }}></i>
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-white" style={{ fontSize: "18px" }}>
                      Two-Step Verification
                    </h5>
                    <small className="text-white-50" style={{ fontSize: "11px" }}>
                      Identity Verification Required
                    </small>
                  </div>
                </div>

                <p className="text-secondary small mb-3" style={{ fontSize: "12.5px", lineHeight: 1.5 }}>
                  Enter the 6-digit verification code sent to <strong className="text-white">{twoFactorData?.maskedEmail}</strong> to authorize this login.
                </p>

                {twoFactorError && (
                  <div className="alert alert-danger py-1.5 px-2.5 rounded-3 small mb-2 border-0 d-flex align-items-center gap-2" style={{ fontSize: "11.5px" }}>
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                    <span>{twoFactorError}</span>
                  </div>
                )}

                {resendSuccessMsg && (
                  <div className="alert alert-success py-1.5 px-2.5 rounded-3 small mb-2 border-0 d-flex align-items-center gap-2" style={{ fontSize: "11.5px" }}>
                    <i className="bi bi-check-circle-fill flex-shrink-0"></i>
                    <span>{resendSuccessMsg}</span>
                  </div>
                )}

                {/* 6-Digit OTP Input Grid */}
                <div className="d-flex justify-content-between gap-1.5 my-3.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="text-center fw-bold rounded-3"
                      style={{
                        width: "50px",
                        height: "56px",
                        fontSize: "24px",
                        background: "rgba(30, 41, 59, 0.8)",
                        color: "#ffffff",
                        border: digit ? "1.5px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.15)",
                        outline: "none",
                        boxShadow: digit ? "0 0 12px rgba(99, 102, 241, 0.35)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    />
                  ))}
                </div>

                <div className="d-flex align-items-center justify-content-between mb-3 text-secondary small" style={{ fontSize: "12px" }}>
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResend2FA}
                    disabled={resendCooldown > 0 || resendLoading}
                    className="btn btn-sm btn-link p-0 text-decoration-none fw-semibold"
                    style={{
                      fontSize: "12px",
                      color: resendCooldown > 0 ? "#64748b" : "#818cf8"
                    }}
                  >
                    {resendLoading ? (
                      <span>Sending...</span>
                    ) : resendCooldown > 0 ? (
                      <span>Resend in {resendCooldown}s</span>
                    ) : (
                      <span>Resend Code</span>
                    )}
                  </button>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorOpen(false);
                      setTwoFactorData(null);
                      setSubmitting(false);
                    }}
                    className="btn btn-sm btn-outline-secondary w-50 rounded-3 text-white border-secondary"
                    style={{ fontSize: "12.5px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify2FASubmit()}
                    disabled={twoFactorLoading || otpDigits.some((d) => !d)}
                    className="btn btn-sm btn-primary w-50 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-1.5"
                    style={{ fontSize: "12.5px" }}
                  >
                    {twoFactorLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <i className="bi bi-arrow-right-short" style={{ fontSize: "16px" }} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </RadialRevealTransition>
  );
};

export default Login;
