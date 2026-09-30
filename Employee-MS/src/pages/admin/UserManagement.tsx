import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import { UserFormModal } from "../../Components/admin/users/UserFormModal";
import { UserProfileModal } from "../../Components/admin/users/UserProfileModal";
import { ConfirmOffboardModal } from "../../Components/admin/users/ConfirmOffboardModal";

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "danger" | ""; text: string }>({ type: "", text: "" });

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUserIdForProfile, setSelectedUserIdForProfile] = useState<number | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [offboardTarget, setOffboardTarget] = useState<{ id: number; name: string; role?: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedRole) params.role = selectedRole;
      if (selectedDept) params.department_id = selectedDept;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/api/admin/users", { params });
      if (res.data.status) {
        setUsers(res.data.users || []);
      }
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load workforce directory" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/admin/departments");
      if (res.data.status) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await api.get("/api/admin/users/supervisors");
      if (res.data.status) {
        setSupervisors(res.data.supervisors || []);
      }
    } catch (err) {
      console.error("Fetch supervisors error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchSupervisors();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedRole, selectedDept, searchQuery]);

  const handleRequestDelete = (user: any) => {
    setOffboardTarget({ id: user.id, name: user.name, role: user.role });
  };

  const handleConfirmOffboard = async () => {
    if (!offboardTarget) return;

    try {
      setDeletingId(offboardTarget.id);
      const res = await api.delete(`/api/admin/users/${offboardTarget.id}`);
      if (res.data.status) {
        setMsg({ type: "success", text: `Staff member '${offboardTarget.name}' offboarded successfully` });
        fetchUsers();
        fetchSupervisors();
      }
    } catch (err: any) {
      console.error("Delete user error:", err);
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to offboard user" });
    } finally {
      setDeletingId(null);
      setOffboardTarget(null);
    }
  };

  const handleOpenOnboard = () => {
    setSelectedUserForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUserForEdit(user);
    setIsFormModalOpen(true);
  };

  const handleOpenProfile = (id: number) => {
    setSelectedUserIdForProfile(id);
    setIsProfileModalOpen(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ["ID", "Name", "Email", "Role", "Department", "Supervisor", "Salary", "Phone", "Status", "Joined"];
    const rows = users.map((u) => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      u.role,
      `"${(u.department_name || "Unassigned").replace(/"/g, '""')}"`,
      `"${(u.supervisor_name || "Direct to HOD").replace(/"/g, '""')}"`,
      u.salary || 0,
      `"${(u.phone || "").replace(/"/g, '""')}"`,
      u.status || "active",
      u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workforce_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === "active").length;
    const supervisorsCount = users.filter((u) => u.role === "supervisor").length;
    const leadersCount = users.filter((u) => u.role === "manager" || u.is_hod).length;
    return { total, active, supervisorsCount, leadersCount };
  }, [users]);

  const getRoleBadge = (u: any) => {
    switch (u.role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            👑 HR Admin
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            👔 Manager
          </span>
        );
      case "supervisor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>👷 Supervisor</span>
            {u.direct_reports_count > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-200/60 text-emerald-900">
                {u.direct_reports_count}
              </span>
            )}
          </span>
        );
      case "employee":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            💼 Employee
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Alert Notification */}
      {msg.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`bi ${msg.type === "success" ? "bi-check-circle-fill text-emerald-600" : "bi-exclamation-triangle-fill text-rose-600"}`}></i>
            <span className="font-medium">{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg({ type: "", text: "" })}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Metrics & Action Controls - Unified Single Row */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 sm:gap-3">
        {/* Compact KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Workforce</span>
              <span className="text-base sm:text-lg font-black text-slate-900 leading-tight block">{metrics.total}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
              Headcount
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Status</span>
              <span className="text-base sm:text-lg font-black text-emerald-600 leading-tight block">{metrics.active}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {metrics.total > 0 ? `${Math.round((metrics.active / metrics.total) * 100)}%` : "0%"}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Supervisors / Leads</span>
              <span className="text-base sm:text-lg font-black text-indigo-600 leading-tight block">{metrics.supervisorsCount}</span>
            </div>
            <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Pod Leads
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Leadership & HODs</span>
              <span className="text-base sm:text-lg font-black text-violet-600 leading-tight block">{metrics.leadersCount}</span>
            </div>
            <span className="text-[10px] text-violet-700 font-semibold bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
              Authorities
            </span>
          </div>
        </div>

        {/* Action Controls in the exact same row */}
        <div className="flex items-center gap-2 shrink-0 self-end xl:self-center">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={users.length === 0}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Export Workforce Directory as CSV"
          >
            <i className="bi bi-download text-[11px]"></i>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenOnboard}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <i className="bi bi-person-plus-fill text-xs"></i>
            <span>Onboard Member</span>
          </button>
        </div>
      </div>

      {/* Filter, Search & Role Bar - Single Row */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          {/* Search Box */}
          <div className="relative w-44 sm:w-56">
            <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] pointer-events-none"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workforce..."
              className="w-full pl-7 pr-6 py-1 rounded-lg text-[11px] bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-medium text-slate-700 cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.code ? `(${d.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedRole("")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              selectedRole === ""
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            All Roles ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("manager")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              selectedRole === "manager"
                ? "bg-indigo-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Managers
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("supervisor")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              selectedRole === "supervisor"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Supervisors
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("employee")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              selectedRole === "employee"
                ? "bg-sky-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Employees
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("admin")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              selectedRole === "admin"
                ? "bg-rose-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Admins
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("hod")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              selectedRole === "hod"
                ? "bg-amber-600 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            Dept Heads (HOD)
          </button>
        </div>
      </div>

      {/* Workforce Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-4 py-3.5">Governance Role</th>
                <th className="px-4 py-3.5">Department & Reporting</th>
                <th className="px-4 py-3.5">Annual Salary</th>
                <th className="px-4 py-3.5">Contact</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Loading workforce directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <i className="bi bi-people text-3xl text-slate-300"></i>
                      <p className="font-medium text-slate-600 mb-0">No workforce personnel found</p>
                      <p className="text-[11px] text-slate-400 mb-0">
                        Try adjusting your filters, search terms, or onboard a new team member.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Staff Member Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shadow-2xs shrink-0 overflow-hidden">
                          {u.image_url ? (
                            <img src={u.image_url} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{u.name ? u.name.charAt(0) : "U"}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs leading-tight">
                              {u.name}
                            </span>
                            {u.is_hod ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                                👑 HOD
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role Tier */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getRoleBadge(u)}
                    </td>

                    {/* Department & Reporting Line */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 text-xs">
                            {u.department_name || "Unassigned"}
                          </span>
                          {u.department_code && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                              {u.department_code}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <i className="bi bi-arrow-return-right text-[10px] text-indigo-400"></i>
                          <span>{u.supervisor_name ? `Reports to: ${u.supervisor_name}` : "Direct to HOD"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Compensation */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 text-xs">
                        ${Number(u.salary || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/ year</span>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <span className="block">{u.phone || "—"}</span>
                        <span className="block text-slate-400 text-[10px] truncate max-w-[140px]" title={u.address}>
                          {u.address || "HQ Office"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        ></span>
                        <span className="capitalize">{u.status || "active"}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(u.id)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 flex items-center justify-center transition-all cursor-pointer text-xs"
                          title="View Full Profile & Hierarchy"
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 flex items-center justify-center transition-all cursor-pointer text-xs"
                          title="Edit Member Details"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === u.id}
                          onClick={() => handleRequestDelete(u)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer text-xs disabled:opacity-50"
                          title="Offboard / Remove Member"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal (Onboard & Edit) */}
      <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        onSuccess={() => {
          fetchUsers();
          fetchSupervisors();
          setMsg({
            type: "success",
            text: selectedUserForEdit
              ? "Member profile updated successfully"
              : "New workforce member onboarded successfully"
          });
        }}
        departments={departments}
        supervisors={supervisors}
        editUser={selectedUserForEdit}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedUserIdForProfile(null);
        }}
        userId={selectedUserIdForProfile}
        onEditUser={(user) => {
          setSelectedUserForEdit(user);
          setIsFormModalOpen(true);
        }}
      />

      {/* Enterprise Personnel Offboard Confirmation Modal */}
      <ConfirmOffboardModal
        isOpen={Boolean(offboardTarget)}
        onClose={() => setOffboardTarget(null)}
        onConfirm={handleConfirmOffboard}
        memberName={offboardTarget?.name || ""}
        memberRole={offboardTarget?.role}
        isDeleting={deletingId !== null}
      />
    </div>
  );
};

export default UserManagement;
