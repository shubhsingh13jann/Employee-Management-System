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
      SELECT 
        d.id,
        d.name,
        d.code,
        d.description,
        d.head_id,
        d.parent_id,
        d.created_at,
        u_head.name AS head_name,
        u_head.email AS head_email,
        u_head.image_url AS head_image_url,
        u_head.role AS head_role,
        p.name AS parent_name,
        COUNT(DISTINCT u_mem.id) AS member_count,
        COUNT(DISTINCT CASE WHEN u_mem.role = 'supervisor' THEN u_mem.id END) AS supervisor_count,
        COUNT(DISTINCT CASE WHEN u_mem.role = 'employee' THEN u_mem.id END) AS employee_count
      FROM departments d
      LEFT JOIN users u_head ON d.head_id = u_head.id
      LEFT JOIN departments p ON d.parent_id = p.id
      LEFT JOIN users u_mem ON d.id = u_mem.department_id
      GROUP BY d.id, u_head.id, p.id
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
    const { name, code = "", description = "", head_id = null, parent_id = null } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ status: false, error: "Department name is required" });
    }

    let deptCode = code.trim().toUpperCase();
    if (!deptCode) {
      deptCode = name.trim().replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "DPT";
    }

    const validHeadId = head_id ? Number(head_id) : null;
    const validParentId = parent_id ? Number(parent_id) : null;

    const [result] = await pool.query(
      "INSERT INTO departments (name, code, description, head_id, parent_id) VALUES (?, ?, ?, ?, ?)",
      [name.trim(), deptCode, description.trim(), validHeadId, validParentId]
    );

    const newDeptId = result.insertId;

    if (validHeadId) {
      await pool.query("UPDATE users SET department_id = ? WHERE id = ?", [newDeptId, validHeadId]);
    }

    return res.json({ status: true, message: "Department created successfully", departmentId: newDeptId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ status: false, error: "Department name already exists" });
    }
    console.error("Add department error:", err);
    return res.status(500).json({ status: false, error: "Failed to create department" });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code = "", description = "", head_id = null, parent_id = null } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: false, error: "Department name is required" });
    }

    let deptCode = code.trim().toUpperCase();
    if (!deptCode) {
      deptCode = name.trim().replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "DPT";
    }

    const validHeadId = head_id ? Number(head_id) : null;
    let validParentId = parent_id ? Number(parent_id) : null;

    if (validParentId && Number(validParentId) === Number(id)) {
      validParentId = null;
    }

    await pool.query(
      "UPDATE departments SET name = ?, code = ?, description = ?, head_id = ?, parent_id = ? WHERE id = ?",
      [name.trim(), deptCode, description.trim(), validHeadId, validParentId, id]
    );

    if (validHeadId) {
      await pool.query("UPDATE users SET department_id = ? WHERE id = ?", [id, validHeadId]);
    }

    return res.json({ status: true, message: "Department updated successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ status: false, error: "Department name already exists" });
    }
    console.error("Update department error:", err);
    return res.status(500).json({ status: false, error: "Failed to update department" });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reassign_to } = req.query;

    const [[{ member_count }]] = await pool.query(
      "SELECT COUNT(*) AS member_count FROM users WHERE department_id = ?",
      [id]
    );

    if (member_count > 0) {
      if (reassign_to) {
        await pool.query("UPDATE users SET department_id = ? WHERE department_id = ?", [reassign_to, id]);
      } else if (action === "unassign") {
        await pool.query("UPDATE users SET department_id = NULL WHERE department_id = ?", [id]);
      } else {
        return res.status(400).json({
          status: false,
          error: "Department has active members",
          member_count,
          requires_action: true
        });
      }
    }

    await pool.query("UPDATE departments SET parent_id = NULL WHERE parent_id = ?", [id]);
    await pool.query("DELETE FROM departments WHERE id = ?", [id]);

    return res.json({ status: true, message: "Department deleted successfully" });
  } catch (err) {
    console.error("Delete department error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete department" });
  }
};

