import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

export interface SquadMemberItem {
  membership_id: number | string;
  project_id: number | string;
  user_id: number | string;
  role_tag: string;
  allocation_percentage: number;
  assigned_at: string;
  name: string;
  email: string;
  role: string;
  image_url?: string;
  department_name?: string;
  department_code?: string;
  project_tasks_count: number;
  completed_project_tasks_count: number;
  total_active_tasks: number;
  total_active_projects: number;
  capacity_status: "optimal" | "near_capacity" | "overloaded";
  capacity_warning?: string | null;
}

export interface CandidateUser {
  id: number | string;
  name: string;
  email: string;
  role: string;
  image_url?: string;
  department_id?: number | string;
  department_name?: string;
  department_code?: string;
  total_active_tasks: number;
  total_active_projects: number;
  capacity_status: "optimal" | "near_capacity" | "overloaded";
  capacity_warning?: string | null;
}

interface ProjectSquadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: number | string;
    title: string;
    department_name?: string;
    department_id?: number | string;
    lead_supervisor_id?: number | string;
    supervisor_name?: string;
  } | null;
  onSquadChanged?: () => void;
}

const ROLE_TAGS = [
  { name: "Tech Lead", icon: "bi-star-fill", color: "text-purple-600 bg-purple-50 border-purple-200" },
  { name: "Frontend", icon: "bi-layout-text-window", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { name: "Backend", icon: "bi-hdd-network-fill", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { name: "QA", icon: "bi-bug-fill", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { name: "SME", icon: "bi-lightbulb-fill", color: "text-rose-600 bg-rose-50 border-rose-200" },
  { name: "Contributor", icon: "bi-person-badge-fill", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
];

export const ProjectSquadDrawer: React.FC<ProjectSquadDrawerProps> = ({
  isOpen,
  onClose,
  project,
  onSquadChanged,
}) => {
  const [members, setMembers] = useState<SquadMemberItem[]>([]);
  const [availableCandidates, setAvailableCandidates] = useState<CandidateUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [allocating, setAllocating] = useState<boolean>(false);
  const [removingId, setRemovingId] = useState<number | string | null>(null);
  const [msg, setMsg] = useState<{ type: string; text: string }>({ type: "", text: "" });

  // Filtering & Allocation Form State
  const [filterDepartmentOnly, setFilterDepartmentOnly] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleTag, setSelectedRoleTag] = useState<string>("Contributor");
  const [allocationPct, setAllocationPct] = useState<number>(100);

  const fetchSquadData = async () => {
    if (!project?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/projects/${project.id}/members`);
      if (res.data.status) {
        setMembers(res.data.members || []);
        const candidates: CandidateUser[] = res.data.available_users || [];
        setAvailableCandidates(candidates);
        if (candidates.length > 0) {
          setSelectedUserId(String(candidates[0].id));
        } else {
          setSelectedUserId("");
        }
      }
    } catch (err: any) {
      console.error("Failed to load project squad members:", err);
      setMsg({ type: "danger", text: "Failed to load squad allocations" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project?.id) {
      fetchSquadData();
      setMsg({ type: "", text: "" });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, project?.id]);

  if (!isOpen || !project) return null;

  // Filter available candidates if department-only toggle is active
  const filteredCandidates = filterDepartmentOnly && project.department_name
    ? availableCandidates.filter((c) => c.department_name === project.department_name)
    : availableCandidates;

  const selectedCandidate = availableCandidates.find((c) => String(c.id) === String(selectedUserId));

  // Compute roster telemetry metrics
  const totalAllocatedPct = members.reduce((sum, m) => sum + (m.allocation_percentage || 0), 0);
  const overloadedCount = members.filter((m) => m.capacity_status === "overloaded").length;
  const nearCapacityCount = members.filter((m) => m.capacity_status === "near_capacity").length;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setMsg({ type: "danger", text: "Please select a candidate to allocate" });
      return;
    }

    try {
      setAllocating(true);
      setMsg({ type: "", text: "" });
      const res = await api.post(`/api/admin/projects/${project.id}/members`, {
        user_id: selectedUserId,
        role_tag: selectedRoleTag,
        allocation_percentage: allocationPct,
      });

      if (res.data.status) {
        setMsg({ type: "success", text: "Personnel successfully allocated to squad!" });
        await fetchSquadData();
        if (onSquadChanged) onSquadChanged();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to allocate squad member",
      });
    } finally {
      setAllocating(false);
    }
  };

  const handleRemoveMember = async (membershipId: number | string, name: string) => {
    if (!window.confirm(`Unassign ${name} from this project's squad?`)) return;

    try {
      setRemovingId(membershipId);
      const res = await api.delete(`/api/admin/projects/${project.id}/members/${membershipId}`);
      if (res.data.status) {
        setMsg({ type: "success", text: `${name} unassigned from squad` });
        await fetchSquadData();
        if (onSquadChanged) onSquadChanged();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to remove squad member",
      });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200/90 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0 border-b border-indigo-900/40">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRJ-{String(project.id).padStart(4, "0")}
              </span>
              {project.department_name && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/90 border border-white/15">
                  🏢 {project.department_name}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                👥 {members.length} Squad Members
              </span>
            </div>
            <h3 className="text-base font-bold text-white truncate mb-0">
              {project.title}
            </h3>
            <p className="text-[11px] text-slate-300 mb-0">
              Multi-Staff Resource Allocation & Squad Roster Governance
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Close Drawer"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Telemetry Quick Bar */}
        <div className="px-5 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-600 font-medium">
              Capacity: <strong className="text-indigo-900">{totalAllocatedPct}% Total Cap</strong>
            </span>
            {overloadedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center gap-1 border border-rose-200">
                <i className="bi bi-exclamation-octagon-fill"></i>
                {overloadedCount} Overloaded
              </span>
            )}
            {nearCapacityCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 border border-amber-200">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {nearCapacityCount} Near Limit
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">
            Lead: <strong>{project.supervisor_name || "Unassigned"}</strong>
          </span>
        </div>

        {/* Alert Notifications */}
        {msg.text && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
              msg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <i
                className={`bi ${
                  msg.type === "success" ? "bi-check-circle-fill text-emerald-600" : "bi-exclamation-triangle-fill text-rose-600"
                }`}
              ></i>
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

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Allocate New Member Form */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-0 flex items-center gap-1.5">
                <i className="bi bi-person-plus-fill text-indigo-600"></i>
                <span>Allocate Personnel to Squad</span>
              </h4>
              {project.department_name && (
                <button
                  type="button"
                  onClick={() => setFilterDepartmentOnly(!filterDepartmentOnly)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                    filterDepartmentOnly
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {filterDepartmentOnly ? `✓ ${project.department_name} Only` : `All Departments`}
                </button>
              )}
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              {/* Select Candidate */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Team Member
                </label>
                {filteredCandidates.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-white p-2.5 rounded-lg border border-slate-200">
                    No candidates available for this filter.
                  </p>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {filteredCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role} • {c.department_name || "General"}) — {c.total_active_tasks} tasks {c.capacity_status === "overloaded" ? "⚠️ Overloaded" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Workload / Capacity Conflict Warning */}
              {selectedCandidate?.capacity_warning && (
                <div
                  className={`p-2.5 rounded-lg text-xs border flex items-start gap-2 ${
                    selectedCandidate.capacity_status === "overloaded"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  <i
                    className={`bi ${
                      selectedCandidate.capacity_status === "overloaded"
                        ? "bi-exclamation-octagon-fill text-rose-600"
                        : "bi-exclamation-triangle-fill text-amber-600"
                    } mt-0.5`}
                  ></i>
                  <div className="min-w-0">
                    <strong className="block font-bold">Capacity Conflict Warning:</strong>
                    <span>{selectedCandidate.capacity_warning}</span>
                  </div>
                </div>
              )}

              {/* Role Tagging Selection with visual chips */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Initiative Role Tag
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {ROLE_TAGS.map((tag) => (
                    <button
                      key={tag.name}
                      type="button"
                      onClick={() => setSelectedRoleTag(tag.name)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedRoleTag === tag.name
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <i className={`bi ${tag.icon} text-[11px]`}></i>
                      <span>{tag.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Allocation Percentage Slider & Indicator */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Workload Allocation</span>
                  <span className="font-bold text-indigo-700">{allocationPct}% Capacity</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={allocationPct}
                  onChange={(e) => setAllocationPct(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                  <span>10% (Part-time)</span>
                  <span>50% (Half-time)</span>
                  <span>100% (Dedicated)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={allocating || filteredCandidates.length === 0}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {allocating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Allocating...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-plus-lg"></i>
                    <span>Confirm Squad Allocation</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Section 2: Current Squad Roster */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-0 flex items-center gap-1.5">
                <span>Assigned Squad Roster</span>
                <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  {members.length}
                </span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Sorted by assignment date
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-xs">Loading squad roster...</span>
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <i className="bi bi-people text-2xl text-slate-400 mb-1 block"></i>
                <p className="text-xs font-bold text-slate-700 mb-0.5">No Squad Members Allocated</p>
                <p className="text-[11px] text-slate-400 mb-0">Use the form above to assign engineers and technical leads.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {members.map((m) => {
                  const roleConfig = ROLE_TAGS.find((r) => r.name === m.role_tag) || {
                    icon: "bi-person-badge",
                    color: "text-slate-700 bg-slate-100 border-slate-200",
                  };

                  return (
                    <div
                      key={m.membership_id}
                      className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {m.image_url ? (
                            <img
                              src={`http://localhost:5000/images/${m.image_url}`}
                              alt={m.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {m.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h5 className="font-bold text-xs text-slate-900 truncate mb-0">
                                {m.name}
                              </h5>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${roleConfig.color}`}
                              >
                                <i className={`bi ${roleConfig.icon}`}></i>
                                <span>{m.role_tag}</span>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mb-0">
                              {m.email} • {m.department_name || "General"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.membership_id, m.name)}
                          disabled={removingId === m.membership_id}
                          className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                          title="Unassign member from squad"
                        >
                          {removingId === m.membership_id ? (
                            <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <i className="bi bi-trash3 text-xs"></i>
                          )}
                        </button>
                      </div>

                      {/* Capacity progress meter */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">
                            Workload: <strong className="text-slate-800">{m.completed_project_tasks_count}/{m.project_tasks_count} tasks</strong>
                          </span>
                          <span className="font-bold text-slate-700">{m.allocation_percentage}% Allocation</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              m.capacity_status === "overloaded"
                                ? "bg-rose-500"
                                : m.capacity_status === "near_capacity"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(m.allocation_percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Workload Warning message if overloaded */}
                      {m.capacity_warning && (
                        <div className="mt-2 text-[9.5px] text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200/60 flex items-center gap-1.5">
                          <i className="bi bi-exclamation-octagon-fill shrink-0"></i>
                          <span>{m.capacity_warning}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Multi-Staff Resource Allocation Active
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
