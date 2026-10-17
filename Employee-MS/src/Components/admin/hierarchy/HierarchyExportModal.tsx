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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-[800px] overflow-hidden flex flex-col max-h-[92vh] relative">
        {/* Modal Header with Fluid Pastel Wave Accent */}
        <div className="relative px-6 py-5 bg-white flex items-center justify-between border-b border-slate-100 overflow-hidden">
          {/* Subtle Top-Right Fluid Pastel Wave Background */}
          <div className="absolute top-0 right-0 w-80 h-full pointer-events-none overflow-hidden z-0">
            <svg viewBox="0 0 320 120" fill="none" className="w-full h-full opacity-60">
              <path
                d="M40 0C110 35 170 15 230 55C270 80 295 105 320 120V0H40Z"
                fill="url(#headerWaveGrad1)"
              />
              <path
                d="M100 0C160 30 210 10 260 45C290 65 310 90 320 100V0H100Z"
                fill="url(#headerWaveGrad2)"
                fillOpacity="0.7"
              />
              <defs>
                <linearGradient id="headerWaveGrad1" x1="40" y1="0" x2="320" y2="120" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EEF2FF" />
                  <stop offset="0.5" stopColor="#E0E7FF" />
                  <stop offset="1" stopColor="#F5F3FF" />
                </linearGradient>
                <linearGradient id="headerWaveGrad2" x1="100" y1="0" x2="320" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#DBEAFE" />
                  <stop offset="0.6" stopColor="#EDE9FE" />
                  <stop offset="1" stopColor="#FAE8FF" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-center gap-3.5 relative z-10">
            {/* Google Sheets Icon Squircle */}
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-md shadow-emerald-500/10 flex items-center justify-center p-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex flex-col items-center justify-center p-1.5 shadow-xs">
                <div className="w-full h-full border border-white/40 rounded-xs grid grid-cols-2 grid-rows-3 gap-0.5 p-0.5">
                  <div className="bg-white rounded-2xs"></div>
                  <div className="bg-white rounded-2xs"></div>
                  <div className="bg-white rounded-2xs"></div>
                  <div className="bg-white rounded-2xs"></div>
                  <div className="bg-white rounded-2xs"></div>
                  <div className="bg-white rounded-2xs"></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg text-slate-900 leading-tight tracking-tight mb-0">
                Export Hierarchy Roster (CSV)
              </h3>
              <p className="text-xs text-slate-500 mb-0 mt-0.5">
                Download structured organizational chain of command spreadsheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            {/* Excel & Sheets Ready Pill Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold shadow-2xs">
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                ✓
              </span>
              <span>Excel & Sheets Ready</span>
            </div>

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-xs"></i>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* 1. Select Report Structure */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight mb-0.5">
                  Select Report Structure
                </h4>
                <p className="text-xs text-slate-500 mb-0 leading-tight">
                  Choose the format for exporting the hierarchy data.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Full Roster */}
              <button
                type="button"
                onClick={() => setReportType("full_roster")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  reportType === "full_roster"
                    ? "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border-2 border-indigo-400 shadow-sm"
                    : "bg-white hover:bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {/* Fluid Wave Accent on Selected Card */}
                {reportType === "full_roster" && (
                  <div className="absolute -bottom-1 -right-1 w-24 h-16 pointer-events-none opacity-50 overflow-hidden z-0">
                    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
                      <path
                        d="M0 60C30 40 60 55 85 30C95 18 100 8 100 0V60H0Z"
                        fill="url(#cardWave1)"
                      />
                      <defs>
                        <linearGradient id="cardWave1" x1="0" y1="60" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#E0E7FF" />
                          <stop offset="1" stopColor="#DDD6FE" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-blue-600 text-2xl flex items-center justify-center">
                      <i className="bi bi-diagram-3-fill"></i>
                    </div>
                    {/* Custom Radio Button */}
                    <div
                      className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                        reportType === "full_roster"
                          ? "border-2 border-blue-600 bg-white"
                          : "border-2 border-slate-300 bg-white"
                      }`}
                    >
                      {reportType === "full_roster" && (
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold block text-sm text-slate-900">Full Roster</span>
                  <span className="text-xs text-slate-500 block leading-relaxed mt-0.5">
                    Staff → Lead → Manager mapping rows
                  </span>
                </div>
              </button>

              {/* Card 2: Squad Matrix */}
              <button
                type="button"
                onClick={() => setReportType("squad_capacity")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  reportType === "squad_capacity"
                    ? "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border-2 border-indigo-400 shadow-sm"
                    : "bg-white hover:bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {reportType === "squad_capacity" && (
                  <div className="absolute -bottom-1 -right-1 w-24 h-16 pointer-events-none opacity-50 overflow-hidden z-0">
                    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
                      <path
                        d="M0 60C30 40 60 55 85 30C95 18 100 8 100 0V60H0Z"
                        fill="url(#cardWave2)"
                      />
                      <defs>
                        <linearGradient id="cardWave2" x1="0" y1="60" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#E0E7FF" />
                          <stop offset="1" stopColor="#DDD6FE" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-purple-600 text-2xl flex items-center justify-center">
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <div
                      className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                        reportType === "squad_capacity"
                          ? "border-2 border-blue-600 bg-white"
                          : "border-2 border-slate-300 bg-white"
                      }`}
                    >
                      {reportType === "squad_capacity" && (
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold block text-sm text-slate-900">Squad Matrix</span>
                  <span className="text-xs text-slate-500 block leading-relaxed mt-0.5">
                    Supervisor workload, capacity % & spans
                  </span>
                </div>
              </button>

              {/* Card 3: Orphaned Staff */}
              <button
                type="button"
                onClick={() => setReportType("unassigned_only")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  reportType === "unassigned_only"
                    ? "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border-2 border-indigo-400 shadow-sm"
                    : "bg-white hover:bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {reportType === "unassigned_only" && (
                  <div className="absolute -bottom-1 -right-1 w-24 h-16 pointer-events-none opacity-50 overflow-hidden z-0">
                    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
                      <path
                        d="M0 60C30 40 60 55 85 30C95 18 100 8 100 0V60H0Z"
                        fill="url(#cardWave3)"
                      />
                      <defs>
                        <linearGradient id="cardWave3" x1="0" y1="60" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#E0E7FF" />
                          <stop offset="1" stopColor="#DDD6FE" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-amber-500 text-2xl flex items-center justify-center">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <div
                      className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                        reportType === "unassigned_only"
                          ? "border-2 border-blue-600 bg-white"
                          : "border-2 border-slate-300 bg-white"
                      }`}
                    >
                      {reportType === "unassigned_only" && (
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold block text-sm text-slate-900">Orphaned Staff</span>
                  <span className="text-xs text-slate-500 block leading-relaxed mt-0.5">
                    Personnel awaiting squad onboarding
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Data Filtering Scope */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight mb-0.5">
                  Data Filtering Scope
                </h4>
                <p className="text-xs text-slate-500 mb-0 leading-tight">
                  Choose the scope of data to include in the export.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Active Filtered View */}
              <button
                type="button"
                onClick={() => setScope("filtered")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-center gap-3.5 ${
                  scope === "filtered"
                    ? "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border-2 border-indigo-400 shadow-sm"
                    : "bg-white hover:bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {/* Fluid Wave Accent on Selected Card */}
                {scope === "filtered" && (
                  <div className="absolute -bottom-1 -right-1 w-28 h-16 pointer-events-none opacity-50 overflow-hidden z-0">
                    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
                      <path
                        d="M0 60C30 40 60 55 85 30C95 18 100 8 100 0V60H0Z"
                        fill="url(#scopeWave1)"
                      />
                      <defs>
                        <linearGradient id="scopeWave1" x1="0" y1="60" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#E0E7FF" />
                          <stop offset="1" stopColor="#DDD6FE" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                <div className="relative z-10 flex items-center gap-3.5 w-full">
                  {/* Custom Radio Button */}
                  <div
                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                      scope === "filtered"
                        ? "border-2 border-blue-600 bg-white"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {scope === "filtered" && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>

                  {/* Icon Squircle */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      scope === "filtered"
                        ? "bg-indigo-100 text-indigo-600 shadow-2xs"
                        : "bg-indigo-50/70 text-indigo-500"
                    }`}
                  >
                    <i className="bi bi-funnel-fill"></i>
                  </div>

                  {/* Texts */}
                  <div className="min-w-0 flex-1">
                    <span className="font-bold block text-sm text-slate-900 leading-tight">
                      Active Filtered View
                    </span>
                    <span className="text-xs text-slate-500 block leading-tight mt-0.5 truncate">
                      Exports {filteredTotalCount} records matching current search/dept
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 2: Complete Workforce */}
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex items-center gap-3.5 ${
                  scope === "all"
                    ? "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border-2 border-indigo-400 shadow-sm"
                    : "bg-white hover:bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {scope === "all" && (
                  <div className="absolute -bottom-1 -right-1 w-28 h-16 pointer-events-none opacity-50 overflow-hidden z-0">
                    <svg viewBox="0 0 100 60" fill="none" className="w-full h-full">
                      <path
                        d="M0 60C30 40 60 55 85 30C95 18 100 8 100 0V60H0Z"
                        fill="url(#scopeWave2)"
                      />
                      <defs>
                        <linearGradient id="scopeWave2" x1="0" y1="60" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#E0E7FF" />
                          <stop offset="1" stopColor="#DDD6FE" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}

                <div className="relative z-10 flex items-center gap-3.5 w-full">
                  <div
                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                      scope === "all"
                        ? "border-2 border-blue-600 bg-white"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {scope === "all" && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>

                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      scope === "all"
                        ? "bg-indigo-100 text-indigo-600 shadow-2xs"
                        : "bg-indigo-50/70 text-indigo-500"
                    }`}
                  >
                    <i className="bi bi-database-fill"></i>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-bold block text-sm text-slate-900 leading-tight">
                      Complete Workforce
                    </span>
                    <span className="text-xs text-slate-500 block leading-tight mt-0.5 truncate">
                      Exports all {allTotalCount} enterprise records
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {scope === "filtered" && activeFiltersDesc && (
              <p className="text-[11px] text-indigo-700 bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-3 py-1.5 mt-1 flex items-center gap-1.5">
                <i className="bi bi-funnel-fill text-xs text-indigo-500"></i>
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