export const getEligibleHeads = async (req, res) => {
  try {
    const [heads] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.image_url, d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role IN ('manager', 'supervisor')
      ORDER BY u.name ASC
    `);
    return res.json({ status: true, eligibleHeads: heads });
  } catch (err) {
    console.error("Get eligible heads error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch eligible leaders" });
  }
};

export const getDepartmentRoster = async (req, res) => {
  try {
    const { id } = req.params;

    const [deptRows] = await pool.query(`
      SELECT d.*, p.name AS parent_name,
             u.name AS head_name, u.email AS head_email, u.image_url AS head_image_url, u.role AS head_role
      FROM departments d
      LEFT JOIN departments p ON d.parent_id = p.id
      LEFT JOIN users u ON d.head_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (deptRows.length === 0) {
      return res.status(404).json({ status: false, error: "Department not found" });
    }

    const department = deptRows[0];

    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.salary, u.phone, u.image_url, u.status, u.created_at,
             th.supervisor_id, sup.name AS supervisor_name, sup.email AS supervisor_email,
             th.manager_id, mgr.name AS manager_name
      FROM users u
      LEFT JOIN team_hierarchy th ON u.id = th.employee_id
      LEFT JOIN users sup ON th.supervisor_id = sup.id
      LEFT JOIN users mgr ON th.manager_id = mgr.id
      WHERE u.department_id = ?
      ORDER BY FIELD(u.role, 'manager', 'supervisor', 'employee'), u.name ASC
    `, [id]);

    const supervisors = members
      .filter(m => m.role === "supervisor")
      .map(s => {
        const directReports = members.filter(m => m.supervisor_id === s.id);
        return {
          ...s,
          direct_reports_count: directReports.length,
          direct_reports: directReports.map(dr => ({ id: dr.id, name: dr.name, email: dr.email }))
        };
      });

    const employees = members.filter(m => m.role === "employee");
    const managers = members.filter(m => m.role === "manager");

    return res.json({
      status: true,
      department,
      roster: {
        total_members: members.length,
        head: department.head_id ? {
          id: department.head_id,
          name: department.head_name,
          email: department.head_email,
          image_url: department.head_image_url,
          role: department.head_role
        } : null,
        managers,
        supervisors,
        employees,
        all_members: members
      }
    });
  } catch (err) {
    console.error("Get department roster error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch department roster" });
  }
};

export const transferMember = async (req, res) => {
  try {
    const { user_id, target_department_id, target_supervisor_id, reason } = req.body;

    if (!user_id || !target_department_id) {
      return res.status(400).json({ status: false, error: "User and target department are required" });
    }

    const [userRows] = await pool.query("SELECT * FROM users WHERE id = ?", [user_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ status: false, error: "User not found" });
    }
    const user = userRows[0];
    const oldDeptId = user.department_id;

    const [deptRows] = await pool.query("SELECT * FROM departments WHERE id = ?", [target_department_id]);
    if (deptRows.length === 0) {
      return res.status(404).json({ status: false, error: "Target department not found" });
    }
    const targetDept = deptRows[0];

    // Find previous supervisor
    const [prevSupRows] = await pool.query("SELECT supervisor_id FROM team_hierarchy WHERE employee_id = ?", [user_id]);
    const previousSupervisorId = prevSupRows.length > 0 ? prevSupRows[0].supervisor_id : null;

    await pool.query("UPDATE users SET department_id = ? WHERE id = ?", [target_department_id, user_id]);

    if (target_supervisor_id) {
      let managerId = targetDept.head_id;
      if (!managerId) {
        const [mgrRows] = await pool.query("SELECT id FROM users WHERE department_id = ? AND role = 'manager' LIMIT 1", [target_department_id]);
        if (mgrRows.length > 0) {
          managerId = mgrRows[0].id;
        } else {
          const [anyMgr] = await pool.query("SELECT id FROM users WHERE role = 'manager' LIMIT 1");
          managerId = anyMgr[0]?.id || 1;
        }
      }

      await pool.query(`
        INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id), manager_id = VALUES(manager_id)
      `, [user_id, target_supervisor_id, managerId]);
    } else if (user.role === "employee" && oldDeptId !== target_department_id) {
      await pool.query("DELETE FROM team_hierarchy WHERE employee_id = ?", [user_id]);
    }

    if (oldDeptId) {
      await pool.query("UPDATE departments SET head_id = NULL WHERE id = ? AND head_id = ?", [oldDeptId, user_id]);
    }

    // Insert into department_transfers audit table
    await pool.query(`
      INSERT INTO department_transfers (user_id, source_department_id, target_department_id, previous_supervisor_id, new_supervisor_id, transferred_by, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [user_id, oldDeptId, target_department_id, previousSupervisorId, target_supervisor_id || null, req.user?.id || 1, reason || null]);

    return res.json({
      status: true,
      message: `Successfully transferred ${user.name} to ${targetDept.name}`,
      user: { id: user.id, name: user.name, department_id: target_department_id }
    });
  } catch (err) {
    console.error("Transfer member error:", err);
    return res.status(500).json({ status: false, error: "Failed to transfer member" });
  }
};

