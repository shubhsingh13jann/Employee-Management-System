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
      SELECT u.id, u.name, u.email, u.role, u.department_id, COALESCE(u.max_span_capacity, 8) AS max_span_capacity, u.salary, u.phone, u.address, u.image_url, u.status, u.created_at, u.must_change_password,
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
      SELECT u.id, u.name, u.email, u.role, u.department_id, COALESCE(u.max_span_capacity, 8) AS max_span_capacity, u.salary, u.phone, u.address, u.image_url, u.status, u.created_at, u.must_change_password,
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

    // Fetch employee document vault records
    const [documents] = await pool.query(`
      SELECT * FROM user_documents
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [id]);

    return res.json({
      status: true,
      user: {
        ...user,
        direct_reports,
        transfers,
        audit_logs,
        documents
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
             emp.id AS employee_id, emp.name AS employee_name, emp.email AS employee_email, emp.image_url AS employee_image, emp.role AS employee_role,
             sup.id AS supervisor_id, sup.name AS supervisor_name, sup.email AS supervisor_email, sup.image_url AS supervisor_image, COALESCE(sup.max_span_capacity, 8) AS supervisor_max_capacity,
             mgr.id AS manager_id, mgr.name AS manager_name, mgr.email AS manager_email, mgr.image_url AS manager_image,
             d.name AS department_name, d.id AS department_id,
             del.acting_supervisor_id, acting_sup.name AS acting_supervisor_name, del.start_date AS delegation_start_date, del.end_date AS delegation_end_date, del.reason AS delegation_reason
      FROM team_hierarchy th
      JOIN users emp ON th.employee_id = emp.id
      JOIN users sup ON th.supervisor_id = sup.id
      JOIN users mgr ON th.manager_id = mgr.id
      LEFT JOIN departments d ON emp.department_id = d.id
      LEFT JOIN hierarchy_delegations del ON (del.original_supervisor_id = sup.id AND del.is_active = TRUE AND CURRENT_DATE BETWEEN del.start_date AND del.end_date)
      LEFT JOIN users acting_sup ON del.acting_supervisor_id = acting_sup.id
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
      `INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id, assigned_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id), manager_id = VALUES(manager_id), assigned_at = CURRENT_TIMESTAMP`,
      [employee_id, supervisor_id, manager_id]
    );

    // Audit trail logging
    try {
      const adminName = req.user?.name || "HR Admin";
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'hierarchy_assigned', 'team_hierarchy', ?, ?)`,
        [
          employee_id,
          JSON.stringify({
            message: `Assigned employee ${employee_id} to supervisor ${supervisor_id} and manager ${manager_id}`,
            supervisor_id,
            manager_id,
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({ status: true, message: "Employee successfully assigned to supervisor & manager" });
  } catch (err) {
    console.error("Assign hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to update team assignment" });
  }
};

export const reassignHierarchy = async (req, res) => {
  try {
    const { employee_id, supervisor_id, manager_id, sync_department } = req.body;
    if (!employee_id || !supervisor_id) {
      return res.status(400).json({ status: false, error: "Employee and new Supervisor are required." });
    }

    let resolvedManagerId = manager_id;
    if (!resolvedManagerId) {
      // Lookup existing manager from current mapping
      const [existing] = await pool.query(
        "SELECT manager_id FROM team_hierarchy WHERE employee_id = ?",
        [employee_id]
      );
      if (existing && existing.length > 0 && existing[0].manager_id) {
        resolvedManagerId = existing[0].manager_id;
      } else {
        // Fallback: supervisor's department manager or any manager
        const [supRows] = await pool.query(
          "SELECT department_id FROM users WHERE id = ?",
          [supervisor_id]
        );
        if (supRows.length > 0 && supRows[0].department_id) {
          const [deptMgr] = await pool.query(
            "SELECT id FROM users WHERE role = 'manager' AND department_id = ? LIMIT 1",
            [supRows[0].department_id]
          );
          if (deptMgr.length > 0) {
            resolvedManagerId = deptMgr[0].id;
          }
        }
      }
    }

    if (!resolvedManagerId) {
      const [anyMgr] = await pool.query("SELECT id FROM users WHERE role = 'manager' LIMIT 1");
      if (anyMgr.length > 0) resolvedManagerId = anyMgr[0].id;
    }

    await pool.query(
      `INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id, assigned_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id), manager_id = VALUES(manager_id), assigned_at = CURRENT_TIMESTAMP`,
      [employee_id, supervisor_id, resolvedManagerId]
    );

    // If cross-department transfer synchronization requested, update employee's department
    let departmentTransferred = false;
    let newDepartmentName = "";
    if (sync_department) {
      const [supDeptRows] = await pool.query(
        "SELECT u.department_id, d.name AS department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?",
        [supervisor_id]
      );
      if (supDeptRows.length > 0 && supDeptRows[0].department_id) {
        const targetDeptId = supDeptRows[0].department_id;
        newDepartmentName = supDeptRows[0].department_name || "";
        await pool.query("UPDATE users SET department_id = ? WHERE id = ?", [targetDeptId, employee_id]);
        departmentTransferred = true;

        try {
          const adminName = req.user?.name || "HR Admin";
          await pool.query(
            `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
             VALUES (?, 'department_transferred', 'department_id', ?, ?)`,
            [
              employee_id,
              JSON.stringify({
                message: `Transferred employee ${employee_id} to department ${newDepartmentName} (ID: ${targetDeptId}) alongside hierarchy reallocation`,
                new_department_id: targetDeptId,
                supervisor_id,
              }),
              adminName,
            ]
          );
        } catch (deptAuditErr) {
          console.warn("Department transfer audit log notice:", deptAuditErr.message);
        }
      }
    }

    // Audit Log
    try {
      const adminName = req.user?.name || "HR Admin";
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'hierarchy_reassigned', 'team_hierarchy', ?, ?)`,
        [
          employee_id,
          JSON.stringify({
            message: `Reassigned employee ${employee_id} to supervisor ${supervisor_id} and manager ${resolvedManagerId}${departmentTransferred ? ` with auto-transfer to ${newDepartmentName}` : ""}`,
            supervisor_id,
            manager_id: resolvedManagerId,
            sync_department: Boolean(sync_department),
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({
      status: true,
      message: departmentTransferred
        ? `Reporting line reallocated & employee department synced to ${newDepartmentName}!`
        : "Reporting relationship successfully updated!",
    });
  } catch (err) {
    console.error("Reassign hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to reassign team hierarchy" });
  }
};

export const updateSupervisorCapacity = async (req, res) => {
  try {
    const { supervisor_id, max_span_capacity } = req.body;
    if (!supervisor_id || max_span_capacity === undefined || max_span_capacity === null) {
      return res.status(400).json({ status: false, error: "Supervisor ID and max capacity are required." });
    }
    const capNum = parseInt(max_span_capacity, 10);
    if (isNaN(capNum) || capNum < 1 || capNum > 50) {
      return res.status(400).json({ status: false, error: "Max capacity must be a valid number between 1 and 50." });
    }

    await pool.query("UPDATE users SET max_span_capacity = ? WHERE id = ? AND role = 'supervisor'", [
      capNum,
      supervisor_id,
    ]);

    // Audit Log
    try {
      const adminName = req.user?.name || "HR Admin";
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'capacity_updated', 'max_span_capacity', ?, ?)`,
        [
          supervisor_id,
          JSON.stringify({
            message: `Updated max span capacity for supervisor ${supervisor_id} to ${capNum} direct reports`,
            max_span_capacity: capNum,
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({
      status: true,
      message: `Supervisor capacity successfully updated to ${capNum} reports!`,
      max_span_capacity: capNum,
    });
  } catch (err) {
    console.error("Update supervisor capacity error:", err);
    return res.status(500).json({ status: false, error: "Failed to update supervisor capacity" });
  }
};

export const unlinkHierarchy = async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ status: false, error: "Employee ID is required." });
    }

    await pool.query("DELETE FROM team_hierarchy WHERE employee_id = ?", [employeeId]);

    // Audit Log
    try {
      const adminName = req.user?.name || "HR Admin";
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'hierarchy_unlinked', 'team_hierarchy', ?, ?)`,
        [
          employeeId,
          JSON.stringify({ message: `Unlinked employee ${employeeId} from reporting line` }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({ status: true, message: "Employee reporting relationship unlinked successfully." });
  } catch (err) {
    console.error("Unlink hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to unlink reporting relationship" });
  }
};

export const swapHierarchy = async (req, res) => {
  try {
    const { employeeId1, employeeId2 } = req.body;
    if (!employeeId1 || !employeeId2) {
      return res.status(400).json({ status: false, error: "Both employee IDs are required for a reporting swap." });
    }
    if (String(employeeId1) === String(employeeId2)) {
      return res.status(400).json({ status: false, error: "Cannot swap an employee with themselves." });
    }

    // Retrieve both current mappings
    const [rows1] = await pool.query(
      "SELECT th.*, u.name as employee_name FROM team_hierarchy th JOIN users u ON th.employee_id = u.id WHERE th.employee_id = ?",
      [employeeId1]
    );
    const [rows2] = await pool.query(
      "SELECT th.*, u.name as employee_name FROM team_hierarchy th JOIN users u ON th.employee_id = u.id WHERE th.employee_id = ?",
      [employeeId2]
    );

    if (rows1.length === 0 || rows2.length === 0) {
      return res.status(404).json({ status: false, error: "Both employees must be currently mapped to perform a reporting swap." });
    }

    const map1 = rows1[0];
    const map2 = rows2[0];

    // Swap mappings:
    // Employee 1 gets map2's supervisor and manager
    // Employee 2 gets map1's supervisor and manager
    await pool.query(
      "UPDATE team_hierarchy SET supervisor_id = ?, manager_id = ?, assigned_at = CURRENT_TIMESTAMP WHERE employee_id = ?",
      [map2.supervisor_id, map2.manager_id, employeeId1]
    );

    await pool.query(
      "UPDATE team_hierarchy SET supervisor_id = ?, manager_id = ?, assigned_at = CURRENT_TIMESTAMP WHERE employee_id = ?",
      [map1.supervisor_id, map1.manager_id, employeeId2]
    );

    // Audit Log
    try {
      const adminName = req.user?.name || "HR Admin";
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'hierarchy_swapped', 'team_hierarchy', ?, ?)`,
        [
          employeeId1,
          JSON.stringify({
            message: `Swapped reporting line with ${map2.employee_name} (ID: ${employeeId2})`,
            previous_supervisor: map1.supervisor_id,
            new_supervisor: map2.supervisor_id,
          }),
          adminName,
        ]
      );
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'hierarchy_swapped', 'team_hierarchy', ?, ?)`,
        [
          employeeId2,
          JSON.stringify({
            message: `Swapped reporting line with ${map1.employee_name} (ID: ${employeeId1})`,
            previous_supervisor: map2.supervisor_id,
            new_supervisor: map1.supervisor_id,
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({
      status: true,
      message: `Successfully swapped reporting lines between ${map1.employee_name} and ${map2.employee_name}!`,
    });
  } catch (err) {
    console.error("Swap hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to swap employee reporting hierarchy" });
  }
};


export const bulkAssignHierarchy = async (req, res) => {
  try {
    const { employee_ids, supervisor_id, manager_id } = req.body;
    if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.status(400).json({ status: false, error: "At least one employee must be selected for bulk assignment." });
    }
    if (!supervisor_id) {
      return res.status(400).json({ status: false, error: "Supervisor ID is required." });
    }

    let resolvedManagerId = manager_id;
    if (!resolvedManagerId) {
      // Lookup supervisor's department manager or any manager
      const [supRows] = await pool.query(
        "SELECT department_id FROM users WHERE id = ?",
        [supervisor_id]
      );
      if (supRows.length > 0 && supRows[0].department_id) {
        const [deptMgr] = await pool.query(
          "SELECT id FROM users WHERE role = 'manager' AND department_id = ? LIMIT 1",
          [supRows[0].department_id]
        );
        if (deptMgr.length > 0) {
          resolvedManagerId = deptMgr[0].id;
        }
      }
      if (!resolvedManagerId) {
        const [anyMgr] = await pool.query(
          "SELECT id FROM users WHERE role = 'manager' LIMIT 1"
        );
        resolvedManagerId = anyMgr.length > 0 ? anyMgr[0].id : 1;
      }
    }

    // Build batch insert / upsert values
    const values = [];
    const placeholders = employee_ids.map((empId) => {
      values.push(empId, supervisor_id, resolvedManagerId);
      return "(?, ?, ?, CURRENT_TIMESTAMP)";
    }).join(", ");

    await pool.query(
      `INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id, assigned_at)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id), manager_id = VALUES(manager_id), assigned_at = CURRENT_TIMESTAMP`,
      values
    );

    // Audit Log
    try {
      const adminName = req.user?.name || "HR Admin";
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'hierarchy_bulk_assigned', 'team_hierarchy', ?, ?)`,
        [
          employee_ids[0],
          JSON.stringify({
            message: `Bulk assigned ${employee_ids.length} employees to supervisor ${supervisor_id} and manager ${resolvedManagerId}`,
            employee_ids,
            supervisor_id,
            manager_id: resolvedManagerId,
            count: employee_ids.length,
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({
      status: true,
      message: `Successfully onboarded ${employee_ids.length} employee${employee_ids.length > 1 ? "s" : ""} to squad!`,
      count: employee_ids.length,
    });
  } catch (err) {
    console.error("Bulk assign hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to perform bulk team assignment" });
  }
};

