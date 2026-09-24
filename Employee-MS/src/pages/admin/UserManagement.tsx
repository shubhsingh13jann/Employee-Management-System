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
        return <span className="badge bg-red-600">👑 HR Admin</span>;
      case "manager":
        return <span className="badge bg-blue-600">👔 Manager</span>;
      case "supervisor":
        return <span className="badge bg-green-600">👷 Supervisor</span>;
      case "employee":
        return <span className="badge bg-info text-gray-900">💼 Employee</span>;
      default:
        return <span className="badge bg-secondary">{role}</span>;
    }
  };

  return (
    <div className="w-full px-6 p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      {/* Header Actions */}
      <div className="flex flex-col flex-md-row justify-between align-items-md-center gap-6 mb-6">
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
          className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 px-6 py-2 rounded-lg shadow-sm"
        >
          <i className="bi bi-person-plus-fill"></i>
          <span>Onboard New User</span>
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-6">Staff Member</th>
                <th>Role Tier</th>
                <th>Department</th>
                <th>Annual Salary</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-right px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading user directory...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No users found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-600 bg-opacity-10 text-blue-600 rounded-full font-bold flex items-center justify-center overflow-hidden flex-shrink-0" style={{ width: "36px", height: "36px" }}>
                          {u.image_url ? (
                            <img
                              src={u.image_url.startsWith("http") ? u.image_url : `http://localhost:3000${u.image_url}`}
                              alt={u.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="mb-0 font-semibold text-gray-900">{u.name}</p>
                          <small className="text-gray-500">{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{getRoleBadge(u.role)}</td>
                    <td>
                      <span className="badge bg-gray-50 text-gray-900 border border-gray-200 border-gray-200">
                        {u.department_name || "Unassigned"}
                      </span>
                    </td>
                    <td className="font-semibold text-gray-900">${Number(u.salary).toLocaleString()}</td>
                    <td className="text-gray-500 text-sm">{u.phone || "—"}</td>
                    <td>
                      <span className={`badge ${u.status === "active" ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"} border px-2 py-1`}>
                        {u.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right px-6">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm btn-outline-danger"
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
        <div className="modal show block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-xl">
              <div className="modal-header bg-gray-900 text-white">
                <h5 className="modal-title font-bold">Onboard New Team Member</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body p-6">
                  <div className="flex flex-wrap -mx-4 g-3">
                    <div className="md:w-1/2 px-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Full Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:w-1/2 px-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="john@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:w-1/2 px-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Initial Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Secure password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:w-1/2 px-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Assigned Role Tier</label>
                      <select
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="employee">💼 Employee (Individual Contributor)</option>
                        <option value="supervisor">👷 Supervisor (Team Lead)</option>
                        <option value="manager">👔 Manager (Department Lead)</option>
                        <option value="admin">👑 HR / Super Admin</option>
                      </select>
                    </div>
                    <div className="md:w-1/2 px-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Department</label>
                      <select
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      >
                        <option value="">Select Department...</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:w-1/2 px-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Annual Salary ($)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="55000"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      />
                    </div>
                    <div className="md:w-1/2 px-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Phone Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1 555-0199"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="md:w-1/2 px-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Address / Office Location</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Building A, Floor 3"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-gray-50">
                  <button type="button" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center border border-gray-200 border-gray-500 text-gray-500 hover:bg-gray-50" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 px-6">
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
