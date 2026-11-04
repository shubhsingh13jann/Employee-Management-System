import React from "react";

interface AdminProjectsHeaderProps {
  totalCount: number;
  onOpenCreateModal: () => void;
  onOpenCapacityDrawer: () => void;
  onExportCSV: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  viewMode: "table" | "grid" | "milestones";
  onViewModeChange: (mode: "table" | "grid" | "milestones") => void;
}

export const AdminProjectsHeader: React.FC<AdminProjectsHeaderProps> = ({
  totalCount,
  onOpenCreateModal,
  onOpenCapacityDrawer,
  onExportCSV,
  onRefresh,
  isRefreshing,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-[#070d28] via-[#0d164d] to-[#1c1252] border border-indigo-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 select-none">
      {/* Micro-Lightning Wave Effect Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-0">
        <svg
          className="absolute right-0 bottom-0 w-[65%] sm:w-[52%] h-full text-cyan-400 micro-lightning-waves opacity-85"
          viewBox="0 0 600 120"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="projHeroWave1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
              <stop offset="45%" stopColor="#818cf8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="projHeroWaveCyan" x1="0%" y1="100%" x2="100%" y2="0%">
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
                key={`proj-wave-1-${i}`}
                d={`M ${startX},130 C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                stroke="url(#projHeroWave1)"
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
                key={`proj-wave-2-${i}`}
                d={`M ${startX},130 C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                stroke="url(#projHeroWaveCyan)"
                strokeWidth="0.8"
                strokeOpacity={opacity}
              />
            );
          })}
        </svg>
      </div>

      {/* Left Side: Icon & Single-Row Title */}
      <div className="relative z-10 flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-400/40 flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md shadow-blue-500/25 shrink-0 backdrop-blur-xs">
          <i className="bi bi-kanban-fill text-blue-200"></i>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white mb-0.5 whitespace-nowrap">
              Enterprise Projects & Strategic Milestones
            </h2>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              🎯 Strategic Portfolio
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{totalCount} Total Initiatives</span>
            </span>
          </div>
          <p className="text-[11px] text-indigo-200/80 mb-0 font-normal truncate max-w-[280px] sm:max-w-md">
            Cross-department project tracking, milestone delivery velocity, and supervisor capacity governance.
          </p>
        </div>
      </div>

      {/* Right Side: View Switcher & Action Controls */}
      <div className="relative z-10 flex items-center gap-1.5 sm:gap-2 shrink-0 self-end md:self-center flex-wrap">
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
            title="Table Master View"
          >
            <i className="bi bi-table text-xs"></i>
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
              viewMode === "grid"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
            title="Cards Grid View"
          >
            <i className="bi bi-grid-fill text-xs"></i>
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("milestones")}
            className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
              viewMode === "milestones"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
            title="Milestone Timeline View"
          >
            <i className="bi bi-calendar-range-fill text-xs"></i>
            <span className="hidden sm:inline">Milestones</span>
          </button>
        </div>

        {/* Supervisor Capacity Heatmap Trigger */}
        <button
          type="button"
          onClick={onOpenCapacityDrawer}
          className="h-8 px-2.5 sm:px-3 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs backdrop-blur-xs"
          title="Inspect Cross-Department Supervisor Workload Heatmap"
        >
          <i className="bi bi-fire text-amber-400 text-xs"></i>
          <span className="hidden sm:inline">Capacity</span>
        </button>

        {/* CSV Export Button */}
        <button
          type="button"
          onClick={onExportCSV}
          className="h-8 px-2.5 sm:px-3 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 border border-white/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs backdrop-blur-xs"
          title="Export Projects to CSV"
        >
          <i className="bi bi-download text-xs text-slate-300"></i>
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white border border-white/20 text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 backdrop-blur-xs"
          title="Refresh Initiative Data"
        >
          <i className={`bi bi-arrow-clockwise ${isRefreshing ? "animate-spin text-indigo-400" : ""}`}></i>
        </button>

        {/* Create Strategic Initiative CTA */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="h-8 px-3 sm:px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <i className="bi bi-plus-lg text-xs"></i>
          <span>New Initiative</span>
        </button>
      </div>
    </div>
  );
};
