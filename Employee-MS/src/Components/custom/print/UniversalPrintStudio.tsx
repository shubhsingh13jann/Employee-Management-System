import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export type PageSizeOption = "a4" | "letter" | "legal";
export type OrientationOption = "portrait" | "landscape";
export type MarginsOption = "standard" | "narrow" | "wide";
export type HeaderStyleOption = "default" | "minimal" | "executive";

export interface PrintScopeOption {
  id: string;
  label: string;
  count?: number;
  icon?: string;
  description?: string;
}

export interface PrintSectionToggle {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  count?: number;
  defaultChecked?: boolean;
}

export interface UniversalPrintStudioProps {
  isOpen: boolean;
  onClose: () => void;
  // Header details
  title: string;
  subtitle?: string;
  icon?: string; // default "bi bi-printer-fill"
  documentId?: string; // e.g. "PRJ-0001" or "HIERARCHY-2026"
  badgeLabel?: string;
  // Configuration Step 1: Scopes (optional)
  scopes?: PrintScopeOption[];
  activeScope?: string;
  onScopeChange?: (scopeId: string) => void;
  // Configuration Step 2: Section Toggles (optional)
  sections?: PrintSectionToggle[];
  activeSections?: Record<string, boolean>;
  onToggleSection?: (sectionId: string, enabled: boolean) => void;
  // Configuration Step 3: Page format defaults
  defaultPageSize?: PageSizeOption;
  defaultOrientation?: OrientationOption;
  defaultMargins?: MarginsOption;
  defaultHeaderStyle?: HeaderStyleOption;
  // Custom sidebar extra slot
  renderSidebarExtra?: () => React.ReactNode;
  // Document canvas renderer
  renderContent?: (options: {
    pageSize: PageSizeOption;
    orientation: OrientationOption;
    margins: MarginsOption;
    headerStyle: HeaderStyleOption;
    scope?: string;
    activeSections: Record<string, boolean>;
    zoom: number;
    currentDate: string;
    currentTime: string;
  }) => React.ReactNode;
  children?: React.ReactNode;
  // Print trigger callback (optional override or standard window.print)
  onPrint?: () => void;
  loading?: boolean;
  loadingMessage?: string;
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

export const UniversalPrintStudio: React.FC<UniversalPrintStudioProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = "Executive print layout formatted for paper records, physical audits, and PDF export",
  icon = "bi bi-printer-fill",
  documentId,
  badgeLabel,
  scopes,
  activeScope: controlledScope,
  onScopeChange,
  sections,
  activeSections: controlledSections,
  onToggleSection,
  defaultPageSize = "a4",
  defaultOrientation = "portrait",
  defaultMargins = "standard",
  defaultHeaderStyle = "default",
  renderSidebarExtra,
  renderContent,
  children,
  onPrint,
  loading = false,
  loadingMessage = "Assembling executive briefing telemetry...",
}) => {
  // Scope internal state if uncontrolled
  const [internalScope, setInternalScope] = useState<string>(
    scopes && scopes.length > 0 ? scopes[0].id : "default"
  );
  const currentScope = controlledScope !== undefined ? controlledScope : internalScope;

  // Section toggles internal state if uncontrolled
  const [internalSections, setInternalSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (sections) {
      sections.forEach((s) => {
        init[s.id] = s.defaultChecked !== undefined ? s.defaultChecked : true;
      });
    }
    return init;
  });
  const currentSections = controlledSections !== undefined ? controlledSections : internalSections;

  // Page Format state (Step 3)
  const [pageSize, setPageSize] = useState<PageSizeOption>(defaultPageSize);
  const [orientation, setOrientation] = useState<OrientationOption>(defaultOrientation);
  const [margins, setMargins] = useState<MarginsOption>(defaultMargins);
  const [headerStyle, setHeaderStyle] = useState<HeaderStyleOption>(defaultHeaderStyle);
  const [openDropdown, setOpenDropdown] = useState<"pageSize" | "orientation" | "margins" | "headerStyle" | null>(null);

  // Document Preview interactive controls
  const [zoom, setZoom] = useState<number>(80);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFitWidth, setIsFitWidth] = useState<boolean>(false);

  // Close dropdown on click outside or Escape key
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

  // Synchronize defaults if props change
  useEffect(() => {
    if (defaultPageSize) setPageSize(defaultPageSize);
    if (defaultOrientation) setOrientation(defaultOrientation);
    if (defaultMargins) setMargins(defaultMargins);
    if (defaultHeaderStyle) setHeaderStyle(defaultHeaderStyle);
  }, [defaultPageSize, defaultOrientation, defaultMargins, defaultHeaderStyle]);

  if (!isOpen) return null;

  const handleScopeSelect = (scopeId: string) => {
    if (onScopeChange) {
      onScopeChange(scopeId);
    } else {
      setInternalScope(scopeId);
    }
  };

  const handleToggleSection = (sectionId: string) => {
    const newVal = !currentSections[sectionId];
    if (onToggleSection) {
      onToggleSection(sectionId, newVal);
    } else {
      setInternalSections((prev) => ({
        ...prev,
        [sectionId]: newVal,
      }));
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const pageMinHeight =
    orientation === "landscape"
      ? pageSize === "legal"
        ? "600px"
        : pageSize === "letter"
        ? "640px"
        : "620px"
      : pageSize === "legal"
      ? "1186px"
      : pageSize === "letter"
      ? "958px"
      : "1018px";

  const dossierMaxWidth = isFitWidth
    ? "100%"
    : orientation === "landscape"
    ? pageSize === "legal"
      ? "1220px"
      : pageSize === "letter"
      ? "1020px"
      : "1050px"
    : pageSize === "legal"
    ? "790px"
    : pageSize === "letter"
    ? "780px"
    : "750px";

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full ${
          orientation === "landscape" ? "w-[96vw] max-w-[1400px]" : "max-w-[1010px]"
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
                <mask id="universalPrintWaveFadeMask">
                  <linearGradient id="universalPrintWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="18%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#universalPrintWaveFadeGrad)" />
                </mask>

                <linearGradient id="universalPrintWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="universalPrintWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="universalPrintWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g mask="url(#universalPrintWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#universalPrintWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#universalPrintWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#universalPrintWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          <div className="flex items-center gap-2.5 relative z-10 min-w-0">
            {/* Printer Squircle Icon */}
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100/90 shadow-2xs flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
              <i className={icon}></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div style={{ fontSize: "14px" }} className="font-bold text-slate-900 leading-tight tracking-tight mb-0 truncate">
                  {title}
                </div>
                {documentId && (
                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                    {documentId}
                  </span>
                )}
                <span className="text-[9.5px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200/70 shrink-0">
                  {badgeLabel || `${pageSize.toUpperCase()} • ${orientation.charAt(0).toUpperCase() + orientation.slice(1)}`}
                </span>
              </div>
              <p style={{ fontSize: "11px" }} className="text-slate-500 mb-0 mt-0.5 leading-tight truncate">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Circular Close Button */}
          <div className="relative z-10 shrink-0 ml-2">
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
            {/* Step 1: Report Scope (Rendered if scopes array provided) */}
            {scopes && scopes.length > 0 && (
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
                  {scopes.map((s) => {
                    const isSelected = currentScope === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleScopeSelect(s.id)}
                        className={`px-2 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "border-2 border-blue-500 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-2 border-blue-600 bg-white"
                              : "border-2 border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                        </div>
                        {s.icon && (
                          <div className="text-blue-600 text-sm shrink-0 flex items-center justify-center">
                            <i className={s.icon}></i>
                          </div>
                        )}
                        <span className="font-bold text-[10.5px] sm:text-[11px] text-slate-900 leading-tight whitespace-nowrap truncate">
                          {s.label} {s.count !== undefined ? `(${s.count})` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Content Modules / Additional Sections (Rendered if sections provided) */}
            {sections && sections.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                    {scopes && scopes.length > 0 ? "2" : "1"}
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
                  {sections.map((sec) => {
                    const isChecked = currentSections[sec.id] !== false;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => handleToggleSection(sec.id)}
                        className={`w-full px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isChecked
                            ? "border-slate-200/90 bg-white hover:bg-slate-50/80 shadow-2xs"
                            : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 opacity-75"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isChecked ? "bg-blue-600 text-white shadow-2xs" : "border-2 border-slate-300 bg-white"
                          }`}
                        >
                          {isChecked && <i className="bi bi-check text-xs font-black"></i>}
                        </div>

                        {sec.icon && (
                          <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shrink-0">
                            <i className={sec.icon}></i>
                          </div>
                        )}

                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold block text-xs text-slate-900 leading-normal truncate">
                              {sec.label}
                            </span>
                            {sec.count !== undefined && sec.count > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-indigo-50 text-indigo-700">
                                {sec.count}
                              </span>
                            )}
                          </div>
                          {sec.description && (
                            <span className="text-[10px] text-slate-500 block leading-normal truncate">
                              {sec.description}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Page Format */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6.5 h-6.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
                  {scopes && scopes.length > 0 && sections && sections.length > 0 ? "3" : scopes || sections ? "2" : "1"}
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
                  icon="bi bi-phone"
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

            {/* Custom Sidebar Extras Slot */}
            {renderSidebarExtra && renderSidebarExtra()}

            {/* Tip Callout Banner */}
            <div className="bg-gradient-to-r from-amber-50/70 via-indigo-50/30 to-purple-50/20 border border-amber-200/70 rounded-xl p-2.5 flex items-start gap-2 shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs shrink-0 mt-0.5">
                <i className="bi bi-lightbulb-fill"></i>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-relaxed mb-0">
                <strong className="text-slate-800">Tip:</strong> In the browser print dialog, choose{" "}
                <span className="font-semibold text-indigo-700">&quot;Save as PDF&quot;</span> to export with high-resolution graphics.
              </p>
            </div>
          </div>

          {/* Right Column: Document Preview Area */}
          <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden min-w-0">
            {/* Top Preview Toolbar */}
            <div className="shrink-0 z-20 w-full flex justify-center px-2.5 sm:px-3.5 py-1.5 bg-slate-100 border-b border-slate-200/80 no-print">
              <div className={`w-full ${isFitWidth ? "max-w-none" : orientation === "landscape" ? "max-w-5xl" : "max-w-3xl"} bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-3.5 py-2 flex items-center justify-between gap-3`}>
                {/* Left: Page Navigation with Arrows and Current Tab Number Cube */}
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
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 font-mono flex items-center justify-center shadow-2xs">
                    {currentPage}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(1, p + 1))}
                    disabled={currentPage >= 1}
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
            <div className="flex-1 overflow-y-auto [scrollbar-width:thin] px-2.5 sm:px-3.5 pt-1.5 pb-6">
              <div className="flex flex-col items-center w-full min-h-full">
                {/* Printable Document Sheet */}
                <div
                  id="universal-printable-dossier"
                  style={{
                    transform: !isFitWidth ? `scale(${zoom / 100})` : undefined,
                    transformOrigin: "top center",
                    transition: "all 0.2s ease-out",
                    maxWidth: dossierMaxWidth,
                    minHeight: pageMinHeight,
                  }}
                  className={`bg-white rounded-xl border border-slate-300 shadow-md transition-all space-y-4 text-slate-900 mb-6 w-full ${
                    margins === "narrow"
                      ? "p-2.5 sm:p-3.5"
                      : margins === "wide"
                      ? "p-6 sm:p-8"
                      : "p-4 sm:p-5.5"
                  }`}
                >
                  {loading ? (
                    <div className="py-24 text-center">
                      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-slate-500 font-medium text-sm">
                        {loadingMessage}
                      </p>
                    </div>
                  ) : renderContent ? (
                    renderContent({
                      pageSize,
                      orientation,
                      margins,
                      headerStyle,
                      scope: currentScope,
                      activeSections: currentSections,
                      zoom,
                      currentDate,
                      currentTime,
                    })
                  ) : (
                    children
                  )}
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

        {/* Dynamic Print Stylesheet responding to format controls */}
        <style>{`
          #universal-printable-dossier h1,
          #universal-printable-dossier h2,
          #universal-printable-dossier h3,
          #universal-printable-dossier h4,
          #universal-printable-dossier p {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            #universal-printable-dossier, #universal-printable-dossier * {
              visibility: visible;
            }
            #universal-printable-dossier {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: ${margins === "narrow" ? "4mm" : margins === "wide" ? "14mm" : "8mm"} !important;
              box-shadow: none !important;
              border: none !important;
              transform: none !important;
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

export default UniversalPrintStudio;
