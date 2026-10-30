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

    const cleanDate = target_date ? new Date(target_date).toISOString().slice(0, 10) : target_date;

    const [result] = await pool.query(
      `INSERT INTO projects (title, description, department_id, created_by, lead_supervisor_id, target_date, start_date)
       VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
      [title.trim(), description.trim(), deptId, managerId, lead_supervisor_id, cleanDate]
    );

    return res.json({ status: true, message: "Project milestone created successfully", projectId: result.insertId });
  } catch (err) {
    console.error("Create project error:", err);
    return res.status(500).json({ status: false, error: "Failed to create project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description = "", lead_supervisor_id, target_date, status = "active" } = req.body;
    const managerId = req.user.id;
    const deptId = req.user.department_id;

    if (!title || !lead_supervisor_id || !target_date) {
      return res.status(400).json({ status: false, error: "Title, Lead Supervisor, and Target Date are required" });
    }

    const cleanDate = target_date ? new Date(target_date).toISOString().slice(0, 10) : target_date;

    const [result] = await pool.query(
      `UPDATE projects
       SET title = ?, description = ?, lead_supervisor_id = ?, target_date = ?, status = ?
       WHERE id = ? AND (created_by = ? OR department_id = ? OR ? = 'admin')`,
      [title.trim(), description.trim(), lead_supervisor_id, cleanDate, status, id, managerId, deptId, req.user.role]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, error: "Project not found or unauthorized to update" });
    }

    return res.json({ status: true, message: "Project milestone updated successfully" });
  } catch (err) {
    console.error("Update project error:", err);
    return res.status(500).json({ status: false, error: "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const managerId = req.user.id;
    const deptId = req.user.department_id;

    // Safely unlink tasks belonging to this project before deletion
    await pool.query("UPDATE tasks SET project_id = NULL WHERE project_id = ?", [id]);

    const [result] = await pool.query(
      `DELETE FROM projects WHERE id = ? AND (created_by = ? OR department_id = ? OR ? = 'admin')`,
      [id, managerId, deptId, req.user.role]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: false, error: "Project not found or unauthorized to delete" });
    }

    return res.json({ status: true, message: "Project initiative deleted successfully" });
  } catch (err) {
    console.error("Delete project error:", err);
    return res.status(500).json({ status: false, error: "Failed to delete project" });
  }
};

export const getSupervisors = async (req, res) => {
  try {
    const managerId = req.user.id;
    const deptId = req.user.department_id;
    const query = `
      SELECT u.id, u.name, u.email, u.phone, u.status, u.image_url, u.max_span_capacity,
             d.name AS department_name,
             COUNT(DISTINCT p.id) AS active_projects_count,
             COUNT(DISTINCT th.employee_id) AS team_size,
             COUNT(DISTINCT t.id) AS total_tasks_count,
             SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks_count
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN projects p ON u.id = p.lead_supervisor_id AND p.status != 'completed'
      LEFT JOIN team_hierarchy th ON u.id = th.supervisor_id
      LEFT JOIN tasks t ON u.id = t.assigned_by
      WHERE u.role = 'supervisor'
        AND (
          ? IS NULL
          OR u.department_id = ?
          OR u.department_id IS NULL
          OR u.id IN (SELECT lead_supervisor_id FROM projects WHERE (department_id = ? OR created_by = ?) AND lead_supervisor_id IS NOT NULL)
        )
      GROUP BY u.id, d.name
      ORDER BY u.name ASC
    `;
    const params = [deptId, deptId, deptId, managerId];

    const [supervisors] = await pool.query(query, params);

    // Fetch team reports and active delegations for all returned supervisors
    if (supervisors.length > 0) {
      const supervisorIds = supervisors.map((s) => s.id);

      // 1. Fetch team members under these supervisors
      try {
        const [members] = await pool.query(
          `SELECT th.supervisor_id, u.id, u.name, u.email, u.phone, u.status, u.image_url,
                  d.name AS department_name, th.assigned_at
           FROM team_hierarchy th
           JOIN users u ON th.employee_id = u.id
           LEFT JOIN departments d ON u.department_id = d.id
           WHERE th.supervisor_id IN (?)
           ORDER BY u.name ASC`,
          [supervisorIds]
        );

        // 2. Fetch active delegations for these supervisors
        let delegations = [];
        try {
          const [delRows] = await pool.query(
            `SELECT hd.*, orig.name AS original_supervisor_name, act.name AS acting_supervisor_name
             FROM hierarchy_delegations hd
             JOIN users orig ON hd.original_supervisor_id = orig.id
             JOIN users act ON hd.acting_supervisor_id = act.id
             WHERE (hd.original_supervisor_id IN (?) OR hd.acting_supervisor_id IN (?))
               AND hd.is_active = TRUE
               AND CURDATE() BETWEEN hd.start_date AND hd.end_date`,
            [supervisorIds, supervisorIds]
          );
          delegations = delRows;
        } catch (delErr) {
          console.warn("Notice reading manager delegations:", delErr.message);
        }

        for (const sup of supervisors) {
          sup.team_members = members.filter((m) => m.supervisor_id === sup.id);
          sup.active_delegation = delegations.find(
            (d) => d.original_supervisor_id === sup.id || d.acting_supervisor_id === sup.id
          ) || null;
        }
      } catch (memErr) {
        console.warn("Notice reading supervisor squad members:", memErr.message);
      }
    }

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
