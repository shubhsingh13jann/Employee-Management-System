import React, { useState, useEffect } from "react";
import { ProjectItem } from "../../../pages/admin/AdminProjects";
import { ColumnVisibility, DEFAULT_COLUMN_VISIBILITY } from "./AdminProjectsFilters";

interface AdminProjectsTableProps {
  projects: ProjectItem[];
  onOpenEditModal?: (project: ProjectItem) => void;
  onUpdateStatus?: (projectId: number | string, newStatus: string) => void;
  onDeleteProject?: (projectId: number | string) => void;
  onOpenMilestonesModal?: (project: ProjectItem) => void;
  onOpenDossierModal?: (project: ProjectItem) => void;
  onOpenSquadDrawer?: (project: ProjectItem) => void;
  onOpenTasksTray?: (project: ProjectItem) => void;
  onQuickAddTask?: (project: ProjectItem) => void;
  onOpenBudgetHUD?: (project: ProjectItem) => void;
  onOpenBlockerModal?: (project: ProjectItem) => void;
  onOpenAuditDrawer?: (project: ProjectItem) => void;
  visibleColumns?: ColumnVisibility;
  selectedProjectIds?: (number | string)[];
  onToggleSelectProject?: (projectId: number | string) => void;
  onSelectAllProjects?: () => void;
  onDeselectAllProjects?: () => void;
  showCheckboxes?: boolean;
  onSelectInitiative?: (id: number | string) => void;
}

