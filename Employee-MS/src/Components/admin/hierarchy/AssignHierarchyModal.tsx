import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export interface UserOption {
  id: string | number;
  name: string;
  email?: string;
  department_name?: string;
  role?: string;
}

export interface HierarchyMappingItemSimple {
  supervisor_id: string | number;
  [key: string]: any;
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
  mappings?: HierarchyMappingItemSimple[];
  saving: boolean;
  errorMessage?: string;
  onClearError?: () => void;
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
  mappings = [],
  saving,
  errorMessage = "",
  onClearError,
}) => {
  const [localError, setLocalError] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setLocalError("");
    }
  }, [isOpen]);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, saving]);

  // Compute live workload count per supervisor
  const supervisorWorkloadMap = useMemo(() => {
    const map: Record<string, number> = {};
    mappings.forEach((m) => {
      const key = String(m.supervisor_id);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [mappings]);

  const selectedEmp = employees.find((e) => String(e.id) === String(form.employee_id));
  const selectedSup = supervisors.find((s) => String(s.id) === String(form.supervisor_id));
  const selectedMgr = managers.find((m) => String(m.id) === String(form.manager_id));

  const empDept = selectedEmp?.department_name;
  const isCrossDept =
    empDept &&
    selectedSup?.department_name &&
    empDept.toLowerCase() !== selectedSup.department_name.toLowerCase();

  // Partition supervisors into recommended (same dept) and others
  const { recommendedSupervisors, otherSupervisors } = useMemo(() => {
    if (!empDept) {
      return { recommendedSupervisors: supervisors, otherSupervisors: [] };
    }
    const rec: UserOption[] = [];
    const oth: UserOption[] = [];
    supervisors.forEach((s) => {
      if (s.department_name && s.department_name.toLowerCase() === empDept.toLowerCase()) {
        rec.push(s);
      } else {
        oth.push(s);
      }
    });
    return { recommendedSupervisors: rec, otherSupervisors: oth };
  }, [supervisors, empDept]);

  if (!isOpen) return null;

  // Handle employee change with smart auto-recommendation
  const handleEmployeeChange = (empId: string) => {
    if (localError) setLocalError("");
    if (onClearError) onClearError();
    const chosenEmp = employees.find((e) => String(e.id) === String(empId));
    let nextSupId = form.supervisor_id;
    let nextMgrId = form.manager_id;

    if (chosenEmp && chosenEmp.department_name) {
      const matchingSups = supervisors.filter(
        (s) => s.department_name && s.department_name.toLowerCase() === chosenEmp.department_name!.toLowerCase()
      );
      if (matchingSups.length > 0 && (!nextSupId || !matchingSups.some((s) => String(s.id) === String(nextSupId)))) {
        // Pick supervisor with lowest current workload
        const sorted = [...matchingSups].sort(
          (a, b) => (supervisorWorkloadMap[String(a.id)] || 0) - (supervisorWorkloadMap[String(b.id)] || 0)
        );
        nextSupId = String(sorted[0].id);
      }

      const matchingMgr = managers.find(
        (m) => m.department_name && m.department_name.toLowerCase() === chosenEmp.department_name!.toLowerCase()
      );
      if (matchingMgr) {
        nextMgrId = String(matchingMgr.id);
      }
    }

    onFormChange({
      ...form,
      employee_id: empId,
      supervisor_id: nextSupId,
      manager_id: nextMgrId,
    });
  };

  // If opened with pre-filled employee_id but no supervisor, auto-resolve recommendations
  useEffect(() => {
    if (!isOpen || !form.employee_id) return;
    if (form.supervisor_id && form.manager_id) return;
    const chosenEmp = employees.find((e) => String(e.id) === String(form.employee_id));
    if (chosenEmp && chosenEmp.department_name) {
      let nextSup = form.supervisor_id;
      let nextMgr = form.manager_id;
      if (!nextSup) {
        const matchingSups = supervisors.filter(
          (s) => s.department_name && s.department_name.toLowerCase() === chosenEmp.department_name!.toLowerCase()
        );
        if (matchingSups.length > 0) {
          const sorted = [...matchingSups].sort(
            (a, b) => (supervisorWorkloadMap[String(a.id)] || 0) - (supervisorWorkloadMap[String(b.id)] || 0)
          );
          nextSup = String(sorted[0].id);
        }
      }
      if (!nextMgr) {
        const matchingMgr = managers.find(
          (m) => m.department_name && m.department_name.toLowerCase() === chosenEmp.department_name!.toLowerCase()
        );
        if (matchingMgr) {
          nextMgr = String(matchingMgr.id);
        }
      }
      if (nextSup !== form.supervisor_id || nextMgr !== form.manager_id) {
        onFormChange({
          ...form,
          supervisor_id: nextSup,
          manager_id: nextMgr,
        });
      }
    }
  }, [isOpen, form.employee_id, form.supervisor_id, form.manager_id, employees, supervisors, managers, supervisorWorkloadMap]);

  // Handle supervisor change with automatic manager resolution
  const handleSupervisorChange = (supId: string) => {
    if (localError) setLocalError("");
    if (onClearError) onClearError();
    const chosenSup = supervisors.find((s) => String(s.id) === String(supId));
    let nextMgrId = form.manager_id;
    if (chosenSup && chosenSup.department_name) {
      const matchedMgr = managers.find(
        (m) => m.department_name && m.department_name.toLowerCase() === chosenSup.department_name!.toLowerCase()
      );
      if (matchedMgr) {
        nextMgrId = String(matchedMgr.id);
      }
    }
    onFormChange({
      ...form,
      supervisor_id: supId,
      manager_id: nextMgrId,
    });
  };

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) {
      setLocalError("Please select a subordinate employee to assign.");
      return;
    }
    if (!form.supervisor_id) {
      setLocalError("Please select a direct supervisor (team lead) for this employee.");
      return;
    }
    if (!form.manager_id) {
      setLocalError("Please select a department manager to complete the reporting chain.");
      return;
    }
    setLocalError("");
    if (onClearError) onClearError();
    onSubmit(e);
  };

  const currentSupLoad = selectedSup ? (supervisorWorkloadMap[String(selectedSup.id)] || 0) : 0;
  const newSupLoad = currentSupLoad + 1;
  const activeError = localError || errorMessage;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={saving ? undefined : onClose}
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
            disabled={saving}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs disabled:opacity-50"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleLocalSubmit}>
          <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Inline Error Alert Banner */}
            {activeError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-rose-600 text-sm shrink-0"></i>
                  <span className="font-semibold">{activeError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLocalError("");
                    if (onClearError) onClearError();
                  }}
                  className="text-rose-400 hover:text-rose-700 cursor-pointer"
                  title="Dismiss error"
                >
                  <i className="bi bi-x-lg text-[10px]"></i>
                </button>
              </div>
            )}
            {/* Field 1: Subordinate Employee */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-0">
                  1. Select Subordinate Employee <span className="text-rose-500">*</span>
                </label>
                {selectedEmp?.department_name && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Dept: {selectedEmp.department_name}
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={form.employee_id}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
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
            </div>

            {/* Field 2: Direct Supervisor with Department Smart Grouping */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-0">
                  2. Select Direct Supervisor (Team Lead) <span className="text-rose-500">*</span>
                </label>
                {selectedSup && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                      currentSupLoad <= 3
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : currentSupLoad <= 7
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    Load: {currentSupLoad}/8 reports ({currentSupLoad <= 3 ? "Light" : currentSupLoad <= 7 ? "Optimal" : "High Span"})
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={form.supervisor_id}
                  onChange={(e) => handleSupervisorChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-inner appearance-none pr-9"
                >
                  <option value="">-- Choose Supervisor --</option>
                  {recommendedSupervisors.length > 0 && (
                    <optgroup label={`🌟 Department Leads (${empDept || "Recommended"})`}>
                      {recommendedSupervisors.map((s) => {
                        const load = supervisorWorkloadMap[String(s.id)] || 0;
                        const statusTag = load <= 3 ? "Light" : load <= 7 ? "Optimal" : "High Span";
                        return (
                          <option key={`rec-sup-${s.id}`} value={s.id}>
                            {s.name} ({s.department_name || "General"}) — {load}/8 reports [{statusTag}]
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                  {otherSupervisors.length > 0 && (
                    <optgroup label="🌐 Other Department Leads">
                      {otherSupervisors.map((s) => {
                        const load = supervisorWorkloadMap[String(s.id)] || 0;
                        const statusTag = load <= 3 ? "Light" : load <= 7 ? "Optimal" : "High Span";
                        return (
                          <option key={`oth-sup-${s.id}`} value={s.id}>
                            {s.name} ({s.department_name || "General"}) — {load}/8 reports [{statusTag}]
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  <i className="bi bi-chevron-down"></i>
                </div>
              </div>

              {/* Dedicated Smart Supervisor Workload Preview Card */}
              {selectedSup ? (
                <div className="mt-2 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                        {selectedSup.name.charAt(0)}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 mb-0 leading-tight">
                          {selectedSup.name}
                        </h5>
                        <p className="text-[10px] text-slate-500 mb-0 font-medium">
                          {selectedSup.department_name || "General"} • Direct Supervisor
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                        currentSupLoad <= 3
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : currentSupLoad <= 7
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {currentSupLoad <= 3 ? "Light Load" : currentSupLoad <= 7 ? "Optimal Span" : "High Span"}
                    </span>
                  </div>

                  {/* Capacity Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px]">
                      <span className="font-semibold text-slate-600">
                        Workload Capacity: <span className="font-bold text-slate-900">{currentSupLoad} / 8</span> reports
                      </span>
                      <span className="font-mono text-slate-500 font-semibold">
                        {Math.min(100, Math.round((currentSupLoad / 8) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-300 ${
                          currentSupLoad <= 3
                            ? "bg-emerald-500"
                            : currentSupLoad <= 7
                            ? "bg-indigo-500"
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.round((currentSupLoad / 8) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1 text-slate-600">
                      <i className="bi bi-info-circle text-indigo-500"></i>
                      After assignment: <strong className="text-slate-800">{newSupLoad} / 8 reports</strong>
                    </span>
                    {newSupLoad <= 8 ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                        <i className="bi bi-check-circle-fill"></i> Within Recommended Span
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                        <i className="bi bi-exclamation-triangle-fill"></i> Nearing/Exceeding 8 Capacity
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-2 p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center gap-2 text-slate-400 text-xs">
                  <i className="bi bi-speedometer2 text-indigo-400 text-sm"></i>
                  <span className="text-[11px]">Select a supervisor above to preview live team workload and mentorship capacity.</span>
                </div>
              )}
            </div>

            {/* Field 3: Department Manager with Auto-Fill */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-0">
                  3. Select Department Manager <span className="text-rose-500">*</span>
                </label>
                {selectedMgr && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Dept: {selectedMgr.department_name || "General"}
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={form.manager_id}
                  onChange={(e) => onFormChange({ ...form, manager_id: e.target.value })}
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
            </div>

            {/* Live Chain of Command Preview */}
            {selectedEmp && selectedSup && selectedMgr && (
              <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-indigo-500/30 shadow-md space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <i className="bi bi-diagram-3-fill"></i>
                  <span>Live Chain of Command Telemetry</span>
                </span>
                <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto py-1">
                  <div className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500/50 text-indigo-200 shrink-0">
                    👑 {selectedMgr.name} <span className="text-[10px] text-indigo-400 block font-normal">Manager</span>
                  </div>
                  <i className="bi bi-chevron-right text-indigo-400 text-xs shrink-0"></i>
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-200 shrink-0">
                    🛡️ {selectedSup.name} <span className="text-[10px] text-emerald-400 block font-normal">Supervisor (Load: {newSupLoad}/8)</span>
                  </div>
                  <i className="bi bi-chevron-right text-indigo-400 text-xs shrink-0"></i>
                  <div className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/50 text-sky-200 shrink-0">
                    👤 {selectedEmp.name} <span className="text-[10px] text-sky-400 block font-normal">Direct Report</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cross-Department Supervision Alert */}
            {isCrossDept && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in">
                <i className="bi bi-exclamation-triangle-fill text-amber-600 shrink-0 mt-0.5"></i>
                <div>
                  <strong className="block font-semibold">Cross-Department Supervision Warning</strong>
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
