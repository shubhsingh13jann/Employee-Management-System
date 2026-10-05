import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../../api/axios";
import "./PasswordResetModal.css";

/* ─────────────────────────────────────────────────────────────
   Helpers & Constants
   ───────────────────────────────────────────────────────────── */

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const getPasswordStrength = (
  pwd: string
): { score: number; label: string; textColor: string } => {
  if (!pwd) return { score: 0, label: "", textColor: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const capped = Math.min(4, score);
  const labels = ["", "Weak", "Fair", "Good", "Strong password"];
  const textColors = [
    "",
    "text-rose-600",
    "text-amber-500",
    "text-emerald-500",
    "text-emerald-600",
  ];
  return { score: capped, label: labels[capped], textColor: textColors[capped] };
};

const getSegmentColor = (seg: number, score: number): string => {
  if (seg > score) return "bg-slate-200";
  if (score === 1) return "bg-rose-400";
  if (score === 2) return "bg-amber-400";
  return "bg-emerald-500";
};

const getRoleBadgeCfg = (
  role?: string
): { label: string; icon: string; cls: string } => {
  const map: Record<string, { label: string; icon: string; cls: string }> = {
    admin: {
      label: "EMPLOYEE",
      icon: "bi-person-badge",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    },
    manager: {
      label: "EMPLOYEE",
      icon: "bi-briefcase",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    },
    supervisor: {
      label: "EMPLOYEE",
      icon: "bi-diagram-3",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    },
    employee: {
      label: "EMPLOYEE",
      icon: "bi-person",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    },
  };
  return map[(role || "").toLowerCase()] ?? map.employee;
};

const SECURITY_GUIDELINES = [
  {
    icon: "bi-shield-check",
    title: "Secure & Temporary",
    desc: "Passwords are randomly generated and comply with company security policy.",
  },
  {
    icon: "bi-key",
    title: "Minimum 8 characters",
    desc: "Includes letters, numbers and symbols.",
  },
  {
    icon: "bi-clock",
    title: "Expires after first login",
    desc: "User must create a new password on next sign-in.",
  },
  {
    icon: "bi-envelope",
    title: "Email notification",
    desc: "Credentials and instructions will be sent automatically.",
  },
  {
    icon: "bi-shield-lock",
    title: "Logged for security",
    desc: "This action will be recorded in the audit trail.",
  },
] as const;

/* ─────────────────────────────────────────────────────────────
   Props Interface
   ───────────────────────────────────────────────────────────── */

export interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
  } | null;
}

