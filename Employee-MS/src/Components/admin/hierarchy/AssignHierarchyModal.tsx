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

  // Peer subordinates reporting to the selected supervisor
  const peerSubordinates = useMemo(() => {
    if (!form.supervisor_id || !mappings) return [];
    return mappings.filter(
      (m) =>
        String(m.supervisor_id) === String(form.supervisor_id) &&
        String(m.employee_id) !== String(form.employee_id)
    );
  }, [form.supervisor_id, form.employee_id, mappings]);

  const peer1Name = peerSubordinates[0]?.employee_name || "Dwight Schrute";
  const peer1Id = peerSubordinates[0]?.employee_id
    ? `EMP-${String(peerSubordinates[0].employee_id).padStart(4, "0")}`
    : "EMP-0002";
  const peer2Name = peerSubordinates[1]?.employee_name || "Kevin Malone";
  const peer2Id = peerSubordinates[1]?.employee_id
    ? `EMP-${String(peerSubordinates[1].employee_id).padStart(4, "0")}`
    : "EMP-0003";

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
  const activeStep = !form.employee_id ? 1 : !form.supervisor_id ? 2 : 3;

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
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={saving ? undefined : onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        <div
          className="w-full max-w-4xl lg:max-w-[935px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Wave Background matching reference */}
          <div className="relative px-4 sm:px-5 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
            {/* Top-Right Fluid Pastel Wave Background */}
            <div className="absolute top-0 right-0 w-[420px] sm:w-[540px] h-full pointer-events-none overflow-hidden z-0">
              <svg
                viewBox="0 0 500 74"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  {/* Left fade mask to seamlessly blend into pure white */}
                  <mask id="assignWaveFadeMask">
                    <linearGradient id="assignWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="18%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#assignWaveFadeGrad)" />
                  </mask>

                  {/* Wave 1: Soft Sky-Blue / Periwinkle Gradient */}
                  <linearGradient id="assignWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                  </linearGradient>

                  {/* Wave 2: Richer Lavender / Violet Sweep */}
                  <linearGradient id="assignWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                  </linearGradient>

                  {/* Wave 3: Subtle Pastel Ribbon Glow */}
                  <linearGradient id="assignWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <g mask="url(#assignWaveFadeMask)">
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#assignWaveGrad1)"
                  />
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#assignWaveGrad2)"
                  />
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#assignWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left: Hierarchy Icon + Title & Subtitle */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 border border-indigo-100/90 text-indigo-600 flex items-center justify-center text-lg shadow-2xs shrink-0">
                <i className="bi bi-diagram-3-fill"></i>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-0 tracking-tight leading-tight truncate">
                  Map Employee to Team Hierarchy
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mb-0 font-normal leading-tight mt-0.5 truncate">
                  Assign subordinate employees to their direct supervisor and department manager to establish clear reporting structures
                </p>
              </div>
            </div>

            {/* Right: Rounded Square Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-8.5 h-8.5 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs disabled:opacity-50 relative z-10 shrink-0"
              title="Close"
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

        {/* Form Body: Left Stepper Navigation, Center Form Fields, and Right Live Hierarchy Preview */}
        <form onSubmit={handleLocalSubmit} className="flex flex-col flex-1 relative z-10 overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 overflow-y-auto max-h-[calc(88vh-140px)] [scrollbar-width:thin]">
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

            <div className="flex flex-col md:flex-row gap-3.5 sm:gap-4 items-start">
              {/* 1. Left Vertical Stepper Navigation matching reference */}
              <div className="hidden md:flex w-48 lg:w-52 shrink-0 flex-col py-0.5 select-none">
                {/* Step 1 Item */}
                <div
                  onClick={() => focusStep(1)}
                  className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeStep === 1
                      ? "bg-indigo-50/80 border border-indigo-100 shadow-2xs"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                        isStep1Done
                          ? "bg-emerald-500 text-white shadow-2xs"
                          : activeStep === 1
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {isStep1Done ? <i className="bi bi-check-lg text-xs font-extrabold"></i> : "1"}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block leading-tight truncate ${activeStep === 1 ? "text-indigo-900" : "text-slate-700"}`}>
                        Select Employee
                      </span>
                      <span className={`text-[10px] block leading-tight truncate mt-0.5 ${activeStep === 1 ? "text-indigo-500 font-medium" : "text-slate-400"}`}>
                        Choose the employee to map
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connecting Dashed Line 1 to 2 */}
                <div className="pl-[21px] py-0.5">
                  <div className={`w-0 border-l-2 border-dashed h-6 ${isStep1Done ? "border-indigo-400" : "border-slate-300"}`}></div>
                </div>

                {/* Step 2 Item */}
                <div
                  onClick={() => focusStep(2)}
                  className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeStep === 2
                      ? "bg-indigo-50/80 border border-indigo-100 shadow-2xs"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                        isStep2Done
                          ? "bg-emerald-500 text-white shadow-2xs"
                          : activeStep === 2
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {isStep2Done ? <i className="bi bi-check-lg text-xs font-extrabold"></i> : "2"}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block leading-tight truncate ${activeStep === 2 ? "text-indigo-900" : "text-slate-700"}`}>
                        Select Team Lead
                      </span>
                      <span className={`text-[10px] block leading-tight truncate mt-0.5 ${activeStep === 2 ? "text-indigo-500 font-medium" : "text-slate-400"}`}>
                        Assign direct supervisor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connecting Dashed Line 2 to 3 */}
                <div className="pl-[21px] py-0.5">
                  <div className={`w-0 border-l-2 border-dashed h-6 ${isStep2Done ? "border-indigo-400" : "border-slate-300"}`}></div>
                </div>

                {/* Step 3 Item */}
                <div
                  onClick={() => focusStep(3)}
                  className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeStep === 3
                      ? "bg-indigo-50/80 border border-indigo-100 shadow-2xs"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                        isStep3Done
                          ? "bg-emerald-500 text-white shadow-2xs"
                          : activeStep === 3
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {isStep3Done ? <i className="bi bi-check-lg text-xs font-extrabold"></i> : "3"}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block leading-tight truncate ${activeStep === 3 ? "text-indigo-900" : "text-slate-700"}`}>
                        Select Department Manager
                      </span>
                      <span className={`text-[10px] block leading-tight truncate mt-0.5 ${activeStep === 3 ? "text-indigo-500 font-medium" : "text-slate-400"}`}>
                        Assign department manager
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Center Column: Form Inputs & Supervisor Capacity Card */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Step 1: Subordinate Employee */}
                <div className="space-y-1.5" onClick={() => focusStep(1)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0 mt-0.5">
                        <i className="bi bi-person"></i>
                      </div>
                      <div>
                        <label
                          htmlFor="modal-employee-select"
                          className="text-xs sm:text-[12.5px] font-bold text-slate-900 block leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                          1. Select Subordinate Employee <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <p className="text-[10.5px] text-slate-400 font-normal leading-tight mt-0.5 mb-0">
                          Choose the employee who will be mapped to the team hierarchy.
                        </p>
                      </div>
                    </div>
                    {selectedEmp?.department_name && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                        {selectedEmp.department_name}
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-2xs overflow-hidden h-[38px] sm:h-[40px]">
                    <div className="w-10 h-full flex items-center justify-center border-r border-slate-100 text-indigo-600 text-sm shrink-0 bg-slate-50/40">
                      <i className="bi bi-person"></i>
                    </div>
                    <select
                      id="modal-employee-select"
                      value={form.employee_id}
                      onChange={(e) => handleEmployeeChange(e.target.value)}
                      required
                      className="w-full h-full py-1.5 px-3 bg-transparent text-xs sm:text-[13px] text-slate-800 font-medium focus:outline-none cursor-pointer appearance-none pr-8"
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

                {/* Step 2: Direct Supervisor (Team Lead) */}
                <div className="space-y-1.5" onClick={() => focusStep(2)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 mt-0.5">
                        <i className="bi bi-people"></i>
                      </div>
                      <div>
                        <label
                          htmlFor="modal-supervisor-select"
                          className="text-xs sm:text-[12.5px] font-bold text-slate-900 block leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                          2. Select Direct Supervisor (Team Lead) <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <p className="text-[10.5px] text-slate-400 font-normal leading-tight mt-0.5 mb-0">
                          Choose the team lead who will directly supervise the selected employee.
                        </p>
                      </div>
                    </div>
                    {selectedSup && (
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
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

                  <div className="relative flex items-center rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-2xs overflow-hidden h-[38px] sm:h-[40px]">
                    <div className="w-10 h-full flex items-center justify-center border-r border-slate-100 text-blue-600 text-sm shrink-0 bg-slate-50/40">
                      <i className="bi bi-people"></i>
                    </div>
                    <select
                      id="modal-supervisor-select"
                      value={form.supervisor_id}
                      onChange={(e) => handleSupervisorChange(e.target.value)}
                      required
                      className="w-full h-full py-1.5 px-3 bg-transparent text-xs sm:text-[13px] text-slate-800 font-medium focus:outline-none cursor-pointer appearance-none pr-8"
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
                    <div className="mt-2 p-2.5 sm:p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                            {selectedSup.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="text-xs sm:text-[12.5px] font-bold text-slate-900 mb-0 leading-tight">
                              {selectedSup.name}
                            </h5>
                            <p className="text-[10px] text-slate-500 mb-0 font-medium leading-tight mt-0.5">
                              SUP-{String(selectedSup.id).padStart(4, "0")} • {selectedSup.department_name || "General"} • Direct Supervisor
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

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10.5px]">
                          <span className="font-semibold text-slate-600">
                            Workload Capacity: <span className="font-bold text-slate-900">{currentSupLoad} / 8</span> reports
                          </span>
                          <span className="font-mono text-slate-500 font-semibold">
                            {Math.min(100, Math.round((currentSupLoad / 8) * 100))}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden flex">
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

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                        <span className="flex items-center gap-1 text-slate-600">
                          <i className="bi bi-info-circle text-indigo-500 text-[10.5px]"></i>
                          After: <strong className="text-slate-800">{newSupLoad} / 8 reports</strong>
                        </span>
                        {newSupLoad <= 8 ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <i className="bi bi-check-circle-fill text-[9.5px]"></i> Within Span
                          </span>
                        ) : (
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <i className="bi bi-exclamation-triangle-fill text-[9.5px]"></i> Exceeding 8 Capacity
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 flex items-center gap-2.5 text-slate-500">
                      <div className="text-indigo-400 text-sm pr-2 border-r border-slate-200 flex items-center justify-center shrink-0">
                        <i className="bi bi-speedometer2"></i>
                      </div>
                      <p className="text-[10.5px] text-slate-400 mb-0 font-normal leading-snug">
                        Select a supervisor above to preview live team workload and mentorship capacity.
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 3: Department Manager */}
                <div className="space-y-1.5" onClick={() => focusStep(3)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 text-xs font-bold shrink-0 mt-0.5">
                        <i className="bi bi-building"></i>
                      </div>
                      <div>
                        <label
                          htmlFor="modal-manager-select"
                          className="text-xs sm:text-[12.5px] font-bold text-slate-900 block leading-tight cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                          3. Select Department Manager <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <p className="text-[10.5px] text-slate-400 font-normal leading-tight mt-0.5 mb-0">
                          Choose the department manager under whom this employee will be assigned.
                        </p>
                      </div>
                    </div>
                    {selectedMgr && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
                        {selectedMgr.department_name || "Manager"}
                      </span>
                    )}
                  </div>

                  <div className="relative flex items-center rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-2xs overflow-hidden h-[38px] sm:h-[40px]">
                    <div className="w-10 h-full flex items-center justify-center border-r border-slate-100 text-purple-600 text-sm shrink-0 bg-slate-50/40">
                      <i className="bi bi-building"></i>
                    </div>
                    <select
                      id="modal-manager-select"
                      value={form.manager_id}
                      onChange={(e) => onFormChange({ ...form, manager_id: e.target.value })}
                      required
                      className="w-full h-full py-1.5 px-3 bg-transparent text-xs sm:text-[13px] text-slate-800 font-medium focus:outline-none cursor-pointer appearance-none pr-8"
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

              {/* Right Column: Live Hierarchy Preview Tree */}
              <div className="hidden lg:flex w-72 lg:w-[310px] shrink-0 flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-2.5 sm:p-3 select-none shadow-2xs">
                {/* Header with Live Preview Badge */}
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/70">
                    <div className="flex items-center gap-1.5">
                      <i className="bi bi-diagram-3-fill text-indigo-600 text-xs"></i>
                      <span className="text-xs font-bold text-slate-800">Hierarchy Preview</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Live Preview
                    </span>
                  </div>

                  {/* 1. Top Node: Department Manager */}
                  <div className="w-full bg-white rounded-xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs flex items-center gap-2.5 hover:border-purple-300 transition-colors">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {selectedMgr ? selectedMgr.name.charAt(0).toUpperCase() : "M"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                        {selectedMgr ? selectedMgr.name : "Select Manager"}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate leading-tight mt-0.5 font-medium">
                        {selectedMgr ? `MGR-${String(selectedMgr.id).padStart(4, "0")} • Department Manager` : "Department Manager"}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Connector Line from Manager to Supervisor */}
                  <div className="w-0.5 h-3 bg-slate-300 mx-auto"></div>

                  {/* 2. Middle Node: Direct Supervisor */}
                  <div className="w-full bg-blue-50/40 rounded-xl border border-blue-200/90 p-2 sm:p-2.5 shadow-2xs flex items-center justify-between gap-2 hover:border-blue-400 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {selectedSup ? selectedSup.name.charAt(0).toUpperCase() : "S"}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
                          {selectedSup ? selectedSup.name : "Select Supervisor"}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate leading-tight mt-0.5 font-medium">
                          {selectedSup ? `SUP-${String(selectedSup.id).padStart(4, "0")} • Team Lead` : "Team Lead / Supervisor"}
                        </span>
                      </div>
                    </div>
                    {selectedSup && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          currentSupLoad <= 3
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : currentSupLoad <= 7
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {currentSupLoad} Reports
                      </span>
                    )}
                  </div>

                  {/* Tree Connector Lines from Supervisor to 3 Subordinates */}
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-2.5 bg-slate-300"></div>
                    <div className="w-[82%] h-0.5 bg-slate-300"></div>
                    <div className="w-[82%] flex justify-between">
                      <div className="w-0.5 h-2.5 bg-slate-300"></div>
                      <div className="w-0.5 h-2.5 bg-slate-300"></div>
                      <div className="w-0.5 h-2.5 bg-slate-300"></div>
                    </div>
                  </div>

                  {/* 3. Bottom Row: 3 Subordinate Cards (Selected Employee highlighted) */}
                  <div className="flex items-stretch justify-between gap-1.5 mt-0.5">
                    {/* Child 1: Selected Employee */}
                    <div className="flex-1 min-w-0 rounded-xl border-2 border-indigo-500 bg-indigo-50/90 p-1.5 sm:p-2 shadow-2xs flex flex-col items-center text-center relative ring-2 ring-indigo-200/50">
                      <span className="text-[7.5px] font-extrabold text-indigo-700 uppercase tracking-wider mb-1 px-1 py-0.2 rounded bg-indigo-200/70 block w-full truncate">
                        You (Selected)
                      </span>
                      <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs shrink-0">
                        {selectedEmp ? selectedEmp.name.charAt(0).toUpperCase() : "A"}
                      </div>
                      <span className="text-[10px] font-bold text-indigo-950 block truncate w-full mt-1 leading-tight">
                        {selectedEmp ? selectedEmp.name.split(" ")[0] : "Employee"}
                      </span>
                      <span className="text-[8.5px] text-indigo-500 block truncate w-full font-medium leading-tight mt-0.5">
                        {selectedEmp ? `EMP-${String(selectedEmp.id).padStart(4, "0")}` : "EMP-0001"}
                      </span>
                    </div>

                    {/* Child 2: Peer Subordinate 1 */}
                    <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white p-1.5 sm:p-2 shadow-2xs flex flex-col items-center text-center">
                      <span className="text-[7.5px] font-medium text-slate-400 mb-1 block w-full truncate">
                        Peer Report
                      </span>
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {peer1Name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 block truncate w-full mt-1 leading-tight">
                        {peer1Name.split(" ")[0]}
                      </span>
                      <span className="text-[8.5px] text-slate-400 block truncate w-full font-medium leading-tight mt-0.5">
                        {peer1Id}
                      </span>
                    </div>

                    {/* Child 3: Peer Subordinate 2 */}
                    <div className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white p-1.5 sm:p-2 shadow-2xs flex flex-col items-center text-center">
                      <span className="text-[7.5px] font-medium text-slate-400 mb-1 block w-full truncate">
                        Peer Report
                      </span>
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {peer2Name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 block truncate w-full mt-1 leading-tight">
                        {peer2Name.split(" ")[0]}
                      </span>
                      <span className="text-[8.5px] text-slate-400 block truncate w-full font-medium leading-tight mt-0.5">
                        {peer2Id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Informational Note matching mockup */}
                <div className="mt-3 p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-start gap-2 shadow-2xs">
                  <i className="bi bi-info-circle-fill text-indigo-500 text-xs shrink-0 mt-0.5"></i>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight mb-0">
                    Assigning will update team reporting relationships and calculate updated capacity scores.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-t border-slate-200/90 flex items-center justify-end gap-2.5 relative z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs sm:text-[13px] font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200/90 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
            >
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs sm:text-[13px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
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
      </div>
    </div>,
    document.body
  );
};
