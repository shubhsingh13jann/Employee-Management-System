import React, { useEffect, useRef } from "react";

interface DepartmentOption {
  id: number | string;
  name: string;
}

interface SupervisorOption {
  id: number | string;
  name: string;
}

interface AdminProjectsFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (deptId: string) => void;
  departments: DepartmentOption[];
  selectedSupervisor: string;
  onSupervisorChange: (supId: string) => void;
  supervisors: SupervisorOption[];
  selectedPriority: string;
  onPriorityChange: (pri: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalFiltered: number;
  totalCount: number;
  onResetFilters: () => void;
}

export const AdminProjectsFilters: React.FC<AdminProjectsFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  departments,
  selectedSupervisor,
  onSupervisorChange,
  supervisors,
  selectedPriority,
  onPriorityChange,
  statusFilter,
  onStatusFilterChange,
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

  const isFiltered =
    searchTerm.trim() !== "" ||
    selectedDepartment !== "all" ||
    selectedSupervisor !== "all" ||
    selectedPriority !== "all" ||
    statusFilter !== "all";

  const statusOptions = [
    { key: "all", label: "All Statuses" },
    { key: "active", label: "Active" },
    { key: "planning", label: "Planning" },
    { key: "on_hold", label: "On Hold" },
    { key: "completed", label: "Completed" },
    { key: "critical", label: "Overdue / At Risk" },
  ];

  return (
    <div className="relative overflow-hidden bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 mb-3">
      {/* Silky Wave Background Ribbon Effects matching Hierarchy reference */}
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
            <linearGradient id="projFilterWaveRibbon" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.0" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path
            d="M 50,100 C 150,40 280,20 400,60 L 400,100 Z"
            fill="url(#projFilterWaveRibbon)"
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

      {/* Main Toolbar Grid: Omnibox Search and Filter Dropdowns */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-2.5 mb-3">
        {/* Omnibox Search Bar */}
        <div className="md:col-span-5 relative">
          <div className="relative flex items-center h-10 rounded-xl bg-white border border-indigo-200/90 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 shadow-sm transition-all px-3">
            <i className="bi bi-search text-indigo-500 text-sm mr-2.5 shrink-0"></i>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search projects, supervisors, departments..."
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

        {/* Department Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium text-slate-700 cursor-pointer transition-all outline-none"
          >
            <option value="all">🏢 All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lead Supervisor Filter */}
        <div className="md:col-span-2">
          <select
            value={selectedSupervisor}
            onChange={(e) => onSupervisorChange(e.target.value)}
            className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium text-slate-700 cursor-pointer transition-all outline-none"
          >
            <option value="all">👷 Lead Supervisors</option>
            {supervisors.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="md:col-span-2">
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs font-medium text-slate-700 cursor-pointer transition-all outline-none"
          >
            <option value="all">⚡ All Priorities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Bottom Row: Status Filter Pills and Results Counter */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-slate-100">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {statusOptions.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onStatusFilterChange(opt.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === opt.key
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25 ring-2 ring-indigo-400/30"
                  : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results Counter & Reset Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-indigo-600 font-bold">{totalFiltered}</strong> of{" "}
            <strong className="text-indigo-600 font-bold">{totalCount}</strong> initiatives
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="ml-1 text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <i className="bi bi-x-circle-fill text-[11px]"></i>
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
