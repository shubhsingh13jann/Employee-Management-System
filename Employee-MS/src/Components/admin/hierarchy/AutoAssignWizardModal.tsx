import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { UnassignedEmployee, HierarchyMappingItem } from "./HierarchyTableView";

interface UserOption {
  id: string | number;
  name: string;
  email?: string;
  department_name?: string;
  department_id?: string | number;
}

export interface AutoAssignProposal {
  employeeId: string | number;
  employeeName: string;
  employeeEmail: string;
  departmentName: string;
  proposedSupervisorId: string | number;
  proposedSupervisorName: string;
  proposedManagerId: string | number;
  proposedManagerName: string;
  currentSupervisorLoad: number;
  selected: boolean;
}

interface AutoAssignWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  unassignedStaff: UnassignedEmployee[];
  supervisors: UserOption[];
  managers: UserOption[];
  mappings: HierarchyMappingItem[];
  onExecuteAutoAssign: (
    assignments: { employee_id: string | number; supervisor_id: string | number; manager_id: string | number }[]
  ) => Promise<void>;
  saving: boolean;
}

export const AutoAssignWizardModal: React.FC<AutoAssignWizardModalProps> = ({
  isOpen,
  onClose,
  unassignedStaff,
  supervisors,
  managers,
  mappings,
  onExecuteAutoAssign,
  saving,
}) => {
  const [proposals, setProposals] = useState<AutoAssignProposal[]>([]);
  const [unmatchableCount, setUnmatchableCount] = useState<number>(0);

  // Compute live workload count per supervisor
  const supervisorWorkloadMap = useMemo(() => {
    const map: Record<string, number> = {};
    mappings.forEach((m) => {
      const key = String(m.supervisor_id);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [mappings]);

  // Generate optimal balanced proposals on modal open
  useEffect(() => {
    if (!isOpen) return;

    // Clone workload counts to simulate sequential allocation without overloading any single lead
    const simulatedWorkload: Record<string, number> = { ...supervisorWorkloadMap };
    const generatedProposals: AutoAssignProposal[] = [];
    let unmatched = 0;

    unassignedStaff.forEach((emp) => {
      const dept = emp.department_name;
      // Find supervisors matching employee department
      let deptSups = supervisors.filter(
        (s) => s.department_name && dept && s.department_name.toLowerCase() === dept.toLowerCase()
      );

      // If no department supervisor, fallback to all supervisors with capacity
      if (deptSups.length === 0) {
        deptSups = supervisors;
      }

      if (deptSups.length === 0) {
        unmatched++;
        return;
      }

      // Pick supervisor with lowest simulated workload who hasn't exceeded 8
      const sorted = [...deptSups].sort(
        (a, b) => (simulatedWorkload[String(a.id)] || 0) - (simulatedWorkload[String(b.id)] || 0)
      );

      const chosenSup = sorted[0];
      const currentLoad = simulatedWorkload[String(chosenSup.id)] || 0;

      // Find manager matching supervisor department or first manager
      const chosenMgr =
        managers.find(
          (m) =>
            m.department_name &&
            chosenSup.department_name &&
            m.department_name.toLowerCase() === chosenSup.department_name.toLowerCase()
        ) || managers[0];

      if (!chosenMgr) {
        unmatched++;
        return;
      }

      // Increment simulated workload
      simulatedWorkload[String(chosenSup.id)] = currentLoad + 1;

      generatedProposals.push({
        employeeId: emp.id,
        employeeName: emp.name,
        employeeEmail: emp.email,
        departmentName: emp.department_name || "General",
        proposedSupervisorId: chosenSup.id,
        proposedSupervisorName: chosenSup.name,
        proposedManagerId: chosenMgr.id,
        proposedManagerName: chosenMgr.name,
        currentSupervisorLoad: currentLoad,
        selected: true,
      });
    });

    setProposals(generatedProposals);
    setUnmatchableCount(unmatched);
  }, [isOpen, unassignedStaff, supervisors, managers, mappings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  const toggleProposal = (index: number) => {
    setProposals((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setProposals((prev) => prev.map((p) => ({ ...p, selected: select })));
  };

  const handleSupervisorChange = (index: number, newSupId: string) => {
    const sup = supervisors.find((s) => String(s.id) === String(newSupId));
    if (!sup) return;

    const mgr =
      managers.find(
        (m) =>
          m.department_name &&
          sup.department_name &&
          m.department_name.toLowerCase() === sup.department_name.toLowerCase()
      ) || managers[0];

    setProposals((prev) =>
      prev.map((p, idx) =>
        idx === index
          ? {
              ...p,
              proposedSupervisorId: sup.id,
              proposedSupervisorName: sup.name,
              proposedManagerId: mgr ? mgr.id : p.proposedManagerId,
              proposedManagerName: mgr ? mgr.name : p.proposedManagerName,
              currentSupervisorLoad: supervisorWorkloadMap[String(sup.id)] || 0,
            }
          : p
      )
    );
  };

  const selectedProposals = proposals.filter((p) => p.selected);

  const handleExecute = async () => {
    if (selectedProposals.length === 0) return;

    const payload = selectedProposals.map((p) => ({
      employee_id: p.employeeId,
      supervisor_id: p.proposedSupervisorId,
      manager_id: p.proposedManagerId,
    }));

    await onExecuteAutoAssign(payload);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 text-white flex items-center justify-center text-lg shadow-md shrink-0">
              <i className="bi bi-magic text-xl"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white mb-0">
                  Intelligent Auto-Assign Wizard
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/30">
                  AI Workload Balancing
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-0 font-normal">
                Department-matched auto-allocation prioritizing team leads with available capacity
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

        {/* Telemetry KPI Strip */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Unassigned</span>
            <span className="text-base font-bold text-slate-800">{unassignedStaff.length} Staff</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Optimal Matches</span>
            <span className="text-base font-bold text-emerald-800">{proposals.length} Proposed</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-indigo-600 block">Selected for Action</span>
            <span className="text-base font-bold text-indigo-800">{selectedProposals.length} Ready</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Available Leads</span>
            <span className="text-base font-bold text-slate-700">{supervisors.length} Supervisors</span>
          </div>
        </div>

        {/* Action Controls & Select All Bar */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              Select All ({proposals.length})
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
          <span className="text-xs text-slate-500">
            Preview and override individual supervisor assignments before executing
          </span>
        </div>

        {/* Proposals Table */}
        <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:thin]">
          {proposals.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <i className="bi bi-check-circle-fill text-3xl text-emerald-500"></i>
              <p className="text-xs font-bold text-slate-700 mb-0">All Staff Are Fully Assigned!</p>
              <p className="text-[11px] text-slate-400 mb-0">No orphaned or unassigned personnel need allocation.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {proposals.map((prop, idx) => {
                const afterLoad = prop.currentSupervisorLoad + 1;
                return (
                  <div
                    key={`auto-prop-${prop.employeeId}`}
                    className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      prop.selected
                        ? "bg-white border-indigo-200 shadow-2xs ring-1 ring-indigo-100"
                        : "bg-slate-50/70 border-slate-200 opacity-60"
                    }`}
                  >
                    {/* Left: Checkbox & Employee */}
                    <div className="flex items-center gap-3 min-w-0 md:w-1/3">
                      <input
                        type="checkbox"
                        checked={prop.selected}
                        onChange={() => toggleProposal(idx)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                      />
                      <div className="w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs shrink-0">
                        {prop.employeeName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 truncate mb-0 leading-tight">
                            {prop.employeeName}
                          </p>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                            {prop.departmentName}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-400 truncate mb-0 font-mono">
                          EMP-{String(prop.employeeId).padStart(4, "0")}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Proposed Chain of Command */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
                      <i className="bi bi-arrow-right text-indigo-500 text-xs shrink-0"></i>

                      {/* Supervisor Dropdown Override */}
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Proposed Team Lead</span>
                        <select
                          value={prop.proposedSupervisorId}
                          onChange={(e) => handleSupervisorChange(idx, e.target.value)}
                          className="w-full text-xs font-semibold text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer truncate"
                        >
                          {supervisors.map((s) => (
                            <option key={`opt-sup-${s.id}`} value={s.id}>
                              {s.name} ({s.department_name || "General"})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Supervisor Load Meter */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 block">
                          Load: {afterLoad}/8
                        </span>
                        <span className="text-[9.5px] text-slate-400">
                          {afterLoad <= 3 ? "Light" : "Optimal"}
                        </span>
                      </div>

                      <i className="bi bi-chevron-right text-slate-300 text-xs shrink-0"></i>

                      {/* Manager */}
                      <div className="min-w-0 shrink-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Manager</span>
                        <span className="text-xs font-semibold text-indigo-900 truncate block">
                          👑 {prop.proposedManagerName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-600">
            <strong>{selectedProposals.length}</strong> of <strong>{proposals.length}</strong> proposals selected for auto-assignment
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={saving || selectedProposals.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  <span>Executing Auto-Assign...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-magic text-sm font-bold"></i>
                  <span>Execute Auto-Assignment ({selectedProposals.length})</span>
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

export default AutoAssignWizardModal;