export const getHierarchyAuditLogs = async (req, res) => {
  try {
    let logs = [];
    try {
      const [rows] = await pool.query(`
        SELECT ual.id, 
               ual.action_type AS action, 
               ual.details, 
               ual.created_at,
               ual.performed_by, 
               COALESCE(perf.name, ual.performed_by, 'System Administrator') AS performed_by_name, 
               perf.email AS performed_by_email,
               ual.user_id AS employee_id, 
               emp.name AS employee_name, 
               emp.email AS employee_email
        FROM user_audit_logs ual
        LEFT JOIN users perf ON (ual.performed_by = perf.id OR ual.performed_by = perf.name)
        LEFT JOIN users emp ON ual.user_id = emp.id
        WHERE ual.action_type IN ('hierarchy_assigned', 'hierarchy_reassigned', 'hierarchy_unlinked', 'hierarchy_bulk_assigned')
        ORDER BY ual.created_at DESC
        LIMIT 100
      `);
      logs = rows;
    } catch (queryErr) {
      // Fallback if schema has column named 'action'
      try {
        const [rows] = await pool.query(`
          SELECT ual.id, 
                 ual.action, 
                 ual.details, 
                 ual.created_at,
                 ual.performed_by, 
                 perf.name AS performed_by_name, 
                 perf.email AS performed_by_email,
                 ual.user_id AS employee_id, 
                 emp.name AS employee_name, 
                 emp.email AS employee_email
          FROM user_audit_logs ual
          LEFT JOIN users perf ON ual.performed_by = perf.id
          LEFT JOIN users emp ON ual.user_id = emp.id
          WHERE ual.action IN ('hierarchy_assigned', 'hierarchy_reassigned', 'hierarchy_unlinked', 'hierarchy_bulk_assigned')
          ORDER BY ual.created_at DESC
          LIMIT 100
        `);
        logs = rows;
      } catch (fallbackErr) {
        console.warn("Audit logs fallback query notice:", fallbackErr.message);
        logs = [];
      }
    }

    // Safely parse details if JSON string
    const parsedLogs = logs.map((log) => {
      let parsedDetails = null;
      if (typeof log.details === "string") {
        try {
          parsedDetails = JSON.parse(log.details);
        } catch {
          parsedDetails = { message: log.details };
        }
      } else {
        parsedDetails = log.details;
      }
      return { ...log, details: parsedDetails };
    });

    return res.json({ status: true, logs: parsedLogs });
  } catch (err) {
    console.error("getHierarchyAuditLogs error:", err);
    return res.json({ status: true, logs: [] });
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

export const getUserDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    let [docs] = await pool.query(
      "SELECT * FROM user_documents WHERE user_id = ? ORDER BY created_at DESC",
      [id]
    );

    // If user has no documents yet, seed initial standard statutory documents
    if (docs.length === 0) {
      const defaultDocs = [
        [id, "Government ID / Passport Scan", "Statutory proof of identity and citizenship verification", "Identity", "pdf", "2.4 MB", "verified", req.user?.id || 1],
        [id, "Employment Contract & Offer Letter", "Signed formal executive contract and terms", "Contract", "pdf", "1.8 MB", "verified", req.user?.id || 1],
        [id, "Non-Disclosure Agreement (NDA)", "Confidentiality and proprietary rights covenants", "NDA", "pdf", "840 KB", "verified", req.user?.id || 1],
        [id, "Tax Withholding & Direct Deposit Form", "W-4 withholding declaration and verified bank coordinates", "Tax", "pdf", "620 KB", "verified", req.user?.id || 1]
      ];
      await pool.query(
        `INSERT INTO user_documents (user_id, name, description, category, file_type, file_size, status, uploaded_by) VALUES ?`,
        [defaultDocs]
      );
      const [seededDocs] = await pool.query(
        "SELECT * FROM user_documents WHERE user_id = ? ORDER BY created_at DESC",
        [id]
      );
      docs = seededDocs;
    }

    return res.json({ status: true, documents: docs });
  } catch (err) {
    console.error("getUserDocuments error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch user documents" });
  }
};

