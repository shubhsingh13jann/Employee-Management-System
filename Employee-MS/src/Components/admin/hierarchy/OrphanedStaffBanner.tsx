import React from "react";

interface OrphanedStaffBannerProps {
  unassignedCount: number;
  onQuickAssign: () => void;
  onFilterUnassigned: () => void;
  isFilterActive: boolean;
  onOpenAutoAssignWizard?: () => void;
}

export const OrphanedStaffBanner: React.FC<OrphanedStaffBannerProps> = ({
  unassignedCount,
  onQuickAssign,
  onFilterUnassigned,
  isFilterActive,
  onOpenAutoAssignWizard,
}) => {
  if (unassignedCount <= 0) return null;

  return (
    <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-300/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 border border-amber-400/40 flex items-center justify-center text-xs shrink-0">
          <i className="bi bi-exclamation-triangle-fill"></i>
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-950 mb-0 flex items-center gap-1.5">
            <span>{unassignedCount} Orphaned Staff Members Detected</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          </h4>
          <p className="text-[11px] text-amber-800 mb-0 font-normal">
            These employees are registered in departments but have no active Team Lead or Department Manager mapped.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onFilterUnassigned}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
            isFilterActive
              ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
              : "bg-white hover:bg-amber-100/60 text-amber-900 border-amber-300 shadow-2xs"
          }`}
        >
          <i className="bi bi-funnel mr-1"></i>
          <span>{isFilterActive ? "Showing Unassigned" : "Filter Unassigned"}</span>
        </button>

        <button
          type="button"
          onClick={onQuickAssign}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
        >
          <i className="bi bi-diagram-2 text-xs"></i>
          <span>Assign Now</span>
        </button>

        {onOpenAutoAssignWizard && (
          <button
            type="button"
            onClick={onOpenAutoAssignWizard}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 via-indigo-600 to-indigo-700 hover:from-amber-500 hover:to-indigo-600 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <i className="bi bi-magic text-xs"></i>
            <span>Auto-Assign Wizard</span>
          </button>
        )}
      </div>
    </div>
  );
};
