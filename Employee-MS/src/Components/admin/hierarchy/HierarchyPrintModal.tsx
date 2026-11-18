import React, { useState } from "react";
import {
  UniversalPrintStudio,
  PrintScopeOption,
  PrintSectionToggle,
} from "../../custom/print";

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
  const [scope, setScope] = useState<string>("filtered");
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    squads: true,
    unassigned: true,
  });

  if (!isOpen) return null;

  const scopes: PrintScopeOption[] = [
    {
      id: "filtered",
      label: "Filtered View",
      count: filteredHierarchy.length,
      icon: "bi bi-funnel",
    },
    {
      id: "all",
      label: "All Workforce",
      count: hierarchy.length,
      icon: "bi bi-database",
    },
  ];

  const currentUnassigned = scope === "filtered" ? filteredUnassigned : unassignedStaff;

  const sections: PrintSectionToggle[] = [
    {
      id: "squads",
      label: "Squads Summary",
      description: "Include supervisor squad roster and capacity summary",
      icon: "bi bi-people-fill",
      defaultChecked: true,
    },
    {
      id: "unassigned",
      label: "Unassigned Staff",
      description: "Include staff who are not assigned to any supervisor",
      icon: "bi bi-person-fill",
      count: currentUnassigned.length,
      defaultChecked: true,
    },
  ];

  const activeMappings = scope === "filtered" ? filteredHierarchy : hierarchy;
  const activeUnassigned = currentUnassigned;

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

  return (
    <UniversalPrintStudio
      isOpen={isOpen}
      onClose={onClose}
      title="Print Hierarchy Dossier & Roster"
      subtitle="Executive print layout formatted for paper records, physical audits, and PDF export"
      icon="bi bi-printer-fill"
      scopes={scopes}
      activeScope={scope}
      onScopeChange={(s) => setScope(s)}
      sections={sections}
      activeSections={activeSections}
      onToggleSection={(secId, enabled) =>
        setActiveSections((prev) => ({ ...prev, [secId]: enabled }))
      }
      defaultPageSize="a4"
      defaultOrientation="portrait"
      defaultMargins="standard"
      defaultHeaderStyle="default"
      renderContent={({
        pageSize,
        orientation,
        margins,
        headerStyle,
        currentDate,
        currentTime,
      }) => (
        <div className="space-y-4">
          {/* Header Style Renderer */}
          {headerStyle === "executive" ? (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl shadow-sm border border-slate-800 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5.5 h-5.5 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[11px] shadow-sm shrink-0">
                    <i className="bi bi-shield-check"></i>
                  </div>
                  <div
                    style={{ fontSize: "14px", letterSpacing: "0.06em" }}
                    className="font-black text-amber-300 uppercase whitespace-nowrap"
                  >
                    EMS Enterprise Workforce
                  </div>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-widest">
                    Executive Dossier
                  </span>
                </div>
                <div
                  style={{ fontSize: "12.6px" }}
                  className="font-bold text-white whitespace-nowrap"
                >
                  Workforce Team Hierarchy & Reporting Lines Dossier
                </div>
                <div
                  style={{ fontSize: "10px" }}
                  className="text-slate-300 mb-0 mt-0.5 whitespace-nowrap"
                >
                  Official Organizational Chain of Command Audit Record
                </div>
              </div>

              <div
                style={{ fontSize: "10px" }}
                className="text-right text-slate-300 space-y-0.5 shrink-0"
              >
                <div
                  style={{ fontSize: "10.5px" }}
                  className="font-bold text-amber-300 tracking-wider uppercase mb-0.5"
                >
                  CONFIDENTIAL BRIEFING
                </div>
                <p className="mb-0">Date: <strong className="text-white">{currentDate}</strong></p>
                <p className="mb-0">Time: <span className="text-slate-200">{currentTime}</span></p>
                <p className="mb-0">Scope: <strong className="capitalize text-white">{scope === "filtered" ? "Filtered View" : "All Workforce"}</strong></p>
                <p className="mb-0">Format: <strong className="uppercase text-amber-300">{pageSize} • {orientation}</strong></p>
              </div>
            </div>
          ) : headerStyle === "minimal" ? (
            <div className="border-b border-slate-200 pb-2.5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
                    EMS Workforce
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-semibold text-slate-700">Hierarchy Dossier</span>
                </div>
                <div style={{ fontSize: "10px" }} className="text-slate-400 mb-0">
                  Official reporting lines audit record
                </div>
              </div>

              <div
                style={{ fontSize: "9.5px" }}
                className="text-right text-slate-500 flex items-center gap-3 shrink-0"
              >
                <div>Date: <strong className="text-slate-700">{currentDate}</strong></div>
                <div>Scope: <strong className="capitalize text-slate-700">{scope === "filtered" ? "Filtered" : "All"}</strong></div>
                <div>Format: <strong className="uppercase text-slate-700">{pageSize}</strong></div>
              </div>
            </div>
          ) : (
            /* Corporate Default Header */
            <div className="border-b-2 border-slate-900 pb-2.5 sm:pb-3 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5.5 h-5.5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10.5px] shadow-2xs shrink-0">
                    <i className="bi bi-bar-chart-fill"></i>
                  </div>
                  <div
                    style={{ fontSize: "13.75px", lineHeight: "1.2", letterSpacing: "0.05em" }}
                    className="font-bold text-slate-900 uppercase whitespace-nowrap"
                  >
                    EMS Enterprise Workforce
                  </div>
                </div>
                <div
                  style={{ fontSize: "12.6px", lineHeight: "1.3" }}
                  className="font-semibold text-slate-800 whitespace-nowrap"
                >
                  Workforce Team Hierarchy & Reporting Lines Dossier
                </div>
                <div
                  style={{ fontSize: "10px", lineHeight: "1.2" }}
                  className="text-slate-500 mb-0 mt-0.5 whitespace-nowrap"
                >
                  Official Organizational Chain of Command Audit Record
                </div>
              </div>

              <div
                style={{ fontSize: "10px", lineHeight: "1.3" }}
                className="text-right text-slate-600 space-y-0.5 shrink-0"
              >
                <div
                  style={{ fontSize: "10.5px" }}
                  className="font-bold text-slate-900 tracking-wider uppercase mb-0.5"
                >
                  CONFIDENTIAL REPORT
                </div>
                <p className="mb-0">Date: <strong className="text-slate-800">{currentDate}</strong></p>
                <p className="mb-0">Time: <span className="text-slate-700">{currentTime}</span></p>
                <p className="mb-0">Scope: <strong className="capitalize text-slate-800">{scope === "filtered" ? "Filtered View" : "All Workforce"}</strong></p>
                <p className="mb-0">Page Size: <strong className="uppercase text-slate-800">{pageSize.toUpperCase()}</strong></p>
                <p className="mb-0">Orientation: <strong className="capitalize text-slate-800">{orientation}</strong></p>
                {activeFiltersDesc && (
                  <p style={{ fontSize: "9.5px" }} className="text-indigo-700 max-w-[200px] truncate mb-0">
                    {activeFiltersDesc}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Executive KPI Summary Bar */}
          <div className="grid grid-cols-4 gap-2 text-center py-2 px-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <div className="border-r border-slate-100 pr-2">
              <span className="text-[8.5px] sm:text-[9px] text-slate-400 uppercase font-semibold tracking-wider block">
                Mapped Personnel
              </span>
              <span className="text-sm sm:text-base font-bold text-blue-600 block mt-0.5">
                {activeMappings.length}
              </span>
            </div>
            <div className="border-r border-slate-100 pr-2">
              <span className="text-[8.5px] sm:text-[9px] text-slate-400 uppercase font-semibold tracking-wider block">
                Team Lead Squads
              </span>
              <span className="text-sm sm:text-base font-bold text-purple-600 block mt-0.5">
                {squadsList.length}
              </span>
            </div>
            <div className="border-r border-slate-100 pr-2">
              <span className="text-[8.5px] sm:text-[9px] text-slate-400 uppercase font-semibold tracking-wider block">
                Dept Managers
              </span>
              <span className="text-sm sm:text-base font-bold text-emerald-600 block mt-0.5">
                {uniqueManagersCount}
              </span>
            </div>
            <div>
              <span className="text-[8.5px] sm:text-[9px] text-slate-400 uppercase font-semibold tracking-wider block">
                Unallocated Staff
              </span>
              <span className="text-sm sm:text-base font-bold text-amber-600 block mt-0.5">
                {activeUnassigned.length}
              </span>
            </div>
          </div>

          {/* Section 1: Detailed Workforce Reporting Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
              <div
                style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                className="font-bold text-slate-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
              >
                <i className="bi bi-diagram-3 text-blue-600" style={{ fontSize: "12.6px" }}></i>
                <span>1. Detailed Workforce Reporting Relationships ({activeMappings.length})</span>
              </div>
              <span
                style={{ fontSize: "9.5px" }}
                className="text-slate-400 font-normal whitespace-nowrap shrink-0"
              >
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
                    <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-2.5 py-1.5 border-r border-slate-200">Employee ID & Name</th>
                      <th className="px-2.5 py-1.5 border-r border-slate-200">Department</th>
                      <th className="px-2.5 py-1.5 border-r border-slate-200">Direct Team Lead (Supervisor)</th>
                      <th className="px-2.5 py-1.5 border-r border-slate-200">Department Manager</th>
                      <th className="px-2.5 py-1.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {activeMappings.map((item, idx) => (
                      <tr
                        key={`print-row-${item.id || idx}`}
                        className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                      >
                        <td className="px-2.5 py-1.5 border-r border-slate-200">
                          <span className="font-bold text-slate-900 block leading-tight">
                            {item.employee_name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 block font-mono">
                            EMP-{String(item.employee_id).padStart(4, "0")} • {item.employee_email}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-slate-200 font-medium text-slate-800">
                          {item.department_name || "General"}
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-slate-200">
                          <span className="font-semibold text-purple-700 block leading-tight">
                            {item.supervisor_name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            SUP-{String(item.supervisor_id).padStart(4, "0")}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-slate-200">
                          <span className="font-semibold text-emerald-700 block leading-tight">
                            {item.manager_name}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            MGR-{String(item.manager_id).padStart(4, "0")}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active Chain
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Supervisor Squad Breakdown */}
          {activeSections.squads && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                <div
                  style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                  className="font-bold text-slate-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
                >
                  <i className="bi bi-people-fill text-purple-600" style={{ fontSize: "12.6px" }}></i>
                  <span>2. Operational Squad Rosters & Capacity Summary ({squadsList.length})</span>
                </div>
                <span
                  style={{ fontSize: "9.5px" }}
                  className="text-slate-400 font-normal whitespace-nowrap shrink-0"
                >
                  Team Lead direct reports
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {squadsList.map((sq) => (
                  <div
                    key={`squad-print-${sq.supervisorId}`}
                    className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 break-inside-avoid"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200">
                      <div>
                        <div className="font-bold text-xs text-slate-900 leading-tight">
                          {sq.supervisorName}
                        </div>
                        <div className="text-[9.5px] text-slate-500 font-medium mt-0.5">
                          {sq.departmentName} • Reports to:{" "}
                          <strong className="text-slate-700">{sq.managerName}</strong>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-100 text-purple-800 shrink-0">
                        {sq.members.length} member{sq.members.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <ul className="space-y-1 mb-0 pl-0 list-none">
                      {sq.members.map((mem) => (
                        <li
                          key={`squad-member-${mem.id || mem.employee_id}`}
                          className="flex items-center justify-between text-[10.5px] py-0.5"
                        >
                          <span className="font-medium text-slate-800 truncate pr-2">
                            • {mem.employee_name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono shrink-0">
                            EMP-{String(mem.employee_id).padStart(4, "0")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Unassigned Personnel */}
          {activeSections.unassigned && activeUnassigned.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-300">
                <div
                  style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                  className="font-bold text-amber-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
                >
                  <i className="bi bi-exclamation-triangle-fill text-amber-600" style={{ fontSize: "12.6px" }}></i>
                  <span>3. Unallocated Personnel Awaiting Squad Assignment ({activeUnassigned.length})</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse border border-amber-200 bg-amber-50/20">
                  <thead>
                    <tr className="bg-amber-100/70 text-amber-900 text-[10px] font-bold uppercase tracking-wider border-b border-amber-200">
                      <th className="px-2.5 py-1.5 border-r border-amber-200">Employee ID & Name</th>
                      <th className="px-2.5 py-1.5 border-r border-amber-200">Email Address</th>
                      <th className="px-2.5 py-1.5 border-r border-amber-200">Department</th>
                      <th className="px-2.5 py-1.5">Recommended Next Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-200">
                    {activeUnassigned.map((staff) => (
                      <tr key={`unassigned-print-${staff.id}`}>
                        <td className="px-2.5 py-1.5 border-r border-amber-200 font-bold text-slate-900">
                          {staff.name}
                          <span className="block text-[9.5px] font-normal text-slate-500">
                            EMP-{String(staff.id).padStart(4, "0")}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-amber-200 text-slate-700">
                          {staff.email}
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-amber-200 font-medium text-slate-800">
                          {staff.department_name || staff.department || "Unallocated"}
                        </td>
                        <td className="px-2.5 py-1.5 text-amber-800 font-semibold text-[10px]">
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
      )}
    />
  );
};

export default HierarchyPrintModal;
