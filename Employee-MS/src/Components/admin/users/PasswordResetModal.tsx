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
      label: "Admin",
      icon: "bi-person-badge",
      cls: "bg-rose-50 text-rose-700 border-rose-200",
    },
    manager: {
      label: "Manager",
      icon: "bi-briefcase",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    supervisor: {
      label: "Supervisor",
      icon: "bi-diagram-3",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    employee: {
      label: "Employee",
      icon: "bi-person",
      cls: "bg-slate-100 text-slate-700 border-slate-200",
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[780px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Flowing Wave Art Background (Top-Right) ── */}
        <div className="absolute -top-12 -right-12 w-96 h-80 pointer-events-none overflow-hidden select-none z-0">
          <svg
            viewBox="0 0 400 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Soft background glow fills */}
            <path
              d="M160 0 C240 40 320 90 380 170 C410 210 400 270 340 290 C290 300 230 260 210 200 C190 140 130 90 160 0 Z"
              fill="url(#topWaveGradA)"
              opacity="0.14"
            />
            <path
              d="M220 0 C280 60 360 110 390 190 C405 235 375 285 320 280 C265 275 225 220 210 160 C195 100 170 40 220 0 Z"
              fill="url(#topWaveGradB)"
              opacity="0.12"
            />

            {/* Fine flowing harmonic ribbon lines */}
            <path
              d="M120 0 C170 50 250 110 330 140 C380 160 410 200 400 250"
              stroke="url(#topLineGrad1)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d="M150 0 C195 55 270 115 345 150 C395 175 415 215 410 270"
              stroke="url(#topLineGrad2)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.55"
            />
            <path
              d="M180 0 C220 60 290 120 360 160 C410 190 425 230 420 290"
              stroke="url(#topLineGrad1)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.4"
            />
            <path
              d="M210 0 C245 65 310 125 375 170 C420 200 435 245 425 305"
              stroke="url(#topLineGrad2)"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.35"
            />
            <path
              d="M240 0 C270 70 330 130 390 180 C430 210 445 260 430 320"
              stroke="url(#topLineGrad1)"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.25"
            />

            <defs>
              <linearGradient id="topWaveGradA" x1="160" y1="0" x2="380" y2="290" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="topWaveGradB" x1="220" y1="0" x2="320" y2="280" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="60%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#e0e7ff" />
              </linearGradient>
              <linearGradient id="topLineGrad1" x1="120" y1="0" x2="400" y2="250" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="40%" stopColor="#8b5cf6" />
                <stop offset="80%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="topLineGrad2" x1="150" y1="0" x2="410" y2="270" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Flowing Wave Art Background (Bottom-Left) ── */}
        <div className="absolute -bottom-10 -left-10 w-96 h-72 pointer-events-none overflow-hidden select-none z-0">
          <svg
            viewBox="0 0 380 290"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Soft background glow fills */}
            <path
              d="M0 200 C60 170 120 190 180 230 C230 260 250 300 230 330 C190 350 110 320 60 300 C20 280 0 250 0 200 Z"
              fill="url(#botWaveGradA)"
              opacity="0.16"
            />
            <path
              d="M0 160 C50 140 110 165 170 210 C220 245 240 290 210 320 C160 330 90 300 40 270 C10 240 0 200 0 160 Z"
              fill="url(#botWaveGradB)"
              opacity="0.12"
            />

            {/* Fine flowing harmonic ribbon lines */}
            <path
              d="M0 240 C60 190 140 180 220 220 C270 250 310 290 320 330"
              stroke="url(#botLineGrad1)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M0 210 C70 170 155 170 235 210 C285 240 325 280 340 320"
              stroke="url(#botLineGrad2)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M0 180 C80 150 170 160 250 200 C300 230 340 270 355 310"
              stroke="url(#botLineGrad1)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.45"
            />
            <path
              d="M0 150 C90 130 185 150 265 190 C315 220 355 260 370 300"
              stroke="url(#botLineGrad2)"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.35"
            />
            <path
              d="M0 120 C100 110 200 140 280 180 C330 210 370 250 380 290"
              stroke="url(#botLineGrad1)"
              strokeWidth="0.8"
              strokeLinecap="round"
              opacity="0.25"
            />

            <defs>
              <linearGradient id="botWaveGradA" x1="0" y1="200" x2="250" y2="330" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="botWaveGradB" x1="0" y1="160" x2="240" y2="320" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="60%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#e0e7ff" />
              </linearGradient>
              <linearGradient id="botLineGrad1" x1="0" y1="240" x2="320" y2="330" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#6366f1" />
                <stop offset="80%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="botLineGrad2" x1="0" y1="210" x2="340" y2="320" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Modal Header (Icon + Title Side-by-Side in SAME Row) ── */}
        <div className="relative px-5 sm:px-6 pt-5 sm:pt-6 pb-3 flex items-start justify-between gap-3 z-10">
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

        {/* ── Main Body (Two Columns: Left Form + Right Security Guidelines) ── */}
        <form onSubmit={handleSubmit}>
          <div className="relative px-5 sm:px-6 pb-2 z-10 flex flex-col lg:flex-row gap-5 sm:gap-6">

            {/* ── LEFT COLUMN ── */}
            <div className="flex-1 min-w-0 space-y-3.5">

              {/* API Error */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Employee Details Section */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 mb-2">
                  Employee Details
                </h3>

                {/* Employee Card */}
                <div className="p-3 sm:p-3.5 rounded-xl border border-slate-200/90 bg-white flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center shrink-0 border border-indigo-200/60">
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
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5">
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

            {/* ── RIGHT COLUMN — Security Guidelines ── */}
            <div className="w-full lg:w-60 xl:w-64 shrink-0 space-y-3 pb-2 lg:border-l lg:border-slate-100 lg:pl-5">
              <h3 className="text-xs font-bold text-slate-900 mb-2">
                Security Guidelines
              </h3>

              <div className="space-y-3">
                {SECURITY_GUIDELINES.map((g) => (
                  <div key={g.icon} className="flex items-start gap-2.5">
                    {/* Icon circle */}
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 text-xs shrink-0 shadow-2xs">
                      <i className={`bi ${g.icon}`}></i>
                    </div>
                    {/* Text */}
                    <div className="min-w-0 pt-0.5">
                      <p className="text-xs font-bold text-slate-900 mb-0.5 leading-tight">
                        {g.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-normal mb-0">
                        {g.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="relative px-5 sm:px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 mt-4 bg-white/80 z-10">
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
