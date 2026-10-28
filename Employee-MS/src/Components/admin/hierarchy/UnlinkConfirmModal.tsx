import React, { useEffect } from "react";
import { HierarchyMappingItem } from "./HierarchyTableView";

interface UnlinkConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: HierarchyMappingItem | null;
  onConfirm: (employeeId: string | number) => Promise<void>;
  saving: boolean;
}

export const UnlinkConfirmModal: React.FC<UnlinkConfirmModalProps> = ({
  isOpen,
  onClose,
  employee,
  onConfirm,
  saving,
}) => {
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

  const handleConfirm = async () => {
    await onConfirm(employee.employee_id);
  };

  const supervisorCode = employee.supervisor_id
    ? `SUP-${String(employee.supervisor_id).padStart(4, "0")}`
    : "SUP-0003";
  const employeeCode = `EMP-${String(employee.employee_id).padStart(4, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-4xl lg:max-w-[960px] w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Rose Wave Background matching reference */}
        <div className="relative px-4 sm:px-5 py-2.5 sm:py-3 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
          {/* Top-Right Fluid Pastel Wave Background in Soft Rose Tones */}
          <div className="absolute top-0 right-0 w-[440px] sm:w-[560px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                {/* Left fade mask to seamlessly blend into pure white without harsh edges */}
                <mask id="unlinkWaveFadeMask">
                  <linearGradient id="unlinkWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="22%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#unlinkWaveFadeGrad)" />
                </mask>

                {/* Wave 1: Soft Rose Blush */}
                <linearGradient id="unlinkWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.25" />
                  <stop offset="30%" stopColor="#FECDD3" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#FFE4E6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#FFF1F2" stopOpacity="0.7" />
                </linearGradient>

                {/* Wave 2: Richer Rose / Pink Sweep */}
                <linearGradient id="unlinkWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#FDA4AF" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#FECDD3" stopOpacity="0.85" />
                  <stop offset="85%" stopColor="#FFE4E6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FFF1F2" stopOpacity="0.4" />
                </linearGradient>

                {/* Wave 3: Subtle Warm Pink Ribbon Glow */}
                <linearGradient id="unlinkWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#FFF1F2" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#FECDD3" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              <g mask="url(#unlinkWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#unlinkWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#unlinkWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#unlinkWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          {/* Left: Sever / Unlink Icon + Title & Subtitle */}
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-rose-50 border border-rose-100/90 text-rose-500 flex items-center justify-center text-lg shadow-2xs shrink-0">
              <i className="bi bi-link-45deg text-rose-500 text-xl font-bold"></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-normal mb-0">
                Unlink Reporting Line
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mb-0 font-normal leading-normal mt-0.5">
                Sever team hierarchy link for this employee
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

        {/* Modal Body */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3">
          {/* Top Two Cards: Employee Details (Left) and Severed Diagram (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {/* Left Card: Employee Identity Card with Supervisor & Manager Pills */}
            <div className="py-2.5 px-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-between">
              {/* Profile Row */}
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-xs shrink-0 select-none">
                  {employee.employee_name ? employee.employee_name.charAt(0).toUpperCase() : "E"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base mb-0 tracking-tight truncate">
                      {employee.employee_name}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 text-slate-600 shrink-0">
                      {employeeCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-0 font-normal mt-0.5 truncate">
                    {employee.employee_email || "employee@company.com"}
                  </p>
                </div>
              </div>

              {/* Bottom Metadata Pills */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/70">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs shrink-0">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block leading-tight font-medium">Direct Supervisor</span>
                    <span className="text-xs font-bold text-slate-800 block leading-tight truncate">
                      {employee.supervisor_name || "Unassigned"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs shrink-0">
                    <i className="bi bi-building-fill"></i>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block leading-tight font-medium">Department Manager</span>
                    <span className="text-xs font-bold text-slate-800 block leading-tight truncate">
                      {employee.manager_name || "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Severed Link Hierarchy Diagram Card */}
            <div className="py-2.5 px-3.5 rounded-2xl bg-[#fff7f8] border border-rose-200/80 flex items-center justify-between relative overflow-hidden">
              {/* Connecting Red Dashed Line */}
              <div className="absolute left-[70px] right-[70px] top-1/2 -translate-y-1/2 border-t-2 border-dashed border-rose-300 pointer-events-none z-0"></div>

              {/* Box 1: Team Lead / Supervisor */}
              <div className="w-[125px] sm:w-[135px] bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs z-10 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm mb-1.5 shadow-2xs">
                  <i className="bi bi-person-fill"></i>
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-full">
                  {employee.supervisor_name || "Supervisor"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-full">
                  Team Lead / Supervisor
                </span>
                <span className="mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 shrink-0">
                  {supervisorCode}
                </span>
              </div>

              {/* Center Severed / Broken Link Circle */}
              <div className="relative z-10 flex items-center justify-center">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-rose-600 text-white flex items-center justify-center text-base shadow-md shadow-rose-600/30 ring-4 ring-rose-100 shrink-0">
                  <i className="bi bi-link-45deg font-bold"></i>
                </div>
              </div>

              {/* Box 2: Employee */}
              <div className="w-[125px] sm:w-[135px] bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col items-center text-center shadow-xs z-10 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-sm mb-1.5 shadow-2xs">
                  <i className="bi bi-person-fill"></i>
                </div>
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-full">
                  {employee.employee_name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate max-w-full">
                  Employee
                </span>
                <span className="mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 shrink-0">
                  {employeeCode}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-[#fef8f0] border border-amber-200/80 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-base shadow-2xs shrink-0">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-amber-900 text-xs sm:text-sm mb-0.5 leading-snug">
                Are you sure you want to unlink this employee?
              </p>
              <p className="text-[11px] sm:text-xs text-amber-700 mb-0 font-normal leading-normal">
                This employee will become unassigned and be listed under orphaned staff until a new team lead is assigned.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Keep Existing
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Unlinking...</span>
              </>
            ) : (
              <>
                <i className="bi bi-trash3-fill"></i>
                <span>Confirm Unlink</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
