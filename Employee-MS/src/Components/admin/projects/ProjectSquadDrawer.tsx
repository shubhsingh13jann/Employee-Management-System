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
    lead_supervisor_id?: number | string;
    supervisor_name?: string;
  } | null;
  onSquadChanged?: () => void;
}

const ROLE_TAGS = ["Tech Lead", "Frontend", "Backend", "QA", "SME", "Contributor"];

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

  // Form State
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
        setAvailableCandidates(res.data.available_users || []);
        if (res.data.available_users?.length > 0) {
          setSelectedUserId(String(res.data.available_users[0].id));
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

  const selectedCandidate = availableCandidates.find((c) => String(c.id) === String(selectedUserId));

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
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
              <i className="bi bi-person-plus-fill text-indigo-600"></i>
              <span>Allocate Personnel to Squad</span>
            </h4>

            <form onSubmit={handleAddMember} className="space-y-3">
              {/* Select Candidate */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Select Team Member
                </label>
                {availableCandidates.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-white p-2.5 rounded-lg border border-slate-200">
                    All department personnel are currently allocated to this squad.
                  </p>
                ) : (
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {availableCandidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.role}) — {c.total_active_tasks} active tasks {c.capacity_status === "overloaded" ? "⚠️ Overloaded" : ""}
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

              {/* Role Tagging Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Initiative Role Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedRoleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedRoleTag === tag
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allocation Percentage */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Workload Allocation</span>
                  <span className="font-bold text-indigo-700">{allocationPct}% Cap</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="10"
                  value={allocationPct}
                  onChange={(e) => setAllocationPct(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={allocating || availableCandidates.length === 0}
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
              <h4 className="text-xs font-bold text-slate-800 mb-0">
                Assigned Squad Roster ({members.length})
              </h4>
              <span className="text-[11px] text-slate-400">
                Ordered by allocation date
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
                {members.map((m) => (
                  <div
                    key={m.membership_id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-bold text-xs text-slate-900 truncate mb-0">
                              {m.name}
                            </h5>
                            <span
                              className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                                m.role_tag === "Tech Lead"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : m.role_tag === "Frontend"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : m.role_tag === "Backend"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : m.role_tag === "QA"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {m.role_tag}
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

                    {/* Allocation & Workload Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        Tasks in Initiative: <strong className="text-slate-800">{m.completed_project_tasks_count}/{m.project_tasks_count}</strong>
                      </span>
                      <span>
                        Allocation: <strong className="text-indigo-600">{m.allocation_percentage}%</strong>
                      </span>
                      <span
                        className={`font-semibold ${
                          m.capacity_status === "overloaded"
                            ? "text-rose-600"
                            : m.capacity_status === "near_capacity"
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {m.capacity_status === "overloaded"
                          ? "⚠️ Overloaded"
                          : m.capacity_status === "near_capacity"
                          ? "Moderate"
                          : "Optimal"}
                      </span>
                    </div>

                    {/* Workload Warning message if overloaded */}
                    {m.capacity_warning && (
                      <div className="mt-1.5 text-[9.5px] text-rose-700 bg-rose-50/80 px-2 py-0.5 rounded border border-rose-200/60">
                        {m.capacity_warning}
                      </div>
                    )}
                  </div>
                ))}
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
