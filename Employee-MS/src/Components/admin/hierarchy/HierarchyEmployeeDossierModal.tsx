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

  const establishedDate = mappingItem?.assigned_at
    ? new Date(mappingItem.assigned_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Oct 9, 2026";

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
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        <div
          className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Wave Background matching reference */}
          <div className="relative px-6 py-4 sm:py-5 bg-white flex items-center justify-between border-b border-slate-100/90 overflow-hidden shrink-0">
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
                  <mask id="dossierWaveFadeMask">
                    <linearGradient id="dossierWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="18%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#dossierWaveFadeGrad)" />
                  </mask>

                  {/* Wave 1: Soft Sky-Blue / Periwinkle Gradient */}
                  <linearGradient id="dossierWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                  </linearGradient>

                  {/* Wave 2: Richer Lavender / Violet Sweep */}
                  <linearGradient id="dossierWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                  </linearGradient>

                  {/* Wave 3: Subtle Pastel Ribbon Glow */}
                  <linearGradient id="dossierWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <g mask="url(#dossierWaveFadeMask)">
                  {/* Layer 1: Broad soft background crest */}
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#dossierWaveGrad1)"
                  />
                  {/* Layer 2: Main curved ribbon */}
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#dossierWaveGrad2)"
                  />
                  {/* Layer 3: Soft swoop ribbon sweeping under actions */}
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#dossierWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left: Electric Gradient Squircle Avatar + Name & Information Badges */}
            <div className="flex items-center gap-3.5 sm:gap-4 relative z-10 min-w-0">
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-indigo-500/25 shrink-0 border border-white/20">
                {empName ? empName.charAt(0).toUpperCase() : "E"}
              </div>

              <div className="min-w-0">
                {/* Employee Name + EMP-ID Pill */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 mb-0 tracking-tight leading-tight truncate">
                    {empName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50/80 text-indigo-700 border border-indigo-100/90 shadow-2xs">
                    EMP-{String(empId).padStart(4, "0")}
                  </span>
                </div>

                {/* Subtitle Email */}
                <p className="text-xs sm:text-[13px] text-slate-400 mb-1.5 font-normal leading-tight truncate mt-0.5">
                  {empEmail}
                </p>

                {/* Meta Pills: Department & Active Status */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Department Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50/60 text-indigo-700 border border-indigo-100/80 shadow-2xs">
                    <i className="bi bi-building text-[11px] text-indigo-600"></i>
                    <span>{deptName}</span>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold shadow-2xs border ${
                      isMapped
                        ? "bg-emerald-50/80 text-emerald-700 border-emerald-100"
                        : "bg-amber-50/80 text-amber-700 border-amber-100"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isMapped ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-amber-500"
                      }`}
                    ></span>
                    <span>{isMapped ? "Active Reporting Line" : "Orphaned Staff"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Rounded Square Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs relative z-10"
              title="Close"
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Body Content Placeholder for Feature 1 (To be expanded in Features 2 & 3) */}
          <div className="p-6 space-y-4">
            {/* Chain of Command Dossier Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Organizational Chain of Command
              </span>
              {isMapped && mappingItem ? (
                <div className="space-y-2.5">
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
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <i className="bi bi-person-x text-2xl text-amber-500"></i>
                  <p className="text-xs font-bold text-slate-700 mb-0">No Assigned Supervisor or Manager</p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 bg-white border-t border-slate-100/90 flex items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleCopyCard}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-2"
            >
              <i className={`bi ${copied ? "bi-check2 text-emerald-600 font-bold" : "bi-clipboard"}`}></i>
              <span>{copied ? "Copied to Clipboard!" : "Copy Details"}</span>
            </button>

            {isMapped && mappingItem && onInitiateReassign && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInitiateReassign(mappingItem);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-50/60 hover:bg-indigo-100/70 text-indigo-600 border border-indigo-200/80 shadow-2xs transition-all cursor-pointer flex items-center gap-2"
              >
                <i className="bi bi-arrow-repeat text-xs"></i>
                <span>Reallocate</span>
              </button>
            )}

            {isMapped && mappingItem && onInitiateUnlink && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onInitiateUnlink(mappingItem);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50/70 bg-rose-50/40 border border-rose-200 shadow-2xs transition-all cursor-pointer flex items-center gap-2"
              >
                <i className="bi bi-link-45deg text-xs"></i>
                <span>Unlink</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <i className="bi bi-x-lg text-xs"></i>
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HierarchyEmployeeDossierModal;
