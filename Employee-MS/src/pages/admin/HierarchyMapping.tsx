import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const HierarchyMapping = () => {
  const [hierarchy, setHierarchy] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    employee_id: "",
    supervisor_id: "",
    manager_id: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hRes, uRes] = await Promise.all([
        api.get("/api/admin/hierarchy"),
        api.get("/api/admin/users")
      ]);

      if (hRes.data.status) setHierarchy(hRes.data.hierarchy);
      if (uRes.data.status) {
        const all = uRes.data.users;
        setEmployees(all.filter((u) => u.role === "employee"));
        setSupervisors(all.filter((u) => u.role === "supervisor"));
        setManagers(all.filter((u) => u.role === "manager"));
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load team hierarchy" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.supervisor_id || !form.manager_id) {
      return setMsg({ type: "danger", text: "Please select Employee, Supervisor, and Manager." });
    }

    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/admin/hierarchy", form);
      if (res.data.status) {
        setMsg({ type: "success", text: "Team assignment successfully updated!" });
        setShowModal(false);
        setForm({ employee_id: "", supervisor_id: "", manager_id: "" });
        fetchData();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to assign team hierarchy" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">Workforce Team Mapping</h5>
          <p className="text-muted small mb-0">Define which staff member reports to which Supervisor and Department Manager.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-diagram-3-fill"></i>
          <span>Assign / Reassign Team</span>
        </button>
      </div>

      {/* Mapping Hierarchy Table Card */}
      <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">💼 Employee (Subordinate)</th>
                <th>👷 Direct Supervisor (Team Lead)</th>
                <th>👔 Department Manager</th>
                <th>Department</th>
                <th className="text-end px-4">Assigned Since</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted">Loading hierarchy mappings...</span>
                  </td>
                </tr>
              ) : hierarchy.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No active team hierarchy mappings found. Click 'Assign / Reassign Team' to create mappings.
                  </td>
                </tr>
              ) : (
                hierarchy.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-info bg-opacity-10 text-info rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: "34px", height: "34px" }}>
                          {h.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="mb-0 fw-semibold text-dark">{h.employee_name}</p>
                          <small className="text-muted">{h.employee_email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-success bg-opacity-10 text-success border px-2.5 py-1.5 fs-6 fw-semibold">
                        <i className="bi bi-person-badge me-1"></i>
                        {h.supervisor_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-primary bg-opacity-10 text-primary border px-2.5 py-1.5 fs-6 fw-semibold">
                        <i className="bi bi-person-gear me-1"></i>
                        {h.manager_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {h.department_name || "General"}
                      </span>
                    </td>
                    <td className="text-end px-4 text-muted small">
                      {new Date(h.assigned_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Map Employee to Team</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleAssign}>
                <div className="modal-body p-4">
                  {/* Select Employee */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">1. Select Employee (Subordinate)</label>
                    <select
                      className="form-select"
                      value={form.employee_id}
                      onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                      required
                    >
                      <option value="">Choose Employee...</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.name} ({e.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Supervisor */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">2. Select Direct Supervisor (Team Lead)</label>
                    <select
                      className="form-select"
                      value={form.supervisor_id}
                      onChange={(e) => setForm({ ...form, supervisor_id: e.target.value })}
                      required
                    >
                      <option value="">Choose Supervisor...</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.department_name || "Supervisor"})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Manager */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">3. Select Department Manager</label>
                    <select
                      className="form-select"
                      value={form.manager_id}
                      onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
                      required
                    >
                      <option value="">Choose Manager...</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.department_name || "Manager"})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary px-4">
                    {saving ? <span className="spinner-border spinner-border-sm"></span> : "Save Assignment"}
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

export default HierarchyMapping;
