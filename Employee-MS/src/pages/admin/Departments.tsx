import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { DepartmentRosterModal } from "../../Components/DepartmentRosterModal";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [headId, setHeadId] = useState("");
  const [parentId, setParentId] = useState("");
  const [eligibleHeads, setEligibleHeads] = useState([]);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [rosterDept, setRosterDept] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const filteredDepartments = departments.filter((dept) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(query) ||
      dept.code?.toLowerCase().includes(query) ||
      dept.description?.toLowerCase().includes(query) ||
      dept.head_name?.toLowerCase().includes(query) ||
      dept.parent_name?.toLowerCase().includes(query)
    );
  });

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

  const fetchEligibleHeads = async () => {
    try {
      const res = await api.get("/api/admin/departments/eligible-heads");
      if (res.data.status) {
        setEligibleHeads(res.data.eligibleHeads || []);
      }
    } catch (err) {
      console.error("Failed to load eligible department heads:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEligibleHeads();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-menu-container")) {
        setActiveActionMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleStartEdit = (dept) => {
    setEditingDeptId(dept.id);
    setName(dept.name || "");
    setCode(dept.code || "");
    setDescription(dept.description || "");
    setHeadId(dept.head_id ? String(dept.head_id) : "");
    setParentId(dept.parent_id ? String(dept.parent_id) : "");
    setMsg({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingDeptId(null);
    setName("");
    setCode("");
    setDescription("");
    setHeadId("");
    setParentId("");
    setMsg({ type: "", text: "" });
  };

  const handleSubmitDepartment = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        head_id: headId ? Number(headId) : null,
        parent_id: parentId ? Number(parentId) : null
      };

      if (editingDeptId) {
        const res = await api.put(`/api/admin/departments/${editingDeptId}`, payload);
        if (res.data.status) {
          setMsg({ type: "success", text: "Department updated successfully!" });
          handleCancelEdit();
          fetchDepartments();
          fetchEligibleHeads();
        }
      } else {
        const res = await api.post("/api/admin/departments", payload);
        if (res.data.status) {
          setMsg({ type: "success", text: "Department created successfully!" });
          handleCancelEdit();
          fetchDepartments();
          fetchEligibleHeads();
        }
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to save department" });
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
        if (editingDeptId === id) {
          handleCancelEdit();
        }
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
        {/* Create / Edit Department Form Card */}
        <div className="lg:col-span-4 w-full">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 flex flex-col">
            {/* Header with Icon and Edit Mode Toggle */}
            <div className="flex items-start justify-between gap-3.5 mb-6">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl ${
                  editingDeptId ? "bg-amber-50 border-amber-100/80 text-amber-600" : "bg-purple-50 border-purple-100/80 text-purple-600"
                } border flex items-center justify-center shadow-2xs shrink-0 mt-0.5 transition-colors`}>
                  <i className={`bi ${editingDeptId ? "bi-pencil-square" : "bi-folder-plus"} text-lg`}></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-slate-900 text-base mb-0.5">
                      {editingDeptId ? "Edit Department" : "Add New Department"}
                    </h5>
                    {editingDeptId && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                        Edit Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-0 font-medium leading-relaxed">
                    {editingDeptId
                      ? "Modify corporate charter & leadership assignment"
                      : "Define corporate organizational charter & unit"}
                  </p>
                </div>
              </div>
              {editingDeptId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shrink-0"
                >
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitDepartment} className="space-y-4">
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
                  <label className="font-semibold text-slate-700 text-xs">Department Code</label>
                  <span className="text-[10px] text-slate-400 font-medium">3-4 letters unique identifier</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs">
                    <i className="bi bi-upc-scan"></i>
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full pl-8 pr-4 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl outline-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 font-bold uppercase tracking-wider"
                    placeholder="e.g., ENG, MKT, FIN"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-700 text-xs">Description</label>
                  <span className={`text-[10px] font-semibold transition-colors ${
                    description.length > 220 ? "text-amber-600" : "text-slate-400"
                  }`}>
                    {description.length}/250 characters
                  </span>
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

              {/* Department Head (HOD) Selector */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-700 text-xs">Department Head (HOD)</label>
                  <span className="text-[10px] text-slate-400 font-medium">Designated Leader</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">
                    <i className="bi bi-person-badge"></i>
                  </span>
                  <select
                    className="w-full pl-8 pr-8 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl outline-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all font-medium appearance-none cursor-pointer"
                    value={headId}
                    onChange={(e) => setHeadId(e.target.value)}
                  >
                    <option value="">— Unassigned / Vacant —</option>
                    {eligibleHeads.map((head) => (
                      <option key={head.id} value={head.id}>
                        {head.name} ({head.role?.toUpperCase() || "MANAGER"}) {head.department_name ? `• ${head.department_name}` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 text-slate-400 text-xs pointer-events-none">
                    <i className="bi bi-chevron-down text-[10px]"></i>
                  </span>
                </div>

                {/* HOD Preview Badge if selected */}
                {headId && (() => {
                  const selectedHead = eligibleHeads.find((h) => String(h.id) === String(headId));
                  if (!selectedHead) return null;
                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
                          {selectedHead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-[11px] leading-tight">{selectedHead.name}</div>
                          <div className="text-[10px] text-slate-400">{selectedHead.email}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {selectedHead.role}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Parent Department Selector */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-semibold text-slate-700 text-xs">Parent Department</label>
                  <span className="text-[10px] text-slate-400 font-medium">Optional hierarchy</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">
                    <i className="bi bi-diagram-3"></i>
                  </span>
                  <select
                    className="w-full pl-8 pr-8 py-2.5 text-xs bg-slate-50/60 border border-slate-200 rounded-xl outline-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all font-medium appearance-none cursor-pointer"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                  >
                    <option value="">— None (Top-Level Department) —</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code ? `(${dept.code})` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 text-slate-400 text-xs pointer-events-none">
                    <i className="bi bi-chevron-down text-[10px]"></i>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all duration-200 cursor-pointer inline-flex items-center justify-center gap-2 ${
                    editingDeptId
                      ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-xs hover:shadow"
                      : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-xs hover:shadow"
                  } disabled:opacity-60`}
                >
                  {saving ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <i className={`bi ${editingDeptId ? "bi-check-lg" : "bi-plus-lg"} text-xs font-bold`}></i>
                  )}
                  <span>{editingDeptId ? "Save Department Changes" : "Create Department"}</span>
                </button>
                {editingDeptId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="py-3 px-4 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Department List Table Card */}
        <div className="lg:col-span-8 w-full">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
            {/* Active Departments Header with Search */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100/70 flex items-center justify-center text-purple-600 shrink-0">
                  <i className="bi bi-people text-sm"></i>
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-sm mb-0">Active Departments</h5>
                  <p className="text-[11px] text-slate-400 mb-0 font-medium">
                    Corporate organizational hierarchy & management
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-slate-400 text-xs pointer-events-none">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Search departments or HOD..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-7 py-1.5 text-xs bg-slate-50/70 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 placeholder:text-slate-400 w-44 sm:w-56 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
                  {filteredDepartments.length} {filteredDepartments.length === 1 ? "Dept" : "Depts"}
                </span>
              </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Description</th>
                    <th className="px-4 py-3.5">Head of Dept</th>
                    <th className="px-4 py-3.5 text-center">Members</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      </td>
                    </tr>
                  ) : filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 text-xs font-medium">
                        {searchQuery ? "No departments match your search query." : "No departments created yet. Use the form on the left to add one."}
                      </td>
                    </tr>
                  ) : (
                    filteredDepartments.map((dept, index) => {
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
                          {/* Department Name & Code */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-bold ${colorClass} shrink-0 shadow-2xs`}>
                                <i className={`bi ${iconClass}`}></i>
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block text-xs">{dept.name}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200/80">
                                    {dept.code || dept.name.substring(0, 3).toUpperCase()}
                                  </span>
                                  {dept.parent_name && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      ↳ {dept.parent_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="px-4 py-4 text-slate-500 font-medium text-xs max-w-[220px]">
                            <p className="truncate mb-0" title={dept.description}>
                              {dept.description || "No description provided"}
                            </p>
                          </td>

                          {/* Department Head (HOD) */}
                          <td className="px-4 py-4">
                            {dept.head_name ? (
                              <div className="flex items-center gap-2.5">
                                {dept.head_image_url ? (
                                  <img
                                    src={dept.head_image_url}
                                    alt={dept.head_name}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
                                    {dept.head_name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <span className="font-semibold text-slate-800 text-xs block leading-tight">
                                    {dept.head_name}
                                  </span>
                                  <span className="text-[10px] text-indigo-600 font-medium">
                                    {dept.head_role ? `${dept.head_role.toUpperCase()} / HOD` : "HOD"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                <i className="bi bi-dash-circle text-[9px]"></i>
                                Vacant
                              </span>
                            )}
                          </td>

                          {/* Members Count with Breakdown */}
                          <td className="px-4 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => setRosterDept(dept)}
                              className="inline-flex flex-col items-center group cursor-pointer"
                              title={`View ${dept.name} Roster & Org`}
                            >
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${memberBadgeClass} shadow-2xs group-hover:ring-2 group-hover:ring-indigo-400/50 transition-all`}>
                                <i className="bi bi-people-fill text-[10px]"></i>
                                {dept.member_count} Members
                              </span>
                              {(dept.supervisor_count > 0 || dept.employee_count > 0) && (
                                <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 font-medium mt-1 transition-colors">
                                  {dept.supervisor_count > 0 ? `${dept.supervisor_count} lead${dept.supervisor_count > 1 ? "s" : ""}` : ""}
                                  {dept.supervisor_count > 0 && dept.employee_count > 0 ? " • " : ""}
                                  {dept.employee_count > 0 ? `${dept.employee_count} staff` : ""}
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Actions: 3-Dots Dropdown Menu */}
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block text-left action-menu-container">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(activeActionMenuId === dept.id ? null : dept.id);
                                }}
                                className={`w-8 h-8 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center border ${
                                  activeActionMenuId === dept.id
                                    ? "bg-slate-100 text-slate-800 border-slate-300 shadow-2xs"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent hover:border-slate-200"
                                }`}
                                title="Department Actions"
                              >
                                <i className="bi bi-three-dots-vertical text-xs"></i>
                              </button>

                              {activeActionMenuId === dept.id && (
                                <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white border border-slate-200/90 shadow-lg py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100">
                                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {dept.code || dept.name} Actions
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setRosterDept(dept);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-people text-slate-400"></i>
                                    <span>View Roster & Org</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleStartEdit(dept);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-pencil text-slate-400"></i>
                                    <span>Edit Department</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setMsg({ type: "success", text: `Workforce mobility transfer for ${dept.name} is ready for Phase 2.6 transfer tool.` });
                                    }}
                                    className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-arrow-left-right text-slate-400"></i>
                                    <span>Transfer Members</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100"></div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleDelete(dept.id, dept.name);
                                    }}
                                    className="w-full px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                                  >
                                    <i className="bi bi-trash text-rose-500"></i>
                                    <span>Delete Department</span>
                                  </button>
                                </div>
                              )}
                            </div>
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
              <span>Showing 1 to {filteredDepartments.length} of {departments.length} departments</span>
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

      {/* Enterprise Department Roster & Org Hierarchy Modal */}
      <DepartmentRosterModal
        isOpen={!!rosterDept}
        onClose={() => setRosterDept(null)}
        departmentId={rosterDept?.id || null}
        departmentName={rosterDept?.name}
        onEditClick={(deptToEdit) => {
          handleStartEdit(deptToEdit);
        }}
        onTransferClick={(userId) => {
          setRosterDept(null);
          setMsg({
            type: "success",
            text: `Workforce mobility transfer initiated for member #${userId || "selected"}. Transfer tool will open in Phase 2.6.`
          });
        }}
      />
    </div>
  );
};

export default Departments;
