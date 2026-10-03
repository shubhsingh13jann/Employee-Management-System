import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { sendBroadcastEmail, sendCredentialResetEmail } from "../utils/broadcastEmailService.js";

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

export const getDecommissionPreview = async (req, res) => {
  try {
    const { id } = req.params;

    const [deptRows] = await pool.query(`
      SELECT d.*, u.name AS head_name, u.email AS head_email, u.role AS head_role, u.image_url AS head_image_url
      FROM departments d
      LEFT JOIN users u ON d.head_id = u.id
      WHERE d.id = ?
    `, [id]);

    if (deptRows.length === 0) {
      return res.status(404).json({ status: false, error: "Department not found" });
    }
    const department = deptRows[0];

    const [members] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.image_url,
             (SELECT COUNT(*) FROM team_hierarchy WHERE supervisor_id = u.id) AS direct_reports_count
      FROM users u
      WHERE u.department_id = ?
      ORDER BY u.role = 'manager' DESC, u.role = 'supervisor' DESC, u.name ASC
    `, [id]);

    const [childDepts] = await pool.query(`
      SELECT id, name, code, (SELECT COUNT(*) FROM users WHERE department_id = departments.id) AS member_count
      FROM departments
      WHERE parent_id = ?
    `, [id]);

    const supervisors = members.filter((m) => m.role === "supervisor");
    const employees = members.filter((m) => m.role === "employee");

    return res.json({
      status: true,
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
        description: department.description,
        head_id: department.head_id,
        head_name: department.head_name,
        head_email: department.head_email
      },
      impact: {
        total_members: members.length,
        supervisors_count: supervisors.length,
        employees_count: employees.length,
        child_departments_count: childDepts.length,
        child_departments: childDepts,
        has_head: !!department.head_id,
        can_hard_delete: members.length === 0 && childDepts.length === 0
      },
      members
    });
  } catch (err) {
    console.error("Get decommission preview error:", err);
    return res.status(500).json({ status: false, error: "Failed to evaluate department decommissioning impact" });
  }
};

export const decommissionDepartment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { action, target_department_id, target_supervisor_id, reason } = req.body || {};

    const [deptRows] = await connection.query("SELECT * FROM departments WHERE id = ?", [id]);
    if (deptRows.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ status: false, error: "Department not found" });
    }
    const department = deptRows[0];

    const [members] = await connection.query("SELECT * FROM users WHERE department_id = ?", [id]);

    if (members.length > 0) {
      if (action === "reassign") {
        if (!target_department_id || Number(target_department_id) === Number(id)) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({ status: false, error: "A valid distinct destination department is required for reallocation" });
        }

        const [targetDeptRows] = await connection.query("SELECT * FROM departments WHERE id = ?", [target_department_id]);
        if (targetDeptRows.length === 0) {
          await connection.rollback();
          connection.release();
          return res.status(404).json({ status: false, error: "Destination department not found" });
        }
        const targetDept = targetDeptRows[0];

        for (const member of members) {
          const [prevSupRows] = await connection.query("SELECT supervisor_id FROM team_hierarchy WHERE employee_id = ?", [member.id]);
          const prevSupervisorId = prevSupRows.length > 0 ? prevSupRows[0].supervisor_id : null;

          await connection.query("UPDATE users SET department_id = ? WHERE id = ?", [target_department_id, member.id]);

          if (target_supervisor_id) {
            await connection.query(`
              INSERT INTO team_hierarchy (supervisor_id, employee_id)
              VALUES (?, ?)
              ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id)
            `, [target_supervisor_id, member.id]);
          } else {
            await connection.query("DELETE FROM team_hierarchy WHERE employee_id = ?", [member.id]);
          }

          await connection.query(`
            INSERT INTO department_transfers (user_id, source_department_id, target_department_id, previous_supervisor_id, new_supervisor_id, transferred_by, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [member.id, id, target_department_id, prevSupervisorId, target_supervisor_id || null, req.user?.id || 1, reason || `Department Sunset Reallocation: ${department.name} decommissioned`]);
        }
      } else if (action === "unassign") {
        for (const member of members) {
          const [prevSupRows] = await connection.query("SELECT supervisor_id FROM team_hierarchy WHERE employee_id = ?", [member.id]);
          const prevSupervisorId = prevSupRows.length > 0 ? prevSupRows[0].supervisor_id : null;

          await connection.query("UPDATE users SET department_id = NULL WHERE id = ?", [member.id]);
          await connection.query("DELETE FROM team_hierarchy WHERE employee_id = ? OR supervisor_id = ?", [member.id, member.id]);

          await connection.query(`
            INSERT INTO department_transfers (user_id, source_department_id, target_department_id, previous_supervisor_id, new_supervisor_id, transferred_by, reason)
            VALUES (?, ?, NULL, ?, NULL, ?, ?)
          `, [member.id, id, prevSupervisorId, req.user?.id || 1, reason || `Department Sunset: ${department.name} decommissioned, personnel unassigned`]);
        }
      } else {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          status: false,
          error: "Department has active members. Please choose 'reassign' or 'unassign' before decommissioning.",
          member_count: members.length
        });
      }
    }

    // Detach child departments to root level
    await connection.query("UPDATE departments SET parent_id = NULL WHERE parent_id = ?", [id]);

    // Unlink head
    await connection.query("UPDATE departments SET head_id = NULL WHERE id = ?", [id]);

    // Delete department record
    await connection.query("DELETE FROM departments WHERE id = ?", [id]);

    await connection.commit();
    return res.json({
      status: true,
      message: `Department "${department.name}" has been safely decommissioned and all personnel governance rules executed.`
    });
  } catch (err) {
    await connection.rollback();
    console.error("Decommission department error:", err);
    return res.status(500).json({ status: false, error: "Failed to decommission department safely" });
  } finally {
    connection.release();
  }
};

