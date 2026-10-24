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

          {/* Body: Two-Column Layout matching reference image */}
          <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Organizational Chain of Command */}
            <div className="lg:col-span-7 flex flex-col justify-between border border-slate-200/80 rounded-3xl p-4 sm:p-5 bg-white shadow-2xs">
              <div>
                {/* Header: Title with Hierarchy Icon + Established Date Badge */}
                <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 border-b border-slate-100/80">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 border border-indigo-100/90 text-indigo-600 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
                      <i className="bi bi-diagram-3-fill"></i>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug truncate mb-0">
                        Organizational Chain of Command
                      </h4>
                      <p className="text-xs text-slate-400 font-normal leading-tight mt-0.5 truncate mb-0">
                        Reporting hierarchy for this employee
                      </p>
                    </div>
                  </div>

                  {/* Established Date Box */}
                  <div className="px-3 py-1.5 rounded-xl bg-indigo-50/50 border border-indigo-100/80 flex items-center gap-2.5 shadow-2xs shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100/70 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                      <i className="bi bi-calendar3"></i>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                        Established Date
                      </span>
                      <span className="text-xs sm:text-[12.5px] font-bold text-slate-800 leading-tight block">
                        {isMapped && mappingItem ? establishedDate : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connected Timeline & Hierarchy Cards */}
                {isMapped && mappingItem ? (
                  <div className="relative pl-7 sm:pl-8 space-y-3 mb-4">
                    {/* Vertical connecting dashed line running between center of top dot and bottom dot */}
                    <div className="absolute left-[11px] sm:left-[13px] top-6 bottom-6 w-0 border-l-2 border-dashed border-slate-300/80 pointer-events-none"></div>

                    {/* Node 1: Department Manager */}
                    <div className="relative">
                      {/* Purple Dot with white ring */}
                      <div className="absolute -left-7 sm:-left-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-100 shadow-2xs flex items-center justify-center z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>

                      {/* Department Manager Card */}
                      <div className="rounded-2xl bg-purple-50/40 border border-purple-100/90 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:bg-purple-50/60 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                            👑
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-purple-700 block leading-tight">
                              DEPARTMENT MANAGER
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight block mt-0.5 truncate">
                              {mappingItem.manager_name}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs font-mono tracking-wide border border-slate-200/60 shrink-0">
                          MGR-{String(mappingItem.manager_id).padStart(4, "0")}
                        </span>
                      </div>
                    </div>

                    {/* Node 2: Direct Team Lead / Supervisor */}
                    <div className="relative">
                      {/* Green Dot with white ring */}
                      <div className="absolute -left-7 sm:-left-8 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shadow-2xs flex items-center justify-center z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>

                      {/* Direct Team Lead Card */}
                      <div className="rounded-2xl bg-emerald-50/40 border border-emerald-100/90 p-3 sm:p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:bg-emerald-50/60 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-100/70 text-sky-600 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                            🛡️
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-700 block leading-tight">
                              DIRECT TEAM LEAD / SUPERVISOR
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight block mt-0.5 truncate">
                              {mappingItem.supervisor_name}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs font-mono tracking-wide border border-slate-200/60 shrink-0">
                          SUP-{String(mappingItem.supervisor_id).padStart(4, "0")}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 px-4 text-center rounded-2xl border-2 border-dashed border-amber-200/80 bg-amber-50/30 my-3">
                    <i className="bi bi-person-exclamation text-3xl text-amber-500 mb-2 block"></i>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                      No Assigned Reporting Hierarchy
                    </h5>
                    <p className="text-xs text-slate-400 mb-3 max-w-sm mx-auto">
                      This employee is currently orphaned or unassigned and has no direct supervisor or manager assigned.
                    </p>
                    {onOpenAssignModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAssignModal(empId);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <i className="bi bi-person-plus-fill"></i>
                        <span>Assign Hierarchy Now</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Info Note Box */}
              <div className="rounded-2xl bg-indigo-50/30 border border-indigo-100/70 p-3 sm:p-3.5 flex items-center gap-3 mt-1">
                <i className="bi bi-info-circle text-indigo-500 text-base sm:text-lg shrink-0"></i>
                <p className="text-xs text-slate-500 font-normal leading-relaxed mb-0">
                  This shows the current organizational reporting chain for {empName} based on department structure.
                </p>
              </div>
            </div>

            {/* Right Column: Temporary placeholder for Feature 3 */}
            <div className="lg:col-span-5 flex flex-col justify-between border border-slate-200/80 rounded-3xl p-4 sm:p-5 bg-white shadow-2xs">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100/80">
                  <i className="bi bi-person text-indigo-600 text-base"></i>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-0">
                    Employee Details
                  </h4>
                </div>
                <div className="space-y-3 text-xs text-slate-600">
                  <div><strong>Email:</strong> {empEmail}</div>
                  <div><strong>Employee ID:</strong> EMP-{String(empId).padStart(4, "0")}</div>
                  <div><strong>Department:</strong> {deptName}</div>
                  <div><strong>Status:</strong> {isMapped ? "Active Reporting Line" : "Orphaned Staff"}</div>
                </div>
              </div>
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
