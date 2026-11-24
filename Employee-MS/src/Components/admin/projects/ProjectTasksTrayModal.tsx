import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

export interface ProjectTaskItem {
  id: number | string;
  project_id: number | string;
  title: string;
  description?: string;
  assigned_by?: number | string;
  assigned_to?: number | string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "under_review" | "completed";
  due_date?: string;
  created_at: string;
  assignee_name?: string;
  assignee_email?: string;
  assignee_role?: string;
  assignee_image_url?: string;
  assignee_squad_role?: string;
  assigner_name?: string;
}

interface ProjectTasksTrayModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: number | string;
    title: string;
    department_name?: string;
    priority?: string;
    status?: string;
    target_date?: string;
    supervisor_name?: string;
    supervisor_email?: string;
  } | null;
  onOpenQuickAddTask?: (project: any) => void;
  onTasksChanged?: () => void;
}

export const ProjectTasksTrayModal: React.FC<ProjectTasksTrayModalProps> = ({
  isOpen,
  onClose,
  project,
  onOpenQuickAddTask,
  onTasksChanged,
}) => {
  const [tasks, setTasks] = useState<ProjectTaskItem[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    overdue: 0,
    velocity_pct: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [togglingId, setTogglingId] = useState<number | string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [msg, setMsg] = useState<{ type: string; text: string }>({ type: "", text: "" });

  const fetchTasks = async () => {
    if (!project?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/projects/${project.id}/tasks`);
      if (res.data.status) {
        setTasks(res.data.tasks || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch project tasks:", err);
      setMsg({ type: "danger", text: "Failed to load project tasks" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project?.id) {
      fetchTasks();
      setFilterStatus("all");
      setSearchTerm("");
      setMsg({ type: "", text: "" });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, project?.id]);

  if (!isOpen || !project) return null;

  const handleToggleStatus = async (task: ProjectTaskItem) => {
    const nextStatus =
      task.status === "completed"
        ? "pending"
        : task.status === "pending"
        ? "in_progress"
        : "completed";

    // Optimistic UI update for tasks and telemetry
    const previousTasks = [...tasks];
    const previousMetrics = { ...metrics };
    const updatedTasks = tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t));
    setTasks(updatedTasks);

    const completed = updatedTasks.filter((t) => t.status === "completed").length;
    const in_progress = updatedTasks.filter((t) => t.status === "in_progress").length;
    const pending = updatedTasks.filter((t) => t.status === "pending").length;
    const velocity_pct = updatedTasks.length > 0 ? Math.round((completed / updatedTasks.length) * 100) : 0;
    setMetrics({
      ...metrics,
      completed,
      in_progress,
      pending,
      velocity_pct,
    });

    try {
      setTogglingId(task.id);
      const res = await api.put(`/api/admin/projects/tasks/${task.id}/status`, {
        status: nextStatus,
      });
      if (res.data.status) {
        await fetchTasks();
        if (onTasksChanged) onTasksChanged();
      }
    } catch (err: any) {
      setTasks(previousTasks);
      setMetrics(previousMetrics);
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to update task status",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteTask = async (task: ProjectTaskItem) => {
    if (!window.confirm(`Delete task "${task.title}" permanently?`)) return;

    try {
      setDeletingId(task.id);
      const res = await api.delete(`/api/admin/projects/tasks/${task.id}`);
      if (res.data.status) {
        setMsg({ type: "success", text: "Task deleted successfully" });
        await fetchTasks();
        if (onTasksChanged) onTasksChanged();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to delete task",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filter tasks
  const nowStr = new Date().toISOString().split("T")[0];
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === "pending" && t.status !== "pending") return false;
    if (filterStatus === "in_progress" && t.status !== "in_progress") return false;
    if (filterStatus === "completed" && t.status !== "completed") return false;
    if (
      filterStatus === "overdue" &&
      (t.status === "completed" || !t.due_date || t.due_date >= nowStr)
    )
      return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchAssignee = t.assignee_name?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      return matchTitle || matchAssignee || matchDesc;
    }
    return true;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "urgent":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "high":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="w-full max-w-[880px] max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Wave Background matching Squad Roster & Dossier Modals */}
          <div className="relative px-3.5 sm:px-4 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
            {/* Top-Right Fluid Pastel Wave Background */}
            <div className="absolute top-0 right-0 w-[360px] sm:w-[460px] h-full pointer-events-none overflow-hidden z-0">
              <svg
                viewBox="0 0 500 74"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <mask id="tasksModalWaveFadeMask">
                    <linearGradient id="tasksModalWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="18%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#tasksModalWaveFadeGrad)" />
                  </mask>

                  <linearGradient id="tasksModalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                  </linearGradient>

                  <linearGradient id="tasksModalWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="tasksModalWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <g mask="url(#tasksModalWaveFadeMask)">
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#tasksModalWaveGrad1)"
                  />
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#tasksModalWaveGrad2)"
                  />
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#tasksModalWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left: Squircle Tasks Icon + Project Information */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-indigo-500/20 shrink-0 border border-white/20">
                <i className="bi bi-list-check text-amber-300"></i>
              </div>

              <div className="min-w-0">
                {/* Project Title + PRJ-ID Pill */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[13.5px] sm:text-[14.5px] text-slate-900 mb-0 tracking-tight leading-tight truncate">
                    {project.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                    PRJ-{String(project.id).padStart(4, "0")}
                  </span>
                </div>

                {/* Subtitle Line with Department & Target Date */}
                <div className="text-[10.5px] sm:text-[11px] text-slate-400 mb-1 font-normal leading-tight truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                  {project.department_name && (
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <i className="bi bi-building text-[9.5px] text-indigo-500"></i>
                      <span>{project.department_name}</span>
                    </span>
                  )}
                  {project.supervisor_name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <i className="bi bi-person text-[9.5px] text-emerald-500"></i>
                        <span>Lead: {project.supervisor_name}</span>
                      </span>
                    </>
                  )}
                  {project.target_date && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <i className="bi bi-calendar-event text-[9.5px] text-amber-500"></i>
                        <span>Target: {project.target_date}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Meta Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold capitalize bg-emerald-50/80 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                    <span>{project.status || "Active"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold bg-indigo-50/80 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                    <i className="bi bi-check2-square text-[9px] text-indigo-600"></i>
                    <span>In-View Tasks Breakdown</span>
                  </div>
                  {project.priority && (
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold uppercase shadow-2xs border ${
                        project.priority === "urgent" || project.priority === "critical"
                          ? "bg-rose-50/80 text-rose-700 border-rose-200"
                          : project.priority === "high"
                          ? "bg-amber-50/80 text-amber-700 border-amber-200"
                          : "bg-indigo-50/60 text-indigo-700 border-indigo-100"
                      }`}
                    >
                      <span>{project.priority}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Add Task + Close Button */}
            <div className="flex items-center gap-2 shrink-0 relative z-10">
              {onOpenQuickAddTask && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickAddTask(project);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <i className="bi bi-plus-lg text-xs"></i>
                  <span>Quick Add Task</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs shrink-0"
                title="Close Tasks Breakdown"
                aria-label="Close"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>
          </div>

          {/* Executive Telemetry Bar / HUD Grid matching Squad Roster & Dossier Modals */}
          <div className="bg-slate-50/60 border-b border-slate-200/80 px-3.5 sm:px-4 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
            {/* 1. Task Velocity */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Task Velocity</span>
                <span className="font-bold text-slate-800 text-[11px]">{metrics.velocity_pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1 border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.velocity_pct}%` }}
                ></div>
              </div>
              <div className="text-[9.5px] text-slate-400">
                {metrics.completed} of {metrics.total} delivered
              </div>
            </div>

            {/* 2. Completed Milestones */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Completed Tasks</span>
                <span className="font-bold text-emerald-700 text-[11px]">{metrics.completed} Done</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-200/80 flex items-center gap-1 shadow-2xs">
                  <i className="bi bi-check-circle-fill text-[8.5px]"></i>
                  <span>{metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}% Closed</span>
                </span>
              </div>
            </div>

            {/* 3. Active Workload */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span>Active Workload</span>
                <i className="bi bi-play-circle text-blue-500 text-xs"></i>
              </div>
              <div className="text-[11.5px] font-bold text-slate-800">
                {metrics.in_progress} In Progress
              </div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">
                {metrics.pending} pending in backlog
              </div>
            </div>

            {/* 4. Schedule / Overdue Telemetry */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span>Deadline Health</span>
                <i className="bi bi-clock-history text-slate-400 text-xs"></i>
              </div>
              <div className="text-[11.5px] font-bold text-slate-800 truncate">
                {metrics.overdue > 0 ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-octagon-fill text-[10px]"></i>
                    <span>{metrics.overdue} Overdue</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <i className="bi bi-shield-check text-[10px]"></i>
                    <span>On Schedule</span>
                  </span>
                )}
              </div>
              <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                {project.target_date ? `Target: ${project.target_date}` : "Active schedule monitoring"}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-white">
            {/* Status filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "All Tasks" },
                { id: "pending", label: "Pending" },
                { id: "in_progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
                { id: "overdue", label: "Overdue" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    filterStatus === f.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative min-w-[200px]">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks or assignees..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Alert Notifications */}
          {msg.text && (
            <div
              className={`mx-6 mt-3 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <span>{msg.text}</span>
              <button
                type="button"
                onClick={() => setMsg({ type: "", text: "" })}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>
          )}

          {/* Task List (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-2.5">
            {loading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-xs">Loading initiative tasks...</span>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <i className="bi bi-check2-circle text-3xl text-slate-300 mb-2 block"></i>
                <p className="text-xs font-bold text-slate-700 mb-1">
                  {searchTerm || filterStatus !== "all"
                    ? "No tasks match your criteria"
                    : "No Tasks Dispatched Yet"}
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search query or status filter."
                    : "Start breaking down this initiative into discrete tasks."}
                </p>
                {onOpenQuickAddTask && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQuickAddTask(project);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <i className="bi bi-plus-lg"></i>
                    <span>Add First Task</span>
                  </button>
                )}
              </div>
            ) : (
              filteredTasks.map((t) => {
                const isOverdue =
                  t.status !== "completed" && t.due_date && t.due_date < nowStr;

                return (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      t.status === "completed"
                        ? "bg-slate-50/70 border-slate-200/60 opacity-80"
                        : "bg-white border-slate-200/90 shadow-2xs hover:shadow-xs"
                    }`}
                  >
                    {/* Status Checkbox / Action */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t)}
                        disabled={togglingId === t.id}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 ${
                          t.status === "completed"
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                            : t.status === "in_progress"
                            ? "bg-blue-50 border-blue-400 text-blue-600 hover:bg-blue-100"
                            : "bg-white border-slate-300 hover:border-slate-400"
                        }`}
                        title={
                          t.status === "completed"
                            ? "Mark as Pending"
                            : t.status === "pending"
                            ? "Mark as In Progress"
                            : "Mark as Completed"
                        }
                      >
                        {togglingId === t.id ? (
                          <div className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : t.status === "completed" ? (
                          <i className="bi bi-check-lg text-xs"></i>
                        ) : t.status === "in_progress" ? (
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        ) : null}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-xs font-semibold text-slate-900 ${
                              t.status === "completed" ? "line-through text-slate-400" : ""
                            }`}
                          >
                            {t.title}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9px] font-bold border capitalize ${getPriorityBadge(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9px] font-semibold border ${
                              t.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : t.status === "in_progress"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {t.status === "in_progress" ? "In Progress" : t.status}
                          </span>
                        </div>

                        {t.description && (
                          <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">
                            {t.description}
                          </p>
                        )}

                        {/* Meta Footer */}
                        <div className="flex items-center gap-4 text-[10px] text-slate-500 flex-wrap">
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5">
                            {t.assignee_image_url ? (
                              <img
                                src={`http://localhost:5000/images/${t.assignee_image_url}`}
                                alt={t.assignee_name}
                                className="w-4 h-4 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[8px] flex items-center justify-center">
                                {t.assignee_name ? t.assignee_name.charAt(0) : "U"}
                              </div>
                            )}
                            <span className="font-medium text-slate-700">
                              {t.assignee_name || "Unassigned"}
                            </span>
                            {t.assignee_squad_role && (
                              <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                                {t.assignee_squad_role}
                              </span>
                            )}
                          </div>

                          {/* Due Date */}
                          {t.due_date && (
                            <div
                              className={`flex items-center gap-1 ${
                                isOverdue ? "text-rose-600 font-bold" : "text-slate-500"
                              }`}
                            >
                              <i className="bi bi-calendar-event"></i>
                              <span>Due: {t.due_date}</span>
                              {isOverdue && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200 text-[9px] uppercase font-bold">
                                  Overdue
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t)}
                        disabled={deletingId === t.id}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer"
                        title="Delete Task"
                      >
                        {deletingId === t.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <i className="bi bi-trash3 text-xs"></i>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500">
              Showing <strong>{filteredTasks.length}</strong> of{" "}
              <strong>{tasks.length}</strong> tasks
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Close Tray
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
