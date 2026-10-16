import React from "react";
import { HierarchyMappingItem } from "./HierarchyTableView";

interface SwapReportingConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee1: HierarchyMappingItem | null;
  employee2: HierarchyMappingItem | null;
  onConfirm: (emp1Id: string | number, emp2Id: string | number) => Promise<void>;
  saving: boolean;
}

export const SwapReportingConfirmModal: React.FC<SwapReportingConfirmModalProps> = ({
  isOpen,
  onClose,
  employee1,
  employee2,
  onConfirm,
  saving,
}) => {
  if (!isOpen || !employee1 || !employee2) return null;

  const handleConfirm = async () => {
    await onConfirm(employee1.employee_id, employee2.employee_id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-200">
              <i className="bi bi-arrow-left-right text-lg"></i>
            </div>
            <div>
              <h3 className="font-bold text-base text-white mb-0">
                Confirm Reporting Line Swap
              </h3>
              <p className="text-xs text-amber-100/90 mb-0">
                Mutual exchange of supervisors & reporting managers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/90 flex items-start gap-2.5 text-xs text-amber-900">
            <i className="bi bi-info-circle-fill text-amber-600 text-sm mt-0.5 shrink-0"></i>
            <div>
              <span className="font-bold">Mutual Chain-of-Command Exchange:</span> Dropping these
              two employee nodes onto each other will reciprocally swap their direct supervisor and
              department manager assignments in the team hierarchy.
            </div>
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch relative">
            {/* Employee 1 Card */}
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {employee1.employee_name?.charAt(0) || "1"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate mb-0">
                      {employee1.employee_name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      EMP-{String(employee1.employee_id).padStart(4, "0")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs mt-3">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Current Lead:</span>
                    <span className="font-semibold text-slate-800 line-through text-[11px]">
                      {employee1.supervisor_name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200/60">
                    <span className="font-medium text-[11px]">New Lead:</span>
                    <span className="font-bold text-[11px]">
                      {employee2.supervisor_name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60 text-[11px]">
                    <span>New Manager:</span>
                    <span className="font-semibold text-slate-800">
                      {employee2.manager_name || "General"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee 2 Card */}
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {employee2.employee_name?.charAt(0) || "2"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate mb-0">
                      {employee2.employee_name}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      EMP-{String(employee2.employee_id).padStart(4, "0")}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs mt-3">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Current Lead:</span>
                    <span className="font-semibold text-slate-800 line-through text-[11px]">
                      {employee2.supervisor_name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-700 bg-emerald-50/80 p-1.5 rounded-lg border border-emerald-200/60">
                    <span className="font-medium text-[11px]">New Lead:</span>
                    <span className="font-bold text-[11px]">
                      {employee1.supervisor_name || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60 text-[11px]">
                    <span>New Manager:</span>
                    <span className="font-semibold text-slate-800">
                      {employee1.manager_name || "General"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Swapping Reporting Lines...</span>
              </>
            ) : (
              <>
                <i className="bi bi-arrow-left-right text-xs"></i>
                <span>Confirm Reporting Swap</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

