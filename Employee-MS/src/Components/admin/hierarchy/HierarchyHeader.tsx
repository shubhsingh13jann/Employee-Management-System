import React from "react";

interface HierarchyHeaderProps {
  totalCount: number;
  onOpenAssignModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  viewMode: "table" | "tree" | "squad";
  onViewModeChange: (mode: "table" | "tree" | "squad") => void;
}

export const HierarchyHeader: React.FC<HierarchyHeaderProps> = ({
  totalCount,
  onOpenAssignModal,
  onRefresh,
  isRefreshing,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 shadow-md border border-slate-800/80 mb-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Title & Description */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center text-lg shadow-inner shrink-0">
          <i className="bi bi-diagram-3-fill"></i>
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white mb-0">
              Workforce Team Hierarchy
            </h1>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              👑 Chain of Command
            </span>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{totalCount} Active Mappings</span>
            </span>
          </div>
          <p className="text-slate-300 text-[11px] sm:text-xs mt-0.5 mb-0 font-normal">
            Define, inspect, and govern multi-tier reporting relationships between Staff, Supervisors, and Managers.
          </p>
        </div>
      </div>

      {/* Header Actions & Segmented View Mode Switcher */}
      <div className="flex items-center gap-2.5 flex-wrap justify-between lg:justify-end">
        {/* Segmented View Mode Switcher */}
        <div className="inline-flex p-0.5 rounded-lg bg-slate-950/70 border border-slate-700/80 text-[11px] font-semibold backdrop-blur-xs shadow-inner">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "table"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="bi bi-table text-xs"></i>
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("tree")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "tree"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="bi bi-diagram-3 text-xs"></i>
            <span>Org Chart</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("squad")}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "squad"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <i className="bi bi-people text-xs"></i>
            <span>Squads</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Refresh Hierarchy Data"
          >
            <i className={`bi bi-arrow-clockwise text-xs ${isRefreshing ? "animate-spin" : ""}`}></i>
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={onOpenAssignModal}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <i className="bi bi-person-plus-fill text-xs"></i>
            <span>Assign Team</span>
          </button>
        </div>
      </div>
    </div>
  );
};
