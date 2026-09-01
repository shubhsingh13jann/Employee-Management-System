import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/departments");
      if (res.data.status) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load departments" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/admin/departments", { name: name.trim(), description: description.trim() });
      if (res.data.status) {
        setMsg({ type: "success", text: "Department created successfully!" });
        setName("");
        setDescription("");
        fetchDepartments();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to create department" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, deptName) => {
    if (!window.confirm(`Are you sure you want to delete department '${deptName}'?`)) return;
    try {
      const res = await api.delete(`/api/admin/departments/${id}`);
      if (res.data.status) {
        setMsg({ type: "success", text: "Department removed successfully" });
        fetchDepartments();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to delete department" });
    }
  };

  return (
    <div className="container-fluid p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="row g-4">
        {/* Create Department Form Card */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm border-0 rounded-3 p-4 bg-white">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-folder-plus text-primary"></i>
              Add New Department
            </h5>
            <form onSubmit={handleAddDepartment}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Department Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Quality Assurance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Responsibilities, scope, and objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <button disabled={saving} className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                {saving ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-plus-circle"></i>}
                <span>Create Department</span>
              </button>
            </form>
          </div>
        </div>

        {/* Department List Table Card */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
            <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Active Departments</h5>
              <span className="badge bg-secondary">{departments.length} Total</span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-4">Department Name</th>
                    <th>Description</th>
                    <th className="text-center">Staff Members</th>
                    <th className="text-end px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        <div className="spinner-border spinner-border-sm text-primary"></div>
                      </td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">No departments created yet.</td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.id}>
                        <td className="px-4 fw-semibold text-dark">
                          <i className="bi bi-building me-2 text-primary"></i>
                          {dept.name}
                        </td>
                        <td className="text-muted small" style={{ maxWidth: "250px" }}>
                          {dept.description || "No description provided"}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill">
                            {dept.member_count} Members
                          </span>
                        </td>
                        <td className="text-end px-4">
                          <button
                            onClick={() => handleDelete(dept.id, dept.name)}
                            className="btn btn-sm btn-outline-danger"
                            title="Delete Department"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Departments;
