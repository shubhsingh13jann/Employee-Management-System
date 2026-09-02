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
    <div className="container-fluid p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">Department Projects & Milestones</h5>
          <p className="text-muted small mb-0">High-level strategic initiatives assigned to operational team leads.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-plus-circle-fill"></i>
          <span>Create Project Milestone</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="card shadow-sm border-0 rounded-3 p-5 text-center bg-white text-muted">
          <i className="bi bi-folder2-open fs-1 text-secondary mb-2"></i>
          <h6>No active projects found.</h6>
          <p className="small">Click 'Create Project Milestone' to launch your first department initiative.</p>
        </div>
      ) : (
        <div className="row g-4">
          {projects.map((p) => {
            const completed = Number(p.completed_tasks || 0);
            const total = Number(p.total_tasks || 0);
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={p.id} className="col-12 col-lg-6">
                <div className="card shadow-sm border-0 rounded-3 p-4 bg-white h-100">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="fw-bold text-dark mb-1">{p.title}</h5>
                    <span className={`badge ${p.status === "active" ? "bg-primary" : "bg-success"} px-2.5 py-1 text-uppercase`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-muted small mb-3">{p.description || "No description provided."}</p>

                  <div className="bg-light p-3 rounded-3 mb-3">
                    <div className="d-flex justify-content-between text-secondary small mb-1">
                      <span>Task Completion Rate</span>
                      <span className="fw-bold text-dark">{completed} / {total} Tasks ({percent}%)</span>
                    </div>
                    <div className="progress" style={{ height: "8px" }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center text-muted small border-top pt-3 mt-auto">
                    <div>
                      <i className="bi bi-person-badge text-primary me-1"></i>
                      Lead Supervisor: <strong className="text-dark">{p.lead_supervisor_name}</strong>
                    </div>
                    <div>
                      <i className="bi bi-calendar-event text-secondary me-1"></i>
                      Target: <strong className="text-dark">{new Date(p.target_date).toLocaleDateString()}</strong>
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
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Create New Project Milestone</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateProject}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Project Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mobile App Redesign 2026"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Lead Supervisor</label>
                    <select
                      className="form-select"
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
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Target Completion Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.target_date}
                      onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description & Goals</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Deliverables, scope, and objectives..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary px-4">
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