/* ─────────────────────────────────────────────────────────────
   Component
   ───────────────────────────────────────────────────────────── */

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const generateStrongPassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateStrongPassword();
      setErrorMsg("");
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const initials = getInitials(user.name);
  const roleCfg = getRoleBadgeCfg(user.role);
  const empId = `EMP-${String(user.id).padStart(4, "0")}`;
  const strength = getPasswordStrength(newPassword);

  const handleCopy = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.put(`/api/admin/users/${user.id}`, {
        password: newPassword,
        require_password_change: true,
        sendEmailNotification,
      });
      if (res.data.status) {
        onSuccess(
          `Password for ${user.name} reset successfully.${
            sendEmailNotification
              ? " Temporary credentials dispatched to " + user.email + "."
              : ""
          }`
        );
        onClose();
      }
    } catch (err: any) {
      console.error("Reset password error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[760px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Delicate Flowing Ribbon Wave (Top-Right) ── */}
        <div className="absolute top-0 right-0 w-80 h-56 pointer-events-none overflow-hidden select-none z-0 rounded-tr-3xl">
          <svg
            viewBox="0 0 320 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <path
              d="M 110 0 C 170 35, 230 65, 320 85 L 320 185 C 295 130, 260 70, 210 0 Z"
              fill="url(#topRibbonGrad)"
              opacity="0.08"
            />
            <path
              d="M 110 0 C 170 35, 230 65, 320 85"
              stroke="url(#topWaveStroke1)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M 130 0 C 185 40, 245 72, 320 102"
              stroke="url(#topWaveStroke2)"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M 150 0 C 200 46, 260 80, 320 120"
              stroke="url(#topWaveStroke1)"
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M 170 0 C 215 52, 275 88, 320 138"
              stroke="url(#topWaveStroke2)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d="M 190 0 C 230 58, 290 96, 320 156"
              stroke="url(#topWaveStroke1)"
              strokeWidth="1.0"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              d="M 210 0 C 245 64, 305 104, 320 174"
              stroke="url(#topWaveStroke2)"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.35"
            />
            <defs>
              <linearGradient id="topRibbonGrad" x1="110" y1="0" x2="320" y2="185" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="60%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <linearGradient id="topWaveStroke1" x1="110" y1="0" x2="320" y2="174" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="45%" stopColor="#8b5cf6" />
                <stop offset="85%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="topWaveStroke2" x1="130" y1="0" x2="320" y2="174" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── High-Visibility Flowing Ribbon Wave (Bottom-Left - Fully flush to corner boundaries) ── */}
        <div className="absolute -bottom-1 -left-2 w-[460px] sm:w-[500px] h-20 sm:h-24 pointer-events-none select-none z-0">
          <svg
            viewBox="-30 0 530 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Soft translucent purple ribbon wave sweeping across */}
            <path
              d="M -30 15 C 80 25, 160 55, 250 70 C 330 80, 410 90, 490 100 L -30 100 Z"
              fill="url(#botRibbonGrad)"
              opacity="0.10"
            />
            {/* Mid-blue ribbon fold with dynamic satin curve */}
            <path
              d="M -30 35 C 60 42, 120 65, 180 82 C 220 95, 260 100, 310 100 L 190 100 C 140 90, 90 70, -30 55 Z"
              fill="url(#botBlueFoldGrad)"
              opacity="0.16"
            />
            {/* Flowing harmonic bezier line array */}
            <path
              d="M -30 15 C 85 25, 170 55, 260 70 C 340 80, 420 90, 500 100"
              stroke="url(#botWaveStroke1)"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d="M -30 24 C 75 32, 150 58, 230 74 C 310 86, 390 94, 460 100"
              stroke="url(#botWaveStroke2)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.65"
            />
            <path
              d="M -30 34 C 68 40, 135 63, 205 79 C 275 91, 350 96, 420 100"
              stroke="url(#botWaveStroke1)"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M -30 45 C 60 50, 120 68, 180 84 C 245 95, 315 98, 380 100"
              stroke="url(#botWaveStroke2)"
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M -30 57 C 52 61, 105 74, 158 88 C 215 97, 275 100, 340 100"
              stroke="url(#botWaveStroke1)"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              d="M -30 70 C 45 73, 90 81, 136 91 C 185 98, 235 100, 290 100"
              stroke="url(#botWaveStroke2)"
              strokeWidth="1.0"
              strokeLinecap="round"
              opacity="0.35"
            />
            <path
              d="M -30 84 C 38 85, 75 90, 115 95 C 155 99, 195 100, 240 100"
              stroke="url(#botWaveStroke1)"
              strokeWidth="0.9"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Delicate subtle glow particle accents */}
            <circle cx="200" cy="65" r="3.5" fill="#818cf8" opacity="0.3" />
            <circle cx="258" cy="80" r="3" fill="#60a5fa" opacity="0.35" />
            <circle cx="150" cy="55" r="2" fill="#c084fc" opacity="0.25" />
            <defs>
              <linearGradient id="botRibbonGrad" x1="0" y1="15" x2="490" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <linearGradient id="botBlueFoldGrad" x1="0" y1="35" x2="310" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="40%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="botWaveStroke1" x1="0" y1="15" x2="500" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#6366f1" />
                <stop offset="70%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="botWaveStroke2" x1="0" y1="24" x2="460" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="45%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Modal Header (Icon + Title + Subtitle Side-by-Side in SAME Row) ── */}
        <div className="relative px-5 sm:px-6 pt-5 sm:pt-6 pb-2 flex items-start justify-between gap-4 z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Padlock Icon Box */}
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md shadow-indigo-600/30 shrink-0">
              <i className="bi bi-lock-fill"></i>
            </div>
            {/* Title & Subtitle with increased font sizes */}
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight leading-snug mb-0.5">
                1-Click Password Reset
              </h2>
              <p className="text-sm text-slate-500 mb-0 font-normal">
                Generate or assign a secure temporary password for the selected employee.
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold shrink-0 mt-0.5 shadow-2xs"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Main Body (Exact 70% Left : 30% Right Ratio with Compact Gap) ── */}
        <form onSubmit={handleSubmit}>
          <div className="relative px-5 sm:px-6 pt-4 pb-2 z-10 flex flex-col lg:flex-row items-stretch gap-3.5 sm:gap-4">

            {/* ── LEFT COLUMN (70% of Content Split) ── */}
            <div className="w-full lg:w-[68%] lg:flex-[7] min-w-0 space-y-3.5">

              {/* API Error */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Employee Details Section */}
              <div data-section="employee-details">
                <div
                  style={{ fontSize: "16px", marginBottom: "14px" }}
                  className="password-reset-heading font-bold text-slate-900 tracking-tight"
                >
                  Employee Details
                </div>

                {/* Employee Card */}
                <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Large Avatar covering the 3 lines cleanly */}
                    <div className="w-14 h-14 rounded-full bg-indigo-100/90 text-indigo-700 font-extrabold text-lg flex items-center justify-center shrink-0 border border-indigo-200/80 shadow-2xs">
                      {initials}
                    </div>

                    {/* 3 Lines: Identical equal gap between 1st & 2nd and 2nd & 3rd lines */}
                    <div className="flex flex-col justify-center min-w-0 py-0.5 space-y-1">
                      <p className="font-bold text-slate-900 text-sm leading-tight mb-0">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight mb-0">
                        {user.email}
                      </p>
                      <p className="text-xs text-slate-400 font-medium leading-tight mb-0 flex items-center">
                        <span>ID: {empId}</span>
                        <span className="mx-1.5 text-slate-300">|</span>
                        <span className="capitalize">
                          {user.role
                            ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                            : "Employee"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Role Badge Capsule */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 border ${roleCfg.cls}`}
                  >
                    <i className={`bi ${roleCfg.icon} text-xs`}></i>
                    {roleCfg.label}
                  </span>
                </div>
              </div>

              {/* Password Field Block */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-[13px] font-bold text-slate-800">
                    New Temporary Password{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <i className="bi bi-arrow-repeat text-xs"></i>
                    <span>Regenerate</span>
                  </button>
                </div>

                {/* Input with Eye & Copy controls */}
                <div className="relative flex items-center rounded-xl bg-slate-50/70 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter or generate password..."
                    className="w-full h-10 px-3 bg-transparent outline-none font-mono text-sm text-slate-900 tracking-wide"
                  />
                  <div className="flex items-center gap-1 pr-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} text-xs`}></i>
                    </button>
                    {/* Vertical Divider */}
                    <div className="w-px h-4 bg-slate-200 mx-0.5"></div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                        copied
                          ? "bg-emerald-500 text-white shadow-2xs"
                          : "bg-indigo-50/90 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/80 shadow-2xs"
                      }`}
                      title="Copy password to clipboard"
                    >
                      <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"} text-xs`}></i>
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Strength Bar (Compact width segments) */}
                {newPassword && (
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1 w-8 sm:w-9 rounded-full transition-all duration-300 ${getSegmentColor(
                          seg,
                          strength.score
                        )}`}
                      />
                    ))}
                    <span className={`text-xs font-semibold ml-2 whitespace-nowrap ${strength.textColor}`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Email Notification Checkbox */}
              <div className="space-y-1 select-none">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="notify-email-checkbox"
                    checked={sendEmailNotification}
                    onChange={(e) => setSendEmailNotification(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600 shrink-0 m-0"
                  />
                  <label
                    htmlFor="notify-email-checkbox"
                    className="text-xs sm:text-[13px] font-semibold text-slate-800 cursor-pointer mb-0 select-none whitespace-nowrap leading-none"
                  >
                    Notify employee with credentials via registered email
                  </label>
                </div>
                <p className="text-xs text-slate-500 mb-0 leading-normal pl-[26px]">
                  An email will be sent to{" "}
                  <span className="font-semibold text-slate-700">{user.email}</span>{" "}
                  with the temporary password and instructions.
                </p>
              </div>

              {/* Warning Notice (Heading in one line, tight spacing between the two lines) */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="bi bi-exclamation text-amber-600 text-xs font-black"></i>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-[13px] font-bold text-amber-900 leading-tight mb-0 whitespace-nowrap">
                    The user will be required to update their temporary password
                  </p>
                  <p className="text-xs text-amber-800 leading-tight mb-0 mt-0.5">
                    upon their next session sign-in.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Continuous Vertical Thin Divider Line Between Sections ── */}
            <div className="hidden lg:block w-px bg-slate-200/80 self-stretch my-0.5 shrink-0"></div>

            {/* ── RIGHT COLUMN — Security Guidelines (30% of Content Split) ── */}
            <div
              data-section="security-guidelines"
              className="w-full lg:w-[31%] lg:flex-[3] shrink-0 min-w-0 space-y-3.5 pb-2"
            >
              <div
                style={{ fontSize: "16px", marginBottom: "14px" }}
                className="password-reset-heading font-bold text-slate-900 whitespace-nowrap tracking-tight"
              >
                Security Guidelines
              </div>

              <div className="space-y-3.5">
                {SECURITY_GUIDELINES.map((g) =>(
                  <div key={g.icon} className="flex items-start gap-2.5">
                    {/* Icon circle */}
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-600 text-xs shrink-0 shadow-2xs mt-0.5">
                      <i className={`bi ${g.icon}`}></i>
                    </div>
                    {/* Text: Title and description tightly connected with increased legibility */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-slate-900 mb-0 leading-tight">
                        {g.title}
                      </p>
                      <p className="text-xs text-slate-500 leading-snug mb-0 mt-0.5">
                        {g.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="relative px-5 sm:px-6 py-3.5 border-t border-slate-100/70 flex items-center justify-end gap-3 mt-3 bg-transparent z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 px-5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-6 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise text-base"></i>
                  <span>Confirm Password Reset</span>
                  <i className="bi bi-arrow-right text-sm"></i>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default PasswordResetModal;