export const uploadUserDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description = "Compliance record",
      category = "Identity",
      file_type = "pdf",
      file_size = "1.2 MB",
      file_data = null,
      status = "verified"
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ status: false, error: "Document name is required" });
    }

    const [result] = await pool.query(
      `INSERT INTO user_documents (user_id, name, description, category, file_type, file_size, file_data, status, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), description.trim(), category, file_type, file_size, file_data, status, req.user?.id || 1]
    );

    // Audit log
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
       VALUES (?, 'Document Vault', 'documents', NULL, ?, ?, ?)`,
      [id, name.trim(), `Uploaded compliance document: ${name.trim()} (${category})`, req.user?.id || 1]
    );

    const [newDoc] = await pool.query("SELECT * FROM user_documents WHERE id = ?", [result.insertId]);

    return res.json({
      status: true,
      message: "Document uploaded to employee vault successfully",
      document: newDoc[0]
    });
  } catch (err) {
    console.error("uploadUserDocument error:", err);
    return res.status(500).json({ status: false, error: "Failed to upload document" });
  }
};

export const updateUserDocumentStatus = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const { status } = req.body;

    if (!["verified", "pending", "expired"].includes(status)) {
      return res.status(400).json({ status: false, error: "Invalid document status" });
    }

    const [existing] = await pool.query("SELECT * FROM user_documents WHERE id = ? AND user_id = ?", [docId, id]);
    if (existing.length === 0) {
      return res.status(404).json({ status: false, error: "Document not found" });
    }

    await pool.query("UPDATE user_documents SET status = ? WHERE id = ? AND user_id = ?", [status, docId, id]);

    // Audit log
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
       VALUES (?, 'Document Vault', 'document_status', ?, ?, ?, ?)`,
      [id, existing[0].status, status, `Updated status of ${existing[0].name} to ${status}`, req.user?.id || 1]
    );

    return res.json({ status: true, message: `Document status updated to ${status}` });
  } catch (err) {
    console.error("updateUserDocumentStatus error:", err);
    return res.status(500).json({ status: false, error: "Failed to update document status" });
  }
};

export const deleteUserDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;

    const [existing] = await pool.query("SELECT * FROM user_documents WHERE id = ? AND user_id = ?", [docId, id]);
    if (existing.length === 0) {
      return res.status(404).json({ status: false, error: "Document not found" });
    }

    await pool.query("DELETE FROM user_documents WHERE id = ? AND user_id = ?", [docId, id]);

    // Audit log
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
       VALUES (?, 'Document Vault', 'documents', ?, NULL, ?, ?)`,
      [id, existing[0].name, `Deleted compliance record: ${existing[0].name}`, req.user?.id || 1]
    );

    return res.json({ status: true, message: "Document removed from employee vault" });
  } catch (err) {
    console.error("deleteUserDocument error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete document" });
  }
};

// ============================================================================
// 💼 ENTERPRISE PROJECTS & STRATEGIC MILESTONES (Section 5)
// ============================================================================

export const getAdminProjects = async (req, res) => {
  try {
    const { dept, status, search } = req.query;
    let query = `
      SELECT p.*,
             d.name AS department_name, d.code AS department_code,
             s.name AS supervisor_name, s.email AS supervisor_email, s.image_url AS supervisor_image,
             creator.name AS creator_name,
             COUNT(t.id) AS total_tasks,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
             SUM(CASE WHEN t.status != 'completed' AND t.due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue_tasks,
             SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks
      FROM projects p
      LEFT JOIN departments d ON p.department_id = d.id
      LEFT JOIN users s ON p.lead_supervisor_id = s.id
      LEFT JOIN users creator ON p.created_by = creator.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE 1=1
    `;
    const params = [];
    if (dept && dept !== "all") {
      query += ` AND p.department_id = ?`;
      params.push(dept);
    }
    if (status && status !== "all") {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query += ` AND (p.title LIKE ? OR p.description LIKE ? OR d.name LIKE ? OR s.name LIKE ?)`;
      params.push(q, q, q, q);
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const [projects] = await pool.query(query, params);

    // Fetch milestones summary per project to calculate milestone & deliverable-based velocity
    let milestonesByProject = {};
    try {
      const [allMilestones] = await pool.query(
        "SELECT project_id, status, deliverables FROM project_milestones"
      );
      for (const m of allMilestones) {
        if (!milestonesByProject[m.project_id]) {
          milestonesByProject[m.project_id] = [];
        }
        let del = [];
        try {
          del = typeof m.deliverables === "string" ? JSON.parse(m.deliverables) : (m.deliverables || []);
        } catch {
          del = [];
        }
        milestonesByProject[m.project_id].push({
          status: m.status,
          deliverables: del,
        });
      }
    } catch (mErr) {
      console.warn("Could not query project_milestones for velocity:", mErr.message);
    }

    const formatted = projects.map((p) => {
      const total = Number(p.total_tasks) || 0;
      const completed = Number(p.completed_tasks) || 0;
      const overdue = Number(p.overdue_tasks) || 0;

      const projMilestones = milestonesByProject[p.id] || [];
      const totalMilestones = projMilestones.length;
      const completedMilestones = projMilestones.filter((m) => m.status === "completed").length;

      let milestoneProgress = 0;
      if (totalMilestones > 0) {
        const totalDel = projMilestones.reduce((acc, m) => acc + (m.deliverables?.length || 0), 0);
        const completedDel = projMilestones.reduce(
          (acc, m) => acc + (m.deliverables?.filter((d) => d.completed).length || 0),
          0
        );
        if (totalDel > 0) {
          milestoneProgress = Math.round((completedDel / totalDel) * 100);
        } else {
          milestoneProgress = Math.round((completedMilestones / totalMilestones) * 100);
        }
      }

      const progress =
        total > 0
          ? Math.round((completed / total) * 100)
          : totalMilestones > 0
          ? milestoneProgress
          : p.status === "completed"
          ? 100
          : 0;

      let daysLeft = null;
      let isOverdue = false;
      if (p.target_date) {
        const diffMs = new Date(p.target_date).getTime() - Date.now();
        daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysLeft < 0 && p.status !== "completed") {
          isOverdue = true;
        }
      }

      let health = "healthy";
      if (p.status === "completed") {
        health = "completed";
      } else if (isOverdue || overdue > 0) {
        health = "critical";
      } else if (daysLeft !== null && daysLeft <= 7 && progress < 70) {
        health = "at_risk";
      }

      return {
        ...p,
        total_tasks: total,
        completed_tasks: completed,
        overdue_tasks: overdue,
        in_progress_tasks: Number(p.in_progress_tasks) || 0,
        total_milestones: totalMilestones,
        completed_milestones: completedMilestones,
        progress_percentage: progress,
        days_left: daysLeft,
        is_overdue: isOverdue,
        health,
      };
    });

    return res.json({ status: true, projects: formatted });
  } catch (err) {
    console.error("getAdminProjects error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch enterprise projects" });
  }
};

export const createAdminProject = async (req, res) => {
  try {
    const {
      title,
      description = "",
      department_id,
      lead_supervisor_id,
      status = "planning",
      priority = "medium",
      budget = 0.0,
      start_date,
      target_date,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: false, error: "Project title is required" });
    }
    if (!department_id) {
      return res.status(400).json({ status: false, error: "Department is required" });
    }

    const [result] = await pool.query(
      `INSERT INTO projects (title, description, department_id, created_by, lead_supervisor_id, status, priority, budget, start_date, target_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        department_id,
        req.user?.id || 1,
        lead_supervisor_id || null,
        status,
        priority,
        Number(budget) || 0.0,
        start_date || null,
        target_date || null,
      ]
    );

    const [newProj] = await pool.query(
      `SELECT p.*, d.name AS department_name, s.name AS supervisor_name
       FROM projects p
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN users s ON p.lead_supervisor_id = s.id
       WHERE p.id = ?`,
      [result.insertId]
    );

    // Audit log
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
       VALUES (?, 'Enterprise Project Created', 'projects', NULL, ?, ?, ?)`,
      [
        req.user?.id || 1,
        title.trim(),
        `Created strategic initiative #${result.insertId}: ${title.trim()} (Dept ID: ${department_id})`,
        req.user?.id || 1,
      ]
    );

    return res.json({
      status: true,
      message: "Strategic initiative launched successfully",
      project: newProj[0],
    });
  } catch (err) {
    console.error("createAdminProject error:", err);
    return res.status(500).json({ status: false, error: "Failed to create strategic initiative" });
  }
};

