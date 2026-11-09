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
}) => {
  const [zoomMode, setZoomMode] = useState<GanttTimescaleZoom>("month");
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
      <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <i className="bi bi-bar-chart-steps text-sm"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white mb-0">Strategic Gantt Roadmap</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                {filteredProjects.length} Initiatives
              </span>
            </div>
            <p className="text-[11px] text-slate-300/80 mb-0">
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

      {/* 2. Main Dual-Pane Gantt Workspace */}
      <div className="flex overflow-hidden relative">
        {/* Left Frozen Column: Project Index & Metadata */}
        <div className="w-[280px] sm:w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/70 z-20 flex flex-col">
          {/* Header Row */}
          <div className="h-[73px] px-4 border-b border-slate-200 bg-slate-100/90 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Strategic Initiatives ({filteredProjects.length})
            </span>
            <span className="text-[10px] text-slate-500">
              Department • Supervisor • Velocity %
            </span>
          </div>

          {/* Project List Items */}
          <div className="divide-y divide-slate-100 flex-1">
            {filteredProjects.map((p) => {
              const isHovered = hoveredProjectId === p.id;
              return (
                <div
                  key={`gantt-proj-meta-${p.id}`}
                  onMouseEnter={() => setHoveredProjectId(p.id)}
                  onMouseLeave={() => setHoveredProjectId(null)}
                  className={`h-[68px] px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                    isHovered ? "bg-indigo-50/70" : "bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => onOpenDossierModal && onOpenDossierModal(p)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        PRJ-{String(p.id).padStart(4, "0")}
                      </span>
                      {p.department_name && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 truncate max-w-[90px]">
                          {p.department_name}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate mb-0" title={p.title}>
                      {p.title}
                    </h4>
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

            {/* Project Tracks Placeholder (Will be filled in Commit 2) */}
            <div className="divide-y divide-slate-100 relative">
              {filteredProjects.map((p) => {
                const isHovered = hoveredProjectId === p.id;
                return (
                  <div
                    key={`gantt-track-${p.id}`}
                    onMouseEnter={() => setHoveredProjectId(p.id)}
                    onMouseLeave={() => setHoveredProjectId(null)}
                    className={`h-[68px] relative flex items-center px-2 transition-colors ${
                      isHovered ? "bg-indigo-50/30" : ""
                    }`}
                  >
                    {/* Placeholder for bar */}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
