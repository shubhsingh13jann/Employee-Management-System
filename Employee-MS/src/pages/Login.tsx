import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import CharacterStage from "../components/auth/CharacterStage/CharacterStage";
import RadialRevealTransition, { RevealOrigin } from "../components/common/RadialRevealTransition";
import { UserRole, AuthStatus, ActiveField } from "../components/auth/auth.types";
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

  // 1. Remember Me: Pre-fill saved email on mount
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

  // 2. Lockout Persistence: Restore countdown timer on refresh
  useEffect(() => {
    try {
      const savedLockoutUntil = localStorage.getItem("ems_lockout_until");
      if (savedLockoutUntil) {
        const expiry = Number(savedLockoutUntil);
        const diffSec = Math.ceil((expiry - Date.now()) / 1000);
        if (diffSec > 0) {
          setLockoutSeconds(diffSec);
        } else {
          localStorage.removeItem("ems_lockout_until");
        }
      }
    } catch {}
  }, []);

  // 3. Dynamic Departments: Fetch live department directory on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/api/auth/departments");
        if (res.data?.status && Array.isArray(res.data.departments) && res.data.departments.length > 0) {
          setDepartments(res.data.departments);
          setDepartmentId(String(res.data.departments[0].id));
        }
      } catch {
        // Fallback to static initial departments
      }
    };
    fetchDepartments();
  }, []);

  // Interaction & Animation States
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [caretProgress, setCaretProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [capsLockWarningVisible, setCapsLockWarningVisible] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-dismiss alert notifications after 10 seconds of dispatch
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const { login, verify2FA, resend2FA, getDefaultRouteForRole } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const formPanelRef = useRef<HTMLDivElement | null>(null);

  // Native non-passive mouse wheel listener over card area to ensure smooth scrolling without clicking first
  useEffect(() => {
    const card = cardRef.current;
    const panel = formPanelRef.current;
    if (!card || !panel) return;

    const onWheel = (e: WheelEvent) => {
      if (panel.scrollHeight > panel.clientHeight) {
        e.preventDefault();
        e.stopPropagation();
        panel.scrollTop += e.deltaY;
      }
    };

    card.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      card.removeEventListener("wheel", onWheel);
    };
  }, []);

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
            try {
              localStorage.removeItem("ems_lockout_until");
            } catch {}
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
        localStorage.removeItem("ems_lockout_until");
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
          localStorage.removeItem("ems_lockout_until");
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
          const sec = Number(remainingSec);
          setLockoutSeconds(sec);
          try {
            const expiry = Date.now() + sec * 1000;
            localStorage.setItem("ems_lockout_until", String(expiry));
          } catch {}
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
      <div className="auth-split-card" ref={cardRef}>
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
        <div
          className="auth-form-panel"
          ref={formPanelRef}
        >
          <div className="auth-form-content">
          
          {/* Sliding Pill Mode Switcher (Option 4: Seamless Switch) */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-full border border-gray-200 border-gray-200 border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`px-3 py-1 text-sm rounded-full font-bold transition-all ${
                  authMode === "login"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 border-0 bg-transparent"
                }`}
                style={{ fontSize: "11px" }}
              >
                <i className="bi bi-box-arrow-in-right mr-1"></i>
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setError("");
                  setSuccessMsg("");
                }}
                className={`px-3 py-1 text-sm rounded-full font-bold transition-all ${
                  authMode === "signup"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 border-0 bg-transparent"
                }`}
                style={{ fontSize: "11px" }}
              >
                <i className="bi bi-person-plus-fill mr-1"></i>
                <span>Create Account</span>
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-2">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={authMode}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <h3 className="font-bold text-white mb-0.5 tracking-tight" style={{ fontSize: "19px" }}>
                  {authMode === "login" ? "Welcome back!" : "Join Enterprise EMS"}
                </h3>
                <p className="text-white/60 text-sm mb-0" style={{ fontSize: "12px" }}>
                  {authMode === "login"
                    ? "Enter your credentials to access your portal"
                    : "Register your workforce account for access"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="alert-error"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700 py-1.5 px-2.5 rounded-lg text-sm flex items-center justify-between gap-2 mb-2 border-0 overflow-hidden"
                style={{ background: "#fef2f2", color: "#991b1b" }}
              >
                <div className="flex items-center gap-2">
                  <i className="bi bi-exclamation-circle-fill flex-shrink-0"></i>
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="p-0.5 text-current opacity-60 hover:opacity-100 transition-opacity text-xs leading-none shrink-0 cursor-pointer"
                  style={{ fontSize: "9px" }}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                key="alert-success"
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -6, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 py-4 rounded relative bg-green-100 border border-gray-200 border-green-400 text-green-700 py-1.5 px-2.5 rounded-lg text-sm flex items-center justify-between gap-2 mb-2 border-0 overflow-hidden"
                style={{ background: "#f0fdf4", color: "#166534" }}
              >
                <div className="flex items-center gap-2">
                  <i className="bi bi-check-circle-fill flex-shrink-0"></i>
                  <span>{successMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMsg("")}
                  className="p-0.5 text-current opacity-60 hover:opacity-100 transition-opacity text-xs leading-none shrink-0 cursor-pointer"
                  style={{ fontSize: "9px" }}
                  aria-label="Close"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Brute-force Account Lockout Alert Banner */}
          {lockoutSeconds > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg mb-2 text-center"
              style={{
                padding: "8px 12px",
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.25))",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.2)"
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                <div className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
                  <i className="bi bi-shield-lock-fill text-base"></i>
                  <span>Account Temporarily Locked</span>
                </div>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-xs font-semibold"
                  style={{
                    background: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(239, 68, 68, 0.45)",
                    color: "#fca5a5",
                    fontSize: "11.5px",
                    letterSpacing: "0.5px"
                  }}
                >
                  <i className="bi bi-stopwatch text-red-600" style={{ fontSize: "10px" }}></i>
                  {formatLockoutTime(lockoutSeconds)}
                </span>
              </div>
              <p className="text-white/60 text-sm m-0" style={{ fontSize: "11px", lineHeight: "1.2", margin: 0, padding: 0 }}>
                Too many invalid password attempts. Login is temporarily disabled.
              </p>
              <div style={{ marginTop: "4px", lineHeight: 1 }}>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || "");
                    setForgotSent(false);
                    setForgotError("");
                    setForgotModalOpen(true);
                  }}
                  className="p-0 text-white/60 hover:text-white text-sm underline transition-colors cursor-pointer inline-block"
                  style={{ fontSize: "11px", lineHeight: "1.2", verticalAlign: "baseline" }}
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
            <AnimatePresence initial={false}>
              {authMode === "signup" && (
                <motion.div
                  key="signup-avatar"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                  />

                  <div
                    className="p-2.5 rounded-lg flex items-center gap-6"
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px dashed rgba(255, 255, 255, 0.2)"
                    }}
                  >
                    {/* Clickable Circular Avatar Container */}
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
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
                        <i className="bi bi-camera-fill text-white/60 text-lg"></i>
                      )}

                      {/* Camera icon badge */}
                      <div
                        className="absolute bottom-0 right-0 rounded-full flex items-center justify-center"
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
                      <div className="flex items-center justify-between">
                        <label className="auth-clean-label mb-0" style={{ fontSize: "11px" }}>
                          Profile Picture <span className="text-white/60 font-normal">(Optional)</span>
                        </label>
                        {avatarFile && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer text-xs p-0 bg-transparent border-0"
                            style={{ fontSize: "10.5px" }}
                          >
                            <i className="bi bi-trash mr-1"></i>Remove
                          </button>
                        )}
                      </div>
                      <p className="text-slate-400 mb-1.5" style={{ fontSize: "10px", lineHeight: 1.3 }}>
                        {avatarFile ? avatarFile.name : "Upload your work photo (PNG, JPG, WEBP • Max 5MB)"}
                      </p>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 shadow-xs transition-all cursor-pointer"
                        style={{ fontSize: "11px", color: "#ffffff" }}
                      >
                        <i className="bi bi-upload" style={{ color: "#ffffff" }}></i>
                        <span style={{ color: "#ffffff" }}>{avatarFile ? "Change Image" : "Choose File"}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* If Sign Up Mode: Full Name */}
            <AnimatePresence initial={false}>
              {authMode === "signup" && (
                <motion.div
                  key="signup-fullname"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
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
            </AnimatePresence>

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
            <AnimatePresence initial={false}>
              {authMode === "signup" && (
                <motion.div
                  key="signup-dept-phone"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                  className="grid grid-cols-2 gap-4 mb-3.5"
                >
                  <div className="relative auth-clean-input-group mb-0">
                    <label className="auth-clean-label">Department</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      onFocus={() => setActiveField("dept")}
                      onBlur={() => setActiveField(null)}
                      className="auth-clean-input appearance-none pr-6 cursor-pointer"
                      style={{
                        background: "transparent",
                        color: "#ffffff"
                      }}
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id} style={{ backgroundColor: "#0f172a", color: "#ffffff" }}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-1 bottom-2 pointer-events-none text-slate-400">
                      <i className="bi bi-chevron-down text-xs"></i>
                    </div>
                    <div className="auth-input-focus-line"></div>
                  </div>

                  <div className="relative auth-clean-input-group mb-0">
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
                      onFocus={() => setActiveField("phone")}
                      onBlur={() => setActiveField(null)}
                      className="auth-clean-input"
                    />
                    <div className="auth-input-focus-line"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

              {/* Password Field (With Hands-Over-Eyes & Eye Peek Toggle) */}
              <div className="auth-clean-input-group relative">
                <div className="flex items-center justify-between mb-1">
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
                        <i className="bi bi-capslock-fill text-yellow-500"></i> Caps Lock ON
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
                <AnimatePresence initial={false}>
                  {authMode === "signup" && password.length > 0 && (
                    <motion.div
                      key="signup-password-strength"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 6 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex gap-1 flex-grow-1 mr-2" style={{ height: "3px" }}>
                        {[1, 2, 3].map((step) => {
                          const strength = getPasswordStrength(password);
                          const isActive = strength.score >= step;
                          return (
                            <div
                              key={step}
                              className="flex-grow-1 rounded-full"
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
                    </motion.div>
                  )}
                </AnimatePresence>

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
            <AnimatePresence initial={false}>
              {authMode === "signup" && (
                <motion.div
                  key="signup-confirm-password"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                  className="auth-clean-input-group relative"
                >
                  <div className="flex items-center justify-between mb-1">
                    <label className="auth-clean-label mb-0">Confirm Password *</label>
                    <div className="flex items-center gap-2">
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
                            <i className="bi bi-capslock-fill text-yellow-500"></i> Caps Lock ON
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
            </AnimatePresence>

            {/* Remember Me & Forgot Password (Only in Login Mode) */}
            <AnimatePresence initial={false}>
              {authMode === "login" && (
                <motion.div
                  key="login-remember-forgot"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  style={{ overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  className="flex items-center justify-between"
                >
                  <label
                    className="cursor-pointer select-none m-0 group"
                    style={{
                      display: "inline-flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "10px",
                      verticalAlign: "middle"
                    }}
                  >
                    <span
                      className="relative flex-shrink-0"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "16px",
                        height: "16px"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={`rounded-full transition-all duration-150 border flex items-center justify-center ${
                          rememberMe
                            ? "bg-blue-600 border-blue-500 text-white shadow-xs"
                            : "bg-slate-800/90 border-slate-500 group-hover:border-slate-300"
                        }`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: rememberMe ? "#2563eb" : "rgba(30, 41, 59, 0.9)",
                          borderColor: rememberMe ? "#3b82f6" : "#64748b"
                        }}
                      >
                        {rememberMe && (
                          <svg
                            style={{ width: "10px", height: "10px", color: "#ffffff" }}
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2.5 6L4.8 8.3L9.5 3.5" />
                          </svg>
                        )}
                      </span>
                    </span>
                    <span
                      className="text-slate-300 group-hover:text-white transition-colors select-none font-normal"
                      style={{
                        fontSize: "12px",
                        color: "#cbd5e1",
                        lineHeight: 1,
                        whiteSpace: "nowrap"
                      }}
                    >
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
                    className="p-0 border-0 bg-transparent text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer font-normal"
                    style={{ fontSize: "12px", color: "#94a3b8" }}
                  >
                    Forgot password?
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

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
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status"></span>
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

          {/* Quick-Fill Demo Credentials Bar vs Bottom Sign In Link */}
          <AnimatePresence mode="wait" initial={false}>
            {authMode === "login" ? (
              <motion.div
                key="login-demo-credentials"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="mt-2 pt-1.5 border-t border-gray-200 border-slate-100"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-white/60 font-bold uppercase" style={{ fontSize: "10px", letterSpacing: "0.5px" }}>
                    1-Click Demo Credentials
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-xs inline-flex items-center gap-1"
                    style={{ fontSize: "9px", backgroundColor: "#ffffff", color: "#0f172a" }}
                  >
                    <i className="bi bi-lightning-charge-fill text-amber-500" style={{ fontSize: "9px" }}></i>
                    Instant Fill
                  </span>
                </div>

                <div className="auth-demo-grid">
                  <button
                    type="button"
                    className="auth-demo-pill"
                    onClick={() => handleQuickFill("shubhsingh.13jan@gmail.com", "8859574934", "admin")}
                  >
                    <span>👑</span>
                    <span className="truncate">Admin (Shubh)</span>
                  </button>
                  <button
                    type="button"
                    className="auth-demo-pill"
                    onClick={() => handleQuickFill("manager@company.com", "Manager@123", "manager")}
                  >
                    <span>👔</span>
                    <span className="truncate">Manager</span>
                  </button>
                  <button
                    type="button"
                    className="auth-demo-pill"
                    onClick={() => handleQuickFill("supervisor@company.com", "Supervisor@123", "supervisor")}
                  >
                    <span>👷</span>
                    <span className="truncate">Supervisor</span>
                  </button>
                  <button
                    type="button"
                    className="auth-demo-pill"
                    onClick={() => handleQuickFill("employee@company.com", "Employee@123", "employee")}
                  >
                    <span>💼</span>
                    <span className="truncate">Employee</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="signup-login-prompt"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="text-center mt-6 pt-2 border-t border-gray-200 border-slate-100"
              >
                <span className="text-white/60 text-sm" style={{ fontSize: "12px" }}>
                  Already registered with an organization?{" "}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="font-bold text-white hover:underline ml-1 inline-block cursor-pointer bg-transparent border-0 p-0"
                  style={{ fontSize: "12px" }}
                >
                  Sign In Here →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
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
            className="fixed inset-0 w-full h-full flex items-center justify-center p-6"
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
              className="p-6 rounded-xl relative"
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
                className="p-1 text-white/60 hover:text-white text-sm transition-colors cursor-pointer absolute top-0 right-0 m-4"
                title="Close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: "14px" }}></i>
              </button>

              {!forgotSent ? (
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="rounded-lg flex items-center justify-center"
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
                      <h5 className="font-bold mb-0 text-white" style={{ fontSize: "17px" }}>
                        Reset Password
                      </h5>
                      <small className="text-white/60" style={{ fontSize: "11px" }}>
                        Enterprise Account Recovery
                      </small>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-6" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                    Enter your registered workforce email and we'll dispatch secure recovery instructions to your inbox.
                  </p>

                  {forgotError && (
                    <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700 py-1.5 px-2.5 rounded-lg text-sm mb-2 border-0" style={{ fontSize: "11.5px" }}>
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
                    <div className="auth-clean-input-group mb-6">
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

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setForgotModalOpen(false)}
                        className="w-1/2 py-2 px-4 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 transition-colors inline-flex items-center justify-center cursor-pointer"
                        style={{ fontSize: "12.5px" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-1/2 py-2 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        style={{ fontSize: "12.5px" }}
                      >
                        {forgotLoading ? (
                          <>
                            <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" />
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
                    className="mx-auto rounded-full flex items-center justify-center mb-2.5"
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
                  <h5 className="font-bold text-white mb-1" style={{ fontSize: "17px" }}>
                    Recovery Link Dispatched
                  </h5>
                  <p className="text-gray-600 text-sm mb-6" style={{ fontSize: "12px", lineHeight: 1.5 }}>
                    We have dispatched password reset instructions to <strong className="text-white">{forgotEmail}</strong>. Please check your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-full py-2 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center justify-center cursor-pointer shadow-sm"
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
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center p-6"
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
              className="p-6 rounded-xl relative"
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
                className="p-1 text-white/60 hover:text-white text-sm transition-colors cursor-pointer absolute top-0 right-0 m-4"
                title="Cancel"
              >
                <i className="bi bi-x-lg" style={{ fontSize: "14px" }}></i>
              </button>

              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className="rounded-lg flex items-center justify-center"
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
                    <h5 className="font-bold mb-0 text-white" style={{ fontSize: "18px" }}>
                      Two-Step Verification
                    </h5>
                    <small className="text-white/60" style={{ fontSize: "11px" }}>
                      Identity Verification Required
                    </small>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-6" style={{ fontSize: "12.5px", lineHeight: 1.5 }}>
                  Enter the 6-digit verification code sent to <strong className="text-white">{twoFactorData?.maskedEmail}</strong> to authorize this login.
                </p>

                {twoFactorError && (
                  <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700 py-1.5 px-2.5 rounded-lg text-sm mb-2 border-0 flex items-center gap-2" style={{ fontSize: "11.5px" }}>
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                    <span>{twoFactorError}</span>
                  </div>
                )}

                {resendSuccessMsg && (
                  <div className="px-6 py-4 rounded relative bg-green-100 border border-gray-200 border-green-400 text-green-700 py-1.5 px-2.5 rounded-lg text-sm mb-2 border-0 flex items-center gap-2" style={{ fontSize: "11.5px" }}>
                    <i className="bi bi-check-circle-fill flex-shrink-0"></i>
                    <span>{resendSuccessMsg}</span>
                  </div>
                )}

                {/* 6-Digit OTP Input Grid */}
                <div className="flex justify-between gap-1.5 my-3.5" onPaste={handleOtpPaste}>
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
                      className="text-center font-bold rounded-lg"
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

                <div className="flex items-center justify-between mb-6 text-gray-600 text-sm" style={{ fontSize: "12px" }}>
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    onClick={handleResend2FA}
                    disabled={resendCooldown > 0 || resendLoading}
                    className="p-0 text-sm font-semibold hover:underline transition-colors cursor-pointer inline-block"
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

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorOpen(false);
                      setTwoFactorData(null);
                      setSubmitting(false);
                    }}
                    className="w-1/2 py-2 px-4 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 hover:bg-slate-800/50 transition-colors inline-flex items-center justify-center cursor-pointer"
                    style={{ fontSize: "12.5px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify2FASubmit()}
                    disabled={twoFactorLoading || otpDigits.some((d) => !d)}
                    className="w-1/2 py-2 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    style={{ fontSize: "12.5px" }}
                  >
                    {twoFactorLoading ? (
                      <>
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" />
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