export const updateAdminProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["planning", "active", "on_hold", "completed", "archived"].includes(status)) {
      return res.status(400).json({ status: false, error: "Invalid status lifecycle value" });
    }

    const [existing] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ status: false, error: "Project not found" });
    }

    await pool.query("UPDATE projects SET status = ? WHERE id = ?", [status, id]);

    // Audit log
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
       VALUES (?, 'Project Lifecycle Updated', 'status', ?, ?, ?, ?)`,
      [
        req.user?.id || 1,
        existing[0].status,
        status,
        `Transitioned initiative #${id} (${existing[0].title}) status from ${existing[0].status} to ${status}`,
        req.user?.id || 1,
      ]
    );

    return res.json({ status: true, message: `Project status transitioned to ${status}` });
  } catch (err) {
    console.error("updateAdminProjectStatus error:", err);
    return res.status(500).json({ status: false, error: "Failed to update project status" });
  }
};

export const updateAdminProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description = "",
      department_id,
      lead_supervisor_id,
      priority = "medium",
      budget = 0.0,
      start_date,
      target_date,
    } = req.body;

    const [existing] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ status: false, error: "Project not found" });
    }

    await pool.query(
      `UPDATE projects 
       SET title = ?, description = ?, department_id = ?, lead_supervisor_id = ?, priority = ?, budget = ?, start_date = ?, target_date = ?
       WHERE id = ?`,
      [
        title || existing[0].title,
        description !== undefined ? description : existing[0].description,
        department_id || existing[0].department_id,
        lead_supervisor_id !== undefined ? lead_supervisor_id : existing[0].lead_supervisor_id,
        priority || existing[0].priority,
        budget !== undefined ? budget : existing[0].budget,
        start_date || existing[0].start_date,
        target_date || existing[0].target_date,
        id,
      ]
    );

    // Audit log
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
       VALUES (?, 'Project Details Updated', 'projects', ?, ?, ?, ?)`,
      [
        req.user?.id || 1,
        existing[0].title,
        title || existing[0].title,
        `Updated strategic initiative #${id} metadata and parameters`,
        req.user?.id || 1,
      ]
    );

    return res.json({ status: true, message: "Project updated successfully" });
  } catch (err) {
    console.error("updateAdminProject error:", err);
    return res.status(500).json({ status: false, error: "Failed to update project" });
  }
};

export const deleteAdminProject = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ status: false, error: "Project not found" });
    }

    // Unlink tasks or mark deleted
    await pool.query("DELETE FROM tasks WHERE project_id = ?", [id]);
    await pool.query("DELETE FROM projects WHERE id = ?", [id]);

    // Audit log
    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
       VALUES (?, 'Project Deleted', 'projects', ?, NULL, ?, ?)`,
      [
        req.user?.id || 1,
        existing[0].title,
        `Removed strategic initiative #${id} (${existing[0].title}) and its associated tasks`,
        req.user?.id || 1,
      ]
    );

    return res.json({ status: true, message: "Strategic initiative deleted successfully" });
  } catch (err) {
    console.error("deleteAdminProject error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete project" });
  }
};

export const getAdminSupervisorsCapacity = async (req, res) => {
  try {
    const [supervisors] = await pool.query(`
      SELECT u.id, u.name, u.email, u.image_url, u.department_id,
             d.name AS department_name, d.code AS department_code,
             COUNT(DISTINCT p.id) AS active_projects_count,
             COUNT(DISTINCT t.id) AS total_assigned_tasks,
             SUM(CASE WHEN t.status != 'completed' THEN 1 ELSE 0 END) AS active_tasks_count,
             SUM(CASE WHEN t.status != 'completed' AND t.due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue_tasks_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN projects p ON p.lead_supervisor_id = u.id AND p.status IN ('planning', 'active')
      LEFT JOIN tasks t ON (t.assigned_to = u.id OR t.assigned_by = u.id)
      WHERE u.role = 'supervisor'
      GROUP BY u.id
      ORDER BY active_projects_count DESC, active_tasks_count DESC
    `);

    return res.json({ status: true, supervisors });
  } catch (err) {
    console.error("getAdminSupervisorsCapacity error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch supervisors capacity" });
  }
};


export const broadcastSquad = async (req, res) => {
  try {
    const { supervisor_id, subject, message, priority = "standard", include_supervisor = true } = req.body;
    if (!supervisor_id) {
      return res.status(400).json({ status: false, error: "Supervisor ID is required." });
    }
    if (!subject || !subject.trim() || !message || !message.trim()) {
      return res.status(400).json({ status: false, error: "Subject and announcement message are required." });
    }

    // Fetch all active subordinates in squad
    const [subordinates] = await pool.query(
      `SELECT emp.id, emp.name, emp.email, emp.role 
       FROM team_hierarchy th
       JOIN users emp ON th.employee_id = emp.id
       WHERE th.supervisor_id = ? AND emp.status = "active"`,
      [supervisor_id]
    );

    const [supervisorRows] = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [supervisor_id]
    );

    const recipients = [...subordinates];
    if (include_supervisor && supervisorRows.length > 0) {
      recipients.push(supervisorRows[0]);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ status: false, error: "No active squad members found to broadcast to." });
    }

    const adminName = req.user?.name || "Enterprise Administrator";
    let emailSentCount = 0;
    let emailFailedCount = 0;

    const emailPromises = recipients.map(async (recipient) => {
      try {
        const result = await sendBroadcastEmail(recipient.email, recipient.name, {
          subject: subject.trim(),
          message: message.trim(),
          priority,
          senderName: adminName,
        });
        if (result && result.success) {
          emailSentCount++;
        } else {
          emailFailedCount++;
        }
      } catch (err) {
        console.error(`Failed to send squad broadcast email to ${recipient.email}:`, err.message);
        emailFailedCount++;
      }
    });

    await Promise.all(emailPromises);

    // Audit Trail Logging
    try {
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, "squad_broadcast", "announcement", ?, ?)`,
        [
          supervisor_id,
          JSON.stringify({
            message: `Dispatched squad broadcast "${subject.trim()}" to ${recipients.length} members under supervisor ${supervisor_id}`,
            supervisor_id,
            subject: subject.trim(),
            recipients_count: recipients.length,
            priority,
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Squad broadcast audit log notice:", auditErr.message);
    }

    return res.json({
      status: true,
      message: `Broadcast successfully dispatched to ${recipients.length} squad member${recipients.length > 1 ? "s" : ""}!`,
      recipientsCount: recipients.length,
      sentCount: emailSentCount,
      failedCount: emailFailedCount,
    });
  } catch (err) {
    console.error("Squad broadcast error:", err);
    return res.status(500).json({ status: false, error: "Failed to broadcast announcement to squad" });
  }
};

export const getHierarchyDelegations = async (req, res) => {
  try {
    const [delegations] = await pool.query(`
      SELECT hd.id, hd.original_supervisor_id, hd.acting_supervisor_id,
             hd.start_date, hd.end_date, hd.reason, hd.is_active, hd.created_at,
             orig.name AS original_supervisor_name, orig.email AS original_supervisor_email,
             acting.name AS acting_supervisor_name, acting.email AS acting_supervisor_email,
             d.name AS department_name
      FROM hierarchy_delegations hd
      JOIN users orig ON hd.original_supervisor_id = orig.id
      JOIN users acting ON hd.acting_supervisor_id = acting.id
      LEFT JOIN departments d ON orig.department_id = d.id
      ORDER BY hd.created_at DESC
    `);
    return res.json({ status: true, delegations });
  } catch (err) {
    console.error("Get hierarchy delegations error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch delegations" });
  }
};

export const createHierarchyDelegation = async (req, res) => {
  try {
    const { original_supervisor_id, acting_supervisor_id, start_date, end_date, reason } = req.body;
    if (!original_supervisor_id || !acting_supervisor_id || !start_date || !end_date) {
      return res.status(400).json({ status: false, error: "Original supervisor, acting lead, start date, and end date are required." });
    }
    if (String(original_supervisor_id) === String(acting_supervisor_id)) {
      return res.status(400).json({ status: false, error: "Acting supervisor must be different from the original supervisor." });
    }

    const adminName = req.user?.name || "HR Admin";

    // Deactivate any existing active delegation for this supervisor
    await pool.query(
      "UPDATE hierarchy_delegations SET is_active = FALSE WHERE original_supervisor_id = ? AND is_active = TRUE",
      [original_supervisor_id]
    );

    const [result] = await pool.query(
      `INSERT INTO hierarchy_delegations (original_supervisor_id, acting_supervisor_id, start_date, end_date, reason, is_active, delegated_by)
       VALUES (?, ?, ?, ?, ?, TRUE, ?)`,
      [original_supervisor_id, acting_supervisor_id, start_date, end_date, reason || "", req.user?.id || null]
    );

    // Audit trail logging
    try {
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'hierarchy_delegation_created', 'hierarchy_delegations', ?, ?)`,
        [
          original_supervisor_id,
          JSON.stringify({
            message: `Delegated supervisor leadership for user ${original_supervisor_id} to acting lead ${acting_supervisor_id} (${start_date} to ${end_date})`,
            original_supervisor_id,
            acting_supervisor_id,
            start_date,
            end_date,
            reason: reason || "",
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({
      status: true,
      message: "Temporary team lead delegation active successfully!",
      delegationId: result.insertId,
    });
  } catch (err) {
    console.error("Create hierarchy delegation error:", err);
    return res.status(500).json({ status: false, error: "Failed to create leadership delegation" });
  }
};

export const revokeHierarchyDelegation = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ status: false, error: "Delegation ID is required" });
    }

    const [rows] = await pool.query("SELECT * FROM hierarchy_delegations WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: false, error: "Delegation not found" });
    }

    await pool.query("UPDATE hierarchy_delegations SET is_active = FALSE WHERE id = ?", [id]);

    const adminName = req.user?.name || "HR Admin";
    try {
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'hierarchy_delegation_revoked', 'hierarchy_delegations', ?, ?)`,
        [
          rows[0].original_supervisor_id,
          JSON.stringify({
            message: `Revoked leadership delegation #${id} for supervisor ${rows[0].original_supervisor_id}`,
            delegation_id: id,
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({ status: true, message: "Leadership delegation revoked and primary lead restored." });
  } catch (err) {
    console.error("Revoke hierarchy delegation error:", err);
    return res.status(500).json({ status: false, error: "Failed to revoke leadership delegation" });
  }
};


