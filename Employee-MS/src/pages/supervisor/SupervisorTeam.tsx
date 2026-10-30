import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { HierarchyEmployeeDossierModal } from "../../Components/admin/hierarchy";

interface TeamMember {
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  image_url?: string;
  department_name?: string;
  assigned_at: string;
  total_tasks?: number;
  completed_tasks?: number;
}

interface DelegationInfo {
  id: number;
  original_supervisor_id: number;
  acting_supervisor_id: number;
  original_supervisor_name: string;
  acting_supervisor_name: string;
  start_date: string;
  end_date: string;
  reason?: string;
}

interface MatrixMember {
  matrix_id: number;
  id: number | string;
  name: string;
  email: string;
  phone?: string;
  role_title?: string;
  project_title?: string;
  department_name?: string;
  assigned_at: string;
}

const SupervisorTeam: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [matrixMembers, setMatrixMembers] = useState<MatrixMember[]>([]);
  const [delegations, setDelegations] = useState<DelegationInfo[]>([]);
  const [maxSpanCapacity, setMaxSpanCapacity] = useState<number>(8);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"squad" | "table">("squad");
  const [selectedDossierEmployee, setSelectedDossierEmployee] = useState<any | null>(null);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/supervisor/team");
      if (res.data.status) {
        setTeam(res.data.team || []);
        setMatrixMembers(res.data.matrixMembers || []);
        setDelegations(res.data.delegations || []);
        if (res.data.maxSpanCapacity) {
          setMaxSpanCapacity(res.data.maxSpanCapacity);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const filteredTeam = team.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.department_name && m.department_name.toLowerCase().includes(q))
    );
  });

  const capacityPct = Math.min(Math.round((team.length / (maxSpanCapacity || 8)) * 100), 100);

  return (
    <div className="w-full space-y-3.5">
      {/* Premium Header Banner */}
      <div className="relative px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 overflow-hidden">
        {/* Subtle Wave Motif Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0 opacity-40">
          <svg viewBox="0 0 500 100" fill="none" preserveAspectRatio="none" className="w-full h-full">
            <path
              d="M0 40 C100 10 200 80 300 30 C400 -10 450 70 500 20 L500 100 L0 100 Z"
              fill="url(#supHeroGrad)"
            />
            <defs>
              <linearGradient id="supHeroGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/60 border border-indigo-400/40 text-indigo-300 flex items-center justify-center text-sm shadow-xs">
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-0 text-white tracking-tight">
                My Operational Squad
              </h4>
              <p className="text-xs text-indigo-200/80 mb-0 font-normal">
                Direct subordinates and agile cross-functional members under your leadership
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Refresh */}
        <div className="relative z-10 flex items-center gap-2 flex-wrap">
          {/* Capacity Utilization Chip */}
          <div className="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs flex items-center gap-2 text-xs">
            <span className="text-slate-300">Span:</span>
            <span className="font-bold text-white">
              {team.length} / {maxSpanCapacity}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                capacityPct >= 100
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : capacityPct >= 75
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {capacityPct}%
            </span>
          </div>

          {/* Toggle View Mode */}
          <div className="inline-flex rounded-xl bg-slate-800/80 p-0.5 border border-slate-700/60 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode("squad")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "squad"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <i className="bi bi-grid-fill text-xs"></i>
              <span>Squad</span>
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
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={fetchTeam}
            disabled={loading}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Squad Roster"
          >
            <i className={`bi bi-arrow-clockwise text-sm ${loading ? "animate-spin" : ""}`}></i>
          </button>
        </div>
      </div>

      {/* Acting Lead Delegation Alert Banners */}
      {delegations.length > 0 && (
        <div className="space-y-2">
          {delegations.map((del) => (
            <div
              key={del.id}
              className="p-3 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  <i className="bi bi-person-badge"></i>
                </div>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-amber-950 mb-0">
                    Acting Lead Delegation Active
                  </h5>
                  <p className="text-xs text-amber-800 mb-0">
                    <strong>{del.acting_supervisor_name}</strong> is temporarily managing operations for{" "}
                    <strong>{del.original_supervisor_name}</strong> from{" "}
                    <span className="font-semibold">{new Date(del.start_date).toLocaleDateString()}</span> to{" "}
                    <span className="font-semibold">{new Date(del.end_date).toLocaleDateString()}</span>.
                    {del.reason && ` Reason: ${del.reason}`}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 shrink-0">
                Active Delegation
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill text-rose-500"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search squad member by name or email..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Showing:</span>
          <span className="font-bold text-slate-800">{filteredTeam.length} direct reports</span>
          {matrixMembers.length > 0 && (
            <>
              <span>•</span>
              <span className="font-bold text-purple-700">{matrixMembers.length} matrix reports</span>
            </>
          )}
        </div>
      </div>

      {/* Main Squad Rendering */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 mb-0 font-medium">Loading operational squad roster...</p>
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
          <i className="bi bi-people text-4xl text-slate-300 block mb-2"></i>
          <h5 className="text-sm font-bold text-slate-700 mb-1">No Team Members Found</h5>
          <p className="text-xs text-slate-400 mb-0 max-w-sm mx-auto">
            {searchQuery
              ? "No team members matched your search query. Try clearing filters."
              : "No employees currently assigned to your team. Contact HR Admin for team allocations."}
          </p>
        </div>
      ) : viewMode === "squad" ? (
        /* Squad Cards Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredTeam.map((m) => {
            const completed = Number(m.completed_tasks || 0);
            const total = Number(m.total_tasks || 0);
            const taskPct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={m.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm mb-0 truncate group-hover:text-indigo-600 transition-colors">
                          {m.name}
                        </h5>
                        <p className="text-[10.5px] text-slate-400 mb-0 truncate">
                          EMP-{String(m.id).padStart(4, "0")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDossierEmployee({
                          employee_id: m.id,
                          employee_name: m.name,
                          employee_email: m.email,
                          employee_phone: m.phone,
                          department_name: m.department_name,
                          role: "employee",
                        })
                      }
                      className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="View Personnel Dossier"
                    >
                      <i className="bi bi-person-lines-fill text-xs"></i>
                    </button>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <i className="bi bi-envelope text-slate-400 text-xs"></i>
                      <span className="truncate">{m.email}</span>
                    </div>
                    {m.phone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <i className="bi bi-telephone text-slate-400 text-xs"></i>
                        <span>{m.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <i className="bi bi-calendar3 text-slate-400 text-xs"></i>
                      <span>Assigned: {new Date(m.assigned_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Workload Progress Bar */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-600 mb-1">
                    <span>Task Completion</span>
                    <span>
                      {completed}/{total} ({taskPct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${taskPct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Table View */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Assigned Since</th>
                  <th className="py-2.5 px-3">Task Progress</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTeam.map((m) => {
                  const completed = Number(m.completed_tasks || 0);
                  const total = Number(m.total_tasks || 0);
                  const taskPct = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{m.name}</span>
                            <span className="text-[10px] text-slate-400">
                              EMP-{String(m.id).padStart(4, "0")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        <div className="truncate max-w-[180px]">{m.email}</div>
                        {m.phone && <div className="text-[10px] text-slate-400">{m.phone}</div>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10.5px]">
                          {m.department_name || "General"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(m.assigned_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                            <span>{completed}/{total}</span>
                            <span>{taskPct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${taskPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedDossierEmployee({
                              employee_id: m.id,
                              employee_name: m.name,
                              employee_email: m.email,
                              employee_phone: m.phone,
                              department_name: m.department_name,
                              role: "employee",
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

      {/* Cross-Functional / Matrix Dotted-Line Reports Section */}
      {matrixMembers.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
              <i className="bi bi-diagram-2"></i>
            </div>
            <h5 className="font-bold text-xs sm:text-sm text-slate-900 mb-0">
              Cross-Functional Matrix Contributors ({matrixMembers.length})
            </h5>
            <span className="text-[10px] text-slate-400 font-normal">
              Staff reporting dotted-line to you for project initiatives
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matrixMembers.map((mat) => (
              <div
                key={mat.matrix_id}
                className="p-3 rounded-2xl bg-purple-50/40 border border-purple-100 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {mat.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs truncate">{mat.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 shrink-0">
                        {mat.role_title || "Dotted-Line"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-0 truncate">{mat.email}</p>
                    {mat.project_title && (
                      <p className="text-[9.5px] text-purple-700 font-semibold mb-0 truncate">
                        Project: {mat.project_title}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedDossierEmployee({
                      employee_id: mat.id,
                      employee_name: mat.name,
                      employee_email: mat.email,
                      department_name: mat.department_name,
                      role: "employee",
                    })
                  }
                  className="p-1.5 rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer shrink-0"
                  title="View Personnel Dossier"
                >
                  <i className="bi bi-person-lines-fill text-xs"></i>
                </button>
              </div>
            ))}
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

export default SupervisorTeam;
