import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

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

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
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
        sendEmailNotification: sendEmailNotification
      });

      if (res.data.status) {
        onSuccess(
          `Password for ${user.name} reset successfully.${
            sendEmailNotification ? " Temporary credentials dispatched to " + user.email + "." : ""
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 text-lg shadow-inner">
              <i className="bi bi-key-fill"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight mb-0">
                1-Click Password Reset
              </h3>
              <p className="text-[11px] text-indigo-200/70 mb-0">
                Generate or assign a secure credential
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Personnel Pill */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Target Account
              </span>
              <p className="font-bold text-slate-900 text-xs truncate mb-0">
                {user.name}
              </p>
              <p className="text-[11px] text-slate-500 truncate mb-0">
                {user.email}
              </p>
            </div>
            {user.role && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                {user.role}
              </span>
            )}
          </div>

          {/* Generated Password Input with Generator & Copy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                New Temporary Password <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <i className="bi bi-arrow-repeat text-xs"></i>
                <span>Regenerate</span>
              </button>
            </div>

            <div className="relative flex items-center rounded-xl bg-slate-50/80 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter or generate password..."
                className="w-full h-10 px-3.5 bg-transparent outline-none font-mono text-xs sm:text-sm text-slate-900 tracking-wide"
              />
              <div className="flex items-center gap-1 pr-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors cursor-pointer text-xs"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`h-7 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    copied
                      ? "bg-emerald-500 text-white shadow-2xs"
                      : "bg-indigo-100/70 hover:bg-indigo-200/80 text-indigo-700"
                  }`}
                  title="Copy password to clipboard"
                >
                  <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"}`}></i>
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notification Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
              />
              <span className="text-xs text-slate-600 font-medium">
                Notify employee with credentials via registered email
              </span>
            </label>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-start gap-2">
            <i className="bi bi-shield-exclamation text-amber-600 text-xs shrink-0 mt-0.5"></i>
            <p className="text-[11px] text-amber-800 leading-relaxed mb-0">
              The user will be required to update their temporary password upon their next session sign-in.
            </p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle text-xs"></i>
                  <span>Confirm Password Reset</span>
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
