import pool from "../config/db.js";

export const getTaskDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT t.*, emp.name AS assigned_to_name, emp.email AS assigned_to_email,
              sup.name AS assigned_by_name, p.title AS project_title
       FROM tasks t
       JOIN users emp ON t.assigned_to = emp.id
       JOIN users sup ON t.assigned_by = sup.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: false, error: "Task not found" });
    }

    return res.json({ status: true, task: rows[0] });
  } catch (err) {
    console.error("Get task details error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch task details" });
  }
};

export const getTaskComments = async (req, res) => {
  try {
    const { id } = req.params;
    const [comments] = await pool.query(
      `SELECT tc.id, tc.message, tc.created_at, tc.sender_id,
              u.name AS sender_name, u.role AS sender_role, u.image_url AS sender_image
       FROM task_comments tc
       JOIN users u ON tc.sender_id = u.id
       WHERE tc.task_id = ?
       ORDER BY tc.created_at ASC`,
      [id]
    );

    return res.json({ status: true, comments });
  } catch (err) {
    console.error("Get comments error:", err);
    return res.status(500).json({ status: false, error: "Failed to fetch discussion comments" });
  }
};

export const addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ status: false, error: "Comment message cannot be empty" });
    }

    const [result] = await pool.query(
      "INSERT INTO task_comments (task_id, sender_id, message) VALUES (?, ?, ?)",
      [id, senderId, message.trim()]
    );

    return res.json({
      status: true,
      message: "Comment posted successfully",
      comment: {
        id: result.insertId,
        task_id: id,
        sender_id: senderId,
        sender_name: req.user.name,
        sender_role: req.user.role,
        message: message.trim(),
        created_at: new Date()
      }
    });
  } catch (err) {
    console.error("Add comment error:", err);
    return res.status(500).json({ status: false, error: "Failed to post comment" });
  }
};