export const deleteDepartment = async (req, res) => {
  req.body = {
    action: req.body?.action || req.query?.action,
    target_department_id: req.body?.target_department_id || req.query?.reassign_to,
    target_supervisor_id: req.body?.target_supervisor_id,
    reason: req.body?.reason || req.query?.reason
  };
  return decommissionDepartment(req, res);
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

export const getGlobalTransfers = async (req, res) => {
  try {
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
      ORDER BY dt.transferred_at DESC
      LIMIT 100
    `);
    return res.json({ status: true, transfers: rows });
  } catch (err) {
    console.error("Get global transfers error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch global transfers ledger" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role, department_id, search } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.salary, u.phone, u.address, u.image_url, u.status, u.created_at, u.must_change_password,
             d.name AS department_name, d.code AS department_code,
             sup.id AS supervisor_id, sup.name AS supervisor_name,
             (SELECT COUNT(*) FROM team_hierarchy WHERE supervisor_id = u.id) AS direct_reports_count,
             CASE WHEN EXISTS (SELECT 1 FROM departments WHERE head_id = u.id) THEN 1 ELSE 0 END AS is_hod,
             (SELECT GROUP_CONCAT(name SEPARATOR ', ') FROM departments WHERE head_id = u.id) AS head_of_department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN team_hierarchy th ON u.id = th.employee_id
      LEFT JOIN users sup ON th.supervisor_id = sup.id
    `;
    const params = [];
    const conditions = [];

    if (role) {
      if (role === "hod") {
        conditions.push("EXISTS (SELECT 1 FROM departments WHERE head_id = u.id)");
      } else if (["admin", "manager", "supervisor", "employee"].includes(role)) {
        conditions.push("u.role = ?");
        params.push(role);
      }
    }

    if (department_id) {
      conditions.push("u.department_id = ?");
      params.push(department_id);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR d.name LIKE ? OR sup.name LIKE ?)");
      params.push(term, term, term, term, term);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY u.created_at DESC";

    const [users] = await pool.query(query, params);
    return res.json({ status: true, users });
  } catch (err) {
    console.error("Get users error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch users" });
  }
};

