import React, { useState, useEffect, useMemo } from "react";
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
  employees = [],
  supervisors = [],
  managers = [],
  mappings = [],
  saving = false,
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

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-3xl sm:rounded-[28px] shadow-2xl shadow-indigo-950/15 border border-slate-100 flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Ambient Glow Gradients in Top-Right & Bottom-Right matching reference mockup */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-96 h-96 bg-gradient-to-bl from-indigo-100/70 via-purple-100/40 to-transparent rounded-full blur-3xl opacity-80" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-indigo-100/60 via-pink-100/30 to-transparent rounded-full blur-3xl opacity-70" />

        {/* Modal Header */}
        <div className="px-6 sm:px-7 py-3 sm:py-3.5 flex items-center justify-between relative z-10 border-b border-slate-100">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-100 text-indigo-600 flex items-center justify-center text-lg sm:text-xl shadow-xs shrink-0">
              <i className="bi bi-diagram-3"></i>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight mb-0">
                Map Employee to Team Hierarchy
              </h3>
              <p className="text-xs text-slate-500 mb-0 font-normal mt-0.5">
                Establish direct supervisor and department manager reporting chain
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs disabled:opacity-50 shrink-0"
            title="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Form Body with Left Stepped Timeline & Right 3D Org Chart */}
        <form onSubmit={handleLocalSubmit} className="flex flex-col flex-1 relative z-10 overflow-hidden">
          <div className="px-6 sm:px-7 pt-3.5 pb-3 overflow-y-auto max-h-[calc(85vh-120px)]">
            {/* Inline Error Alert if active */}
            {activeError && (
              <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2.5 animate-in fade-in shadow-2xs">
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
                  className="text-rose-400 hover:text-rose-700 cursor-pointer p-0.5"
                  title="Dismiss error"
                >
                  <i className="bi bi-x-lg text-xs"></i>
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
              {/* Left Column: Stepped Form with Vertical Timeline */}
              <div className="lg:col-span-7 space-y-0">
                {/* Step 1: Subordinate Employee */}
                <div className="relative flex items-start gap-3.5">
                  {/* Timeline connector column */}
                  <div className="flex flex-col items-center self-stretch">
                    <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-600/30 ring-4 ring-indigo-50 shrink-0 z-10">
                      1
                    </div>
                    <div className="w-0.5 flex-1 border-l-2 border-dashed border-indigo-200/80 my-1"></div>
                  </div>

                  {/* Step 1 Content */}
                  <div className="flex-1 pb-2.5 sm:pb-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 mb-0">
                        Select Subordinate Employee <span className="text-rose-500 font-bold">*</span>
                      </h4>
                      {selectedEmp?.department_name && (
                        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {selectedEmp.department_name}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5 font-normal">
                      Choose the employee who will be mapped to the team hierarchy.
                    </p>

                    <div className="relative flex items-center rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-2xs overflow-hidden h-[38px] sm:h-[40px]">
                      <div className="w-10 h-full flex items-center justify-center border-r border-slate-100 text-indigo-600 text-base shrink-0 bg-slate-50/40">
                        <i className="bi bi-person"></i>
                      </div>
                      <select
                        value={form.employee_id}
                        onChange={(e) => handleEmployeeChange(e.target.value)}
                        required
                        className="w-full h-full py-1.5 px-3 bg-transparent text-xs sm:text-sm text-slate-800 font-medium focus:outline-none cursor-pointer appearance-none pr-8"
                      >
                        <option value="">-- Choose Employee --</option>
                        {employees.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name} {e.email ? `(${e.email})` : ""} — {e.department_name || "Unassigned"}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs">
                        <i className="bi bi-chevron-down"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Direct Supervisor (Team Lead) */}
                <div className="relative flex items-start gap-3.5">
                  {/* Timeline connector column */}
                  <div className="flex flex-col items-center self-stretch">
                    <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-blue-500/30 ring-4 ring-blue-50 shrink-0 z-10">
                      2
                    </div>
                    <div className="w-0.5 flex-1 border-l-2 border-dashed border-indigo-200/80 my-1"></div>
                  </div>

                  {/* Step 2 Content */}
                  <div className="flex-1 pb-2.5 sm:pb-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 mb-0">
                        Select Direct Supervisor (Team Lead) <span className="text-rose-500 font-bold">*</span>
                      </h4>
                      {selectedSup && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            currentSupLoad <= 3
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : currentSupLoad <= 7
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {currentSupLoad}/8 reports ({currentSupLoad <= 3 ? "Light" : currentSupLoad <= 7 ? "Optimal" : "High"})
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5 font-normal">
                      Choose the team lead who will directly supervise the selected employee.
                    </p>

                    <div className="relative flex items-center rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-2xs overflow-hidden h-[38px] sm:h-[40px]">
                      <div className="w-10 h-full flex items-center justify-center border-r border-slate-100 text-blue-600 text-base shrink-0 bg-slate-50/40">
                        <i className="bi bi-people"></i>
                      </div>
                      <select
                        value={form.supervisor_id}
                        onChange={(e) => handleSupervisorChange(e.target.value)}
                        required
                        className="w-full h-full py-1.5 px-3 bg-transparent text-xs sm:text-sm text-slate-800 font-medium focus:outline-none cursor-pointer appearance-none pr-8"
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

                    {/* Step 2 Workload Capacity Container matching reference mockup */}
                    {selectedSup ? (
                      <div className="mt-1.5 p-2 sm:p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="text-indigo-600 text-base shrink-0">
                              <i className="bi bi-speedometer2"></i>
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 mb-0">
                                {selectedSup.name}
                              </h5>
                              <p className="text-[10px] text-slate-500 mb-0 font-medium">
                                {selectedSup.department_name || "General"} • Direct Supervisor
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
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

                        <div className="space-y-0.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-slate-600">
                              Workload Capacity: <span className="font-bold text-slate-900">{currentSupLoad} / 8</span> reports
                            </span>
                            <span className="font-mono text-slate-500 font-semibold">
                              {Math.min(100, Math.round((currentSupLoad / 8) * 100))}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
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

                        <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-0.5">
                          <span className="flex items-center gap-1 text-slate-600">
                            <i className="bi bi-info-circle text-indigo-500 text-[10px]"></i>
                            After: <strong className="text-slate-800">{newSupLoad} / 8 reports</strong>
                          </span>
                          {newSupLoad <= 8 ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                              <i className="bi bi-check-circle-fill text-[9px]"></i> Within Span
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                              <i className="bi bi-exclamation-triangle-fill text-[9px]"></i> Exceeding 8 Capacity
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1.5 p-2 sm:p-2.5 rounded-xl border border-indigo-100/80 bg-indigo-50/35 flex items-center gap-2.5 text-slate-500">
                        <div className="text-indigo-500 text-base pr-2.5 border-r border-indigo-100/90 flex items-center justify-center shrink-0">
                          <i className="bi bi-speedometer2"></i>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-0 font-normal leading-snug">
                          Select a supervisor above to preview live team workload and mentorship capacity.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Department Manager */}
                <div className="relative flex items-start gap-3.5">
                  {/* Timeline marker without trailing line */}
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full border-2 border-fuchsia-500 bg-white text-fuchsia-600 font-bold text-xs flex items-center justify-center shadow-sm ring-4 ring-fuchsia-50 shrink-0 z-10">
                      3
                    </div>
                  </div>

                  {/* Step 3 Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 mb-0">
                        Select Department Manager <span className="text-rose-500 font-bold">*</span>
                      </h4>
                      {selectedMgr && (
                        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                          {selectedMgr.department_name || "Manager"}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mb-1.5 font-normal">
                      Choose the department manager under whom this employee will be assigned.
                    </p>

                    <div className="relative flex items-center rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-2xs overflow-hidden h-[38px] sm:h-[40px]">
                      <div className="w-10 h-full flex items-center justify-center border-r border-slate-100 text-fuchsia-600 text-base shrink-0 bg-slate-50/40">
                        <i className="bi bi-building"></i>
                      </div>
                      <select
                        value={form.manager_id}
                        onChange={(e) => onFormChange({ ...form, manager_id: e.target.value })}
                        required
                        className="w-full h-full py-1.5 px-3 bg-transparent text-xs sm:text-sm text-slate-800 font-medium focus:outline-none cursor-pointer appearance-none pr-8"
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
                </div>

                {/* Cross-Department Supervision Alert if applicable */}
                {isCrossDept && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in shadow-2xs">
                    <i className="bi bi-exclamation-triangle-fill text-amber-600 shrink-0 mt-0.5 text-sm"></i>
                    <div>
                      <strong className="block font-semibold">Cross-Department Supervision Warning</strong>
                      <span>
                        Employee is registered in <strong>{selectedEmp?.department_name}</strong> while Supervisor is in <strong>{selectedSup?.department_name}</strong>.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: 3D Illustrated Hierarchy Graphic Card matching reference */}
              <div className="hidden lg:flex lg:col-span-5 flex-col items-center justify-center relative min-h-[260px] py-3 px-2 select-none">
                {/* Orbital Dashed Ring & Sparkle Accents */}
                <div className="absolute w-52 h-52 rounded-full border border-dashed border-indigo-200/70 pointer-events-none"></div>
                <div className="absolute top-6 left-6 w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-400 animate-pulse"></div>
                <div className="absolute top-4 right-10 w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400"></div>
                <div className="absolute bottom-10 right-6 w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                <div className="absolute top-20 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                <div className="absolute bottom-14 left-6 w-1 h-1 rounded-full bg-blue-400"></div>

                {/* Top Node: Manager 3D Card */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-indigo-100 to-indigo-200/70 border border-indigo-200/90 shadow-xl shadow-indigo-500/15 flex flex-col items-center justify-center p-2 relative z-10 transition-transform duration-300 hover:scale-105 group">
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-base shadow-sm">
                    {selectedMgr ? (
                      <span className="font-bold text-xs">{selectedMgr.name.charAt(0)}</span>
                    ) : (
                      <i className="bi bi-person-fill"></i>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-indigo-900 mt-1 truncate max-w-[70px] text-center">
                    {selectedMgr ? selectedMgr.name.split(" ")[0] : "Manager"}
                  </span>
                </div>

                {/* Tree Connecting Branch Lines */}
                <div className="flex flex-col items-center relative z-0">
                  {/* Stem down from manager */}
                  <div className="w-0.5 h-4 bg-indigo-400/90"></div>
                  {/* Horizontal bar */}
                  <div className="w-40 h-0.5 bg-indigo-400/90 relative"></div>
                  {/* 3 Vertical drops to children */}
                  <div className="w-40 flex justify-between">
                    <div className="w-0.5 h-4 bg-indigo-400/90"></div>
                    <div className="w-0.5 h-4 bg-indigo-400/90"></div>
                    <div className="w-0.5 h-4 bg-indigo-400/90"></div>
                  </div>
                </div>

                {/* Bottom Nodes: 3 Child Cards */}
                <div className="w-44 flex items-center justify-between relative z-10 mt-0">
                  {/* Left child node */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-indigo-50 to-indigo-100 border border-indigo-200/80 shadow-sm flex flex-col items-center justify-center text-indigo-600 transition-all hover:scale-105">
                    <i className="bi bi-person-fill text-sm"></i>
                  </div>

                  {/* Center child node (Prominent / Direct Lead) */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-indigo-100 to-indigo-200/90 border border-indigo-300 shadow-md shadow-indigo-500/15 flex flex-col items-center justify-center text-indigo-700 transition-all hover:scale-105 ring-2 ring-indigo-300/40">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] shadow-xs">
                      {selectedSup ? (
                        <span className="font-bold">{selectedSup.name.charAt(0)}</span>
                      ) : (
                        <i className="bi bi-person-fill"></i>
                      )}
                    </div>
                    <span className="text-[8.5px] font-bold text-indigo-950 mt-0.5 truncate max-w-[46px] text-center">
                      {selectedSup ? selectedSup.name.split(" ")[0] : "Lead"}
                    </span>
                  </div>

                  {/* Right child node (Subordinate / Member) */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-indigo-50 to-indigo-100 border border-indigo-200/80 shadow-sm flex flex-col items-center justify-center text-indigo-600 transition-all hover:scale-105">
                    {selectedEmp ? (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold">
                        {selectedEmp.name.charAt(0)}
                      </div>
                    ) : (
                      <i className="bi bi-person-fill text-sm"></i>
                    )}
                  </div>
                </div>

                {/* Dynamic live reporting chain summary chip */}
                {selectedEmp && selectedSup && selectedMgr ? (
                  <div className="mt-3.5 px-3 py-1 rounded-full bg-indigo-50/90 border border-indigo-100/90 text-[10px] font-semibold text-indigo-900 flex items-center gap-1.5 shadow-2xs max-w-full truncate animate-in fade-in">
                    <span className="truncate max-w-[65px]">{selectedMgr.name.split(" ")[0]}</span>
                    <i className="bi bi-chevron-right text-[8px] text-indigo-400"></i>
                    <span className="truncate max-w-[65px] font-bold text-indigo-700">{selectedSup.name.split(" ")[0]}</span>
                    <i className="bi bi-chevron-right text-[8px] text-indigo-400"></i>
                    <span className="truncate max-w-[65px] text-slate-700">{selectedEmp.name.split(" ")[0]}</span>
                  </div>
                ) : (
                  <p className="mt-3.5 text-[10.5px] text-slate-400 text-center font-normal mb-0">
                    Interactive Org Preview
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 sm:px-7 py-3 sm:py-3.5 bg-white border-t border-slate-100 flex items-center justify-end gap-3 relative z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              <i className="bi bi-x-lg text-xs"></i>
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Saving Assignment...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2 text-base font-bold"></i>
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
