import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface UserOption {
  id: string | number;
  name: string;
  email?: string;
  department_name?: string;
  role?: string;
}

interface AssignHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    employee_id: string;
    supervisor_id: string;
    manager_id: string;
  };
  onFormChange: (form: {
    employee_id: string;
    supervisor_id: string;
    manager_id: string;
  }) => void;
  onSubmit: (e: React.FormEvent) => void;
  employees: UserOption[];
  supervisors: UserOption[];
  managers: UserOption[];
  saving: boolean;
}

export const AssignHierarchyModal: React.FC<AssignHierarchyModalProps> = ({
  isOpen,
  onClose,
  form,
  onFormChange,
  onSubmit,
  employees,
  supervisors,
  managers,
  saving,
}) => {
  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedEmp = employees.find((e) => String(e.id) === String(form.employee_id));
  const selectedSup = supervisors.find((s) => String(s.id) === String(form.supervisor_id));
  const selectedMgr = managers.find((m) => String(m.id) === String(form.manager_id));

  const isCrossDept =
    selectedEmp?.department_name &&
    selectedSup?.department_name &&
    selectedEmp.department_name !== selectedSup.department_name;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center text-lg shrink-0">
              <i className="bi bi-diagram-3-fill"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white mb-0">
                Map Employee to Team Hierarchy
              </h3>
              <p className="text-[11px] text-slate-300 mb-0 font-normal">
                Establish direct supervisor and department manager reporting chain
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit}>
          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Field 1: Subordinate Employee */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Select Subordinate Employee <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.employee_id}
                  onChange={(e) =>
                    onFormChange({ ...form, employee_id: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-inner appearance-none pr-9"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.email}) — {e.department_name || "Unassigned"}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  <i className="bi bi-chevron-down"></i>
                </div>
              </div>
              {selectedEmp && (
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Department:</span>
                  <span className="px-2 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedEmp.department_name || "General"}
                  </span>
                </div>
              )}
            </div>

            {/* Field 2: Direct Supervisor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Select Direct Supervisor (Team Lead) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.supervisor_id}
                  onChange={(e) =>
                    onFormChange({ ...form, supervisor_id: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-inner appearance-none pr-9"
                >
                  <option value="">-- Choose Supervisor --</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department_name || "Supervisor"})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  <i className="bi bi-chevron-down"></i>
                </div>
              </div>
              {selectedSup && (
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Team Lead Dept:</span>
                  <span className="px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    {selectedSup.department_name || "Supervisor"}
                  </span>
                </div>
              )}
            </div>

            {/* Field 3: Department Manager */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. Select Department Manager <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.manager_id}
                  onChange={(e) =>
                    onFormChange({ ...form, manager_id: e.target.value })
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-inner appearance-none pr-9"
                >
                  <option value="">-- Choose Manager --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department_name || "Manager"})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  <i className="bi bi-chevron-down"></i>
                </div>
              </div>
              {selectedMgr && (
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Manager Dept:</span>
                  <span className="px-2 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium">
                    {selectedMgr.department_name || "Manager"}
                  </span>
                </div>
              )}
            </div>

            {/* Cross-Department Supervision Alert */}
            {isCrossDept && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in">
                <i className="bi bi-info-circle-fill text-amber-600 shrink-0 mt-0.5"></i>
                <div>
                  <strong className="block font-semibold">Cross-Department Supervision</strong>
                  <span>
                    Employee is registered in <strong>{selectedEmp?.department_name}</strong> while Supervisor is in <strong>{selectedSup?.department_name}</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Saving Assignment...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2"></i>
                  <span>Save Team Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
