import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department_id: "",
    salary: "",
    phone: "",
    address: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const url = selectedRole ? `/api/admin/users?role=${selectedRole}` : "/api/admin/users";
      const res = await api.get(url);
      if (res.data.status) {
        setUsers(res.data.users);
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/admin/departments");
      if (res.data.status) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [selectedRole]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/admin/users", formData);
      if (res.data.status) {
        setMsg({ type: "success", text: "New user onboarded successfully!" });
        setShowModal(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "employee",
          department_id: "",
          salary: "",
          phone: "",
          address: ""
        });
        fetchUsers();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to onboard user" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user '${name}'?`)) return;
    try {
      const res = await api.delete(`/api/admin/users/${id}`);
      if (res.data.status) {
        setMsg({ type: "success", text: "User removed successfully" });
        fetchUsers();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to delete user" });
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return <span className="badge bg-danger">👑 HR Admin</span>;
      case "manager":
        return <span className="badge bg-primary">👔 Manager</span>;
      case "supervisor":
        return <span className="badge bg-success">👷 Supervisor</span>;
      case "employee":
        return <span className="badge bg-info text-dark">💼 Employee</span>;
      default:
        return <span className="badge bg-secondary">{role}</span>;
    }
  };

  return (
    <div className="container-fluid p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      {/* Header Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        {/* Role Filters */}
        <div className="btn-group shadow-sm" role="group">
          <button
            type="button"
            className={`btn btn-sm ${selectedRole === "" ? "btn-dark" : "btn-outline-dark"}`}
            onClick={() => setSelectedRole("")}
          >
            All Roles ({users.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${selectedRole === "manager" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setSelectedRole("manager")}
          >
            Managers
          </button>
          <button
            type="button"
            className={`btn btn-sm ${selectedRole === "supervisor" ? "btn-success" : "btn-outline-success"}`}
            onClick={() => setSelectedRole("supervisor")}
          >
            Supervisors
          </button>
          <button
            type="button"
            className={`btn btn-sm ${selectedRole === "employee" ? "btn-info" : "btn-outline-info"}`}
            onClick={() => setSelectedRole("employee")}
          >
            Employees
          </button>
          <button
            type="button"
            className={`btn btn-sm ${selectedRole === "admin" ? "btn-danger" : "btn-outline-danger"}`}
            onClick={() => setSelectedRole("admin")}
          >
            Admins
          </button>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary d-flex align-items-center gap-2 px-3 py-2 rounded-3 shadow-sm"
        >
          <i className="bi bi-person-plus-fill"></i>
          <span>Onboard New User</span>
        </button>
      </div>

      {/* Users Table Card */}
      <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Staff Member</th>
                <th>Role Tier</th>
                <th>Department</th>
                <th>Annual Salary</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-end px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted">Loading user directory...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    No users found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="mb-0 fw-semibold text-dark">{u.name}</p>
                          <small className="text-muted">{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {u.department_name || "Unassigned"}
                      </span>
                    </td>
                    <td className="fw-semibold text-dark">${Number(u.salary).toLocaleString()}</td>
                    <td className="text-muted small">{u.phone || "—"}</td>
                    <td>
                      <span className={`badge ${u.status === "active" ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"} border px-2 py-1`}>
                        {u.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="btn btn-sm btn-outline-danger"
                        title="Delete User"
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

      {/* Onboard User Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Onboard New Team Member</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Initial Password</label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Secure password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Assigned Role Tier</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="employee">💼 Employee (Individual Contributor)</option>
                        <option value="supervisor">👷 Supervisor (Team Lead)</option>
                        <option value="manager">👔 Manager (Department Lead)</option>
                        <option value="admin">👑 HR / Super Admin</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Department</label>
                      <select
                        className="form-select"
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      >
                        <option value="">Select Department...</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Annual Salary ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="55000"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+1 555-0199"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Address / Office Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Building A, Floor 3"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="btn btn-primary px-4">
                    {saving ? <span className="spinner-border spinner-border-sm"></span> : "Save & Onboard"}
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

export default UserManagement;
