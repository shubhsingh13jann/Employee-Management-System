import React, { useEffect, useRef, useState } from "react";

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
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

  // Close department dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        deptDropdownRef.current &&
        !deptDropdownRef.current.contains(e.target as Node)
      ) {
        setIsDeptDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 mb-3 relative">
      {/* Top Row: Search Omnibox, Department Dropdown, Status Pills & Reset */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Prominent Search Omnibox */}
        <div className="relative flex-1 min-w-[260px] max-w-xl">
          <div className="relative flex items-center h-9.5 rounded-xl bg-slate-50/60 border border-slate-200/90 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-3 shadow-2xs">
            <i className="bi bi-search text-slate-400 text-xs mr-2.5 shrink-0"></i>
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
                  className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer w-4 h-4 rounded-full hover:bg-slate-200/70 flex items-center justify-center transition-colors"
                  title="Clear search"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-400 bg-white border border-slate-200 rounded select-none shadow-2xs">
                /
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Controls: Department Custom Dropdown, Status Pills & Reset */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Field: Department (Modern Custom Dropdown matching User Directory) */}
          <div className="relative min-w-[170px]" ref={deptDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
              className={`w-full relative flex items-center justify-between h-9.5 rounded-xl border transition-all px-3 shadow-2xs text-left cursor-pointer outline-none ${
                isDeptDropdownOpen
                  ? "border-indigo-500 bg-white ring-2 ring-indigo-100"
                  : selectedDepartment !== "all"
                  ? "border-indigo-300 bg-indigo-50/50 text-indigo-900"
                  : "border-slate-200/90 hover:border-slate-300 bg-slate-50/60 hover:bg-white text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <i
                  className={`bi bi-building text-xs shrink-0 ${
                    selectedDepartment !== "all" ? "text-indigo-600" : "text-slate-400"
                  }`}
                ></i>
                <span className="text-xs font-semibold truncate">
                  {selectedDepartment === "all" ? "All Departments" : selectedDepartment}
                </span>
              </div>
              <i
                className={`bi bi-chevron-down text-slate-400 text-[10px] font-bold shrink-0 transition-transform duration-200 ${
                  isDeptDropdownOpen ? "rotate-180 text-indigo-600" : ""
                }`}
              ></i>
            </button>

            {/* Floating Menu Popover */}
            {isDeptDropdownOpen && (
              <div className="absolute top-full right-0 sm:left-0 mt-1.5 w-56 bg-white rounded-xl border border-slate-200/90 shadow-2xl z-50 py-1.5 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Filter by Department
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDepartmentChange("all");
                      setIsDeptDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-left cursor-pointer transition-colors ${
                      selectedDepartment === "all"
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <i className="bi bi-buildings text-indigo-500 text-xs shrink-0"></i>
                      <span>All Departments</span>
                    </div>
                    {selectedDepartment === "all" && (
                      <i className="bi bi-check2 text-indigo-600 font-bold text-sm"></i>
                    )}
                  </button>

                  <div className="h-px bg-slate-100 my-1"></div>

                  {departments.map((dept) => {
                    const isSelected = selectedDepartment === dept;
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          onDepartmentChange(dept);
                          setIsDeptDropdownOpen(false);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-left cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-50 text-indigo-700 font-bold"
                            : "text-slate-700 hover:bg-slate-50 font-medium"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                          <span className="truncate">{dept}</span>
                        </div>
                        {isSelected && (
                          <i className="bi bi-check2 text-indigo-600 font-bold text-sm"></i>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Status Filter Segmented Control */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs font-semibold shrink-0 h-9.5 items-center">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={`h-7 px-2.5 rounded-lg transition-all cursor-pointer ${
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
              className={`h-7 px-2.5 rounded-lg transition-all cursor-pointer ${
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
              className={`h-7 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "unassigned"
                  ? "bg-white text-amber-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Orphaned</span>
              {unassignedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[9.5px] font-bold">
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
              className="h-9.5 px-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/80 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Reset all filters"
            >
              <i className="bi bi-arrow-counterclockwise text-xs"></i>
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Counter & Active Filter Pills Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span>
            Showing <strong className="text-slate-800 font-bold">{totalFiltered}</strong> of{" "}
            <strong className="text-slate-800 font-bold">{totalCount}</strong> mappings
          </span>
          {hasActiveFilters && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <i className="bi bi-funnel-fill text-[9px]"></i>
              <span>Filtered View</span>
            </span>
          )}
          {selectedDepartment !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>Dept: {selectedDepartment}</span>
              <button
                type="button"
                onClick={() => onDepartmentChange("all")}
                className="hover:text-rose-600 cursor-pointer ml-0.5 text-xs font-bold leading-none"
                title="Remove department filter"
              >
                ×
              </button>
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 capitalize">
              <span>Status: {statusFilter}</span>
              <button
                type="button"
                onClick={() => onStatusFilterChange("all")}
                className="hover:text-rose-600 cursor-pointer ml-0.5 text-xs font-bold leading-none"
                title="Remove status filter"
              >
                ×
              </button>
            </span>
          )}
          {searchTerm.trim() !== "" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>Search: &ldquo;{searchTerm}&rdquo;</span>
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="hover:text-rose-600 cursor-pointer ml-0.5 text-xs font-bold leading-none"
                title="Clear search keyword"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer ml-auto transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
};
