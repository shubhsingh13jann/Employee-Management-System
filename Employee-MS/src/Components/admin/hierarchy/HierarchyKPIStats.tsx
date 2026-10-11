import React from "react";

interface HierarchyKPIStatsProps {
  totalMapped: number;
  totalSupervisors: number;
  totalManagers: number;
  unassignedCount: number;
  onFilterUnassigned?: () => void;
  isUnassignedFilterActive?: boolean;
}

export const HierarchyKPIStats: React.FC<HierarchyKPIStatsProps> = ({
  totalMapped,
  totalSupervisors,
  totalManagers,
  unassignedCount,
  onFilterUnassigned,
  isUnassignedFilterActive,
}) => {
  const avgSquadSize =
    totalSupervisors > 0 ? (totalMapped / totalSupervisors).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-2.5">
      {/* 1. Total Mapped Relationships */}
      <div className="bg-white rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-none">
            Mapped Staff
          </p>
          <div className="flex items-baseline gap-1.5 mt-1 leading-none">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-none mb-0">
              {totalMapped}
            </h3>
            <span className="text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none">
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 mb-0 leading-none truncate">
            Assigned to reporting lines
          </p>
        </div>
        <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs sm:text-sm shrink-0 shadow-inner">
          <i className="bi bi-people-fill"></i>
        </div>
      </div>

      {/* 2. Active Team Leads (Supervisors) */}
      <div className="bg-white rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-none">
            Active Team Leads
          </p>
          <div className="flex items-baseline gap-1.5 mt-1 leading-none">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-none mb-0">
              {totalSupervisors}
            </h3>
            <span className="text-[9.5px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded leading-none">
              ~{avgSquadSize}/lead
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 mb-0 leading-none truncate">
            Supervising squads
          </p>
        </div>
        <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-xs sm:text-sm shrink-0 shadow-inner">
          <i className="bi bi-person-badge-fill"></i>
        </div>
      </div>

      {/* 3. Department Managers */}
      <div className="bg-white rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 leading-none">
            Dept Managers
          </p>
          <div className="flex items-baseline gap-1.5 mt-1 leading-none">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-none mb-0">
              {totalManagers}
            </h3>
            <span className="text-[9.5px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 leading-none">
              Executive
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 mb-0 leading-none truncate">
            Top chain of command
          </p>
        </div>
        <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-xs sm:text-sm shrink-0 shadow-inner">
          <i className="bi bi-person-gear"></i>
        </div>
      </div>

      {/* 4. Unassigned / Orphaned Staff */}
      <div
        onClick={onFilterUnassigned}
        className={`rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 border transition-all flex items-center justify-between cursor-pointer ${
          isUnassignedFilterActive
            ? "bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/40 shadow-xs"
            : unassignedCount > 0
            ? "bg-amber-50/70 border-amber-200 hover:border-amber-300 hover:bg-amber-50 shadow-2xs hover:shadow-xs"
            : "bg-white border-slate-200/90 shadow-2xs"
        }`}
        title={unassignedCount > 0 ? "Click to view unassigned staff" : "All staff assigned"}
      >
        <div className="min-w-0 pr-2">
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-0.5 leading-none flex items-center gap-1.5">
            <span>Orphaned Staff</span>
            {unassignedCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </p>
          <div className="flex items-baseline gap-1.5 mt-1 leading-none">
            <h3 className={`text-lg sm:text-xl font-black leading-none mb-0 ${unassignedCount > 0 ? "text-amber-900" : "text-slate-900"}`}>
              {unassignedCount}
            </h3>
            {unassignedCount > 0 ? (
              <span className="text-[9.5px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 leading-none">
                Action Needed
              </span>
            ) : (
              <span className="text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none">
                100% Assigned
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 mb-0 leading-none truncate">
            {unassignedCount > 0 ? "Staff missing supervisor" : "No orphaned staff"}
          </p>
        </div>
        <div
          className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm shrink-0 shadow-inner border ${
            unassignedCount > 0
              ? "bg-amber-100 border-amber-200 text-amber-700"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <i className="bi bi-person-x-fill"></i>
        </div>
      </div>
    </div>
  );
};
