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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-indigo-200">
              <i className="bi bi-arrow-left-right text-base"></i>
            </div>
            <div>
              <h3 className="font-bold text-base text-white mb-0">
                Confirm Reporting Line Reassignment
              </h3>
              <p className="text-xs text-indigo-200 mb-0">
                Reallocate staff reporting hierarchy and update chain of command
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employee Info Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {employee.employee_name ? employee.employee_name.charAt(0) : "E"}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-sm mb-0 truncate">
                {employee.employee_name}
              </h4>
              <p className="text-xs text-slate-500 mb-0 truncate">{employee.employee_email}</p>
              <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                EMP-{String(employee.employee_id).padStart(4, "0")} • {employee.department_name || "General"}
              </span>
            </div>
          </div>

          {/* Current vs Target Reporting Preview */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-600 block uppercase tracking-wider mb-1">
                Current Chain
              </span>
              <p className="font-semibold text-slate-800 mb-0.5 truncate">
                👷 {currentSupervisorName}
              </p>
              <p className="text-[11px] text-slate-500 mb-0 truncate">
                👔 {currentManagerName}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider mb-1">
                Target Chain
              </span>
              <p className="font-semibold text-slate-800 mb-0.5 truncate">
                👷 {targetSupervisorObj?.name || "Select Lead..."}
              </p>
              <p className="text-[11px] text-slate-500 mb-0 truncate">
                👔 {targetManagerObj?.name || "Auto / Inherited"}
              </p>
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
