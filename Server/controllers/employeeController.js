import pool from "../config/db.js";

export const getEmployeeDashboard = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const [[{ pendingCount }]] = await pool.query(
      "SELECT COUNT(*) AS pendingCount FROM tasks WHERE assigned_to = ? AND status = 'pending'",
      [employeeId]
    );

    const [[{ inProgressCount }]] = await pool.query(
      "SELECT COUNT(*) AS inProgressCount FROM tasks WHERE assigned_to = ? AND status = 'in_progress'",
      [employeeId]
    );

    const [[{ completedCount }]] = await pool.query(
      "SELECT COUNT(*) AS completedCount FROM tasks WHERE assigned_to = ? AND status = 'completed'",
      [employeeId]
    );

    const [[{ activeLeavesCount }]] = await pool.query(
      "SELECT COUNT(*) AS activeLeavesCount FROM leave_requests WHERE employee_id = ? AND status IN ('pending_supervisor', 'pending_manager')",
      [employeeId]
    );

    return res.json({
      status: true,
      stats: {
        pendingCount,
        inProgressCount,
        completedCount,
        activeLeavesCount
      }
    });
  } catch (err) {
    console.error("Employee dashboard error:", err);
    return res.status(500).json({ status: false, error: "Failed to load employee metrics" });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const [tasks] = await pool.query(
      `SELECT t.*, sup.name AS supervisor_name, sup.email AS supervisor_email,
              p.title AS project_title,
              (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
       FROM tasks t
       JOIN users sup ON t.assigned_by = sup.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_to = ?
       ORDER BY FIELD(t.status, 'in_progress', 'pending', 'under_review', 'completed'), t.due_date ASC`,
      [employeeId]
    );
    return res.json({ status: true, tasks });
  } catch (err) {
    console.error("Get my tasks error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch tasks" });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const employeeId = req.user.id;

    if (!["pending", "in_progress", "under_review", "completed"].includes(status)) {
      return res.status(400).json({ status: false, error: "Invalid task status specified" });
    }

    const [result] = await pool.query(
      "UPDATE tasks SET status = ? WHERE id = ? AND (assigned_to = ? OR assigned_by = ?)",
      [status, id, employeeId, employeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, error: "Task not found or unauthorized to update" });
    }

    return res.json({ status: true, message: `Task status updated to '${status}'` });
  } catch (err) {
    console.error("Update task status error:", err);
    return res.status(500).json({ status: false, error: "Failed to update task status" });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const [leaves] = await pool.query(
      `SELECT lr.*, sup.name AS supervisor_name, mgr.name AS manager_name
       FROM leave_requests lr
       LEFT JOIN users sup ON lr.supervisor_id = sup.id
       LEFT JOIN users mgr ON lr.manager_id = mgr.id
       WHERE lr.employee_id = ?
       ORDER BY lr.applied_at DESC`,
      [employeeId]
    );
    return res.json({ status: true, leaves });
  } catch (err) {
    console.error("Get my leaves error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch leave history" });
  }
};

export const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { leave_type = "casual", start_date, end_date, reason } = req.body;

    if (!start_date || !end_date || !reason || !reason.trim()) {
      return res.status(400).json({ status: false, error: "Start date, end date, and reason are required" });
    }

    // Resolve assigned supervisor and manager from hierarchy
    const [hierarchyRows] = await pool.query(
      "SELECT supervisor_id, manager_id FROM team_hierarchy WHERE employee_id = ?",
      [employeeId]
    );

    let supervisorId = hierarchyRows[0]?.supervisor_id;
    let managerId = hierarchyRows[0]?.manager_id;

    if (!supervisorId) {
      // Fallback: assign to first supervisor in DB
      const [anySup] = await pool.query("SELECT id FROM users WHERE role = 'supervisor' LIMIT 1");
      supervisorId = anySup[0]?.id || 1;
    }
    if (!managerId) {
      const [anyMgr] = await pool.query("SELECT id FROM users WHERE role = 'manager' LIMIT 1");
      managerId = anyMgr[0]?.id || 1;
    }

    const [result] = await pool.query(
      `INSERT INTO leave_requests (employee_id, supervisor_id, manager_id, leave_type, start_date, end_date, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_supervisor')`,
      [employeeId, supervisorId, managerId, leave_type, start_date, end_date, reason.trim()]
    );

    return res.json({ status: true, message: "Leave application submitted successfully", leaveId: result.insertId });
  } catch (err) {
    console.error("Apply leave error:", err);
    return res.status(500).json({ status: false, error: "Failed to submit leave application" });
  }
};

export const getEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const [userRows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.salary, u.phone, u.address, u.image_url, u.status, u.created_at,
              d.name AS department_name,
              sup.name AS supervisor_name, sup.email AS supervisor_email,
              mgr.name AS manager_name
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       LEFT JOIN team_hierarchy th ON u.id = th.employee_id
       LEFT JOIN users sup ON th.supervisor_id = sup.id
       LEFT JOIN users mgr ON th.manager_id = mgr.id
       WHERE u.id = ?`,
      [employeeId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ status: false, error: "Profile not found" });
    }

    return res.json({ status: true, profile: userRows[0] });
  } catch (err) {
    console.error("Get employee profile error:", err);
    return res.status(500).json({ status: false, error: "Failed to load employee profile" });
  }
};