export const getSecondaryHierarchy = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT sth.id, sth.assigned_at, sth.role_title, sth.project_id,
             emp.id AS employee_id, emp.name AS employee_name, emp.email AS employee_email, emp.image_url AS employee_image,
             emp_d.name AS employee_department,
             sec_sup.id AS secondary_supervisor_id, sec_sup.name AS secondary_supervisor_name, sec_sup.email AS secondary_supervisor_email,
             sec_sup.image_url AS secondary_supervisor_image,
             sup_d.name AS secondary_supervisor_department,
             p.title AS project_title
      FROM secondary_team_hierarchy sth
      JOIN users emp ON sth.employee_id = emp.id
      JOIN users sec_sup ON sth.secondary_supervisor_id = sec_sup.id
      LEFT JOIN departments emp_d ON emp.department_id = emp_d.id
      LEFT JOIN departments sup_d ON sec_sup.department_id = sup_d.id
      LEFT JOIN projects p ON sth.project_id = p.id
      ORDER BY sec_sup.name, emp.name
    `);
    return res.json({ status: true, matrixReports: rows });
  } catch (err) {
    console.error("Get secondary hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch matrix reporting hierarchy" });
  }
};

export const assignSecondaryHierarchy = async (req, res) => {
  try {
    const { employee_id, secondary_supervisor_id, project_id, role_title = "Dotted-Line Member" } = req.body;
    if (!employee_id || !secondary_supervisor_id) {
      return res.status(400).json({ status: false, error: "Employee and secondary supervisor are required" });
    }
    if (String(employee_id) === String(secondary_supervisor_id)) {
      return res.status(400).json({ status: false, error: "An employee cannot be their own secondary supervisor" });
    }

    // Check if secondary supervisor is already their primary supervisor
    const [primary] = await pool.query("SELECT supervisor_id FROM team_hierarchy WHERE employee_id = ?", [employee_id]);
    if (primary.length > 0 && String(primary[0].supervisor_id) === String(secondary_supervisor_id)) {
      return res.status(400).json({ status: false, error: "Selected user is already this employee's primary supervisor" });
    }

    await pool.query(
      `INSERT INTO secondary_team_hierarchy (employee_id, secondary_supervisor_id, project_id, role_title, assigned_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE project_id = VALUES(project_id), role_title = VALUES(role_title), assigned_at = CURRENT_TIMESTAMP`,
      [employee_id, secondary_supervisor_id, project_id || null, role_title.trim() || "Dotted-Line Member"]
    );

    const adminName = req.user?.name || "HR Admin";
    try {
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'secondary_hierarchy_assigned', 'secondary_team_hierarchy', ?, ?)`,
        [
          employee_id,
          JSON.stringify({
            message: `Assigned dotted-line / secondary supervisor ${secondary_supervisor_id} (${role_title}) to employee ${employee_id}`,
            employee_id,
            secondary_supervisor_id,
            project_id: project_id || null,
            role_title: role_title.trim() || "Dotted-Line Member",
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({ status: true, message: "Secondary matrix reporting line assigned successfully!" });
  } catch (err) {
    console.error("Assign secondary hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to assign secondary hierarchy" });
  }
};

export const unlinkSecondaryHierarchy = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ status: false, error: "Record ID is required" });
    }

    const [rows] = await pool.query("SELECT * FROM secondary_team_hierarchy WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: false, error: "Secondary reporting record not found" });
    }

    await pool.query("DELETE FROM secondary_team_hierarchy WHERE id = ?", [id]);

    const adminName = req.user?.name || "HR Admin";
    try {
      await pool.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'secondary_hierarchy_unlinked', 'secondary_team_hierarchy', ?, ?)`,
        [
          rows[0].employee_id,
          JSON.stringify({
            message: `Severed dotted-line reporting link between employee ${rows[0].employee_id} and secondary supervisor ${rows[0].secondary_supervisor_id}`,
            employee_id: rows[0].employee_id,
            secondary_supervisor_id: rows[0].secondary_supervisor_id,
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr.message);
    }

    return res.json({ status: true, message: "Secondary reporting relationship unlinked successfully." });
  } catch (err) {
    console.error("Unlink secondary hierarchy error:", err);
    return res.status(500).json({ status: false, error: "Failed to unlink secondary reporting relationship" });
  }
};

export const applyReorgPlan = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { changes, reason } = req.body;
    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ status: false, error: "A non-empty list of changes is required to apply reorganization plan." });
    }

    await connection.beginTransaction();

    const adminName = req.user?.name || "HR Admin";
    let updatedCount = 0;
    const auditDetails = [];

    for (const change of changes) {
      const { employee_id, supervisor_id, sync_department } = change;
      let resolvedManagerId = change.manager_id;

      if (!employee_id || !supervisor_id) continue;

      if (!resolvedManagerId) {
        // Resolve manager from supervisor's department or existing mapping
        const [existing] = await connection.query(
          "SELECT manager_id FROM team_hierarchy WHERE employee_id = ?",
          [employee_id]
        );
        if (existing && existing.length > 0 && existing[0].manager_id) {
          resolvedManagerId = existing[0].manager_id;
        } else {
          const [supRows] = await connection.query(
            "SELECT department_id FROM users WHERE id = ?",
            [supervisor_id]
          );
          if (supRows.length > 0 && supRows[0].department_id) {
            const [deptMgr] = await connection.query(
              "SELECT id FROM users WHERE role = 'manager' AND department_id = ? LIMIT 1",
              [supRows[0].department_id]
            );
            if (deptMgr.length > 0) resolvedManagerId = deptMgr[0].id;
          }
        }
      }

      if (!resolvedManagerId) {
        const [anyMgr] = await connection.query("SELECT id FROM users WHERE role = 'manager' LIMIT 1");
        if (anyMgr.length > 0) resolvedManagerId = anyMgr[0].id;
      }

      await connection.query(
        `INSERT INTO team_hierarchy (employee_id, supervisor_id, manager_id, assigned_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id), manager_id = VALUES(manager_id), assigned_at = CURRENT_TIMESTAMP`,
        [employee_id, supervisor_id, resolvedManagerId]
      );

      // Department sync if requested
      if (sync_department) {
        const [supDeptRows] = await connection.query(
          "SELECT department_id FROM users WHERE id = ?",
          [supervisor_id]
        );
        if (supDeptRows.length > 0 && supDeptRows[0].department_id) {
          await connection.query("UPDATE users SET department_id = ? WHERE id = ?", [
            supDeptRows[0].department_id,
            employee_id,
          ]);
        }
      }

      updatedCount++;
      auditDetails.push({ employee_id, supervisor_id, manager_id: resolvedManagerId, sync_department });
    }

    // Insert batch reorganization audit log
    try {
      await connection.query(
        `INSERT INTO user_audit_logs (user_id, action_type, field_name, details, performed_by)
         VALUES (?, 'reorganization_plan_applied', 'team_hierarchy', ?, ?)`,
        [
          req.user?.id || 1,
          JSON.stringify({
            message: `Applied reorganization simulation plan: updated ${updatedCount} reporting relationships`,
            changes_count: updatedCount,
            reason: reason || "Departmental Reorganization Simulation Plan",
            changes: auditDetails,
          }),
          adminName,
        ]
      );
    } catch (auditErr) {
      console.warn("Reorg audit log notice:", auditErr.message);
    }

    await connection.commit();
    return res.json({
      status: true,
      message: `Reorganization plan applied successfully! Updated ${updatedCount} reporting relationships.`,
      count: updatedCount,
    });
  } catch (err) {
    await connection.rollback();
    console.error("Apply reorganization plan error:", err);
    return res.status(500).json({ status: false, error: "Failed to apply reorganization plan" });
  } finally {
    connection.release();
  }
};

// ==========================================
// Sub-Milestones & Deliverables Endpoints
// ==========================================

export const getProjectMilestones = async (req, res) => {
  try {
    const { id } = req.params;
    const [milestones] = await pool.query(
      `SELECT pm.*, 
              u.name AS owner_name, u.email AS owner_email, u.image_url AS owner_image, u.role AS owner_role
       FROM project_milestones pm
       LEFT JOIN users u ON pm.owner_id = u.id
       WHERE pm.project_id = ?
       ORDER BY pm.order_index ASC, pm.due_date ASC`,
      [id]
    );

    const formatted = milestones.map((m) => {
      let deliverables = [];
      try {
        deliverables = typeof m.deliverables === "string" ? JSON.parse(m.deliverables) : (m.deliverables || []);
      } catch (e) {
        deliverables = [];
      }

      const totalDel = deliverables.length;
      const completedDel = deliverables.filter((d) => d.completed).length;

      return {
        ...m,
        deliverables,
        total_deliverables: totalDel,
        completed_deliverables: completedDel,
        progress_percentage: totalDel > 0 ? Math.round((completedDel / totalDel) * 100) : (m.status === "completed" ? 100 : 0),
      };
    });

    return res.json({ status: true, milestones: formatted });
  } catch (err) {
    console.error("getProjectMilestones error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch project milestones" });
  }
};

export const createProjectMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description = "",
      due_date = null,
      owner_id = null,
      status = "pending",
      order_index = 0,
      deliverables = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: false, error: "Milestone title is required" });
    }

    const deliverablesJson = JSON.stringify(deliverables);

    const [result] = await pool.query(
      `INSERT INTO project_milestones (project_id, title, description, due_date, owner_id, status, order_index, deliverables)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title.trim(), description.trim(), due_date || null, owner_id || null, status, order_index, deliverablesJson]
    );

    const [newMilestone] = await pool.query(
      `SELECT pm.*, u.name AS owner_name, u.email AS owner_email, u.image_url AS owner_image, u.role AS owner_role
       FROM project_milestones pm
       LEFT JOIN users u ON pm.owner_id = u.id
       WHERE pm.id = ?`,
      [result.insertId]
    );

    let parsedDeliverables = [];
    try {
      parsedDeliverables = typeof newMilestone[0].deliverables === "string" ? JSON.parse(newMilestone[0].deliverables) : (newMilestone[0].deliverables || []);
    } catch {
      parsedDeliverables = [];
    }

    return res.json({
      status: true,
      message: "Milestone phase created successfully",
      milestone: {
        ...newMilestone[0],
        deliverables: parsedDeliverables,
        total_deliverables: parsedDeliverables.length,
        completed_deliverables: parsedDeliverables.filter((d) => d.completed).length,
      },
    });
  } catch (err) {
    console.error("createProjectMilestone error:", err);
    return res.status(500).json({ status: false, error: "Failed to create milestone" });
  }
};

