import React, { useState, useMemo, useRef, useEffect } from "react";
import { ProjectItem } from "../../../pages/admin/AdminProjects";
import { ProjectMilestoneItem } from "./ProjectMilestonesModal";
import api from "../../../api/axios";

export interface AdminProjectsGanttRoadmapProps {
  projects: ProjectItem[];
  onOpenEditModal?: (project: ProjectItem) => void;
  onUpdateStatus?: (projectId: number | string, newStatus: string) => void;
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
}

export type GanttTimescaleZoom = "month" | "quarter";

interface MonthBucket {
  year: number;
  month: number; // 0-indexed
  name: string;
  label: string;
  quarter: number; // 1-4
  startDate: Date;
  endDate: Date;
}

export const AdminProjectsGanttRoadmap: React.FC<AdminProjectsGanttRoadmapProps> = ({
  projects,
  onOpenEditModal,
  onUpdateStatus,
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
}) => {
  const [zoomMode, setZoomMode] = useState<GanttTimescaleZoom>("month");
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const isAllSelected = projects.length > 0 && projects.every((p) => selectedProjectIds.includes(p.id));
  const isSomeSelected = projects.some((p) => selectedProjectIds.includes(p.id)) && !isAllSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [hoveredProjectId, setHoveredProjectId] = useState<number | string | null>(null);
  const [milestonesCache, setMilestonesCache] = useState<{ [projectId: string]: ProjectMilestoneItem[] }>({});
  const [loadingMilestones, setLoadingMilestones] = useState<{ [projectId: string]: boolean }>({});
  const [hoveredMilestone, setHoveredMilestone] = useState<{
    milestone: ProjectMilestoneItem;
    project: ProjectItem;
    x: number;
    y: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Departments list for quick filtering within roadmap
  const departments = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.department_name) set.add(p.department_name);
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (filterDepartment === "all") return projects;
    return projects.filter((p) => p.department_name === filterDepartment);
  }, [projects, filterDepartment]);

  // Compute Timeline Horizon (Min and Max dates across projects)
  const timelineHorizon = useMemo(() => {
    const today = new Date();
    let minTime = today.getTime();
    let maxTime = today.getTime();

    if (projects.length === 0) {
      // Default to current quarter +- 2 months
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 5, 0);
      return { start, end, totalDurationMs: end.getTime() - start.getTime() };
    }

    projects.forEach((p) => {
      const pStart = p.start_date ? new Date(p.start_date).getTime() : new Date(p.created_at || today).getTime();
      const pTarget = p.target_date
        ? new Date(p.target_date).getTime()
        : pStart + 45 * 24 * 60 * 60 * 1000;

      if (pStart < minTime) minTime = pStart;
      if (pTarget > maxTime) maxTime = pTarget;
    });

    // Add padding: 1 month before min, 2 months after max
    const dMin = new Date(minTime);
    const dMax = new Date(maxTime);

    const start = new Date(dMin.getFullYear(), dMin.getMonth() - 1, 1);
    const end = new Date(dMax.getFullYear(), dMax.getMonth() + 3, 0);

    return {
      start,
      end,
      totalDurationMs: end.getTime() - start.getTime(),
    };
  }, [projects]);

  // Generate Month Buckets
  const monthBuckets = useMemo<MonthBucket[]>(() => {
    const buckets: MonthBucket[] = [];
    const cur = new Date(timelineHorizon.start);

    while (cur <= timelineHorizon.end) {
      const year = cur.getFullYear();
      const month = cur.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const quarter = Math.floor(month / 3) + 1;
      const name = startDate.toLocaleDateString("en-US", { month: "short" });
      const label = `${name} ${year}`;

      buckets.push({
        year,
        month,
        name,
        label,
        quarter,
        startDate,
        endDate,
      });

      // Advance month
      cur.setMonth(cur.getMonth() + 1);
    }
    return buckets;
  }, [timelineHorizon]);

  // Group Quarters
  const quarterGroups = useMemo(() => {
    const groups: { [key: string]: { label: string; count: number; year: number; quarter: number } } = {};
    monthBuckets.forEach((b) => {
      const key = `${b.year}-Q${b.quarter}`;
      if (!groups[key]) {
        groups[key] = {
          label: `Q${b.quarter} ${b.year}`,
          count: 0,
          year: b.year,
          quarter: b.quarter,
        };
      }
      groups[key].count += 1;
    });
    return Object.values(groups);
  }, [monthBuckets]);

  // Current date position percentage
  const todayPositionPercent = useMemo(() => {
    const now = new Date().getTime();
    const start = timelineHorizon.start.getTime();
    const total = timelineHorizon.totalDurationMs;
    if (total <= 0) return 0;
    const pct = ((now - start) / total) * 100;
    return Math.max(0, Math.min(100, pct));
  }, [timelineHorizon]);

  // Fetch milestones for all rendered projects in the background
  useEffect(() => {
    filteredProjects.forEach((p) => {
      const projId = String(p.id);
      if (!milestonesCache[projId] && !loadingMilestones[projId]) {
        setLoadingMilestones((prev) => ({ ...prev, [projId]: true }));
        api
          .get(`/api/admin/projects/${p.id}/milestones`)
          .then((res) => {
            if (res.data.status) {
              setMilestonesCache((prev) => ({
                ...prev,
                [projId]: res.data.milestones || [],
              }));
            }
          })
          .catch((err) => {
            console.warn(`Could not load milestones for project ${p.id}:`, err);
          })
          .finally(() => {
            setLoadingMilestones((prev) => ({ ...prev, [projId]: false }));
          });
      }
    });
  }, [filteredProjects]);

  // Compute bar coordinates and formatting
  const getProjectBarLayout = (p: ProjectItem) => {
    const today = new Date();
    const pStart = p.start_date
      ? new Date(p.start_date).getTime()
      : new Date(p.created_at || today).getTime();
    let pTarget = p.target_date
      ? new Date(p.target_date).getTime()
      : pStart + 45 * 24 * 60 * 60 * 1000;

    if (pTarget <= pStart) {
      pTarget = pStart + 7 * 24 * 60 * 60 * 1000;
    }

    const tStart = timelineHorizon.start.getTime();
    const tTotal = timelineHorizon.totalDurationMs;

    const leftPct = Math.max(0, ((pStart - tStart) / tTotal) * 100);
    const widthPct = Math.max(3.8, ((pTarget - pStart) / tTotal) * 100);

    return {
      leftPct,
      widthPct: Math.min(100 - leftPct, widthPct),
      pStart,
      pTarget,
      startDateStr: new Date(pStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      targetDateStr: new Date(pTarget).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
  };

  const getBarColorStyle = (p: ProjectItem) => {
    if (p.status === "completed") {
      return {
        bar: "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 border-emerald-300 text-white shadow-emerald-500/20",
        fill: "bg-emerald-300/35",
        badge: "bg-emerald-950/40 text-emerald-100 border-emerald-400/40",
      };
    }
    if (p.health === "critical" || p.is_overdue) {
      return {
        bar: "bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 border-rose-300 text-white shadow-rose-500/30",
        fill: "bg-rose-300/35",
        badge: "bg-rose-950/40 text-rose-100 border-rose-400/40",
      };
    }
    if (p.health === "at_risk") {
      return {
        bar: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 border-amber-300 text-white shadow-amber-500/20",
        fill: "bg-amber-300/35",
        badge: "bg-amber-950/40 text-amber-100 border-amber-400/40",
      };
    }
    if (p.status === "planning") {
      return {
        bar: "bg-gradient-to-r from-slate-600 via-slate-700 to-indigo-700 border-slate-300 text-white shadow-slate-500/20",
        fill: "bg-indigo-300/25",
        badge: "bg-slate-900/40 text-slate-100 border-slate-400/40",
      };
    }
    if (p.status === "on_hold") {
      return {
        bar: "bg-gradient-to-r from-slate-500 to-zinc-600 border-slate-300 text-white opacity-85",
        fill: "bg-white/15",
        badge: "bg-black/40 text-slate-200 border-white/20",
      };
    }
    // Default active healthy
    return {
      bar: "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 border-blue-300 text-white shadow-indigo-500/25",
      fill: "bg-white/25",
      badge: "bg-indigo-950/40 text-indigo-100 border-indigo-300/40",
    };
  };

  // Center scroll on "Today" marker on initial load
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const targetScroll = (scrollWidth * (todayPositionPercent / 100)) - (container.clientWidth / 2);
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: "smooth",
      });
    }
  }, [zoomMode, todayPositionPercent]);

  // Column width styling based on zoom
  const monthColumnWidthPx = zoomMode === "month" ? 140 : 90;
  const totalTimelineWidthPx = monthBuckets.length * monthColumnWidthPx;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden select-none animate-in fade-in duration-200">
      {/* 1. Gantt Control & Telemetry Bar */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-2.5 border-b border-indigo-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <i className="bi bi-bar-chart-steps text-xs"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white mb-0 leading-tight">Strategic Gantt Roadmap</h3>
              <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {filteredProjects.length} Initiatives
              </span>
            </div>
            <p className="text-[10.5px] text-slate-300/80 mb-0 leading-tight mt-0.5">
              Cross-initiative milestone delivery scheduler with real-time velocity tracking.
            </p>
          </div>
        </div>

        {/* Action Controls: Zoom Switcher, Today Button, Department Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="text-xs bg-white/10 text-white border border-white/20 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Pan Navigation */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/15">
            <button
              type="button"
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ left: -monthColumnWidthPx * 2, behavior: "smooth" });
                }
              }}
              className="w-7 h-7 flex items-center justify-center rounded text-white hover:bg-white/15 transition-colors cursor-pointer text-xs"
              title="Pan Left (Earlier Months)"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              type="button"
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollBy({ left: monthColumnWidthPx * 2, behavior: "smooth" });
                }
              }}
              className="w-7 h-7 flex items-center justify-center rounded text-white hover:bg-white/15 transition-colors cursor-pointer text-xs"
              title="Pan Right (Future Months)"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          {/* Jump to Today */}
          <button
            type="button"
            onClick={() => {
              if (scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const scrollWidth = container.scrollWidth;
                const targetScroll = (scrollWidth * (todayPositionPercent / 100)) - (container.clientWidth / 2);
                container.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
              }
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-indigo-200 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Scroll view to current date"
          >
            <i className="bi bi-geo-alt-fill text-rose-400 text-xs"></i>
            <span>Today</span>
          </button>

          {/* Timescale Zoom Segmented Control */}
          <div className="flex items-center bg-black/30 rounded-lg p-0.5 border border-white/15">
            <button
              type="button"
              onClick={() => setZoomMode("month")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                zoomMode === "month"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <i className="bi bi-calendar-month me-1"></i>
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setZoomMode("quarter")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                zoomMode === "quarter"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <i className="bi bi-calendar3 me-1"></i>
              Quarterly
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="px-4 py-1.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3 flex-wrap text-[11px] text-slate-600">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[9.5px]">
            Roadmap Legend:
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-blue-600 to-indigo-600"></span>
            <span>Healthy / Active</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-amber-500 to-orange-500"></span>
            <span>At Risk</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-rose-600 to-red-600"></span>
            <span>Critical / Overdue</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-emerald-600 to-teal-600"></span>
            <span>Completed</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rotate-45 bg-cyan-300 border border-white"></span>
            <span>Sub-Milestone Flag</span>
          </span>
        </div>

        <div className="text-[10px] text-slate-400">
          Tip: Click any bar to open 360° Dossier, or hover diamond markers for deliverable checklist status.
        </div>
      </div>

      {/* 2. Main Dual-Pane Gantt Workspace */}
      <div className="flex overflow-hidden relative">
        {/* Left Frozen Column: Project Index & Metadata */}
        <div className="w-[280px] sm:w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/70 z-20 flex flex-col">
          {/* Header Row */}
          <div className="h-[73px] px-3.5 border-b border-slate-200 bg-slate-100/95 flex flex-col justify-center">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                {showCheckboxes && (
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
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-all shrink-0"
                    title={isAllSelected ? "Deselect all visible initiatives" : "Select all visible initiatives"}
                  />
                )}
                <span className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  <i className="bi bi-kanban text-indigo-600 text-xs"></i>
                  Strategic Initiatives
                </span>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                {filteredProjects.length}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5 ml-6">
              Department • Lead Supervisor • Velocity %
            </span>
          </div>

          {/* Project List Items */}
          <div className="divide-y divide-slate-100 flex-1">
            {filteredProjects.map((p) => {
              const isHovered = hoveredProjectId === p.id;
              const isSelected = selectedProjectIds.includes(p.id);

              return (
                <div
                  key={`gantt-proj-meta-${p.id}`}
                  onMouseEnter={() => setHoveredProjectId(p.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                  className={`h-[68px] px-3.5 py-2 flex items-center justify-between gap-2 border-b border-slate-200/90 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50/85 border-l-4 border-l-indigo-600"
                      : isHovered
                      ? "bg-indigo-50/50"
                      : "bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => onOpenDossierModal && onOpenDossierModal(p)}
                >
                  {/* Multi-Select Checkbox */}
                  {showCheckboxes && (
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleSelectProject?.(p.id);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600 transition-all"
                        title={`Select PRJ-${String(p.id).padStart(4, "0")}`}
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        PRJ-{String(p.id).padStart(4, "0")}
                      </span>
                      {p.is_blocked && p.blocker_status && p.blocker_status !== "none" && (
                        <span
                          onClick={() => onOpenBlockerModal?.(p)}
                          className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-rose-600 text-white cursor-pointer hover:bg-rose-700 animate-pulse shadow-2xs"
                          title={`Executive Blocker: ${p.blocker_status}. Click to manage.`}
                        >
                          🚫 Blocked
                        </span>
                      )}
                      {p.department_name && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 truncate max-w-[85px]">
                          {p.department_name}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[11.5px] font-bold text-slate-900 truncate leading-snug"
                      style={{ fontSize: "11.5px" }}
                      title={p.title}
                    >
                      {p.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span>{p.lead_supervisor_name || "Unassigned"}</span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-700">
                        {p.completed_tasks}/{p.total_tasks} ({p.progress_percentage || 0}%)
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Triggers */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {onQuickAddTask && (
                      <button
                        type="button"
                        onClick={() => onQuickAddTask(p)}
                        className="w-6 h-6 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs"
                        title="Quick Add Task"
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    )}
                    {onOpenBudgetHUD && (
                      <button
                        type="button"
                        onClick={() => onOpenBudgetHUD(p)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs ${
                          p.is_critical_burn
                            ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 animate-pulse"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                        title={`Financial HUD: $${Number(p.budget || 0).toLocaleString()} • ${p.budget_burn_pct || 0}% Burn`}
                      >
                        <i className="bi bi-cash-stack"></i>
                      </button>
                    )}
                    {onOpenTasksTray && (
                      <button
                        type="button"
                        onClick={() => onOpenTasksTray(p)}
                        className="w-6 h-6 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs"
                        title="View Project Tasks"
                      >
                        <i className="bi bi-list-task"></i>
                      </button>
                    )}
                    {onOpenBlockerModal && (
                      <button
                        type="button"
                        onClick={() => onOpenBlockerModal(p)}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs ${
                          p.is_blocked
                            ? "bg-rose-600 text-white border-rose-700 animate-pulse"
                            : "bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border-slate-200"
                        }`}
                        title={p.is_blocked ? `Blocked: ${p.blocker_status}. Click to manage.` : "Flag Executive Blocker"}
                      >
                        <i className="bi bi-shield-slash-fill"></i>
                      </button>
                    )}
                    {onOpenAuditDrawer && (
                      <button
                        type="button"
                        onClick={() => onOpenAuditDrawer(p)}
                        className="w-6 h-6 rounded-md bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-2xs"
                        title="View Project Audit History & Change Ledger"
                      >
                        <i className="bi bi-clock-history"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Scrollable Column: Timeline Canvas */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto relative min-h-[300px]"
          style={{ scrollBehavior: "smooth" }}
        >
          <div style={{ width: `${totalTimelineWidthPx}px` }} className="relative">
            {/* Timeline Header Row (Quarters & Months) */}
            <div className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 shadow-2xs">
              {/* Row 1: Quarters */}
              <div className="flex border-b border-slate-200">
                {quarterGroups.map((q) => (
                  <div
                    key={`q-hdr-${q.year}-${q.quarter}`}
                    style={{ width: `${q.count * monthColumnWidthPx}px` }}
                    className="py-1 px-3 text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100/90 border-r border-slate-200 truncate"
                  >
                    {q.label}
                  </div>
                ))}
              </div>

              {/* Row 2: Months */}
              <div className="flex">
                {monthBuckets.map((b) => {
                  const isCurrentMonth =
                    new Date().getFullYear() === b.year && new Date().getMonth() === b.month;
                  return (
                    <div
                      key={`m-hdr-${b.year}-${b.month}`}
                      style={{ width: `${monthColumnWidthPx}px` }}
                      className={`py-1.5 px-2 text-center text-xs font-semibold border-r border-slate-200/80 truncate ${
                        isCurrentMonth
                          ? "bg-indigo-50/80 text-indigo-700 font-bold"
                          : "text-slate-600"
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-1">
                        {String(b.year).slice(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vertical Grid Columns Background */}
            <div className="absolute inset-0 top-[73px] pointer-events-none flex">
              {monthBuckets.map((b) => (
                <div
                  key={`m-grid-${b.year}-${b.month}`}
                  style={{ width: `${monthColumnWidthPx}px` }}
                  className="h-full border-r border-slate-100/80"
                ></div>
              ))}
            </div>

            {/* Glowing Today Vertical Marker Line */}
            <div
              className="absolute top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center"
              style={{ left: `${todayPositionPercent}%` }}
            >
              <div className="sticky top-0 z-20 -translate-x-1/2 mt-0.5 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold shadow-sm whitespace-nowrap">
                TODAY
              </div>
              <div className="w-[2px] h-full bg-rose-500 shadow-sm shadow-rose-500/50"></div>
            </div>

            {/* Project Tracks with Horizontal Timeline Bars */}
            <div className="divide-y divide-slate-100 relative">
              {filteredProjects.map((p) => {
                const isHovered = hoveredProjectId === p.id;
                const layout = getProjectBarLayout(p);
                const colors = getBarColorStyle(p);
                const pct = Math.min(100, Math.max(0, p.progress_percentage || 0));

                return (
                  <div
                    key={`gantt-track-${p.id}`}
                    onMouseEnter={() => setHoveredProjectId(p.id)}
                    onMouseLeave={() => setHoveredProjectId(null)}
                    className={`h-[68px] relative flex items-center px-1 border-b border-slate-200/90 transition-colors ${
                      isHovered ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    {/* The Visual Gantt Bar */}
                    <div
                      onClick={() => onOpenDossierModal && onOpenDossierModal(p)}
                      style={{
                        left: `${layout.leftPct}%`,
                        width: `${layout.widthPct}%`,
                      }}
                      className={`absolute h-[38px] rounded-xl border shadow-sm transition-all cursor-pointer flex items-center overflow-hidden z-10 group hover:shadow-md hover:scale-[1.008] ${
                        colors.bar
                      } ${isHovered ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
                      title={`${p.title} (${layout.startDateStr} → ${layout.targetDateStr}) • ${pct}% Complete`}
                    >
                      {/* Internal Velocity Fill Track */}
                      <div
                        style={{ width: `${pct}%` }}
                        className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-300 border-r border-white/40 ${colors.fill}`}
                      ></div>

                      {/* Bar Content */}
                      <div className="relative z-10 px-3 w-full flex items-center justify-between gap-2 text-white min-w-0">
                        {/* Left: Code & Title */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-mono font-black opacity-95 shrink-0 bg-black/20 px-1 py-0.2 rounded border border-white/20">
                            PRJ-{String(p.id).padStart(4, "0")}
                          </span>
                          <span className="text-xs font-bold truncate max-w-[200px]">
                            {p.title}
                          </span>
                        </div>

                        {/* Right: Progress & Health Indicator */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {p.is_blocked && p.blocker_status && p.blocker_status !== "none" && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-rose-700/90 text-white px-1.5 py-0.5 rounded shadow-xs border border-white/40 animate-pulse">
                              <i className="bi bi-shield-slash-fill text-[8px]"></i>
                              <span>BLOCKED</span>
                            </span>
                          )}

                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border backdrop-blur-xs ${colors.badge}`}>
                            {pct}%
                          </span>

                          {p.days_left !== null && p.days_left !== undefined && p.status !== "completed" && (
                            <span className="hidden sm:inline-block text-[9.5px] font-medium opacity-90 bg-black/25 px-1.5 py-0.2 rounded border border-white/10">
                              {p.days_left < 0
                                ? `${Math.abs(p.days_left)}d overdue`
                                : `${p.days_left}d left`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Milestone Diamond Markers for this Project */}
                    {(milestonesCache[String(p.id)] || []).map((m, mIdx) => {
                      if (!m.due_date) return null;
                      const mTime = new Date(m.due_date).getTime();
                      const tStart = timelineHorizon.start.getTime();
                      const tTotal = timelineHorizon.totalDurationMs;
                      if (tTotal <= 0) return null;
                      const mLeftPct = Math.max(0, Math.min(100, ((mTime - tStart) / tTotal) * 100));

                      const isCompleted = m.status === "completed";
                      const isDelayed = m.status === "delayed";
                      const isInProgress = m.status === "in_progress";

                      return (
                        <div
                          key={`ms-marker-${p.id}-${m.id || mIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenMilestonesModal) onOpenMilestonesModal(p);
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredMilestone({
                              milestone: m,
                              project: p,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }}
                          onMouseLeave={() => setHoveredMilestone(null)}
                          style={{ left: `${mLeftPct}%` }}
                          className="absolute top-1 -translate-x-1/2 z-20 cursor-pointer flex flex-col items-center group/ms transition-transform hover:scale-125"
                          title={`Milestone ${mIdx + 1}: ${m.title} (Due: ${new Date(m.due_date).toLocaleDateString()})`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rotate-45 rounded-[2.5px] border shadow-sm flex items-center justify-center transition-all ${
                              isCompleted
                                ? "bg-emerald-400 border-white text-emerald-950"
                                : isDelayed
                                ? "bg-rose-500 border-white text-white animate-pulse"
                                : isInProgress
                                ? "bg-cyan-300 border-white text-cyan-950 shadow-cyan-400/50"
                                : "bg-white border-slate-400 text-slate-800"
                            }`}
                          >
                            <div className="-rotate-45 text-[7.5px] font-bold leading-none select-none">
                              {isCompleted ? "✓" : isDelayed ? "!" : mIdx + 1}
                            </div>
                          </div>
                          {/* Milestone Guide Pin to Gantt Bar */}
                          <div
                            className={`w-[1.5px] h-3.5 mt-0.5 rounded-full ${
                              isCompleted
                                ? "bg-emerald-400/80"
                                : isDelayed
                                ? "bg-rose-400/80"
                                : isInProgress
                                ? "bg-cyan-400/80"
                                : "bg-slate-300"
                            }`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Milestone Tooltip Card */}
      {hoveredMilestone && (
        <div
          style={{
            position: "fixed",
            left: `${Math.min(window.innerWidth - 260, Math.max(10, hoveredMilestone.x - 120))}px`,
            top: `${Math.max(10, hoveredMilestone.y - 140)}px`,
          }}
          className="z-50 w-60 rounded-xl bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 shadow-2xl p-3 text-white pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between gap-1 mb-1 border-b border-white/10 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Deliverable Milestone
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold capitalize ${
                hoveredMilestone.milestone.status === "completed"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : hoveredMilestone.milestone.status === "delayed"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              {hoveredMilestone.milestone.status.replace("_", " ")}
            </span>
          </div>

          <h5 className="text-xs font-bold text-white mb-1 leading-snug">
            {hoveredMilestone.milestone.title}
          </h5>

          <div className="space-y-0.5 text-[10px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Date:</span>
              <span className="font-semibold text-slate-200">
                {new Date(hoveredMilestone.milestone.due_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {hoveredMilestone.milestone.owner_name && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Owner:</span>
                <span className="font-semibold text-slate-200">
                  {hoveredMilestone.milestone.owner_name}
                </span>
              </div>
            )}
            {hoveredMilestone.milestone.deliverables && hoveredMilestone.milestone.deliverables.length > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-emerald-400">
                <span>Deliverables:</span>
                <span className="font-bold">
                  {hoveredMilestone.milestone.deliverables.filter((d) => d.completed).length} /{" "}
                  {hoveredMilestone.milestone.deliverables.length} Done
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
