import React, { useState, useEffect } from "react";
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
    target_date?: string;
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
      return () => window.removeEventListener("keydown", handleKeyDown);
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

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRJ-{String(project.id).padStart(4, "0")}
              </span>
              {project.department_name && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/90 border border-white/15">
                  🏢 {project.department_name}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                📋 In-View Tasks Breakdown
              </span>
            </div>
            <h3 className="text-base font-bold text-white truncate mb-0">
              {project.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenQuickAddTask && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQuickAddTask(project);
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Quick Add Task</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Close"
            >
              <i className="bi bi-x-lg text-sm"></i>
            </button>
          </div>
        </div>

        {/* Telemetry Velocity Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Velocity:
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                {metrics.velocity_pct}% Complete
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>
                Total: <strong>{metrics.total}</strong>
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">
                Done: {metrics.completed}
              </span>
              <span>•</span>
              <span className="text-blue-700 font-semibold">
                Active: {metrics.in_progress}
              </span>
              {metrics.overdue > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <i className="bi bi-exclamation-circle-fill"></i>
                    {metrics.overdue} Overdue
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${metrics.velocity_pct}%` }}
            ></div>
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
  );
};
