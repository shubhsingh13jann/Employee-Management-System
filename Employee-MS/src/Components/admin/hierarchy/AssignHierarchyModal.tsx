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

  const isStep1Done = Boolean(form.employee_id);
  const isStep2Done = Boolean(form.supervisor_id);
  const isStep3Done = Boolean(form.manager_id);

  const focusStep = (stepNumber: 1 | 2 | 3) => {
    if (stepNumber === 1) {
      document.getElementById("modal-employee-select")?.focus();
    } else if (stepNumber === 2) {
      document.getElementById("modal-supervisor-select")?.focus();
    } else if (stepNumber === 3) {
      document.getElementById("modal-manager-select")?.focus();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="w-full max-w-[600px] bg-white rounded-3xl sm:rounded-[28px] shadow-2xl shadow-indigo-950/15 border border-slate-100 flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Ambient Vector Fluid Waves matching reference mockup Image 2 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
          {/* Top-Right Fluid Ribbon Waves */}
          <svg
            className="absolute -top-4 -right-4 w-[320px] h-[220px] opacity-75"
            viewBox="0 0 320 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="topWaveGrad1" x1="120" y1="0" x2="320" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.45" />
                <stop offset="35%" stopColor="#A5B4FC" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#C4B5FD" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="topWaveGrad2" x1="180" y1="0" x2="320" y2="180" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.40" />
                <stop offset="50%" stopColor="#C084FC" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#F5F3FF" stopOpacity="0.08" />
              </linearGradient>
              <linearGradient id="topWaveGrad3" x1="220" y1="0" x2="320" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            <path
              d="M 90 0 C 140 70, 200 130, 320 110 L 320 0 Z"
              fill="url(#topWaveGrad1)"
            />
            <path
              d="M 130 0 C 180 100, 240 170, 320 190 L 320 0 Z"
              fill="url(#topWaveGrad2)"
            />
            <path
              d="M 180 0 C 220 60, 270 100, 320 80 L 320 0 Z"
              fill="url(#topWaveGrad3)"
            />
          </svg>

          {/* Bottom-Right Fluid Ribbon Waves */}
          <svg
            className="absolute -bottom-4 -right-4 w-[300px] h-[200px] opacity-70"
            viewBox="0 0 300 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="botWaveGrad1" x1="300" y1="200" x2="80" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C084FC" stopOpacity="0.40" />
                <stop offset="40%" stopColor="#818CF8" stopOpacity="0.35" />
                <stop offset="80%" stopColor="#A5B4FC" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="botWaveGrad2" x1="300" y1="200" x2="150" y2="80" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.30" />
                <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path
              d="M 80 200 C 140 140, 220 100, 300 120 L 300 200 Z"
              fill="url(#botWaveGrad1)"
            />
            <path
              d="M 140 200 C 190 120, 240 70, 300 40 L 300 200 Z"
              fill="url(#botWaveGrad2)"
            />
          </svg>
        </div>

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between relative z-10 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-xs shrink-0">
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
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-xs disabled:opacity-50 shrink-0"
            title="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Form Body with Left Stepped Timeline & Right 3D Org Chart */}
        <form onSubmit={handleLocalSubmit} className="flex flex-col flex-1 relative z-10 overflow-hidden">
          <div className="px-5 sm:px-6 pt-3.5 pb-3 overflow-y-auto max-h-[calc(85vh-120px)]">
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

            <div className="flex flex-col lg:flex-row gap-3.5 items-start">
              {/* Left Column: Stepped Form with Functional Vertical Timeline */}
              <div className="flex-1 min-w-0 space-y-0">
                {/* Step 1: Subordinate Employee */}
                <div className="relative flex items-start gap-3">
                  {/* Timeline connector column */}
                  <div className="flex flex-col items-center self-stretch">
                    <button
                      type="button"
                      onClick={() => focusStep(1)}
                      title="Step 1: Select Subordinate Employee"
                      className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full font-bold text-xs flex items-center justify-center shrink-0 z-10 transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                        isStep1Done
                          ? "bg-gradient-to-br from-emerald-500 to-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-4 ring-emerald-50"
                          : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 ring-4 ring-indigo-100/80 animate-pulse"
                      }`}
                    >
                      {isStep1Done ? <i className="bi bi-check-lg text-xs font-extrabold"></i> : "1"}
                    </button>
                    <div
                      className={`w-0.5 flex-1 my-1 transition-all duration-300 ${
                        isStep1Done
                          ? "bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full shadow-xs"
                          : "border-l-2 border-dashed border-slate-200"
                      }`}
                    ></div>
                  </div>

                  {/* Step 1 Content */}
                  <div className="flex-1 pb-2.5 sm:pb-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <label
                        htmlFor="modal-employee-select"
                        className="text-xs sm:text-[13px] font-semibold text-slate-900 mb-0 cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        Select Subordinate Employee <span className="text-rose-500 font-bold">*</span>
                      </label>
                      {selectedEmp?.department_name && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
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
                        id="modal-employee-select"
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
                <div className="relative flex items-start gap-3">
                  {/* Timeline connector column */}
                  <div className="flex flex-col items-center self-stretch">
                    <button
                      type="button"
                      onClick={() => focusStep(2)}
                      title="Step 2: Select Direct Supervisor"
                      className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full font-bold text-xs flex items-center justify-center shrink-0 z-10 transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                        isStep2Done
                          ? "bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-emerald-50"
                          : isStep1Done
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100/80 animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-200 ring-2 ring-slate-50"
                      }`}
                    >
                      {isStep2Done ? <i className="bi bi-check-lg text-xs font-extrabold"></i> : "2"}
                    </button>
                    <div
                      className={`w-0.5 flex-1 my-1 transition-all duration-300 ${
                        isStep2Done
                          ? "bg-gradient-to-b from-blue-500 to-fuchsia-500 rounded-full shadow-xs"
                          : "border-l-2 border-dashed border-slate-200"
                      }`}
                    ></div>
                  </div>

                  {/* Step 2 Content */}
                  <div className="flex-1 pb-2.5 sm:pb-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <label
                        htmlFor="modal-supervisor-select"
                        className="text-xs sm:text-[13px] font-semibold text-slate-900 mb-0 cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        Select Direct Supervisor (Team Lead) <span className="text-rose-500 font-bold">*</span>
                      </label>
                      {selectedSup && (
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
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
                        id="modal-supervisor-select"
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
                <div className="relative flex items-start gap-3">
                  {/* Timeline marker without trailing line */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => focusStep(3)}
                      title="Step 3: Select Department Manager"
                      className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full font-bold text-xs flex items-center justify-center shrink-0 z-10 transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                        isStep3Done
                          ? "bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-md shadow-fuchsia-500/30 ring-4 ring-fuchsia-100"
                          : isStep2Done
                          ? "border-2 border-fuchsia-500 bg-white text-fuchsia-600 ring-4 ring-fuchsia-100 animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-200 ring-2 ring-slate-50"
                      }`}
                    >
                      {isStep3Done ? <i className="bi bi-check-lg text-xs font-extrabold"></i> : "3"}
                    </button>
                  </div>

                  {/* Step 3 Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <label
                        htmlFor="modal-manager-select"
                        className="text-xs sm:text-[13px] font-semibold text-slate-900 mb-0 cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        Select Department Manager <span className="text-rose-500 font-bold">*</span>
                      </label>
                      {selectedMgr && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
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
                        id="modal-manager-select"
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

              {/* Right Column: 3D Illustrated Org Chart Graphic - Snug next to form */}
              <div className="hidden lg:flex w-44 shrink-0 flex-col items-center justify-center relative self-center py-1 select-none">
                {/* Orbital Dashed Ring & Sparkle Accents */}
                <div className="absolute w-40 h-40 rounded-full border border-dashed border-indigo-200/70 pointer-events-none"></div>
                <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-400 animate-pulse"></div>
                <div className="absolute top-2 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400"></div>
                <div className="absolute bottom-6 right-3 w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                <div className="absolute top-14 right-0 w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                <div className="absolute bottom-8 left-3 w-1 h-1 rounded-full bg-blue-400"></div>

                {/* Top Node: Manager 3D Card */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100/95 via-indigo-100/75 to-purple-100/60 border border-indigo-200/90 shadow-md shadow-indigo-500/15 flex flex-col items-center justify-center p-1.5 relative z-10 transition-transform duration-300 hover:scale-105 group">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs shadow-sm">
                    {selectedMgr ? (
                      <span className="font-bold">{selectedMgr.name.charAt(0)}</span>
                    ) : (
                      <i className="bi bi-person-fill"></i>
                    )}
                  </div>
                  <span className="text-[8.5px] font-bold text-indigo-900 mt-0.5 truncate max-w-[56px] text-center">
                    {selectedMgr ? selectedMgr.name.split(" ")[0] : "Manager"}
                  </span>
                </div>

                {/* Tree Connecting Branch Lines */}
                <div className="flex flex-col items-center relative z-0">
                  {/* Stem down from manager */}
                  <div className="w-0.5 h-3 bg-indigo-400/90"></div>
                  {/* Horizontal bar */}
                  <div className="w-32 h-0.5 bg-indigo-400/90 relative"></div>
                  {/* 3 Vertical drops to children */}
                  <div className="w-32 flex justify-between">
                    <div className="w-0.5 h-3 bg-indigo-400/90"></div>
                    <div className="w-0.5 h-3 bg-indigo-400/90"></div>
                    <div className="w-0.5 h-3 bg-indigo-400/90"></div>
                  </div>
                </div>

                {/* Bottom Nodes: 3 Child Cards */}
                <div className="w-36 flex items-center justify-between relative z-10 mt-0">
                  {/* Left child node */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-indigo-50 to-indigo-100 border border-indigo-200/80 shadow-xs flex flex-col items-center justify-center text-indigo-600 transition-all hover:scale-105">
                    <i className="bi bi-person-fill text-xs"></i>
                  </div>

                  {/* Center child node (Prominent / Direct Lead) */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-indigo-100 to-indigo-200/90 border border-indigo-300 shadow-sm flex flex-col items-center justify-center text-indigo-700 transition-all hover:scale-105 ring-2 ring-indigo-300/40">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] shadow-xs">
                      {selectedSup ? (
                        <span className="font-bold">{selectedSup.name.charAt(0)}</span>
                      ) : (
                        <i className="bi bi-person-fill"></i>
                      )}
                    </div>
                    <span className="text-[7.5px] font-bold text-indigo-950 mt-0.5 truncate max-w-[36px] text-center">
                      {selectedSup ? selectedSup.name.split(" ")[0] : "Lead"}
                    </span>
                  </div>

                  {/* Right child node (Subordinate / Member) */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-indigo-50 to-indigo-100 border border-indigo-200/80 shadow-xs flex flex-col items-center justify-center text-indigo-600 transition-all hover:scale-105">
                    {selectedEmp ? (
                      <div className="w-4.5 h-4.5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8.5px] font-bold">
                        {selectedEmp.name.charAt(0)}
                      </div>
                    ) : (
                      <i className="bi bi-person-fill text-xs"></i>
                    )}
                  </div>
                </div>

                {/* Dynamic live reporting chain summary chip */}
                {selectedEmp && selectedSup && selectedMgr ? (
                  <div className="mt-2.5 px-2.5 py-1 rounded-full bg-indigo-50/90 border border-indigo-100/90 text-[9px] font-semibold text-indigo-900 flex items-center gap-1 shadow-2xs max-w-full truncate animate-in fade-in">
                    <span className="truncate max-w-[50px]">{selectedMgr.name.split(" ")[0]}</span>
                    <i className="bi bi-chevron-right text-[7px] text-indigo-400"></i>
                    <span className="truncate max-w-[50px] font-bold text-indigo-700">{selectedSup.name.split(" ")[0]}</span>
                    <i className="bi bi-chevron-right text-[7px] text-indigo-400"></i>
                    <span className="truncate max-w-[50px] text-slate-700">{selectedEmp.name.split(" ")[0]}</span>
                  </div>
                ) : (
                  <p className="mt-2.5 text-[9.5px] text-slate-400 text-center font-normal mb-0">
                    Interactive Org Preview
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="px-5 sm:px-6 py-3 sm:py-3.5 bg-white border-t border-slate-100 flex items-center justify-end gap-3 relative z-10">
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
