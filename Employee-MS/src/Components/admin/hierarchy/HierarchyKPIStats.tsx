import React from "react";

interface HierarchyKPIStatsProps {
  totalMapped: number;
  totalSupervisors: number;
  totalManagers: number;
  unassignedCount: number;
  onFilterMapped?: () => void;
  isMappedFilterActive?: boolean;
  onFilterLeads?: () => void;
  isLeadsFilterActive?: boolean;
  onFilterManagers?: () => void;
  isManagersFilterActive?: boolean;
  onFilterUnassigned?: () => void;
  isUnassignedFilterActive?: boolean;
}

export const HierarchyKPIStats: React.FC<HierarchyKPIStatsProps> = ({
  totalMapped,
  totalSupervisors,
  totalManagers,
  unassignedCount,
  onFilterMapped,
  isMappedFilterActive,
  onFilterLeads,
  isLeadsFilterActive,
  onFilterManagers,
  isManagersFilterActive,
  onFilterUnassigned,
  isUnassignedFilterActive,
}) => {
  const avgSquadSize =
    totalSupervisors > 0 ? (totalMapped / totalSupervisors).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-3">
      {/* 1. Total Mapped Relationships */}
      <div
        onClick={onFilterMapped}
        className={`relative overflow-hidden rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all flex items-center justify-between cursor-pointer select-none ${
          isMappedFilterActive
            ? "bg-gradient-to-br from-blue-100/90 via-blue-50 to-indigo-100/80 border-blue-400 ring-2 ring-blue-400/40 shadow-xs"
            : "bg-gradient-to-br from-white via-white to-blue-50/40 border-slate-200/90 hover:border-blue-400 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to toggle mapped staff filter"
      >
        {/* Left: Icon & 3-line Text with Equal Spacing */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
            <i className="bi bi-people-fill"></i>
          </div>

          <div className="flex flex-col justify-center min-w-0 py-0.5">
            {/* Line 1: Title */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider leading-tight m-0 p-0 truncate">
              Mapped Staff
            </p>
            {/* Line 2: Value + Badge */}
            <div className="flex items-center gap-1.5 my-0.5 leading-none">
              <span className="text-base sm:text-lg font-black text-slate-900 leading-none m-0 p-0">
                {totalMapped}
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none">
                Active
              </span>
            </div>
            {/* Line 3: Subtitle (Fully visible, generous line height) */}
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 font-medium leading-normal m-0 p-0 block truncate">
              Assigned to reporting lines
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
              <linearGradient id="waveGradCard1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#818cf8" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waveFillCard1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.01" />
                <stop offset="60%" stopColor="#818cf8" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 10,80 C 60,74 110,38 160,18 L 160,80 Z"
              fill="url(#waveFillCard1)"
            />
            <path
              d="M 0,80 C 50,75 105,42 160,16"
              stroke="url(#waveGradCard1)"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <path
              d="M 22,80 C 68,70 118,34 160,28"
              stroke="url(#waveGradCard1)"
              strokeWidth="1.0"
              strokeOpacity="0.45"
            />
            <path
              d="M 44,80 C 85,65 130,26 160,40"
              stroke="url(#waveGradCard1)"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <path
              d="M 68,80 C 104,60 142,18 160,54"
              stroke="url(#waveGradCard1)"
              strokeWidth="0.7"
              strokeOpacity="0.25"
            />
          </svg>
        </div>
      </div>

      {/* 2. Active Team Leads (Supervisors) */}
      <div
        onClick={onFilterLeads}
        className={`relative overflow-hidden rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all flex items-center justify-between cursor-pointer select-none ${
          isLeadsFilterActive
            ? "bg-gradient-to-br from-purple-100/90 via-purple-50 to-violet-100/80 border-purple-400 ring-2 ring-purple-400/40 shadow-xs"
            : "bg-gradient-to-br from-white via-white to-purple-50/40 border-slate-200/90 hover:border-purple-400 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to toggle team leads filter"
      >
        {/* Left: Icon & 3-line Text with Equal Spacing */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
            <i className="bi bi-people-fill"></i>
          </div>

          <div className="flex flex-col justify-center min-w-0 py-0.5">
            {/* Line 1: Title */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider leading-tight m-0 p-0 truncate">
              Active Team Leads
            </p>
            {/* Line 2: Value + Badge */}
            <div className="flex items-center gap-1.5 my-0.5 leading-none">
              <span className="text-base sm:text-lg font-black text-slate-900 leading-none m-0 p-0">
                {totalSupervisors}
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 leading-none">
                ~{avgSquadSize}/lead
              </span>
            </div>
            {/* Line 3: Subtitle */}
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 font-medium leading-normal m-0 p-0 block truncate">
              Supervising squads
            </p>
          </div>
        </div>

        {/* Silky Wave Background Effect (Card 2 - Purple/Violet) */}
        <div className="absolute right-0 bottom-0 w-32 sm:w-40 h-full pointer-events-none overflow-hidden rounded-br-xl z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 80"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="waveGradCard2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#a855f7" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#e879f9" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waveFillCard2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.01" />
                <stop offset="60%" stopColor="#a855f7" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#e879f9" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 10,80 C 60,74 110,38 160,18 L 160,80 Z"
              fill="url(#waveFillCard2)"
            />
            <path
              d="M 0,80 C 50,75 105,42 160,16"
              stroke="url(#waveGradCard2)"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <path
              d="M 22,80 C 68,70 118,34 160,28"
              stroke="url(#waveGradCard2)"
              strokeWidth="1.0"
              strokeOpacity="0.45"
            />
            <path
              d="M 44,80 C 85,65 130,26 160,40"
              stroke="url(#waveGradCard2)"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <path
              d="M 68,80 C 104,60 142,18 160,54"
              stroke="url(#waveGradCard2)"
              strokeWidth="0.7"
              strokeOpacity="0.25"
            />
          </svg>
        </div>
      </div>

      {/* 3. Department Managers */}
      <div
        onClick={onFilterManagers}
        className={`relative overflow-hidden rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all flex items-center justify-between cursor-pointer select-none ${
          isManagersFilterActive
            ? "bg-gradient-to-br from-emerald-100/90 via-emerald-50 to-teal-100/80 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs"
            : "bg-gradient-to-br from-white via-white to-emerald-50/40 border-slate-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-xs"
        }`}
        title="Click to toggle department managers filter"
      >
        {/* Left: Icon & 3-line Text with Equal Spacing */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs">
            <i className="bi bi-person-badge-fill"></i>
          </div>

          <div className="flex flex-col justify-center min-w-0 py-0.5">
            {/* Line 1: Title */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-slate-500 uppercase tracking-wider leading-tight m-0 p-0 truncate">
              Dept Managers
            </p>
            {/* Line 2: Value + Badge */}
            <div className="flex items-center gap-1.5 my-0.5 leading-none">
              <span className="text-base sm:text-lg font-black text-slate-900 leading-none m-0 p-0">
                {totalManagers}
              </span>
              <span className="text-[9px] sm:text-[9.5px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 leading-none">
                Executive
              </span>
            </div>
            {/* Line 3: Subtitle */}
            <p className="text-[10px] sm:text-[10.5px] text-slate-400 font-medium leading-normal m-0 p-0 block truncate">
              Top chain of command
            </p>
          </div>
        </div>

        {/* Silky Wave Background Effect (Card 3 - Emerald/Teal) */}
        <div className="absolute right-0 bottom-0 w-32 sm:w-40 h-full pointer-events-none overflow-hidden rounded-br-xl z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 80"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="waveGradCard3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waveFillCard3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.01" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 10,80 C 60,74 110,38 160,18 L 160,80 Z"
              fill="url(#waveFillCard3)"
            />
            <path
              d="M 0,80 C 50,75 105,42 160,16"
              stroke="url(#waveGradCard3)"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <path
              d="M 22,80 C 68,70 118,34 160,28"
              stroke="url(#waveGradCard3)"
              strokeWidth="1.0"
              strokeOpacity="0.45"
            />
            <path
              d="M 44,80 C 85,65 130,26 160,40"
              stroke="url(#waveGradCard3)"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <path
              d="M 68,80 C 104,60 142,18 160,54"
              stroke="url(#waveGradCard3)"
              strokeWidth="0.7"
              strokeOpacity="0.25"
            />
          </svg>
        </div>
      </div>

      {/* 4. Unassigned / Orphaned Staff */}
      <div
        onClick={onFilterUnassigned}
        className={`relative overflow-hidden rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 border transition-all flex items-center justify-between cursor-pointer select-none ${
          isUnassignedFilterActive
            ? "bg-gradient-to-br from-amber-100/90 via-amber-50 to-orange-100/80 border-amber-400 ring-2 ring-amber-400/40 shadow-xs"
            : unassignedCount > 0
            ? "bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-amber-100/60 border-amber-300 hover:border-amber-400 shadow-2xs hover:shadow-xs"
            : "bg-gradient-to-br from-white via-white to-amber-50/35 border-slate-200/90 hover:border-amber-300 shadow-2xs hover:shadow-xs"
        }`}
        title={unassignedCount > 0 ? "Click to toggle unassigned staff filter" : "All staff assigned"}
      >
        {/* Left: Icon & 3-line Text with Equal Spacing */}
        <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 shadow-2xs border ${
              unassignedCount > 0
                ? "bg-amber-100/90 border-amber-300 text-amber-700"
                : "bg-amber-50 border-amber-200/70 text-amber-600"
            }`}
          >
            <i className="bi bi-person-plus-fill"></i>
          </div>

          <div className="flex flex-col justify-center min-w-0 py-0.5">
            {/* Line 1: Title */}
            <p className="text-[10px] sm:text-[10.5px] font-bold text-amber-800 uppercase tracking-wider leading-tight m-0 p-0 truncate flex items-center gap-1.5">
              <span>Orphaned Staff</span>
              {unassignedCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </p>
            {/* Line 2: Value + Badge */}
            <div className="flex items-center gap-1.5 my-0.5 leading-none">
              <span className={`text-base sm:text-lg font-black leading-none m-0 p-0 ${unassignedCount > 0 ? "text-amber-900" : "text-slate-900"}`}>
                {unassignedCount}
              </span>
              {unassignedCount > 0 ? (
                <span className="text-[9px] sm:text-[9.5px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 leading-none">
                  Action Needed
                </span>
              ) : (
                <span className="text-[9px] sm:text-[9.5px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none">
                  100% Assigned
                </span>
              )}
            </div>
            {/* Line 3: Subtitle */}
            <p className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium leading-normal m-0 p-0 block truncate">
              {unassignedCount > 0 ? "Staff missing supervisor" : "No orphaned staff"}
            </p>
          </div>
        </div>

        {/* Silky Wave Background Effect (Card 4 - Amber/Orange) */}
        <div className="absolute right-0 bottom-0 w-32 sm:w-40 h-full pointer-events-none overflow-hidden rounded-br-xl z-0">
          <svg
            className="w-full h-full"
            viewBox="0 0 160 80"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id="waveGradCard4" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#f97316" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="waveFillCard4" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.01" />
                <stop offset="60%" stopColor="#f97316" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d="M 10,80 C 60,74 110,38 160,18 L 160,80 Z"
              fill="url(#waveFillCard4)"
            />
            <path
              d="M 0,80 C 50,75 105,42 160,16"
              stroke="url(#waveGradCard4)"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            <path
              d="M 22,80 C 68,70 118,34 160,28"
              stroke="url(#waveGradCard4)"
              strokeWidth="1.0"
              strokeOpacity="0.45"
            />
            <path
              d="M 44,80 C 85,65 130,26 160,40"
              stroke="url(#waveGradCard4)"
              strokeWidth="0.8"
              strokeOpacity="0.35"
            />
            <path
              d="M 68,80 C 104,60 142,18 160,54"
              stroke="url(#waveGradCard4)"
              strokeWidth="0.7"
              strokeOpacity="0.25"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
