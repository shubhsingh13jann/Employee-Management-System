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
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-md border border-slate-800 text-white mb-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title and Module Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
            <i className="bi bi-kanban-fill"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white mb-0">
                Enterprise Projects & Strategic Milestones
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/25 text-indigo-300 border border-indigo-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>{totalCount} Total Initiatives</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-0 font-normal mt-0.5">
              Cross-department project tracking, milestone delivery velocity, and supervisor capacity governance.
            </p>
          </div>
        </div>

        {/* View Switcher & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          {/* Segmented View Mode Switcher */}
          <div className="bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/80 flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
              title="Table Master View"
            >
              <i className="bi bi-table text-[11px]"></i>
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
              title="Cards Grid View"
            >
              <i className="bi bi-grid-fill text-[11px]"></i>
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("milestones")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "milestones"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60"
              }`}
              title="Milestone Timeline View"
            >
              <i className="bi bi-calendar-range-fill text-[11px]"></i>
              <span className="hidden sm:inline">Milestones</span>
            </button>
          </div>

          {/* Supervisor Capacity Heatmap Trigger */}
          <button
            type="button"
            onClick={onOpenCapacityDrawer}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Inspect Cross-Department Supervisor Workload Heatmap"
          >
            <i className="bi bi-fire text-amber-400 text-xs"></i>
            <span className="hidden sm:inline">Capacity</span>
          </button>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={onExportCSV}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Export Projects to CSV"
          >
            <i className="bi bi-download text-xs"></i>
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Initiative Data"
          >
            <i className={`bi bi-arrow-clockwise ${isRefreshing ? "animate-spin text-indigo-400" : ""}`}></i>
          </button>

          {/* Create Strategic Initiative CTA */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <i className="bi bi-plus-lg text-xs"></i>
            <span>New Initiative</span>
          </button>
        </div>
      </div>
    </div>
  );
};
