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
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-2 sm:p-3 pointer-events-none">
        <div
          className="relative w-full max-w-2xl sm:max-w-[750px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col pointer-events-auto max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Purple/Violet Wave Background */}
          <div className="relative px-3.5 py-2 sm:px-4 sm:py-2 bg-white flex items-center justify-between border-b border-slate-200/80 overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-[300px] sm:w-[380px] h-full pointer-events-none overflow-hidden z-0">
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
            <div className="relative z-10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-sm shadow-xs font-bold">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="h-5 w-px bg-slate-200"></div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight leading-snug mb-0">
                  Supervisor Squad Inspector
                </h3>
                <p className="text-[10px] text-slate-500 font-normal leading-none mt-0.5 mb-0">
                  Capacity health &amp; direct report telemetry
                </p>
              </div>
            </div>

            {/* Right Close Button */}
            <div className="relative z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-6 h-6 rounded-full border border-slate-200/80 bg-white/90 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <i className="bi bi-x-lg text-[9px]"></i>
              </button>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-2.5 pt-1.5 pb-2 space-y-1.5 bg-slate-50/50 [scrollbar-width:thin]">
            
            {/* Card 1: Supervisor Profile Banner */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-2.5 px-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {squad.supervisorName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate mb-0 leading-tight">
                      {squad.supervisorName}
                    </h4>
                    <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                      Team Lead
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium flex-wrap">
                    <span className="font-mono text-slate-600">
                      ID: SUP-{String(squad.supervisorId).padStart(4, "0")}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-slate-700 font-medium border border-slate-200 shadow-2xs">
                      <i className="bi bi-building text-slate-400 text-[9.5px]"></i>
                      <span>{squad.departmentName || "Accounts"}</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-100 shadow-2xs">
                      <i className="bi bi-person-badge text-purple-500 text-[9.5px]"></i>
                      <span>Manager: {squad.managerName || "Sarah Jenkins"}</span>
                    </span>
                  </div>

                  {squad.actingSupervisorName && (
                    <div className="mt-1.5 p-1 rounded-lg bg-amber-50 border border-amber-200/90 flex items-center gap-2 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <div className="text-[9.5px] text-amber-900 leading-tight">
                        <span className="font-bold">Acting Lead:</span> {squad.actingSupervisorName}{" "}
                        {squad.delegationStartDate && squad.delegationEndDate && (
                          <span className="text-[9px] text-amber-700">
                            ({squad.delegationStartDate.slice(0, 10)} to {squad.delegationEndDate.slice(0, 10)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Workload Telemetry HUD */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shadow-2xs">
                  <i className="bi bi-bar-chart-fill"></i>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-0">
                  Workload Telemetry
                </h4>
                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${healthBadge.bg}`}>
                  {healthBadge.label}
                </span>
                {capacitySavedMsg && (
                  <span className="text-[10px] text-emerald-600 font-semibold ml-auto flex items-center gap-1 animate-in fade-in">
                    <i className="bi bi-check-circle-fill text-[9px]"></i>
                    {capacitySavedMsg}
                  </span>
                )}
              </div>

              {/* Row with Metrics + Capacity Bar on the Left, and Supervisor Target Ceiling on the Right */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-0.5">
                {/* Left Column: 3 Metric Cards + Capacity Utilization Progress Bar (covers till Span Load area) */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* 3 Metric Cards Row with Icons on the Left spanning both rows */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Metric 1: Active Reports */}
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/70 flex items-center gap-2.5 sm:gap-3 shadow-2xs">
                      <i className="bi bi-file-earmark-text text-indigo-600 text-[32px] sm:text-[34px] leading-none shrink-0 flex items-center justify-center"></i>
                      <div className="min-w-0 flex flex-col justify-center">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                          {count}
                        </span>
                        <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium leading-none mt-1 whitespace-nowrap">
                          Active Reports
                        </span>
                      </div>
                    </div>

                    {/* Metric 2: Target Ceiling */}
                    <div className="bg-purple-50/50 rounded-xl p-2.5 border border-purple-100 flex items-center gap-2.5 sm:gap-3 shadow-2xs">
                      <i className="bi bi-bullseye text-purple-600 text-[32px] sm:text-[34px] leading-none shrink-0 flex items-center justify-center"></i>
                      <div className="min-w-0 flex flex-col justify-center">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                          {maxCapacity}
                        </span>
                        <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium leading-none mt-1 whitespace-nowrap">
                          Target Ceiling
                        </span>
                      </div>
                    </div>

                    {/* Metric 3: Span Load */}
                    <div className="bg-emerald-50/50 rounded-xl p-2.5 border border-emerald-100 flex items-center gap-2.5 sm:gap-3 shadow-2xs">
                      <i className="bi bi-layers-fill text-emerald-600 text-[32px] sm:text-[34px] leading-none shrink-0 flex items-center justify-center"></i>
                      <div className="min-w-0 flex flex-col justify-center">
                        <span className="text-sm sm:text-base font-extrabold text-emerald-600 leading-none">
                          {capacityPercent}%
                        </span>
                        <span className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium leading-none mt-1 whitespace-nowrap">
                          Span Load
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Utilization Progress Bar - Stretches ONLY across the 3 metric cards (till Span Load area) */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-[10.5px] font-semibold text-slate-700">
                      <span>Capacity Utilization</span>
                      <span className="text-slate-500 font-medium">
                        {count} of {maxCapacity} slots filled ({capacityPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Supervisor Target Ceiling Control */}
                <div className="sm:w-44 flex flex-col items-start sm:items-end justify-center pl-0 sm:pl-2 shrink-0 pt-0.5">
                  <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                    Supervisor Target Ceiling
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Set max allowable direct reports
                  </span>

                  <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs w-32">
                    <button
                      type="button"
                      onClick={async () => {
                        const newCap = Math.max(1, customCapacity - 1);
                        setCustomCapacity(newCap);
                        if (onUpdateSupervisorCapacity) {
                          try {
                            setIsSavingCapacity(true);
                            await onUpdateSupervisorCapacity(squad.supervisorId, newCap);
                            setCapacitySavedMsg("Ceiling updated");
                            setTimeout(() => setCapacitySavedMsg(""), 2000);
                          } catch {
                            // ignore
                          } finally {
                            setIsSavingCapacity(false);
                          }
                        }
                      }}
                      disabled={isSavingCapacity}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                      title="Decrease Ceiling"
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <span className="font-bold text-xs text-slate-900 font-mono">
                      {customCapacity}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const newCap = Math.min(50, customCapacity + 1);
                        setCustomCapacity(newCap);
                        if (onUpdateSupervisorCapacity) {
                          try {
                            setIsSavingCapacity(true);
                            await onUpdateSupervisorCapacity(squad.supervisorId, newCap);
                            setCapacitySavedMsg("Ceiling updated");
                            setTimeout(() => setCapacitySavedMsg(""), 2000);
                          } catch {
                            // ignore
                          } finally {
                            setIsSavingCapacity(false);
                          }
                        }
                      }}
                      disabled={isSavingCapacity}
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                      title="Increase Ceiling"
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Guidance Advice Callout Box */}
              <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-[11px] ${healthBadge.adviceBg || "bg-purple-50/60 border-purple-100/90 text-purple-950"}`}>
                <i className={`bi ${healthBadge.adviceIcon || "bi-shield-check text-purple-600"} text-base shrink-0`}></i>
                <p className="mb-0 leading-normal">
                  {count >= 4 && count <= 7 ? (
                    <>
                      <span className="font-bold">Optimal squad size.</span> Well-balanced span of control for high-impact 1:1 mentorship and delivery velocity.
                    </>
                  ) : (
                    healthBadge.advice
                  )}
                </p>
              </div>
            </div>

            {/* Card 3: Direct Reports Squad Roster Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 sm:p-3 shadow-2xs space-y-2">
              {/* Header row with search and add button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shadow-2xs">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-0">
                      Squad Members ({squad.members.length})
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-0">
                      Personnel assigned to this team lead
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 sm:justify-end">
                  {/* Member Search Bar */}
                  <div className="relative flex-1 sm:max-w-[200px]">
                    <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                    <input
                      type="text"
                      placeholder="Search squad roster..."
                      value={memberFilter}
                      onChange={(e) => setMemberFilter(e.target.value)}
                      className="w-full pl-7 pr-6 py-1 rounded-lg text-[11px] bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:outline-none transition-all placeholder:text-slate-400"
                    />
                    {memberFilter && (
                      <button
                        type="button"
                        onClick={() => setMemberFilter("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                      >
                        <i className="bi bi-x-circle-fill"></i>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAssignModal(undefined, squad.supervisorId, squad.managerId)}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-[11px] shadow-2xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    <i className="bi bi-plus text-xs"></i>
                    <span>Add Member</span>
                  </button>
                </div>
              </div>

              {/* Roster Table Layout */}
              {filteredMembers.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">
                    {memberFilter
                      ? `No squad members match "${memberFilter}"`
                      : "No direct reports assigned to this squad yet."}
                  </p>
                  {!memberFilter && (
                    <button
                      type="button"
                      onClick={() => onOpenAssignModal(undefined, squad.supervisorId, squad.managerId)}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs hover:from-indigo-700 hover:to-purple-700 cursor-pointer shadow-xs"
                    >
                      Assign First Member
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Table Column Headers */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-1 bg-slate-50/80 rounded-lg text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-3">Member</div>
                    <div className="col-span-2">Employee ID</div>
                    <div className="col-span-5">Email</div>
                    <div className="col-span-2 text-right pr-1">Actions</div>
                  </div>

                  {/* Table Rows */}
                  <div className="space-y-1">
                    {filteredMembers.map((member) => (
                      <div
                        key={`drawer-member-${member.id || member.employee_id}`}
                        className="grid grid-cols-12 gap-2 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50/70 hover:border-slate-200/80 items-center transition-all group"
                      >
                        {/* Member Column */}
                        <div className="col-span-3 flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                            {member.employee_name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900 text-xs truncate">
                            {member.employee_name}
                          </span>
                        </div>

                        {/* Employee ID Column */}
                        <div className="col-span-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100/90 text-slate-600 font-mono text-[10px] font-medium border border-slate-200/60 inline-block">
                            EMP-{String(member.employee_id).padStart(4, "0")}
                          </span>
                        </div>

                        {/* Email Column */}
                        <div className="col-span-5 flex items-center gap-1.5 min-w-0 text-[11px] text-slate-600">
                          <i className="bi bi-envelope text-indigo-500 text-[11px] shrink-0"></i>
                          <span className="truncate">{member.employee_email}</span>
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-2 flex items-center justify-end gap-1 pr-0.5">
                          {onInitiateReassign && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onInitiateReassign(member);
                              }}
                              className="w-6 h-6 rounded-md border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Reassign to another supervisor"
                            >
                              <i className="bi bi-arrow-left-right text-[10px]"></i>
                            </button>
                          )}
                          {onInitiateUnlink && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onInitiateUnlink(member);
                              }}
                              className="w-6 h-6 rounded-md border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                              title="Unlink from this squad"
                            >
                              <i className="bi bi-x-circle text-[10px]"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Sticky Footer */}
          <div className="px-4 py-2 border-t border-slate-200/80 bg-white flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAssignModal(undefined, squad.supervisorId, squad.managerId);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <i className="bi bi-plus text-xs"></i>
              <span>Add Member to Squad</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

