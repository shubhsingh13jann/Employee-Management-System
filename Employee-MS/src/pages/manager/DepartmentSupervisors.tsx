import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { HierarchyEmployeeDossierModal } from "../../Components/admin/hierarchy";

interface NestedMember {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  image_url?: string;
  department_name?: string;
  assigned_at?: string;
}

interface ActiveDelegation {
  id: number;
  original_supervisor_id: number;
  acting_supervisor_id: number;
  original_supervisor_name: string;
  acting_supervisor_name: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

interface SupervisorItem {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  image_url?: string;
  max_span_capacity?: number;
  department_name?: string;
  active_projects_count?: number;
  team_size?: number;
  total_tasks_count?: number;
  completed_tasks_count?: number;
  team_members?: NestedMember[];
  active_delegation?: ActiveDelegation | null;
}

const DepartmentSupervisors: React.FC = () => {
  const [supervisors, setSupervisors] = useState<SupervisorItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [expandedSupervisorIds, setExpandedSupervisorIds] = useState<Set<string>>(new Set());
  const [selectedDossierEmployee, setSelectedDossierEmployee] = useState<any | null>(null);

  const fetchSupervisors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/manager/supervisors");
      if (res.data.status) {
        setSupervisors(res.data.supervisors || []);
        // Auto-expand supervisors by default
        const allIds = new Set<string>((res.data.supervisors || []).map((s: any) => String(s.id)));
        setExpandedSupervisorIds(allIds);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load department supervisors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const toggleExpand = (supId: string | number) => {
    setExpandedSupervisorIds((prev) => {
      const next = new Set(prev);
      const strId = String(supId);
      if (next.has(strId)) {
        next.delete(strId);
      } else {
        next.add(strId);
      }
      return next;
    });
  };

  const filteredSupervisors = supervisors.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchSup =
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.department_name && s.department_name.toLowerCase().includes(q));

    const matchMember = (s.team_members || []).some(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );

    return matchSup || matchMember;
  });

  const totalEmployeesManaged = supervisors.reduce(
    (sum, s) => sum + (s.team_members?.length || Number(s.team_size || 0)),
    0
  );

  const totalActiveProjects = supervisors.reduce(
    (sum, s) => sum + Number(s.active_projects_count || 0),
    0
  );

  return (
    <div className="w-full space-y-3.5">
      {/* Header Banner with Fluid Navy/Indigo Waves */}
      <div className="relative px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0 opacity-40">
          <svg viewBox="0 0 500 100" fill="none" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0 45 C120 15 220 75 320 25 C420 -5 460 65 500 20 L500 100 L0 100 Z"
              fill="url(#mgrHeroGrad)"
            />
            <defs>
              <linearGradient id="mgrHeroGrad" x1="0%" y1="0%" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/60 border border-indigo-400/40 text-indigo-300 flex items-center justify-center text-base shadow-xs">
            <i className="bi bi-diagram-3-fill"></i>
          </div>
          <div>
            <h4 className="font-bold text-base sm:text-lg mb-0 text-white tracking-tight">
              Department Operational Hierarchy
            </h4>
            <p className="text-xs text-indigo-200/80 mb-0 font-normal">
              Supervisor squad structures, workload distribution, and nested operational reporting
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-slate-800/80 p-0.5 border border-slate-700/60 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <i className="bi bi-grid-fill text-xs"></i>
              <span>Squad Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <i className="bi bi-list-ul text-xs"></i>
              <span>Summary Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchSupervisors}
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Hierarchy"
          >
            <i className={`bi bi-arrow-clockwise text-sm ${loading ? "animate-spin" : ""}`}></i>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill text-rose-500"></i>
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
            <i className="bi bi-person-gear"></i>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Supervisors
            </span>
            <span className="text-base font-bold text-slate-900">{supervisors.length}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center text-lg font-bold shrink-0">
            <i className="bi bi-people-fill"></i>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Staff
            </span>
            <span className="text-base font-bold text-slate-900">{totalEmployeesManaged}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-lg font-bold shrink-0">
            <i className="bi bi-kanban"></i>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Projects
            </span>
            <span className="text-base font-bold text-slate-900">{totalActiveProjects}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold shrink-0">
            <i className="bi bi-speedometer2"></i>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Avg Squad Size
            </span>
            <span className="text-base font-bold text-slate-900">
              {supervisors.length > 0
                ? (totalEmployeesManaged / supervisors.length).toFixed(1)
                : 0}{" "}
              staff
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by supervisor, department, or employee name..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "cards" && (
            <button
              type="button"
              onClick={() => {
                if (expandedSupervisorIds.size === supervisors.length) {
                  setExpandedSupervisorIds(new Set());
                } else {
                  setExpandedSupervisorIds(new Set(supervisors.map((s) => String(s.id))));
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {expandedSupervisorIds.size === supervisors.length ? "Collapse All" : "Expand All"}
            </button>
          )}
        </div>
      </div>

      {/* View Rendering */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 mb-0 font-medium">Loading department hierarchy...</p>
        </div>
      ) : filteredSupervisors.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
          <i className="bi bi-diagram-3 text-4xl text-slate-300 block mb-2"></i>
          <h5 className="text-sm font-bold text-slate-700 mb-1">No Supervisors Found</h5>
          <p className="text-xs text-slate-400 mb-0 max-w-sm mx-auto">
            {searchQuery
              ? "No supervisors or squad members matched your search."
              : "No team leads are currently assigned to this department."}
          </p>
        </div>
      ) : viewMode === "cards" ? (
        /* Hierarchical Squad Cards */
        <div className="space-y-3">
          {filteredSupervisors.map((sup) => {
            const teamMembers = sup.team_members || [];
            const maxCap = sup.max_span_capacity || 8;
            const capPct = Math.min(Math.round((teamMembers.length / maxCap) * 100), 100);
            const isExpanded = expandedSupervisorIds.has(String(sup.id));
            const del = sup.active_delegation;

            return (
              <div
                key={sup.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Supervisor Card Header */}
                <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
                      {sup.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-slate-900 text-sm sm:text-base mb-0 truncate">
                          {sup.name}
                        </h5>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          SUP-{String(sup.id).padStart(4, "0")}
                        </span>
                        {sup.department_name && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {sup.department_name}
                          </span>
                        )}
                        {del && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                            <i className="bi bi-person-badge"></i>
                            <span>Acting Lead: {del.acting_supervisor_name}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-0 mt-0.5 truncate">{sup.email}</p>
                    </div>
                  </div>

                  {/* Telemetry and Controls */}
                  <div className="flex items-center gap-3 justify-between md:justify-end flex-wrap">
                    {/* Capacity Meter */}
                    <div className="w-36 space-y-1">
                      <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-600">
                        <span>Squad Capacity</span>
                        <span>
                          {teamMembers.length} / {maxCap} ({capPct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            capPct >= 100
                              ? "bg-rose-500"
                              : capPct >= 75
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${capPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedDossierEmployee({
                            employee_id: sup.id,
                            employee_name: sup.name,
                            employee_email: sup.email,
                            employee_phone: sup.phone,
                            department_name: sup.department_name,
                            role: "supervisor",
                          })
                        }
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="View Supervisor Dossier"
                      >
                        <i className="bi bi-person-lines-fill"></i>
                        <span>Dossier</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(sup.id)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                        title={isExpanded ? "Collapse squad" : "Expand squad"}
                      >
                        <i
                          className={`bi bi-chevron-down text-xs transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Nested Team Members */}
                {isExpanded && (
                  <div className="p-3.5 sm:p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-bold text-slate-700">
                        Assigned Direct Reports ({teamMembers.length})
                      </span>
                    </div>

                    {teamMembers.length === 0 ? (
                      <div className="py-4 text-center rounded-xl border border-dashed border-slate-200 bg-white text-xs text-slate-400">
                        No direct subordinates assigned to this supervisor.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                        {teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {member.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 text-xs truncate block">
                                  {member.name}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  EMP-{String(member.id).padStart(4, "0")} • {member.department_name || "General"}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedDossierEmployee({
                                  employee_id: member.id,
                                  employee_name: member.name,
                                  employee_email: member.email,
                                  employee_phone: member.phone,
                                  department_name: member.department_name,
                                  role: "employee",
                                })
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer shrink-0"
                              title="View Employee Dossier"
                            >
                              <i className="bi bi-person-lines-fill text-xs"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Summary Table View */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Supervisor Lead</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Direct Reports</th>
                  <th className="py-2.5 px-3">Span Utilization</th>
                  <th className="py-2.5 px-3">Active Projects</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSupervisors.map((s) => {
                  const teamMembers = s.team_members || [];
                  const maxCap = s.max_span_capacity || 8;
                  const capPct = Math.min(Math.round((teamMembers.length / maxCap) * 100), 100);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{s.name}</span>
                            <span className="text-[10px] text-slate-400">
                              SUP-{String(s.id).padStart(4, "0")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        <div className="truncate max-w-[160px]">{s.email}</div>
                        {s.phone && <div className="text-[10px] text-slate-400">{s.phone}</div>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px]">
                          {s.department_name || "General"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {teamMembers.length} staff
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-24 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                            <span>{teamMembers.length}/{maxCap}</span>
                            <span>{capPct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                capPct >= 100 ? "bg-rose-500" : capPct >= 75 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${capPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {s.active_projects_count || 0}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDossierEmployee({
                              employee_id: s.id,
                              employee_name: s.name,
                              employee_email: s.email,
                              employee_phone: s.phone,
                              department_name: s.department_name,
                              role: "supervisor",
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10.5px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <i className="bi bi-person-lines-fill"></i>
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Personnel Dossier Modal */}
      <HierarchyEmployeeDossierModal
        isOpen={Boolean(selectedDossierEmployee)}
        onClose={() => setSelectedDossierEmployee(null)}
        employee={selectedDossierEmployee}
      />
    </div>
  );
};

export default DepartmentSupervisors;
