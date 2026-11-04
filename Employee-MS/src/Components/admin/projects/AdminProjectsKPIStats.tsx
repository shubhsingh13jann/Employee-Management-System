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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-3">
      {/* 1. Total Initiatives */}
      <div
        onClick={() => handleFilter("all")}
        className={`relative overflow-hidden rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all flex items-center justify-between cursor-pointer select-none ${
          statusFilter === "all"
            ? "bg-gradient-to-br from-blue-100/90 via-blue-50 to-indigo-100/80 border-blue-400 ring-2 ring-blue-400/40 shadow-xs"
            : "bg-gradient-to-br from-white via-white to-blue-50/40 border-slate-200/90 hover:border-blue-400 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to view all strategic initiatives"
      >
        {/* Left: Icon & 3-line Text with Equal Spacing */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
            <i className="bi bi-folder2-open"></i>
          </div>

          <div className="flex flex-col justify-center min-w-0 py-0.5">
            {/* Line 1: Title */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider leading-tight m-0 p-0 truncate">
              Total Initiatives
            </p>
            {/* Line 2: Value + Badge */}
            <div className="flex items-center gap-1.5 my-0.5 leading-none">
              <span className="text-base sm:text-lg font-black text-slate-900 leading-none m-0 p-0">
                {totalCount}
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 leading-none">
                {completedCount} Done
              </span>
            </div>
            {/* Line 3: Subtitle */}
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 font-medium leading-normal m-0 p-0 block truncate">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleFilter("planning");
                }}
                className={`hover:underline cursor-pointer ${
                  statusFilter === "planning" ? "text-indigo-600 underline font-bold" : ""
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
                className={`hover:underline cursor-pointer ${
                  statusFilter === "active" ? "text-emerald-600 underline font-bold" : ""
                }`}
                title="Click to isolate Active initiatives"
              >
                {activeCount} Active
              </span>
            </p>
          </div>
        </div>

        {/* Silky Wave Background Effect (Card 1 - Blue/Indigo) */}
        <div className="absolute right-0 bottom-0 w-32 sm:w-40 h-full pointer-events-none overflow-hidden rounded-br-xl z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 80"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="waveGradCardProj1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waveFillCardProj1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.01" />
                <stop offset="60%" stopColor="#818cf8" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 10,80 C 60,74 110,38 160,18 L 160,80 Z"
              fill="url(#waveFillCardProj1)"
            />
            <path
              d="M 0,80 C 50,75 105,42 160,16"
              stroke="url(#waveGradCardProj1)"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <path
              d="M 22,80 C 68,70 118,34 160,28"
              stroke="url(#waveGradCardProj1)"
              strokeWidth="1.0"
              strokeOpacity="0.45"
            />
            <path
              d="M 44,80 C 85,65 130,26 160,40"
              stroke="url(#waveGradCardProj1)"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <path
              d="M 68,80 C 104,60 142,18 160,54"
              stroke="url(#waveGradCardProj1)"
              strokeWidth="0.7"
              strokeOpacity="0.25"
            />
          </svg>
        </div>
      </div>

      {/* 2. In-Flight Active Execution */}
      <div
        onClick={() => handleFilter("active")}
        className={`relative overflow-hidden rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all flex items-center justify-between cursor-pointer select-none ${
          statusFilter === "active"
            ? "bg-gradient-to-br from-emerald-100/90 via-emerald-50 to-teal-100/80 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs"
            : "bg-gradient-to-br from-white via-white to-emerald-50/40 border-slate-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to isolate in-flight active initiatives"
      >
        {/* Left: Icon & 3-line Text with Equal Spacing */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
            <i className="bi bi-lightning-charge-fill"></i>
          </div>

          <div className="flex flex-col justify-center min-w-0 py-0.5">
            {/* Line 1: Title */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider leading-tight m-0 p-0 truncate">
              In-Flight Execution
            </p>
            {/* Line 2: Value + Badge */}
            <div className="flex items-center gap-1.5 my-0.5 leading-none">
              <span className="text-base sm:text-lg font-black text-slate-900 leading-none m-0 p-0">
                {activeCount}
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>
            {/* Line 3: Subtitle */}
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 font-medium leading-normal m-0 p-0 block truncate">
              Cross-department delivery
            </p>
          </div>
        </div>

        {/* Silky Wave Background Effect (Card 2 - Emerald/Teal) */}
        <div className="absolute right-0 bottom-0 w-32 sm:w-40 h-full pointer-events-none overflow-hidden rounded-br-xl z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 80"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="waveGradCardProj2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waveFillCardProj2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.01" />
                <stop offset="60%" stopColor="#14b8a6" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 10,80 C 60,74 110,38 160,18 L 160,80 Z"
              fill="url(#waveFillCardProj2)"
            />
            <path
              d="M 0,80 C 50,75 105,42 160,16"
              stroke="url(#waveGradCardProj2)"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <path
              d="M 22,80 C 68,70 118,34 160,28"
              stroke="url(#waveGradCardProj2)"
              strokeWidth="1.0"
              strokeOpacity="0.45"
            />
            <path
              d="M 44,80 C 85,65 130,26 160,40"
              stroke="url(#waveGradCardProj2)"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <path
              d="M 68,80 C 104,60 142,18 160,54"
              stroke="url(#waveGradCardProj2)"
              strokeWidth="0.7"
              strokeOpacity="0.25"
            />
          </svg>
        </div>
      </div>

      {/* 3. Critical Overdue / At Risk */}
      <div
        onClick={() => handleFilter("critical")}
        className={`relative overflow-hidden rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all flex items-center justify-between cursor-pointer select-none ${
          isCriticalActive
            ? "bg-gradient-to-br from-rose-100/90 via-rose-50 to-orange-100/80 border-rose-400 ring-2 ring-rose-400/40 shadow-xs"
            : criticalCount > 0
            ? "bg-gradient-to-br from-rose-50/70 via-orange-50/40 to-rose-100/60 border-rose-300 hover:border-rose-400 shadow-2xs hover:shadow-xs"
            : "bg-gradient-to-br from-white via-white to-rose-50/30 border-slate-200/90 hover:border-rose-300 shadow-2xs hover:shadow-xs"
        }`}
        title={criticalCount > 0 ? "Click to isolate overdue/at-risk initiatives" : "No overdue initiatives"}
      >
        {/* Left: Icon & 3-line Text with Equal Spacing */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs border ${
              criticalCount > 0
                ? "bg-rose-100/90 border-rose-300 text-rose-700"
                : "bg-rose-50 border-rose-200/70 text-rose-600"
            }`}
          >
            <i className="bi bi-exclamation-octagon-fill"></i>
          </div>

          <div className="flex flex-col justify-center min-w-0 py-0.5">
            {/* Line 1: Title */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-rose-800 uppercase tracking-wider leading-tight m-0 p-0 truncate flex items-center gap-1.5">
              <span>Critical / Overdue</span>
              {criticalCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </p>
            {/* Line 2: Value + Badge */}
            <div className="flex items-center gap-1.5 my-0.5 leading-none">
              <span className={`text-base sm:text-lg font-black leading-none m-0 p-0 ${criticalCount > 0 ? "text-rose-900" : "text-slate-900"}`}>
                {criticalCount}
              </span>
              {criticalCount > 0 ? (
                <span className="text-[9px] sm:text-[9.5px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 leading-none">
                  Action Required
                </span>
              ) : (
                <span className="text-[9px] sm:text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none">
                  On Track
                </span>
              )}
            </div>
            {/* Line 3: Subtitle */}
            <p className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium leading-normal m-0 p-0 block truncate">
              {criticalCount > 0 ? "Past target milestone date" : "Zero delivery bottlenecks"}
            </p>
          </div>
        </div>

        {/* Silky Wave Background Effect (Card 3 - Rose/Orange) */}
        <div className="absolute right-0 bottom-0 w-32 sm:w-40 h-full pointer-events-none overflow-hidden rounded-br-xl z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 80"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="waveGradCardProj3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#fb923c" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waveFillCardProj3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.01" />
                <stop offset="60%" stopColor="#fb923c" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 10,80 C 60,74 110,38 160,18 L 160,80 Z"
              fill="url(#waveFillCardProj3)"
            />
            <path
              d="M 0,80 C 50,75 105,42 160,16"
              stroke="url(#waveGradCardProj3)"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <path
              d="M 22,80 C 68,70 118,34 160,28"
              stroke="url(#waveGradCardProj3)"
              strokeWidth="1.0"
              strokeOpacity="0.45"
            />
            <path
              d="M 44,80 C 85,65 130,26 160,40"
              stroke="url(#waveGradCardProj3)"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <path
              d="M 68,80 C 104,60 142,18 160,54"
              stroke="url(#waveGradCardProj3)"
              strokeWidth="0.7"
              strokeOpacity="0.25"
            />
          </svg>
        </div>
      </div>

      {/* 4. Aggregate Task Velocity & Delivered */}
      <div
        onClick={() => handleFilter("completed")}
        className={`relative overflow-hidden rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all flex items-center justify-between cursor-pointer select-none ${
          statusFilter === "completed"
            ? "bg-gradient-to-br from-purple-100/90 via-purple-50 to-violet-100/80 border-purple-400 ring-2 ring-purple-400/40 shadow-xs"
            : "bg-gradient-to-br from-white via-white to-purple-50/40 border-slate-200/90 hover:border-purple-400 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to isolate delivered/completed initiatives"
      >
        {/* Left: Icon & 3-line Text with Equal Spacing */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
            <i className="bi bi-speedometer2"></i>
          </div>

          <div className="flex flex-col justify-center min-w-0 py-0.5">
            {/* Line 1: Title */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider leading-tight m-0 p-0 truncate">
              Task Velocity Rate
            </p>
            {/* Line 2: Value + Badge */}
            <div className="flex items-center gap-1.5 my-0.5 leading-none">
              <span className="text-base sm:text-lg font-black text-slate-900 leading-none m-0 p-0">
                {overallVelocity}%
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 leading-none">
                {completedCount} Delivered
              </span>
            </div>
            {/* Line 3: Subtitle */}
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 font-medium leading-normal m-0 p-0 block truncate">
              Average deliverable completion
            </p>
          </div>
        </div>

        {/* Silky Wave Background Effect (Card 4 - Purple/Violet) */}
        <div className="absolute right-0 bottom-0 w-32 sm:w-40 h-full pointer-events-none overflow-hidden rounded-br-xl z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 80"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="waveGradCardProj4" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#e879f9" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waveFillCardProj4" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.01" />
                <stop offset="60%" stopColor="#a855f7" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#e879f9" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 10,80 C 60,74 110,38 160,18 L 160,80 Z"
              fill="url(#waveFillCardProj4)"
            />
            <path
              d="M 0,80 C 50,75 105,42 160,16"
              stroke="url(#waveGradCardProj4)"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <path
              d="M 22,80 C 68,70 118,34 160,28"
              stroke="url(#waveGradCardProj4)"
              strokeWidth="1.0"
              strokeOpacity="0.45"
            />
            <path
              d="M 44,80 C 85,65 130,26 160,40"
              stroke="url(#waveGradCardProj4)"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <path
              d="M 68,80 C 104,60 142,18 160,54"
              stroke="url(#waveGradCardProj4)"
              strokeWidth="0.7"
              strokeOpacity="0.25"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
