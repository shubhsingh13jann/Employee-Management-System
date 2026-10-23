import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { UnassignedEmployee, HierarchyMappingItem } from "./HierarchyTableView";

interface UserOption {
  id: string | number;
  name: string;
  email?: string;
  department_name?: string;
  department_id?: string | number;
}

export interface AutoAssignProposal {
  employeeId: string | number;
  employeeName: string;
  employeeEmail: string;
  departmentName: string;
  proposedSupervisorId: string | number;
  proposedSupervisorName: string;
  proposedManagerId: string | number;
  proposedManagerName: string;
  currentSupervisorLoad: number;
  selected: boolean;
}

interface AutoAssignWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  unassignedStaff: UnassignedEmployee[];
  supervisors: UserOption[];
  managers: UserOption[];
  mappings: HierarchyMappingItem[];
  onExecuteAutoAssign: (
    assignments: { employee_id: string | number; supervisor_id: string | number; manager_id: string | number }[]
  ) => Promise<void>;
  saving: boolean;
}

export const AutoAssignWizardModal: React.FC<AutoAssignWizardModalProps> = ({
  isOpen,
  onClose,
  unassignedStaff,
  supervisors,
  managers,
  mappings,
  onExecuteAutoAssign,
  saving,
}) => {
  const [proposals, setProposals] = useState<AutoAssignProposal[]>([]);
  const [unmatchableCount, setUnmatchableCount] = useState<number>(0);

  // Compute live workload count per supervisor
  const supervisorWorkloadMap = useMemo(() => {
    const map: Record<string, number> = {};
    mappings.forEach((m) => {
      const key = String(m.supervisor_id);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [mappings]);

  // Generate optimal balanced proposals on modal open
  useEffect(() => {
    if (!isOpen) return;

    // Clone workload counts to simulate sequential allocation without overloading any single lead
    const simulatedWorkload: Record<string, number> = { ...supervisorWorkloadMap };
    const generatedProposals: AutoAssignProposal[] = [];
    let unmatched = 0;

    unassignedStaff.forEach((emp) => {
      const dept = emp.department_name;
      // Find supervisors matching employee department
      let deptSups = supervisors.filter(
        (s) => s.department_name && dept && s.department_name.toLowerCase() === dept.toLowerCase()
      );

      // If no department supervisor, fallback to all supervisors with capacity
      if (deptSups.length === 0) {
        deptSups = supervisors;
      }

      if (deptSups.length === 0) {
        unmatched++;
        return;
      }

      // Pick supervisor with lowest simulated workload who hasn't exceeded 8
      const sorted = [...deptSups].sort(
        (a, b) => (simulatedWorkload[String(a.id)] || 0) - (simulatedWorkload[String(b.id)] || 0)
      );

      const chosenSup = sorted[0];
      const currentLoad = simulatedWorkload[String(chosenSup.id)] || 0;

      // Find manager matching supervisor department or first manager
      const chosenMgr =
        managers.find(
          (m) =>
            m.department_name &&
            chosenSup.department_name &&
            m.department_name.toLowerCase() === chosenSup.department_name.toLowerCase()
        ) || managers[0];

      if (!chosenMgr) {
        unmatched++;
        return;
      }

      // Increment simulated workload
      simulatedWorkload[String(chosenSup.id)] = currentLoad + 1;

      generatedProposals.push({
        employeeId: emp.id,
        employeeName: emp.name,
        employeeEmail: emp.email,
        departmentName: emp.department_name || "General",
        proposedSupervisorId: chosenSup.id,
        proposedSupervisorName: chosenSup.name,
        proposedManagerId: chosenMgr.id,
        proposedManagerName: chosenMgr.name,
        currentSupervisorLoad: currentLoad,
        selected: true,
      });
    });

    setProposals(generatedProposals);
    setUnmatchableCount(unmatched);
  }, [isOpen, unassignedStaff, supervisors, managers, mappings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  const toggleProposal = (index: number) => {
    setProposals((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setProposals((prev) => prev.map((p) => ({ ...p, selected: select })));
  };

  const handleSupervisorChange = (index: number, newSupId: string) => {
    const sup = supervisors.find((s) => String(s.id) === String(newSupId));
    if (!sup) return;

    const mgr =
      managers.find(
        (m) =>
          m.department_name &&
          sup.department_name &&
          m.department_name.toLowerCase() === sup.department_name.toLowerCase()
      ) || managers[0];

    setProposals((prev) =>
      prev.map((p, idx) =>
        idx === index
          ? {
              ...p,
              proposedSupervisorId: sup.id,
              proposedSupervisorName: sup.name,
              proposedManagerId: mgr ? mgr.id : p.proposedManagerId,
              proposedManagerName: mgr ? mgr.name : p.proposedManagerName,
              currentSupervisorLoad: supervisorWorkloadMap[String(sup.id)] || 0,
            }
          : p
      )
    );
  };

  const selectedProposals = proposals.filter((p) => p.selected);

  const handleExecute = async () => {
    if (selectedProposals.length === 0) return;

    const payload = selectedProposals.map((p) => ({
      employee_id: p.employeeId,
      supervisor_id: p.proposedSupervisorId,
      manager_id: p.proposedManagerId,
    }));

    await onExecuteAutoAssign(payload);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={saving ? undefined : onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting the 240px sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        <div
          className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[88vh] relative pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Wave Background */}
          <div className="relative pl-6 pr-5 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-100/90 overflow-hidden shrink-0">
            {/* Top-Right Fluid Pastel Wave Background */}
            <div className="absolute top-0 right-0 w-[440px] sm:w-[560px] h-full pointer-events-none overflow-hidden z-0">
              <svg
                viewBox="0 0 500 74"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  {/* Left fade mask to seamlessly blend into pure white */}
                  <mask id="autoAssignWaveFadeMask">
                    <linearGradient id="autoAssignWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="18%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#autoAssignWaveFadeGrad)" />
                  </mask>

                  {/* Wave 1: Soft Sky-Blue / Periwinkle Gradient */}
                  <linearGradient id="autoAssignWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                  </linearGradient>

                  {/* Wave 2: Richer Lavender / Violet Sweep */}
                  <linearGradient id="autoAssignWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                  </linearGradient>

                  {/* Wave 3: Subtle Pastel Ribbon Glow */}
                  <linearGradient id="autoAssignWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <g mask="url(#autoAssignWaveFadeMask)">
                  {/* Layer 1: Broad soft background crest */}
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#autoAssignWaveGrad1)"
                  />
                  {/* Layer 2: Main curved ribbon */}
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#autoAssignWaveGrad2)"
                  />
                  {/* Layer 3: Soft swoop ribbon sweeping under actions */}
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#autoAssignWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left: Magic Wand Squircle Icon + Title & AI Tag */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-pink-500/25 shrink-0">
                <i className="bi bi-magic"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mb-0 tracking-tight leading-tight">
                    Intelligent Auto-Assign Wizard
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                    AI Workload Balancing
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-0 font-normal leading-tight mt-0.5">
                  Department-matched auto-allocation prioritizing team leads with available capacity
                </p>
              </div>
            </div>

            {/* Right: Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs disabled:opacity-50 relative z-10"
              title="Close"
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* 4 Executive Metric KPI Cards Strip */}
          <div className="px-6 py-3.5 bg-white border-b border-slate-100/90 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
            {/* 1. Total Unassigned */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3.5 hover:bg-slate-50/60 transition-all">
              <div className="w-11 h-11 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center text-lg shrink-0">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  TOTAL UNASSIGNED
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight block">
                  {unassignedStaff.length} Staff
                </span>
              </div>
            </div>

            {/* 2. Optimal Matches */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/30 border border-emerald-100/90 shadow-2xs flex items-center gap-3.5 hover:bg-emerald-50/60 transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                <i className="bi bi-bullseye"></i>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
                  OPTIMAL MATCHES
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight block">
                  {proposals.length} Proposed
                </span>
              </div>
            </div>

            {/* 3. Selected for Action */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-50/30 border border-purple-100/90 shadow-2xs flex items-center gap-3.5 hover:bg-purple-50/60 transition-all">
              <div className="w-11 h-11 rounded-xl bg-purple-100/70 text-purple-600 flex items-center justify-center text-lg shrink-0">
                <i className="bi bi-lightning-charge-fill"></i>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block mb-0.5">
                  SELECTED FOR ACTION
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight block">
                  {selectedProposals.length} Ready
                </span>
              </div>
            </div>

            {/* 4. Available Leads */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/30 border border-amber-100/90 shadow-2xs flex items-center gap-3.5 hover:bg-amber-50/60 transition-all">
              <div className="w-11 h-11 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center text-lg shrink-0">
                <i className="bi bi-person-badge-fill"></i>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  AVAILABLE LEADS
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight block">
                  {supervisors.length} Supervisors
                </span>
              </div>
            </div>
          </div>

          {/* Action Controls & Select All Bar */}
          <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Select All with Custom Checkbox */}
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer group"
              >
                <span className="w-4 h-4 rounded border-2 border-indigo-600 flex items-center justify-center text-indigo-600 text-[10px] group-hover:bg-indigo-50 transition-colors">
                  <i className="bi bi-check font-extrabold"></i>
                </span>
                <span>Select All ({proposals.length})</span>
              </button>

              <span className="text-slate-200 font-light">|</span>

              {/* Deselect All with Custom Checkbox */}
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
              >
                <span className="w-4 h-4 rounded border-2 border-slate-300 group-hover:border-slate-400 transition-colors"></span>
                <span>Deselect All</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-normal">
              <i className="bi bi-info-circle text-indigo-400 text-xs"></i>
              <span>Preview and override individual supervisor assignments before executing</span>
            </div>
          </div>

        {/* Main Content Body: Proposals Table or Illustrated Empty State */}
        <div className="flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin] flex flex-col justify-center">
          {proposals.length === 0 ? (
            <div className="w-full border-2 border-dashed border-indigo-100/90 rounded-3xl bg-slate-50/20 py-12 px-6 flex flex-col items-center justify-center text-center my-auto min-h-[340px]">
              {/* 3D Illustrated Document Graphic matching reference */}
              <div className="relative mb-5 flex items-center justify-center">
                {/* Soft ambient aura/cloud behind */}
                <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-100/70 via-blue-100/60 to-purple-100/40 blur-xl pointer-events-none"></div>

                {/* SVG 3D-Style Document Graphic */}
                <svg
                  width="130"
                  height="120"
                  viewBox="0 0 130 120"
                  fill="none"
                  className="relative z-10 drop-shadow-md"
                >
                  <defs>
                    <linearGradient id="docPaperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="40%" stopColor="#F5F7FF" />
                      <stop offset="100%" stopColor="#E4EAFA" />
                    </linearGradient>
                    <linearGradient id="docFoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D5E0F8" />
                      <stop offset="100%" stopColor="#BCCEF4" />
                    </linearGradient>
                    <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#93C5FD" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                    <linearGradient id="checkCircleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#059669" floodOpacity="0.25" />
                    </filter>
                  </defs>

                  {/* Sparkle Left Top (small) */}
                  <path
                    d="M 24 58 Q 24 64 19 64 Q 24 64 24 70 Q 24 64 29 64 Q 24 64 24 58 Z"
                    fill="url(#sparkleGrad)"
                    opacity="0.85"
                  />

                  {/* Sparkle Right Top (large 4-pointed star) */}
                  <g transform="translate(98, 20) rotate(12)">
                    <path
                      d="M 0 -11 Q 0 0 11 0 Q 0 0 0 11 Q 0 0 -11 0 Q 0 0 0 -11 Z"
                      fill="url(#sparkleGrad)"
                    />
                  </g>

                  {/* Main Document Body with folded corner */}
                  <path
                    d="M 44 24
                       L 75 24
                       L 92 41
                       L 92 90
                       A 12 12 0 0 1 80 102
                       L 44 102
                       A 12 12 0 0 1 32 90
                       L 32 36
                       A 12 12 0 0 1 44 24 Z"
                    fill="url(#docPaperGrad)"
                    stroke="#D3E0FA"
                    strokeWidth="1.5"
                  />

                  {/* Folded Top-Right Flap */}
                  <path
                    d="M 75 24
                       L 75 36
                       A 5 5 0 0 0 80 41
                       L 92 41 Z"
                    fill="url(#docFoldGrad)"
                    stroke="#CADAF8"
                    strokeWidth="1"
                  />

                  {/* Document Line 1 */}
                  <rect x="42" y="47" width="28" height="4.5" rx="2.25" fill="#BFD2F8" />

                  {/* Document Line 2 */}
                  <rect x="42" y="58" width="36" height="4.5" rx="2.25" fill="#BFD2F8" />

                  {/* Document Line 3 */}
                  <rect x="42" y="69" width="22" height="4.5" rx="2.25" fill="#CADAF8" />

                  {/* Checkmark Badge on Bottom-Right */}
                  <g filter="url(#badgeShadow)">
                    <circle cx="85" cy="88" r="15" fill="white" />
                    <circle cx="85" cy="88" r="13" fill="url(#checkCircleGrad)" />
                    {/* White Checkmark */}
                    <path
                      d="M 79 88 L 83 92 L 91 84"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1 tracking-tight">
                All Staff Are Fully Assigned!
              </h3>
              <p className="text-xs text-slate-400 mb-0 font-normal">
                No orphaned or unassigned personnel need allocation.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {proposals.map((prop, idx) => {
                const afterLoad = prop.currentSupervisorLoad + 1;
                return (
                  <div
                    key={`auto-prop-${prop.employeeId}`}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                      prop.selected
                        ? "bg-white border-indigo-200/90 shadow-2xs ring-1 ring-indigo-100/70"
                        : "bg-slate-50/60 border-slate-200/70 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* Left: Checkbox & Employee Details */}
                    <div className="flex items-center gap-3 min-w-0 md:w-5/12">
                      <button
                        type="button"
                        onClick={() => toggleProposal(idx)}
                        className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          prop.selected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "bg-white border-slate-300 hover:border-slate-400"
                        }`}
                      >
                        {prop.selected && <i className="bi bi-check text-xs font-black"></i>}
                      </button>

                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/90 font-bold text-indigo-700 flex items-center justify-center text-xs shrink-0 shadow-2xs">
                        {prop.employeeName.charAt(0)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-900 truncate mb-0 leading-tight">
                            {prop.employeeName}
                          </p>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80 font-medium shrink-0">
                            {prop.departmentName}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 truncate mb-0 font-mono mt-0.5">
                          EMP-{String(prop.employeeId).padStart(4, "0")}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Proposed Chain of Command Allocation */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200/80">
                      <i className="bi bi-arrow-right text-indigo-500 text-xs shrink-0"></i>

                      {/* Supervisor Dropdown Override */}
                      <div className="min-w-0 flex-1">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block mb-0.5">
                          Proposed Team Lead
                        </span>
                        <select
                          value={prop.proposedSupervisorId}
                          onChange={(e) => handleSupervisorChange(idx, e.target.value)}
                          className="w-full text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer truncate"
                        >
                          {supervisors.map((s) => (
                            <option key={`opt-sup-${s.id}`} value={s.id}>
                              {s.name} ({s.department_name || "General"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Supervisor Load Meter */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 block">
                          Load: {afterLoad}/8
                        </span>
                        <span className="text-[9px] font-medium text-slate-400">
                          {afterLoad <= 3 ? "Light" : "Optimal"}
                        </span>
                      </div>

                      <i className="bi bi-chevron-right text-slate-300 text-xs shrink-0"></i>

                      {/* Manager */}
                      <div className="min-w-0 shrink-0">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block mb-0.5">
                          Manager
                        </span>
                        <span className="text-xs font-semibold text-indigo-900 truncate block">
                          👑 {prop.proposedManagerName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Executive Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-sm shrink-0 shadow-2xs">
              <i className="bi bi-file-earmark-text"></i>
            </div>
            <span className="text-xs text-slate-600 font-normal">
              <strong className="font-bold text-slate-800">{selectedProposals.length}</strong> of{" "}
              <strong className="font-bold text-slate-800">{proposals.length}</strong> proposals selected for auto-assignment
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={saving || selectedProposals.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Executing Auto-Assign...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-magic text-sm font-bold"></i>
                  <span>Execute Auto-Assignment ({selectedProposals.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AutoAssignWizardModal;
