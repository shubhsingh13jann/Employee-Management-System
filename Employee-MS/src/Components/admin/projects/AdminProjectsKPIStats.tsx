import React from "react";

interface AdminProjectsKPIStatsProps {
  totalCount: number;
  activeCount: number;
  planningCount: number;
  completedCount: number;
  criticalCount: number;
  overallVelocity: number;
  onFilterOverdue: () => void;
  isOverdueFilterActive: boolean;
}

export const AdminProjectsKPIStats: React.FC<AdminProjectsKPIStatsProps> = ({
  totalCount,
  activeCount,
  planningCount,
  completedCount,
  criticalCount,
  overallVelocity,
  onFilterOverdue,
  isOverdueFilterActive,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
      {/* 1. Total Strategic Initiatives */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Total Initiatives
          </p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-0">
              {totalCount}
            </h3>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
              {completedCount} Done
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 mb-0">
            {planningCount} Planning • {activeCount} Active
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-base shrink-0 shadow-inner">
          <i className="bi bi-folder2-open"></i>
        </div>
      </div>

      {/* 2. In-Flight Active Execution */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            In-Flight Execution
          </p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-0">
              {activeCount}
            </h3>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Active</span>
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 mb-0">
            Cross-department delivery
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-base shrink-0 shadow-inner">
          <i className="bi bi-lightning-charge-fill"></i>
        </div>
      </div>

      {/* 3. Critical Overdue / At Risk */}
      <div
        onClick={onFilterOverdue}
        className={`rounded-xl p-3 sm:p-3.5 border transition-all flex items-center justify-between cursor-pointer ${
          isOverdueFilterActive
            ? "bg-rose-100/70 border-rose-400 ring-2 ring-rose-400/40 shadow-xs"
            : criticalCount > 0
            ? "bg-rose-50/70 border-rose-200 hover:border-rose-300 hover:bg-rose-50 shadow-2xs hover:shadow-xs"
            : "bg-white border-slate-200/90 shadow-2xs"
        }`}
        title={criticalCount > 0 ? "Click to isolate overdue/at-risk initiatives" : "No overdue initiatives"}
      >
        <div>
          <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <span>Critical / Overdue</span>
            {criticalCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            )}
          </p>
          <div className="flex items-baseline gap-1.5">
            <h3 className={`text-xl sm:text-2xl font-black mb-0 ${criticalCount > 0 ? "text-rose-900" : "text-slate-900"}`}>
              {criticalCount}
            </h3>
            {criticalCount > 0 ? (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">
                Action Required
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                On Track
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 mb-0">
            {criticalCount > 0 ? "Past target milestone date" : "Zero delivery bottlenecks"}
          </p>
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-inner border ${
            criticalCount > 0
              ? "bg-rose-100 border-rose-200 text-rose-700"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <i className="bi bi-exclamation-octagon-fill"></i>
        </div>
      </div>

      {/* 4. Aggregate Task Velocity */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Task Velocity Rate
          </p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-0">
              {overallVelocity}%
            </h3>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
              Rollup
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 mb-0">
            Average deliverable completion
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-base shrink-0 shadow-inner">
          <i className="bi bi-speedometer2"></i>
        </div>
      </div>
    </div>
  );
};
