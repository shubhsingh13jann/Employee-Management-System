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

    // 1. Insert into unified users table
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, phone, address, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim(), password_hash, userRole, deptId, phone || "", address || "", userSalary]
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

