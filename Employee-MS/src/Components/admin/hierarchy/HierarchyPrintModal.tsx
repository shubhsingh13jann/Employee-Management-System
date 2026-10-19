import React, { useState } from "react";
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

  // Document Preview interactive controls
  const [zoom, setZoom] = useState<number>(80);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFitWidth, setIsFitWidth] = useState<boolean>(false);

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
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-[1140px] h-[92vh] max-h-[92vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with Fluid Pastel Wave Accent */}
        <div className="relative px-5 py-3.5 bg-white flex items-center justify-between border-b border-slate-100 overflow-hidden shrink-0 no-print">
          {/* Top-Right Fluid Pastel Wave Background matching reference design */}
          <div className="absolute top-0 right-0 w-[440px] sm:w-[520px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <mask id="printWaveFadeMask">
                  <linearGradient id="printWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="18%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#printWaveFadeMask)" />
                </mask>

                <linearGradient id="printWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="printWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="printWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g mask="url(#printWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#printWaveGrad1)"
                />
                <path
                  d="M30 50 C95 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H30 Z"
                  fill="url(#printWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#printWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            {/* Printer Squircle Icon */}
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/90 shadow-2xs flex items-center justify-center text-indigo-600 text-lg font-bold shrink-0">
              <i className="bi bi-printer-fill"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div style={{ fontSize: "14.7px" }} className="font-bold text-slate-900 leading-tight tracking-tight mb-0">
                  Print Hierarchy Dossier & Roster
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200/70 shrink-0">
                  A4 / Letter Format
                </span>
              </div>
              <p style={{ fontSize: "11.5px" }} className="text-slate-500 mb-0 mt-0.5 leading-tight">
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
          <div className="w-full lg:w-[360px] xl:w-[390px] shrink-0 border-r border-slate-100 p-3.5 sm:p-4.5 space-y-3.5 overflow-y-auto bg-white no-print [scrollbar-width:thin]">
            {/* Step 1: Report Scope */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  1
                </div>
                <div>
                  <div style={{ fontSize: "12.6px" }} className="font-bold text-slate-900 leading-tight mb-0">
                    Report Scope
                  </div>
                  <p style={{ fontSize: "11px" }} className="text-slate-500 mb-0 mt-0.5 leading-tight">
                    Choose the data scope to include in the report.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Filtered View Card */}
                <button
                  type="button"
                  onClick={() => setScope("filtered")}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    scope === "filtered"
                      ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
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
                  <div className="text-blue-600 text-lg shrink-0 flex items-center justify-center">
                    <i className="bi bi-funnel"></i>
                  </div>
                  <span className="font-bold text-xs sm:text-[12px] text-slate-900 leading-tight truncate">
                    Filtered View ({filteredHierarchy.length})
                  </span>
                </button>

                {/* All Workforce Card */}
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    scope === "all"
                      ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
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
                  <div className="text-blue-600 text-lg shrink-0 flex items-center justify-center">
                    <i className="bi bi-database"></i>
                  </div>
                  <span className="font-bold text-xs sm:text-[12px] text-slate-900 leading-tight truncate">
                    All Workforce ({hierarchy.length})
                  </span>
                </button>
              </div>
            </div>

            {/* Step 2: Additional Sections */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  2
                </div>
                <div>
                  <div style={{ fontSize: "12.6px" }} className="font-bold text-slate-900 leading-tight mb-0">
                    Additional Sections
                  </div>
                  <p style={{ fontSize: "11px" }} className="text-slate-500 mb-0 mt-0.5 leading-tight">
                    Select the sections to include in the print layout.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {/* Squads Summary Card */}
                <button
                  type="button"
                  onClick={() => setIncludeSquadsSummary(!includeSquadsSummary)}
                  className={`w-full p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    includeSquadsSummary
                      ? "border-slate-200/90 bg-white hover:bg-slate-50/80 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 opacity-75"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      includeSquadsSummary
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {includeSquadsSummary && <i className="bi bi-check text-sm font-black"></i>}
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-sm shrink-0">
                    <i className="bi bi-people-fill"></i>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-bold block text-xs sm:text-[12.5px] text-slate-900 leading-tight">
                      Squads Summary
                    </span>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 block leading-tight mt-0.5 truncate">
                      Include supervisor squad roster and capacity summary
                    </span>
                  </div>
                </button>

                {/* Unassigned Staff Card */}
                <button
                  type="button"
                  onClick={() => setIncludeUnassigned(!includeUnassigned)}
                  className={`w-full p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    includeUnassigned
                      ? "border-slate-200/90 bg-white hover:bg-slate-50/80 shadow-2xs"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 opacity-75"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      includeUnassigned
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "border-2 border-slate-300 bg-white"
                    }`}
                  >
                    {includeUnassigned && <i className="bi bi-check text-sm font-black"></i>}
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-sm shrink-0">
                    <i className="bi bi-person-fill"></i>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="font-bold block text-xs sm:text-[12.5px] text-slate-900 leading-tight">
                      Unassigned Staff
                    </span>
                    <span className="text-[10px] sm:text-[10.5px] text-slate-500 block leading-tight mt-0.5 truncate">
                      Include staff who are not assigned to any supervisor
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 3: Page Format */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  3
                </div>
                <div>
                  <div style={{ fontSize: "12.6px" }} className="font-bold text-slate-900 leading-tight mb-0">
                    Page Format
                  </div>
                  <p style={{ fontSize: "11px" }} className="text-slate-500 mb-0 mt-0.5 leading-tight">
                    Configure page layout and appearance.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Page Size */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 mb-1 block">
                    Page Size
                  </label>
                  <div className="relative border border-slate-200/90 rounded-xl bg-white hover:border-slate-300 p-2 flex items-center gap-2 shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                      <i className="bi bi-file-earmark-text"></i>
                    </div>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(e.target.value as any)}
                      aria-label="Page Size"
                      className="bg-transparent text-xs font-semibold text-slate-800 w-full outline-hidden cursor-pointer appearance-none pr-4"
                    >
                      <option value="a4">A4 (210 × 297 mm)</option>
                      <option value="letter">Letter (8.5 × 11 in)</option>
                      <option value="legal">Legal (8.5 × 14 in)</option>
                    </select>
                    <i className="bi bi-chevron-down text-slate-400 text-[10px] absolute right-2.5 pointer-events-none"></i>
                  </div>
                </div>

                {/* Orientation */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 mb-1 block">
                    Orientation
                  </label>
                  <div className="relative border border-slate-200/90 rounded-xl bg-white hover:border-slate-300 p-2 flex items-center gap-2 shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                      <i className="bi bi-phone"></i>
                    </div>
                    <select
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as any)}
                      aria-label="Orientation"
                      className="bg-transparent text-xs font-semibold text-slate-800 w-full outline-hidden cursor-pointer appearance-none pr-4"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                    <i className="bi bi-chevron-down text-slate-400 text-[10px] absolute right-2.5 pointer-events-none"></i>
                  </div>
                </div>

                {/* Margins */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 mb-1 block">
                    Margins
                  </label>
                  <div className="relative border border-slate-200/90 rounded-xl bg-white hover:border-slate-300 p-2 flex items-center gap-2 shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                      <i className="bi bi-bounding-box"></i>
                    </div>
                    <select
                      value={margins}
                      onChange={(e) => setMargins(e.target.value as any)}
                      aria-label="Margins"
                      className="bg-transparent text-xs font-semibold text-slate-800 w-full outline-hidden cursor-pointer appearance-none pr-4"
                    >
                      <option value="standard">Standard</option>
                      <option value="narrow">Narrow</option>
                      <option value="wide">Wide</option>
                    </select>
                    <i className="bi bi-chevron-down text-slate-400 text-[10px] absolute right-2.5 pointer-events-none"></i>
                  </div>
                </div>

                {/* Header Style */}
                <div>
                  <label className="text-[10.5px] font-bold text-slate-700 mb-1 block">
                    Header Style
                  </label>
                  <div className="relative border border-slate-200/90 rounded-xl bg-white hover:border-slate-300 p-2 flex items-center gap-2 shadow-2xs">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                      <i className="bi bi-layout-text-window-reverse"></i>
                    </div>
                    <select
                      value={headerStyle}
                      onChange={(e) => setHeaderStyle(e.target.value as any)}
                      aria-label="Header Style"
                      className="bg-transparent text-xs font-semibold text-slate-800 w-full outline-hidden cursor-pointer appearance-none pr-4"
                    >
                      <option value="default">Default</option>
                      <option value="minimal">Minimal</option>
                      <option value="executive">Executive</option>
                    </select>
                    <i className="bi bi-chevron-down text-slate-400 text-[10px] absolute right-2.5 pointer-events-none"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Tip Callout Banner */}
            <div className="bg-gradient-to-r from-amber-50/70 via-indigo-50/30 to-purple-50/20 border border-amber-200/70 rounded-2xl p-3 flex items-start gap-2.5 shadow-2xs">
              <div className="w-5.5 h-5.5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
                <i className="bi bi-lightbulb-fill"></i>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mb-0">
                <strong className="text-slate-800">Tip:</strong> In the browser print dialog, choose{" "}
                <span className="font-semibold text-indigo-700">&quot;Save as PDF&quot;</span> to export.
              </p>
            </div>
          </div>

          {/* Right Column: Document Preview Area */}
          <div className="flex-1 bg-slate-100/70 flex flex-col overflow-hidden">
            {/* Scrollable Document Canvas with Sticky Toolbar */}
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] px-2.5 sm:px-3.5 py-3">
              <div className="flex flex-col items-center w-full min-h-full">
                {/* Top Preview Toolbar matching Image 1 */}
                <div className="sticky top-0 z-20 w-full flex justify-center pb-3 pt-0.5 bg-slate-100/90 backdrop-blur-xs no-print">
                  <div className={`w-full ${isFitWidth ? "max-w-none" : "max-w-3xl"} bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-3.5 py-2 flex items-center justify-between gap-3`}>
                    {/* Left: Page Navigation */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-all cursor-pointer text-xs"
                        title="Previous Page"
                        aria-label="Previous Page"
                      >
                        <i className="bi bi-arrow-left"></i>
                      </button>
                      <div className="px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 font-mono tracking-wide">
                        {currentPage} / 4
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(4, p + 1))}
                        disabled={currentPage >= 4}
                        className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-35 disabled:hover:bg-white text-slate-600 flex items-center justify-center transition-all cursor-pointer text-xs"
                        title="Next Page"
                        aria-label="Next Page"
                      >
                        <i className="bi bi-arrow-right"></i>
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

                {/* Printable Document Sheet */}
                <div
                  id="printable-hierarchy-dossier"
                  style={{
                    transform: !isFitWidth ? `scale(${zoom / 100})` : undefined,
                    transformOrigin: "top center",
                    transition: "transform 0.15s ease-out",
                  }}
                  className={`bg-white p-5 sm:p-7 rounded-xl border border-slate-300 shadow-md transition-all space-y-4 text-slate-900 mb-6 ${
                    isFitWidth ? "w-full max-w-none" : "w-full max-w-3xl"
                  }`}
                >
            {/* Corporate Header */}
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
                {activeFiltersDesc && (
                  <p style={{ fontSize: "9.5px" }} className="text-indigo-700 max-w-[200px] truncate mb-0">
                    {activeFiltersDesc}
                  </p>
                )}
              </div>
            </div>

            {/* Executive KPI Summary Bar matching Image 1 */}
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

            {/* Section 2: Supervisor Squads & Capacity Overview */}
            {includeSquadsSummary && squadsList.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                  <div
                    style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                    className="font-bold text-slate-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <i className="bi bi-people-fill text-purple-600" style={{ fontSize: "12.6px" }}></i>
                    <span>2. Supervisor Squad Roster & Capacity Summary ({squadsList.length} Squads)</span>
                  </div>
                </div>

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
              </div>
            )}

            {/* Section 3: Unassigned / Orphaned Personnel */}
            {includeUnassigned && activeUnassigned.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
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
        </div>
      </div>
    </div>
  </div>

        {/* Modal Footer (No Print) */}
        <div className="px-5 py-3 sm:py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0 no-print">
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
              max-width: 100% !important;
              margin: 0 !important;
              padding: 8mm !important;
              box-shadow: none !important;
              border: none !important;
              transform: none !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: ${pageSize} ${orientation};
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

