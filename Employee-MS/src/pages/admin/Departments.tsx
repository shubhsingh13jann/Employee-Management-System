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
    <div className="w-full space-y-6">
      {msg.text && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-2xs border ${
            msg.type === "danger"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`bi ${msg.type === "danger" ? "bi-exclamation-triangle-fill text-rose-500" : "bi-check-circle-fill text-emerald-500"}`}></i>
            <span className="font-medium">{msg.text}</span>
          </div>
          <button onClick={() => setMsg({ type: "", text: "" })} className="p-1 hover:opacity-70 transition-opacity font-bold">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Department Form Card */}
        <div className="lg:col-span-4 w-full">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col">
            {/* Header with Purple Icon */}
            <div className="flex items-start gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shadow-2xs shrink-0 mt-0.5">
                <i className="bi bi-folder-plus text-lg"></i>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 text-base mb-0.5">Add New Department</h5>
                <p className="text-xs text-slate-500 mb-0 font-medium leading-relaxed">
                  Create a new department or organizational unit
                </p>
              </div>
            </div>

            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block mb-1.5 font-semibold text-slate-700 text-xs">Department Name</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs">
                    <i className="bi bi-building"></i>
                  </span>
                  <input
                    type="text"
                    className="w-full pl-8 pr-4 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl outline-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 font-medium"
                    placeholder="e.g., Engineering, Marketing, Finance"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-700 text-xs">Description</label>
                  <span className="text-[10px] text-slate-400 font-medium">{description.length}/250</span>
                </div>
                <textarea
                  className="w-full p-3 text-xs bg-slate-50/60 border border-slate-200 rounded-xl outline-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 font-medium resize-none"
                  rows={3}
                  maxLength={250}
                  placeholder="Describe the department's purpose, responsibilities, and key functions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-xs hover:shadow disabled:opacity-60"
              >
                {saving ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <i className="bi bi-plus-lg text-xs font-bold"></i>
                )}
                <span>Create Department</span>
              </button>
            </form>
          </div>
        </div>

        {/* Department List Table Card */}
        <div className="lg:col-span-8 w-full">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
            {/* Active Departments Header */}
            <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100/70 flex items-center justify-center text-purple-600 shrink-0">
                  <i className="bi bi-people text-sm"></i>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-sm mb-0">Active Departments</h5>
                  <p className="text-[11px] text-slate-400 mb-0 font-medium">Manage and organize all departments in your organization</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                  {departments.length} Departments
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <i className="bi bi-funnel text-xs"></i>
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Description</th>
                    <th className="px-4 py-3.5 text-center">Members</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      </td>
                    </tr>
                  ) : departments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400 text-xs font-medium">
                        No departments created yet. Use the form on the left to add one.
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept, index) => {
                      const icons = ["bi-code-slash", "bi-graph-up", "bi-people", "bi-megaphone", "bi-cart", "bi-shield-check"];
                      const colors = [
                        "bg-blue-50 text-blue-600 border-blue-100",
                        "bg-emerald-50 text-emerald-600 border-emerald-100",
                        "bg-purple-50 text-purple-600 border-purple-100",
                        "bg-amber-50 text-amber-600 border-amber-100",
                        "bg-rose-50 text-rose-600 border-rose-100",
                        "bg-cyan-50 text-cyan-600 border-cyan-100"
                      ];
                      const badgeColors = [
                        "bg-blue-50 text-blue-700 border-blue-100",
                        "bg-emerald-50 text-emerald-700 border-emerald-100",
                        "bg-purple-50 text-purple-700 border-purple-100",
                        "bg-amber-50 text-amber-700 border-amber-100",
                        "bg-rose-50 text-rose-700 border-rose-100",
                        "bg-cyan-50 text-cyan-700 border-cyan-100"
                      ];
                      const iconClass = icons[index % icons.length];
                      const colorClass = colors[index % colors.length];
                      const memberBadgeClass = badgeColors[index % badgeColors.length];

                      return (
                        <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-bold ${colorClass} shrink-0`}>
                                <i className={`bi ${iconClass}`}></i>
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">{dept.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                                  {dept.name.substring(0, 3)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-slate-500 font-medium text-xs" style={{ maxWidth: "260px" }}>
                            {dept.description || "No description provided"}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold border ${memberBadgeClass}`}>
                              {dept.member_count} Members
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(dept.id, dept.name)}
                              className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-rose-100"
                              title="Delete Department"
                            >
                              <i className="bi bi-trash text-sm"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Pagination Note */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Showing 1 to {departments.length} of {departments.length} departments</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 opacity-50 cursor-not-allowed">
                  <i className="bi bi-chevron-left text-[10px]"></i>
                </button>
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">1</span>
                <button type="button" disabled className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 opacity-50 cursor-not-allowed">
                  <i className="bi bi-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Departments;
