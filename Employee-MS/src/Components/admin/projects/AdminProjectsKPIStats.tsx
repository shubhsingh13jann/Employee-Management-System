import React from "react";

interface AdminProjectsKPIStatsProps {
  totalCount: number;
  activeCount: number;
  planningCount: number;
  completedCount: number;
  criticalCount: number;
  overallVelocity: number;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  onFilterOverdue?: () => void;
  isOverdueFilterActive?: boolean;
}

export const AdminProjectsKPIStats: React.FC<AdminProjectsKPIStatsProps> = ({
  totalCount,
  activeCount,
  planningCount,
  completedCount,
  criticalCount,
  overallVelocity,
  statusFilter = "all",
  onStatusFilterChange,
  onFilterOverdue,
  isOverdueFilterActive,
}) => {
  const handleFilter = (targetStatus: string) => {
    if (onStatusFilterChange) {
      if (targetStatus === "all") {
        onStatusFilterChange("all");
      } else {
        onStatusFilterChange(statusFilter === targetStatus ? "all" : targetStatus);
      }
    } else if (targetStatus === "critical" && onFilterOverdue) {
      onFilterOverdue();
    }
  };

  const isCriticalActive = isOverdueFilterActive ?? (statusFilter === "critical");

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
      {/* 1. Total Strategic Initiatives */}
      <div
        onClick={() => handleFilter("all")}
        className={`rounded-xl p-3 sm:p-3.5 border transition-all flex items-center justify-between cursor-pointer ${
          statusFilter === "all"
            ? "bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-400/30 shadow-xs"
            : "bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to view all strategic initiatives"
      >
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
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleFilter("planning");
              }}
              className={`font-semibold hover:underline cursor-pointer ${
                statusFilter === "planning" ? "text-indigo-600 underline font-bold" : "text-slate-500"
              }`}
              title="Click to isolate Planning initiatives"
            >
              {planningCount} Planning
            </span>{" "}
            •{" "}
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleFilter("active");
              }}
              className={`font-semibold hover:underline cursor-pointer ${
                statusFilter === "active" ? "text-emerald-600 underline font-bold" : "text-slate-500"
              }`}
              title="Click to isolate Active initiatives"
            >
              {activeCount} Active
            </span>
          </p>
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-inner border ${
            statusFilter === "all"
              ? "bg-indigo-100 border-indigo-300 text-indigo-700"
              : "bg-indigo-50 border-indigo-100 text-indigo-600"
          }`}
        >
          <i className="bi bi-folder2-open"></i>
        </div>
      </div>

      {/* 2. In-Flight Active Execution */}
      <div
        onClick={() => handleFilter("active")}
        className={`rounded-xl p-3 sm:p-3.5 border transition-all flex items-center justify-between cursor-pointer ${
          statusFilter === "active"
            ? "bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs"
            : "bg-white border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/30 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to isolate in-flight active initiatives"
      >
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
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-inner border ${
            statusFilter === "active"
              ? "bg-emerald-100 border-emerald-300 text-emerald-700"
              : "bg-emerald-50 border-emerald-100 text-emerald-600"
          }`}
        >
          <i className="bi bi-lightning-charge-fill"></i>
        </div>
      </div>

      {/* 3. Critical Overdue / At Risk */}
      <div
        onClick={() => handleFilter("critical")}
        className={`rounded-xl p-3 sm:p-3.5 border transition-all flex items-center justify-between cursor-pointer ${
          isCriticalActive
            ? "bg-rose-100/70 border-rose-400 ring-2 ring-rose-400/40 shadow-xs"
            : criticalCount > 0
            ? "bg-rose-50/70 border-rose-200 hover:border-rose-300 hover:bg-rose-50 shadow-2xs hover:shadow-xs"
            : "bg-white border-slate-200/90 hover:border-rose-300 hover:bg-rose-50/30 shadow-2xs hover:shadow-xs"
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
            isCriticalActive
              ? "bg-rose-200/80 border-rose-400 text-rose-800"
              : criticalCount > 0
              ? "bg-rose-100 border-rose-200 text-rose-700"
              : "bg-slate-50 border-slate-200 text-slate-400"
          }`}
        >
          <i className="bi bi-exclamation-octagon-fill"></i>
        </div>
      </div>

      {/* 4. Aggregate Task Velocity & Delivered */}
      <div
        onClick={() => handleFilter("completed")}
        className={`rounded-xl p-3 sm:p-3.5 border transition-all flex items-center justify-between cursor-pointer ${
          statusFilter === "completed"
            ? "bg-blue-50/80 border-blue-400 ring-2 ring-blue-400/40 shadow-xs"
            : "bg-white border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/30 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to isolate delivered/completed initiatives"
      >
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            Task Velocity Rate
          </p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-0">
              {overallVelocity}%
            </h3>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
              {completedCount} Delivered
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 mb-0">
            Average deliverable completion
          </p>
        </div>
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-inner border ${
            statusFilter === "completed"
              ? "bg-blue-100 border-blue-300 text-blue-700"
              : "bg-blue-50 border-blue-100 text-blue-600"
          }`}
        >
          <i className="bi bi-speedometer2"></i>
        </div>
      </div>
    </div>
  );
};
