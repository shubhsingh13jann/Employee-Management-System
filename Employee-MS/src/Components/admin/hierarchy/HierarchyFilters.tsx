import React, { useEffect, useRef } from "react";

interface HierarchyFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (val: string) => void;
  departments: string[];
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
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

  return (
    <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/90 shadow-2xs mb-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <i className="bi bi-search text-xs"></i>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by employee, team lead, or manager name/email..."
            className="w-full pl-8 pr-16 py-1.5 sm:py-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-[9px] cursor-pointer"
                title="Clear search"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1 py-0.2 text-[9px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
              /
            </kbd>
          </div>
        </div>

        {/* Right: Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="w-full pl-2.5 pr-7 py-1.5 sm:py-2 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-2xs appearance-none"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="bi bi-chevron-down"></i>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("assigned")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                statusFilter === "assigned"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Assigned
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("unassigned")}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "unassigned"
                  ? "bg-white text-amber-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Orphaned</span>
              {unassignedCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                  {unassignedCount}
                </span>
              )}
            </button>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Reset all filters"
            >
              <i className="bi bi-x-circle text-xs"></i>
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-800 font-bold">{totalFiltered}</strong> of{" "}
            <strong className="text-slate-800 font-bold">{totalCount}</strong> mappings
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Filtered
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
