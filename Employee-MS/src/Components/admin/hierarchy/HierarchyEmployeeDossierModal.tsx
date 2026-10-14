import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HierarchyMappingItem, UnassignedEmployee } from "./HierarchyTableView";

interface HierarchyEmployeeDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: HierarchyMappingItem | UnassignedEmployee | null;
  onInitiateReassign?: (employee: HierarchyMappingItem) => void;
  onInitiateUnlink?: (employee: HierarchyMappingItem) => void;
  onOpenAssignModal?: (employeeId: string | number) => void;
}

export const HierarchyEmployeeDossierModal: React.FC<HierarchyEmployeeDossierModalProps> = ({
  isOpen,
  onClose,
  employee,
  onInitiateReassign,
  onInitiateUnlink,
  onOpenAssignModal,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !employee) return null;

  const isMapped = "supervisor_id" in employee && Boolean(employee.supervisor_id);
  const mappingItem = isMapped ? (employee as HierarchyMappingItem) : null;
  const empName = "employee_name" in employee ? employee.employee_name : employee.name;
  const empEmail = "employee_email" in employee ? employee.employee_email : employee.email;
  const empId = "employee_id" in employee ? employee.employee_id : employee.id;
  const deptName = employee.department_name || "General Department";

  const handleCopyCard = () => {
    const text = isMapped && mappingItem
      ? `Employee: ${empName} (ID: EMP-${String(empId).padStart(4, "0")})\nEmail: ${empEmail}\nDept: ${deptName}\nSupervisor: ${mappingItem.supervisor_name}\nManager: ${mappingItem.manager_name}`
      : `Employee: ${empName} (ID: EMP-${String(empId).padStart(4, "0")})\nEmail: ${empEmail}\nDept: ${deptName}\nStatus: Unassigned Staff`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="relative p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden">
          {/* Subtle geometric circles */}
          <div className="absolute right-0 top-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-2xl shadow-lg border-2 border-white/20 shrink-0">
                {empName ? empName.charAt(0) : "E"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white mb-0 truncate">
                    {empName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                    EMP-{String(empId).padStart(4, "0")}
                  </span>
                </div>
                <p className="text-xs text-indigo-200/90 mb-1 truncate">{empEmail}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-indigo-900/60 text-indigo-200 border border-indigo-700/60">
                    🏢 {deptName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-semibold border ${
                      isMapped
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    }`}
                  >
                    {isMapped ? "Active Reporting Line" : "Orphaned Staff"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <i className="bi bi-x-lg text-sm"></i>
            </button>
          </div>
        </div>

        {/* Dossier Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Chain of Command Dossier Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Organizational Chain of Command
            </span>

            {isMapped && mappingItem ? (
              <div className="space-y-2.5">
                {/* Department Manager */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs shrink-0">
                      👑
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 block">
                        Department Manager
                      </span>
                      <p className="text-xs font-bold text-slate-900 truncate mb-0">
                        {mappingItem.manager_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    MGR-{String(mappingItem.manager_id).padStart(4, "0")}
                  </span>
                </div>

                {/* Direct Supervisor */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                      🛡️
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-emerald-600 block">
                        Direct Team Lead / Supervisor
                      </span>
                      <p className="text-xs font-bold text-slate-900 truncate mb-0">
                        {mappingItem.supervisor_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    SUP-{String(mappingItem.supervisor_id).padStart(4, "0")}
                  </span>
                </div>

                {/* Mapping Assignment Date */}
                {mappingItem.assigned_at && (
                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Established Date:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(mappingItem.assigned_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <i className="bi bi-person-x text-2xl text-amber-500"></i>
                <p className="text-xs font-bold text-slate-700 mb-0">No Assigned Supervisor or Manager</p>
                <p className="text-[11px] text-slate-400 mb-3">
                  This staff member is currently unassigned and awaiting squad allocation.
                </p>
                {onOpenAssignModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAssignModal(empId);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <i className="bi bi-person-plus-fill"></i>
                    <span>Map Reporting Line Now</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopyCard}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
          >
            <i className={`bi ${copied ? "bi-check2 text-emerald-600 font-bold" : "bi-clipboard"}`}></i>
            <span>{copied ? "Copied to Clipboard!" : "Copy Details"}</span>
          </button>

          <div className="flex items-center gap-2">
            {isMapped && mappingItem && onInitiateReassign && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInitiateReassign(mappingItem);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
              >
                Reallocate
              </button>
            )}

            {isMapped && mappingItem && onInitiateUnlink && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInitiateUnlink(mappingItem);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                Unlink
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HierarchyEmployeeDossierModal;
