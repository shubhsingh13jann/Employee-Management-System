import pool from "../config/db.js";

export const getManagerDashboard = async (req, res) => {
  try {
    const managerId = req.user.id;
    const deptId = req.user.department_id;

    const [[{ projectCount }]] = await pool.query(
      "SELECT COUNT(*) AS projectCount FROM projects WHERE created_by = ? OR department_id = ?",
      [managerId, deptId]
    );

    const [[{ supervisorCount }]] = await pool.query(
      "SELECT COUNT(DISTINCT supervisor_id) AS supervisorCount FROM team_hierarchy WHERE manager_id = ?",
      [managerId]
    );

    const [[{ employeeCount }]] = await pool.query(
      "SELECT COUNT(DISTINCT employee_id) AS employeeCount FROM team_hierarchy WHERE manager_id = ?",
      [managerId]
    );

    const [[{ escalatedLeaves }]] = await pool.query(
      "SELECT COUNT(*) AS escalatedLeaves FROM leave_requests WHERE manager_id = ? AND status = 'pending_manager'",
      [managerId]
    );

    return res.json({
      status: true,
      stats: {
        projectCount,
        supervisorCount,
        employeeCount,
        escalatedLeaves
      }
    });
  } catch (err) {
    console.error("Manager dashboard error:", err);
    return res.status(500).json({ status: false, error: "Failed to load manager dashboard metrics" });
  }
};

export const getProjects = async (req, res) => {
  try {
    const managerId = req.user.id;
    const deptId = req.user.department_id;

    const [projects] = await pool.query(
      `SELECT p.*, sup.name AS lead_supervisor_name, d.name AS department_name,
              COUNT(t.id) AS total_tasks,
              SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
       FROM projects p
       JOIN users sup ON p.lead_supervisor_id = sup.id
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN tasks t ON p.id = t.project_id
       WHERE p.created_by = ? OR p.department_id = ?
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [managerId, deptId]
    );

    return res.json({ status: true, projects });
  } catch (err) {
    console.error("Get projects error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch projects" });
  }
};

export const createProject = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { title, description = "", lead_supervisor_id, target_date } = req.body;
    let deptId = req.user.department_id;

    if (!title || !lead_supervisor_id || !target_date) {
      return res.status(400).json({ status: false, error: "Title, Lead Supervisor, and Target Date are required" });
    }

    if (!deptId) {
      const [userRows] = await pool.query("SELECT department_id FROM users WHERE id = ?", [managerId]);
      deptId = userRows[0]?.department_id || 1;
    }

    const [result] = await pool.query(
      `INSERT INTO projects (title, description, department_id, created_by, lead_supervisor_id, target_date, start_date)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
      [title.trim(), description.trim(), deptId, managerId, lead_supervisor_id, target_date]
    );

    return res.json({ status: true, message: "Project milestone created successfully", projectId: result.insertId });
  } catch (err) {
    console.error("Create project error:", err);
    return res.status(500).json({ status: false, error: "Failed to create project" });
  }
};

export const getSupervisors = async (req, res) => {
  try {
    const deptId = req.user.department_id;
    const query = deptId
      ? "SELECT id, name, email, phone, salary, status FROM users WHERE role = 'supervisor' AND (department_id = ? OR department_id IS NULL)"
      : "SELECT id, name, email, phone, salary, status FROM users WHERE role = 'supervisor'";
    const params = deptId ? [deptId] : [];

    const [supervisors] = await pool.query(query, params);
    return res.json({ status: true, supervisors });
  } catch (err) {
    console.error("Get supervisors error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch supervisors" });
  }
};

export const getEscalatedLeaves = async (req, res) => {
  try {
    const managerId = req.user.id;
    const [leaves] = await pool.query(
      `SELECT lr.*, emp.name AS employee_name, emp.email AS employee_email,
              sup.name AS supervisor_name, d.name AS department_name
       FROM leave_requests lr
       JOIN users emp ON lr.employee_id = emp.id
       JOIN users sup ON lr.supervisor_id = sup.id
       LEFT JOIN departments d ON emp.department_id = d.id
       WHERE lr.manager_id = ? AND lr.status = 'pending_manager'
       ORDER BY lr.applied_at ASC`,
      [managerId]
    );
    return res.json({ status: true, leaves });
  } catch (err) {
    console.error("Get escalated leaves error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch escalated leave queue" });
  }
};

export const reviewEscalatedLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, manager_notes = "" } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ status: false, error: "Review status must be 'approved' or 'rejected'" });
    }

    await pool.query(
      `UPDATE leave_requests
       SET status = ?, manager_notes = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND manager_id = ?`,
      [status, manager_notes.trim(), id, req.user.id]
    );

    return res.json({ status: true, message: `Leave request successfully ${status}` });
  } catch (err) {
    console.error("Review leave error:", err);
    return res.status(500).json({ status: false, error: "Failed to update leave review" });
  }
};
