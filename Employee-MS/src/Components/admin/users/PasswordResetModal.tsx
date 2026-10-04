import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

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
      label: "ADMIN",
      icon: "bi-person-badge",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    },
    manager: {
      label: "MANAGER",
      icon: "bi-briefcase",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
    },
    supervisor: {
      label: "SUPERVISOR",
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

interface PasswordResetModalProps {
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[880px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Delicate Flowing Ribbon Wave (Top-Right) — No Solid Blob ── */}
        <div className="absolute top-0 right-0 w-80 h-56 pointer-events-none overflow-hidden select-none z-0 rounded-tr-3xl">
          <svg
            viewBox="0 0 320 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Very faint, transparent ribbon fill strictly following the curve */}
            <path
              d="M 110 0 C 170 35, 230 65, 320 85 L 320 185 C 295 130, 260 70, 210 0 Z"
              fill="url(#topRibbonGrad)"
              opacity="0.08"
            />

            {/* Fine flowing harmonic ribbon strands */}
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

        {/* ── Delicate Flowing Ribbon Wave (Bottom-Left) — No Solid Blob ── */}
        <div className="absolute bottom-0 left-0 w-80 h-56 pointer-events-none overflow-hidden select-none z-0 rounded-bl-3xl">
          <svg
            viewBox="0 0 320 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Very faint, transparent ribbon fill strictly following the curve */}
            <path
              d="M 0 105 C 70 125, 130 160, 210 220 L 110 220 C 65 170, 30 135, 0 195 Z"
              fill="url(#botRibbonGrad)"
              opacity="0.08"
            />

            {/* Fine flowing harmonic ribbon strands */}
            <path
              d="M 0 105 C 70 125, 130 160, 210 220"
              stroke="url(#botWaveStroke1)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M 0 125 C 65 140, 120 172, 190 220"
              stroke="url(#botWaveStroke2)"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M 0 145 C 60 155, 110 184, 170 220"
              stroke="url(#botWaveStroke1)"
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M 0 165 C 55 170, 100 196, 150 220"
              stroke="url(#botWaveStroke2)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d="M 0 185 C 50 185, 90 208, 130 220"
              stroke="url(#botWaveStroke1)"
              strokeWidth="1.0"
              strokeLinecap="round"
              opacity="0.4"
            />

            <defs>
              <linearGradient id="botRibbonGrad" x1="0" y1="105" x2="210" y2="220" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="botWaveStroke1" x1="0" y1="105" x2="210" y2="220" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#6366f1" />
                <stop offset="80%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="botWaveStroke2" x1="0" y1="125" x2="190" y2="220" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Modal Header (Icon + Title Side-by-Side in SAME Row) ── */}
        <div className="relative px-6 sm:px-8 pt-6 sm:pt-7 pb-6 flex items-start justify-between gap-3 z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Padlock Icon Box */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md shadow-indigo-600/30 shrink-0">
              <i className="bi bi-lock-fill"></i>
            </div>
            {/* Title & Subtitle */}
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug mb-0.5">
                1-Click Password Reset
              </h2>
              <p className="text-xs sm:text-[13px] text-slate-500 mb-0 truncate">
                Generate or assign a secure temporary password for the selected employee.
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold shrink-0 mt-0.5 shadow-2xs"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Main Body (Left Form + Vertical Divider + Right Security Guidelines) ── */}
        <form onSubmit={handleSubmit}>
          <div className="relative px-6 sm:px-8 pb-3 z-10 flex flex-col lg:flex-row items-stretch gap-6 sm:gap-7">

            {/* ── LEFT COLUMN ── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* API Error */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Employee Details Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2.5">
                  Employee Details
                </h3>

                {/* Employee Card */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200/90 bg-white flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-indigo-100/80 text-indigo-700 font-extrabold text-sm flex items-center justify-center shrink-0 border border-indigo-200/60">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate mb-0 leading-tight">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate mb-0.5">
                        {user.email}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium mb-0">
                        ID: {empId}
                        <span className="mx-1.5 text-slate-300">|</span>
                        <span className="capitalize">
                          {user.role
                            ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                            : "Employee"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 border ${roleCfg.cls}`}
                  >
                    <i className={`bi ${roleCfg.icon} text-[10px]`}></i>
                    {roleCfg.label}
                  </span>
                </div>
              </div>

              {/* Password Field Block */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
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
                    className="w-full h-10 px-3.5 bg-transparent outline-none font-mono text-xs sm:text-sm text-slate-900 tracking-wide"
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

                {/* Strength Bar */}
                {newPassword && (
                  <div className="flex items-center gap-1 pt-0.5">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${getSegmentColor(
                          seg,
                          strength.score
                        )}`}
                      />
                    ))}
                    <span className={`text-[11px] font-semibold ml-1.5 whitespace-nowrap ${strength.textColor}`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Email Notification Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={sendEmailNotification}
                    onChange={(e) => setSendEmailNotification(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600 shrink-0"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block leading-tight">
                      Notify employee with credentials via registered email
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      An email will be sent to{" "}
                      <span className="font-medium text-slate-700">{user.email}</span>{" "}
                      with the temporary password and instructions.
                    </span>
                  </div>
                </label>
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="bi bi-exclamation text-amber-600 text-[11px] font-black"></i>
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-900 mb-0.5 leading-tight">
                    The user will be required to update their temporary password
                  </p>
                  <p className="text-[11px] text-amber-800 mb-0">
                    upon their next session sign-in.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Continuous Vertical Thin Divider Line Between Sections ── */}
            <div className="hidden lg:block w-px bg-slate-200/80 self-stretch my-0.5"></div>

            {/* ── RIGHT COLUMN — Security Guidelines (Heading on 1 Single Line) ── */}
            <div className="w-full lg:w-[310px] xl:w-[325px] shrink-0 space-y-3.5 pb-2">
              <h3 className="text-sm font-bold text-slate-900 mb-3 whitespace-nowrap">
                Security Guidelines
              </h3>

              <div className="space-y-3.5">
                {SECURITY_GUIDELINES.map((g) => (
                  <div key={g.icon} className="flex items-center gap-3">
                    {/* Larger Icon circle */}
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-600 text-sm shrink-0 shadow-2xs">
                      <i className={`bi ${g.icon}`}></i>
                    </div>
                    {/* Text: Title and description tightly connected with no excess space */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 mb-0 leading-tight">
                        {g.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug mb-0 mt-0.5">
                        {g.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="relative px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-end gap-3 mt-4 bg-white/80 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-arrow-clockwise text-sm"></i>
                  <span>Confirm Password Reset</span>
                  <i className="bi bi-arrow-right text-xs"></i>
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
