import React, { useState, useMemo } from "react";

export interface HierarchyMappingItem {
  id: number | string;
  assigned_at: string;
  employee_id: number | string;
  employee_name: string;
  employee_email: string;
  supervisor_id: number | string;
  supervisor_name: string;
  manager_id: number | string;
  manager_name: string;
  department_name?: string;
}

export interface UnassignedEmployee {
  id: number | string;
  name: string;
  email: string;
  department_name?: string;
  role?: string;
}

export interface TeamLeadGroup {
  supervisorId: string | number;
  supervisorName: string;
  supervisorEmail?: string;
  managerId?: string | number;
  managerName?: string;
  departmentName?: string;
  members: HierarchyMappingItem[];
}

export interface ManagerGroup {
  managerId: string | number;
  managerName: string;
  managerEmail?: string;
  departmentName?: string;
  supervisors: {
    id: string | number;
    name: string;
    membersCount: number;
  }[];
  totalMembersCount: number;
}

interface HierarchyTableViewProps {
  loading: boolean;
  mappings: HierarchyMappingItem[];
  unassignedStaff: UnassignedEmployee[];
  showUnassignedOnly: boolean;
  statusFilter?: string;
  activeKpiFilter?: "mapped" | "leads" | "managers" | "orphaned" | null;
  onOpenAssignModal: (preselectedEmployeeId?: string | number) => void;
  onResetFilters: () => void;
  onInitiateReassign?: (employee: HierarchyMappingItem) => void;
  onInitiateUnlink?: (employee: HierarchyMappingItem) => void;
}

