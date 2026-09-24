import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/axios";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  // Token Verification State
  const [checkingToken, setCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  // Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // Validate Token on Mount
  useEffect(() => {
    if (!token) {
      setCheckingToken(false);
      setTokenValid(false);
      setTokenError("No recovery token was provided in this link.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.get(`/api/auth/verify-reset-token/${token}`);
        if (res.data.status && res.data.valid) {
          setTokenValid(true);
          setUserEmail(res.data.email || "");
          setUserName(res.data.name || "");
        } else {
          setTokenValid(false);
          setTokenError(res.data.error || "This recovery link is invalid or has expired.");
        }
      } catch (err: any) {
        setTokenValid(false);
        setTokenError(err.response?.data?.error || "This recovery link has expired or has already been used.");
      } finally {
        setCheckingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  // Live Password Strength Evaluator
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

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!newPassword || !confirmPassword) {
      setFormError("Please fill in both password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match. Please verify.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/api/auth/reset-password", {
        token,
        newPassword
      });

      if (res.data.status) {
        setResetSuccess(true);
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Failed to update password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-6"
      style={{
        background: "radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%, #020617 100%)",
        color: "#ffffff"
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full relative rounded-xl p-6 p-md-4"
        style={{
          maxWidth: "460px",
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08) inset"
        }}
      >
        {/* Top Accent Laser Line */}
        <div
          className="absolute top-0 left-0 right-0 rounded-top-4"
          style={{
            height: "3.5px",
            background: "linear-gradient(90deg, #6366f1, #38bdf8, #818cf8)"
          }}
        />

        {checkingToken ? (
          <div className="text-center py-12">
            <div className="spinner-border text-blue-600 mb-6" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Validating...</span>
            </div>
            <h5 className="font-bold text-white mb-1">Verifying Recovery Link</h5>
            <p className="text-gray-600 text-sm mb-0">Checking security authorization token...</p>
          </div>
        ) : !tokenValid ? (
          <div className="text-center py-6">
            <div
              className="mx-auto rounded-full flex items-center justify-center mb-6"
              style={{
                width: "56px",
                height: "56px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#f87171",
                fontSize: "26px"
              }}
            >
              <i className="bi bi-shield-x"></i>
            </div>
            <h5 className="font-bold text-white mb-1">Link Invalid or Expired</h5>
            <p className="text-gray-600 text-sm mb-6" style={{ lineHeight: 1.5, fontSize: "13px" }}>
              {tokenError}
            </p>
            <div className="flex gap-2">
              <Link
                to="/login"
                className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 w-full rounded-lg font-bold py-2"
                style={{ fontSize: "13px" }}
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : resetSuccess ? (
          <div className="text-center py-6">
            <div
              className="mx-auto rounded-full flex items-center justify-center mb-6"
              style={{
                width: "58px",
                height: "58px",
                background: "rgba(16, 185, 129, 0.16)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#34d399",
                fontSize: "28px"
              }}
            >
              <i className="bi bi-check2-circle"></i>
            </div>
            <h4 className="font-bold text-white mb-1">Password Successfully Updated</h4>
            <p className="text-gray-600 text-sm mb-6" style={{ lineHeight: 1.5, fontSize: "13px" }}>
              Your Enterprise EMS account password has been reset. Redirecting you to Sign In in a moment...
            </p>
            <Link
              to="/login"
              className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 w-full rounded-lg font-bold py-2 flex items-center justify-center gap-1.5"
              style={{ fontSize: "13px" }}
            >
              <span>Sign In Now</span>
              <i className="bi bi-arrow-right-short" style={{ fontSize: "17px" }} />
            </Link>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-6">
              <div
                className="rounded-lg flex items-center justify-center"
                style={{
                  width: "42px",
                  height: "42px",
                  background: "rgba(99, 102, 241, 0.16)",
                  border: "1px solid rgba(99, 102, 241, 0.35)",
                  color: "#818cf8"
                }}
              >
                <i className="bi bi-lock-fill" style={{ fontSize: "20px" }}></i>
              </div>
              <div>
                <h5 className="font-bold mb-0 text-white" style={{ fontSize: "18px" }}>
                  Create New Password
                </h5>
                <small className="text-white-50" style={{ fontSize: "11px" }}>
                  Account: <strong>{userEmail}</strong>
                </small>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-6" style={{ fontSize: "12.5px", lineHeight: 1.5 }}>
              Choose a strong, unique password to secure your Enterprise EMS account.
            </p>

            {formError && (
              <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700 py-2 px-6 rounded-lg text-sm mb-6 border-0 flex items-center gap-2" style={{ fontSize: "12px" }}>
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New Password Input */}
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700 text-white-50 text-sm mb-1" style={{ fontSize: "11.5px" }}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-2 pe-5"
                    style={{
                      background: "rgba(30, 41, 59, 0.75)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      fontSize: "13px"
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-link absolute right-0 top-50 translate-middle-y text-white-50 p-2 pe-3 text-decoration-none"
                    style={{ fontSize: "14px" }}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1" style={{ fontSize: "10.5px" }}>
                      <span className="text-gray-600">Password Security:</span>
                      <span className="font-semibold" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="flex gap-1" style={{ height: "4px" }}>
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className="flex-grow-1 rounded-full"
                          style={{
                            height: "100%",
                            background: step <= strength.score ? strength.color : "rgba(255, 255, 255, 0.12)",
                            transition: "background-color 0.25s ease"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password Input */}
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700 text-white-50 text-sm mb-1" style={{ fontSize: "11.5px" }}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-2 pe-5"
                    style={{
                      background: "rgba(30, 41, 59, 0.75)",
                      border: confirmPassword
                        ? newPassword === confirmPassword
                          ? "1px solid #10b981"
                          : "1px solid #f43f5e"
                        : "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      fontSize: "13px"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-link absolute right-0 top-50 translate-middle-y text-white-50 p-2 pe-3 text-decoration-none"
                    style={{ fontSize: "14px" }}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword && (
                  <div className="flex items-center gap-1.5 mt-1.5" style={{ fontSize: "10.5px" }}>
                    {newPassword === confirmPassword ? (
                      <>
                        <i className="bi bi-check-circle-fill text-green-600" style={{ fontSize: "11px" }}></i>
                        <span className="text-green-600 font-medium">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-x-circle-fill text-red-600" style={{ fontSize: "11px" }}></i>
                        <span className="text-red-600 font-medium">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !newPassword || newPassword !== confirmPassword}
                className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 w-full rounded-lg font-bold py-2 mt-2 flex items-center justify-center gap-2"
                style={{ fontSize: "13.5px" }}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password & Sign In</span>
                    <i className="bi bi-arrow-right-short" style={{ fontSize: "17px" }} />
                  </>
                )}
              </button>

              <div className="text-center mt-6">
                <Link
                  to="/login"
                  className="text-decoration-none text-white-50 text-sm hover-white"
                  style={{ fontSize: "12px" }}
                >
                  <i className="bi bi-arrow-left mr-1"></i> Cancel and Return to Sign In
                </Link>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;

