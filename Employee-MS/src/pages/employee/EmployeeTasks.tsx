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
      case "urgent": return <span className="badge bg-red-600">URGENT</span>;
      case "high": return <span className="badge bg-yellow-500 text-gray-900">HIGH</span>;
      case "medium": return <span className="badge bg-blue-600">MEDIUM</span>;
      default: return <span className="badge bg-secondary">LOW</span>;
    }
  };

  return (
    <div className="w-full px-6 p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6 mb-6">
        <h5 className="font-bold mb-1">My Delegated Tasks Queue</h5>
        <p className="text-gray-500 text-sm mb-0">
          Work assigned by your direct supervisor. Update status as you progress and use the Chat button to ask questions or report blockers.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-6">Task Ticket & Description</th>
                <th>Assigned By</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Execution Status</th>
                <th className="text-right px-6">Discussion</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading your tasks...</span>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <i className="bi bi-check2-circle text-4xl text-green-600 block mb-2"></i>
                    Awesome! You currently have no pending tasks.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6" style={{ maxWidth: "300px" }}>
                      <p className="mb-0 font-bold text-gray-900">{t.title}</p>
                      <small className="text-gray-500 block">{t.description || "No description provided."}</small>
                      {t.project_title && (
                        <small className="badge bg-gray-50 text-blue-600 border border-gray-200 border-gray-200 mt-1">
                          <i className="bi bi-kanban mr-1"></i>
                          {t.project_title}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="font-semibold text-gray-900 block">
                        <i className="bi bi-person-badge text-green-600 mr-1"></i>
                        {t.supervisor_name}
                      </span>
                      <small className="text-gray-500">{t.supervisor_email}</small>
                    </td>
                    <td>{getPriorityBadge(t.priority)}</td>
                    <td className="text-sm">
                      <strong className="text-gray-900">{new Date(t.due_date).toLocaleDateString()}</strong>
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
                    <td className="text-right px-6">
                      <button
                        onClick={() => setActiveChatTask(t)}
                        className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-blue-600 text-blue-600 hover:bg-blue-50 inline-flex items-center gap-1.5 px-6 shadow-sm"
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
