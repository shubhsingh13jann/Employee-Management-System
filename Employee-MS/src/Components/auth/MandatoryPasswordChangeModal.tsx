import React, { useState } from "react";
import { createPortal } from "react-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface MandatoryPasswordChangeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const MandatoryPasswordChangeModal: React.FC<MandatoryPasswordChangeModalProps> = ({
  isOpen,
  onSuccess
}) => {
  const { user, logout } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-slate-200", textColor: "text-slate-400" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500", textColor: "text-rose-500" };
    if (score <= 3) return { score: 2, label: "Medium", color: "bg-amber-500", textColor: "text-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify both fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/auth/change-temp-password", {
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim()
      });

      if (res.data.status) {
        setSuccessMsg("Permanent password established successfully! Unlocking workspace...");
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setErrorMsg(res.data.error || "Failed to update temporary password.");
      }
    } catch (err: any) {
      console.error("Change temp password error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to update temporary password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Laser Top Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600"></div>

        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center gap-3.5 border-b border-indigo-900/40">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 text-xl shadow-inner shrink-0">
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight mb-0.5">
              Action Required: Set New Password
            </h3>
            <p className="text-xs text-indigo-200/80 mb-0">
              Temporary credentials detected for your account
            </p>
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Informational Banner */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5">
            <i className="bi bi-info-circle-fill text-amber-600 text-sm shrink-0 mt-0.5"></i>
            <div>
              <p className="font-semibold text-amber-950 mb-0.5">
                Temporary Password Expired Upon Sign-In
              </p>
              <p className="mb-0 text-amber-800">
                Your administrator issued a temporary password for <strong>{user?.name || user?.email}</strong>. For your privacy and security, you must establish your own permanent password to proceed.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <i className="bi bi-check-circle-fill shrink-0 text-emerald-600"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* New Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              New Permanent Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong password (min 6 chars)"
                className="w-full h-10 px-3.5 bg-transparent outline-none text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="w-9 h-10 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>

            {/* Password Strength Meter */}
            {newPassword && (
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Strength:</span>
                  <span className={`font-bold ${strength.textColor}`}>{strength.label}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : "bg-slate-200"} w-1/3`}></div>
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : "bg-slate-200"} w-1/3`}></div>
                  <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : "bg-slate-200"} w-1/3`}></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new permanent password"
                className="w-full h-10 px-3.5 bg-transparent outline-none text-xs text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="w-9 h-10 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-rose-500 font-medium pt-0.5 mb-0">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={logout}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <i className="bi bi-box-arrow-right mr-1.5"></i>
              Sign Out
            </button>
            <button
              type="submit"
              disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle text-xs"></i>
                  <span>Establish Password & Continue</span>
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

