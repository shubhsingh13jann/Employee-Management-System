import React from "react";

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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 sm:p-3 mb-3">
      {/* Top Row: Search Omnibox and Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-2.5">
        {/* Omnibox Search Bar */}
        <div className="md:col-span-4 relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
            <i className="bi bi-search"></i>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects, supervisors, departments..."
            className="w-full pl-8 pr-7 py-1.5 sm:py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              <i className="bi bi-x-circle-fill"></i>
            </button>
          )}
        </div>

        {/* Department Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full py-1.5 sm:py-2 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all font-medium text-slate-700 cursor-pointer"
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
        <div className="md:col-span-3">
          <select
            value={selectedSupervisor}
            onChange={(e) => onSupervisorChange(e.target.value)}
            className="w-full py-1.5 sm:py-2 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">👷 All Lead Supervisors</option>
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
            className="w-full py-1.5 sm:py-2 px-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all font-medium text-slate-700 cursor-pointer"
          >
            <option value="all">⚡ All Priorities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Bottom Row: Status Filter Pills and Result Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                statusFilter === opt.key
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100/80 hover:bg-slate-200/80 text-slate-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results Counter & Reset Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800 font-bold">{totalFiltered}</strong> of {totalCount} initiatives
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              <i className="bi bi-x-lg text-[10px]"></i>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