export const getAvailableSupervisors = async (req, res) => {
  try {
    const { department_id } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.image_url,
             d.name AS department_name, d.code AS department_code,
             (SELECT COUNT(*) FROM team_hierarchy WHERE supervisor_id = u.id) AS direct_reports_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role IN ('supervisor', 'manager') AND u.status = 'active'
    `;
    const params = [];
    if (department_id) {
      query += " AND u.department_id = ?";
      params.push(department_id);
    }
    query += " ORDER BY d.name ASC, u.name ASC";

    const [supervisors] = await pool.query(query, params);
    return res.json({ status: true, supervisors });
  } catch (err) {
    console.error("Get available supervisors error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch supervisors" });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [[user]] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.salary, u.phone, u.address, u.image_url, u.status, u.created_at, u.must_change_password,
             d.name AS department_name, d.code AS department_code, d.head_id AS dept_head_id,
             sup.id AS supervisor_id, sup.name AS supervisor_name, sup.email AS supervisor_email,
             mgr.id AS manager_id, mgr.name AS manager_name,
             CASE WHEN EXISTS (SELECT 1 FROM departments WHERE head_id = u.id) THEN 1 ELSE 0 END AS is_hod,
             (SELECT GROUP_CONCAT(name SEPARATOR ', ') FROM departments WHERE head_id = u.id) AS head_of_department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN team_hierarchy th ON u.id = th.employee_id
      LEFT JOIN users sup ON th.supervisor_id = sup.id
      LEFT JOIN users mgr ON th.manager_id = mgr.id
      WHERE u.id = ?
    `, [id]);

    if (!user) {
      return res.status(404).json({ status: false, error: "User not found" });
    }

    // Direct reports if supervisor or manager
    let direct_reports = [];
    if (user.role === "supervisor" || user.role === "manager") {
      const [reports] = await pool.query(`
        SELECT u.id, u.name, u.email, u.role, u.image_url, u.status, th.assigned_at
        FROM team_hierarchy th
        JOIN users u ON th.employee_id = u.id
        WHERE th.supervisor_id = ?
        ORDER BY u.name ASC
      `, [id]);
      direct_reports = reports;
    }

    // Recent transfer history
    const [transfers] = await pool.query(`
      SELECT dt.*,
             sd.name AS source_dept_name,
             td.name AS target_dept_name
      FROM department_transfers dt
      LEFT JOIN departments sd ON dt.source_department_id = sd.id
      LEFT JOIN departments td ON dt.target_department_id = td.id
      WHERE dt.user_id = ?
      ORDER BY dt.transferred_at DESC
      LIMIT 5
    `, [id]);

    // Fetch comprehensive audit trail history
    const [audit_logs] = await pool.query(`
      SELECT * FROM user_audit_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 30
    `, [id]);

    return res.json({
      status: true,
      user: {
        ...user,
        direct_reports,
        transfers,
        audit_logs
      }
    });
  } catch (err) {
    console.error("Get user details error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch user details" });
  }
};

