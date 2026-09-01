import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import TaskDiscussionModal from "../../components/common/TaskDiscussionModal";

const SupervisorTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeChatTask, setActiveChatTask] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    due_date: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, tmRes] = await Promise.all([
        api.get("/api/supervisor/tasks"),
        api.get("/api/supervisor/team")
      ]);
      if (tRes.data.status) setTasks(tRes.data.tasks);
      if (tmRes.data.status) setTeam(tmRes.data.team);
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load tasks" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assigned_to || !form.due_date) return;

    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/supervisor/tasks", form);
      if (res.data.status) {
        setMsg({ type: "success", text: "Task assigned successfully to employee!" });
        setShowModal(false);
        setForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
        fetchData();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to assign task" });
    } finally {
      setSaving(false);
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "urgent": return <span className="badge bg-danger">URGENT</span>;
      case "high": return <span className="badge bg-warning text-dark">HIGH</span>;
      case "medium": return <span className="badge bg-primary">MEDIUM</span>;
      default: return <span className="badge bg-secondary">LOW</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "completed": return <span className="badge bg-success">COMPLETED</span>;
      case "in_progress": return <span className="badge bg-info text-dark">IN PROGRESS</span>;
      case "under_review": return <span className="badge bg-warning text-dark">UNDER REVIEW</span>;
      default: return <span className="badge bg-secondary">PENDING</span>;
    }
  };

  return (
    <div className="container-fluid p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">Team Task Delegation & Kanban</h5>
          <p className="text-muted small mb-0">Assign daily work tickets and conduct two-way task feedback discussions.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-plus-lg"></i>
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Tasks Table Card */}
      <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Task Title & Details</th>
                <th>Assigned Employee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th className="text-end px-4">Discussion</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted">Loading assigned tasks...</span>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No tasks currently delegated. Click 'Assign New Task' to create tickets for your team.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4" style={{ maxWidth: "280px" }}>
                      <p className="mb-0 fw-bold text-dark">{t.title}</p>
                      <small className="text-muted text-truncate d-block">{t.description || "No description."}</small>
                      {t.project_title && (
                        <small className="badge bg-light text-primary border mt-1">
                          <i className="bi bi-kanban me-1"></i>
                          {t.project_title}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="fw-semibold text-dark d-block">{t.assigned_to_name}</span>
                      <small className="text-muted">{t.assigned_to_email}</small>
                    </td>
                    <td>{getPriorityBadge(t.priority)}</td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td className="small text-muted">{new Date(t.due_date).toLocaleDateString()}</td>
                    <td className="text-end px-4">
                      <button
                        onClick={() => setActiveChatTask(t)}
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 shadow-sm px-3"
                      >
                        <i className="bi bi-chat-dots-fill"></i>
                        <span>Chat ({t.comment_count || 0})</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Assign New Task Ticket</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Task Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Build User Profile Screen"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Assign Subordinate</label>
                    <select
                      className="form-select"
                      value={form.assigned_to}
                      onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                      required
                    >
                      <option value="">Select Team Member...</option>
                      {team.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Priority Level</label>
                      <select
                        className="form-select"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Due Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description & Acceptance Criteria</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Steps to complete, technical requirements..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary px-4">
                    {saving ? <span className="spinner-border spinner-border-sm"></span> : "Assign Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Discussion Chat Modal */}
      {activeChatTask && (
        <TaskDiscussionModal task={activeChatTask} onClose={() => { setActiveChatTask(null); fetchData(); }} />
      )}
    </div>
  );
};

export default SupervisorTasks;
