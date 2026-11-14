import React from "react";
import { ProjectItem } from "../../../pages/admin/AdminProjects";

interface AdminProjectsGridProps {
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
  selectedProjectIds?: (number | string)[];
  onToggleSelectProject?: (projectId: number | string) => void;
  onSelectAllProjects?: () => void;
  onDeselectAllProjects?: () => void;
  showCheckboxes?: boolean;
  onSelectInitiative?: (id: number | string) => void;
}

export const AdminProjectsGrid: React.FC<AdminProjectsGridProps> = ({
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
  selectedProjectIds = [],
  onToggleSelectProject,
  onSelectAllProjects,
  onDeselectAllProjects,
  showCheckboxes = false,
  onSelectInitiative,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<number | string | null>(null);
  const selectAllCheckboxRef = React.useRef<HTMLInputElement>(null);

  const isAllSelected = projects.length > 0 && projects.every((p) => selectedProjectIds.includes(p.id));
  const isSomeSelected = projects.some((p) => selectedProjectIds.includes(p.id)) && !isAllSelected;

  React.useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  React.useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 mb-3">
      {/* Cards Selection Toolbar */}
      {showCheckboxes && projects.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              ref={selectAllCheckboxRef}
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
            />
            <span className="font-semibold text-slate-700 text-xs">
              {isAllSelected ? "Deselect All Cards" : "Select All Cards"} ({projects.length})
            </span>
          </label>
          {selectedProjectIds.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              {selectedProjectIds.length} card{selectedProjectIds.length > 1 ? "s" : ""} selected
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects.map((proj) => {
          const isSelected = selectedProjectIds.includes(proj.id);
          const isOverdue = proj.is_overdue || (proj.health === "critical" && proj.status !== "completed");
          const isBlocked = Boolean(proj.is_blocked && proj.blocker_status && proj.blocker_status !== "none");
          const isMenuOpen = activeMenuId === proj.id;

          return (
            <div
              key={proj.id}
              className={`bg-white rounded-xl border shadow-2xs hover:shadow-xs transition-all p-3.5 flex flex-col justify-between ${
                isSelected
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/15"
                  : isBlocked
                  ? "border-rose-300 ring-2 ring-rose-500/30 shadow-rose-100"
                  : "border-slate-200/90"
              } ${isMenuOpen ? "relative z-30" : "relative"}`}
            >
              <div>
                {/* High-visibility Pulsing Blocker Ribbon on Card Top */}
                {isBlocked && (
                  <div
                    onClick={() => onOpenBlockerModal?.(proj)}
                    className="mb-2 -mx-3.5 -mt-3.5 px-3 py-1.5 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 text-white rounded-t-xl flex items-center justify-between gap-2 shadow-xs cursor-pointer hover:brightness-105 transition-all animate-pulse"
                    title={`Executive Blocker Active: ${proj.blocker_status?.replace(/_/g, " ")}. Click to manage.`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <i className="bi bi-shield-slash-fill text-xs shrink-0"></i>
                      <span className="text-[10px] font-black uppercase tracking-wider truncate">
                        BLOCKED: {proj.blocker_status?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold bg-black/25 hover:bg-black/35 px-1.5 py-0.5 rounded text-white shrink-0">
                      Manage ⚙️
                    </span>
                  </div>
                )}

                {/* Card Header: Dept, Priority, Status Capsule, and Triple-dot Menu */}
                <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {showCheckboxes && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelectProject?.(proj.id);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-all shrink-0"
                      title={`Select initiative PRJ-${String(proj.id).padStart(4, "0")}`}
                    />
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 truncate">
                    🏢 {proj.department_name || "General"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {proj.priority === "critical" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                      Critical
                    </span>
                  )}
                  {proj.priority === "high" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      High
                    </span>
                  )}
                  {proj.priority === "medium" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Medium
                    </span>
                  )}
                  {proj.priority === "low" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Low
                    </span>
                  )}

                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      proj.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : proj.status === "planning"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : proj.status === "completed"
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : proj.status === "archived"
                        ? "bg-slate-200 text-slate-800 border border-slate-300"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {proj.status.toUpperCase()}
                  </span>

                  {/* Triple dot actions dropdown positioned right next to status capsule */}
                  <div className="relative inline-flex items-center">
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
                        className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-0.5">
                          Initiative Actions
                        </div>

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
                            <span>Squad Roster {proj.squad && proj.squad.length > 0 ? `(${proj.squad.length})` : ""}</span>
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
                            <span>In-View Tasks ({proj.completed_tasks}/{proj.total_tasks})</span>
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
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <button
                    type="button"
                    onClick={() => onOpenDossierModal?.(proj)}
                    className="font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 mb-0 line-clamp-1 text-left cursor-pointer transition-colors"
                    title="Open 360° Inspection Dossier"
                  >
                    {proj.title}
                  </button>
                  <span className="text-[9px] font-mono font-semibold text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                    PRJ-{String(proj.id).padStart(4, "0")}
                  </span>
                </div>
                {proj.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-0">
                    {proj.description}
                  </p>
                )}
              </div>

              {/* Lead Supervisor Chip */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {proj.supervisor_name ? proj.supervisor_name.charAt(0) : "U"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-800 block truncate">
                      {proj.supervisor_name || "Unassigned Lead"}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      Lead Supervisor
                    </span>
                  </div>
                </div>

                {proj.target_date && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-600 block font-medium">
                      {new Date(proj.target_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {proj.days_left !== null && proj.status !== "completed" && (
                      <span
                        className={`text-[9px] font-bold block ${
                          isOverdue ? "text-rose-600" : "text-slate-400"
                        }`}
                      >
                        {isOverdue ? `Overdue ${Math.abs(proj.days_left)}d` : `${proj.days_left}d left`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Task Rollup Velocity Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] font-medium mb-1">
                  <span className="text-slate-500">
                    {proj.completed_tasks}/{proj.total_tasks} Tasks Complete
                  </span>
                  <span className="font-bold text-slate-800">
                    {proj.progress_percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
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
              </div>
            </div>

            {/* Bottom Footer: Health Badge & Compact Squad Stack */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
              <div className="flex items-center gap-1.5">
                {Boolean(proj.budget) && (
                  <button
                    type="button"
                    onClick={() => onOpenBudgetHUD?.(proj)}
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                      proj.is_critical_burn
                        ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                    title="Click to inspect Financial Runway HUD"
                  >
                    <i className="bi bi-cash-stack text-[9px] text-emerald-600"></i>
                    <span>${Math.round(Number(proj.budget || 0) / 1000)}k</span>
                    <span className="text-slate-400">•</span>
                    <span>{proj.budget_burn_pct || 0}%</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1">
                {isOverdue ? (
                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-octagon-fill text-[9px]"></i>
                    Overdue
                  </span>
                ) : proj.health === "at_risk" ? (
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-triangle-fill text-[9px]"></i>
                    At Risk
                  </span>
                ) : proj.status === "completed" ? (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <i className="bi bi-check2-circle text-[10px]"></i>
                    Delivered
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    On Track
                  </span>
                )}
              </div>

              {proj.squad && proj.squad.length > 0 && onOpenSquadDrawer && (
                <button
                  type="button"
                  onClick={() => onOpenSquadDrawer(proj)}
                  className="flex items-center -space-x-1 hover:opacity-80 transition-opacity cursor-pointer"
                  title={`Squad (${proj.squad.length}): ${proj.squad.map((m: any) => m.name).join(", ")}`}
                >
                  {proj.squad.slice(0, 3).map((m: any, idx: number) => (
                    <div
                      key={idx}
                      className="w-4.5 h-4.5 rounded-full bg-indigo-600 text-white text-[7px] font-bold flex items-center justify-center border border-white shadow-2xs"
                    >
                      {m.name.charAt(0)}
                    </div>
                  ))}
                  {proj.squad.length > 3 && (
                    <div className="w-4.5 h-4.5 rounded-full bg-slate-100 text-slate-600 text-[7px] font-bold flex items-center justify-center border border-white shadow-2xs">
                      +{proj.squad.length - 3}
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};