export const addUser = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      name,
      email,
      password,
      role = "employee",
      department_id,
      supervisor_id,
      is_hod = false,
      salary = 0,
      phone = "",
      address = "",
      image_url = "",
      status = "active",
      must_change_password,
      require_password_change
    } = req.body;

    if (!name || !email || !password) {
      await connection.rollback();
      return res.status(400).json({ status: false, error: "Name, email, and password are required" });
    }
    if (!["admin", "manager", "supervisor", "employee"].includes(role)) {
      await connection.rollback();
      return res.status(400).json({ status: false, error: "Invalid role specified" });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const mustChangePasswordVal = must_change_password !== undefined
      ? (must_change_password ? 1 : 0)
      : (require_password_change !== undefined ? (require_password_change ? 1 : 0) : 1);

    const [result] = await connection.query(
      `INSERT INTO users (name, email, password_hash, must_change_password, role, department_id, salary, phone, address, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), password_hash, mustChangePasswordVal, role, department_id || null, Number(salary) || 0, phone ? phone.trim() : "", address ? address.trim() : "", image_url ? image_url.trim() : "", status || "active"]
    );
    const newUserId = result.insertId;

    // Handle supervisor assignment for employees
    if (supervisor_id && role === "employee") {
      let managerId = null;
      if (department_id) {
        const [[dept]] = await connection.query("SELECT head_id FROM departments WHERE id = ?", [department_id]);
        managerId = dept?.head_id || null;
      }
      if (!managerId) {
        managerId = supervisor_id;
      }
      await connection.query(
        `INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id), manager_id = VALUES(manager_id)`,
        [newUserId, supervisor_id, managerId]
      );
    }

    // Handle HOD assignment
    if (is_hod && department_id) {
      await connection.query("UPDATE departments SET head_id = ? WHERE id = ?", [newUserId, department_id]);
    }

    await connection.commit();
    return res.json({ status: true, message: "User onboarded successfully", userId: newUserId });
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ status: false, error: "Email address is already registered" });
    }
    console.error("Add user error:", err);
    return res.status(500).json({ status: false, error: "Failed to create user" });
  } finally {
    connection.release();
  }
};

export const updateUser = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      name,
      email,
      password,
      role,
      department_id,
      supervisor_id,
      is_hod,
      salary,
      phone,
      address,
      image_url,
      status,
      must_change_password,
      require_password_change,
      sendEmailNotification,
      notifyEmail
    } = req.body;

    const [[existingUser]] = await connection.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!existingUser) {
      await connection.rollback();
      return res.status(404).json({ status: false, error: "User not found" });
    }

    let password_hash = existingUser.password_hash;
    let isPasswordReset = false;
    let newRawPassword = null;
    let mustChangePasswordVal = existingUser.must_change_password || 0;

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      newRawPassword = password.trim();
      password_hash = await bcrypt.hash(newRawPassword, salt);
      isPasswordReset = true;

      if (must_change_password !== undefined) {
        mustChangePasswordVal = must_change_password ? 1 : 0;
      } else if (require_password_change !== undefined) {
        mustChangePasswordVal = require_password_change ? 1 : 0;
      } else {
        mustChangePasswordVal = 1; // Default to 1 on admin reset
      }
    }

    const updatedRole = role || existingUser.role;
    const updatedDeptId = department_id !== undefined ? (department_id ? Number(department_id) : null) : existingUser.department_id;
    const updatedSalary = salary !== undefined ? Number(salary) : existingUser.salary;
    const updatedPhone = phone !== undefined ? phone.trim() : existingUser.phone;
    const updatedAddress = address !== undefined ? address.trim() : existingUser.address;
    const updatedImageUrl = image_url !== undefined ? image_url.trim() : existingUser.image_url;
    const updatedStatus = status || existingUser.status;

    // Prevent suspending the currently logged-in admin's own account
    if (Number(id) === req.user.id && updatedStatus === "inactive") {
      return res.status(400).json({ status: false, error: "You cannot suspend your own admin session account" });
    }

    await connection.query(
      `UPDATE users
       SET name = ?, email = ?, password_hash = ?, must_change_password = ?, role = ?, department_id = ?, salary = ?, phone = ?, address = ?, image_url = ?, status = ?
       WHERE id = ?`,
      [
        name ? name.trim() : existingUser.name,
        email ? email.trim().toLowerCase() : existingUser.email,
        password_hash,
        mustChangePasswordVal,
        updatedRole,
        updatedDeptId,
        updatedSalary,
        updatedPhone,
        updatedAddress,
        updatedImageUrl,
        updatedStatus,
        id
      ]
    );

    // Sync corresponding legacy role table if password changed
    if (isPasswordReset && newRawPassword) {
      try {
        const targetEmail = email ? email.trim().toLowerCase() : existingUser.email;
        if (updatedRole === "admin") {
          await connection.query("UPDATE admin SET password = ?, password_hash = ? WHERE email = ?", [newRawPassword, password_hash, targetEmail]);
        } else if (updatedRole === "manager") {
          await connection.query("UPDATE manager SET password = ?, password_hash = ? WHERE email = ?", [newRawPassword, password_hash, targetEmail]);
        } else if (updatedRole === "supervisor") {
          await connection.query("UPDATE supervisor SET password = ?, password_hash = ? WHERE email = ?", [newRawPassword, password_hash, targetEmail]);
        } else if (updatedRole === "employee") {
          await connection.query("UPDATE employee SET password = ?, password_hash = ? WHERE email = ?", [newRawPassword, password_hash, targetEmail]);
        }
      } catch (syncErr) {
        console.warn("Legacy role table sync warning:", syncErr.message);
      }

      // Dispatch temporary credentials email notification to employee
      if (sendEmailNotification !== false && notifyEmail !== false) {
        sendCredentialResetEmail(
          email ? email.trim().toLowerCase() : existingUser.email,
          name ? name.trim() : existingUser.name,
          newRawPassword
        ).catch(mailErr => console.error("[Admin Reset Credential Email Error]:", mailErr.message));
      }
    }

    // Handle reporting line in team_hierarchy ONLY if supervisor_id was explicitly supplied in payload
    if (supervisor_id !== undefined) {
      if (updatedRole === "employee") {
        if (supervisor_id) {
          let managerId = null;
          if (updatedDeptId) {
            const [[dept]] = await connection.query("SELECT head_id FROM departments WHERE id = ?", [updatedDeptId]);
            managerId = dept?.head_id || null;
          }
          if (!managerId) {
            managerId = supervisor_id;
          }
          await connection.query(
            `INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id), manager_id = VALUES(manager_id)`,
            [id, supervisor_id, managerId]
          );
        } else {
          await connection.query("DELETE FROM team_hierarchy WHERE employee_id = ?", [id]);
        }
      } else {
        // If role is supervisor/manager/admin, they are not an employee under another supervisor
        await connection.query("DELETE FROM team_hierarchy WHERE employee_id = ?", [id]);
      }
    }

    // Role demotion / status safeguard: if user was supervisor and is demoted or inactivated
    if (existingUser.role === "supervisor" && (updatedRole !== "supervisor" || updatedStatus === "inactive")) {
      // Reallocate direct reports to department head
      const [reports] = await connection.query("SELECT employee_id FROM team_hierarchy WHERE supervisor_id = ?", [id]);
      if (reports.length > 0 && updatedDeptId) {
        const [[dept]] = await connection.query("SELECT head_id FROM departments WHERE id = ?", [updatedDeptId]);
        if (dept?.head_id && dept.head_id !== Number(id)) {
          await connection.query("UPDATE team_hierarchy SET supervisor_id = ? WHERE supervisor_id = ?", [dept.head_id, id]);
        }
      }
    }

    // Handle HOD assignment
    if (is_hod !== undefined) {
      if (is_hod && updatedDeptId) {
        await connection.query("UPDATE departments SET head_id = ? WHERE id = ?", [id, updatedDeptId]);
      } else if (!is_hod) {
        // If explicitly unset, remove as HOD if they were HOD
        await connection.query("UPDATE departments SET head_id = NULL WHERE head_id = ?", [id]);
      }
    }

    // Record Audit Trail entries
    try {
      const adminName = req.user?.name ? `${req.user.name}` : "HR Admin";

      // 1. Salary / Compensation Change
      if (salary !== undefined && Number(salary) !== Number(existingUser.salary)) {
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Compensation', 'salary', ?, ?, ?, ?)`,
          [
            id,
            String(existingUser.salary || 0),
            String(salary),
            `Base salary adjusted from $${Number(existingUser.salary || 0).toLocaleString()} to $${Number(salary).toLocaleString()} per annum.`,
            adminName
          ]
        );
      }

      // 2. Contact Phone Number Change
      if (phone !== undefined && phone.trim() !== (existingUser.phone || "").trim()) {
        const oldPhone = existingUser.phone && existingUser.phone.trim() ? existingUser.phone.trim() : "None";
        const newPhone = phone.trim() ? phone.trim() : "None";
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Contact', 'phone', ?, ?, ?, ?)`,
          [
            id,
            oldPhone,
            newPhone,
            `Contact phone number updated from "${oldPhone}" to "${newPhone}".`,
            adminName
          ]
        );
      }

      // 3. Office Work Location Change
      if (address !== undefined && address.trim() !== (existingUser.address || "").trim()) {
        const oldAddr = existingUser.address && existingUser.address.trim() ? existingUser.address.trim() : "None";
        const newAddr = address.trim() ? address.trim() : "None";
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Location', 'address', ?, ?, ?, ?)`,
          [
            id,
            oldAddr,
            newAddr,
            `Office work location updated from "${oldAddr}" to "${newAddr}".`,
            adminName
          ]
        );
      }

      // 4. Role Tier Change
      if (role && role !== existingUser.role) {
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Role', 'role', ?, ?, ?, ?)`,
          [
            id,
            existingUser.role,
            role,
            `Governance role reallocated from ${existingUser.role.toUpperCase()} to ${role.toUpperCase()}.`,
            adminName
          ]
        );
      }

      // 5. Status Lifecycle Change
      if (status && status !== existingUser.status) {
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Status', 'status', ?, ?, ?, ?)`,
          [
            id,
            existingUser.status,
            status,
            `Account lifecycle status transitioned from ${existingUser.status} to ${status}.`,
            adminName
          ]
        );
      }

      // 6. Workforce Identity / Legal Name Change
      if (name && name.trim() !== (existingUser.name || "").trim()) {
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Identity', 'name', ?, ?, ?, ?)`,
          [
            id,
            existingUser.name,
            name.trim(),
            `Legal workforce member name updated from "${existingUser.name}" to "${name.trim()}".`,
            adminName
          ]
        );
      }

      // 7. Official Communication Email Change
      if (email && email.trim().toLowerCase() !== (existingUser.email || "").trim().toLowerCase()) {
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Contact', 'email', ?, ?, ?, ?)`,
          [
            id,
            existingUser.email,
            email.trim().toLowerCase(),
            `Official communication email updated from "${existingUser.email}" to "${email.trim().toLowerCase()}".`,
            adminName
          ]
        );
      }

      // 8. Department Reallocation
      if (department_id !== undefined && Number(department_id) !== Number(existingUser.department_id)) {
        let oldDeptName = "Unassigned";
        let newDeptName = "Unassigned";
        if (existingUser.department_id) {
          const [[oldDept]] = await connection.query("SELECT name FROM departments WHERE id = ?", [existingUser.department_id]);
          if (oldDept) oldDeptName = oldDept.name;
        }
        if (department_id) {
          const [[newDept]] = await connection.query("SELECT name FROM departments WHERE id = ?", [department_id]);
          if (newDept) newDeptName = newDept.name;
        }
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Department', 'department', ?, ?, ?, ?)`,
          [
            id,
            oldDeptName,
            newDeptName,
            `Department mobility reallocated from ${oldDeptName} to ${newDeptName}.`,
            adminName
          ]
        );
      }

      // 9. Password Reset
      if (isPasswordReset) {
        await connection.query(
          `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
           VALUES (?, 'Security', 'password', NULL, NULL, ?, ?)`,
          [
            id,
            `1-Click password reset executed. Temporary credentials issued.`,
            adminName
          ]
        );
      }
    } catch (auditErr) {
      console.warn("Audit logging non-fatal error:", auditErr.message);
    }

    await connection.commit();
    return res.json({ status: true, message: "User updated successfully" });
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ status: false, error: "Email address is already in use by another account" });
    }
    console.error("Update user error:", err);
    return res.status(500).json({ status: false, error: "Failed to update user" });
  } finally {
    connection.release();
  }
};

