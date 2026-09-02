import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import TaskDiscussionModal from "../../components/common/TaskDiscussionModal";

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatTask, setActiveChatTask] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/employee/tasks");
      if (res.data.status) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load assigned tasks" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setUpdatingId(taskId);
      const res = await api.put(`/api/employee/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.status) {
        setMsg({ type: "success", text: res.data.message });
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to update task status" });
    } finally {
      setUpdatingId(null);
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

  return (
    <div className="container-fluid p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="card shadow-sm border-0 rounded-3 bg-white p-4 mb-4">
        <h5 className="fw-bold mb-1">My Delegated Tasks Queue</h5>
        <p className="text-muted small mb-0">
          Work assigned by your direct supervisor. Update status as you progress and use the Chat button to ask questions or report blockers.
        </p>
      </div>

      <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Task Ticket & Description</th>
                <th>Assigned By</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Execution Status</th>
                <th className="text-end px-4">Discussion</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted">Loading your tasks...</span>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <i className="bi bi-check2-circle fs-1 text-success d-block mb-2"></i>
                    Awesome! You currently have no pending tasks.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4" style={{ maxWidth: "300px" }}>
                      <p className="mb-0 fw-bold text-dark">{t.title}</p>
                      <small className="text-muted d-block">{t.description || "No description provided."}</small>
                      {t.project_title && (
                        <small className="badge bg-light text-primary border mt-1">
                          <i className="bi bi-kanban me-1"></i>
                          {t.project_title}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="fw-semibold text-dark d-block">
                        <i className="bi bi-person-badge text-success me-1"></i>
                        {t.supervisor_name}
                      </span>
                      <small className="text-muted">{t.supervisor_email}</small>
                    </td>
                    <td>{getPriorityBadge(t.priority)}</td>
                    <td className="small">
                      <strong className="text-dark">{new Date(t.due_date).toLocaleDateString()}</strong>
                    </td>
                    <td>
                      <select
                        className={`form-select form-select-sm fw-bold ${
                          t.status === "completed" ? "text-success border-success" :
                          t.status === "in_progress" ? "text-primary border-primary" :
                          t.status === "under_review" ? "text-warning border-warning" : "text-secondary"
                        }`}
                        value={t.status}
                        disabled={updatingId === t.id}
                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                        style={{ width: "140px" }}
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="in_progress">⚡ In Progress</option>
                        <option value="under_review">🔍 Under Review</option>
                        <option value="completed">✅ Completed</option>
                      </select>
                    </td>
                    <td className="text-end px-4">
                      <button
                        onClick={() => setActiveChatTask(t)}
                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5 px-3 shadow-sm"
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

      {/* Discussion Chat Modal */}
      {activeChatTask && (
        <TaskDiscussionModal
          task={activeChatTask}
          onClose={() => { setActiveChatTask(null); fetchTasks(); }}
        />
      )}
    </div>
  );
};

export default EmployeeTasks;
