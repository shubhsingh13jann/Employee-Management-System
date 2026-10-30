import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface StagedReorgChange {
  employee_id: string | number;
  employee_name: string;
  employee_email?: string;
  employee_department?: string;
  current_supervisor_id?: string | number;
  current_supervisor_name?: string;
  target_supervisor_id: string | number;
  target_supervisor_name: string;
  target_supervisor_department?: string;
  sync_department?: boolean;
}

export interface ReorgSimulationReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  stagedChanges: StagedReorgChange[];
  onUpdateChange: (index: number, updated: StagedReorgChange) => void;
  onRemoveChange: (index: number) => void;
  onClearAll: () => void;
  onApplyPlan: (changes: StagedReorgChange[], reason: string) => Promise<void>;
}

export const ReorgSimulationReviewModal: React.FC<ReorgSimulationReviewModalProps> = ({
  isOpen,
  onClose,
  stagedChanges,
  onUpdateChange,
  onRemoveChange,
  onClearAll,
  onApplyPlan,
}) => {
  const [reason, setReason] = useState<string>("Quarterly Team Realignment Simulation");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const uniqueTargetSupervisors = new Set(
    stagedChanges.map((c) => String(c.target_supervisor_id))
  ).size;

  const crossDeptTransfers = stagedChanges.filter(
    (c) =>
      c.employee_department &&
      c.target_supervisor_department &&
      c.employee_department.toLowerCase() !== c.target_supervisor_department.toLowerCase()
  );

  const handleApply = async () => {
    if (stagedChanges.length === 0) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      await onApplyPlan(stagedChanges, reason);
      onClose();
    } catch (err: any) {
      console.error("Apply reorg plan failed:", err);
      setErrorMsg(
        err.response?.data?.error || err.message || "Failed to apply reorganization plan."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Amber / Violet Wave Background */}
        <div className="relative px-4 sm:px-5 py-2.5 sm:py-3 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-[380px] sm:w-[480px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <mask id="reorgWaveFadeMask">
                  <linearGradient id="reorgWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="25%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#reorgWaveFadeGrad)" />
                </mask>

                <linearGradient id="reorgWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.3" />
                  <stop offset="35%" stopColor="#FDE68A" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#DDD6FE" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0.6" />
                </linearGradient>

                <linearGradient id="reorgWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.3" />
                  <stop offset="35%" stopColor="#F59E0B" stopOpacity="0.5" />
                  <stop offset="65%" stopColor="#C4B5FD" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              <g mask="url(#reorgWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#reorgWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#reorgWaveGrad2)"
                />
              </g>
            </svg>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center text-base shadow-2xs shrink-0">
              <i className="bi bi-flask"></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-normal mb-0">
                Reorganization Simulation Review
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mb-0 font-normal leading-normal mt-0.5 truncate">
                Review staged reporting changes before publishing to the live hierarchy
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer relative z-10"
            title="Close modal (Esc)"
          >
            <i className="bi bi-x text-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 sm:py-3.5 space-y-3">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-rose-500 shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* KPI Mini Summary */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {stagedChanges.length}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-amber-900 block uppercase tracking-wider">
                  Staged Moves
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {stagedChanges.length} employee{stagedChanges.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {uniqueTargetSupervisors}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-indigo-900 block uppercase tracking-wider">
                  Squads Impacted
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {uniqueTargetSupervisors} team lead{uniqueTargetSupervisors === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {crossDeptTransfers.length}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-900 block uppercase tracking-wider">
                  Cross-Dept
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {crossDeptTransfers.length} transfer{crossDeptTransfers.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Reorganization Initiative / Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Q4 Engineering Restructuring, Agile Squad Expansion..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-medium shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
            />
          </div>

          {/* Staged Changes List */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-800">
                Planned Reporting Line Modifications ({stagedChanges.length})
              </span>
              {stagedChanges.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[10.5px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Discard All
                </button>
              )}
            </div>

            {stagedChanges.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                <i className="bi bi-inbox text-3xl text-slate-300 block mb-1.5"></i>
                <p className="text-xs font-bold text-slate-700 mb-0.5">No changes staged in simulation draft</p>
                <p className="text-[11px] text-slate-400 mb-0">
                  Drag and drop employees or use reassign in Simulation Mode to stage reporting line changes.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-0.5">
                {stagedChanges.map((change, index) => {
                  const isCrossDept =
                    change.employee_department &&
                    change.target_supervisor_department &&
                    change.employee_department.toLowerCase() !==
                      change.target_supervisor_department.toLowerCase();

                  return (
                    <div
                      key={`${change.employee_id}-${index}`}
                      className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Employee Details */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {change.employee_name ? change.employee_name.charAt(0) : "E"}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs truncate block">
                              {change.employee_name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block">
                              EMP-{String(change.employee_id).padStart(4, "0")} • {change.employee_department || "General"}
                            </span>
                          </div>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => onRemoveChange(index)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove from draft"
                        >
                          <i className="bi bi-trash text-xs"></i>
                        </button>
                      </div>

                      {/* Transition Path: Current Lead -> New Lead */}
                      <div className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <div className="flex-1 min-w-0">
                          <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Current Lead</span>
                          <span className="font-semibold text-slate-700 truncate block text-[11px]">
                            {change.current_supervisor_name || "Unassigned"}
                          </span>
                        </div>

                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xs">
                          <i className="bi bi-arrow-right"></i>
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-[9.5px] font-bold text-emerald-600 block uppercase">Target Lead</span>
                          <span className="font-semibold text-slate-900 truncate block text-[11px]">
                            {change.target_supervisor_name}
                          </span>
                        </div>
                      </div>

                      {/* Cross Department Sync Toggle */}
                      {isCrossDept && (
                        <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[10.5px]">
                          <div className="flex items-center gap-1.5 text-indigo-900 font-medium truncate">
                            <i className="bi bi-arrow-left-right text-indigo-500"></i>
                            <span>
                              Sync Dept: {change.employee_department} →{" "}
                              <strong className="text-indigo-950 font-bold">
                                {change.target_supervisor_department}
                              </strong>
                            </span>
                          </div>
                          <label className="flex items-center gap-1 text-[10.5px] font-bold text-indigo-700 cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={change.sync_department ?? true}
                              onChange={(e) =>
                                onUpdateChange(index, {
                                  ...change,
                                  sync_department: e.target.checked,
                                })
                              }
                              className="w-3.5 h-3.5 accent-indigo-600 rounded cursor-pointer"
                            />
                            <span>Sync</span>
                          </label>
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
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <span>Keep Draft</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={submitting || stagedChanges.length === 0}
              className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></span>
                  <span>Applying Plan...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill text-xs"></i>
                  <span>Publish & Apply Plan ({stagedChanges.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
