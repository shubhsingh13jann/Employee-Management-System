import React from "react";

interface HierarchyHeaderProps {
  totalCount: number;
  onOpenAssignModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const HierarchyHeader: React.FC<HierarchyHeaderProps> = ({
  totalCount,
  onOpenAssignModal,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Description */}
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center text-2xl shadow-inner shrink-0">
          <i className="bi bi-diagram-3-fill"></i>
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-0">
              Workforce Team Hierarchy
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              👑 Chain of Command
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{totalCount} Active Mappings</span>
            </span>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 mb-0 font-normal">
            Define, inspect, and govern multi-tier reporting relationships between Staff, Supervisors, and Managers.
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          title="Refresh Hierarchy Data"
        >
          <i className={`bi bi-arrow-clockwise text-sm ${isRefreshing ? "animate-spin" : ""}`}></i>
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <button
          type="button"
          onClick={onOpenAssignModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <i className="bi bi-person-plus-fill text-sm"></i>
          <span>Assign / Reassign Team</span>
        </button>
      </div>
    </div>
  );
};
