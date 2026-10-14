import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface BatchCandidate {
  id: string | number;
  name: string;
  email: string;
  department_name?: string;
  role?: string;
}

export interface TargetSquadSummary {
  supervisorId: string | number;
  supervisorName: string;
  managerId?: string | number;
  managerName?: string;
  departmentName?: string;
  currentCount?: number;
}

interface SupervisorOption {
  id: string | number;
  name: string;
  department_name?: string;
  department_id?: string | number;
}

interface ManagerOption {
  id: string | number;
  name: string;
  department_name?: string;
  department_id?: string | number;
}

interface BatchOnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCandidates: BatchCandidate[];
  initialTargetSquad?: TargetSquadSummary | null;
  supervisors: SupervisorOption[];
  managers: ManagerOption[];
  onConfirmBatch: (payload: {
    employee_ids: (string | number)[];
    supervisor_id: string | number;
    manager_id: string | number;
  }) => Promise<void>;
  saving: boolean;
}

export const BatchOnboardModal: React.FC<BatchOnboardModalProps> = ({
  isOpen,
  onClose,
  selectedCandidates,
  initialTargetSquad,
  supervisors,
  managers,
  onConfirmBatch,
  saving,
}) => {
  const [activeCandidates, setActiveCandidates] = useState<Set<string | number>>(new Set());
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");
  const [candidateFilter, setCandidateFilter] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setActiveCandidates(new Set(selectedCandidates.map((c) => c.id)));
      if (initialTargetSquad) {
        setSelectedSupervisorId(String(initialTargetSquad.supervisorId));
        if (initialTargetSquad.managerId) {
          setSelectedManagerId(String(initialTargetSquad.managerId));
        } else {
          // Attempt auto-match manager from supervisor's department
          const sup = supervisors.find((s) => String(s.id) === String(initialTargetSquad.supervisorId));
          if (sup && sup.department_name) {
            const matchedMgr = managers.find((m) => m.department_name === sup.department_name);
            if (matchedMgr) setSelectedManagerId(String(matchedMgr.id));
          }
        }
      } else if (supervisors.length > 0) {
        setSelectedSupervisorId(String(supervisors[0].id));
      }
    }
  }, [isOpen, selectedCandidates, initialTargetSquad, supervisors, managers]);

  // When supervisor changes, auto-recommend department manager
  const handleSupervisorChange = (supId: string) => {
    setSelectedSupervisorId(supId);
    const chosenSup = supervisors.find((s) => String(s.id) === String(supId));
    if (chosenSup && chosenSup.department_name) {
      const matchedMgr = managers.find(
        (m) => m.department_name === chosenSup.department_name
      );
      if (matchedMgr) {
        setSelectedManagerId(String(matchedMgr.id));
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  const toggleCandidate = (id: string | number) => {
    setActiveCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedCount = activeCandidates.size;
  const chosenSup = supervisors.find((s) => String(s.id) === String(selectedSupervisorId));
  const chosenMgr = managers.find((m) => String(m.id) === String(selectedManagerId));

  const filteredList = selectedCandidates.filter(
    (c) =>
      c.name.toLowerCase().includes(candidateFilter.toLowerCase()) ||
      c.email.toLowerCase().includes(candidateFilter.toLowerCase()) ||
      (c.department_name && c.department_name.toLowerCase().includes(candidateFilter.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCount === 0 || !selectedSupervisorId) return;

    await onConfirmBatch({
      employee_ids: Array.from(activeCandidates),
      supervisor_id: selectedSupervisorId,
      manager_id: selectedManagerId || (managers.length > 0 ? String(managers[0].id) : "1"),
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-lg shadow-md shrink-0">
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white mb-0">
                  Batch Onboard Personnel
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {selectedCount} Selected
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-0 font-normal">
                Multi-staff bulk allocation directly into target supervisor squad
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4.5 overflow-y-auto max-h-[70vh]">
            
            {/* Target Squad Selection Grid */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 mb-0">
                  <i className="bi bi-diagram-3-fill text-indigo-600"></i>
                  <span>1. Target Destination Squad & Management</span>
                </label>
                {chosenSup && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Dept: {chosenSup.department_name || "General"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Supervisor Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Target Direct Supervisor (Team Lead) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSupervisorId}
                      onChange={(e) => handleSupervisorChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none pr-8 cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Choose Target Supervisor --</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.department_name || "Supervisor"})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                      <i className="bi bi-chevron-down"></i>
                    </div>
                  </div>
                </div>

                {/* Manager Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Department Manager <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none pr-8 cursor-pointer shadow-2xs"
                    >
                      <option value="">-- Choose Department Manager --</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.department_name || "Manager"})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
                      <i className="bi bi-chevron-down"></i>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reporting Line Chain Breadcrumb */}
              {chosenSup && chosenMgr && (
                <div className="pt-2 border-t border-indigo-200/60 flex items-center gap-1.5 text-[11px] text-indigo-900 font-medium">
                  <span className="text-indigo-600 font-bold">Reporting Line:</span>
                  <span className="px-1.5 py-0.5 rounded bg-white font-semibold border border-indigo-200 text-indigo-800">
                    {chosenMgr.name} (Manager)
                  </span>
                  <i className="bi bi-chevron-right text-indigo-400 text-[10px]"></i>
                  <span className="px-1.5 py-0.5 rounded bg-white font-semibold border border-indigo-200 text-indigo-800">
                    {chosenSup.name} (Supervisor)
                  </span>
                  <i className="bi bi-chevron-right text-indigo-400 text-[10px]"></i>
                  <span className="font-bold text-indigo-700">
                    +{selectedCount} Direct Reports
                  </span>
                </div>
              )}
            </div>

            {/* Candidates Roster List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-0">
                  <i className="bi bi-person-lines-fill text-indigo-600"></i>
                  <span>2. Candidate Staff for Squad Onboarding</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCandidates(new Set(selectedCandidates.map((c) => c.id)))}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setActiveCandidates(new Set())}
                    className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Roster Search Bar */}
              <div className="relative mb-2">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  value={candidateFilter}
                  onChange={(e) => setCandidateFilter(e.target.value)}
                  placeholder="Filter selected candidates..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Candidate Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50 [scrollbar-width:thin]">
                {filteredList.map((emp) => {
                  const isChecked = activeCandidates.has(emp.id);
                  return (
                    <div
                      key={`batch-candidate-${emp.id}`}
                      onClick={() => toggleCandidate(emp.id)}
                      className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                        isChecked
                          ? "bg-white border-indigo-300 shadow-2xs ring-1 ring-indigo-200"
                          : "bg-white/60 border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                        />
                        <div className="w-7 h-7 rounded-full bg-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate mb-0 leading-tight">
                            {emp.name}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mb-0">
                            {emp.department_name || "General"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        EMP-{String(emp.id).padStart(4, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-600">
              Ready to assign <strong>{selectedCount}</strong> personnel to squad
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || selectedCount === 0 || !selectedSupervisorId}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span>Onboarding {selectedCount} Personnel...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle text-sm font-bold"></i>
                    <span>Execute Batch Onboarding ({selectedCount})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
