import pool from "../config/db.js";

export const getSupervisorDashboard = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    const [[{ teamSize }]] = await pool.query(
      "SELECT COUNT(*) AS teamSize FROM team_hierarchy WHERE supervisor_id = ?",
      [supervisorId]
    );

    const [[{ activeTasks }]] = await pool.query(
      "SELECT COUNT(*) AS activeTasks FROM tasks WHERE assigned_by = ? AND status IN ('pending', 'in_progress', 'under_review')",
      [supervisorId]
    );

    const [[{ completedTasks }]] = await pool.query(
      "SELECT COUNT(*) AS completedTasks FROM tasks WHERE assigned_by = ? AND status = 'completed'",
      [supervisorId]
    );

    const [[{ pendingLeaves }]] = await pool.query(
      "SELECT COUNT(*) AS pendingLeaves FROM leave_requests WHERE supervisor_id = ? AND status = 'pending_supervisor'",
      [supervisorId]
    );

    return res.json({
      status: true,
      stats: {
        teamSize,
        activeTasks,
        completedTasks,
        pendingLeaves
      }
    });
  } catch (err) {
    console.error("Supervisor dashboard error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch supervisor metrics" });
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const [members] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, u.image_url,
              th.assigned_at,
              COUNT(t.id) AS total_tasks,
              SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
       FROM team_hierarchy th
       JOIN users u ON th.employee_id = u.id
       LEFT JOIN tasks t ON u.id = t.assigned_to
       WHERE th.supervisor_id = ?
       GROUP BY u.id
       ORDER BY u.name ASC`,
      [supervisorId]
    );
    return res.json({ status: true, team: members });
  } catch (err) {
    console.error("Get team members error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch team members" });
  }
};

export const getSupervisorTasks = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const [tasks] = await pool.query(
      `SELECT t.*, emp.name AS assigned_to_name, emp.email AS assigned_to_email,
              p.title AS project_title,
              (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
       FROM tasks t
       JOIN users emp ON t.assigned_to = emp.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.assigned_by = ?
       ORDER BY t.created_at DESC`,
      [supervisorId]
    );
    return res.json({ status: true, tasks });
  } catch (err) {
    console.error("Get supervisor tasks error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch assigned tasks" });
  }
};

export const createTask = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const { title, description = "", assigned_to, priority = "medium", due_date, project_id = null } = req.body;

    if (!title || !assigned_to || !due_date) {
      return res.status(400).json({ status: false, error: "Title, Assigned Employee, and Due Date are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO tasks (title, description, assigned_by, assigned_to, priority, due_date, project_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [title.trim(), description.trim(), supervisorId, assigned_to, priority, due_date, project_id || null]
    );

    return res.json({ status: true, message: "Task assigned successfully", taskId: result.insertId });
  } catch (err) {
    console.error("Create task error:", err);
    return res.status(500).json({ status: false, error: "Failed to assign task" });
  }
};

export const getRoutineLeaves = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const [leaves] = await pool.query(
      `SELECT lr.*, emp.name AS employee_name, emp.email AS employee_email,
              d.name AS department_name
       FROM leave_requests lr
       JOIN users emp ON lr.employee_id = emp.id
       LEFT JOIN departments d ON emp.department_id = d.id
       WHERE lr.supervisor_id = ? AND lr.status = 'pending_supervisor'
       ORDER BY lr.applied_at ASC`,
      [supervisorId]
    );
    return res.json({ status: true, leaves });
  } catch (err) {
    console.error("Get routine leaves error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch leave applications" });
  }
};

export const reviewRoutineLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, supervisor_notes = "" } = req.body;
    // action can be: 'approve', 'reject', 'escalate'

    if (!["approve", "reject", "escalate"].includes(action)) {
      return res.status(400).json({ status: false, error: "Action must be 'approve', 'reject', or 'escalate'" });
    }

    let newStatus = "approved";
    if (action === "reject") newStatus = "rejected";
    if (action === "escalate") newStatus = "pending_manager";

    await pool.query(
      `UPDATE leave_requests
       SET status = ?, supervisor_notes = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND supervisor_id = ?`,
      [newStatus, supervisor_notes.trim(), id, req.user.id]
    );

    const msg = action === "escalate"
      ? "Leave request escalated to Department Manager"
      : `Leave request ${newStatus}`;

    return res.json({ status: true, message: msg, statusValue: newStatus });
  } catch (err) {
    console.error("Review routine leave error:", err);
    return res.status(500).json({ status: false, error: "Failed to review leave application" });
  }
};
