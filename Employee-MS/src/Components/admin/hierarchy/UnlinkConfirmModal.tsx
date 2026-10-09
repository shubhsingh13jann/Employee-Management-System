import React from "react";
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
  if (!isOpen || !employee) return null;

  const handleConfirm = async () => {
    await onConfirm(employee.employee_id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <i className="bi bi-link-45deg text-lg"></i>
            </div>
            <div>
              <h3 className="font-bold text-base text-white mb-0">Unlink Reporting Line</h3>
              <p className="text-xs text-rose-100 mb-0">Sever team hierarchy link</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
              {employee.employee_name ? employee.employee_name.charAt(0) : "E"}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-sm mb-0 truncate">
                {employee.employee_name}
              </h4>
              <p className="text-xs text-slate-500 mb-0 truncate">{employee.employee_email}</p>
              <span className="text-[10px] text-slate-400">
                Supervisor: <strong className="text-slate-700">{employee.supervisor_name}</strong> •
                Manager: <strong className="text-slate-700">{employee.manager_name}</strong>
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2.5">
            <i className="bi bi-exclamation-triangle-fill text-amber-600 shrink-0 text-sm mt-0.5"></i>
            <div>
              <p className="font-bold mb-0.5">Are you sure you want to unlink this employee?</p>
              <p className="text-[11px] text-amber-700 mb-0">
                This employee will become unassigned and be listed under orphaned staff until a new team lead is assigned.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Keep Existing
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Unlinking...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-trash"></i>
                  <span>Confirm Unlink</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
