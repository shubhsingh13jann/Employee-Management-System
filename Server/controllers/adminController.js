import pool from "../config/db.js";
import bcrypt from "bcrypt";

export const getStats = async (req, res) => {
  try {
    const [[{ totalEmployees }]] = await pool.query("SELECT COUNT(*) AS totalEmployees FROM users WHERE role = 'employee'");
    const [[{ totalSupervisors }]] = await pool.query("SELECT COUNT(*) AS totalSupervisors FROM users WHERE role = 'supervisor'");
    const [[{ totalManagers }]] = await pool.query("SELECT COUNT(*) AS totalManagers FROM users WHERE role = 'manager'");
    const [[{ totalDepartments }]] = await pool.query("SELECT COUNT(*) AS totalDepartments FROM departments");
    const [[{ activeProjects }]] = await pool.query("SELECT COUNT(*) AS activeProjects FROM projects WHERE status = 'active'");
    const [[{ pendingLeaves }]] = await pool.query("SELECT COUNT(*) AS pendingLeaves FROM leave_requests WHERE status IN ('pending_supervisor', 'pending_manager')");
    const [[{ totalSalaryPayout }]] = await pool.query("SELECT COALESCE(SUM(salary), 0) AS totalSalaryPayout FROM users WHERE status = 'active'");

    return res.json({
      status: true,
      stats: {
        totalEmployees,
        totalSupervisors,
        totalManagers,
        totalDepartments,
        activeProjects,
        pendingLeaves,
        totalSalaryPayout: Number(totalSalaryPayout)
      }
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return res.status(500).json({ status: false, error: "Failed to retrieve statistics" });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const [departments] = await pool.query(`
      SELECT d.*, COUNT(u.id) AS member_count
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id
      GROUP BY d.id
      ORDER BY d.name ASC
    `);
    return res.json({ status: true, departments });
  } catch (err) {
    console.error("Get departments error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch departments" });
  }
};

export const addDepartment = async (req, res) => {
  try {
    const { name, description = "" } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ status: false, error: "Department name is required" });
    }
    await pool.query("INSERT INTO departments (name, description) VALUES (?, ?)", [name.trim(), description.trim()]);
    return res.json({ status: true, message: "Department created successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ status: false, error: "Department name already exists" });
    }
    console.error("Add department error:", err);
    return res.status(500).json({ status: false, error: "Failed to create department" });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM departments WHERE id = ?", [id]);
    return res.json({ status: true, message: "Department deleted successfully" });
  } catch (err) {
    console.error("Delete department error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete department" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.salary, u.phone, u.address, u.image_url, u.status, u.created_at,
             d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
    `;
    const params = [];
    if (role && ["admin", "manager", "supervisor", "employee"].includes(role)) {
      query += " WHERE u.role = ?";
      params.push(role);
    }
    query += " ORDER BY u.created_at DESC";

    const [users] = await pool.query(query, params);
    return res.json({ status: true, users });
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch users" });
  }
};

export const addUser = async (req, res) => {
  try {
    const { name, email, password, role = "employee", department_id, salary = 0, phone = "", address = "", image_url = "" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ status: false, error: "Name, email, and password are required" });
    }
    if (!["admin", "manager", "supervisor", "employee"].includes(role)) {
      return res.status(400).json({ status: false, error: "Invalid role specified" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, salary, phone, address, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), password_hash, role, department_id || null, salary || 0, phone, address, image_url]
    );

    return res.json({ status: true, message: "User created successfully", userId: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ status: false, error: "Email address is already registered" });
    }
    console.error("Add user error:", err);
    return res.status(500).json({ status: false, error: "Failed to create user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === req.user.id) {
      return res.status(400).json({ status: false, error: "You cannot delete your own account" });
    }
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return res.json({ status: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete user" });
  }
};

export const getHierarchy = async (req, res) => {
  try {
    const [hierarchy] = await pool.query(`
      SELECT th.id, th.assigned_at,
             emp.id AS employee_id, emp.name AS employee_name, emp.email AS employee_email,
             sup.id AS supervisor_id, sup.name AS supervisor_name,
             mgr.id AS manager_id, mgr.name AS manager_name,
             d.name AS department_name
      FROM team_hierarchy th
      JOIN users emp ON th.employee_id = emp.id
      JOIN users sup ON th.supervisor_id = sup.id
      JOIN users mgr ON th.manager_id = mgr.id
      LEFT JOIN departments d ON emp.department_id = d.id
      ORDER BY d.name, sup.name, emp.name
    `);
    return res.json({ status: true, hierarchy });
  } catch (err) {
    console.error("Get hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch team hierarchy" });
  }
};

export const assignHierarchy = async (req, res) => {
  try {
    const { employee_id, supervisor_id, manager_id } = req.body;
    if (!employee_id || !supervisor_id || !manager_id) {
      return res.status(400).json({ status: false, error: "Employee, Supervisor, and Manager are all required" });
    }

    await pool.query(
      `INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id), manager_id = VALUES(manager_id)`,
      [employee_id, supervisor_id, manager_id]
    );

    return res.json({ status: true, message: "Employee successfully assigned to supervisor & manager" });
  } catch (err) {
    console.error("Assign hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to update team assignment" });
  }
};
