import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: false, error: "Invalid email or password" });
    }

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

    return res.json({
      status: true,
      message: "Login successful",
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
    console.error("Login error:", err);
    return res.status(500).json({ status: false, error: "Internal server error during authentication" });
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