export const updateProjectMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const {
      title,
      description,
      due_date,
      owner_id,
      status,
      order_index,
      deliverables,
    } = req.body;

    const [existing] = await pool.query("SELECT * FROM project_milestones WHERE id = ?", [milestoneId]);
    if (existing.length === 0) {
      return res.status(404).json({ status: false, error: "Milestone not found" });
    }

    const current = existing[0];
    const newDeliverables = deliverables !== undefined ? JSON.stringify(deliverables) : current.deliverables;

    await pool.query(
      `UPDATE project_milestones
       SET title = ?, description = ?, due_date = ?, owner_id = ?, status = ?, order_index = ?, deliverables = ?
       WHERE id = ?`,
      [
        title !== undefined ? title.trim() : current.title,
        description !== undefined ? description.trim() : current.description,
        due_date !== undefined ? (due_date || null) : current.due_date,
        owner_id !== undefined ? (owner_id || null) : current.owner_id,
        status !== undefined ? status : current.status,
        order_index !== undefined ? order_index : current.order_index,
        newDeliverables,
        milestoneId,
      ]
    );

    const [updated] = await pool.query(
      `SELECT pm.*, u.name AS owner_name, u.email AS owner_email, u.image_url AS owner_image, u.role AS owner_role
       FROM project_milestones pm
       LEFT JOIN users u ON pm.owner_id = u.id
       WHERE pm.id = ?`,
      [milestoneId]
    );

    let parsedDeliverables = [];
    try {
      parsedDeliverables = typeof updated[0].deliverables === "string" ? JSON.parse(updated[0].deliverables) : (updated[0].deliverables || []);
    } catch {
      parsedDeliverables = [];
    }

    return res.json({
      status: true,
      message: "Milestone updated successfully",
      milestone: {
        ...updated[0],
        deliverables: parsedDeliverables,
        total_deliverables: parsedDeliverables.length,
        completed_deliverables: parsedDeliverables.filter((d) => d.completed).length,
      },
    });
  } catch (err) {
    console.error("updateProjectMilestone error:", err);
    return res.status(500).json({ status: false, error: "Failed to update milestone" });
  }
};

export const toggleMilestoneStatus = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { status } = req.body;

    const [existing] = await pool.query("SELECT * FROM project_milestones WHERE id = ?", [milestoneId]);
    if (existing.length === 0) {
      return res.status(404).json({ status: false, error: "Milestone not found" });
    }

    const current = existing[0];
    const newStatus = status || (current.status === "completed" ? "in_progress" : "completed");

    let deliverables = [];
    try {
      deliverables = typeof current.deliverables === "string" ? JSON.parse(current.deliverables) : (current.deliverables || []);
    } catch {
      deliverables = [];
    }

    // If marked completed, set all checklist items to completed
    if (newStatus === "completed" && deliverables.length > 0) {
      deliverables = deliverables.map((d) => ({ ...d, completed: true }));
    }

    await pool.query(
      `UPDATE project_milestones SET status = ?, deliverables = ? WHERE id = ?`,
      [newStatus, JSON.stringify(deliverables), milestoneId]
    );

    return res.json({
      status: true,
      message: `Milestone status set to ${newStatus}`,
      milestone_id: milestoneId,
      status_val: newStatus,
      deliverables,
    });
  } catch (err) {
    console.error("toggleMilestoneStatus error:", err);
    return res.status(500).json({ status: false, error: "Failed to toggle milestone status" });
  }
};

export const toggleDeliverableItem = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { deliverableId, completed } = req.body;

    const [existing] = await pool.query("SELECT * FROM project_milestones WHERE id = ?", [milestoneId]);
    if (existing.length === 0) {
      return res.status(404).json({ status: false, error: "Milestone not found" });
    }

    let deliverables = [];
    try {
      deliverables = typeof existing[0].deliverables === "string" ? JSON.parse(existing[0].deliverables) : (existing[0].deliverables || []);
    } catch {
      deliverables = [];
    }

    deliverables = deliverables.map((item) => {
      if (item.id === deliverableId) {
        return { ...item, completed: completed !== undefined ? completed : !item.completed };
      }
      return item;
    });

    const allCompleted = deliverables.length > 0 && deliverables.every((d) => d.completed);
    const anyCompleted = deliverables.some((d) => d.completed);
    let newStatus = existing[0].status;
    if (allCompleted) {
      newStatus = "completed";
    } else if (anyCompleted && newStatus === "pending") {
      newStatus = "in_progress";
    } else if (!anyCompleted && newStatus === "completed") {
      newStatus = "in_progress";
    }

    await pool.query(
      `UPDATE project_milestones SET deliverables = ?, status = ? WHERE id = ?`,
      [JSON.stringify(deliverables), newStatus, milestoneId]
    );

    return res.json({
      status: true,
      message: "Deliverable item updated",
      milestone_id: milestoneId,
      deliverables,
      milestone_status: newStatus,
    });
  } catch (err) {
    console.error("toggleDeliverableItem error:", err);
    return res.status(500).json({ status: false, error: "Failed to toggle deliverable item" });
  }
};

