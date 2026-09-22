import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  send2FAEmail,
  sendLoginSuccessEmail,
  sendSecurityAlertEmail,
  sendAccountLockoutEmail,
  sendPasswordResetEmail
} from "../utils/emailService.js";

/**
 * Step 1: Initial Login Verification (Email, Password, Role)
 * If locked, rejects with HTTP 429 and remaining lockout seconds.
 * If valid, generates a 6-digit 2FA OTP and dispatches email.
 * If invalid, tracks failed attempts: warning email at 3 attempts, 10-minute lockout at 5 attempts.
 */
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: false, error: "Email and password are required" });
    }

    let query = "SELECT u.*, d.name AS department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.email = ?";
    const params = [email.trim()];

    if (role && ["admin", "manager", "supervisor", "employee"].includes(role)) {
      query += " AND u.role = ?";
      params.push(role);
    }

    const [rows] = await pool.query(query, params);
    if (rows.length === 0) {
      return res.status(401).json({ status: false, error: "Invalid credentials or account not found for selected role" });
    }

    const user = rows[0];
    if (user.status === "inactive") {
      return res.status(403).json({ status: false, error: "This account has been deactivated. Please contact HR." });
    }

    // Check if account is currently locked out
    if (user.lockout_until) {
      const lockoutDate = new Date(user.lockout_until);
      const now = new Date();
      if (lockoutDate > now) {
        const remainingSeconds = Math.ceil((lockoutDate.getTime() - now.getTime()) / 1000);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        return res.status(429).json({
          status: false,
          locked: true,
          remainingSeconds,
          error: `Account is temporarily locked due to excessive failed attempts. Please retry in ${remainingMinutes} minute(s) or reset your password.`
        });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const currentAttempts = (user.failed_login_attempts || 0) + 1;
      const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "Web Browser";

      // 5th failed attempt: Lock account for 10 minutes
      if (currentAttempts >= 5) {
        await pool.query(
          "UPDATE users SET failed_login_attempts = ?, last_failed_login = NOW(), lockout_until = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?",
          [currentAttempts, user.id]
        );

        sendAccountLockoutEmail(user.email, user.name, {
          attempts: currentAttempts,
          ip,
          userAgent
        }).catch(emailErr => console.error("[Account Lockout Email] Dispatch failed:", emailErr.message));

        return res.status(429).json({
          status: false,
          locked: true,
          remainingSeconds: 600,
          error: "Account locked for 10 minutes due to 5 consecutive failed login attempts.",
          securityAlertSent: true
        });
      }

      // Update failed attempts counter
      await pool.query(
        "UPDATE users SET failed_login_attempts = ?, last_failed_login = NOW() WHERE id = ?",
        [currentAttempts, user.id]
      );

      // Trigger security alert warning email if failed attempts >= 3
      if (currentAttempts >= 3) {
        sendSecurityAlertEmail(user.email, user.name, {
          attempts: currentAttempts,
          ip,
          userAgent
        }).catch(emailErr => console.error("[Security Alert] Email dispatch failed:", emailErr.message));
      }

      const attemptsRemaining = Math.max(5 - currentAttempts, 0);
      return res.status(401).json({
        status: false,
        error: `Invalid email or password. ${attemptsRemaining} attempt(s) remaining before account lockout.`,
        attempts: currentAttempts,
        attemptsRemaining,
        securityAlertSent: currentAttempts >= 3
      });
    }

    // Password verified: Reset failed attempts counter and clear any lockout
    await pool.query("UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?", [user.id]);

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous unexpired 2FA codes for this user
    await pool.query(
      "UPDATE user_otps SET is_used = TRUE WHERE user_id = ? AND type = '2fa_login'",
      [user.id]
    );

    // Save fresh OTP
    await pool.query(
      "INSERT INTO user_otps (user_id, otp_code, type, expires_at) VALUES (?, ?, '2fa_login', ?)",
      [user.id, otpCode, expiresAt]
    );

    // Dispatch 2FA verification email
    send2FAEmail(user.email, user.name, otpCode)
      .catch(emailErr => console.error("[2FA Email] Dispatch failed:", emailErr.message));

    // Sign a temporary short-lived token for the 2FA verification modal
    const tempToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: "2fa_verification" },
      process.env.JWT_SECRET || "ems_super_secret_jwt_key_2026_secure",
      { expiresIn: "10m" }
    );

    // Format masked email for UI display (e.g. ad***@ems.com)
    const emailParts = user.email.split("@");
    const namePart = emailParts[0];
    const maskedName = namePart.length > 2
      ? namePart.substring(0, 2) + "*".repeat(Math.max(namePart.length - 2, 2))
      : namePart + "**";
    const maskedEmail = `${maskedName}@${emailParts[1]}`;

    return res.json({
      status: true,
      requires2FA: true,
      message: "A single-use verification code has been dispatched to your email.",
      tempToken,
      email: user.email,
      maskedEmail
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ status: false, error: "Internal server error during authentication" });
  }
};

/**
 * Step 2: Verify 2FA OTP Code & Finalize Login Session
 */
