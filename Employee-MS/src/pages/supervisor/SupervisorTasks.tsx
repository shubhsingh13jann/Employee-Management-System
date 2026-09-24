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
      case "urgent": return <span className="badge bg-red-600">URGENT</span>;
      case "high": return <span className="badge bg-yellow-500 text-gray-900">HIGH</span>;
      case "medium": return <span className="badge bg-blue-600">MEDIUM</span>;
      default: return <span className="badge bg-secondary">LOW</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "completed": return <span className="badge bg-green-600">COMPLETED</span>;
      case "in_progress": return <span className="badge bg-info text-gray-900">IN PROGRESS</span>;
      case "under_review": return <span className="badge bg-yellow-500 text-gray-900">UNDER REVIEW</span>;
      default: return <span className="badge bg-secondary">PENDING</span>;
    }
  };

  return (
    <div className="w-full px-6 p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h5 className="font-bold text-gray-900 mb-1">Team Task Delegation & Kanban</h5>
          <p className="text-gray-500 text-sm mb-0">Assign daily work tickets and conduct two-way task feedback discussions.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 shadow-sm">
          <i className="bi bi-plus-lg"></i>
          <span>Assign New Task</span>
        </button>
      </div>

      {/* Tasks Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-6">Task Title & Details</th>
                <th>Assigned Employee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th className="text-right px-6">Discussion</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading assigned tasks...</span>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No tasks currently delegated. Click 'Assign New Task' to create tickets for your team.
                  </td>
                </tr>
              ) : (
                tasks.map((t) => (
                  <tr key={t.id}>
                    <td className="px-6" style={{ maxWidth: "280px" }}>
                      <p className="mb-0 font-bold text-gray-900">{t.title}</p>
                      <small className="text-gray-500 text-truncate block">{t.description || "No description."}</small>
                      {t.project_title && (
                        <small className="badge bg-gray-50 text-blue-600 border border-gray-200 border-gray-200 mt-1">
                          <i className="bi bi-kanban mr-1"></i>
                          {t.project_title}
                        </small>
                      )}
                    </td>
                    <td>
                      <span className="font-semibold text-gray-900 block">{t.assigned_to_name}</span>
                      <small className="text-gray-500">{t.assigned_to_email}</small>
                    </td>
                    <td>{getPriorityBadge(t.priority)}</td>
                    <td>{getStatusBadge(t.status)}</td>
                    <td className="text-sm text-gray-500">{new Date(t.due_date).toLocaleDateString()}</td>
                    <td className="text-right px-6">
                      <button
                        onClick={() => setActiveChatTask(t)}
                        className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-blue-600 text-blue-600 hover:bg-blue-50 inline-flex items-center gap-1.5 shadow-sm px-6"
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
        <div className="modal show block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-xl">
              <div className="modal-header bg-gray-900 text-white">
                <h5 className="modal-title font-bold">Assign New Task Ticket</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body p-6">
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Task Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Build User Profile Screen"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Assign Subordinate</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="flex flex-wrap -mx-4 g-2 mb-6">
                    <div className="col-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Priority Level</label>
                      <select
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Due Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Description & Acceptance Criteria</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Steps to complete, technical requirements..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-gray-50">
                  <button type="button" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center border border-gray-200 border-gray-500 text-gray-500 hover:bg-gray-50" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 px-6">
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
