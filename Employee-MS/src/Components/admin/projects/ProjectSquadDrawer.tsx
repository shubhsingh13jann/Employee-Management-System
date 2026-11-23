import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
    supervisor_email?: string;
    status?: string;
    priority?: string;
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
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
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

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="w-full max-w-[880px] max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Wave Background matching 360 Dossier Modal */}
          <div className="relative px-3.5 sm:px-4 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
            {/* Top-Right Fluid Pastel Wave Background */}
            <div className="absolute top-0 right-0 w-[360px] sm:w-[460px] h-full pointer-events-none overflow-hidden z-0">
              <svg
                viewBox="0 0 500 74"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <mask id="squadModalWaveFadeMask">
                    <linearGradient id="squadModalWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="18%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#squadModalWaveFadeGrad)" />
                  </mask>

                  <linearGradient id="squadModalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                  </linearGradient>

                  <linearGradient id="squadModalWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="squadModalWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <g mask="url(#squadModalWaveFadeMask)">
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#squadModalWaveGrad1)"
                  />
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#squadModalWaveGrad2)"
                  />
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#squadModalWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left: Squircle Briefcase Icon + Project Information */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-indigo-500/20 shrink-0 border border-white/20">
                <i className="bi bi-briefcase-fill text-amber-300"></i>
              </div>

              <div className="min-w-0">
                {/* Project Title + PRJ-ID Pill */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[13.5px] sm:text-[14.5px] text-slate-900 mb-0 tracking-tight leading-tight truncate">
                    {project.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                    PRJ-{String(project.id).padStart(4, "0")}
                  </span>
                </div>

                {/* Subtitle Line with Department & Lead Supervisor */}
                <div className="text-[10.5px] sm:text-[11px] text-slate-400 mb-1 font-normal leading-tight truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {project.department_name && (
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <i className="bi bi-building text-[9.5px] text-indigo-500"></i>
                      <span>{project.department_name}</span>
                    </span>
                  )}
                  {project.supervisor_name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <i className="bi bi-person text-[9.5px] text-emerald-500"></i>
                        <span>Lead: {project.supervisor_name}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Meta Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold capitalize bg-emerald-50/80 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                    <span>{project.status || "Active"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold bg-indigo-50/80 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                    <i className="bi bi-people-fill text-[9px] text-indigo-600"></i>
                    <span>{members.length} Squad Members</span>
                  </div>
                  {project.priority && (
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold uppercase shadow-2xs border ${
                        project.priority === "critical"
                          ? "bg-rose-50/80 text-rose-700 border-rose-200"
                          : project.priority === "high"
                          ? "bg-amber-50/80 text-amber-700 border-amber-200"
                          : "bg-indigo-50/60 text-indigo-700 border-indigo-100"
                      }`}
                    >
                      <span>{project.priority}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs shrink-0 relative z-10"
              title="Close Squad Roster"
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-xs"></i>
            </button>
          </div>

          {/* Executive Telemetry Bar / HUD Grid matching 360 Dossier Modal */}
          <div className="bg-slate-50/60 border-b border-slate-200/80 px-3.5 sm:px-4 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
            {/* 1. Capacity Allocation */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Total Squad Cap</span>
                <span className="font-bold text-slate-800 text-[11px]">{totalAllocatedPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1 border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    totalAllocatedPct > 100
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600"
                      : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                  }`}
                  style={{ width: `${Math.min(totalAllocatedPct, 100)}%` }}
                ></div>
              </div>
              <div className="text-[9.5px] text-slate-400">
                {members.length} personnel allocated
              </div>
            </div>

            {/* 2. Capacity Governance */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Governance Band</span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {overloadedCount > 0 ? (
                    <span className="text-rose-600">{overloadedCount} Alert</span>
                  ) : nearCapacityCount > 0 ? (
                    <span className="text-amber-600">{nearCapacityCount} Warning</span>
                  ) : (
                    <span className="text-emerald-600">Optimal</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {overloadedCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[9px] border border-rose-200/80 flex items-center gap-1">
                    <i className="bi bi-exclamation-octagon-fill text-[8.5px]"></i>
                    <span>{overloadedCount} Overloaded</span>
                  </span>
                ) : nearCapacityCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-[9px] border border-amber-200/80 flex items-center gap-1">
                    <i className="bi bi-exclamation-triangle-fill text-[8.5px]"></i>
                    <span>{nearCapacityCount} Near Limit</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-200/80 flex items-center gap-1">
                    <i className="bi bi-check-circle-fill text-[8.5px]"></i>
                    <span>All Within Band</span>
                  </span>
                )}
              </div>
            </div>

            {/* 3. Squad Headcount */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span>Squad Headcount</span>
                <i className="bi bi-people text-slate-400 text-xs"></i>
              </div>
              <div className="text-[11.5px] font-bold text-slate-800">
                {members.length} Active Staff
              </div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">
                Cross-functional allocation
              </div>
            </div>

            {/* 4. Designated Lead Supervisor */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span>Designated Lead</span>
                <i className="bi bi-person-check text-slate-400 text-xs"></i>
              </div>
              <div className="text-[11.5px] font-bold text-slate-800 truncate">
                {project.supervisor_name || "Unassigned"}
              </div>
              <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                {project.department_name || "General"}
              </div>
            </div>
          </div>

          {/* Alert Notifications */}
          {msg.text && (
            <div
              className={`mx-4 mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in shadow-2xs ${
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

          {/* Modal Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 bg-slate-50/40 space-y-3.5">
            {/* Section 1: Allocate Personnel to Squad Executive Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden">
              {/* Top-Right Soft Wave Background Accent */}
              <div className="absolute top-0 right-0 w-[280px] sm:w-[380px] h-[95px] pointer-events-none overflow-hidden z-0 opacity-75">
                <svg viewBox="0 0 400 95" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <defs>
                    <linearGradient id="allocWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.1" />
                      <stop offset="40%" stopColor="#DDD6FE" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.75" />
                    </linearGradient>
                    <linearGradient id="allocWaveGrad2" x1="20%" y1="0%" x2="100%" y2="80%">
                      <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                      <stop offset="60%" stopColor="#C7D2FE" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>
                  <path d="M0,45 C110,15 220,75 400,25 L400,0 L0,0 Z" fill="url(#allocWaveGrad1)" />
                  <path d="M40,25 C140,5 260,55 400,10 L400,0 L40,0 Z" fill="url(#allocWaveGrad2)" opacity="0.6" />
                </svg>
              </div>

              {/* Card Header */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-indigo-600 border border-purple-100 flex items-center justify-center text-base sm:text-lg shadow-2xs shrink-0">
                    <i className="bi bi-person-plus-fill text-indigo-600"></i>
                  </div>
                  <div>
                    <h4 className="text-[13px] sm:text-[14px] font-bold text-slate-900 mb-0 tracking-tight leading-tight">
                      Allocate Personnel to Squad
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mb-0">
                      Assign team member, specify initiative role tag & set capacity percentage
                    </p>
                  </div>
                </div>

                {project.department_name && (
                  <button
                    type="button"
                    onClick={() => setFilterDepartmentOnly(!filterDepartmentOnly)}
                    className={`text-[10.5px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer shadow-2xs shrink-0 ${
                      filterDepartmentOnly
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50"
                    }`}
                  >
                    {filterDepartmentOnly ? `✓ ${project.department_name} Only` : `All Departments`}
                  </button>
                )}
              </div>

              <form onSubmit={handleAddMember} className="space-y-3 relative z-10">
                {/* Select Candidate */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Select Team Member
                  </label>
                  {filteredCandidates.length === 0 ? (
                    <p className="text-xs text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      No candidates available for this filter.
                    </p>
                  ) : (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all"
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
                    className={`p-2.5 rounded-xl text-xs border flex items-start gap-2 shadow-2xs ${
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
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Initiative Role Tag
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                    {ROLE_TAGS.map((tag) => (
                      <button
                        key={tag.name}
                        type="button"
                        onClick={() => setSelectedRoleTag(tag.name)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          selectedRoleTag === tag.name
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-slate-50/70 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <i className={`bi ${tag.icon} text-[10.5px]`}></i>
                        <span>{tag.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allocation Percentage Slider & Indicator */}
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Workload Allocation</span>
                    <span className="font-bold text-indigo-700 text-xs px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/80 shadow-2xs">
                      {allocationPct}% Capacity
                    </span>
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
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium">
                    <span>10% (Part-time)</span>
                    <span>50% (Half-time)</span>
                    <span>100% (Dedicated)</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={allocating || filteredCandidates.length === 0}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 disabled:opacity-50"
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
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <h4 className="text-[12px] font-bold text-slate-900 mb-0 tracking-tight flex items-center gap-1.5">
                    <span>Assigned Squad Roster</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-[9.5px] font-bold shadow-2xs">
                      {members.length}
                    </span>
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Sorted by assignment date
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span className="text-xs">Loading squad roster...</span>
                </div>
              ) : members.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-2 text-base">
                    <i className="bi bi-people"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-0.5">No Squad Members Allocated</p>
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
                        className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 shadow-2xs hover:border-slate-300 hover:bg-slate-50/90 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {m.image_url ? (
                              <img
                                src={`http://localhost:5000/images/${m.image_url}`}
                                alt={m.name}
                                className="w-7.5 h-7.5 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-7.5 h-7.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-white/20">
                                {m.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="font-bold text-[11.5px] text-slate-900 truncate mb-0 leading-tight">
                                  {m.name}
                                </h5>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold border flex items-center gap-1 shadow-2xs ${roleConfig.color}`}
                                >
                                  <i className={`bi ${roleConfig.icon} text-[8.5px]`}></i>
                                  <span>{m.role_tag}</span>
                                </span>
                              </div>
                              <p className="text-[9.5px] text-slate-400 font-mono truncate mb-0 mt-0.5">
                                {m.email} • {m.department_name || "General"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.membership_id, m.name)}
                            disabled={removingId === m.membership_id}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer shrink-0 border border-transparent hover:border-rose-200"
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
                        <div className="pt-2 mt-2 border-t border-slate-200/70 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-medium">
                              Workload: <strong className="text-slate-800">{m.completed_project_tasks_count}/{m.project_tasks_count} tasks</strong>
                            </span>
                            <span className="font-bold text-indigo-700 text-[10px]">{m.allocation_percentage}% Allocation</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden">
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
                          <div className="mt-2 text-[9.5px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/70 flex items-center gap-1.5">
                            <i className="bi bi-exclamation-octagon-fill shrink-0 text-rose-600"></i>
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

          {/* Modal Footer */}
          <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Multi-Staff Resource Allocation Active</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
