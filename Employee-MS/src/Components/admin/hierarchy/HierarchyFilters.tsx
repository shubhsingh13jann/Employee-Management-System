import React, { useEffect, useRef } from "react";

interface HierarchyFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (val: string) => void;
  departments: string[];
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  activeKpiFilter?: "mapped" | "leads" | "managers" | "orphaned" | null;
  unassignedCount: number;
  totalFiltered: number;
  totalCount: number;
  onResetFilters: () => void;
}

export const HierarchyFilters: React.FC<HierarchyFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
  statusFilter,
  onStatusFilterChange,
  activeKpiFilter,
  unassignedCount,
  totalFiltered,
  totalCount,
  onResetFilters,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedDepartment !== "all" ||
    statusFilter !== "all";

  // Color theme helper for department pills matching the target mockup
  const getDeptColor = (deptName: string, isSelected: boolean) => {
    const lower = deptName.toLowerCase();
    if (lower.includes("account") || lower.includes("finance")) {
      return {
        iconBg: isSelected ? "bg-white/20 text-white" : "bg-sky-50 text-sky-600 border border-sky-100",
        activeStyle: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20",
      };
    }
    if (lower.includes("engineer") || lower.includes("tech") || lower.includes("dev")) {
      return {
        iconBg: isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600 border border-emerald-100",
        activeStyle: "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20",
      };
    }
    if (lower.includes("human") || lower.includes("hr") || lower.includes("people")) {
      return {
        iconBg: isSelected ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600 border border-amber-100",
        activeStyle: "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20",
      };
    }
    if (lower.includes("market") || lower.includes("sales")) {
      return {
        iconBg: isSelected ? "bg-white/20 text-white" : "bg-pink-50 text-pink-600 border border-pink-100",
        activeStyle: "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20",
      };
    }
    return {
      iconBg: isSelected ? "bg-white/20 text-white" : "bg-purple-50 text-purple-600 border border-purple-100",
      activeStyle: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20",
    };
  };

  return (
    <div className="relative overflow-hidden bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 mb-3">
      {/* Silky Wave Background Ribbon Effects matching Image 2 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-2xl">
        <div className="absolute -bottom-8 -right-8 w-80 h-32 bg-gradient-to-tl from-indigo-200/30 via-purple-100/20 to-transparent blur-xl"></div>
        <div className="absolute -top-10 left-1/4 w-72 h-28 bg-gradient-to-b from-sky-200/25 via-indigo-100/15 to-transparent blur-xl"></div>
        <svg
          className="absolute right-0 bottom-0 w-80 h-full pointer-events-none opacity-40"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="filterWaveRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.0" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path
            d="M 50,100 C 150,40 280,20 400,60 L 400,100 Z"
            fill="url(#filterWaveRibbon)"
          />
          <path
            d="M 0,100 C 120,60 250,50 400,20"
            stroke="#818cf8"
            strokeWidth="1.2"
            strokeOpacity="0.3"
            fill="none"
          />
        </svg>
      </div>

      {/* Main Toolbar Row: Department Pills (Left), Status Pills (Center), Search Omnibox (Right) */}
      <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap xl:flex-nowrap">
        {/* Left: Department Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {/* "All Departments" Pill */}
          <button
            type="button"
            onClick={() => onDepartmentChange("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedDepartment === "all"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/30"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:border-slate-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                selectedDepartment === "all"
                  ? "bg-white/20 text-white"
                  : "bg-indigo-50 text-indigo-600 border border-indigo-100"
              }`}
            >
              <i className="bi bi-buildings"></i>
            </div>
            <span>All Departments</span>
          </button>

          {/* Individual Department Pills */}
          {departments.map((dept) => {
            const isSelected = selectedDepartment === dept;
            const theme = getDeptColor(dept, isSelected);

            return (
              <button
                key={dept}
                type="button"
                onClick={() => onDepartmentChange(dept)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? `${theme.activeStyle} ring-2 ring-indigo-400/30`
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${theme.iconBg}`}
                >
                  <i className="bi bi-buildings"></i>
                </div>
                <span>{dept}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Segmented Status Control */}
        <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-xs font-semibold shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onStatusFilterChange("assigned")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === "assigned"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Assigned
          </button>
          <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>
          <button
            type="button"
            onClick={() => onStatusFilterChange("unassigned")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "unassigned"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Orphaned</span>
            {unassignedCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                  statusFilter === "unassigned"
                    ? "bg-white text-indigo-700"
                    : "bg-amber-500 text-white"
                }`}
              >
                {unassignedCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Search Omnibox */}
        <div className="relative flex-1 min-w-[260px] sm:min-w-[300px] max-w-md ml-auto">
          <div className="relative flex items-center h-10 rounded-xl bg-white border border-indigo-200/90 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 shadow-sm transition-all px-3">
            <i className="bi bi-search text-indigo-500 text-sm mr-2.5 shrink-0"></i>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by employee, team lead, or manager name/email..."
              className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent outline-none font-medium"
            />
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer w-4 h-4 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                  title="Clear search"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
              <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 select-none">
                /
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Counter Bar matching Image 2 */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 mt-2.5 pt-1.5 font-medium">
        <div className="flex items-center gap-2">
          <span>
            {activeKpiFilter === "leads" ? (
              <>
                Showing <strong className="text-purple-600 font-bold">{totalFiltered}</strong> active team lead squads
              </>
            ) : activeKpiFilter === "managers" ? (
              <>
                Showing <strong className="text-emerald-600 font-bold">{totalFiltered}</strong> department management divisions
              </>
            ) : activeKpiFilter === "orphaned" ? (
              <>
                Showing <strong className="text-amber-600 font-bold">{totalFiltered}</strong> orphaned staff needing assignment
              </>
            ) : activeKpiFilter === "mapped" ? (
              <>
                Showing <strong className="text-indigo-600 font-bold">{totalFiltered}</strong> mapped employee relationships
              </>
            ) : (
              <>
                Showing <strong className="text-indigo-600 font-bold">{totalFiltered}</strong> of{" "}
                <strong className="text-indigo-600 font-bold">{totalCount}</strong> mappings
              </>
            )}
          </span>
          {(hasActiveFilters || activeKpiFilter) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="ml-2 text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <i className="bi bi-x-circle text-[10px]"></i>
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