export const verify2FA = async (req, res) => {
  try {
    const { tempToken, otpCode } = req.body;
    if (!tempToken || !otpCode) {
      return res.status(400).json({ status: false, error: "Session token and verification code are required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || "ems_super_secret_jwt_key_2026_secure");
    } catch {
      return res.status(401).json({ status: false, error: "Verification session has expired. Please sign in again." });
    }

    if (decoded.purpose !== "2fa_verification") {
      return res.status(401).json({ status: false, error: "Invalid session purpose." });
    }

    const cleanCode = otpCode.toString().trim();
    const [otps] = await pool.query(
      `SELECT * FROM user_otps 
       WHERE user_id = ? AND otp_code = ? AND type = '2fa_login' AND is_used = FALSE AND expires_at > NOW() 
       ORDER BY id DESC LIMIT 1`,
      [decoded.userId, cleanCode]
    );

    if (otps.length === 0) {
      return res.status(400).json({ status: false, error: "Invalid or expired verification code." });
    }

    // Mark OTP as used
    await pool.query("UPDATE user_otps SET is_used = TRUE WHERE id = ?", [otps[0].id]);

    // Fetch full user record
    const [rows] = await pool.query(
      `SELECT u.*, d.name AS department_name 
       FROM users u 
       LEFT JOIN departments d ON u.department_id = d.id 
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: false, error: "User record not found." });
    }

    const user = rows[0];

    // Issue permanent auth JWT token
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id
      },
      process.env.JWT_SECRET || "ems_super_secret_jwt_key_2026_secure",
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    // Send Successful Login alert email asynchronously
    sendLoginSuccessEmail(user.email, user.name, {
      ip: req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Web Browser"
    }).catch(emailErr => console.error("[Login Success Email] Dispatch failed:", emailErr.message));

    return res.json({
      status: true,
      message: "Authentication successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
        image_url: user.image_url
      }
    });
  } catch (err) {
    console.error("verify2FA error:", err);
    return res.status(500).json({ status: false, error: "Failed to verify 2FA code." });
  }
};

/**
 * Resend 2FA OTP with 30s Cooldown
 */
export const resend2FA = async (req, res) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) {
      return res.status(400).json({ status: false, error: "Session token is required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || "ems_super_secret_jwt_key_2026_secure");
    } catch {
      return res.status(401).json({ status: false, error: "Session has expired. Please sign in again." });
    }

    const [users] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [decoded.userId]);
    if (users.length === 0) {
      return res.status(404).json({ status: false, error: "User not found." });
    }
    const user = users[0];

    // Check cooldown (30 seconds)
    const [recent] = await pool.query(
      `SELECT created_at FROM user_otps 
       WHERE user_id = ? AND type = '2fa_login' AND created_at > (NOW() - INTERVAL 30 SECOND) 
       ORDER BY id DESC LIMIT 1`,
      [user.id]
    );
    if (recent.length > 0) {
      return res.status(429).json({ status: false, error: "Please wait 30 seconds before requesting a new code." });
    }

    // Invalidate old OTPs
    await pool.query("UPDATE user_otps SET is_used = TRUE WHERE user_id = ? AND type = '2fa_login'", [user.id]);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      "INSERT INTO user_otps (user_id, otp_code, type, expires_at) VALUES (?, ?, '2fa_login', ?)",
      [user.id, otpCode, expiresAt]
    );

    send2FAEmail(user.email, user.name, otpCode)
      .catch(emailErr => console.error("[2FA Resend Email] Dispatch failed:", emailErr.message));

    return res.json({ status: true, message: "A fresh verification code has been dispatched." });
  } catch (err) {
    console.error("resend2FA error:", err);
    return res.status(500).json({ status: false, error: "Failed to resend verification code." });
  }
};

/**
 * Dispatch Password Reset Link Email
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ status: false, error: "Please enter your work email." });
    }

    const [users] = await pool.query("SELECT id, name, email FROM users WHERE email = ?", [email.trim()]);
    if (users.length === 0) {
      // Return success response to prevent account enumeration
      return res.json({
        status: true,
        message: "If an account exists with this email, recovery instructions have been sent."
      });
    }

    const user = users[0];

    // Invalidate previous reset tokens for this user
    await pool.query("UPDATE password_reset_tokens SET is_used = TRUE WHERE user_id = ?", [user.id]);

    // Generate secure 32-byte cryptographic hex token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await pool.query(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, token, expiresAt]
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    sendPasswordResetEmail(user.email, user.name, resetUrl)
      .catch(emailErr => console.error("[Password Reset Email] Dispatch failed:", emailErr.message));

    return res.json({
      status: true,
      message: "Password recovery link dispatched to your email."
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ status: false, error: "Failed to process recovery request." });
  }
};

/**
 * Validate Reset Token (used by frontend on page load)
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ status: false, error: "Recovery token is required." });
    }

    const [rows] = await pool.query(
      `SELECT prt.*, u.email, u.name 
       FROM password_reset_tokens prt 
       JOIN users u ON prt.user_id = u.id 
       WHERE prt.token = ? AND prt.is_used = FALSE AND prt.expires_at > NOW() 
       LIMIT 1`,
      [token.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ status: false, error: "Invalid or expired recovery link." });
    }

    return res.json({
      status: true,
      valid: true,
      email: rows[0].email,
      name: rows[0].name
    });
  } catch (err) {
    console.error("verifyResetToken error:", err);
    return res.status(500).json({ status: false, error: "Failed to verify reset token." });
  }
};

/**
 * Execute Password Reset
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ status: false, error: "Recovery token and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: false, error: "Password must be at least 6 characters." });
    }

    const [rows] = await pool.query(
      `SELECT prt.*, u.role, u.email, u.name 
       FROM password_reset_tokens prt 
       JOIN users u ON prt.user_id = u.id 
       WHERE prt.token = ? AND prt.is_used = FALSE AND prt.expires_at > NOW() 
       LIMIT 1`,
      [token.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ status: false, error: "Invalid or expired recovery link." });
    }

    const resetRecord = rows[0];
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 1. Update users table and reset failed login attempts & lockout
    await pool.query(
      "UPDATE users SET password_hash = ?, failed_login_attempts = 0, lockout_until = NULL WHERE id = ?",
      [newHash, resetRecord.user_id]
    );

    // 2. Also update corresponding separate role table
    try {
      if (resetRecord.role === "admin") {
        await pool.query("UPDATE admin SET password = ?, password_hash = ? WHERE email = ?", [newPassword, newHash, resetRecord.email]);
      } else if (resetRecord.role === "manager") {
        await pool.query("UPDATE manager SET password = ?, password_hash = ? WHERE email = ?", [newPassword, newHash, resetRecord.email]);
      } else if (resetRecord.role === "supervisor") {
        await pool.query("UPDATE supervisor SET password = ?, password_hash = ? WHERE email = ?", [newPassword, newHash, resetRecord.email]);
      } else if (resetRecord.role === "employee") {
        await pool.query("UPDATE employee SET password = ?, password_hash = ? WHERE email = ?", [newPassword, newHash, resetRecord.email]);
      }
    } catch (syncErr) {
      console.warn("Role table sync notice on password reset:", syncErr.message);
    }

    // 3. Mark token as used
    await pool.query("UPDATE password_reset_tokens SET is_used = TRUE WHERE id = ?", [resetRecord.id]);

    return res.json({
      status: true,
      message: "Password updated successfully! You can now sign in with your new credentials."
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ status: false, error: "Failed to reset password." });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  return res.json({ status: true, message: "Logged out successfully" });
};

export const getCurrentUser = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.department_id, u.salary, u.phone, u.address, u.image_url, u.status, u.created_at,
              d.name AS department_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: false, error: "User record not found" });
    }

    return res.json({ status: true, user: rows[0] });
  } catch (err) {
    console.error("Get current user error:", err);
    return res.status(500).json({ status: false, error: "Failed to retrieve user profile" });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = "employee", department_id, phone, address, salary } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ status: false, error: "Name, email, and password are required" });
    }

    // Support all 4 organizational tiers
    const allowedRoles = ["admin", "manager", "supervisor", "employee"];
    const userRole = allowedRoles.includes(role) ? role : "employee";

    // Check if email already exists
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ status: false, error: "An account with this email already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const defaultSalaries = {
      admin: 95000.00,
      manager: 85000.00,
      supervisor: 65000.00,
      employee: 50000.00
    };
    const userSalary = salary || defaultSalaries[userRole] || 50000.00;
    const deptId = userRole === "admin" ? null : (department_id ? Number(department_id) : 1);
    const imageUrl = req.file ? `/public/uploads/${req.file.filename}` : (req.body.image_url || "");

    // 1. Insert into unified users table
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, phone, address, salary, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim(), password_hash, userRole, deptId, phone || "", address || "", userSalary, imageUrl]
    );

    // 2. Also insert into the corresponding separate role table
    try {
      if (userRole === "admin") {
        await pool.query(
          `INSERT INTO admin (name, email, password, password_hash)
           VALUES (?, ?, ?, ?)`,
          [name.trim(), email.trim(), password, password_hash]
        );
      } else if (userRole === "manager") {
        await pool.query(
          `INSERT INTO manager (name, email, password, password_hash, department_id, phone, address, salary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name.trim(), email.trim(), password, password_hash, deptId, phone || "", address || "", userSalary]
        );
      } else if (userRole === "supervisor") {
        await pool.query(
          `INSERT INTO supervisor (name, email, password, password_hash, department_id, phone, address, salary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name.trim(), email.trim(), password, password_hash, deptId, phone || "", address || "", userSalary]
        );
      } else if (userRole === "employee") {
        await pool.query(
          `INSERT INTO employee (name, email, password, password_hash, department_id, phone, address, salary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name.trim(), email.trim(), password, password_hash, deptId, phone || "", address || "", userSalary]
        );
      }
    } catch (tableErr) {
      console.warn("Could not insert into separate role table:", tableErr.message);
    }

    return res.status(201).json({
      status: true,
      message: "Account registered successfully! You can now log in.",
      userId: result.insertId,
      role: userRole
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ status: false, error: "Failed to register account" });
  }
};

