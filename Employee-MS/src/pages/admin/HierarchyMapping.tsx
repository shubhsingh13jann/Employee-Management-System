import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  HierarchyHeader,
  HierarchyKPIStats,
  OrphanedStaffBanner,
  HierarchyFilters,
} from "../../Components/admin/hierarchy";

const HierarchyMapping = () => {
  const [hierarchy, setHierarchy] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    employee_id: "",
    supervisor_id: "",
    manager_id: "",
  });
  const [saving, setSaving] = useState(false);

  const unassignedEmployees = employees.filter(
    (e) => !hierarchy.some((h) => String(h.employee_id) === String(e.id))
  );
  const unassignedCount = unassignedEmployees.length;
  const uniqueSupervisorsCount = new Set(hierarchy.map((h) => h.supervisor_id)).size;
  const uniqueManagersCount = new Set(hierarchy.map((h) => h.manager_id)).size;

  const departments = Array.from(
    new Set(hierarchy.map((h) => h.department_name).filter(Boolean))
  ) as string[];

  const filteredHierarchy = hierarchy.filter((h) => {
    if (selectedDepartment !== "all" && h.department_name !== selectedDepartment) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchEmp =
        h.employee_name?.toLowerCase().includes(q) ||
        h.employee_email?.toLowerCase().includes(q);
      const matchSup = h.supervisor_name?.toLowerCase().includes(q);
      const matchMgr = h.manager_name?.toLowerCase().includes(q);
      const matchDept = h.department_name?.toLowerCase().includes(q);
      if (!matchEmp && !matchSup && !matchMgr && !matchDept) return false;
    }
    return true;
  });

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
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50">
      {/* Alert Notification */}
      {msg.text && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <i className={`bi ${msg.type === "success" ? "bi-check-circle-fill text-emerald-500" : "bi-exclamation-triangle-fill text-rose-500"} text-base`}></i>
            <span className="font-medium">{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg({ type: "", text: "" })}
            className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {/* Modern Executive Header */}
      <HierarchyHeader
        totalCount={hierarchy.length}
        onOpenAssignModal={() => setShowModal(true)}
        onRefresh={fetchData}
        isRefreshing={loading}
      />

      {/* KPI Stats Grid */}
      <HierarchyKPIStats
        totalMapped={hierarchy.length}
        totalSupervisors={uniqueSupervisorsCount}
        totalManagers={uniqueManagersCount}
        unassignedCount={unassignedCount}
        onFilterUnassigned={() =>
          setStatusFilter((prev) => (prev === "unassigned" ? "all" : "unassigned"))
        }
        isUnassignedFilterActive={statusFilter === "unassigned"}
      />

      {/* Orphaned Staff Alert Banner */}
      <OrphanedStaffBanner
        unassignedCount={unassignedCount}
        onQuickAssign={() => setShowModal(true)}
        onFilterUnassigned={() =>
          setStatusFilter((prev) => (prev === "unassigned" ? "all" : "unassigned"))
        }
        isFilterActive={statusFilter === "unassigned"}
      />

      {/* Filter and Search Bar */}
      <HierarchyFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        departments={departments}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        unassignedCount={unassignedCount}
        totalFiltered={filteredHierarchy.length}
        totalCount={hierarchy.length}
        onResetFilters={() => {
          setSearchTerm("");
          setSelectedDepartment("all");
          setStatusFilter("all");
        }}
      />

      {/* Mapping Hierarchy Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-6">💼 Employee (Subordinate)</th>
                <th>👷 Direct Supervisor (Team Lead)</th>
                <th>👔 Department Manager</th>
                <th>Department</th>
                <th className="text-right px-6">Assigned Since</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading hierarchy mappings...</span>
                  </td>
                </tr>
              ) : hierarchy.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No active team hierarchy mappings found. Click 'Assign / Reassign Team' to create mappings.
                  </td>
                </tr>
              ) : (
                hierarchy.map((h) => (
                  <tr key={h.id}>
                    <td className="px-6">
                      <div className="flex items-center gap-2">
                        <div className="bg-info bg-opacity-10 text-info rounded-full font-bold flex items-center justify-center" style={{ width: "34px", height: "34px" }}>
                          {h.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="mb-0 font-semibold text-gray-900">{h.employee_name}</p>
                          <small className="text-gray-500">{h.employee_email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-green-600 bg-opacity-10 text-green-600 border border-gray-200 border-gray-200 px-2.5 py-1.5 text-base font-semibold">
                        <i className="bi bi-person-badge mr-1"></i>
                        {h.supervisor_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-blue-600 bg-opacity-10 text-blue-600 border border-gray-200 border-gray-200 px-2.5 py-1.5 text-base font-semibold">
                        <i className="bi bi-person-gear mr-1"></i>
                        {h.manager_name}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-gray-50 text-gray-900 border border-gray-200 border-gray-200">
                        {h.department_name || "General"}
                      </span>
                    </td>
                    <td className="text-right px-6 text-gray-500 text-sm">
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
        <div className="modal show block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-xl">
              <div className="modal-header bg-gray-900 text-white">
                <h5 className="modal-title font-bold">Map Employee to Team</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleAssign}>
                <div className="modal-body p-6">
                  {/* Select Employee */}
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">1. Select Employee (Subordinate)</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">2. Select Direct Supervisor (Team Lead)</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">3. Select Department Manager</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                <div className="modal-footer bg-gray-50">
                  <button type="button" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center border border-gray-200 border-gray-500 text-gray-500 hover:bg-gray-50" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={saving} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 px-6">
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
