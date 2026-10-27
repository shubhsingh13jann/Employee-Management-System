import React, { useState, useEffect } from "react";
import { HierarchyMappingItem } from "./HierarchyTableView";

interface ReassignConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: HierarchyMappingItem | null;
  targetSupervisor: { id: string | number; name: string; department?: string } | null;
  targetManager: { id: string | number; name: string; department?: string } | null;
  supervisors: { id: string | number; name: string; department?: string }[];
  managers: { id: string | number; name: string; department?: string }[];
  onConfirm: (payload: {
    employee_id: string | number;
    supervisor_id: string | number;
    manager_id?: string | number;
  }) => Promise<void>;
  saving: boolean;
}

export const ReassignConfirmModal: React.FC<ReassignConfirmModalProps> = ({
  isOpen,
  onClose,
  employee,
  targetSupervisor,
  targetManager,
  supervisors,
  managers,
  onConfirm,
  saving,
}) => {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  useEffect(() => {
    if (targetSupervisor) {
      setSelectedSupervisorId(String(targetSupervisor.id));
    } else if (employee) {
      setSelectedSupervisorId(String(employee.supervisor_id));
    } else {
      setSelectedSupervisorId("");
    }

    if (targetManager) {
      setSelectedManagerId(String(targetManager.id));
    } else if (employee) {
      setSelectedManagerId(String(employee.manager_id));
    } else {
      setSelectedManagerId("");
    }
  }, [targetSupervisor, targetManager, employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervisorId) return;

    await onConfirm({
      employee_id: employee.employee_id,
      supervisor_id: selectedSupervisorId,
      manager_id: selectedManagerId || undefined,
    });
  };

  const currentSupervisorName = employee.supervisor_name || "Unassigned";
  const currentManagerName = employee.manager_name || "Unassigned";

  const targetSupervisorObj = supervisors.find(
    (s) => String(s.id) === String(selectedSupervisorId)
  );
  const targetManagerObj = managers.find(
    (m) => String(m.id) === String(selectedManagerId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Wave Background matching reference */}
        <div className="relative px-5 sm:px-6 py-4 bg-white flex items-center justify-between border-b border-slate-100 overflow-hidden shrink-0">
          {/* Top-Right Fluid Pastel Wave Background */}
          <div className="absolute top-0 right-0 w-[420px] sm:w-[500px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <mask id="reassignWaveFadeMask">
                  <linearGradient id="reassignWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="18%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#reassignWaveFadeGrad)" />
                </mask>
                <linearGradient id="reassignWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="reassignWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#F5F3FF" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <g mask="url(#reassignWaveFadeMask)">
                <path
                  d="M0,32 C70,12 140,52 230,22 C320,-8 390,42 500,12 L500,0 L0,0 Z"
                  fill="url(#reassignWaveGrad1)"
                />
                <path
                  d="M60,48 C150,18 240,64 340,28 C410,2 470,38 500,24 L500,0 L60,0 Z"
                  fill="url(#reassignWaveGrad2)"
                  opacity="0.85"
                />
              </g>
            </svg>
          </div>

          {/* Left: Reassignment Icon + Title & Subtitle */}
          <div className="flex items-center gap-3.5 relative z-10 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100/90 text-indigo-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
              <i className="bi bi-arrow-left-right text-indigo-600 text-lg"></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg text-slate-900 tracking-tight leading-snug mb-0 truncate">
                Confirm Reporting Line Reassignment
              </h3>
              <p className="text-xs text-slate-400 mb-0 font-normal leading-tight mt-0.5 truncate">
                Reallocate staff reporting hierarchy and update chain of command
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-xs relative z-10 shrink-0"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employee Info Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0 select-none">
              {employee.employee_name ? employee.employee_name.charAt(0).toUpperCase() : "E"}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-base mb-0 tracking-tight truncate">
                {employee.employee_name}
              </h4>
              <p className="text-xs text-slate-400 mb-0 font-normal mt-0.5 truncate">
                {employee.employee_email || "employee@company.com"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200/80 text-slate-600">
                  EMP-{String(employee.employee_id).padStart(4, "0")} • {employee.department_name || "Accounts"}
                </span>
              </div>
            </div>
          </div>

          {/* Current vs Target Reporting Preview Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Chain */}
            <div className="p-4 rounded-2xl bg-[#fef4f5] border border-rose-200/80">
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-rose-100/90 text-rose-500 flex items-center justify-center text-xs shadow-2xs shrink-0">
                  <i className="bi bi-diagram-3-fill"></i>
                </div>
                <span className="text-xs font-black tracking-wider text-rose-600 uppercase">
                  Current Chain
                </span>
              </div>
              <div className="relative pl-1 space-y-3">
                <div className="absolute left-[19px] top-[16px] bottom-[16px] w-px bg-rose-200 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-500 flex items-center justify-center text-sm shadow-2xs shrink-0">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {currentSupervisorName}
                  </span>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-blue-100/90 text-blue-500 flex items-center justify-center text-sm shadow-2xs shrink-0">
                    <i className="bi bi-building-fill"></i>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {currentManagerName}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Chain */}
            <div className="p-4 rounded-2xl bg-[#f1fdf8] border border-emerald-200/80">
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100/90 text-emerald-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                  <i className="bi bi-diagram-3-fill"></i>
                </div>
                <span className="text-xs font-black tracking-wider text-emerald-600 uppercase">
                  Target Chain
                </span>
              </div>
              <div className="relative pl-1 space-y-3">
                <div className="absolute left-[19px] top-[16px] bottom-[16px] w-px bg-emerald-200 pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-amber-100/90 text-amber-500 flex items-center justify-center text-sm shadow-2xs shrink-0">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {targetSupervisorObj?.name || "Select Lead..."}
                  </span>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-blue-100/90 text-blue-500 flex items-center justify-center text-sm shadow-2xs shrink-0">
                    <i className="bi bi-building-fill"></i>
                  </div>
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {targetManagerObj?.name || (targetSupervisorObj ? `${targetSupervisorObj.name} (Resolved)` : "Auto / Inherited")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Supervisor Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              New Team Lead / Supervisor <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="">Select Supervisor...</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.department ? `(${s.department})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Manager Selection (Optional Override) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Department Manager (Optional Override)
            </label>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="">Auto-resolve from Department / Supervisor</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.department ? `(${m.department})` : ""}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 mb-0">
              If left blank, the manager will be automatically resolved from the supervisor&apos;s department.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedSupervisorId}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i>
                  <span>Confirm Reassignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