export const deleteProjectMilestone = async (req, res) => {
  try {
    const { milestoneId } = req.params;
    await pool.query("DELETE FROM project_milestones WHERE id = ?", [milestoneId]);
    return res.json({ status: true, message: "Milestone deleted successfully" });
  } catch (err) {
    console.error("deleteProjectMilestone error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete milestone" });
  }
};


export const getProjectDossier = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Project details with department, supervisor, creator
    const [projects] = await pool.query(
      `SELECT p.*,
              d.name AS department_name, d.code AS department_code,
              s.name AS supervisor_name, s.email AS supervisor_email, s.image_url AS supervisor_image,
              creator.name AS creator_name
       FROM projects p
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN users s ON p.lead_supervisor_id = s.id
       LEFT JOIN users creator ON p.created_by = creator.id
       WHERE p.id = ?`,
      [id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ status: false, error: "Project not found" });
    }

    const project = projects[0];

    // 2. Tasks linked to project
    const [tasks] = await pool.query(
      `SELECT t.*,
              u.name AS assignee_name, u.email AS assignee_email, u.image_url AS assignee_image, u.role AS assignee_role,
              assigner.name AS assigner_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users assigner ON t.assigned_by = assigner.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
      [id]
    );

    // 3. Sub-milestones & deliverables
    const [rawMilestones] = await pool.query(
      `SELECT m.*,
              u.name AS owner_name, u.email AS owner_email, u.image_url AS owner_image
       FROM project_milestones m
       LEFT JOIN users u ON m.owner_id = u.id
       WHERE m.project_id = ?
       ORDER BY m.order_index ASC, m.id ASC`,
      [id]
    );

    const milestones = rawMilestones.map((m) => {
      let deliverables = [];
      try {
        deliverables = typeof m.deliverables === "string" ? JSON.parse(m.deliverables) : (m.deliverables || []);
      } catch {
        deliverables = [];
      }
      const totalDel = deliverables.length;
      const completedDel = deliverables.filter((d) => d.completed).length;
      const progress = totalDel > 0 ? Math.round((completedDel / totalDel) * 100) : m.status === "completed" ? 100 : 0;
      return {
        ...m,
        deliverables,
        total_deliverables: totalDel,
        completed_deliverables: completedDel,
        progress_percentage: progress,
      };
    });

    // 4. Assigned Squad Roster
    const [squad] = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email, u.role, u.image_url, d.name AS department_name,
              CASE WHEN u.id = ? THEN 'Lead Supervisor'
                   WHEN u.role = 'supervisor' THEN 'Supervisor'
                   WHEN u.role = 'manager' THEN 'Department Manager'
                   ELSE 'Squad Contributor'
              END AS squad_role,
              (SELECT COUNT(*) FROM tasks WHERE project_id = ? AND assigned_to = u.id) AS assigned_tasks_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = ? AND assigned_to = u.id AND status = 'completed') AS completed_tasks_count
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = ?
          OR u.id IN (SELECT assigned_to FROM tasks WHERE project_id = ? AND assigned_to IS NOT NULL)
          OR (u.department_id = ? AND u.role IN ('employee', 'supervisor'))
       ORDER BY (u.id = ?) DESC, assigned_tasks_count DESC, u.name ASC`,
      [
        project.lead_supervisor_id || 0,
        project.id,
        project.id,
        project.lead_supervisor_id || 0,
        project.id,
        project.department_id || 0,
        project.lead_supervisor_id || 0,
      ]
    );

    // 5. Audit history ledger
    const [auditLogs] = await pool.query(
      `SELECT a.*,
              u.name AS actor_name, u.email AS actor_email, u.role AS actor_role
       FROM user_audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.details LIKE ?
          OR a.details LIKE ?
          OR (a.field_name = 'projects' AND (a.new_value = ? OR a.old_value = ?))
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [`%#${project.id}%`, `%${project.title}%`, project.title, project.title]
    );

    // 6. Telemetry calculations
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
    const overdueTasks = tasks.filter((t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < new Date()).length;
    const velocityPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.status === "completed").length;
    const milestonesPercentage = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    let daysLeft = null;
    let isOverdue = false;
    if (project.target_date) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const target = new Date(project.target_date);
      target.setHours(0, 0, 0, 0);
      daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      isOverdue = daysLeft < 0 && project.status !== "completed";
    }

    let health = "healthy";
    if (project.status === "completed") {
      health = "completed";
    } else if (isOverdue || overdueTasks > 0 || project.priority === "critical") {
      health = isOverdue ? "critical" : "at_risk";
    }

    return res.json({
      status: true,
      dossier: {
        project: {
          ...project,
          days_left: daysLeft,
          is_overdue: isOverdue,
          health,
        },
        telemetry: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          in_progress_tasks: inProgressTasks,
          overdue_tasks: overdueTasks,
          task_velocity: velocityPercentage,
          total_milestones: totalMilestones,
          completed_milestones: completedMilestones,
          milestones_progress: milestonesPercentage,
          budget_allocated: Number(project.budget || 0),
          budget_spent: Math.round(Number(project.budget || 0) * (velocityPercentage / 100)),
          days_left: daysLeft,
          is_overdue: isOverdue,
          health,
        },
        squad,
        milestones,
        tasks,
        audit_logs: auditLogs,
      },
    });
  } catch (err) {
    console.error("getProjectDossier error:", err);
    return res.status(500).json({ status: false, error: "Failed to retrieve project 360 dossier" });
  }
};


export const getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;

    // Check project exists
    const [[project]] = await pool.query(
      `SELECT p.id, p.title, p.department_id, p.lead_supervisor_id, d.name AS department_name
       FROM projects p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = ?`,
      [id]
    );

    if (!project) {
      return res.status(404).json({ status: false, error: "Project not found" });
    }

    // 1. Fetch allocated squad members
    const [members] = await pool.query(
      `SELECT pm.id AS membership_id, pm.project_id, pm.user_id, pm.role_tag, pm.allocation_percentage, pm.assigned_at,
              u.name, u.email, u.role, u.image_url,
              d.name AS department_name, d.code AS department_code,
              (SELECT COUNT(*) FROM tasks WHERE project_id = pm.project_id AND assigned_to = pm.user_id) AS project_tasks_count,
              (SELECT COUNT(*) FROM tasks WHERE project_id = pm.project_id AND assigned_to = pm.user_id AND status = 'completed') AS completed_project_tasks_count,
              (SELECT COUNT(*) FROM tasks WHERE assigned_to = pm.user_id AND status != 'completed') AS total_active_tasks,
              (SELECT COUNT(DISTINCT project_id) FROM project_members WHERE user_id = pm.user_id) AS total_active_projects
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE pm.project_id = ?
       ORDER BY pm.assigned_at ASC`,
      [id]
    );

    // 2. Fetch available personnel who are not yet in the squad
    const memberUserIds = members.map((m) => m.user_id);
    const excludePlaceholders = memberUserIds.length > 0 ? memberUserIds.map(() => "?").join(",") : "0";

    const [availableUsers] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.image_url, u.department_id,
              d.name AS department_name, d.code AS department_code,
              (SELECT COUNT(*) FROM tasks WHERE assigned_to = u.id AND status != 'completed') AS total_active_tasks,
              (SELECT COUNT(DISTINCT project_id) FROM project_members WHERE user_id = u.id) AS total_active_projects
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.role IN ('employee', 'supervisor')
         AND u.id NOT IN (${excludePlaceholders})
       ORDER BY (u.department_id = ?) DESC, u.name ASC`,
      [...memberUserIds, project.department_id || 0]
    );

    // Format capacity conflict warnings
    const membersWithCapacity = members.map((m) => {
      const isOverloaded = m.total_active_tasks >= 5 || m.total_active_projects >= 3 || m.allocation_percentage > 100;
      const isNearCapacity = !isOverloaded && (m.total_active_tasks >= 3 || m.total_active_projects >= 2);
      return {
        ...m,
        capacity_status: isOverloaded ? "overloaded" : isNearCapacity ? "near_capacity" : "optimal",
        capacity_warning: isOverloaded
          ? `High Workload: ${m.total_active_tasks} active tasks across ${m.total_active_projects} initiatives (${m.allocation_percentage}% allocated)`
          : isNearCapacity
          ? `Moderate: ${m.total_active_tasks} active tasks across ${m.total_active_projects} initiatives`
          : null,
      };
    });

    const candidatesWithCapacity = availableUsers.map((u) => {
      const isOverloaded = u.total_active_tasks >= 5 || u.total_active_projects >= 3;
      const isNearCapacity = !isOverloaded && (u.total_active_tasks >= 3 || u.total_active_projects >= 2);
      return {
        ...u,
        capacity_status: isOverloaded ? "overloaded" : isNearCapacity ? "near_capacity" : "optimal",
        capacity_warning: isOverloaded
          ? `High Workload: ${u.total_active_tasks} active tasks across ${u.total_active_projects} initiatives`
          : isNearCapacity
          ? `Moderate: ${u.total_active_tasks} active tasks`
          : null,
      };
    });

    return res.json({
      status: true,
      project,
      members: membersWithCapacity,
      available_users: candidatesWithCapacity,
    });
  } catch (err) {
    console.error("getProjectMembers error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch project squad members" });
  }
};

export const addProjectMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role_tag = "Contributor", allocation_percentage = 100 } = req.body;

    if (!user_id) {
      return res.status(400).json({ status: false, error: "User ID is required" });
    }

    const [[existing]] = await pool.query(
      "SELECT id FROM project_members WHERE project_id = ? AND user_id = ?",
      [id, user_id]
    );

    if (existing) {
      return res.status(400).json({ status: false, error: "User is already allocated to this project squad" });
    }

    const [result] = await pool.query(
      `INSERT INTO project_members (project_id, user_id, role_tag, allocation_percentage)
       VALUES (?, ?, ?, ?)`,
      [id, user_id, role_tag.trim(), Number(allocation_percentage) || 100]
    );

    // Fetch user & project names for audit logging
    const [[user]] = await pool.query("SELECT name FROM users WHERE id = ?", [user_id]);
    const [[project]] = await pool.query("SELECT title FROM projects WHERE id = ?", [id]);

    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, new_value, details, performed_by)
       VALUES (?, 'Project Squad Member Added', 'project_members', ?, ?, ?)`,
      [
        req.user?.id || 1,
        role_tag,
        `Assigned ${user?.name || "User #" + user_id} as ${role_tag} (${allocation_percentage}% allocation) to initiative #${id} (${project?.title})`,
        String(req.user?.id || 1),
      ]
    );

    return res.json({
      status: true,
      message: "Member successfully allocated to project squad",
      membership_id: result.insertId,
    });
  } catch (err) {
    console.error("addProjectMember error:", err);
    return res.status(500).json({ status: false, error: "Failed to add project squad member" });
  }
};

