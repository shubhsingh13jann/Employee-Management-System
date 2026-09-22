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
      className="min-vh-100 w-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: "radial-gradient(ellipse at top, #1e1b4b 0%, #0f172a 60%, #020617 100%)",
        color: "#ffffff"
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-100 position-relative rounded-4 p-4 p-md-4"
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
          className="position-absolute top-0 start-0 end-0 rounded-top-4"
          style={{
            height: "3.5px",
            background: "linear-gradient(90deg, #6366f1, #38bdf8, #818cf8)"
          }}
        />

        {checkingToken ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Validating...</span>
            </div>
            <h5 className="fw-bold text-white mb-1">Verifying Recovery Link</h5>
            <p className="text-secondary small mb-0">Checking security authorization token...</p>
          </div>
        ) : !tokenValid ? (
          <div className="text-center py-3">
            <div
              className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
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
            <h5 className="fw-bold text-white mb-1">Link Invalid or Expired</h5>
            <p className="text-secondary small mb-4" style={{ lineHeight: 1.5, fontSize: "13px" }}>
              {tokenError}
            </p>
            <div className="d-flex gap-2">
              <Link
                to="/login"
                className="btn btn-primary w-100 rounded-3 fw-bold py-2"
                style={{ fontSize: "13px" }}
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : resetSuccess ? (
          <div className="text-center py-3">
            <div
              className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3"
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
            <h4 className="fw-bold text-white mb-1">Password Successfully Updated</h4>
            <p className="text-secondary small mb-4" style={{ lineHeight: 1.5, fontSize: "13px" }}>
              Your Enterprise EMS account password has been reset. Redirecting you to Sign In in a moment...
            </p>
            <Link
              to="/login"
              className="btn btn-primary w-100 rounded-3 fw-bold py-2 d-flex align-items-center justify-content-center gap-1.5"
              style={{ fontSize: "13px" }}
            >
              <span>Sign In Now</span>
              <i className="bi bi-arrow-right-short" style={{ fontSize: "17px" }} />
            </Link>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="d-flex align-items-center gap-2.5 mb-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
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
                <h5 className="fw-bold mb-0 text-white" style={{ fontSize: "18px" }}>
                  Create New Password
                </h5>
                <small className="text-white-50" style={{ fontSize: "11px" }}>
                  Account: <strong>{userEmail}</strong>
                </small>
              </div>
            </div>

            <p className="text-secondary small mb-3" style={{ fontSize: "12.5px", lineHeight: 1.5 }}>
              Choose a strong, unique password to secure your Enterprise EMS account.
            </p>

            {formError && (
              <div className="alert alert-danger py-2 px-3 rounded-3 small mb-3 border-0 d-flex align-items-center gap-2" style={{ fontSize: "12px" }}>
                <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New Password Input */}
              <div className="mb-3">
                <label className="form-label text-white-50 small mb-1" style={{ fontSize: "11.5px" }}>
                  New Password
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-control rounded-3 py-2 pe-5"
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
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-white-50 p-2 pe-3 text-decoration-none"
                    style={{ fontSize: "14px" }}
                  >
                    <i className={`bi ${showPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="d-flex align-items-center justify-content-between mb-1" style={{ fontSize: "10.5px" }}>
                      <span className="text-secondary">Password Security:</span>
                      <span className="fw-semibold" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="d-flex gap-1" style={{ height: "4px" }}>
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className="flex-grow-1 rounded-pill"
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
              <div className="mb-3">
                <label className="form-label text-white-50 small mb-1" style={{ fontSize: "11.5px" }}>
                  Confirm New Password
                </label>
                <div className="position-relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-control rounded-3 py-2 pe-5"
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
                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-white-50 p-2 pe-3 text-decoration-none"
                    style={{ fontSize: "14px" }}
                  >
                    <i className={`bi ${showConfirmPassword ? "bi-eye-slash-fill" : "bi-eye-fill"}`}></i>
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword && (
                  <div className="d-flex align-items-center gap-1.5 mt-1.5" style={{ fontSize: "10.5px" }}>
                    {newPassword === confirmPassword ? (
                      <>
                        <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "11px" }}></i>
                        <span className="text-success fw-medium">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: "11px" }}></i>
                        <span className="text-danger fw-medium">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !newPassword || newPassword !== confirmPassword}
                className="btn btn-primary w-100 rounded-3 fw-bold py-2 mt-2 d-flex align-items-center justify-content-center gap-2"
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

              <div className="text-center mt-3">
                <Link
                  to="/login"
                  className="text-decoration-none text-white-50 small hover-white"
                  style={{ fontSize: "12px" }}
                >
                  <i className="bi bi-arrow-left me-1"></i> Cancel and Return to Sign In
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