export const deleteUser = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    if (Number(id) === req.user.id) {
      await connection.rollback();
      return res.status(400).json({ status: false, error: "You cannot delete your own account" });
    }

    const [[user]] = await connection.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!user) {
      await connection.rollback();
      return res.status(404).json({ status: false, error: "User not found" });
    }

    // Unset HOD if this user was head of any department
    await connection.query("UPDATE departments SET head_id = NULL WHERE head_id = ?", [id]);

    // Reassign direct reports if user was supervisor
    if (user.role === "supervisor" || user.role === "manager") {
      if (user.department_id) {
        const [[dept]] = await connection.query("SELECT head_id FROM departments WHERE id = ?", [user.department_id]);
        if (dept?.head_id && dept.head_id !== Number(id)) {
          await connection.query("UPDATE team_hierarchy SET supervisor_id = ? WHERE supervisor_id = ?", [dept.head_id, id]);
        } else {
          await connection.query("DELETE FROM team_hierarchy WHERE supervisor_id = ?", [id]);
        }
      } else {
        await connection.query("DELETE FROM team_hierarchy WHERE supervisor_id = ?", [id]);
      }
    }

    // Clean up hierarchy
    await connection.query("DELETE FROM team_hierarchy WHERE employee_id = ? OR supervisor_id = ? OR manager_id = ?", [id, id, id]);

    // Delete user
    await connection.query("DELETE FROM users WHERE id = ?", [id]);

    await connection.commit();
    return res.json({ status: true, message: "User removed successfully" });
  } catch (err) {
    await connection.rollback();
    console.error("Delete user error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete user" });
  } finally {
    connection.release();
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

export const broadcastAnnouncement = async (req, res) => {
  try {
    const { userIds, subject, message, priority = "standard", channels } = req.body;

    if (!subject || !subject.trim() || !message || !message.trim()) {
      return res.status(400).json({ status: false, error: "Subject and announcement message are required." });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ status: false, error: "At least one recipient must be selected." });
    }

    // Fetch active recipient users
    const [recipients] = await pool.query(
      `SELECT id, name, email, role FROM users WHERE id IN (?) AND status = 'active'`,
      [userIds]
    );

    if (recipients.length === 0) {
      return res.status(400).json({ status: false, error: "No active users found among selected recipients." });
    }

    const adminName = req.user?.name || "Enterprise Administrator";
    let emailSentCount = 0;
    let emailFailedCount = 0;

    // 1. Dispatch Email Channel
    if (channels?.email !== false) {
      const emailPromises = recipients.map(async (recipient) => {
        try {
          const result = await sendBroadcastEmail(recipient.email, recipient.name, {
            subject: subject.trim(),
            message: message.trim(),
            priority,
            senderName: adminName
          });
          if (result && result.success) {
            emailSentCount++;
          } else {
            emailFailedCount++;
          }
        } catch (err) {
          console.error(`Failed to send broadcast email to ${recipient.email}:`, err.message);
          emailFailedCount++;
        }
      });

      await Promise.allSettled(emailPromises);
    }

    // 2. Dispatch In-App Channel (Insert into notifications table)
    if (channels?.inApp !== false) {
      try {
        const notifValues = recipients.map((r) => [
          r.id,
          subject.trim(),
          message.trim(),
          priority || "standard"
        ]);
        if (notifValues.length > 0) {
          await pool.query(
            `INSERT INTO notifications (user_id, title, message, priority) VALUES ?`,
            [notifValues]
          );
        }
      } catch (notifErr) {
        console.warn("In-app notification insert notice:", notifErr.message);
      }
    }

    return res.json({
      status: true,
      message: `Broadcast announcement dispatched successfully to ${recipients.length} workforce personnel.`,
      recipientsCount: recipients.length,
      emailSentCount,
      emailFailedCount
    });
  } catch (err) {
    console.error("broadcastAnnouncement error:", err);
    return res.status(500).json({ status: false, error: "Failed to dispatch broadcast announcement." });
  }
};
