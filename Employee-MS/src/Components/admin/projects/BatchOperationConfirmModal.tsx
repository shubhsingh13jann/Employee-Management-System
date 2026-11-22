import React, { useState, useEffect } from "react";
import { ProjectItem } from "../../../pages/admin/AdminProjects";

export interface BatchOperationConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  mode: "archive" | "delete";
  selectedProjects: ProjectItem[];
  isProcessing?: boolean;
}

export const BatchOperationConfirmModal: React.FC<BatchOperationConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mode,
  selectedProjects,
  isProcessing = false,
}) => {
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmedCheckbox(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isProcessing]);

  if (!isOpen) return null;

  const isDelete = mode === "delete";
  const count = selectedProjects.length;
  const primaryProject = selectedProjects[0] || ({} as ProjectItem);
  const projectCode = primaryProject.id
    ? `PRJ-${String(primaryProject.id).padStart(4, "0")}`
    : "PRJ-0001";

  const handleConfirmAction = async () => {
    if (isDelete && !confirmedCheckbox) return;
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-3xl lg:max-w-[820px] w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Rose Wave Background matching Unlink Reporting Line modal */}
        <div className="relative px-4 sm:px-5 py-2.5 sm:py-3 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
          {/* Top-Right Fluid Pastel Wave Background in Soft Rose Tones */}
          <div className="absolute top-0 right-0 w-[380px] sm:w-[480px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <mask id="archiveDeleteWaveFadeMask">
                  <linearGradient id="archiveDeleteWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="22%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#archiveDeleteWaveFadeGrad)" />
                </mask>

                {/* Wave 1: Soft Rose Blush */}
                <linearGradient id="archiveDeleteWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor={isDelete ? "#FFE4E6" : "#FEF3C7"} stopOpacity="0.25" />
                  <stop offset="30%" stopColor={isDelete ? "#FECDD3" : "#FDE68A"} stopOpacity="0.85" />
                  <stop offset="65%" stopColor={isDelete ? "#FFE4E6" : "#FEF3C7"} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={isDelete ? "#FFF1F2" : "#FFFBEB"} stopOpacity="0.7" />
                </linearGradient>

                {/* Wave 2: Richer Rose / Amber Sweep */}
                <linearGradient id="archiveDeleteWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isDelete ? "#FFE4E6" : "#FEF3C7"} stopOpacity="0.3" />
                  <stop offset="30%" stopColor={isDelete ? "#FDA4AF" : "#FCD34D"} stopOpacity="0.7" />
                  <stop offset="60%" stopColor={isDelete ? "#FECDD3" : "#FDE68A"} stopOpacity="0.85" />
                  <stop offset="85%" stopColor={isDelete ? "#FFE4E6" : "#FEF3C7"} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={isDelete ? "#FFF1F2" : "#FFFBEB"} stopOpacity="0.4" />
                </linearGradient>

                {/* Wave 3: Subtle Ribbon Glow */}
                <linearGradient id="archiveDeleteWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor={isDelete ? "#FFF1F2" : "#FFFBEB"} stopOpacity="0.5" />
                  <stop offset="45%" stopColor={isDelete ? "#FECDD3" : "#FDE68A"} stopOpacity="0.75" />
                  <stop offset="100%" stopColor={isDelete ? "#FDA4AF" : "#FCD34D"} stopOpacity="0.5" />
                </linearGradient>
              </defs>

              <g mask="url(#archiveDeleteWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#archiveDeleteWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#archiveDeleteWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#archiveDeleteWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          {/* Left: Action Icon + Title & Subtitle */}
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg shadow-2xs shrink-0 ${
                isDelete
                  ? "bg-rose-50 border border-rose-100/90 text-rose-500"
                  : "bg-amber-50 border border-amber-100/90 text-amber-600"
              }`}
            >
              <i className={`bi ${isDelete ? "bi-trash3-fill text-rose-600 text-lg" : "bi-archive-fill text-amber-600 text-lg"}`}></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-normal mb-0">
                {isDelete
                  ? count > 1
                    ? `Permanently Delete ${count} Initiatives`
                    : "Permanently Delete Strategic Initiative"
                  : count > 1
                  ? `Archive ${count} Strategic Initiatives`
                  : "Archive Strategic Initiative"}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mb-0 font-normal leading-normal mt-0.5">
                {isDelete
                  ? "Irreversible cascading removal of initiative, squad, and tasks"
                  : "Move initiative to dormant historical records with audit protection"}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer shadow-xs relative z-10 shrink-0 disabled:opacity-50"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 space-y-2.5 sm:space-y-3 overflow-y-auto max-h-[70vh]">
          {/* Top Two Cards: Initiative Details (Left) and Severed/Archived Diagram (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-3.5 items-stretch">
            {/* Left Card: Initiative Identity Card */}
            <div className="md:col-span-5 py-2.5 px-3 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col justify-center">
              {/* Profile Row */}
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-base shadow-xs shrink-0 select-none text-white ${
                    isDelete ? "bg-rose-600" : "bg-indigo-600"
                  }`}
                >
                  {primaryProject.title ? primaryProject.title.charAt(0).toUpperCase() : "P"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm !m-0 tracking-tight truncate" title={primaryProject.title}>
                      {primaryProject.title || "Strategic Initiative"}
                    </h4>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-semibold font-mono bg-slate-200/80 text-slate-600 shrink-0">
                      {projectCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 !m-0 font-normal mt-0.5 truncate" title={primaryProject.description}>
                    {primaryProject.description || "Voice Automation System"}
                  </p>
                </div>
              </div>

              {/* Bottom Metadata Pills */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/70">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs shrink-0">
                    <i className="bi bi-person-fill"></i>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] text-slate-400 block leading-tight font-medium">Lead Supervisor</span>
                    <span className="text-[11px] font-bold text-slate-800 block leading-tight truncate">
                      {primaryProject.supervisor_name || "Unassigned"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-xs shrink-0">
                    <i className="bi bi-building-fill"></i>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9.5px] text-slate-400 block leading-tight font-medium">Department</span>
                    <span className="text-[11px] font-bold text-slate-800 block leading-tight truncate">
                      {primaryProject.department_name || "General"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Severed / Transition Hierarchy Diagram */}
            <div className="md:col-span-7 py-2.5 px-3 rounded-2xl bg-[#fff7f8] border border-rose-200/80 flex items-center justify-between relative overflow-hidden">
              {/* Connecting Red Dashed Line */}
              <div className="absolute left-[30px] right-[30px] top-1/2 -translate-y-1/2 border-t-2 border-dashed border-rose-300 pointer-events-none z-0"></div>

              {/* Box 1: Active Initiative - Logo at Left, 3 texts at Right */}
              <div className="flex-1 min-w-0 max-w-[175px] bg-white border border-slate-200/90 rounded-2xl p-2 sm:px-2.5 sm:py-2 flex items-center gap-2 shadow-xs z-10">
                {/* Logo only at the left */}
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shadow-2xs shrink-0">
                  <i className="bi bi-briefcase-fill"></i>
                </div>
                {/* The 3 texts at the right */}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate block" title={primaryProject.title}>
                    {primaryProject.title || "Initiative"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate block">
                    Active Delivery
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex px-1.5 py-0.2 rounded text-[9px] font-semibold font-mono bg-slate-100 text-slate-600 border border-slate-200/60 leading-none">
                      {projectCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Severed / Broken Circle */}
              <div className="relative z-10 flex items-center justify-center shrink-0 mx-1 sm:mx-1.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-600 text-white flex items-center justify-center text-sm shadow-md shadow-rose-600/30 ring-4 ring-rose-100 shrink-0">
                  <i className={`bi ${isDelete ? "bi-trash3-fill" : "bi-archive-fill"} font-bold text-xs sm:text-sm`}></i>
                </div>
              </div>

              {/* Box 2: Target Vault / Deletion State - Logo at Left, 3 texts at Right */}
              <div className="flex-1 min-w-0 max-w-[175px] bg-white border border-slate-200/90 rounded-2xl p-2 sm:px-2.5 sm:py-2 flex items-center gap-2 shadow-xs z-10">
                {/* Logo only at the left */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-2xs shrink-0 ${
                    isDelete ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <i className={`bi ${isDelete ? "bi-slash-circle-fill" : "bi-safe-fill"}`}></i>
                </div>
                {/* The 3 texts at the right */}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-800 leading-tight truncate block">
                    {isDelete ? "Purged System" : "Archived Vault"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 truncate block">
                    {isDelete ? "Permanent Deletion" : "Dormant Record"}
                  </span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-1.5 py-0.2 rounded text-[9px] font-semibold leading-none ${
                        isDelete
                          ? "bg-rose-100 text-rose-700 border border-rose-200/60"
                          : "bg-amber-100 text-amber-800 border border-amber-200/60"
                      }`}
                    >
                      {isDelete ? "DELETED" : "ARCHIVED"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Multiple Selected Initiatives Preview Strip (When Batch Count > 1) */}
          {count > 1 && (
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                <span>Selected Initiatives Payload ({count})</span>
                <span className="text-[10px] font-mono text-slate-400">All will be {isDelete ? "purged" : "archived"}</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                {selectedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200/70 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        PRJ-{String(p.id).padStart(4, "0")}
                      </span>
                      <span className="font-semibold text-slate-800 truncate" title={p.title}>
                        {p.title}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                      {p.department_name || "General"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning Banner */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-[#fef8f0] border border-amber-200/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-sm shadow-2xs shrink-0">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-amber-950 text-xs sm:text-[13px] leading-tight">
                {isDelete
                  ? count > 1
                    ? `Are you sure you want to permanently delete these ${count} initiatives?`
                    : "Are you sure you want to permanently delete this strategic initiative?"
                  : count > 1
                  ? `Are you sure you want to archive these ${count} initiatives?`
                  : "Are you sure you want to archive this strategic initiative?"}
              </div>
              <div className="text-[11px] sm:text-xs text-amber-800 font-normal leading-normal mt-0.5">
                {isDelete
                  ? "This action is irreversible and permanently cascades to remove all associated deliverables, squad allocations, tasks, and logged budget expenditures."
                  : "Archiving transitions the initiative to dormant status. All historical telemetry, milestones, and audit trails remain preserved and can be restored anytime."}
              </div>
            </div>
          </div>

          {/* Acknowledgement Checkbox for Deletions */}
          {isDelete && (
            <label className="flex items-center text-xs text-slate-700 font-medium cursor-pointer p-2.5 px-3 rounded-xl bg-rose-50/50 border border-rose-200 select-none transition-colors hover:bg-rose-50/80">
              <input
                type="checkbox"
                checked={confirmedCheckbox}
                onChange={(e) => setConfirmedCheckbox(e.target.checked)}
                className="w-4 h-4 !mr-2.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600 shrink-0 self-center"
              />
              <span className="text-[11.5px] text-slate-700 font-medium leading-none select-none">
                I understand and acknowledge that this strategic initiative removal is permanent and cannot be undone.
              </span>
            </label>
          )}
        </div>

        {/* Actions Footer matching Unlink Reporting Line modal */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Keep Existing
          </button>
          <button
            type="button"
            onClick={handleConfirmAction}
            disabled={isProcessing || (isDelete && !confirmedCheckbox)}
            className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isDelete
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
            }`}
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{isDelete ? "Deleting..." : "Archiving..."}</span>
              </>
            ) : (
              <>
                <i className={`bi ${isDelete ? "bi-trash3-fill" : "bi-archive-fill"}`}></i>
                <span>{isDelete ? "Confirm Delete" : "Confirm Archive"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