export const HierarchyTableView: React.FC<HierarchyTableViewProps> = ({
  loading,
  mappings,
  unassignedStaff,
  showUnassignedOnly,
  statusFilter = "all",
  activeKpiFilter = null,
  onOpenAssignModal,
  onResetFilters,
  onInitiateReassign,
  onInitiateUnlink,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Group mappings by Team Lead (Supervisor)
  const leadGroups = useMemo<TeamLeadGroup[]>(() => {
    const map = new Map<string, TeamLeadGroup>();
    mappings.forEach((item) => {
      const key = String(item.supervisor_id);
      if (!map.has(key)) {
        map.set(key, {
          supervisorId: item.supervisor_id,
          supervisorName: item.supervisor_name,
          managerId: item.manager_id,
          managerName: item.manager_name,
          departmentName: item.department_name,
          members: [],
        });
      }
      map.get(key)!.members.push(item);
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        b.members.length - a.members.length ||
        a.supervisorName.localeCompare(b.supervisorName)
    );
  }, [mappings]);

  // Group mappings by Department Manager
  const managerGroups = useMemo<ManagerGroup[]>(() => {
    const map = new Map<string, ManagerGroup>();
    mappings.forEach((item) => {
      const key = String(item.manager_id);
      if (!map.has(key)) {
        map.set(key, {
          managerId: item.manager_id,
          managerName: item.manager_name,
          departmentName: item.department_name,
          supervisors: [],
          totalMembersCount: 0,
        });
      }
      const grp = map.get(key)!;
      grp.totalMembersCount += 1;
      const supKey = String(item.supervisor_id);
      const existingSup = grp.supervisors.find((s) => String(s.id) === supKey);
      if (existingSup) {
        existingSup.membersCount += 1;
      } else {
        grp.supervisors.push({
          id: item.supervisor_id,
          name: item.supervisor_name,
          membersCount: 1,
        });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) =>
        b.totalMembersCount - a.totalMembersCount ||
        a.managerName.localeCompare(b.managerName)
    );
  }, [mappings]);

  const handleCopyDetails = (item: HierarchyMappingItem) => {
    const text = `Employee: ${item.employee_name} (${item.employee_email}) -> Supervisor: ${item.supervisor_name} -> Manager: ${item.manager_name} [Dept: ${item.department_name || "General"}]`;
    navigator.clipboard.writeText(text);
    setCopyFeedback(String(item.id));
    setTimeout(() => setCopyFeedback(null), 2000);
    setActiveMenuId(null);
  };

  // Determine what records to render in default employee mode
  const isOnlyUnassigned = showUnassignedOnly || statusFilter === "unassigned";
  const isOnlyAssigned = statusFilter === "assigned";
  const shouldRenderAssigned = !isOnlyUnassigned;
  const shouldRenderUnassigned = !isOnlyAssigned;

  const totalVisibleCount =
    (shouldRenderAssigned ? mappings.length : 0) +
    (shouldRenderUnassigned ? unassignedStaff.length : 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden mb-3">
      {/* 1. Contextual Header Banner based on Active KPI Mode */}
      {activeKpiFilter === "leads" && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50/40 to-purple-50/20 border-b border-purple-100 px-4 py-2.5 flex items-center justify-between text-xs text-purple-950">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
            <span className="font-bold text-slate-800">
              Active Team Leads Roster
            </span>
            <span className="text-slate-500 font-medium">
              • Showing {leadGroups.length} supervisor squads managing{" "}
              {mappings.length} personnel
            </span>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer flex items-center gap-1"
          >
            <i className="bi bi-x-circle"></i>
            <span>Reset to All Staff</span>
          </button>
        </div>
      )}

      {activeKpiFilter === "managers" && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-emerald-50/20 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="font-bold text-slate-800">
              Department Managers Roster
            </span>
            <span className="text-slate-500 font-medium">
              • Showing {managerGroups.length} executive leaders overseeing{" "}
              {mappings.length} personnel
            </span>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
          >
            <i className="bi bi-x-circle"></i>
            <span>Reset to All Staff</span>
          </button>
        </div>
      )}

      {activeKpiFilter === "mapped" && (
        <div className="bg-gradient-to-r from-blue-50 via-sky-50/40 to-blue-50/20 border-b border-blue-100 px-4 py-2 flex items-center justify-between text-xs text-blue-950">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="font-bold text-slate-800">
              Mapped Staff Roster
            </span>
            <span className="text-slate-500 font-medium">
              • Showing {mappings.length} active reporting relationships
            </span>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-1"
          >
            <i className="bi bi-x-circle"></i>
            <span>Reset to All Staff</span>
          </button>
        </div>
      )}

      {activeKpiFilter === "orphaned" && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-50/20 border-b border-amber-100 px-4 py-2 flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span className="font-bold text-amber-900">
              Orphaned Staff Roster
            </span>
            <span className="text-amber-700 font-medium">
              • Showing {unassignedStaff.length} personnel requiring reporting
              line assignment
            </span>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 hover:underline cursor-pointer flex items-center gap-1"
          >
            <i className="bi bi-x-circle"></i>
            <span>Reset to All Staff</span>
          </button>
        </div>
      )}

      {/* 2. Table Area */}
      <div className="overflow-x-auto min-h-[220px]">
        {/* VIEW A: Team Leads Roster */}
        {activeKpiFilter === "leads" ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 text-left min-w-[200px]">
                  👷 Team Lead (Supervisor)
                </th>
                <th className="py-2.5 px-3 text-left min-w-[160px]">
                  👔 Reporting Manager
                </th>
                <th className="py-2.5 px-3 text-center min-w-[120px]">
                  Department
                </th>
                <th className="py-2.5 px-4 text-left min-w-[260px]">
                  👥 Supervised Squad Members
                </th>
                <th className="py-2.5 px-3 text-center min-w-[130px]">
                  Squad Capacity
                </th>
                <th className="py-2.5 px-3 text-center w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading team leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leadGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No active team leads found in current filter.
                  </td>
                </tr>
              ) : (
                leadGroups.map((lead) => (
                  <tr
                    key={`lead-${lead.supervisorId}`}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    {/* Team Lead Info */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {lead.supervisorName ? lead.supervisorName.charAt(0) : "S"}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate text-xs sm:text-[13px]">
                            {lead.supervisorName}
                          </span>
                          <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                            LEAD #{lead.supervisorId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Manager */}
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                        <i className="bi bi-person-gear text-indigo-600 text-[10px]"></i>
                        <span className="truncate max-w-[130px]">{lead.managerName}</span>
                      </span>
                    </td>

                    {/* Department */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {lead.departmentName || "General"}
                      </span>
                    </td>

                    {/* Supervised Squad Member Chips */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap items-center gap-1 max-w-sm">
                        {lead.members.slice(0, 4).map((m) => (
                          <span
                            key={m.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-medium border border-slate-200 transition-colors"
                            title={m.employee_email}
                          >
                            <i className="bi bi-person-fill text-slate-400 text-[9px]"></i>
                            <span>{m.employee_name}</span>
                          </span>
                        ))}
                        {lead.members.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                            +{lead.members.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Squad Capacity Indicator */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-purple-100/80 text-purple-800 border border-purple-200">
                          {lead.members.length} {lead.members.length === 1 ? "staff" : "squad members"}
                        </span>
                        <span className="text-[9.5px] text-slate-400 mt-0.5">
                          {lead.members.length <= 3
                            ? "Light Load"
                            : lead.members.length <= 7
                            ? "Optimal Span"
                            : "Heavy Squad"}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal()}
                        className="px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs border border-purple-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Add or manage squad members"
                      >
                        <i className="bi bi-person-plus text-[10px]"></i>
                        <span>Add</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : activeKpiFilter === "managers" ? (
          /* VIEW B: Department Managers Roster */
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 text-left min-w-[200px]">
                  👔 Department Manager
                </th>
                <th className="py-2.5 px-3 text-center min-w-[120px]">
                  Department
                </th>
                <th className="py-2.5 px-4 text-left min-w-[240px]">
                  👷 Reporting Team Leads
                </th>
                <th className="py-2.5 px-3 text-center min-w-[140px]">
                  Total Headcount
                </th>
                <th className="py-2.5 px-3 text-center min-w-[120px]">
                  Authority Tier
                </th>
                <th className="py-2.5 px-3 text-center w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading department managers...</span>
                    </div>
                  </td>
                </tr>
              ) : managerGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No department managers found in current filter.
                  </td>
                </tr>
              ) : (
                managerGroups.map((mgr) => (
                  <tr
                    key={`mgr-${mgr.managerId}`}
                    className="hover:bg-emerald-50/30 transition-colors"
                  >
                    {/* Department Manager Info */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {mgr.managerName ? mgr.managerName.charAt(0) : "M"}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate text-xs sm:text-[13px]">
                            {mgr.managerName}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            MGR #{mgr.managerId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {mgr.departmentName || "General"}
                      </span>
                    </td>

                    {/* Reporting Team Leads */}
                    <td className="py-2.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                        {mgr.supervisors.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10.5px] font-medium border border-purple-200"
                          >
                            <i className="bi bi-people-fill text-purple-500 text-[9px]"></i>
                            <span>{s.name}</span>
                            <span className="text-[9px] bg-purple-200 text-purple-900 px-1 rounded-full font-bold">
                              {s.membersCount}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total Headcount */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-300 shadow-2xs">
                        <i className="bi bi-building-check text-emerald-600 text-xs"></i>
                        <span>{mgr.totalMembersCount} Total Staff</span>
                      </span>
                    </td>

                    {/* Authority Tier */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Executive Level
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal()}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Assign team lead or staff"
                      >
                        <i className="bi bi-diagram-3 text-[10px]"></i>
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          /* VIEW C: Standard Employee Reporting Line Table */
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4 text-left min-w-[220px]">
                  💼 Employee (Subordinate)
                </th>
                <th className="py-2.5 px-3 text-left min-w-[170px]">
                  👷 Direct Supervisor
                </th>
                <th className="py-2.5 px-3 text-left min-w-[170px]">
                  👔 Department Manager
                </th>
                <th className="py-2.5 px-3 text-center min-w-[120px]">
                  Department
                </th>
                <th className="py-2.5 px-4 text-left min-w-[120px]">
                  Assigned On
                </th>
                <th className="py-2.5 px-3 text-center w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading hierarchy mappings...</span>
                    </div>
                  </td>
                </tr>
              ) : totalVisibleCount === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg mx-auto mb-2">
                        <i className="bi bi-diagram-3"></i>
                      </div>
                      <p className="font-bold text-slate-800 text-xs sm:text-sm mb-0.5">
                        {isOnlyUnassigned
                          ? "All Staff Are Mapped"
                          : "No Hierarchy Records Found"}
                      </p>
                      <p className="text-[11px] text-slate-500 mb-2.5">
                        {isOnlyUnassigned
                          ? "Every active staff member has an assigned team lead and manager."
                          : "No employees match your current filter or department criteria."}
                      </p>
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <i className="bi bi-arrow-counterclockwise"></i>
                        <span>Reset Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {/* 1. Mapped Employees */}
                  {shouldRenderAssigned &&
                    mappings.map((item, idx, arr) => {
                      const isMenuOpen = activeMenuId === item.id;

                      return (
                        <tr
                          key={`mapped-${item.id}`}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Employee Cell */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {item.employee_name ? item.employee_name.charAt(0) : "E"}
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 truncate text-xs sm:text-[13px]">
                                    {item.employee_name}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                                    EMP-{String(item.employee_id).padStart(4, "0")}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {item.employee_email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Supervisor Cell */}
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                              <i className="bi bi-person-badge-fill text-emerald-600 text-[10px]"></i>
                              <span className="truncate max-w-[130px]">{item.supervisor_name}</span>
                            </span>
                          </td>

                          {/* Manager Cell */}
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                              <i className="bi bi-person-gear text-indigo-600 text-[10px]"></i>
                              <span className="truncate max-w-[130px]">{item.manager_name}</span>
                            </span>
                          </td>

                          {/* Department Cell */}
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {item.department_name || "General"}
                            </span>
                          </td>

                          {/* Assigned Date */}
                          <td className="py-2.5 px-4 text-left text-[11px] text-slate-600 font-medium whitespace-nowrap">
                            {item.assigned_at
                              ? new Date(item.assigned_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Active"}
                          </td>

                          {/* Actions (Triple-Dot Menu) */}
                          <td className={`py-2.5 px-3 text-center whitespace-nowrap ${isMenuOpen ? "relative z-30" : ""}`}>
                            <div className="relative inline-flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId((prev) => (prev === item.id ? null : item.id));
                                }}
                                className={`w-6 h-6 rounded-md border transition-all inline-flex items-center justify-center cursor-pointer ${
                                  isMenuOpen
                                    ? "bg-slate-100 text-slate-900 border-slate-300 shadow-2xs"
                                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-2xs"
                                }`}
                                title="Actions"
                              >
                                <i className="bi bi-three-dots text-[10px]"></i>
                              </button>

                              {isMenuOpen && (
                                <div
                                  className={`absolute right-0 ${
                                    idx >= arr.length - 2 && arr.length > 2
                                      ? "bottom-full mb-1"
                                      : "top-full mt-1"
                                  } w-40 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onOpenAssignModal(item.employee_id);
                                    }}
                                    className="w-full px-2 py-1 text-[11px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                  >
                                    <i className="bi bi-pencil-square text-indigo-500 text-[10px]"></i>
                                    <span>Reassign Team</span>
                                  </button>

                                  {onInitiateReassign && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onInitiateReassign(item);
                                      }}
                                      className="w-full px-2 py-1 text-[11px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                    >
                                      <i className="bi bi-arrow-left-right text-indigo-500 text-[10px]"></i>
                                      <span>Quick Reallocate</span>
                                    </button>
                                  )}

                                  {onInitiateUnlink && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onInitiateUnlink(item);
                                      }}
                                      className="w-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                    >
                                      <i className="bi bi-link-45deg text-rose-500 text-[10px]"></i>
                                      <span>Unlink Hierarchy</span>
                                    </button>
                                  )}

                                  <div className="my-1 border-t border-slate-100"></div>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyDetails(item)}
                                    className="w-full px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                  >
                                    <i className="bi bi-clipboard text-slate-400 text-[10px]"></i>
                                    <span>
                                      {copyFeedback === String(item.id)
                                        ? "Copied!"
                                        : "Copy Details"}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {/* 2. Unassigned Employees */}
                  {shouldRenderUnassigned &&
                    unassignedStaff.map((staff) => (
                      <tr
                        key={`unassigned-${staff.id}`}
                        className="hover:bg-amber-50/40 bg-amber-50/15 transition-colors"
                      >
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {staff.name ? staff.name.charAt(0) : "U"}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900 truncate text-xs sm:text-[13px]">
                                  {staff.name}
                                </span>
                                <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1 py-0.2 rounded border border-amber-200">
                                  Unassigned
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {staff.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Supervisor Column for Unassigned */}
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                            <span>Unassigned Lead</span>
                          </span>
                        </td>

                        {/* Manager Column for Unassigned */}
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                            <span>Unassigned Manager</span>
                          </span>
                        </td>

                        {/* Department */}
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {staff.department_name || "General"}
                          </span>
                        </td>

                        {/* Status / Pending */}
                        <td className="py-2.5 px-4 text-left text-[11px] font-medium text-amber-600 whitespace-nowrap">
                          Pending Setup
                        </td>

                        {/* Quick Assign Action */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenAssignModal(staff.id)}
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                          >
                            <i className="bi bi-person-plus text-[10px]"></i>
                            <span>Assign</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
