import React, { useState } from "react";

export interface HierarchyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hierarchy: any[];
  filteredHierarchy: any[];
  unassignedStaff: any[];
  filteredUnassigned: any[];
  activeFiltersDesc?: string;
  onSuccessNotification?: (message: string) => void;
}

export type ExportReportType = "full_roster" | "squad_capacity" | "unassigned_only";
export type ExportScope = "filtered" | "all";

export const HierarchyExportModal: React.FC<HierarchyExportModalProps> = ({
  isOpen,
  onClose,
  hierarchy,
  filteredHierarchy,
  unassignedStaff,
  filteredUnassigned,
  activeFiltersDesc,
  onSuccessNotification,
}) => {
  const [reportType, setReportType] = useState<ExportReportType>("full_roster");
  const [scope, setScope] = useState<ExportScope>("filtered");
  const [includeUnassignedInFull, setIncludeUnassignedInFull] = useState<boolean>(true);
  const [includeChainPath, setIncludeChainPath] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Escape CSV field properly according to RFC 4180
  const escapeCsv = (val: any): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const generateAndDownloadCsv = () => {
    setIsExporting(true);

    try {
      const activeMappings = scope === "filtered" ? filteredHierarchy : hierarchy;
      const activeUnassigned = scope === "filtered" ? filteredUnassigned : unassignedStaff;
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");

      let csvRows: string[] = [];
      let filename = `workforce_hierarchy_${dateStr}_${timeStr}.csv`;

      if (reportType === "full_roster") {
        filename = `workforce_hierarchy_roster_${scope}_${dateStr}.csv`;

        // Headers
        const headers = [
          "Record Type",
          "Employee ID",
          "Employee Name",
          "Employee Email",
          "Department",
          "Team Lead / Supervisor ID",
          "Team Lead / Supervisor Name",
          "Department Manager ID",
          "Department Manager Name",
          "Assignment Status",
          "Assigned At",
        ];
        if (includeChainPath) {
          headers.push("Reporting Line Chain Path");
        }
        csvRows.push(headers.map(escapeCsv).join(","));

        // Rows for Mapped Staff
        activeMappings.forEach((m) => {
          const row = [
            "Active Reporting Line",
            `EMP-${String(m.employee_id).padStart(4, "0")}`,
            m.employee_name || "N/A",
            m.employee_email || "N/A",
            m.department_name || "General",
            `SUP-${String(m.supervisor_id).padStart(4, "0")}`,
            m.supervisor_name || "N/A",
            `MGR-${String(m.manager_id).padStart(4, "0")}`,
            m.manager_name || "N/A",
            "Fully Assigned",
            m.created_at ? new Date(m.created_at).toISOString().split("T")[0] : dateStr,
          ];
          if (includeChainPath) {
            const path = `Executive HQ > ${m.department_name || "General"} Division > ${m.manager_name} (Mgr) > ${m.supervisor_name} (Lead) > ${m.employee_name}`;
            row.push(path);
          }
          csvRows.push(row.map(escapeCsv).join(","));
        });

        // Optional Rows for Unassigned Staff
        if (includeUnassignedInFull) {
          activeUnassigned.forEach((u) => {
            const row = [
              "Orphaned / Unassigned Staff",
              `EMP-${String(u.id).padStart(4, "0")}`,
              u.name || "N/A",
              u.email || "N/A",
              u.department_name || u.department || "Unallocated",
              "N/A",
              "Unassigned",
              "N/A",
              "Unassigned",
              "Awaiting Squad Allocation",
              "Pending",
            ];
            if (includeChainPath) {
              row.push("Pending Squad Mapping");
            }
            csvRows.push(row.map(escapeCsv).join(","));
          });
        }
      } else if (reportType === "squad_capacity") {
        filename = `supervisor_squad_capacity_matrix_${scope}_${dateStr}.csv`;

        // Headers
        const headers = [
          "Supervisor ID",
          "Supervisor Name",
          "Supervisor Email",
          "Department",
          "Department Manager",
          "Direct Reports Count",
          "Target Capacity Limit",
          "Capacity Load %",
          "Span of Control Health Status",
          "Roster Member Names",
        ];
        csvRows.push(headers.map(escapeCsv).join(","));

        // Group mappings by supervisor
        const squadMap = new Map<string | number, {
          supervisorId: string | number;
          supervisorName: string;
          supervisorEmail: string;
          departmentName: string;
          managerName: string;
          members: string[];
        }>();

        activeMappings.forEach((m) => {
          if (!squadMap.has(m.supervisor_id)) {
            squadMap.set(m.supervisor_id, {
              supervisorId: m.supervisor_id,
              supervisorName: m.supervisor_name,
              supervisorEmail: m.supervisor_email || "",
              departmentName: m.department_name || "General",
              managerName: m.manager_name || "General",
              members: [],
            });
          }
          squadMap.get(m.supervisor_id)!.members.push(m.employee_name);
        });

        squadMap.forEach((squad) => {
          const count = squad.members.length;
          const capPercent = Math.min(100, Math.round((count / 8) * 100));
          let healthStatus = "Optimal Span (4-7)";
          if (count <= 3) healthStatus = "Light Load (1-3)";
          else if (count >= 8) healthStatus = "High Span Overload (8+)";

          const row = [
            `SUP-${String(squad.supervisorId).padStart(4, "0")}`,
            squad.supervisorName,
            squad.supervisorEmail || "N/A",
            squad.departmentName,
            squad.managerName,
            count,
            8,
            `${capPercent}%`,
            healthStatus,
            squad.members.join("; "),
          ];
          csvRows.push(row.map(escapeCsv).join(","));
        });
      } else if (reportType === "unassigned_only") {
        filename = `orphaned_unallocated_staff_roster_${scope}_${dateStr}.csv`;

        // Headers
        const headers = [
          "Employee ID",
          "Employee Name",
          "Employee Email",
          "Department",
          "Role",
          "Allocation Status",
          "Onboarding Readiness",
        ];
        csvRows.push(headers.map(escapeCsv).join(","));

        activeUnassigned.forEach((u) => {
          const row = [
            `EMP-${String(u.id).padStart(4, "0")}`,
            u.name || "N/A",
            u.email || "N/A",
            u.department_name || u.department || "General",
            u.role || "Staff",
            "Unassigned",
            "Awaiting Supervisor Squad Assignment",
          ];
          csvRows.push(row.map(escapeCsv).join(","));
        });
      }

      // Prepend UTF-8 BOM so Excel opens with proper character encoding
      const csvString = "\uFEFF" + csvRows.join("\r\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onSuccessNotification) {
        onSuccessNotification(
          `Successfully exported ${reportType === "squad_capacity" ? "squad matrix" : "workforce roster"} to ${filename}`
        );
      }
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 350);
    } catch (err) {
      console.error("CSV Export failed:", err);
      setIsExporting(false);
    }
  };

  const filteredTotalCount =
    reportType === "squad_capacity"
      ? new Set(filteredHierarchy.map((h) => h.supervisor_id)).size
      : reportType === "unassigned_only"
      ? filteredUnassigned.length
      : filteredHierarchy.length + (includeUnassignedInFull ? filteredUnassigned.length : 0);

  const allTotalCount =
    reportType === "squad_capacity"
      ? new Set(hierarchy.map((h) => h.supervisor_id)).size
      : reportType === "unassigned_only"
      ? unassignedStaff.length
      : hierarchy.length + (includeUnassignedInFull ? unassignedStaff.length : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between border-b border-indigo-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center text-lg font-bold shadow-inner">
              <i className="bi bi-file-earmark-spreadsheet-fill"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight flex items-center gap-2">
                <span>Export Hierarchy Roster (CSV)</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Excel & Sheets Ready
                </span>
              </h3>
              <p className="text-xs text-indigo-200/80 mb-0 mt-0.5">
                Download structured organizational chain of command spreadsheets
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

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* 1. Report Type Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block text-xs">
              1. Select Report Structure
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReportType("full_roster")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  reportType === "full_roster"
                    ? "bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-2xs ring-2 ring-indigo-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <i className="bi bi-diagram-3-fill text-indigo-600 text-sm"></i>
                    {reportType === "full_roster" && (
                      <i className="bi bi-check-circle-fill text-indigo-600 text-xs"></i>
                    )}
                  </div>
                  <span className="font-bold block text-xs">Full Roster</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Staff ➔ Lead ➔ Manager mapping rows
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportType("squad_capacity")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  reportType === "squad_capacity"
                    ? "bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-2xs ring-2 ring-indigo-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <i className="bi bi-people-fill text-purple-600 text-sm"></i>
                    {reportType === "squad_capacity" && (
                      <i className="bi bi-check-circle-fill text-indigo-600 text-xs"></i>
                    )}
                  </div>
                  <span className="font-bold block text-xs">Squad Matrix</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Supervisor workload, capacity % & spans
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportType("unassigned_only")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  reportType === "unassigned_only"
                    ? "bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-2xs ring-2 ring-indigo-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <i className="bi bi-exclamation-triangle-fill text-amber-500 text-sm"></i>
                    {reportType === "unassigned_only" && (
                      <i className="bi bi-check-circle-fill text-indigo-600 text-xs"></i>
                    )}
                  </div>
                  <span className="font-bold block text-xs">Orphaned Staff</span>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                    Personnel awaiting squad onboarding
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Scope Selection */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-700 block text-xs">
              2. Data Filtering Scope
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  scope === "filtered"
                    ? "bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-2 ring-indigo-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "filtered"}
                    onChange={() => setScope("filtered")}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="font-bold block text-xs">Active Filtered View</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Exports <strong>{filteredTotalCount}</strong> records matching current search/dept
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  scope === "all"
                    ? "bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-2 ring-indigo-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === "all"}
                    onChange={() => setScope("all")}
                    className="accent-indigo-600"
                  />
                  <div>
                    <span className="font-bold block text-xs">Complete Workforce</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      Exports all <strong>{allTotalCount}</strong> enterprise records
                    </span>
                  </div>
                </div>
              </label>
            </div>
            {scope === "filtered" && activeFiltersDesc && (
              <p className="text-[11px] text-indigo-700 bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-2 mt-1">
                <i className="bi bi-funnel-fill mr-1"></i>
                <span>Active Scope: {activeFiltersDesc}</span>
              </p>
            )}
          </div>

          {/* 3. CSV Options */}
          {reportType === "full_roster" && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-700 block text-xs">
                3. Additional Columns & Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeUnassignedInFull}
                    onChange={(e) => setIncludeUnassignedInFull(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">
                      Include Orphaned / Unallocated Staff Rows
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Appends employees who are currently not assigned to any supervisor squad
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeChainPath}
                    onChange={(e) => setIncludeChainPath(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 text-xs block">
                      Include Visual Chain of Command Breadcrumb Column
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Generates human-readable path (e.g. Executive HQ ➔ Dept ➔ Manager ➔ Lead ➔ Staff)
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Compatibility Note */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <i className="bi bi-shield-check text-emerald-600 text-sm"></i>
              <span>UTF-8 BOM Encoded • Compatible with Excel, Google Sheets, & Numbers</span>
            </div>
            <span className="font-mono text-[10px] font-bold text-slate-400">RFC 4180</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={generateAndDownloadCsv}
            disabled={isExporting || (scope === "filtered" && filteredTotalCount === 0)}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin text-sm"></i>
                <span>Preparing CSV...</span>
              </>
            ) : (
              <>
                <i className="bi bi-download text-sm"></i>
                <span>Download CSV File</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HierarchyExportModal;
