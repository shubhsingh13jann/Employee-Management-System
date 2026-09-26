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
    <div className="w-full px-6 p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="flex flex-wrap -mx-4 g-4">
        {/* Create Department Form Card */}
        <div className="w-full px-6 lg:w-1/3 px-6">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white">
            <h5 className="font-bold mb-6 flex items-center gap-2">
              <i className="bi bi-folder-plus text-blue-600"></i>
              Add New Department
            </h5>
            <form onSubmit={handleAddDepartment}>
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Department Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Quality Assurance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Responsibilities, scope, and objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <button disabled={saving} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 w-full py-2 flex items-center justify-center gap-2">
                {saving ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-plus-circle"></i>}
                <span>Create Department</span>
              </button>
            </form>
          </div>
        </div>

        {/* Department List Table Card */}
        <div className="w-full lg:w-2/3 lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
            <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex justify-between items-center">
              <h5 className="font-bold text-slate-900 text-base mb-0">Active Departments</h5>
              <span className="badge bg-secondary">{departments.length} Total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Department Name</th>
                    <th className="px-4 py-3.5">Description</th>
                    <th className="px-4 py-3.5 text-center">Staff Members</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6">
                        <div className="spinner-border spinner-border-sm text-blue-600"></div>
                      </td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-500">No departments created yet.</td>
                    </tr>
                  ) : (
                    departments.map((dept) => (
                      <tr key={dept.id}>
                        <td className="px-6 font-semibold text-gray-900">
                          <i className="bi bi-building mr-2 text-blue-600"></i>
                          {dept.name}
                        </td>
                        <td className="text-gray-500 text-sm" style={{ maxWidth: "250px" }}>
                          {dept.description || "No description provided"}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-gray-50 text-gray-900 border border-gray-200 border-gray-200 px-6 py-1.5 rounded-full">
                            {dept.member_count} Members
                          </span>
                        </td>
                        <td className="text-right px-6">
                          <button
                            onClick={() => handleDelete(dept.id, dept.name)}
                            className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm btn-outline-danger"
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
