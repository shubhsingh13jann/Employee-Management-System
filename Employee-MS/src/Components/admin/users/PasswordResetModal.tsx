import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

/* ─────────────────────────────────────────────────────────────
   Helpers & Constants (defined outside component for stability)
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

  /* ── Password generator (unchanged logic) ── */
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

  /* ── Derived values ── */
  const initials = getInitials(user.name);
  const roleCfg = getRoleBadgeCfg(user.role);
  const empId = `EMP-${String(user.id).padStart(4, "0")}`;
  const strength = getPasswordStrength(newPassword);

  /* ── Handlers ── */
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

  /* ── Render ── */
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm overscroll-contain animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Decorative SVG Wave Background (top-right) ── */}
        <div className="absolute top-0 right-0 w-80 h-72 pointer-events-none overflow-hidden rounded-tr-3xl">
          <svg
            viewBox="0 0 320 288"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M210 -10 Q295 55 315 160 Q275 215 210 192 Q145 168 168 105 Q188 42 210 -10Z"
              fill="url(#pwResetWave1)"
              opacity="0.22"
            />
            <path
              d="M255 15 Q325 95 305 210 Q283 268 218 248 Q153 228 175 148 Q196 65 255 15Z"
              fill="url(#pwResetWave2)"
              opacity="0.16"
            />
            <path
              d="M185 -25 Q270 42 292 168 Q252 228 185 208 Q118 188 142 108 Q165 25 185 -25Z"
              fill="url(#pwResetWave3)"
              opacity="0.12"
            />
            <path
              d="M280 -20 Q355 60 340 185 Q315 258 245 240 Q175 222 198 135 Q222 50 280 -20Z"
              fill="url(#pwResetWave4)"
              opacity="0.08"
            />
            <defs>
              <linearGradient id="pwResetWave1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c4b5fd" />
              </linearGradient>
              <linearGradient id="pwResetWave2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a5b4fc" />
              </linearGradient>
              <linearGradient id="pwResetWave3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#e0e7ff" />
              </linearGradient>
              <linearGradient id="pwResetWave4" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="100%" stopColor="#ede9fe" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Header ── */}
        <div className="relative px-7 sm:px-8 pt-7 sm:pt-8 pb-5 z-10">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer text-sm font-bold shadow-2xs"
            title="Close"
          >
            ✕
          </button>

          {/* Icon + Title */}
          <div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center text-white text-2xl mb-4 shadow-lg shadow-indigo-600/30"
          >
            <i className="bi bi-lock-fill"></i>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1.5 tracking-tight">
            1-Click Password Reset
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mb-0">
            Generate or assign a secure temporary password for the selected employee.
          </p>
        </div>

        {/* ── Main Body ── */}
        <form onSubmit={handleSubmit}>
          <div className="relative px-7 sm:px-8 pb-0 z-10 flex flex-col lg:flex-row gap-7 sm:gap-8">

            {/* ── LEFT COLUMN ── */}
            <div className="flex-1 min-w-0 space-y-5">

              {/* API Error */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Employee Details Section */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Employee Details
                </h3>

                {/* Employee Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center gap-4 relative shadow-xs">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-lg flex items-center justify-center shrink-0 border border-indigo-200/60">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-sm sm:text-base truncate mb-0.5">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate mb-1">
                      {user.email}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      ID: {empId}
                      <span className="mx-2 text-slate-300">|</span>
                      <span className="capitalize">
                        {user.role
                          ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                          : "Employee"}
                      </span>
                    </p>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide border shrink-0 ${roleCfg.cls}`}
                  >
                    <i className={`bi ${roleCfg.icon} text-[10px]`}></i>
                    {roleCfg.label}
                  </span>
                </div>
              </div>

              {/* Password Field Block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-800">
                    New Temporary Password{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="bi bi-arrow-repeat text-sm"></i>
                    <span>Regenerate</span>
                  </button>
                </div>

                {/* Input */}
                <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter or generate password..."
                    className="w-full h-11 px-4 bg-transparent outline-none font-mono text-sm text-slate-900 tracking-wide"
                  />
                  <div className="flex items-center gap-1.5 pr-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} text-sm`}></i>
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-0.5"></div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        copied
                          ? "bg-emerald-500 text-white shadow-sm"
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
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${getSegmentColor(
                          seg,
                          strength.score
                        )}`}
                      />
                    ))}
                    <span className={`text-xs font-semibold ml-1 whitespace-nowrap ${strength.textColor}`}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Email Notification Checkbox */}
              <div className="space-y-1.5">
                <label className="flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={sendEmailNotification}
                    onChange={(e) => setSendEmailNotification(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600 shrink-0"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800 block">
                      Notify employee with credentials via registered email
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      An email will be sent to{" "}
                      <span className="font-medium text-slate-700">{user.email}</span>{" "}
                      with the temporary password and instructions.
                    </span>
                  </div>
                </label>
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <i className="bi bi-exclamation text-amber-600 text-xs font-black"></i>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 mb-0.5">
                    The user will be required to update their temporary password
                  </p>
                  <p className="text-xs text-amber-800 mb-0">
                    upon their next session sign-in.
                  </p>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN — Security Guidelines ── */}
            <div className="w-full lg:w-72 xl:w-80 shrink-0 space-y-4 pb-7 sm:pb-8 lg:border-l lg:border-slate-100 lg:pl-8">
              <h3 className="text-sm font-bold text-slate-900">
                Security Guidelines
              </h3>

              <div className="space-y-4">
                {SECURITY_GUIDELINES.map((g) => (
                  <div key={g.icon} className="flex items-start gap-3">
                    {/* Icon circle */}
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200/90 flex items-center justify-center text-slate-600 text-sm shrink-0 shadow-2xs">
                      <i className={`bi ${g.icon}`}></i>
                    </div>
                    {/* Text */}
                    <div className="min-w-0 pt-0.5">
                      <p className="text-xs font-bold text-slate-900 mb-0.5">
                        {g.title}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-0">
                        {g.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="relative px-7 sm:px-8 py-5 border-t border-slate-100 flex items-center justify-end gap-3 mt-6 bg-white/70 backdrop-blur-2xs z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-60"
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