export const removeProjectMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;

    const [[membership]] = await pool.query(
      `SELECT pm.*, u.name AS user_name, p.title AS project_title
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       JOIN projects p ON pm.project_id = p.id
       WHERE pm.id = ? AND pm.project_id = ?`,
      [memberId, id]
    );

    if (!membership) {
      return res.status(404).json({ status: false, error: "Squad membership record not found" });
    }

    await pool.query("DELETE FROM project_members WHERE id = ?", [memberId]);

    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, details, performed_by)
       VALUES (?, 'Project Squad Member Removed', 'project_members', ?, ?, ?)`,
      [
        req.user?.id || 1,
        membership.role_tag,
        `Unassigned ${membership.user_name} (${membership.role_tag}) from initiative #${id} (${membership.project_title})`,
        String(req.user?.id || 1),
      ]
    );

    return res.json({ status: true, message: "Member unassigned from project squad" });
  } catch (err) {
    console.error("removeProjectMember error:", err);
    return res.status(500).json({ status: false, error: "Failed to remove squad member" });
  }
};


export const getProjectTasks = async (req, res) => {
  try {
    const { id } = req.params;

    const [[project]] = await pool.query(
      `SELECT p.id, p.title, p.project_code, p.status, p.priority, p.target_date
       FROM projects p WHERE p.id = ?`,
      [id]
    );

    if (!project) {
      return res.status(404).json({ status: false, error: "Project not found" });
    }

    const [tasks] = await pool.query(
      `SELECT t.*,
              assignee.name AS assignee_name,
              assignee.email AS assignee_email,
              assignee.role AS assignee_role,
              assignee.image_url AS assignee_image_url,
              pm.role_tag AS assignee_squad_role,
              assigner.name AS assigner_name,
              assigner.email AS assigner_email
       FROM tasks t
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       LEFT JOIN project_members pm ON (pm.project_id = t.project_id AND pm.user_id = t.assigned_to)
       LEFT JOIN users assigner ON t.assigned_by = assigner.id
       WHERE t.project_id = ?
       ORDER BY 
         CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
         CASE WHEN t.due_date IS NULL THEN '9999-12-31' ELSE t.due_date END ASC,
         t.created_at DESC`,
      [id]
    );

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
    const pendingTasks = tasks.filter((t) => t.status === "pending").length;
    const nowStr = new Date().toISOString().split("T")[0];
    const overdueTasks = tasks.filter((t) => t.status !== "completed" && t.due_date && t.due_date < nowStr).length;

    return res.json({
      status: true,
      project,
      tasks,
      metrics: {
        total: totalTasks,
        completed: completedTasks,
        in_progress: inProgressTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        velocity_pct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
    });
  } catch (err) {
    console.error("getProjectTasks error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch project tasks" });
  }
};

export const createProjectTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description = "",
      assigned_to = null,
      priority = "medium",
      due_date = null,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ status: false, error: "Task title is required" });
    }

    const [[project]] = await pool.query("SELECT id, title, project_code FROM projects WHERE id = ?", [id]);
    if (!project) {
      return res.status(404).json({ status: false, error: "Project not found" });
    }

    const assignedById = req.user?.id || 1;
    const normalizedPriority = ["low", "medium", "high", "urgent"].includes(priority?.toLowerCase())
      ? priority.toLowerCase()
      : "medium";

    const [result] = await pool.query(
      `INSERT INTO tasks (project_id, title, description, assigned_by, assigned_to, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        id,
        title.trim(),
        description ? description.trim() : null,
        assignedById,
        assigned_to ? Number(assigned_to) : null,
        normalizedPriority,
        due_date || null,
      ]
    );

    let assigneeName = "Unassigned";
    if (assigned_to) {
      const [[assignee]] = await pool.query("SELECT name FROM users WHERE id = ?", [assigned_to]);
      if (assignee) assigneeName = assignee.name;
    }

    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, new_value, details, performed_by)
       VALUES (?, 'Project Task Created', 'tasks', ?, ?, ?)`,
      [
        assignedById,
        title.trim(),
        `Created task "${title.trim()}" (Priority: ${normalizedPriority}, Assignee: ${assigneeName}) for project #${id} (${project.title})`,
        String(assignedById),
      ]
    );

    return res.json({
      status: true,
      message: "Task created successfully",
      task_id: result.insertId,
    });
  } catch (err) {
    console.error("createProjectTask error:", err);
    return res.status(500).json({ status: false, error: "Failed to create project task" });
  }
};

export const updateProjectTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in_progress", "under_review", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ status: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
    }

    const [[task]] = await pool.query(
      `SELECT t.*, p.title AS project_title FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ status: false, error: "Task not found" });
    }

    await pool.query("UPDATE tasks SET status = ? WHERE id = ?", [status, taskId]);

    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, new_value, details, performed_by)
       VALUES (?, 'Project Task Status Updated', 'tasks.status', ?, ?, ?, ?)`,
      [
        req.user?.id || 1,
        task.status,
        status,
        `Task #${taskId} "${task.title}" status changed from "${task.status}" to "${status}" in project #${task.project_id}`,
        String(req.user?.id || 1),
      ]
    );

    return res.json({
      status: true,
      message: "Task status updated successfully",
      task_id: Number(taskId),
      new_status: status,
    });
  } catch (err) {
    console.error("updateProjectTaskStatus error:", err);
    return res.status(500).json({ status: false, error: "Failed to update task status" });
  }
};

export const deleteProjectTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [[task]] = await pool.query(
      `SELECT t.*, p.title AS project_title FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ status: false, error: "Task not found" });
    }

    await pool.query("DELETE FROM tasks WHERE id = ?", [taskId]);

    await pool.query(
      `INSERT INTO user_audit_logs (user_id, action_type, field_name, old_value, details, performed_by)
       VALUES (?, 'Project Task Deleted', 'tasks', ?, ?, ?)`,
      [
        req.user?.id || 1,
        task.title,
        `Deleted task #${taskId} "${task.title}" from project #${task.project_id} (${task.project_title || "N/A"})`,
        String(req.user?.id || 1),
      ]
    );

    return res.json({ status: true, message: "Task deleted successfully" });
  } catch (err) {
    console.error("deleteProjectTask error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete task" });
  }
};
