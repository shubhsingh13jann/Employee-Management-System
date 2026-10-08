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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Mapped Relationships */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Mapped Staff
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-0">
              {totalMapped}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 mb-0">
            Assigned to reporting lines
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl shrink-0 shadow-inner">
          <i className="bi bi-people-fill"></i>
        </div>
      </div>

      {/* 2. Active Team Leads (Supervisors) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Active Team Leads
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-0">
              {totalSupervisors}
            </h3>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              ~{avgSquadSize} / lead
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 mb-0">
            Supervising squads
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-xl shrink-0 shadow-inner">
          <i className="bi bi-person-badge-fill"></i>
        </div>
      </div>

      {/* 3. Department Managers */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Dept Managers
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-0">
              {totalManagers}
            </h3>
            <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Executive
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 mb-0">
            Top chain of command
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center text-xl shrink-0 shadow-inner">
          <i className="bi bi-person-gear"></i>
        </div>
      </div>

      {/* 4. Unassigned / Orphaned Staff */}
      <div
        onClick={onFilterUnassigned}
        className={`rounded-2xl p-4 sm:p-5 border transition-all flex items-center justify-between cursor-pointer ${
          isUnassignedFilterActive
            ? "bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/40 shadow-sm"
            : unassignedCount > 0
            ? "bg-amber-50/70 border-amber-200 hover:border-amber-300 hover:bg-amber-50 shadow-2xs hover:shadow-md"
            : "bg-white border-slate-200/90 shadow-2xs"
        }`}
        title={unassignedCount > 0 ? "Click to view unassigned staff" : "All staff assigned"}
      >
        <div>
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span>Orphaned Staff</span>
            {unassignedCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl sm:text-3xl font-extrabold mb-0 ${unassignedCount > 0 ? "text-amber-900" : "text-slate-900"}`}>
              {unassignedCount}
            </h3>
            {unassignedCount > 0 ? (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                Action Needed
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                100% Assigned
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 mb-0">
            {unassignedCount > 0 ? "Staff missing supervisor" : "No orphaned staff"}
          </p>
        </div>
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-inner border ${
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
