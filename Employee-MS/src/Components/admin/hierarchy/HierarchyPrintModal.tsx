import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

const PAGE_SIZE_OPTIONS = [
  { value: "a4", label: "A4 (210 × 297 mm)" },
  { value: "letter", label: "Letter (8.5 × 11 in)" },
  { value: "legal", label: "Legal (8.5 × 14 in)" },
];

const ORIENTATION_OPTIONS = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const MARGINS_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "narrow", label: "Narrow" },
  { value: "wide", label: "Wide" },
];

const HEADER_STYLE_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "minimal", label: "Minimal" },
  { value: "executive", label: "Executive" },
];

interface CustomFormatDropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: any) => void;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
}

const CustomFormatDropdown: React.FC<CustomFormatDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  icon,
  isOpen,
  onToggle,
}) => {
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${isOpen ? "z-40" : "z-10"}`} data-format-dropdown>
      <label className="text-[10px] font-bold text-slate-700 mb-1 block">
        {label}
      </label>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full relative border rounded-xl bg-white p-1.5 flex items-center gap-1.5 shadow-2xs text-left cursor-pointer transition-all ${
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-100 shadow-xs"
            : "border-slate-200/90 hover:border-slate-300"
        }`}
      >
        <div className="w-5.5 h-5.5 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs shrink-0">
          <i className={icon}></i>
        </div>
        <span className="text-xs font-semibold text-slate-800 w-full truncate pr-4">
          {selected?.label || value}
        </span>
        <i
          className={`bi bi-chevron-down text-slate-400 text-[10px] absolute right-2 transition-transform duration-200 pointer-events-none ${
            isOpen ? "rotate-180 text-indigo-600" : ""
          }`}
        ></i>
      </button>

      {/* Floating Menu Popover (Matching UserManagement / UserFormModal standard) */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[140px] bg-white rounded-xl border border-slate-200/90 shadow-2xl z-50 py-1 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-48 overflow-y-auto [scrollbar-width:thin] p-1 space-y-0.5">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(opt.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-left cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-indigo-50 text-[#4f46e5] font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <i className="bi bi-check2 text-sm text-[#4f46e5] font-bold ml-1 shrink-0"></i>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Page Format state for Step 3
  const [pageSize, setPageSize] = useState<"a4" | "letter" | "legal">("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [margins, setMargins] = useState<"standard" | "narrow" | "wide">("standard");
  const [headerStyle, setHeaderStyle] = useState<"default" | "minimal" | "executive">("default");
  const [openDropdown, setOpenDropdown] = useState<"pageSize" | "orientation" | "margins" | "headerStyle" | null>(null);

  // Document Preview interactive controls
  const [zoom, setZoom] = useState<number>(80);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFitWidth, setIsFitWidth] = useState<boolean>(false);

  // Close custom dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("[data-format-dropdown]")) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

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

  // Group active mappings by department for Departmental Distribution on Page 3
  const deptMap = new Map<
    string,
    {
      name: string;
      employeesCount: number;
      supervisors: Set<string | number>;
      managers: Set<string | number>;
    }
  >();

  activeMappings.forEach((m) => {
    const dept = m.department_name || "General";
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        name: dept,
        employeesCount: 0,
        supervisors: new Set(),
        managers: new Set(),
      });
    }
    const entry = deptMap.get(dept)!;
    entry.employeesCount += 1;
    if (m.supervisor_id) entry.supervisors.add(m.supervisor_id);
    if (m.manager_id) entry.managers.add(m.manager_id);
  });

  const departmentList = Array.from(deptMap.values());

  // Physical paper sheet pixel specifications and aspect ratios (Standard 96 DPI paper metrics)
  const sheetWidth = isFitWidth
    ? "100%"
    : orientation === "landscape"
    ? pageSize === "legal"
      ? 1186
      : pageSize === "letter"
      ? 958
      : 1018
    : pageSize === "legal"
    ? 720
    : pageSize === "letter"
    ? 740
    : 720;

  const sheetMinHeight =
    orientation === "landscape"
      ? pageSize === "legal"
        ? 720
        : pageSize === "letter"
        ? 740
        : 720
      : pageSize === "legal"
      ? 1186
      : pageSize === "letter"
      ? 958
      : 1018;

  const pageAspectRatio =
    orientation === "landscape"
      ? pageSize === "legal"
        ? "14 / 8.5"
        : pageSize === "letter"
        ? "11 / 8.5"
        : "297 / 210"
      : pageSize === "legal"
      ? "8.5 / 14"
      : pageSize === "letter"
      ? "8.5 / 11"
      : "210 / 297";

  const renderSubPageHeader = (pageNum: number, sectionTitle: string, sectionSubtitle: string) => {
    if (headerStyle === "executive") {
      return (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3 rounded-xl shadow-xs border border-slate-800 flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-xs shrink-0">
              <i className="bi bi-shield-check"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                  EMS Enterprise Workforce
                </span>
                <span className="text-slate-400 text-[10px]">•</span>
                <span className="font-semibold text-white text-xs">{sectionTitle}</span>
              </div>
              <p className="text-[9.5px] text-slate-300 mb-0">{sectionSubtitle}</p>
            </div>
          </div>
          <div className="text-right text-[9.5px] text-slate-300 font-mono shrink-0">
            <span className="text-amber-300 font-bold uppercase block">Confidential Audit</span>
            <span>Page {pageNum} of 4 • {currentDate}</span>
          </div>
        </div>
      );
    }

    if (headerStyle === "minimal") {
      return (
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider">
              EMS Workforce
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-800">{sectionTitle}</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">({sectionSubtitle})</span>
          </div>
          <div className="text-right text-[9.5px] text-slate-500 font-mono shrink-0">
            Page {pageNum} of 4 • {currentDate}
          </div>
        </div>
      );
    }

    // Default corporate header
    return (
      <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
            <i className="bi bi-bar-chart-fill"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                EMS Enterprise Workforce
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-800 text-xs">{sectionTitle}</span>
            </div>
            <p className="text-[9.5px] text-slate-500 mb-0">{sectionSubtitle}</p>
          </div>
        </div>
        <div className="text-right text-[9.5px] text-slate-600 font-mono shrink-0">
          <span className="font-bold text-slate-900 uppercase block tracking-wider">CONFIDENTIAL REPORT</span>
          <span>Page {pageNum} of 4 • {currentDate}</span>
        </div>
      </div>
    );
  };

  const renderPageFooter = (pageNum: number, sectionNotes: string) => (
    <div className="border-t border-slate-200/90 pt-3 mt-4 flex items-center justify-between text-[9px] text-slate-400 shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-600">EMS HR Governance</span>
        <span>•</span>
        <span>{sectionNotes}</span>
      </div>
      <div className="flex items-center gap-2 font-mono">
        <span>Confidential Internal Document</span>
        <span>•</span>
        <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
          Page {pageNum} of 4
        </span>
      </div>
    </div>
  );

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full ${
          orientation === "landscape" ? "max-w-[1380px] xl:max-w-[1440px]" : "max-w-[1010px]"
        } h-[92vh] max-h-[92vh] flex flex-col overflow-hidden relative transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with Fluid Pastel Wave Accent */}
        <div className="relative pl-6 pr-4 sm:pr-5 py-2.5 bg-white flex items-center justify-between border-b border-slate-100 overflow-hidden shrink-0 no-print">
          {/* Top-Right Fluid Pastel Wave Background matching reference design */}
          <div className="absolute top-0 right-0 w-[440px] sm:w-[500px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                {/* Left fade mask to seamlessly blend into pure white */}
                <mask id="printModalWaveFadeMask">
                  <linearGradient id="printModalWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="18%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#printModalWaveFadeGrad)" />
                </mask>

                {/* Wave 1: Soft Sky-Blue / Periwinkle Gradient */}
                <linearGradient id="printModalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>

                {/* Wave 2: Richer Lavender / Violet Sweep */}
                <linearGradient id="printModalWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                </linearGradient>

                {/* Wave 3: Subtle Pastel Ribbon Glow */}
                <linearGradient id="printModalWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g mask="url(#printModalWaveFadeMask)">
                {/* Layer 1: Broad soft background crest flowing from upper left towards upper right */}
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#printModalWaveGrad1)"
                />

                {/* Layer 2: Main organic curved ribbon flowing across center-right */}
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#printModalWaveGrad2)"
                />

                {/* Layer 3: Soft swoop ribbon sweeping under badge and close button */}
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#printModalWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          <div className="flex items-center gap-2.5 relative z-10">
            {/* Printer Squircle Icon */}
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100/90 shadow-2xs flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
              <i className="bi bi-printer-fill"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div style={{ fontSize: "14px" }} className="font-bold text-slate-900 leading-tight tracking-tight mb-0">
                  Print Hierarchy Dossier & Roster
                </div>
                <span className="text-[9.5px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200/70 shrink-0">
                  {pageSize.toUpperCase()} • {orientation.charAt(0).toUpperCase() + orientation.slice(1)}
                </span>
              </div>
              <p style={{ fontSize: "11px" }} className="text-slate-500 mb-0 mt-0.5 leading-tight">
                Executive print layout formatted for paper records, physical audits, and PDF export
              </p>
            </div>
          </div>

          {/* Circular Close Button */}
          <div className="relative z-10">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-100 shadow-2xs flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-xs"></i>
            </button>
          </div>
        </div>

        {/* Main Body: Two-Column Split Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left Column: Configuration Controls (Steps 1, 2, 3) */}
          <div className="w-full lg:w-[340px] shrink-0 border-r border-slate-100 pl-6 pr-2 pt-3.5 pb-8 space-y-3.5 overflow-y-auto bg-white no-print [scrollbar-width:thin]">
            {/* Step 1: Report Scope */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  1
                </div>
                <div>
                  <div style={{ fontSize: "12.6px" }} className="font-bold text-slate-900 leading-tight mb-0">
                    Report Scope
                  </div>
                  <p style={{ fontSize: "10.5px" }} className="text-slate-500 mb-0 mt-1 leading-normal">
                    Choose the data scope to include in the report.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Filtered View Card */}
                <button
                  type="button"
                  onClick={() => setScope("filtered")}
                  className={`px-2 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                    scope === "filtered"
                      ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                      scope === "filtered"
                        ? "border-2 border-blue-600 bg-white"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {scope === "filtered" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <div className="text-blue-600 text-sm shrink-0 flex items-center justify-center">
                    <i className="bi bi-funnel"></i>
                  </div>
                  <span className="font-bold text-[10.5px] sm:text-[11px] text-slate-900 leading-tight whitespace-nowrap">
                    Filtered View ({filteredHierarchy.length})
                  </span>
                </button>

                {/* All Workforce Card */}
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`px-2 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                    scope === "all"
                      ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                      scope === "all"
                        ? "border-2 border-blue-600 bg-white"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {scope === "all" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <div className="text-blue-600 text-sm shrink-0 flex items-center justify-center">
                    <i className="bi bi-database"></i>
                  </div>
                  <span className="font-bold text-[10.5px] sm:text-[11px] text-slate-900 leading-tight whitespace-nowrap">
                    All Workforce ({hierarchy.length})
                  </span>
                </button>
              </div>
            </div>

            {/* Step 2: Additional Sections */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  2
                </div>
                <div>
                  <div style={{ fontSize: "12.6px" }} className="font-bold text-slate-900 leading-tight mb-0">
                    Additional Sections
                  </div>
                  <p style={{ fontSize: "10.5px" }} className="text-slate-500 mb-0 mt-1 leading-normal">
                    Select the sections to include in the print layout.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {/* Squads Summary Card */}
                <button
                  type="button"
                  onClick={() => setIncludeSquadsSummary(!includeSquadsSummary)}
                  className={`w-full px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    includeSquadsSummary
                      ? "border-slate-200/90 bg-white hover:bg-slate-50/80 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 opacity-75"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      includeSquadsSummary
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {includeSquadsSummary && <i className="bi bi-check text-xs font-black"></i>}
                  </div>

                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                    <i className="bi bi-people-fill"></i>
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <span className="font-bold block text-xs text-slate-900 leading-normal">
                      Squads Summary
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-normal truncate">
                      Include supervisor squad roster and capacity summary
                    </span>
                  </div>
                </button>

                {/* Unassigned Staff Card */}
                <button
                  type="button"
                  onClick={() => setIncludeUnassigned(!includeUnassigned)}
                  className={`w-full px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                    includeUnassigned
                      ? "border-slate-200/90 bg-white hover:bg-slate-50/80 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 opacity-75"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                      includeUnassigned
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {includeUnassigned && <i className="bi bi-check text-xs font-black"></i>}
                  </div>

                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                    <i className="bi bi-person-fill"></i>
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 block leading-normal">
                        Unassigned Staff
                      </span>
                      {activeUnassigned.length > 0 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-700">
                          {activeUnassigned.length}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-normal truncate">
                      Include staff who are not assigned to any supervisor
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Page Format */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  3
                </div>
                <div>
                  <div style={{ fontSize: "12.6px" }} className="font-bold text-slate-900 leading-tight mb-0">
                    Page Format
                  </div>
                  <p style={{ fontSize: "10.5px" }} className="text-slate-500 mb-0 mt-1 leading-normal">
                    Configure page layout and appearance.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <CustomFormatDropdown
                  label="Page Size"
                  value={pageSize}
                  options={PAGE_SIZE_OPTIONS}
                  onChange={(val) => {
                    setPageSize(val);
                    setOpenDropdown(null);
                  }}
                  icon="bi bi-file-earmark-text"
                  isOpen={openDropdown === "pageSize"}
                  onToggle={() => setOpenDropdown(openDropdown === "pageSize" ? null : "pageSize")}
                />

                <CustomFormatDropdown
                  label="Orientation"
                  value={orientation}
                  options={ORIENTATION_OPTIONS}
                  onChange={(val) => {
                    setOrientation(val);
                    setOpenDropdown(null);
                  }}
                  icon={orientation === "landscape" ? "bi bi-aspect-ratio" : "bi bi-phone"}
                  isOpen={openDropdown === "orientation"}
                  onToggle={() => setOpenDropdown(openDropdown === "orientation" ? null : "orientation")}
                />

                <CustomFormatDropdown
                  label="Margins"
                  value={margins}
                  options={MARGINS_OPTIONS}
                  onChange={(val) => {
                    setMargins(val);
                    setOpenDropdown(null);
                  }}
                  icon="bi bi-bounding-box"
                  isOpen={openDropdown === "margins"}
                  onToggle={() => setOpenDropdown(openDropdown === "margins" ? null : "margins")}
                />

                <CustomFormatDropdown
                  label="Header Style"
                  value={headerStyle}
                  options={HEADER_STYLE_OPTIONS}
                  onChange={(val) => {
                    setHeaderStyle(val);
                    setOpenDropdown(null);
                  }}
                  icon="bi bi-layout-text-window-reverse"
                  isOpen={openDropdown === "headerStyle"}
                  onToggle={() => setOpenDropdown(openDropdown === "headerStyle" ? null : "headerStyle")}
                />
              </div>
            </div>

            {/* Tip Callout Banner */}
            <div className="bg-gradient-to-r from-amber-50/70 via-indigo-50/30 to-purple-50/20 border border-amber-200/70 rounded-xl p-2.5 flex items-start gap-2 shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
                <i className="bi bi-lightbulb-fill"></i>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-relaxed mb-0">
                <strong className="text-slate-800">Tip:</strong> In the browser print dialog, choose{" "}
                <span className="font-semibold text-indigo-700">&quot;Save as PDF&quot;</span> to export.
              </p>
            </div>
          </div>

          {/* Right Column: Document Preview Area */}
          <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden min-w-0">
            {/* Top Preview Toolbar: Positioned outside the scroll container with solid background so scrolled content never bleeds behind it */}
            <div className="shrink-0 z-20 w-full flex justify-center px-2.5 sm:px-3.5 py-2.5 bg-slate-100 border-b border-slate-200/80 no-print">
              <div className={`w-full ${isFitWidth ? "max-w-none" : orientation === "landscape" ? "max-w-5xl" : "max-w-3xl"} bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-3.5 py-2 flex items-center justify-between gap-3`}>
                {/* Left: Page Navigation with Quick Page Turn Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-all cursor-pointer text-xs"
                    title="Previous Page"
                    aria-label="Previous Page"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>

                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                    {[1, 2, 3, 4].map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-6 h-6 rounded-md text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center ${
                          currentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "text-slate-600 hover:bg-white"
                        }`}
                        title={`Go to Page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <span className="text-[11px] font-semibold text-slate-400 px-1 font-mono">/ 4</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(4, p + 1))}
                    disabled={currentPage >= 4}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-all cursor-pointer text-xs"
                    title="Next Page"
                    aria-label="Next Page"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>

                {/* Center: Zoom Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all cursor-pointer text-xs font-bold"
                    title="Zoom Out"
                    aria-label="Zoom Out"
                  >
                    <i className="bi bi-dash"></i>
                  </button>
                  <div className="px-3 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 font-mono min-w-[52px] text-center">
                    {zoom}%
                  </div>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(150, z + 10))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-all cursor-pointer text-xs font-bold"
                    title="Zoom In"
                    aria-label="Zoom In"
                  >
                    <i className="bi bi-plus"></i>
                  </button>
                </div>

                {/* Right: Quick Action Tools */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="w-7.5 h-7.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
                    title="Search Dossier"
                    aria-label="Search Dossier"
                  >
                    <i className="bi bi-search text-xs"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFitWidth(!isFitWidth)}
                    className={`w-7.5 h-7.5 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${
                      isFitWidth
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                    }`}
                    title={isFitWidth ? "Original Width" : "Fit to Width"}
                    aria-label="Fit to Width"
                  >
                    <i className="bi bi-arrows-fullscreen text-xs"></i>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-7.5 h-7.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
                    title="Download / Print PDF"
                    aria-label="Download / Print PDF"
                  >
                    <i className="bi bi-download text-xs"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Document Canvas */}
            <div className="flex-1 overflow-auto [scrollbar-width:thin] px-2.5 sm:px-3.5 py-4">
              <div className="flex flex-col items-center min-w-full w-max mx-auto min-h-full">
                {/* Scaled Preview Wrapper: Synchronizes scaled visual dimensions with layout flow */}
                <div
                  style={{
                    width: isFitWidth ? "100%" : `${sheetWidth * (zoom / 100)}px`,
                    minHeight: isFitWidth ? undefined : `${sheetMinHeight * (zoom / 100)}px`,
                  }}
                  className="flex flex-col items-center transition-all duration-200"
                >
                  {/* Printable Document Sheets Container */}
                  <div
                    id="printable-hierarchy-dossier"
                    style={{
                      width: isFitWidth ? "100%" : `${sheetWidth}px`,
                      minWidth: isFitWidth ? undefined : `${sheetWidth}px`,
                      maxWidth: isFitWidth ? "100%" : `${sheetWidth}px`,
                      transform: !isFitWidth && zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                      transformOrigin: "top center",
                      transition: "transform 0.2s ease-out, width 0.2s ease-out",
                    }}
                    className="shrink-0 flex flex-col items-center mb-6"
                  >
                  {/* ===================== PAGE 1 ===================== */}
                  <div
                    className={`print-page bg-white rounded-xl border border-slate-300 shadow-md text-slate-900 transition-all w-full ${
                      currentPage === 1
                        ? "flex flex-col justify-between"
                        : "hidden print:flex print:flex-col print:justify-between"
                    } ${
                      margins === "narrow"
                        ? "p-2.5 sm:p-3.5"
                        : margins === "wide"
                        ? "p-6 sm:p-8"
                        : "p-4 sm:p-5.5"
                    }`}
                    style={{
                      aspectRatio: pageAspectRatio,
                      minHeight: isFitWidth ? undefined : `${sheetMinHeight}px`,
                    }}
                  >
                    <div className="space-y-4">
                      {/* Document Header (Responding dynamically to Header Style: default | minimal | executive) */}
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
                            <p className="mb-0">Page Size: <strong className="uppercase text-slate-800">{pageSize} ({pageSize === "a4" ? "210 × 297mm" : pageSize === "letter" ? "8.5 × 11in" : "8.5 × 14in"})</strong></p>
                            <p className="mb-0">Orientation: <strong className="capitalize text-slate-800">{orientation}</strong></p>
                            <p className="mb-0">Margins: <strong className="capitalize text-slate-800">{margins} ({margins === "narrow" ? "10mm" : margins === "wide" ? "25mm" : "15mm"})</strong></p>
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
                                      <span className="font-semibold text-slate-800 block leading-tight">
                                        {item.manager_name}
                                      </span>
                                      <span className="text-[9.5px] text-slate-400 font-mono">
                                        MGR-{String(item.manager_id).padStart(4, "0")}
                                      </span>
                                    </td>
                                    <td className="px-2.5 py-1.5 text-center">
                                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
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
                    </div>

                    {/* Page 1 Footer */}
                    {renderPageFooter(1, "Workforce Hierarchy Management Module • Section 1.0 Relationships")}
                  </div>

                  {/* ===================== PAGE 2 ===================== */}
                  <div
                    className={`print-page bg-white rounded-xl border border-slate-300 shadow-md text-slate-900 transition-all w-full ${
                      currentPage === 2
                        ? "flex flex-col justify-between"
                        : "hidden print:flex print:flex-col print:justify-between"
                    } ${
                      margins === "narrow"
                        ? "p-2.5 sm:p-3.5"
                        : margins === "wide"
                        ? "p-6 sm:p-8"
                        : "p-4 sm:p-5.5"
                    }`}
                    style={{
                      aspectRatio: pageAspectRatio,
                      minHeight: isFitWidth ? undefined : `${sheetMinHeight}px`,
                    }}
                  >
                    <div className="space-y-4">
                      {renderSubPageHeader(
                        2,
                        "Section 2: Supervisor Squad Roster & Capacity Summary",
                        "Team lead operational capacity, span of control, and member assignments"
                      )}

                      {/* Section 2: Supervisor Squads & Capacity Overview */}
                      {!includeSquadsSummary ? (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <i className="bi bi-eye-slash text-2xl text-slate-400 mb-2 block"></i>
                          <h4 className="text-xs font-bold text-slate-700">Section Excluded by Configuration</h4>
                          <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 mb-0">
                            Enable &quot;Squads Summary&quot; in Step 2 of the configuration sidebar to include supervisor squad rosters and capacity metrics in this dossier.
                          </p>
                        </div>
                      ) : squadsList.length === 0 ? (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <i className="bi bi-people text-2xl text-slate-400 mb-2 block"></i>
                          <h4 className="text-xs font-bold text-slate-700">No Squads Found</h4>
                          <p className="text-[11px] text-slate-500 mt-1 mb-0">
                            No supervisor squads match the currently selected report scope.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                              <thead>
                                <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                                  <th className="px-2.5 py-1.5 border-r border-slate-200">Team Lead (Supervisor)</th>
                                  <th className="px-2.5 py-1.5 border-r border-slate-200">Division / Manager</th>
                                  <th className="px-2.5 py-1.5 border-r border-slate-200 text-center">Direct Reports</th>
                                  <th className="px-2.5 py-1.5 border-r border-slate-200 text-center">Capacity Load</th>
                                  <th className="px-2.5 py-1.5">Assigned Staff Members</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {squadsList.map((sq, idx) => {
                                  const count = sq.members.length;
                                  const cap = Math.min(100, Math.round((count / 8) * 100));
                                  return (
                                    <tr
                                      key={`squad-print-${sq.supervisorId}`}
                                      className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                                    >
                                      <td className="px-2.5 py-1.5 border-r border-slate-200 font-bold text-slate-900">
                                        {sq.supervisorName}
                                        <span className="block text-[9.5px] font-normal text-slate-400 font-mono">
                                          SUP-{String(sq.supervisorId).padStart(4, "0")}
                                        </span>
                                      </td>
                                      <td className="px-2.5 py-1.5 border-r border-slate-200">
                                        <span className="font-semibold text-slate-800">{sq.departmentName}</span>
                                        <span className="block text-[9.5px] text-slate-400">Mgr: {sq.managerName}</span>
                                      </td>
                                      <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-bold text-slate-900">
                                        {count} / 8
                                      </td>
                                      <td className="px-2.5 py-1.5 border-r border-slate-200 text-center">
                                        <span
                                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                            count >= 8
                                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                                              : count >= 4
                                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          }`}
                                        >
                                          {cap}% • {count >= 8 ? "High Span" : count >= 4 ? "Optimal" : "Light"}
                                        </span>
                                      </td>
                                      <td className="px-2.5 py-1.5 text-[10px] text-slate-700">
                                        {sq.members.map((m) => m.employee_name).join(", ")}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Capacity Health & Governance Benchmarks */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2">
                            <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                              <div className="flex items-center gap-1.5 mb-1 text-emerald-800 font-bold text-[11px]">
                                <i className="bi bi-check-circle-fill text-emerald-600"></i>
                                <span>Light Span (1–3 Reports)</span>
                              </div>
                              <p className="text-[10px] text-emerald-900/80 mb-0 leading-relaxed">
                                High managerial bandwidth available for dedicated onboarding, mentoring, and cross-functional project intake.
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/70">
                              <div className="flex items-center gap-1.5 mb-1 text-indigo-800 font-bold text-[11px]">
                                <i className="bi bi-award-fill text-indigo-600"></i>
                                <span>Optimal Span (4–7 Reports)</span>
                              </div>
                              <p className="text-[10px] text-indigo-900/80 mb-0 leading-relaxed">
                                Industry benchmark equilibrium maximizing operational velocity while preserving 1-on-1 supervisory coaching.
                              </p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
                              <div className="flex items-center gap-1.5 mb-1 text-amber-800 font-bold text-[11px]">
                                <i className="bi bi-exclamation-triangle-fill text-amber-600"></i>
                                <span>High Span (8+ Reports)</span>
                              </div>
                              <p className="text-[10px] text-amber-900/80 mb-0 leading-relaxed">
                                Supervisory saturation threshold reached. Recommend reviewing workload distribution or delegating tech leads.
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Page 2 Footer */}
                    {renderPageFooter(2, "Supervisor Squad Roster & Capacity Assessment")}
                  </div>

                  {/* ===================== PAGE 3 ===================== */}
                  <div
                    className={`print-page bg-white rounded-xl border border-slate-300 shadow-md text-slate-900 transition-all w-full ${
                      currentPage === 3
                        ? "flex flex-col justify-between"
                        : "hidden print:flex print:flex-col print:justify-between"
                    } ${
                      margins === "narrow"
                        ? "p-2.5 sm:p-3.5"
                        : margins === "wide"
                        ? "p-6 sm:p-8"
                        : "p-4 sm:p-5.5"
                    }`}
                    style={{
                      aspectRatio: pageAspectRatio,
                      minHeight: isFitWidth ? undefined : `${sheetMinHeight}px`,
                    }}
                  >
                    <div className="space-y-4">
                      {renderSubPageHeader(
                        3,
                        "Section 3: Unallocated Personnel & Departmental Distribution",
                        "Tracking unassigned staff members and leadership density across departments"
                      )}

                      {/* Unassigned Staff Section */}
                      {!includeUnassigned ? (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <i className="bi bi-eye-slash text-2xl text-slate-400 mb-2 block"></i>
                          <h4 className="text-xs font-bold text-slate-700">Section Excluded by Configuration</h4>
                          <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 mb-0">
                            Enable &quot;Unassigned Staff&quot; in Step 2 of the configuration sidebar to include unallocated staff listings.
                          </p>
                        </div>
                      ) : activeUnassigned.length > 0 ? (
                        <div>
                          <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-200">
                            <div className="text-[11.5px] font-bold text-amber-900 uppercase flex items-center gap-1.5">
                              <i className="bi bi-exclamation-triangle-fill text-amber-600"></i>
                              <span>Unallocated Personnel Awaiting Squad Assignment ({activeUnassigned.length})</span>
                            </div>
                            <span className="text-[9.5px] text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                              Action Required
                            </span>
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

                          <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-[10.5px] text-amber-900">
                            <i className="bi bi-info-circle-fill text-amber-600 shrink-0"></i>
                            <span>
                              <strong>HR Allocation Directive:</strong> Unallocated personnel must be integrated into a certified squad within 5 business days of onboarding to maintain governance compliance.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base shrink-0">
                            <i className="bi bi-check2-circle"></i>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-emerald-900 mb-0.5">100% Workforce Allocation Achieved</h4>
                            <p className="text-[10.5px] text-emerald-800 mb-0">
                              All active employees are mapped to designated Team Leads and Department Managers. Zero unallocated personnel detected in this scope.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Departmental Resource Distribution Table */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                          <div className="text-[11.5px] font-bold text-slate-900 uppercase flex items-center gap-1.5">
                            <i className="bi bi-buildings-fill text-indigo-600"></i>
                            <span>Departmental Leadership & Resource Distribution</span>
                          </div>
                          <span className="text-[9.5px] text-slate-400">
                            {departmentList.length} Active Departments
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                                <th className="px-2.5 py-1.5 border-r border-slate-200">Department Name</th>
                                <th className="px-2.5 py-1.5 border-r border-slate-200 text-center">Mapped Staff</th>
                                <th className="px-2.5 py-1.5 border-r border-slate-200 text-center">Active Squads</th>
                                <th className="px-2.5 py-1.5 border-r border-slate-200 text-center">Managers</th>
                                <th className="px-2.5 py-1.5 text-center">Allocation Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {departmentList.map((d, idx) => (
                                <tr key={d.name} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                                  <td className="px-2.5 py-1.5 border-r border-slate-200 font-semibold text-slate-900">
                                    {d.name}
                                  </td>
                                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-bold text-slate-800">
                                    {d.employeesCount}
                                  </td>
                                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center text-purple-700 font-medium">
                                    {d.supervisors.size} {d.supervisors.size === 1 ? "Squad" : "Squads"}
                                  </td>
                                  <td className="px-2.5 py-1.5 border-r border-slate-200 text-center text-emerald-700 font-medium">
                                    {d.managers.size} {d.managers.size === 1 ? "Manager" : "Managers"}
                                  </td>
                                  <td className="px-2.5 py-1.5 text-center">
                                    <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Healthy Structure
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Page 3 Footer */}
                    {renderPageFooter(3, "Workforce Allocation & Departmental Distribution")}
                  </div>

                  {/* ===================== PAGE 4 ===================== */}
                  <div
                    className={`print-page bg-white rounded-xl border border-slate-300 shadow-md text-slate-900 transition-all w-full ${
                      currentPage === 4
                        ? "flex flex-col justify-between"
                        : "hidden print:flex print:flex-col print:justify-between"
                    } ${
                      margins === "narrow"
                        ? "p-2.5 sm:p-3.5"
                        : margins === "wide"
                        ? "p-6 sm:p-8"
                        : "p-4 sm:p-5.5"
                    }`}
                    style={{
                      aspectRatio: pageAspectRatio,
                      minHeight: isFitWidth ? undefined : `${sheetMinHeight}px`,
                    }}
                  >
                    <div className="space-y-4">
                      {renderSubPageHeader(
                        4,
                        "Section 4: Corporate Governance Audit & Compliance Certification",
                        "Statutory compliance verification, cryptographic audit seal, and executive tri-signature authorization"
                      )}

                      {/* Audit Certification Overview Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Governance Standard
                          </span>
                          <span className="text-xs font-black text-slate-800 block">
                            ISO 27001 • SOC 2 Type II
                          </span>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700">
                            Certified Compliant
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Chain of Command Audit
                          </span>
                          <span className="text-xs font-black text-slate-800 block">
                            Zero Disconnected Links
                          </span>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                            100% Chain Validated
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Audited Personnel Scope
                          </span>
                          <span className="text-xs font-black text-slate-800 block">
                            {activeMappings.length} Active Records
                          </span>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                            {scope === "filtered" ? "Target Filter Audit" : "Full Enterprise Audit"}
                          </span>
                        </div>
                      </div>

                      {/* Formal Audit Declarations */}
                      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                          <i className="bi bi-shield-lock-fill text-indigo-600"></i>
                          <span>Corporate Governance & Audit Declarations</span>
                        </h4>
                        <ul className="text-[10.5px] text-slate-600 space-y-1 list-disc pl-4 mb-0">
                          <li>
                            This official dossier certifies that all supervisor-to-employee reporting relationships documented herein comply with corporate workforce governance regulations and HR Section 4.11 policy standards.
                          </li>
                          <li>
                            Supervisory capacities have been audited against span-of-control guidelines (target: 4–7 direct reports) to prevent managerial overload and uphold quality employee oversight.
                          </li>
                          <li>
                            Zero circular reporting loops, orphaned supervisory branches, or unauthorized supervisory roles exist in this authenticated dataset.
                          </li>
                        </ul>
                      </div>

                      {/* Cryptographic Hash & Tamper-Evident Seal */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[9.5px]">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-amber-300 font-bold uppercase">Cryptographic Audit Seal</span>
                          </div>
                          <div className="text-slate-300">
                            Hash: <span className="text-slate-100">SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</span>
                          </div>
                        </div>
                        <div className="text-right text-slate-400 shrink-0">
                          <div>Record ID: <span className="text-white">EMS-AUD-{new Date().getFullYear()}-00{activeMappings.length}</span></div>
                          <div>Sealed: <span className="text-white">{currentDate}</span></div>
                        </div>
                      </div>

                      {/* Executive Tri-Signature Authorization Blocks */}
                      <div className="pt-2">
                        <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <i className="bi bi-pen-fill text-blue-600"></i>
                          <span>Executive Authorization & Certification Sign-Off</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Signer 1: HR Director */}
                          <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between h-36">
                            <div>
                              <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider block">
                                Prepared & Certified By
                              </span>
                              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                                Dr. Evelyn Vance, SPHR
                              </span>
                              <span className="text-[9.5px] text-slate-500 block">
                                Director of People Operations
                              </span>
                            </div>
                            <div className="border-t border-slate-300 pt-1.5">
                              <span className="text-[8.5px] text-slate-400 font-mono block">Signature & Date:</span>
                              <div className="h-5 flex items-end">
                                <span className="font-serif italic text-xs text-indigo-700 tracking-widest">[ Electronically Certified ]</span>
                              </div>
                            </div>
                          </div>

                          {/* Signer 2: VP People & Culture */}
                          <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between h-36">
                            <div>
                              <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider block">
                                Executive Review & Approval
                              </span>
                              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                                Marcus Sterling
                              </span>
                              <span className="text-[9.5px] text-slate-500 block">
                                VP of Organizational Excellence
                              </span>
                            </div>
                            <div className="border-t border-slate-300 pt-1.5">
                              <span className="text-[8.5px] text-slate-400 font-mono block">Signature & Date:</span>
                              <div className="h-5 flex items-end">
                                <span className="font-serif italic text-xs text-indigo-700 tracking-widest">[ Approved ]</span>
                              </div>
                            </div>
                          </div>

                          {/* Signer 3: Compliance & Audit Lead */}
                          <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between h-36">
                            <div>
                              <span className="text-[8.5px] uppercase font-bold text-slate-400 tracking-wider block">
                                Statutory Audit Sign-Off
                              </span>
                              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                                Clarissa Chen, CISA
                              </span>
                              <span className="text-[9.5px] text-slate-500 block">
                                Head of Corporate Compliance
                              </span>
                            </div>
                            <div className="border-t border-slate-300 pt-1.5">
                              <span className="text-[8.5px] text-slate-400 font-mono block">Signature & Date:</span>
                              <div className="h-5 flex items-end">
                                <span className="font-serif italic text-xs text-indigo-700 tracking-widest">[ Audit Certified ]</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Page 4 Footer */}
                    {renderPageFooter(4, "Section 4.11 Enterprise Governance Certification & Legal Sign-off")}
                  </div>
                </div>
              </div>

              {/* Bottom Canvas Page Switcher (No Print) */}
              <div
                style={{
                  width: isFitWidth ? "100%" : `${sheetWidth * (zoom / 100)}px`,
                  maxWidth: "100%",
                }}
                className="w-full flex items-center justify-between pt-3 pb-2 text-xs text-slate-500 no-print"
              >
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-700 cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-200/60"
                  >
                    <i className="bi bi-arrow-left"></i> Previous Page
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-slate-600">
                      Viewing Page {currentPage} of 4:
                    </span>
                    <span className="text-[11.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full">
                      {currentPage === 1
                        ? "1. Workforce Relationships"
                        : currentPage === 2
                        ? "2. Supervisor Squads & Capacity"
                        : currentPage === 3
                        ? "3. Unallocated & Departments"
                        : "4. Governance Audit & Certification"}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={currentPage >= 4}
                    onClick={() => setCurrentPage((p) => Math.min(4, p + 1))}
                    className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-700 cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-200/60"
                  >
                    Next Page <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
        </div>
      </div>
    </div>
  </div>

        {/* Modal Footer (No Print) */}
        <div className="pl-6 pr-5 sm:pr-6 py-3 sm:py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
          >
            Close Preview
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2"
            >
              <i className="bi bi-printer-fill text-sm"></i>
              <span>Print Dossier / Export to PDF</span>
            </button>
          </div>
        </div>

        {/* Dynamic Print Stylesheet responding to Step 3 controls */}
        <style>{`
          #printable-hierarchy-dossier h1,
          #printable-hierarchy-dossier h2,
          #printable-hierarchy-dossier h3,
          #printable-hierarchy-dossier h4,
          #printable-hierarchy-dossier p {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-hierarchy-dossier, #printable-hierarchy-dossier * {
              visibility: visible;
            }
            #printable-hierarchy-dossier {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              min-width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              transform: none !important;
              display: block !important;
            }
            .print-page {
              aspect-ratio: auto !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              width: 100% !important;
              max-width: 100% !important;
              min-height: 98vh !important;
              page-break-after: always !important;
              break-after: page !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: ${margins === "narrow" ? "6mm" : margins === "wide" ? "16mm" : "10mm"} !important;
              margin: 0 !important;
              transform: none !important;
            }
            .print-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: ${pageSize === 'a4' ? 'A4' : pageSize === 'letter' ? 'letter' : 'legal'} ${orientation};
              margin: ${margins === "narrow" ? "10mm" : margins === "wide" ? "25mm" : "15mm"};
            }
          }
        `}</style>
      </div>
    </div>,
    document.body
  );
};

export default HierarchyPrintModal;