export const getDepartmentTransfers = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT dt.*,
             u.name AS user_name, u.email AS user_email, u.role AS user_role, u.image_url AS user_image_url,
             sd.name AS source_dept_name, sd.code AS source_dept_code,
             td.name AS target_dept_name, td.code AS target_dept_code,
             prev_sup.name AS previous_supervisor_name,
             new_sup.name AS new_supervisor_name
      FROM department_transfers dt
      LEFT JOIN users u ON dt.user_id = u.id
      LEFT JOIN departments sd ON dt.source_department_id = sd.id
      LEFT JOIN departments td ON dt.target_department_id = td.id
      LEFT JOIN users prev_sup ON dt.previous_supervisor_id = prev_sup.id
      LEFT JOIN users new_sup ON dt.new_supervisor_id = new_sup.id
      WHERE dt.source_department_id = ? OR dt.target_department_id = ?
      ORDER BY dt.transferred_at DESC
      LIMIT 50
    `, [id, id]);

    return res.json({ status: true, transfers: rows });
  } catch (err) {
    console.error("Get department transfers error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch department transfer history" });
  }
};

export const batchTransferMembers = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { user_ids, target_department_id, target_supervisor_id, reason } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0 || !target_department_id) {
      connection.release();
      return res.status(400).json({ status: false, error: "User IDs array and target department are required" });
    }

    const [deptRows] = await connection.query("SELECT * FROM departments WHERE id = ?", [target_department_id]);
    if (deptRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ status: false, error: "Target destination department not found" });
    }
    const targetDept = deptRows[0];

    for (const uid of user_ids) {
      const [uRows] = await connection.query("SELECT * FROM users WHERE id = ?", [uid]);
      if (uRows.length === 0) continue;
      const user = uRows[0];
      const oldDeptId = user.department_id;

      // Previous supervisor
      const [prevSupRows] = await connection.query("SELECT supervisor_id FROM team_hierarchy WHERE employee_id = ?", [uid]);
      const prevSupervisorId = prevSupRows.length > 0 ? prevSupRows[0].supervisor_id : null;

      // Move user
      await connection.query("UPDATE users SET department_id = ? WHERE id = ?", [target_department_id, uid]);

      // Update reporting hierarchy
      if (target_supervisor_id) {
        await connection.query(`
          INSERT INTO team_hierarchy (supervisor_id, employee_id)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id)
        `, [target_supervisor_id, uid]);
      } else {
        await connection.query("DELETE FROM team_hierarchy WHERE employee_id = ?", [uid]);
      }

      // Safeguard: If moved user was supervisor, cascade orphans to old dept head
      if (user.role === "supervisor" && oldDeptId) {
        const [oldDeptRows] = await connection.query("SELECT head_id FROM departments WHERE id = ?", [oldDeptId]);
        const oldHeadId = oldDeptRows.length > 0 ? oldDeptRows[0].head_id : null;
        if (oldHeadId) {
          await connection.query("UPDATE team_hierarchy SET supervisor_id = ? WHERE supervisor_id = ?", [oldHeadId, uid]);
        } else {
          await connection.query("DELETE FROM team_hierarchy WHERE supervisor_id = ?", [uid]);
        }
      }

      // Safeguard: If moved user was HOD of old department, vacate
      if (oldDeptId) {
        await connection.query("UPDATE departments SET head_id = NULL WHERE id = ? AND head_id = ?", [oldDeptId, uid]);
      }

      // Audit log entry
      await connection.query(`
        INSERT INTO department_transfers (user_id, source_department_id, target_department_id, previous_supervisor_id, new_supervisor_id, transferred_by, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [uid, oldDeptId, target_department_id, prevSupervisorId, target_supervisor_id || null, req.user?.id || 1, reason || "Batch Squad Reorganization"]);
    }

    await connection.commit();
    return res.json({
      status: true,
      message: `Successfully transferred ${user_ids.length} personnel to ${targetDept.name}`
    });
  } catch (err) {
    await connection.rollback();
    console.error("Batch transfer members error:", err);
    return res.status(500).json({ status: false, error: "Failed to execute batch transfer" });
  } finally {
    connection.release();
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
