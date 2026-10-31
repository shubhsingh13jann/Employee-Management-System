import React, { useState, useEffect } from "react";
import { HierarchyMappingItem } from "./HierarchyTableView";

interface SupervisorOption {
  id: string | number;
  name: string;
  department?: string;
  department_name?: string;
}

interface ReassignConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: HierarchyMappingItem | null;
  targetSupervisor: SupervisorOption | null;
  targetManager: SupervisorOption | null;
  supervisors: SupervisorOption[];
  managers: SupervisorOption[];
  onConfirm: (payload: {
    employee_id: string | number;
    supervisor_id: string | number;
    manager_id?: string | number;
    sync_department?: boolean;
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
  const [syncDepartment, setSyncDepartment] = useState<boolean>(true);

  useEffect(() => {
    setSyncDepartment(true);
  }, [selectedSupervisorId, isOpen]);

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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervisorId) return;

    await onConfirm({
      employee_id: employee.employee_id,
      supervisor_id: selectedSupervisorId,
      manager_id: selectedManagerId || undefined,
      sync_department: isCrossDepartment ? syncDepartment : false,
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

  const employeeDeptName = employee.department_name || "General";
  const targetSupervisorDeptName =
    targetSupervisorObj?.department_name || targetSupervisorObj?.department || "";
  const isCrossDepartment =
    Boolean(targetSupervisorDeptName) &&
    Boolean(employeeDeptName) &&
    employeeDeptName.trim().toLowerCase() !== targetSupervisorDeptName.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-4xl lg:max-w-[960px] w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Wave Background matching reference & other modals */}
        <div className="relative px-4 sm:px-5 py-2.5 sm:py-3 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
          {/* Top-Right Fluid Pastel Wave Background */}
          <div className="absolute top-0 right-0 w-[440px] sm:w-[560px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                {/* Left fade mask to seamlessly blend into pure white without harsh edges */}
                <mask id="reassignWaveFadeMask">
                  <linearGradient id="reassignWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="22%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#reassignWaveFadeGrad)" />
                </mask>

                {/* Wave 1: Soft Sky-Blue / Periwinkle Gradient */}
                <linearGradient id="reassignWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>

                {/* Wave 2: Richer Lavender / Violet Sweep */}
                <linearGradient id="reassignWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                </linearGradient>

                {/* Wave 3: Subtle Pastel Ribbon Glow */}
                <linearGradient id="reassignWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g mask="url(#reassignWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#reassignWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#reassignWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#reassignWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          {/* Left: Reassignment Icon + Title & Subtitle */}
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 border border-indigo-100/90 text-indigo-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
              <i className="bi bi-arrow-left-right text-indigo-600 text-lg"></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-normal mb-0">
                Confirm Reporting Line Reassignment
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mb-0 font-normal leading-normal mt-0.5">
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
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3">
            {/* Employee Info Profile Card */}
            <div className="py-2 sm:py-2.5 px-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-xs shrink-0 select-none">
                {employee.employee_name ? employee.employee_name.charAt(0).toUpperCase() : "E"}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-0 tracking-tight truncate">
                  {employee.employee_name}
                </h4>
                <p className="text-xs text-slate-400 mb-0 font-normal mt-0.5 truncate">
                  {employee.employee_email || "employee@company.com"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 text-slate-600">
                    EMP-{String(employee.employee_id).padStart(4, "0")} • {employee.department_name || "Accounts"}
                  </span>
                </div>
              </div>
            </div>

            {/* Current vs Target Reporting Preview Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Current Chain */}
              <div className="py-2 sm:py-2.5 px-3.5 rounded-2xl bg-[#fef4f5] border border-rose-200/80">
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100/90 text-rose-500 flex items-center justify-center text-xs shadow-2xs shrink-0">
                    <i className="bi bi-diagram-3-fill"></i>
                  </div>
                  <span className="text-[11px] sm:text-xs font-black tracking-wider text-rose-600 uppercase">
                    Current Chain
                  </span>
                </div>
                <div className="relative pl-1 space-y-1.5">
                  <div className="absolute left-[16px] top-[12px] bottom-[12px] w-px bg-rose-200 pointer-events-none"></div>
                  <div className="flex items-center gap-2.5 relative z-10">
                    <div className="w-6.5 h-6.5 rounded-lg bg-amber-100/90 text-amber-500 flex items-center justify-center text-xs shadow-2xs shrink-0">
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {currentSupervisorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 relative z-10">
                    <div className="w-6.5 h-6.5 rounded-lg bg-blue-100/90 text-blue-500 flex items-center justify-center text-xs shadow-2xs shrink-0">
                      <i className="bi bi-building-fill"></i>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {currentManagerName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Target Chain */}
              <div className="py-2 sm:py-2.5 px-3.5 rounded-2xl bg-[#f1fdf8] border border-emerald-200/80">
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100/90 text-emerald-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                    <i className="bi bi-diagram-3-fill"></i>
                  </div>
                  <span className="text-[11px] sm:text-xs font-black tracking-wider text-emerald-600 uppercase">
                    Target Chain
                  </span>
                </div>
                <div className="relative pl-1 space-y-1.5">
                  <div className="absolute left-[16px] top-[12px] bottom-[12px] w-px bg-emerald-200 pointer-events-none"></div>
                  <div className="flex items-center gap-2.5 relative z-10">
                    <div className="w-6.5 h-6.5 rounded-lg bg-amber-100/90 text-amber-500 flex items-center justify-center text-xs shadow-2xs shrink-0">
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {targetSupervisorObj?.name || "Select Lead..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 relative z-10">
                    <div className="w-6.5 h-6.5 rounded-lg bg-blue-100/90 text-blue-500 flex items-center justify-center text-xs shadow-2xs shrink-0">
                      <i className="bi bi-building-fill"></i>
                    </div>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {targetManagerObj?.name || (targetSupervisorObj ? `${targetSupervisorObj.name} (Resolved)` : "Auto / Inherited")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supervisor Selection with Icon Prefix */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                New Team Lead / Supervisor <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden h-9.5">
                <div className="w-9.5 h-9.5 flex items-center justify-center bg-slate-50/70 border-r border-slate-100 text-blue-600 text-sm shrink-0">
                  <i className="bi bi-person-fill"></i>
                </div>
                <select
                  value={selectedSupervisorId}
                  onChange={(e) => setSelectedSupervisorId(e.target.value)}
                  required
                  className="w-full h-full pl-3 pr-9 bg-transparent text-xs font-semibold text-slate-800 appearance-none focus:outline-hidden cursor-pointer"
                >
                  <option value="">Select Supervisor...</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department_name || s.department || "General"})
                    </option>
                  ))}
                </select>
                <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs"></i>
              </div>
            </div>

            {/* Manager Selection (Optional Override) with Icon Prefix */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Department Manager (Optional Override)
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden h-9.5">
                <div className="w-9.5 h-9.5 flex items-center justify-center bg-slate-50/70 border-r border-slate-100 text-blue-600 text-sm shrink-0">
                  <i className="bi bi-building-fill"></i>
                </div>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full h-full pl-3 pr-9 bg-transparent text-xs font-semibold text-slate-800 appearance-none focus:outline-hidden cursor-pointer"
                >
                  <option value="">Auto-resolve from Department / Supervisor</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department_name || m.department || "General"})
                    </option>
                  ))}
                </select>
                <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs"></i>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500 font-normal">
                <i className="bi bi-info-circle text-blue-500 text-xs shrink-0"></i>
                <span>If left blank, the manager will be automatically resolved from the supervisor&apos;s department.</span>
              </div>
            </div>

            {/* Cross-Department Transfer Notice & Synchronization Option */}
            {isCrossDepartment && (
              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 shadow-2xs animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-2xs">
                    <i className="bi bi-arrow-left-right text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-amber-950">Cross-Department Transfer Detected</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-200/80 text-amber-800 border border-amber-300/60">
                        {employeeDeptName} → {targetSupervisorDeptName}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 mt-1 mb-2 leading-relaxed">
                      The selected supervisor belongs to <strong>{targetSupervisorDeptName}</strong>, while {employee.employee_name || "this employee"} is currently assigned to <strong>{employeeDeptName}</strong>.
                    </p>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white/80 hover:bg-white p-2 sm:p-2.5 rounded-xl border border-amber-200 transition-colors shadow-2xs">
                      <input
                        type="checkbox"
                        checked={syncDepartment}
                        onChange={(e) => setSyncDepartment(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-amber-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Automatically update employee&apos;s primary department to <span className="text-indigo-600 underline decoration-indigo-400">{targetSupervisorDeptName}</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer - Dedicated Full-Width Bottom Bar */}
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <i className="bi bi-x-lg text-xs text-slate-500"></i>
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={saving || !selectedSupervisorId}
              className="px-5 py-1.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2 text-base font-bold"></i>
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
