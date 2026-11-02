import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HierarchyMappingItem } from "./HierarchyTableView";
import { SquadGroup } from "./HierarchySquadCardsView";

export interface SupervisorCapacityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  squad: SquadGroup | null;
  onOpenAssignModal: (
    employeeId?: string | number,
    supervisorId?: string | number,
    managerId?: string | number
  ) => void;
  onInitiateReassign?: (employee: HierarchyMappingItem) => void;
  onInitiateUnlink?: (employee: HierarchyMappingItem) => void;
  onUpdateSupervisorCapacity?: (supervisorId: string | number, maxCapacity: number) => Promise<void>;
  onBroadcastSquad?: (squad: SquadGroup) => void;
  onDelegateLead?: (squad: SquadGroup) => void;
}

export const SupervisorCapacityDrawer: React.FC<SupervisorCapacityDrawerProps> = ({
  isOpen,
  onClose,
  squad,
  onOpenAssignModal,
  onInitiateReassign,
  onInitiateUnlink,
  onUpdateSupervisorCapacity,
  onBroadcastSquad,
  onDelegateLead,
}) => {
  const [memberFilter, setMemberFilter] = useState("");

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset filter when opened for a new squad
  useEffect(() => {
    if (isOpen) {
      setMemberFilter("");
    }
  }, [isOpen, squad?.supervisorId]);

  const [customCapacity, setCustomCapacity] = useState<number>(squad?.supervisorMaxCapacity || 8);
  const [isSavingCapacity, setIsSavingCapacity] = useState<boolean>(false);
  const [capacitySavedMsg, setCapacitySavedMsg] = useState<string>("");

  useEffect(() => {
    if (squad) {
      setCustomCapacity(squad.supervisorMaxCapacity || 8);
      setCapacitySavedMsg("");
    }
  }, [squad?.supervisorId, squad?.supervisorMaxCapacity]);

  if (!isOpen || !squad) return null;

  const count = squad.members.length;
  const maxCapacity = customCapacity;
  const capacityPercent = Math.min(100, Math.round((count / maxCapacity) * 100));

  let healthBadge = {
    label: "Optimal Squad",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    barColor: "bg-indigo-500",
    textColor: "text-indigo-600",
    advice: "Optimal squad size. Well-balanced span of control for high-impact 1:1 mentorship and delivery velocity.",
    adviceBg: "bg-indigo-50/70 border-indigo-200/80 text-indigo-900",
    adviceIcon: "bi-shield-check text-indigo-600",
  };

  if (count <= 3) {
    healthBadge = {
      label: "Light Load",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      barColor: "bg-emerald-500",
      textColor: "text-emerald-600",
      advice: `Light workload. This team lead has available capacity to onboard up to ${maxCapacity - count} more direct reports.`,
      adviceBg: "bg-emerald-50/70 border-emerald-200/80 text-emerald-900",
      adviceIcon: "bi-check-circle-fill text-emerald-600",
    };
  } else if (count === 8) {
    healthBadge = {
      label: "Full Capacity",
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      barColor: "bg-amber-500",
      textColor: "text-amber-600",
      advice: `Maximum target capacity reached (${maxCapacity} direct reports). Avoid assigning further staff without rebalancing existing members.`,
      adviceBg: "bg-amber-50/70 border-amber-200/80 text-amber-900",
      adviceIcon: "bi-exclamation-triangle-fill text-amber-600",
    };
  } else if (count > 8) {
    healthBadge = {
      label: "High Span",
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      barColor: "bg-rose-500",
      textColor: "text-rose-600",
      advice: `High span of control (${count} direct reports exceeding ceiling of ${maxCapacity}). High risk of management overhead; consider splitting squad or rebalancing.`,
      adviceBg: "bg-rose-50/70 border-rose-200/80 text-rose-900",
      adviceIcon: "bi-exclamation-octagon-fill text-rose-600",
    };
  }

  const query = memberFilter.toLowerCase().trim();
  const filteredMembers = query
    ? squad.members.filter(
        (m) =>
          m.employee_name.toLowerCase().includes(query) ||
          m.employee_email.toLowerCase().includes(query) ||
          String(m.employee_id).includes(query)
      )
    : squad.members;

  return createPortal(
    <div
      className="fixed inset-0 z-[11000] bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        <div
          className="relative w-full max-w-2xl sm:max-w-[720px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col pointer-events-auto max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Purple/Violet Wave Background */}
          <div className="relative px-5 py-3.5 bg-white flex items-center justify-between border-b border-slate-200/80 overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-[380px] sm:w-[480px] h-full pointer-events-none overflow-hidden z-0">
              <svg
                viewBox="0 0 500 74"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <mask id="squadWaveFadeMask">
                    <linearGradient id="squadWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="25%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#squadWaveFadeGrad)" />
                  </mask>

                  <linearGradient id="squadWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.25" />
                    <stop offset="30%" stopColor="#DDD6FE" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#EDE9FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0.7" />
                  </linearGradient>

                  <linearGradient id="squadWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C4B5FD" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.85" />
                    <stop offset="85%" stopColor="#EDE9FE" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="squadWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#FAF5FF" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.5" />
                  </linearGradient>
                </defs>

                <g mask="url(#squadWaveFadeMask)">
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#squadWaveGrad1)"
                  />
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#squadWaveGrad2)"
                  />
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#squadWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left Header Title & Icon */}
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-xl shadow-md font-bold">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  Supervisor Squad Inspector
                </h3>
                <p className="text-xs text-slate-500 font-normal leading-none mt-0.5">
                  Capacity health &amp; direct report telemetry
                </p>
              </div>
            </div>

            {/* Right Close Button */}
            <div className="relative z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-slate-200/80 bg-white/90 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50 [scrollbar-width:thin]">
            
            {/* Card 1: Supervisor Profile Banner */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  {squad.supervisorName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <h4 className="text-base font-bold text-slate-900 truncate mb-0 leading-tight">
                      {squad.supervisorName}
                    </h4>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                      Team Lead
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
                    <span className="font-mono text-slate-600">
                      ID: SUP-{String(squad.supervisorId).padStart(4, "0")}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white text-slate-700 font-medium border border-slate-200 shadow-2xs">
                      <i className="bi bi-building text-slate-400 text-xs"></i>
                      <span>{squad.departmentName || "Accounts"}</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium border border-purple-100 shadow-2xs">
                      <i className="bi bi-person-badge text-purple-500 text-xs"></i>
                      <span>Manager: {squad.managerName || "Sarah Jenkins"}</span>
                    </span>
                  </div>

                  {squad.actingSupervisorName && (
                    <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200/90 flex items-center gap-2 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <div className="text-[11px] text-amber-900 leading-tight">
                        <span className="font-bold">Acting Lead:</span> {squad.actingSupervisorName}{" "}
                        {squad.delegationStartDate && squad.delegationEndDate && (
                          <span className="text-[10px] text-amber-700">
                            ({squad.delegationStartDate.slice(0, 10)} to {squad.delegationEndDate.slice(0, 10)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Capacity Assessment HUD */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0">
                  Workload Telemetry
                </h5>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${healthBadge.bg}`}>
                  {healthBadge.label}
                </span>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <span className="text-lg font-bold text-slate-900 block leading-tight">
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-500">Active Reports</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <span className="text-lg font-bold text-slate-900 block leading-tight">
                    {maxCapacity}
                  </span>
                  <span className="text-[10px] text-slate-500">Target Ceiling</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <span className={`text-lg font-bold block leading-tight ${healthBadge.textColor}`}>
                    {capacityPercent}%
                  </span>
                  <span className="text-[10px] text-slate-500">Span Load</span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>Capacity Utilization</span>
                  <span>{count} of {maxCapacity} slots filled</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${healthBadge.barColor} transition-all duration-300 rounded-full`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Configurable Span Target Control */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">Supervisor Target Ceiling</span>
                  <span className="text-[10px] text-slate-400 block">Set max allowable direct reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setCustomCapacity((prev) => Math.max(1, prev - 1))}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer transition-colors"
                      title="Decrease Ceiling"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800 font-mono">
                      {customCapacity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomCapacity((prev) => Math.min(50, prev + 1))}
                      className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold text-xs cursor-pointer transition-colors"
                      title="Increase Ceiling"
                    >
                      +
                    </button>
                  </div>
                  {customCapacity !== (squad.supervisorMaxCapacity || 8) && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (onUpdateSupervisorCapacity) {
                          try {
                            setIsSavingCapacity(true);
                            await onUpdateSupervisorCapacity(squad.supervisorId, customCapacity);
                            setCapacitySavedMsg("Capacity updated!");
                            setTimeout(() => setCapacitySavedMsg(""), 3000);
                          } finally {
                            setIsSavingCapacity(false);
                          }
                        }
                      }}
                      disabled={isSavingCapacity}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSavingCapacity ? "..." : "Save"}
                    </button>
                  )}
                </div>
              </div>
              {capacitySavedMsg && (
                <p className="text-[10px] text-emerald-600 font-semibold mb-0 flex items-center gap-1">
                  <i className="bi bi-check-circle-fill text-[9.5px]"></i> {capacitySavedMsg}
                </p>
              )}

              {/* Span Guidance Callout */}
              <div className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs ${healthBadge.adviceBg}`}>
                <i className={`bi ${healthBadge.adviceIcon} text-base shrink-0 mt-0.5`}></i>
                <p className="mb-0 leading-relaxed text-[11px]">
                  {healthBadge.advice}
                </p>
              </div>
            </div>

            {/* Direct Reports Squad Roster */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-0.5">
                    Squad Members ({squad.members.length})
                  </h5>
                  <p className="text-[10px] text-slate-400 mb-0">
                    Personnel assigned to this team lead
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAssignModal(undefined, squad.supervisorId, squad.managerId)}
                  className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <i className="bi bi-person-plus-fill text-[10px]"></i>
                  <span>Add Member</span>
                </button>
              </div>

              {/* Member Search Bar */}
              {squad.members.length > 2 && (
                <div className="relative">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    placeholder="Search squad roster..."
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:outline-none transition-all placeholder:text-slate-400"
                  />
                  {memberFilter && (
                    <button
                      type="button"
                      onClick={() => setMemberFilter("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      <i className="bi bi-x-circle-fill"></i>
                    </button>
                  )}
                </div>
              )}

              {/* Roster List */}
              {filteredMembers.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">
                    {memberFilter
                      ? `No squad members match "${memberFilter}"`
                      : "No direct reports assigned to this squad yet."}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenAssignModal(undefined, squad.supervisorId, squad.managerId)}
                    className="px-3 py-1 rounded-md bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 cursor-pointer shadow-2xs"
                  >
                    Assign First Member
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={`drawer-member-${member.id}`}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {member.employee_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {member.employee_name}
                            </span>
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              EMP-{String(member.employee_id).padStart(4, "0")}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {member.employee_email}
                          </span>
                        </div>
                      </div>

                      {/* Member Action Triggers */}
                      <div className="flex items-center gap-1 shrink-0">
                        {onInitiateReassign && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onInitiateReassign(member);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
                            title="Reassign to another supervisor"
                          >
                            <i className="bi bi-arrow-left-right text-xs"></i>
                          </button>
                        )}
                        {onInitiateUnlink && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onInitiateUnlink(member);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                            title="Unlink from this squad"
                          >
                            <i className="bi bi-x-circle text-xs"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drawer Sticky Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAssignModal(undefined, squad.supervisorId, squad.managerId);
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add Member to Squad</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

