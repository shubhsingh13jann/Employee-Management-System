import React, { useState } from "react";

export interface HierarchyPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchy: any[];
  filteredHierarchy: any[];
  unassignedStaff: any[];
  filteredUnassigned: any[];
  activeFiltersDesc?: string;
  totalMappedCount: number;
  uniqueSupervisorsCount: number;
  uniqueManagersCount: number;
  unassignedCount: number;
}

export const HierarchyPrintModal: React.FC<HierarchyPrintModalProps> = ({
  isOpen,
  onClose,
  hierarchy,
  filteredHierarchy,
  unassignedStaff,
  filteredUnassigned,
  activeFiltersDesc,
  totalMappedCount,
  uniqueSupervisorsCount,
  uniqueManagersCount,
  unassignedCount,
}) => {
  const [scope, setScope] = useState<"filtered" | "all">("filtered");
  const [includeSquadsSummary, setIncludeSquadsSummary] = useState(true);
  const [includeUnassigned, setIncludeUnassigned] = useState(true);

  if (!isOpen) return null;

  const activeMappings = scope === "filtered" ? filteredHierarchy : hierarchy;
  const activeUnassigned = scope === "filtered" ? filteredUnassigned : unassignedStaff;

  // Build squad breakdown
  const squadMap = new Map<
    string | number,
    {
      supervisorId: string | number;
      supervisorName: string;
      departmentName: string;
      managerName: string;
      members: any[];
    }
  >();

  activeMappings.forEach((m) => {
    if (!squadMap.has(m.supervisor_id)) {
      squadMap.set(m.supervisor_id, {
        supervisorId: m.supervisor_id,
        supervisorName: m.supervisor_name,
        departmentName: m.department_name || "General",
        managerName: m.manager_name || "General",
        members: [],
      });
    }
    squadMap.get(m.supervisor_id)!.members.push(m);
  });

  const squadsList = Array.from(squadMap.values());
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    // Hide modal temporarily or print print-target
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header (No Print) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/30 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center text-lg font-bold shadow-inner">
              <i className="bi bi-printer-fill"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>Print Hierarchy Dossier & Roster</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  A4 / Letter Format
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80 mb-0 mt-0.5">
                Executive print layout formatted for paper records, physical audits, and PDF export
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/10"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        {/* Print Configuration Controls Bar (No Print) */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Scope:</span>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="printScope"
                  checked={scope === "filtered"}
                  onChange={() => setScope("filtered")}
                  className="accent-indigo-600"
                />
                <span className="font-medium text-slate-700">Filtered View ({activeMappings.length})</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer ml-2">
                <input
                  type="radio"
                  name="printScope"
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                  className="accent-indigo-600"
                />
                <span className="font-medium text-slate-700">All Workforce ({hierarchy.length})</span>
              </label>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSquadsSummary}
                  onChange={(e) => setIncludeSquadsSummary(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Squads Summary</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUnassigned}
                  onChange={(e) => setIncludeUnassigned(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Unassigned Staff</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 italic">
              Tip: In the browser print dialog, choose &quot;Save as PDF&quot; to export.
            </span>
          </div>
        </div>

        {/* Print Document Preview Area (Printable Container) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 [scrollbar-width:thin]">
          <div
            id="printable-hierarchy-dossier"
            className="bg-white p-6 sm:p-10 rounded-xl border border-slate-300 shadow-sm max-w-3xl mx-auto space-y-6 text-slate-900"
          >
            {/* Corporate Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-md bg-indigo-900 text-white flex items-center justify-center font-bold text-xs">
                    <i className="bi bi-buildings"></i>
                  </div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                    EMS Enterprise Workforce
                  </h1>
                </div>
                <h2 className="text-sm font-bold text-indigo-900">
                  Workforce Team Hierarchy & Reporting Lines Dossier
                </h2>
                <p className="text-[11px] text-slate-500 mb-0 mt-0.5">
                  Official Organizational Chain of Command Audit Record
                </p>
              </div>

              <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                <p className="font-bold text-slate-900 text-xs">CONFIDENTIAL REPORT</p>
                <p>Date: <strong>{currentDate}</strong></p>
                <p>Time: {currentTime}</p>
                <p>Scope: <strong className="capitalize">{scope} View</strong></p>
                {activeFiltersDesc && (
                  <p className="text-[9.5px] text-indigo-700 max-w-[200px] truncate">
                    {activeFiltersDesc}
                  </p>
                )}
              </div>
            </div>

            {/* Executive KPI Summary Bar */}
            <div className="grid grid-cols-4 gap-2 text-center py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Mapped Personnel
                </span>
                <span className="text-base font-black text-slate-900">
                  {activeMappings.length}
                </span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Team Lead Squads
                </span>
                <span className="text-base font-black text-purple-700">
                  {squadsList.length}
                </span>
              </div>
              <div className="border-r border-slate-200 pr-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Dept Managers
                </span>
                <span className="text-base font-black text-emerald-700">
                  {uniqueManagersCount}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Unallocated Staff
                </span>
                <span className="text-base font-black text-amber-600">
                  {activeUnassigned.length}
                </span>
              </div>
            </div>

            {/* Section 1: Detailed Workforce Reporting Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="bi bi-diagram-3 text-indigo-700"></i>
                  <span>1. Detailed Workforce Reporting Relationships ({activeMappings.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500">
                  Ordered by Department & Supervisor
                </span>
              </div>

              {activeMappings.length === 0 ? (
                <p className="text-center py-4 text-xs text-slate-400 italic">
                  No reporting relationships match the selected scope.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="p-2 border-r border-slate-200">Employee ID & Name</th>
                        <th className="p-2 border-r border-slate-200">Department</th>
                        <th className="p-2 border-r border-slate-200">Direct Team Lead (Supervisor)</th>
                        <th className="p-2 border-r border-slate-200">Department Manager</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeMappings.map((item, idx) => (
                        <tr
                          key={`print-row-${item.id || idx}`}
                          className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                        >
                          <td className="p-2 border-r border-slate-200">
                            <span className="font-bold text-slate-900 block">
                              {item.employee_name}
                            </span>
                            <span className="text-[9.5px] text-slate-500 block">
                              EMP-{String(item.employee_id).padStart(4, "0")} • {item.employee_email}
                            </span>
                          </td>
                          <td className="p-2 border-r border-slate-200 font-medium text-slate-800">
                            {item.department_name || "General"}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <span className="font-semibold text-purple-900 block">
                              {item.supervisor_name}
                            </span>
                            <span className="text-[9.5px] text-slate-400">
                              SUP-{String(item.supervisor_id).padStart(4, "0")}
                            </span>
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <span className="font-semibold text-emerald-900 block">
                              {item.manager_name}
                            </span>
                            <span className="text-[9.5px] text-slate-400">
                              MGR-{String(item.manager_id).padStart(4, "0")}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 2: Supervisor Squads & Capacity Overview */}
            {includeSquadsSummary && squadsList.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="bi bi-people text-purple-700"></i>
                    <span>2. Supervisor Squad Roster & Capacity Summary ({squadsList.length} Squads)</span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="p-2 border-r border-slate-200">Team Lead (Supervisor)</th>
                        <th className="p-2 border-r border-slate-200">Division / Manager</th>
                        <th className="p-2 border-r border-slate-200 text-center">Direct Reports</th>
                        <th className="p-2 border-r border-slate-200 text-center">Capacity Load</th>
                        <th className="p-2">Assigned Staff Members</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {squadsList.map((sq, idx) => {
                        const count = sq.members.length;
                        const cap = Math.min(100, Math.round((count / 8) * 100));
                        return (
                          <tr
                            key={`squad-print-${sq.supervisorId}`}
                            className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                          >
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                              {sq.supervisorName}
                              <span className="block text-[9.5px] font-normal text-slate-500">
                                SUP-{String(sq.supervisorId).padStart(4, "0")}
                              </span>
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <span className="font-semibold text-slate-800">{sq.departmentName}</span>
                              <span className="block text-[9.5px] text-slate-400">Mgr: {sq.managerName}</span>
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-900">
                              {count} / 8
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                                  count >= 8
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : count >= 4
                                    ? "bg-indigo-100 text-indigo-900 border border-indigo-300"
                                    : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                }`}
                              >
                                {cap}% • {count >= 8 ? "High Span" : count >= 4 ? "Optimal" : "Light"}
                              </span>
                            </td>
                            <td className="p-2 text-[10px] text-slate-700">
                              {sq.members.map((m) => m.employee_name).join(", ")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 3: Unassigned / Orphaned Personnel */}
            {includeUnassigned && activeUnassigned.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-amber-900">
                    <i className="bi bi-exclamation-triangle-fill text-amber-600"></i>
                    <span>3. Unallocated Personnel Awaiting Squad Assignment ({activeUnassigned.length})</span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-amber-200 bg-amber-50/20">
                    <thead>
                      <tr className="bg-amber-100/70 text-amber-900 text-[10px] font-bold uppercase tracking-wider border-b border-amber-200">
                        <th className="p-2 border-r border-amber-200">Employee ID & Name</th>
                        <th className="p-2 border-r border-amber-200">Email Address</th>
                        <th className="p-2 border-r border-amber-200">Department</th>
                        <th className="p-2">Recommended Next Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-200">
                      {activeUnassigned.map((staff) => (
                        <tr key={`unassigned-print-${staff.id}`}>
                          <td className="p-2 border-r border-amber-200 font-bold text-slate-900">
                            {staff.name}
                            <span className="block text-[9.5px] font-normal text-slate-500">
                              EMP-{String(staff.id).padStart(4, "0")}
                            </span>
                          </td>
                          <td className="p-2 border-r border-amber-200 text-slate-700">
                            {staff.email}
                          </td>
                          <td className="p-2 border-r border-amber-200 font-medium text-slate-800">
                            {staff.department_name || staff.department || "Unallocated"}
                          </td>
                          <td className="p-2 text-amber-800 font-semibold text-[10px]">
                            Assign to active Team Lead squad via Onboarding Tray
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Corporate Audit Footer */}
            <div className="border-t border-slate-300 pt-4 mt-6 flex items-center justify-between text-[9px] text-slate-400">
              <p className="mb-0">
                EMS HR Governance • Workforce Hierarchy Management Module • Section 4.11 Compliance
              </p>
              <p className="mb-0 font-mono">
                Generated {currentDate} • Confidential Internal Document
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer (No Print) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            Close Preview
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2"
            >
              <i className="bi bi-printer-fill text-sm"></i>
              <span>Print Dossier / Export to PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchyPrintModal;

