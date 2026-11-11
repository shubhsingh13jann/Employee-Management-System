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

  if (!isOpen) return null;

  const isDelete = mode === "delete";
  const count = selectedProjects.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-6 py-4.5 border-b flex items-center justify-between ${
            isDelete
              ? "bg-rose-50/80 border-rose-200"
              : "bg-amber-50/80 border-amber-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-2xs ${
                isDelete
                  ? "bg-rose-600 text-white"
                  : "bg-amber-500 text-white"
              }`}
            >
              <i className={`bi ${isDelete ? "bi-trash3-fill" : "bi-archive-fill"}`}></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isDelete
                  ? `Permanently Delete ${count} Initiative${count > 1 ? "s" : ""}`
                  : `Batch Archive ${count} Initiative${count > 1 ? "s" : ""}`}
              </h3>
              <p className="text-xs text-slate-500">
                {isDelete
                  ? "Irreversible batch deletion of strategic records"
                  : "Transition selected initiatives to archived status"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Warning Message */}
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
              isDelete
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <i
                className={`bi ${
                  isDelete ? "bi-exclamation-triangle-fill text-rose-600" : "bi-info-circle-fill text-amber-600"
                } text-sm mt-0.5`}
              ></i>
              <div>
                {isDelete ? (
                  <span>
                    <strong>CRITICAL WARNING:</strong> Deleting these initiatives will permanently cascade and delete all associated tasks, deliverables, squad allocations, and logged budget expenditures.
                  </span>
                ) : (
                  <span>
                    <strong>Notice:</strong> Archiving will mark these initiatives as inactive. They will remain stored in historical records and audit logs.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Affected Initiatives List Preview */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Initiatives to be {isDelete ? "deleted" : "archived"} ({count})</span>
              <span className="text-slate-400 font-mono text-[10px]">Audit Logged</span>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {selectedProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/80 text-xs shadow-2xs"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      PRJ-{String(proj.id).padStart(4, "0")}
                    </span>
                    <span className="font-semibold text-slate-800 truncate" title={proj.title}>
                      {proj.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {proj.department_name || "General"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Acknowledgement Checkbox for Deletions */}
          {isDelete && (
            <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/80 transition-colors">
              <input
                type="checkbox"
                checked={confirmedCheckbox}
                onChange={(e) => setConfirmedCheckbox(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
              />
              <span>I confirm that I want to permanently delete these {count} initiatives and understand this action cannot be undone.</span>
            </label>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing || (isDelete && !confirmedCheckbox)}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isDelete
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <i className={`bi ${isDelete ? "bi-trash3-fill" : "bi-archive-fill"}`}></i>
                <span>{isDelete ? "Confirm Batch Delete" : "Confirm Batch Archive"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
