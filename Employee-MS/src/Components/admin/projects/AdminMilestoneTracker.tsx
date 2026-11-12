import React, { useState } from "react";
import api from "../../../api/axios";
import { ProjectItem } from "../../../pages/admin/AdminProjects";
import { ProjectMilestoneItem } from "./ProjectMilestonesModal";

interface AdminMilestoneTrackerProps {
  projects: ProjectItem[];
  onOpenEditModal?: (project: ProjectItem) => void;
  onUpdateStatus?: (projectId: number | string, newStatus: string) => void;
  onOpenMilestonesModal?: (project: ProjectItem) => void;
  onOpenDossierModal?: (project: ProjectItem) => void;
  selectedProjectIds?: (number | string)[];
  onToggleSelectProject?: (projectId: number | string) => void;
  onSelectAllProjects?: () => void;
  onDeselectAllProjects?: () => void;
  showCheckboxes?: boolean;
}

export const AdminMilestoneTracker: React.FC<AdminMilestoneTrackerProps> = ({
  projects,
  onOpenEditModal,
  onUpdateStatus,
  onOpenMilestonesModal,
  onOpenDossierModal,
  selectedProjectIds = [],
  onToggleSelectProject,
  onSelectAllProjects,
  onDeselectAllProjects,
  showCheckboxes = false,
}) => {
  const selectAllCheckboxRef = React.useRef<HTMLInputElement>(null);
  const isAllSelected = projects.length > 0 && projects.every((p) => selectedProjectIds.includes(p.id));
  const isSomeSelected = projects.some((p) => selectedProjectIds.includes(p.id)) && !isAllSelected;

  React.useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);
  // Expanded project IDs for nested sub-milestones
  const [expandedProjects, setExpandedProjects] = useState<{ [id: string]: boolean }>({});
  const [milestonesCache, setMilestonesCache] = useState<{ [id: string]: ProjectMilestoneItem[] }>({});
  const [loadingMilestones, setLoadingMilestones] = useState<{ [id: string]: boolean }>({});

  // Toggle expanding nested sub-milestones tray
  const handleToggleExpand = async (proj: ProjectItem) => {
    const projId = String(proj.id);
    const isCurrentlyExpanded = Boolean(expandedProjects[projId]);

    setExpandedProjects((prev) => ({
      ...prev,
      [projId]: !isCurrentlyExpanded,
    }));

    // If opening and not cached yet, fetch from API
    if (!isCurrentlyExpanded && !milestonesCache[projId]) {
      try {
        setLoadingMilestones((prev) => ({ ...prev, [projId]: true }));
        const res = await api.get(`/api/admin/projects/${proj.id}/milestones`);
        if (res.data.status) {
          setMilestonesCache((prev) => ({
            ...prev,
            [projId]: res.data.milestones,
          }));
        }
      } catch (err) {
        console.error("Failed to load nested milestones for project:", err);
      } finally {
        setLoadingMilestones((prev) => ({ ...prev, [projId]: false }));
      }
    }
  };

  // Toggle deliverable checkbox directly from timeline
  const handleToggleDeliverable = async (
    projectId: number | string,
    milestoneId: number | string,
    deliverableId: string,
    currentVal: boolean
  ) => {
    const projId = String(projectId);
    const nextVal = !currentVal;

    // Optimistic cache update
    setMilestonesCache((prev) => {
      const currentList = prev[projId] || [];
      const updatedList = currentList.map((m) => {
        if (m.id === milestoneId) {
          const nextDel = m.deliverables.map((d) =>
            d.id === deliverableId ? { ...d, completed: nextVal } : d
          );
          const allDone = nextDel.length > 0 && nextDel.every((d) => d.completed);
          const anyDone = nextDel.some((d) => d.completed);
          const newStatus = allDone ? "completed" : anyDone ? "in_progress" : m.status;

          return {
            ...m,
            deliverables: nextDel,
            status: newStatus as any,
            completed_deliverables: nextDel.filter((d) => d.completed).length,
            progress_percentage: Math.round(
              (nextDel.filter((d) => d.completed).length / nextDel.length) * 100
            ),
          };
        }
        return m;
      });
      return { ...prev, [projId]: updatedList };
    });

    try {
      await api.put(`/api/admin/projects/milestones/${milestoneId}/deliverable-toggle`, {
        deliverableId,
        completed: nextVal,
      });
    } catch (err) {
      console.error("Deliverable toggle failed:", err);
    }
  };

  // Toggle milestone status directly from timeline
  const handleToggleMilestoneStatus = async (
    projectId: number | string,
    milestone: ProjectMilestoneItem
  ) => {
    const projId = String(projectId);
    const nextStatus = milestone.status === "completed" ? "in_progress" : "completed";

    // Optimistic cache update
    setMilestonesCache((prev) => {
      const currentList = prev[projId] || [];
      const updatedList = currentList.map((m) => {
        if (m.id === milestone.id) {
          const updatedDel =
            nextStatus === "completed"
              ? m.deliverables.map((d) => ({ ...d, completed: true }))
              : m.deliverables;
          return {
            ...m,
            status: nextStatus as any,
            deliverables: updatedDel,
            completed_deliverables: nextStatus === "completed" ? updatedDel.length : m.completed_deliverables,
            progress_percentage: nextStatus === "completed" ? 100 : m.progress_percentage,
          };
        }
        return m;
      });
      return { ...prev, [projId]: updatedList };
    });

    try {
      await api.put(`/api/admin/projects/milestones/${milestone.id}/status`, {
        status: nextStatus,
      });
    } catch (err) {
      console.error("Milestone status toggle failed:", err);
    }
  };

  // Sort projects by target_date
  const sortedProjects = [...projects].sort((a, b) => {
    if (!a.target_date) return 1;
    if (!b.target_date) return -1;
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });

  const overdue = sortedProjects.filter((p) => p.is_overdue && p.status !== "completed");
  const upcoming = sortedProjects.filter(
    (p) => !p.is_overdue && p.status !== "completed" && p.days_left !== null && p.days_left <= 30
  );
  const future = sortedProjects.filter(
    (p) => !p.is_overdue && p.status !== "completed" && (p.days_left === null || p.days_left > 30)
  );
  const completed = sortedProjects.filter((p) => p.status === "completed");

  const renderTimelineGroup = (
    title: string,
    badgeColor: string,
    items: ProjectItem[],
    icon: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-2.5 last:mb-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${badgeColor}`}>
            <i className={`bi ${icon}`}></i>
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0">
            {title} ({items.length})
          </h4>
        </div>

        <div className="relative pl-3.5 sm:pl-5 border-l-2 border-slate-200 space-y-1.5 sm:space-y-2 ml-2.5">
          {items.map((proj) => {
            const isCritical = proj.is_overdue || proj.health === "critical";
            const projId = String(proj.id);
            const isExpanded = Boolean(expandedProjects[projId]);
            const subMilestones = milestonesCache[projId] || [];
            const isLoadingSub = Boolean(loadingMilestones[projId]);

            // Dynamically calculate project velocity and milestone completion counts from loaded sub-milestones
            const currentProgress = (() => {
              if (subMilestones.length > 0) {
                const totalDel = subMilestones.reduce((acc, m) => acc + (m.deliverables?.length || 0), 0);
                const completedDel = subMilestones.reduce(
                  (acc, m) => acc + (m.deliverables?.filter((d) => d.completed).length || 0),
                  0
                );
                if (totalDel > 0) {
                  return Math.round((completedDel / totalDel) * 100);
                }
                const completedMilestones = subMilestones.filter((m) => m.status === "completed").length;
                return Math.round((completedMilestones / subMilestones.length) * 100);
              }
              return proj.progress_percentage ?? 0;
            })();

            const milestoneCounts = (() => {
              if (subMilestones.length > 0) {
                return {
                  total: subMilestones.length,
                  completed: subMilestones.filter((m) => m.status === "completed").length,
                };
              }
              return {
                total: proj.total_milestones ?? 0,
                completed: proj.completed_milestones ?? 0,
              };
            })();

            return (
              <div
                key={proj.id}
                className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all px-3 py-2 sm:px-3.5 sm:py-2"
              >
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[21px] sm:-left-[27px] top-2.5 w-3 h-3 rounded-full border-2 border-white shadow-2xs ${
                    proj.status === "completed"
                      ? "bg-emerald-500"
                      : isCritical
                      ? "bg-rose-500 animate-ping"
                      : "bg-indigo-500"
                  }`}
                ></div>

                {/* Line 1: Title, Code, Dept & Target Date Pill */}
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {showCheckboxes && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelectProject?.(proj.id);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-all shrink-0 mr-1"
                        title={`Select initiative PRJ-${String(proj.id).padStart(4, "0")}`}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenDossierModal?.(proj)}
                      className="font-bold text-xs sm:text-sm text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer text-left"
                      title="Open 360° Inspection Dossier"
                    >
                      {proj.title}
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      PRJ-{String(proj.id).padStart(4, "0")}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      🏢 {proj.department_name || "General"}
                    </span>
                  </div>

                  {/* Target Date Pill */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {proj.target_date ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCritical
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : proj.days_left !== null && proj.days_left <= 7
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        <i className="bi bi-calendar-check mr-1 text-[9px]"></i>
                        Target:{" "}
                        {new Date(proj.target_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {proj.days_left !== null && (
                          <span className="ml-1">
                            ({proj.days_left < 0 ? `${Math.abs(proj.days_left)}d overdue` : `${proj.days_left}d left`})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">No Target Date</span>
                    )}
                  </div>
                </div>

                {/* Line 2: Supervisor & Description on Left, Velocity & Action Buttons on Right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-1.5 pt-1.5 border-t border-slate-100/90 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2">
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-4.5 h-4.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">
                        {proj.supervisor_name ? proj.supervisor_name.charAt(0) : "U"}
                      </div>
                      <span className="text-[10.5px] font-medium text-slate-700 truncate max-w-[120px]">
                        {proj.supervisor_name || "Unassigned"}
                      </span>
                    </div>

                    {proj.description && (
                      <>
                        <span className="text-slate-300 text-[10px] shrink-0">•</span>
                        <p className="text-[11px] text-slate-500 mb-0 truncate min-w-0" title={proj.description}>
                          {proj.description}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Right side actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Overall Task Velocity */}
                    <div className="flex items-center gap-1 mr-1">
                      <div className="w-14 sm:w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            currentProgress >= 80
                              ? "bg-emerald-500"
                              : currentProgress >= 40
                              ? "bg-indigo-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${currentProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">
                        {currentProgress}%
                      </span>
                    </div>

                    {/* Sub-Milestones Tray Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(proj)}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        isExpanded
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
                      }`}
                      title="Inspect Sub-Milestones and Deliverables"
                    >
                      <i className="bi bi-diagram-3-fill text-[9px]"></i>
                      <span>
                        Sub-Milestones
                        {milestoneCounts.total > 0 && (
                          <strong className="ml-1">
                            ({milestoneCounts.completed}/{milestoneCounts.total})
                          </strong>
                        )}
                      </span>
                      <i className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"} text-[9px]`}></i>
                    </button>

                    {/* 360° Dossier Trigger */}
                    {onOpenDossierModal && (
                      <button
                        type="button"
                        onClick={() => onOpenDossierModal(proj)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10.5px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                        title="Open 360° Inspection Dossier"
                      >
                        <i className="bi bi-file-earmark-text text-indigo-600 text-[9px]"></i>
                        <span className="hidden sm:inline">Dossier</span>
                      </button>
                    )}

                    {/* Manage Full Milestones Trigger */}
                    {onOpenMilestonesModal && (
                      <button
                        type="button"
                        onClick={() => onOpenMilestonesModal(proj)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Open Deliverable Checklist Tracker Modal"
                      >
                        <i className="bi bi-list-check"></i>
                        <span className="hidden sm:inline">Tracker</span>
                      </button>
                    )}

                    {onUpdateStatus && proj.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(proj.id, "completed")}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10.5px] font-semibold transition-colors cursor-pointer"
                        title="Mark Project Complete"
                      >
                        Done
                      </button>
                    )}

                    {onOpenEditModal && (
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(proj)}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10.5px] font-semibold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* EXPANDABLE NESTED SUB-MILESTONES & DELIVERABLES TRAY */}
                {isExpanded && (
                  <div className="mt-2 pt-1.5 border-t border-slate-100 bg-slate-50/70 rounded-lg p-2 sm:p-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <h5 className="text-[11.5px] font-bold text-slate-900 mb-0">
                          Nested Deliverable Milestones & Checklists
                        </h5>
                      </div>

                      {onOpenMilestonesModal && (
                        <button
                          type="button"
                          onClick={() => onOpenMilestonesModal(proj)}
                          className="text-[10.5px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer flex items-center gap-1"
                        >
                          <i className="bi bi-pencil-square"></i>
                          <span>Manage / Add Phases</span>
                        </button>
                      )}
                    </div>

                    {isLoadingSub ? (
                      <div className="py-2.5 text-center text-xs text-slate-400">
                        <i className="bi bi-arrow-clockwise animate-spin mr-1"></i>
                        Loading sub-milestones...
                      </div>
                    ) : subMilestones.length === 0 ? (
                      <div className="py-2 px-3 text-center bg-white rounded-lg border border-slate-200 text-xs text-slate-500">
                        <span>No sub-milestones yet for this initiative. </span>
                        {onOpenMilestonesModal && (
                          <button
                            type="button"
                            onClick={() => onOpenMilestonesModal(proj)}
                            className="text-indigo-600 font-bold underline ml-1 cursor-pointer"
                          >
                            + Add Phase 1 Milestone
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 sm:space-y-1.5">
                        {subMilestones.map((milestone, idx) => {
                          const isDone = milestone.status === "completed";
                          const totalD = milestone.deliverables?.length || 0;
                          const doneD = milestone.deliverables?.filter((d) => d.completed).length || 0;

                          return (
                            <div
                              key={milestone.id}
                              className={`p-1.5 sm:p-2 rounded-lg border bg-white transition-all ${
                                isDone
                                  ? "border-emerald-200/80 shadow-2xs"
                                  : "border-slate-200/90 shadow-2xs"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Quick Status Checkbox */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMilestoneStatus(proj.id, milestone)}
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                                      isDone
                                        ? "bg-emerald-500 border-emerald-600 text-white"
                                        : "bg-white border-slate-300 text-transparent hover:text-slate-300"
                                    }`}
                                    title={isDone ? "Mark Incomplete" : "Mark Complete"}
                                  >
                                    <i className="bi bi-check-lg text-[10px] font-bold"></i>
                                  </button>

                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    Phase {idx + 1}
                                  </span>

                                  <span
                                    className={`text-xs font-bold ${
                                      isDone ? "text-slate-500 line-through" : "text-slate-900"
                                    }`}
                                  >
                                    {milestone.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                                  {milestone.due_date && (
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                      Due: {new Date(milestone.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                    </span>
                                  )}
                                  {milestone.owner_name && (
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      👤 {milestone.owner_name}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Deliverables Checklist Chips */}
                              {totalD > 0 && (
                                <div className="pl-5 space-y-1 pt-1.5 border-t border-slate-100">
                                  <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span>Deliverables ({doneD}/{totalD})</span>
                                    <span className="text-indigo-600 font-bold">
                                      {Math.round((doneD / totalD) * 100)}%
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                    {milestone.deliverables.map((del) => (
                                      <label
                                        key={del.id}
                                        className={`flex items-center px-1.5 py-0.5 rounded text-[10px] border cursor-pointer select-none transition-colors ${
                                          del.completed
                                            ? "bg-emerald-50/70 border-emerald-200 text-emerald-800 line-through opacity-80"
                                            : "bg-slate-50 hover:bg-white border-slate-200 text-slate-700"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={del.completed}
                                          onChange={() =>
                                            handleToggleDeliverable(
                                              proj.id,
                                              milestone.id,
                                              del.id,
                                              del.completed
                                            )
                                          }
                                          className="w-2.5 h-2.5 rounded text-indigo-600 accent-indigo-600 shrink-0 cursor-pointer"
                                        />
                                        <span className="truncate" style={{ marginLeft: "6px" }}>
                                          {del.title}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 mb-2.5">
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-0.5 flex items-center gap-2">
            <i className="bi bi-calendar2-range-fill text-indigo-600"></i>
            <span>Enterprise Deliverables & Milestone Schedule</span>
          </h3>
          <p className="text-[11px] text-slate-500 mb-0">
            Timeline sequenced by target milestone dates, nested sub-milestone phases, and deliverable checklists.
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No projects available in schedule.
        </div>
      ) : (
        <>
          {renderTimelineGroup("🔴 Critical Overdue Milestones", "bg-rose-100 text-rose-700", overdue, "bi-exclamation-octagon-fill")}
          {renderTimelineGroup("🟡 Upcoming Milestones (Next 30 Days)", "bg-amber-100 text-amber-700", upcoming, "bi-clock-history")}
          {renderTimelineGroup("🔵 Scheduled Future Milestones", "bg-indigo-100 text-indigo-700", future, "bi-calendar-event")}
          {renderTimelineGroup("🟢 Successfully Delivered Initiatives", "bg-emerald-100 text-emerald-700", completed, "bi-check2-circle")}
        </>
      )}
    </div>
  );
};
