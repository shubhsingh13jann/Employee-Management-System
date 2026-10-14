import React, { useState, useEffect, useRef } from "react";

interface HierarchyHeaderProps {
  totalCount: number;
  onOpenAssignModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  viewMode: "table" | "tree" | "squad";
  onViewModeChange: (mode: "table" | "tree" | "squad") => void;
  onOpenExportModal?: () => void;
  onPrint?: () => void;
  onOpenAuditModal?: () => void;
  onOpenAutoAssignWizard?: () => void;
}

export const HierarchyHeader: React.FC<HierarchyHeaderProps> = ({
  totalCount,
  onOpenAssignModal,
  onRefresh,
  isRefreshing,
  viewMode,
  onViewModeChange,
  onOpenExportModal,
  onPrint,
  onOpenAuditModal,
  onOpenAutoAssignWizard,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className={`relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-[#070d28] via-[#0d164d] to-[#1c1252] border border-indigo-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 select-none mb-3 ${isMenuOpen ? "z-40" : "z-20"}`}>
      {/* Micro-Lightning Wave Effect Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-0">
        <svg
          className="absolute right-0 bottom-0 w-[65%] sm:w-[52%] h-full text-cyan-400 micro-lightning-waves opacity-85"
          viewBox="0 0 600 120"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="hierarchyHeroWave1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="45%" stopColor="#818cf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="hierarchyHeroWaveCyan" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Primary Harmonic Fan */}
          {Array.from({ length: 24 }).map((_, i) => {
            const startX = 50 + i * 14;
            const cp1x = 180 + i * 11;
            const cp1y = 110 - i * 3.2;
            const cp2x = 340 + i * 8;
            const cp2y = 35 - i * 1.5;
            const endX = 490 + i * 6;
            const endY = -10 + i * 1.8;
            const opacity = 0.08 + Math.sin((i / 24) * Math.PI) * 0.32;
            return (
              <path
                key={`hierarchy-wave-1-${i}`}
                d={`M ${startX},130 C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                stroke="url(#hierarchyHeroWave1)"
                strokeWidth={i % 3 === 0 ? "1.2" : "0.75"}
                strokeOpacity={opacity}
              />
            );
          })}

          {/* Intersecting Silk Filament Ribbon */}
          {Array.from({ length: 16 }).map((_, i) => {
            const startX = 140 + i * 16;
            const cp1x = 260 + i * 10;
            const cp1y = 95 - i * 2.5;
            const cp2x = 400 + i * 7;
            const cp2y = 45 - i * 1.2;
            const endX = 550 + i * 5;
            const endY = 5 + i * 2.2;
            const opacity = 0.05 + Math.sin((i / 16) * Math.PI) * 0.22;
            return (
              <path
                key={`hierarchy-wave-2-${i}`}
                d={`M ${startX},130 C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                stroke="url(#hierarchyHeroWaveCyan)"
                strokeWidth="0.8"
                strokeOpacity={opacity}
              />
            );
          })}
        </svg>
      </div>

      {/* Left Side: Icon & Title */}
      <div className="relative z-10 flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-400/40 flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md shadow-blue-500/25 shrink-0 backdrop-blur-xs">
          <i className="bi bi-diagram-3-fill text-blue-200"></i>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white mb-0.5 whitespace-nowrap">
              Workforce Team Hierarchy
            </h2>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              👑 Chain of Command
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{totalCount} Active Mappings</span>
            </span>
          </div>
          <p className="text-[11px] text-indigo-200/80 mb-0 font-normal truncate max-w-[280px] sm:max-w-md">
            Define, inspect, and govern multi-tier reporting relationships between Staff, Supervisors, and Managers.
          </p>
        </div>
      </div>

      {/* Right Side: View Switcher & Action Controls */}
      <div className="relative z-10 flex items-center gap-2 shrink-0 self-end md:self-center">
        {/* Segmented View Mode Switcher */}
        <div className="h-9 p-0.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-1 backdrop-blur-xs box-border shadow-xs">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
              viewMode === "table"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
            title="Table View"
          >
            <i className="bi bi-table text-sm"></i>
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("tree")}
            className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
              viewMode === "tree"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
            title="Org Chart Tree View"
          >
            <i className="bi bi-diagram-3 text-sm"></i>
            <span className="hidden sm:inline">Org Chart</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("squad")}
            className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
              viewMode === "squad"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
            title="Squads View"
          >
            <i className="bi bi-people text-sm"></i>
            <span className="hidden sm:inline">Squads</span>
          </button>
        </div>

        {/* Enlarged Triple Line Button & Consolidated Dropdown Menu (Matching User Directory standard) */}
        <div className="relative z-50" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
              isMenuOpen
                ? "bg-indigo-600 text-white border border-indigo-400/50 shadow-indigo-500/30 ring-2 ring-indigo-400/30"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs"
            }`}
            title="Hierarchy Management & Actions Menu"
            aria-label="Toggle Actions Menu"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>

          {/* Floating Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 sm:w-60 min-w-[210px] rounded-xl bg-slate-900 border border-indigo-500/50 shadow-2xl shadow-black/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenAssignModal();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm text-left whitespace-nowrap"
              >
                <i className="bi bi-person-plus-fill font-bold text-xs shrink-0"></i>
                <span className="whitespace-nowrap">Assign Team Member</span>
              </button>

              <div className="h-px bg-white/10 my-1.5"></div>

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onRefresh();
                }}
                disabled={isRefreshing}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 text-left whitespace-nowrap"
              >
                <i className={`bi bi-arrow-clockwise text-indigo-400 text-sm shrink-0 ${isRefreshing ? "animate-spin" : ""}`}></i>
                <span className="whitespace-nowrap">Refresh Hierarchy</span>
              </button>

              <div className="h-px bg-white/10 my-1.5"></div>

              {onOpenExportModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenExportModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left whitespace-nowrap"
                >
                  <i className="bi bi-file-earmark-spreadsheet text-emerald-400 text-sm shrink-0"></i>
                  <span className="whitespace-nowrap">Export Hierarchy CSV</span>
                </button>
              )}

              {onPrint && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onPrint();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left whitespace-nowrap"
                >
                  <i className="bi bi-printer text-sky-400 text-sm shrink-0"></i>
                  <span className="whitespace-nowrap">Print Hierarchy Dossier</span>
                </button>
              )}

              {onOpenAuditModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAuditModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left whitespace-nowrap"
                >
                  <i className="bi bi-clock-history text-amber-400 text-sm shrink-0"></i>
                  <span className="whitespace-nowrap">Hierarchy Audit Trail</span>
                </button>
              )}

              {onOpenAutoAssignWizard && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAutoAssignWizard();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-amber-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left whitespace-nowrap"
                >
                  <i className="bi bi-magic text-amber-400 text-sm shrink-0"></i>
                  <span className="whitespace-nowrap">Auto-Assign Wizard</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
