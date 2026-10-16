import React, { useState, useMemo } from "react";
import { HierarchyEmptyStateOnboarding } from "./HierarchyEmptyStateOnboarding";

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
  onOpenAssignModal: (
    preselectedEmployeeId?: string | number,
    preselectedSupervisorId?: string | number,
    preselectedManagerId?: string | number
  ) => void;
  onResetFilters: () => void;
  onInitiateReassign?: (employee: HierarchyMappingItem) => void;
  onInitiateUnlink?: (employee: HierarchyMappingItem) => void;
  onViewDossier?: (employee: HierarchyMappingItem | UnassignedEmployee) => void;
  onOpenBatchModal?: (candidates: any[], targetSquad?: any) => void;
  onBatchUnlink?: (employeeIds: (string | number)[]) => void;
  isPreviewEmptyState?: boolean;
  onExitSimulation?: () => void;
  isSelectMode?: boolean;
  onToggleSelectMode?: () => void;
  selectedStaffIds?: (string | number)[];
  onToggleSelectStaff?: (id: string | number) => void;
  onClearSelection?: () => void;
  onSelectAllStaff?: (ids: (string | number)[]) => void;
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
  onViewDossier,
  onOpenBatchModal,
  onBatchUnlink,
  isPreviewEmptyState = false,
  onExitSimulation,
  isSelectMode,
  onToggleSelectMode,
  selectedStaffIds,
  onToggleSelectStaff,
  onClearSelection,
  onSelectAllStaff,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [selectedSquadLead, setSelectedSquadLead] = useState<TeamLeadGroup | null>(null);
  const [selectedManagerGroup, setSelectedManagerGroup] = useState<ManagerGroup | null>(null);
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string | number>>(new Set());
  const [internalSelectMode, setInternalSelectMode] = useState(false);

  const isControlled = selectedStaffIds !== undefined;
  const currentSelectedSet = useMemo(() => {
    return isControlled ? new Set(selectedStaffIds) : internalSelectedIds;
  }, [isControlled, selectedStaffIds, internalSelectedIds]);

  const isSelectModeActive = isSelectMode !== undefined ? isSelectMode : internalSelectMode;
  const showCheckboxes = isSelectModeActive || currentSelectedSet.size > 0;

  const toggleSelectModeLocal = () => {
    if (onToggleSelectMode) {
      onToggleSelectMode();
    } else {
      if (showCheckboxes) {
        setInternalSelectMode(false);
        setInternalSelectedIds(new Set());
      } else {
        setInternalSelectMode(true);
      }
    }
  };

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

  const visibleStaffIds = useMemo(() => {
    const ids: (string | number)[] = [];
    if (shouldRenderAssigned) {
      mappings.forEach((m) => ids.push(m.employee_id));
    }
    if (shouldRenderUnassigned) {
      unassignedStaff.forEach((u) => ids.push(u.id));
    }
    return ids;
  }, [shouldRenderAssigned, shouldRenderUnassigned, mappings, unassignedStaff]);

  const isAllSelected = visibleStaffIds.length > 0 && visibleStaffIds.every((id) => currentSelectedSet.has(id));
  const isPartiallySelected = visibleStaffIds.some((id) => currentSelectedSet.has(id)) && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      if (onClearSelection) {
        onClearSelection();
      }
      if (!isControlled) {
        setInternalSelectedIds(new Set());
      }
    } else {
      if (onSelectAllStaff) {
        onSelectAllStaff(visibleStaffIds);
      }
      if (!isControlled) {
        setInternalSelectedIds(new Set(visibleStaffIds));
      }
    }
  };

  const toggleSelect = (id: string | number) => {
    if (onToggleSelectStaff) {
      onToggleSelectStaff(id);
    }
    if (!isControlled) {
      setInternalSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const selectedMappedIds = useMemo(() => {
    return Array.from(currentSelectedSet).filter((id) =>
      mappings.some((m) => String(m.employee_id) === String(id))
    );
  }, [currentSelectedSet, mappings]);

  const handleBulkBatchAssign = () => {
    const candidates: any[] = [];
    currentSelectedSet.forEach((id) => {
      const mapped = mappings.find((m) => String(m.employee_id) === String(id));
      if (mapped) {
        candidates.push({
          id: mapped.employee_id,
          name: mapped.employee_name,
          email: mapped.employee_email,
          department_name: mapped.department_name,
          current_supervisor_id: mapped.supervisor_id,
          current_supervisor_name: mapped.supervisor_name,
        });
      } else {
        const unassigned = unassignedStaff.find((u) => String(u.id) === String(id));
        if (unassigned) {
          candidates.push(unassigned);
        }
      }
    });

    if (onOpenBatchModal) {
      onOpenBatchModal(candidates);
    }
  };

  const handleExportSelectedCSV = () => {
    if (currentSelectedSet.size === 0) return;
    const selectedList: any[] = [];
    currentSelectedSet.forEach((id) => {
      const mapped = mappings.find((m) => String(m.employee_id) === String(id));
      if (mapped) {
        selectedList.push({
          id: mapped.employee_id,
          name: mapped.employee_name,
          email: mapped.employee_email,
          role: "employee",
          department: mapped.department_name || "General",
          supervisor: mapped.supervisor_name,
          manager: mapped.manager_name,
          status: "Assigned",
        });
      } else {
        const unassigned = unassignedStaff.find((u) => String(u.id) === String(id));
        if (unassigned) {
          selectedList.push({
            id: unassigned.id,
            name: unassigned.name,
            email: unassigned.email,
            role: unassigned.role || "employee",
            department: unassigned.department_name || "General",
            supervisor: "Unassigned",
            manager: "Unassigned",
            status: "Orphaned",
          });
        }
      }
    });

    const headers = ["ID", "Name", "Email", "Role", "Department", "Supervisor", "Manager", "Status"];
    const rows = selectedList.map((u) => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      u.role,
      `"${u.department.replace(/"/g, '""')}"`,
      `"${u.supervisor.replace(/"/g, '""')}"`,
      `"${u.manager.replace(/"/g, '""')}"`,
      u.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hierarchy_selected_${selectedList.length}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectModeLocal}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
                showCheckboxes
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-400/40"
                  : "bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-600 border-slate-200/90 hover:border-indigo-300"
              }`}
              title={showCheckboxes ? "Exit Multi-Select Mode" : "Enable Multi-Select Mode"}
            >
              <i className={`bi ${showCheckboxes ? "bi-check2-all text-white font-bold" : "bi-check2-square text-indigo-500"} text-xs`}></i>
              <span>{showCheckboxes ? `Done (${currentSelectedSet.size})` : "Select"}</span>
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <i className="bi bi-x-circle"></i>
              <span>Reset to All Staff</span>
            </button>
          </div>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectModeLocal}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
                showCheckboxes
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-400/40"
                  : "bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-600 border-slate-200/90 hover:border-indigo-300"
              }`}
              title={showCheckboxes ? "Exit Multi-Select Mode" : "Enable Multi-Select Mode"}
            >
              <i className={`bi ${showCheckboxes ? "bi-check2-all text-white font-bold" : "bi-check2-square text-indigo-500"} text-xs`}></i>
              <span>{showCheckboxes ? `Done (${currentSelectedSet.size})` : "Select"}</span>
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <i className="bi bi-x-circle"></i>
              <span>Reset to All Staff</span>
            </button>
          </div>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectModeLocal}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
                showCheckboxes
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-400/40"
                  : "bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-600 border-slate-200/90 hover:border-indigo-300"
              }`}
              title={showCheckboxes ? "Exit Multi-Select Mode" : "Enable Multi-Select Mode"}
            >
              <i className={`bi ${showCheckboxes ? "bi-check2-all text-white font-bold" : "bi-check2-square text-indigo-500"} text-xs`}></i>
              <span>{showCheckboxes ? `Done (${currentSelectedSet.size})` : "Select"}</span>
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <i className="bi bi-x-circle"></i>
              <span>Reset to All Staff</span>
            </button>
          </div>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectModeLocal}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
                showCheckboxes
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-400/40"
                  : "bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-600 border-slate-200/90 hover:border-indigo-300"
              }`}
              title={showCheckboxes ? "Exit Multi-Select Mode" : "Enable Multi-Select Mode"}
            >
              <i className={`bi ${showCheckboxes ? "bi-check2-all text-white font-bold" : "bi-check2-square text-indigo-500"} text-xs`}></i>
              <span>{showCheckboxes ? `Done (${currentSelectedSet.size})` : "Select"}</span>
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <i className="bi bi-x-circle"></i>
              <span>Reset to All Staff</span>
            </button>
          </div>
        </div>
      )}

      {/* Default Sub-Toolbar if no KPI filter is active */}
      {!activeKpiFilter && (
        <div className="bg-slate-50/80 border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span className="font-bold text-slate-800">Team Hierarchy Roster</span>
            <span className="text-slate-400">•</span>
            <span>{totalVisibleCount} Total Staff Members</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectModeLocal}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
                showCheckboxes
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-400/40"
                  : "bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-600 border-slate-200/90 hover:border-indigo-300"
              }`}
              title={showCheckboxes ? "Exit Multi-Select Mode" : "Enable Multi-Select Mode"}
            >
              <i className={`bi ${showCheckboxes ? "bi-check2-all text-white font-bold" : "bi-check2-square text-indigo-500"} text-xs`}></i>
              <span>{showCheckboxes ? `Done (${currentSelectedSet.size})` : "Select"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Table Area */}
      <div className="overflow-x-auto min-h-[220px]">
        {/* VIEW A: Team Leads Roster */}
        {activeKpiFilter === "leads" ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                {showCheckboxes && (
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all leads on current page"
                      checked={leadGroups.length > 0 && leadGroups.every((l) => currentSelectedSet.has(l.supervisorId))}
                      ref={(el) => {
                        if (el) {
                          const someSelected = leadGroups.some((l) => currentSelectedSet.has(l.supervisorId));
                          const allSelected = leadGroups.length > 0 && leadGroups.every((l) => currentSelectedSet.has(l.supervisorId));
                          el.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={() => {
                        const leadIds = leadGroups.map((l) => l.supervisorId);
                        const allSelected = leadIds.length > 0 && leadIds.every((id) => currentSelectedSet.has(id));
                        if (allSelected) {
                          if (onClearSelection) onClearSelection();
                          if (!isControlled) setInternalSelectedIds(new Set());
                        } else {
                          if (onSelectAllStaff) onSelectAllStaff(leadIds);
                          if (!isControlled) setInternalSelectedIds(new Set(leadIds));
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                    />
                  </th>
                )}
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
                  <td colSpan={showCheckboxes ? 7 : 6} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading team leads...</span>
                    </div>
                  </td>
                </tr>
              ) : leadGroups.length === 0 ? (
                <tr>
                  <td colSpan={showCheckboxes ? 7 : 6} className="text-center py-12 text-slate-400">
                    No active team leads found in current filter.
                  </td>
                </tr>
              ) : (
                leadGroups.map((lead) => {
                  const isSelected = currentSelectedSet.has(lead.supervisorId);
                  return (
                  <tr
                    key={`lead-${lead.supervisorId}`}
                    onClick={() => {
                      if (showCheckboxes) {
                        toggleSelect(lead.supervisorId);
                      }
                    }}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? "bg-purple-100/50 hover:bg-purple-100/80" : "hover:bg-purple-50/30"
                    }`}
                    title={showCheckboxes ? "Click to toggle selection" : undefined}
                  >
                    {/* Checkbox Selector */}
                    {showCheckboxes && (
                      <td className="w-10 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${lead.supervisorName}`}
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(lead.supervisorId);
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                        />
                      </td>
                    )}
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
                          <button
                            type="button"
                            onClick={() => setSelectedSquadLead(lead)}
                            className="px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200 cursor-pointer transition-colors"
                          >
                            +{lead.members.length - 4} more
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Squad Capacity Indicator */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSquadLead(lead)}
                        className="inline-flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
                        title="Click to view full squad details"
                      >
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
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal(undefined, lead.supervisorId, lead.managerId)}
                        className="px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs border border-purple-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Add member to this squad"
                      >
                        <i className="bi bi-person-plus text-[10px]"></i>
                        <span>Add</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        ) : activeKpiFilter === "managers" ? (
          /* VIEW B: Department Managers Roster */
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                {showCheckboxes && (
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      aria-label="Select all managers on current page"
                      checked={managerGroups.length > 0 && managerGroups.every((m) => currentSelectedSet.has(m.managerId))}
                      ref={(el) => {
                        if (el) {
                          const someSelected = managerGroups.some((m) => currentSelectedSet.has(m.managerId));
                          const allSelected = managerGroups.length > 0 && managerGroups.every((m) => currentSelectedSet.has(m.managerId));
                          el.indeterminate = someSelected && !allSelected;
                        }
                      }}
                      onChange={() => {
                        const mgrIds = managerGroups.map((m) => m.managerId);
                        const allSelected = mgrIds.length > 0 && mgrIds.every((id) => currentSelectedSet.has(id));
                        if (allSelected) {
                          if (onClearSelection) onClearSelection();
                          if (!isControlled) setInternalSelectedIds(new Set());
                        } else {
                          if (onSelectAllStaff) onSelectAllStaff(mgrIds);
                          if (!isControlled) setInternalSelectedIds(new Set(mgrIds));
                        }
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                    />
                  </th>
                )}
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
                  <td colSpan={showCheckboxes ? 7 : 6} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading department managers...</span>
                    </div>
                  </td>
                </tr>
              ) : managerGroups.length === 0 ? (
                <tr>
                  <td colSpan={showCheckboxes ? 7 : 6} className="text-center py-12 text-slate-400">
                    No department managers found in current filter.
                  </td>
                </tr>
              ) : (
                managerGroups.map((mgr) => {
                  const isSelected = currentSelectedSet.has(mgr.managerId);
                  return (
                  <tr
                    key={`mgr-${mgr.managerId}`}
                    onClick={() => {
                      if (showCheckboxes) {
                        toggleSelect(mgr.managerId);
                      }
                    }}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? "bg-emerald-100/50 hover:bg-emerald-100/80" : "hover:bg-emerald-50/30"
                    }`}
                    title={showCheckboxes ? "Click to toggle selection" : undefined}
                  >
                    {/* Checkbox Selector */}
                    {showCheckboxes && (
                      <td className="w-10 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${mgr.managerName}`}
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelect(mgr.managerId);
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                        />
                      </td>
                    )}
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
                      <button
                        type="button"
                        onClick={() => setSelectedManagerGroup(mgr)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/90 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 shadow-2xs cursor-pointer transition-colors"
                        title="Click to view department overview"
                      >
                        <i className="bi bi-building-check text-emerald-600 text-xs"></i>
                        <span>{mgr.totalMembersCount} Total Staff</span>
                      </button>
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
                        onClick={() => onOpenAssignModal(undefined, undefined, mgr.managerId)}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Assign team lead or staff"
                      >
                        <i className="bi bi-diagram-3 text-[10px]"></i>
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        ) : (
          /* VIEW C: Standard Employee Reporting Line Table */
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                {showCheckboxes && (
                  <th className="py-2.5 px-3 text-center w-10">
                    <input
                      type="checkbox"
                      aria-label="Select all members on current page"
                      checked={visibleStaffIds.length > 0 && visibleStaffIds.every((id) => currentSelectedSet.has(id))}
                      ref={(el) => {
                        if (el) el.indeterminate = isPartiallySelected;
                      }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                      title="Select all visible staff"
                    />
                  </th>
                )}
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
                  <td colSpan={showCheckboxes ? 7 : 6} className="text-center py-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading hierarchy mappings...</span>
                    </div>
                  </td>
                </tr>
              ) : totalVisibleCount === 0 || isPreviewEmptyState ? (
                <tr>
                  <td colSpan={showCheckboxes ? 7 : 6} className="p-4 sm:p-8">
                    <HierarchyEmptyStateOnboarding
                      onOpenAssignModal={() => onOpenAssignModal()}
                      onResetFilters={onResetFilters}
                      isSimulated={isPreviewEmptyState}
                      onExitSimulation={onExitSimulation}
                      title={isOnlyUnassigned ? "All Active Staff Are Fully Mapped" : "No Hierarchy Records Found"}
                      description={
                        isOnlyUnassigned
                          ? "Every active staff member in the system currently has an assigned direct supervisor and department manager."
                          : "Begin structuring your organizational reporting lines by assigning your first team member or clearing active filters."
                      }
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {/* 1. Mapped Employees */}
                  {shouldRenderAssigned &&
                    mappings.map((item, idx, arr) => {
                      const isMenuOpen = activeMenuId === item.id;
                      const isSelected = currentSelectedSet.has(item.employee_id);

                      return (
                        <tr
                          key={`mapped-${item.id}`}
                          onClick={() => {
                            if (showCheckboxes) {
                              toggleSelect(item.employee_id);
                            } else if (onViewDossier) {
                              onViewDossier(item);
                            }
                          }}
                          className={`transition-colors cursor-pointer group ${
                            isSelected ? "bg-indigo-50/50 hover:bg-indigo-50/80" : "hover:bg-slate-50/70"
                          }`}
                          title={showCheckboxes ? "Click to toggle selection" : "Click row to view Employee Dossier"}
                        >
                          {/* Selection Checkbox */}
                          {showCheckboxes && (
                            <td className="py-2.5 px-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                aria-label={`Select ${item.employee_name}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(item.employee_id);
                                }}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                                title={`Select ${item.employee_name}`}
                              />
                            </td>
                          )}

                          {/* Employee Cell */}
                          <td className="py-2.5 px-4">
                            <div
                              onClick={() => onViewDossier && onViewDossier(item)}
                              className={`flex items-center gap-2.5 ${onViewDossier ? "cursor-pointer group" : ""}`}
                              title={onViewDossier ? "Click to view Employee Dossier" : undefined}
                            >
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                                {item.employee_name ? item.employee_name.charAt(0) : "E"}
                              </div>
                              <div className="min-w-0 max-w-xs">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-xs sm:text-[13px]">
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
                                  {onViewDossier && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onViewDossier(item);
                                      }}
                                      className="w-full px-2 py-1 text-[11px] text-indigo-700 hover:bg-indigo-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                                    >
                                      <i className="bi bi-person-badge-fill text-indigo-600 text-[10px]"></i>
                                      <span>View Dossier</span>
                                    </button>
                                  )}

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
                    unassignedStaff.map((staff) => {
                      const isSelected = currentSelectedSet.has(staff.id);
                      return (
                        <tr
                          key={`unassigned-${staff.id}`}
                          onClick={() => {
                            if (showCheckboxes) {
                              toggleSelect(staff.id);
                            } else if (onViewDossier) {
                              onViewDossier(staff);
                            }
                          }}
                          className={`transition-colors cursor-pointer group ${
                            isSelected ? "bg-amber-100/40 hover:bg-amber-100/60" : "hover:bg-amber-50/40 bg-amber-50/15"
                          }`}
                          title={showCheckboxes ? "Click to toggle selection" : "Click row to view Employee Dossier"}
                        >
                          {/* Selection Checkbox */}
                          {showCheckboxes && (
                            <td className="py-2.5 px-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                aria-label={`Select ${staff.name}`}
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(staff.id);
                                }}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                                title={`Select ${staff.name}`}
                              />
                            </td>
                          )}

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
                      );
                    })}
                </>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Bulk Actions Dock matching User Directory */}
      {!isControlled && currentSelectedSet.size > 0 && (
        <div
          className="fixed bottom-6 flex justify-center items-center z-[1050] pointer-events-none px-4"
          style={{ left: "240px", right: "0px" }}
        >
          <div className="floating-action-bar-anim bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 text-white rounded-2xl shadow-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 flex items-center gap-2 sm:gap-3.5 ring-1 ring-white/10 pointer-events-auto max-w-full overflow-visible">
            {/* Selected Counter Pill */}
            <div className="flex items-center gap-2 pr-1.5 sm:pr-3 border-r border-slate-700/80 shrink-0">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {currentSelectedSet.size} <span className="hidden sm:inline">Selected</span>
              </span>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleBulkBatchAssign}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-indigo-500/25 hover:bg-indigo-500/35 text-indigo-200 border border-indigo-400/40 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                title="Batch Reallocate / Assign Selected Staff"
              >
                <i className="bi bi-people-fill text-indigo-300 text-xs"></i>
                <span className="hidden md:inline">Batch Reallocate / Assign</span>
                <span className="md:hidden">Assign</span>
              </button>

              {onBatchUnlink && selectedMappedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onBatchUnlink(selectedMappedIds)}
                  className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95"
                  title="Unlink selected mapped staff"
                >
                  <i className="bi bi-link-45deg text-rose-400 text-xs"></i>
                  <span className="hidden md:inline">Unlink</span>
                  <span>({selectedMappedIds.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportSelectedCSV}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Export Selected Members as CSV"
              >
                <i className="bi bi-download text-indigo-300 text-xs"></i>
                <span className="hidden md:inline">Export</span>
              </button>
            </div>

            {/* Clear Selection / Close */}
            <button
              type="button"
              onClick={() => {
                setInternalSelectedIds(new Set());
                setInternalSelectMode(false);
              }}
              className="w-7 h-7 ml-0.5 sm:ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-xs shrink-0"
              title="Deselect All & Exit Multi-Select"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Interactive Squad Roster Modal */}
      {selectedSquadLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white px-5 py-4 border-b border-slate-200/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg font-bold shadow-2xs">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {selectedSquadLead.supervisorName}'s Squad
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {selectedSquadLead.members.length} Supervised Members • Dept: {selectedSquadLead.departmentName || "General"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSquadLead(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>

            {/* Modal Body: Squad Members List */}
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {selectedSquadLead.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {m.employee_name ? m.employee_name.charAt(0) : "E"}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {m.employee_name}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {m.employee_email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {onInitiateReassign && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSquadLead(null);
                          onInitiateReassign(m);
                        }}
                        className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10.5px] font-semibold border border-indigo-200 transition-colors cursor-pointer"
                      >
                        Reallocate
                      </button>
                    )}
                    {onInitiateUnlink && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSquadLead(null);
                          onInitiateUnlink(m);
                        }}
                        className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Unlink from squad"
                      >
                        <i className="bi bi-link-45deg text-sm"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200/90 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Reporting to: <strong className="text-slate-800">{selectedSquadLead.managerName}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  const lead = selectedSquadLead;
                  setSelectedSquadLead(null);
                  onOpenAssignModal(undefined, lead.supervisorId, lead.managerId);
                }}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <i className="bi bi-person-plus text-xs"></i>
                <span>Add Squad Member</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Interactive Manager Department Hierarchy Modal */}
      {selectedManagerGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white px-5 py-4 border-b border-slate-200/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg font-bold shadow-2xs">
                  <i className="bi bi-person-badge-fill"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {selectedManagerGroup.managerName}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    {selectedManagerGroup.departmentName || "General"} Department • {selectedManagerGroup.totalMembersCount} Total Staff
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedManagerGroup(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>

            {/* Modal Body: Supervisors in Department */}
            <div className="p-4 max-h-80 overflow-y-auto space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Reporting Team Leads ({selectedManagerGroup.supervisors.length})
              </h4>
              {selectedManagerGroup.supervisors.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {s.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Lead #{s.id}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    {s.membersCount} squad members
                  </span>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200/90 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Tier: <strong className="text-slate-800">Executive Management</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  const mgr = selectedManagerGroup;
                  setSelectedManagerGroup(null);
                  onOpenAssignModal(undefined, undefined, mgr.managerId);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <i className="bi bi-person-plus text-xs"></i>
                <span>Assign Staff</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