export const AdminProjectsTable: React.FC<AdminProjectsTableProps> = ({
  projects,
  onOpenEditModal,
  onUpdateStatus,
  onDeleteProject,
  onOpenMilestonesModal,
  onOpenDossierModal,
  onOpenSquadDrawer,
  onOpenTasksTray,
  onQuickAddTask,
  onOpenBudgetHUD,
  onOpenBlockerModal,
  onOpenAuditDrawer,
  visibleColumns = DEFAULT_COLUMN_VISIBILITY,
  selectedProjectIds = [],
  onToggleSelectProject,
  onSelectAllProjects,
  onDeselectAllProjects,
  showCheckboxes = false,
  onSelectInitiative,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const headerCheckboxRef = React.useRef<HTMLInputElement>(null);

  const isAllSelected = projects.length > 0 && projects.every((p) => selectedProjectIds.includes(p.id));
  const isSomeSelected = projects.some((p) => selectedProjectIds.includes(p.id)) && !isAllSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      document.addEventListener("click", handleDocumentClick);
    }
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [activeMenuId]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
            Critical
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case "planning":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Planning
          </span>
        );
      case "on_hold":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            On Hold
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <i className="bi bi-check2-circle text-emerald-600"></i>
            Completed
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
            <i className="bi bi-archive-fill text-slate-500 text-[9px]"></i>
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getHealthBadge = (health: string, isOverdue: boolean, proj?: ProjectItem) => {
    if (proj?.is_blocked && proj.blocker_status && proj.blocker_status !== "none") {
      return (
        <button
          type="button"
          onClick={() => onOpenBlockerModal?.(proj)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs hover:bg-rose-200 transition-all cursor-pointer animate-pulse"
          title={`Executive Blocker: ${proj.blocker_status?.replace(/_/g, " ")}. Click to manage.`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
          <i className="bi bi-shield-slash-fill text-[9px] text-rose-600"></i>
          <span>Blocked</span>
        </button>
      );
    }
    if (isOverdue || health === "critical") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <i className="bi bi-exclamation-octagon-fill text-rose-600 text-[10px]"></i>
          Critical / Overdue
        </span>
      );
    }
    if (health === "at_risk") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <i className="bi bi-exclamation-triangle-fill text-amber-600 text-[10px]"></i>
          At Risk
        </span>
      );
    }
    if (health === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <i className="bi bi-check-all text-emerald-600 text-xs"></i>
          Delivered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Healthy
      </span>
    );
  };

  const activeColumns = visibleColumns || DEFAULT_COLUMN_VISIBILITY;

  // Calculate dynamic table min-width so that remaining columns automatically adjust gaps and width
  const calculateTableMinWidth = () => {
    let min = showCheckboxes ? 40 : 0; // Selection checkbox column
    if (activeColumns.initiative) min += 220;
    if (activeColumns.department) min += 95;
    if (activeColumns.supervisor) min += 125;
    if (activeColumns.priority) min += 85;
    if (activeColumns.velocity) min += 110;
    if (activeColumns.budget) min += 105;
    if (activeColumns.target_date) min += 105;
    if (activeColumns.health) min += 85;
    if (activeColumns.status) min += 85;
    if (activeColumns.actions) min += 60;
    return Math.max(min, 450);
  };

  const hasVisibleColumns = Object.values(activeColumns).some(Boolean);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden mb-3">
      {/* Scrollable table container with prominent, smooth custom scrollbar */}
      <div className="table-scrollbar overflow-x-auto min-h-[240px] pb-2">
        <table
          className="w-full text-left text-xs table-auto"
          style={{ minWidth: `${calculateTableMinWidth()}px` }}
        >
          <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              {/* Multi-Select Select-All Checkbox Column */}
              {showCheckboxes && (
                <th className="py-2.5 pl-4 pr-1 text-center w-10 min-w-[40px]">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={() => {
                      if (isAllSelected) {
                        onDeselectAllProjects?.();
                      } else {
                        onSelectAllProjects?.();
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-all"
                    title={isAllSelected ? "Deselect all initiatives" : "Select all visible initiatives"}
                  />
                </th>
              )}
              {activeColumns.initiative && (
                <th className="py-2.5 pl-4.5 pr-3.5 text-left min-w-[200px]">Strategic Initiative</th>
              )}
              {activeColumns.department && (
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap min-w-[95px]">Department</th>
              )}
              {activeColumns.supervisor && (
                <th className="py-2.5 px-3.5 text-left whitespace-nowrap min-w-[125px]">Lead Supervisor</th>
              )}
              {activeColumns.priority && (
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap min-w-[85px]">Priority</th>
              )}
              {activeColumns.velocity && (
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap min-w-[110px]">Task Velocity</th>
              )}
              {activeColumns.budget && (
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap min-w-[105px]">Budget & Burn</th>
              )}
              {activeColumns.target_date && (
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap min-w-[105px]">Target Date</th>
              )}
              {activeColumns.health && (
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap min-w-[85px]">Health</th>
              )}
              {activeColumns.status && (
                <th className="py-2.5 px-3.5 text-center whitespace-nowrap min-w-[85px]">Status</th>
              )}
              {activeColumns.actions && (
                <th className="py-2.5 pl-3.5 pr-4.5 text-center min-w-[60px] whitespace-nowrap sticky right-0 bg-slate-50/95 backdrop-blur-xs z-20 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!hasVisibleColumns ? (
              <tr>
                {/* Empty columns state */}
                <td colSpan={showCheckboxes ? 11 : 10} className="py-12 text-center text-slate-400 text-xs">
                  <i className="bi bi-layout-three-columns text-xl block mb-1 text-slate-300"></i>
                  No columns selected. Please enable at least one column from the filter dropdown.
                </td>
              </tr>
            ) : (
              projects.map((proj, idx, arr) => {
                const isMenuOpen = activeMenuId === proj.id;
                const isSelected = selectedProjectIds.includes(proj.id);
                const isBlocked = Boolean(proj.is_blocked && proj.blocker_status && proj.blocker_status !== "none");

                return (
                  <tr
                    key={proj.id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-indigo-50/75 hover:bg-indigo-50/90 border-l-2 border-l-indigo-600"
                        : isBlocked
                        ? "bg-rose-50/30 hover:bg-rose-50/60 border-l-3 border-l-rose-600"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    {/* Row Multi-Select Checkbox */}
                    {showCheckboxes && (
                      <td className="py-2.5 pl-4 pr-1 text-center w-10 min-w-[40px]">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleSelectProject?.(proj.id);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-all"
                          title={`Select initiative PRJ-${String(proj.id).padStart(4, "0")}`}
                        />
                      </td>
                    )}
                    {/* 1. Initiative Title & Details (Strictly 2 rows) */}
                    {activeColumns.initiative && (
                      <td className="py-2.5 pl-4.5 pr-3.5">
                        {/* High-visibility Pulsing Blocker Banner */}
                        {isBlocked && (
                          <div className="flex items-center gap-1.5 mb-1.5 animate-pulse">
                            <button
                              type="button"
                              onClick={() => onOpenBlockerModal?.(proj)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer transition-colors shrink-0"
                              title="Click to view, update, or resolve this executive blocker"
                            >
                              <i className="bi bi-shield-slash-fill text-[9px]"></i>
                              <span>🚫 BLOCKED: {proj.blocker_status?.replace(/_/g, " ")}</span>
                            </button>
                            {proj.blocker_notes && (
                              <span
                                className="text-[10px] font-medium text-rose-700 truncate max-w-[240px] hidden sm:inline-block italic"
                                title={proj.blocker_notes}
                              >
                                "{proj.blocker_notes}"
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => onOpenMilestonesModal?.(proj)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs cursor-pointer transition-colors"
                            title="Manage Sub-Milestones & Deliverables"
                          >
                            <i className="bi bi-kanban"></i>
                          </button>
                          <div className="min-w-0 flex-1">
                            {/* Row 1: Title + PRJ Badge side by side without wrapping */}
                            <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
                              <button
                                type="button"
                                onClick={() => onOpenDossierModal?.(proj)}
                                className="font-bold text-slate-900 hover:text-indigo-600 truncate text-xs sm:text-[13px] text-left cursor-pointer transition-colors"
                                title="Open Project 360° Inspection Dossier"
                              >
                                {proj.title}
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenDossierModal?.(proj)}
                                className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.2 rounded border border-slate-200 shrink-0 cursor-pointer transition-colors"
                                title="Open 360° Dossier"
                              >
                                PRJ-{String(proj.id).padStart(4, "0")}
                              </button>
                            </div>
                            {/* Row 2: Description */}
                            {proj.description && (
                              <span
                                className="text-[10px] text-slate-400 block truncate mt-0.5"
                                title={proj.description}
                              >
                                {proj.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 2. Department */}
                    {activeColumns.department && (
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {proj.department_name || "General"}
                        </span>
                      </td>
                    )}

                    {/* 3. Lead Supervisor */}
                    {activeColumns.supervisor && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          {proj.supervisor_name ? (
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {proj.supervisor_name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span
                                  className="font-semibold text-slate-800 block text-xs truncate max-w-[105px] leading-tight"
                                  title={proj.supervisor_name}
                                >
                                  {proj.supervisor_name}
                                </span>
                                <span className="text-[9px] text-slate-400 block truncate leading-tight">
                                  Lead Supervisor
                                </span>
                              </div>
                              {onOpenSquadDrawer && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSquadDrawer(proj)}
                                  className="ml-auto w-5 h-5 rounded hover:bg-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Manage Project Squad Roster"
                                >
                                  <i className="bi bi-people-fill text-[10px]"></i>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Unassigned Lead
                              </span>
                              {onOpenSquadDrawer && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSquadDrawer(proj)}
                                  className="w-5 h-5 rounded hover:bg-slate-200 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Assign Squad"
                                >
                                  <i className="bi bi-person-plus text-[10px]"></i>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Squad Avatar Cluster / Allocation Badge */}
                          <div className="mt-1">
                            {proj.squad && proj.squad.length > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenSquadDrawer && onOpenSquadDrawer(proj);
                                }}
                                className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                title={`${proj.squad.length} Squad Members Allocated (Click to manage roster)`}
                              >
                                <div className="flex items-center -space-x-1">
                                  {proj.squad.slice(0, 3).map((m: any, idx: number) => (
                                    m.image_url ? (
                                      <img
                                        key={idx}
                                        src={`http://localhost:5000/images/${m.image_url}`}
                                        alt={m.name}
                                        className="w-3.5 h-3.5 rounded-full object-cover border border-white"
                                      />
                                    ) : (
                                      <div
                                        key={idx}
                                        className="w-3.5 h-3.5 rounded-full bg-indigo-600 text-white font-bold text-[7px] flex items-center justify-center border border-white"
                                      >
                                        {m.name.charAt(0)}
                                      </div>
                                    )
                                  ))}
                                </div>
                                <span>Squad ({proj.squad.length})</span>
                              </button>
                            ) : (
                              onOpenSquadDrawer && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenSquadDrawer(proj);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-purple-50 text-slate-500 hover:text-purple-700 border border-slate-200 hover:border-purple-300 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                                  title="Allocate technical staff to this initiative squad"
                                >
                                  <i className="bi bi-people text-purple-600 text-[9px]"></i>
                                  <span>+ Squad</span>
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 4. Priority */}
                    {activeColumns.priority && (
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {getPriorityBadge(proj.priority)}
                      </td>
                    )}

                    {/* 5. Task Velocity Bar (Clickable to open Tasks Tray) */}
                    {activeColumns.velocity && (
                      <td
                        className="py-2.5 px-3.5 text-center whitespace-nowrap cursor-pointer hover:bg-indigo-50/40 transition-colors group"
                        onClick={() => onOpenTasksTray && onOpenTasksTray(proj)}
                        title="Click to inspect task breakdown & quick dispatch"
                      >
                        <div className="inline-block w-22 sm:w-26 text-left">
                          <div className="flex items-center justify-between text-[10px] font-medium mb-1">
                            <span className="text-slate-600 group-hover:text-indigo-600 font-semibold flex items-center gap-1 transition-colors">
                              <i className="bi bi-list-task text-[9px] text-blue-600"></i>
                              {proj.completed_tasks}/{proj.total_tasks}
                            </span>
                            <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {proj.progress_percentage}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 mb-1">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                proj.progress_percentage >= 80
                                  ? "bg-emerald-500"
                                  : proj.progress_percentage >= 40
                                  ? "bg-indigo-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${proj.progress_percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-[9px]">
                            <span className="text-indigo-600 font-medium group-hover:underline flex items-center gap-0.5">
                              <i className="bi bi-eye text-[8px]"></i>
                              <span>Tasks</span>
                            </span>
                            {onQuickAddTask && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickAddTask(proj);
                                }}
                                className="text-emerald-700 font-bold hover:text-emerald-800 hover:bg-emerald-100 px-1 py-0.2 rounded transition-colors"
                                title="Quick add task"
                              >
                                + Add
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* 5.5 Budget & Expenditure Burn Rate HUD */}
                    {activeColumns.budget && (
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenBudgetHUD?.(proj)}
                          className={`inline-flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer group ${
                            proj.is_critical_burn
                              ? "bg-rose-50/80 border-rose-300 hover:bg-rose-100"
                              : (proj.budget_burn_pct || 0) >= 75
                              ? "bg-amber-50/80 border-amber-300 hover:bg-amber-100"
                              : "bg-slate-50 border-slate-200/90 hover:bg-slate-100"
                          }`}
                          title="Inspect Financial Burn Rate HUD"
                        >
                          <span className="text-[11px] font-bold text-slate-800 leading-none">
                            ${Number(proj.budget || 0).toLocaleString()}
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                                proj.is_over_budget
                                  ? "bg-rose-600 text-white"
                                  : proj.is_critical_burn
                                  ? "bg-rose-600 text-white animate-pulse"
                                  : (proj.budget_burn_pct || 0) >= 75
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {proj.is_over_budget ? "Deficit" : `${proj.budget_burn_pct || 0}% Burn`}
                            </span>
                          </div>
                        </button>
                      </td>
                    )}

                    {/* 6. Target Date / Countdown */}
                    {activeColumns.target_date && (
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {proj.target_date ? (
                          <div className="inline-block text-center">
                            <span className="text-xs text-slate-700 block font-medium leading-tight">
                              {new Date(proj.target_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            {proj.status !== "completed" && proj.days_left !== null && (
                              <span
                                className={`text-[9px] font-bold block leading-tight mt-0.5 ${
                                  proj.days_left < 0
                                    ? "text-rose-600"
                                    : proj.days_left <= 7
                                    ? "text-amber-600"
                                    : "text-slate-400"
                                }`}
                              >
                                {proj.days_left < 0
                                  ? `Overdue by ${Math.abs(proj.days_left)}d`
                                  : `${proj.days_left}d remaining`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No deadline</span>
                        )}
                      </td>
                    )}

                    {/* 7. Health / Risk */}
                    {activeColumns.health && (
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {getHealthBadge(proj.health, proj.is_overdue, proj)}
                      </td>
                    )}

                    {/* 8. Status */}
                    {activeColumns.status && (
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          {getStatusBadge(proj.status)}
                          {proj.status === "archived" && onUpdateStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(proj.id, "active")}
                              className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-0.5 transition-colors mt-0.5"
                              title="Click to unarchive and restore this initiative to Active"
                            >
                              <i className="bi bi-arrow-counterclockwise text-[8.5px]"></i>
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 9. Actions Menu (Sticky on right edge) */}
                    {activeColumns.actions && (
                      <td
                        className={`py-2.5 pl-3.5 pr-4.5 text-center whitespace-nowrap sticky right-0 bg-white/95 backdrop-blur-xs shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] ${
                          isMenuOpen ? "z-30" : "z-10"
                        }`}
                      >
                        <div className="relative inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId((prev) => (prev === proj.id ? null : proj.id));
                            }}
                            className={`w-6 h-6 rounded-md border transition-all inline-flex items-center justify-center cursor-pointer ${
                              isMenuOpen
                                ? "bg-slate-100 text-slate-900 border-slate-300 shadow-2xs"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-2xs"
                            }`}
                            title="Initiative Actions"
                          >
                            <i className="bi bi-three-dots text-[10px]"></i>
                          </button>

                          {isMenuOpen && (
                            <div
                              className={`absolute right-0 ${
                                idx >= arr.length - 2 && arr.length > 2
                                  ? "bottom-full mb-1"
                                  : "top-full mt-1"
                              } w-44 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-0.5">
                                Initiative Actions
                              </div>

                              {onSelectInitiative && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onSelectInitiative(proj.id);
                                  }}
                                  className={`w-full px-2 py-1 text-[11px] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium mb-0.5 ${
                                    isSelected
                                      ? "text-indigo-700 bg-indigo-50 font-bold"
                                      : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                                  }`}
                                  title="Toggle multi-select for this initiative"
                                >
                                  <i className={`bi ${isSelected ? "bi-check2-square text-indigo-600" : "bi-square text-slate-400"} text-[10px]`}></i>
                                  <span>{isSelected ? "Deselect Initiative" : "Select Initiative"}</span>
                                </button>
                              )}

                              {onOpenDossierModal && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenDossierModal(proj);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-bold mb-0.5"
                                >
                                  <i className="bi bi-file-earmark-text-fill text-indigo-600 text-[10px]"></i>
                                  <span>360° Dossier</span>
                                </button>
                              )}
                              {onUpdateStatus && (
                                <>
                                  {proj.status === "archived" ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onUpdateStatus(proj.id, "active");
                                      }}
                                      className="w-full px-2 py-1.5 text-[11px] text-emerald-800 hover:bg-emerald-100 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-bold bg-emerald-50/80 border border-emerald-200"
                                      title="Restore this initiative back to Active status"
                                    >
                                      <i className="bi bi-arrow-counterclockwise text-emerald-600 text-xs"></i>
                                      <span>Unarchive / Restore</span>
                                    </button>
                                  ) : (
                                    <>
                                      {proj.status !== "active" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            onUpdateStatus(proj.id, "active");
                                          }}
                                          className="w-full px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                        >
                                          <i className="bi bi-play-circle text-emerald-600 text-[10px]"></i>
                                          <span>Mark Active</span>
                                        </button>
                                      )}
                                      {proj.status !== "completed" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            onUpdateStatus(proj.id, "completed");
                                          }}
                                          className="w-full px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                        >
                                          <i className="bi bi-check2-circle text-blue-600 text-[10px]"></i>
                                          <span>Mark Completed</span>
                                        </button>
                                      )}
                                      {proj.status !== "on_hold" && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            onUpdateStatus(proj.id, "on_hold");
                                          }}
                                          className="w-full px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                        >
                                          <i className="bi bi-pause-circle text-amber-600 text-[10px]"></i>
                                          <span>Place On Hold</span>
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          onUpdateStatus(proj.id, "archived");
                                        }}
                                        className="w-full px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                        title="Move initiative to archive"
                                      >
                                        <i className="bi bi-archive text-slate-500 text-[10px]"></i>
                                        <span>Archive Initiative</span>
                                      </button>
                                    </>
                                  )}
                                </>
                              )}

                              <div className="my-1 border-t border-slate-100"></div>

                              {onOpenSquadDrawer && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenSquadDrawer(proj);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-purple-700 hover:bg-purple-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                >
                                  <i className="bi bi-people-fill text-purple-600 text-[10px]"></i>
                                  <span>Squad Roster</span>
                                </button>
                              )}

                              {onOpenTasksTray && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenTasksTray(proj);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                >
                                  <i className="bi bi-list-task text-blue-600 text-[10px]"></i>
                                  <span>In-View Tasks</span>
                                </button>
                              )}

                              {onQuickAddTask && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onQuickAddTask(proj);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                >
                                  <i className="bi bi-plus-circle text-emerald-600 text-[10px]"></i>
                                  <span>+ Quick Task</span>
                                </button>
                              )}

                              {onOpenBudgetHUD && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenBudgetHUD(proj);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                >
                                  <i className="bi bi-cash-stack text-emerald-600 text-[10px]"></i>
                                  <span>Budget & Burn HUD</span>
                                </button>
                              )}

                              {onOpenMilestonesModal && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenMilestonesModal(proj);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-indigo-700 hover:bg-indigo-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                >
                                  <i className="bi bi-flag-fill text-indigo-600 text-[10px]"></i>
                                  <span>Sub-Milestones</span>
                                </button>
                              )}

                              {onOpenBlockerModal && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenBlockerModal(proj);
                                  }}
                                  className={`w-full px-2 py-1 text-[11px] rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-semibold ${
                                    isBlocked
                                      ? "text-rose-700 hover:bg-rose-50 bg-rose-50/70"
                                      : "text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                                  }`}
                                  title="Flag or manage executive blockers and operational risks"
                                >
                                  <i className={`bi ${isBlocked ? "bi-shield-slash-fill text-rose-600" : "bi-shield-exclamation text-amber-500"} text-[10px]`}></i>
                                  <span>{isBlocked ? "Manage Blocker" : "Flag Blocker / Risk"}</span>
                                </button>
                              )}

                              {onOpenAuditDrawer && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenAuditDrawer(proj);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                  title="View immutable change ledger & before/after differential audit"
                                >
                                  <i className="bi bi-clock-history text-indigo-500 text-[10px]"></i>
                                  <span>Audit History</span>
                                </button>
                              )}

                              {onOpenEditModal && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onOpenEditModal(proj);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                >
                                  <i className="bi bi-pencil-square text-indigo-500 text-[10px]"></i>
                                  <span>Edit Initiative</span>
                                </button>
                              )}

                              {onDeleteProject && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onDeleteProject(proj.id);
                                  }}
                                  className="w-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                                >
                                  <i className="bi bi-trash3 text-rose-500 text-[10px]"></i>
                                  <span>Archive / Delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
