import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const ProjectsManager = () => {
  const [projects, setProjects] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    title: "",
    description: "",
    lead_supervisor_id: "",
    target_date: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([
        api.get("/api/manager/projects"),
        api.get("/api/manager/supervisors")
      ]);
      if (pRes.data.status) setProjects(pRes.data.projects);
      if (sRes.data.status) setSupervisors(sRes.data.supervisors);
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load project records" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.lead_supervisor_id || !form.target_date) return;

    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/manager/projects", form);
      if (res.data.status) {
        setMsg({ type: "success", text: "Project milestone created successfully!" });
        setShowModal(false);
        setForm({ title: "", description: "", lead_supervisor_id: "", target_date: "" });
        fetchData();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to create project" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full px-6 p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h5 className="font-bold text-gray-900 mb-1">Department Projects & Milestones</h5>
          <p className="text-gray-500 text-sm mb-0">High-level strategic initiatives assigned to operational team leads.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 shadow-sm">
          <i className="bi bi-plus-circle-fill"></i>
          <span>Create Project Milestone</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="spinner-border text-blue-600" role="status"></div>
          <p className="mt-2 text-gray-500">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-12 text-center bg-white text-gray-500">
          <i className="bi bi-folder2-open text-4xl text-gray-600 mb-2"></i>
          <h6>No active projects found.</h6>
          <p className="text-sm">Click 'Create Project Milestone' to launch your first department initiative.</p>
        </div>
      ) : (
        <div className="flex flex-wrap -mx-4 g-4">
          {projects.map((p) => {
            const completed = Number(p.completed_tasks || 0);
            const total = Number(p.total_tasks || 0);
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={p.id} className="w-full px-6 col-lg-6">
                <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white h-full">
                  <div className="flex justify-between align-items-start mb-2">
                    <h5 className="font-bold text-gray-900 mb-1">{p.title}</h5>
                    <span className={`badge ${p.status === "active" ? "bg-primary" : "bg-success"} px-2.5 py-1 text-uppercase`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-6">{p.description || "No description provided."}</p>

                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <div className="flex justify-between text-gray-600 text-sm mb-1">
                      <span>Task Completion Rate</span>
                      <span className="font-bold text-gray-900">{completed} / {total} Tasks ({percent}%)</span>
                    </div>
                    <div className="progress" style={{ height: "8px" }}>
                      <div
                        className="progress-bar bg-green-600"
                        role="progressbar"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-gray-500 text-sm border-t border-gray-200 pt-6 mt-auto">
                    <div>
                      <i className="bi bi-person-badge text-blue-600 mr-1"></i>
                      Lead Supervisor: <strong className="text-gray-900">{p.lead_supervisor_name}</strong>
                    </div>
                    <div>
                      <i className="bi bi-calendar-event text-gray-600 mr-1"></i>
                      Target: <strong className="text-gray-900">{new Date(p.target_date).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-xl">
              <div className="modal-header bg-gray-900 text-white">
                <h5 className="modal-title font-bold">Create New Project Milestone</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateProject}>
                <div className="modal-body p-6">
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Project Title</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Mobile App Redesign 2026"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Lead Supervisor</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.lead_supervisor_id}
                      onChange={(e) => setForm({ ...form, lead_supervisor_id: e.target.value })}
                      required
                    >
                      <option value="">Select Supervisor...</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Target Completion Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.target_date}
                      onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Description & Goals</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Deliverables, scope, and objectives..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-gray-50">
                  <button type="button" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center border border-gray-200 border-gray-500 text-gray-500 hover:bg-gray-50" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 px-6">
                    {saving ? <span className="spinner-border spinner-border-sm"></span> : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;
