import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

export interface SquadMember {
  id: number | string;
  name: string;
  email: string;
  role: string;
  image_url?: string;
  department_name?: string;
  squad_role: string;
  assigned_tasks_count: number;
  completed_tasks_count: number;
}

export interface DossierTask {
  id: number | string;
  title: string;
  description?: string;
  assigned_to?: number | string;
  assignee_name?: string;
  assignee_email?: string;
  assignee_image?: string;
  assignee_role?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed";
  due_date?: string;
  created_at: string;
}

export interface DeliverableItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface DossierMilestone {
  id: number | string;
  project_id: number | string;
  title: string;
  description?: string;
  due_date?: string;
  owner_id?: number | string;
  owner_name?: string;
  owner_email?: string;
  owner_image?: string;
  status: "pending" | "in_progress" | "completed";
  order_index: number;
  deliverables: DeliverableItem[];
  total_deliverables: number;
  completed_deliverables: number;
  progress_percentage: number;
}

export interface DossierAuditLog {
  id: number | string;
  user_id: number | string;
  action_type: string;
  field_name?: string;
  old_value?: string | null;
  new_value?: string | null;
  details?: string;
  performed_by?: string;
  created_at: string;
  actor_name?: string;
  actor_email?: string;
  actor_role?: string;
}

export interface DossierTelemetry {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  task_velocity: number;
  total_milestones: number;
  completed_milestones: number;
  milestones_progress: number;
  budget_allocated: number;
  budget_spent: number;
  days_left: number | null;
  is_overdue: boolean;
  health: "healthy" | "at_risk" | "critical" | "completed";
}

export interface DossierPayload {
  project: {
    id: number | string;
    title: string;
    description: string;
    department_id: number | string;
    department_name?: string;
    department_code?: string;
    lead_supervisor_id?: number | string;
    supervisor_name?: string;
    supervisor_email?: string;
    supervisor_image?: string;
    creator_name?: string;
    status: "planning" | "active" | "on_hold" | "completed" | "archived";
    priority: "low" | "medium" | "high" | "critical";
    budget?: number;
    start_date?: string;
    target_date?: string;
    created_at: string;
    days_left: number | null;
    is_overdue: boolean;
    health: "healthy" | "at_risk" | "critical" | "completed";
    is_blocked?: boolean;
    blocker_status?: string;
    blocker_notes?: string;
    blocker_escalated_at?: string | null;
    blocker_flagged_by_name?: string | null;
  };
  telemetry: DossierTelemetry;
  squad: SquadMember[];
  milestones: DossierMilestone[];
  tasks: DossierTask[];
  audit_logs: DossierAuditLog[];
}

interface ProjectDetailDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number | string | null;
  onOpenMilestonesModal?: (project: any) => void;
  onOpenBudgetHUD?: (project: any) => void;
  onOpenBlockerModal?: (project: any) => void;
  onOpenAuditDrawer?: (project: any) => void;
}

export const ProjectDetailDossierModal: React.FC<ProjectDetailDossierModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onOpenMilestonesModal,
  onOpenBudgetHUD,
  onOpenBlockerModal,
  onOpenAuditDrawer,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DossierPayload | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "squad" | "milestones" | "tasks" | "audit">("overview");
  const [taskFilter, setTaskFilter] = useState<string>("all");

  const fetchDossier = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/projects/${projectId}/dossier`);
      if (res.data.status) {
        setData(res.data.dossier);
      }
    } catch (err) {
      console.error("Failed to load project 360 dossier:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchDossier();
      setActiveTab("overview");
      setTaskFilter("all");

      // Handle ESC key to dismiss modal
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    } else {
      setData(null);
    }
  }, [isOpen, projectId]);

  // Toggle deliverable checkbox directly from dossier
  const handleToggleDeliverable = async (
    milestoneId: number | string,
    deliverableId: string,
    currentVal: boolean
  ) => {
    if (!data) return;
    const nextVal = !currentVal;

    setData((prev) => {
      if (!prev) return prev;
      const updatedMilestones = prev.milestones.map((m) => {
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
      return { ...prev, milestones: updatedMilestones };
    });

    try {
      await api.put(`/api/admin/projects/milestones/${milestoneId}/deliverable-toggle`, {
        deliverableId,
        completed: nextVal,
      });
    } catch (err) {
      console.error("Dossier deliverable toggle failed:", err);
    }
  };

  // Toggle milestone status directly from dossier
  const handleToggleMilestone = async (milestone: DossierMilestone) => {
    if (!data) return;
    const nextStatus = milestone.status === "completed" ? "in_progress" : "completed";

    setData((prev) => {
      if (!prev) return prev;
      const updatedMilestones = prev.milestones.map((m) => {
        if (m.id === milestone.id) {
          const nextDel =
            nextStatus === "completed"
              ? m.deliverables.map((d) => ({ ...d, completed: true }))
              : m.deliverables;
          return {
            ...m,
            status: nextStatus as any,
            deliverables: nextDel,
            completed_deliverables: nextDel.filter((d) => d.completed).length,
            progress_percentage: nextStatus === "completed" ? 100 : m.progress_percentage,
          };
        }
        return m;
      });
      return { ...prev, milestones: updatedMilestones };
    });

    try {
      await api.put(`/api/admin/projects/milestones/${milestone.id}/status`, {
        status: nextStatus,
      });
    } catch (err) {
      console.error("Dossier milestone toggle failed:", err);
    }
  };

  if (!isOpen) return null;

  const project = data?.project;
  const telemetry = data?.telemetry;

  const filteredTasks = (data?.tasks || []).filter((task) => {
    if (taskFilter === "all") return true;
    if (taskFilter === "overdue") {
      return task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date();
    }
    return task.status === taskFilter;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-50 w-full max-w-5xl rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dedicated Print Stylesheet */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { overflow: visible !important; background: white !important; }
            .fixed { position: static !important; inset: auto !important; background: transparent !important; padding: 0 !important; }
            .max-h-\\[92vh\\] { max-height: none !important; overflow: visible !important; box-shadow: none !important; border: none !important; }
            .overflow-y-auto { overflow: visible !important; }
            button { display: none !important; }
          }
        `}} />

        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0 border-b border-indigo-900/40">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRJ-{String(projectId || "0").padStart(4, "0")}
              </span>
              {project?.department_name && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/90 border border-white/15">
                  🏢 {project.department_name}
                </span>
              )}
              {project?.status && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">
                  ● {project.status}
                </span>
              )}
              {telemetry?.is_overdue && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                  Overdue by {Math.abs(telemetry.days_left || 0)}d
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white truncate mb-0">
              {project?.title || "Project 360° Inspection Dossier"}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {project?.status === "archived" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await api.put(`/api/admin/projects/${project.id}/status`, { status: "active" });
                    if (res.data.status) {
                      setData((prev: any) => (prev ? { ...prev, project: { ...prev.project, status: "active" } } : prev));
                    }
                  } catch (e) {
                    console.error("Failed to unarchive from dossier:", e);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold border border-emerald-400/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Restore this archived initiative to Active status"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                <span>Unarchive / Restore</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Print Dossier Document"
            >
              <i className="bi bi-printer"></i>
              <span className="hidden sm:inline">Print Dossier</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Close Modal"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Executive Metrics HUD / Telemetry Bar */}
        {telemetry && (
          <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
            {/* 1. Task Velocity */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                <span>Task Velocity</span>
                <span className="font-bold text-slate-900">{telemetry.task_velocity}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${telemetry.task_velocity}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400">
                {telemetry.completed_tasks} of {telemetry.total_tasks} tasks delivered
              </div>
            </div>

            {/* 2. Milestones & Deliverables */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                <span>Milestones Progress</span>
                <span className="font-bold text-slate-900">{telemetry.milestones_progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                  style={{ width: `${telemetry.milestones_progress}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400">
                {telemetry.completed_milestones} of {telemetry.total_milestones} phases completed
              </div>
            </div>

            {/* 3. Target Countdown Clock */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-[10px] font-semibold text-slate-500 mb-0.5">
                Target Countdown
              </div>
              <div className="flex items-center gap-1.5">
                <i className={`bi ${telemetry.is_overdue ? "bi-clock-fill text-rose-600" : "bi-stopwatch text-indigo-600"} text-sm`}></i>
                <span className={`text-xs font-bold ${telemetry.is_overdue ? "text-rose-600" : "text-slate-800"}`}>
                  {project?.target_date
                    ? telemetry.is_overdue
                      ? `Overdue by ${Math.abs(telemetry.days_left || 0)}d`
                      : telemetry.days_left === 0
                      ? "Due Today"
                      : `${telemetry.days_left}d remaining`
                    : "No deadline"}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                {project?.target_date
                  ? new Date(project.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Target date unset"}
              </div>
            </div>

            {/* 4. Budget Telemetry */}
            <div
              onClick={() => onOpenBudgetHUD && onOpenBudgetHUD(project)}
              className={`p-2.5 rounded-xl border transition-all ${
                onOpenBudgetHUD
                  ? "bg-slate-50 hover:bg-emerald-50/70 border-slate-200/70 hover:border-emerald-300 cursor-pointer group"
                  : "bg-slate-50 border-slate-200/70"
              }`}
              title={onOpenBudgetHUD ? "Click to open Budget Allocation & Burn Rate HUD" : undefined}
            >
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                <span className="flex items-center gap-1">
                  <i className="bi bi-cash-stack text-emerald-600"></i>
                  <span>Budget Telemetry</span>
                </span>
                <span className="font-bold text-emerald-700">
                  ${telemetry.budget_allocated.toLocaleString()}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>
                  ${telemetry.budget_spent.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">spent</span>
                </span>
                {onOpenBudgetHUD && (
                  <span className="text-[9px] font-bold text-emerald-600 group-hover:underline">
                    Manage HUD →
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                ${Math.max(0, telemetry.budget_allocated - telemetry.budget_spent).toLocaleString()} runway available
              </div>
            </div>
          </div>
        )}

        {/* 5-Tabs Navigation Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <i className="bi bi-info-circle"></i>
            <span>Overview & Scope</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("squad")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "squad"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <i className="bi bi-people"></i>
            <span>Assigned Squad</span>
            {data?.squad && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {data.squad.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("milestones")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "milestones"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <i className="bi bi-flag"></i>
            <span>Deliverable Milestones</span>
            {data?.milestones && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {data.milestones.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <i className="bi bi-check2-square"></i>
            <span>Task Breakdown</span>
            {data?.tasks && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {data.tasks.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "audit"
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <i className="bi bi-clock-history"></i>
            <span>Audit History</span>
            {data?.audit_logs && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {data.audit_logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500 font-medium">Assembling 360° project dossier...</p>
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-slate-400">
              <i className="bi bi-exclamation-circle text-2xl mb-1 block"></i>
              <p className="text-xs">Project dossier data could not be loaded.</p>
            </div>
          ) : activeTab === "overview" ? (
            /* TAB 1: OVERVIEW & SCOPE */
            <div className="space-y-4">
              {/* Executive Blocker Alert Banner (If Active) */}
              {data?.project?.is_blocked && data?.project?.blocker_status && data?.project?.blocker_status !== "none" && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-50 via-rose-100/60 to-orange-50 border-2 border-rose-300 shadow-xs animate-pulse">
                  <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center text-base shrink-0 shadow-xs">
                        <i className="bi bi-shield-slash-fill"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wider text-rose-900 bg-rose-200/90 px-2.5 py-0.5 rounded-md border border-rose-300">
                            🚫 Active Blocker: {data.project.blocker_status.replace(/_/g, " ")}
                          </span>
                          {data.project.blocker_escalated_at && (
                            <span className="text-[11px] font-bold text-rose-700">
                              Escalated on {new Date(data.project.blocker_escalated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                          {data.project.blocker_flagged_by_name && (
                            <span className="text-[11px] text-slate-500">
                              by {data.project.blocker_flagged_by_name}
                            </span>
                          )}
                        </div>
                        {data.project.blocker_notes && (
                          <p className="text-xs text-rose-950 font-medium mt-2 mb-0 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-rose-200/90 shadow-2xs">
                            "{data.project.blocker_notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    {onOpenBlockerModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBlockerModal(data.project);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <i className="bi bi-sliders"></i>
                        <span>Manage Blocker</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Scope Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Strategic Scope & Initiative Charter
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-0">
                  {project?.description || "No detailed scope description provided for this initiative."}
                </p>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Department Info */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Department Ownership
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-200">
                      {project?.department_code || "DPT"}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {project?.department_name || "General"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ID: {project?.department_id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lead Supervisor */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Designated Lead Supervisor
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200">
                      {project?.supervisor_name ? project.supervisor_name.charAt(0) : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {project?.supervisor_name || "Unassigned"}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {project?.supervisor_email || "No email"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Lifecycle */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Lifecycle Timeline
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span className="text-[10px] text-slate-400">Start Date:</span>
                      <span className="font-medium">
                        {project?.start_date ? new Date(project.start_date).toLocaleDateString() : "Unset"}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="text-[10px] text-slate-400">Target Date:</span>
                      <span className="font-bold text-slate-900">
                        {project?.target_date ? new Date(project.target_date).toLocaleDateString() : "Unset"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority & Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Priority & Governance
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                      {project?.priority} Priority
                    </span>
                    <span className="text-xs text-slate-500">
                      Created by {project?.creator_name || "Admin"} on{" "}
                      {project?.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Financial Allocation
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900">
                        ${Number(project?.budget || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Total Budget Cap</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-emerald-700">Healthy</span>
                      <span className="text-[10px] text-slate-400 block">Fiscal Assessment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "squad" ? (
            /* TAB 2: ASSIGNED SQUAD */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-0">Project Squad Roster</h4>
                  <p className="text-[11px] text-slate-500 mb-0">
                    Personnel assigned to this initiative and active contributors
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {data.squad.length} Personnel
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.squad.map((member) => (
                  <div
                    key={member.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            member.squad_role === "Lead Supervisor"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : member.squad_role === "Supervisor"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {member.squad_role}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {member.department_name || "General"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate mb-0">
                            {member.name}
                          </h5>
                          <p className="text-[10px] text-slate-500 truncate mb-0">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500">
                        Tasks: <strong className="text-slate-800">{member.assigned_tasks_count}</strong>
                      </span>
                      {member.assigned_tasks_count > 0 && (
                        <span className="text-emerald-700 font-medium">
                          {member.completed_tasks_count} done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "milestones" ? (
            /* TAB 3: DELIVERABLE MILESTONES */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-0">Deliverable Milestones & Phases</h4>
                  <p className="text-[11px] text-slate-500 mb-0">
                    Sequenced delivery roadmap, owners, and checklist verification
                  </p>
                </div>
                {onOpenMilestonesModal && project && (
                  <button
                    type="button"
                    onClick={() => onOpenMilestonesModal(project)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="bi bi-gear-wide-connected"></i>
                    <span>Manage Milestones</span>
                  </button>
                )}
              </div>

              {data.milestones.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 text-base">
                    <i className="bi bi-flag"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mb-0.5">No Sub-Milestones Established</p>
                  <p className="text-[11px] text-slate-400 mb-3">Break down this initiative into deliverable phases and checklists.</p>
                  {onOpenMilestonesModal && project && (
                    <button
                      type="button"
                      onClick={() => onOpenMilestonesModal(project)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      + Create First Milestone
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {data.milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        m.status === "completed"
                          ? "bg-emerald-50/40 border-emerald-200/80"
                          : "bg-white border-slate-200/90 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={m.status === "completed"}
                            onChange={() => handleToggleMilestone(m)}
                            className="mt-0.5 w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                            title="Toggle milestone status"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                Phase {idx + 1}
                              </span>
                              <h5
                                className={`text-xs sm:text-sm font-bold truncate mb-0 ${
                                  m.status === "completed"
                                    ? "text-emerald-950 line-through opacity-85"
                                    : "text-slate-900"
                                }`}
                              >
                                {m.title}
                              </h5>
                              <span
                                className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                                  m.status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : m.status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {m.status.toUpperCase()}
                              </span>
                            </div>
                            {m.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5 mb-0">
                                {m.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {m.due_date && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Due: {new Date(m.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                          {m.owner_name && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              👤 {m.owner_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Deliverables List */}
                      {m.deliverables && m.deliverables.length > 0 && (
                        <div className="pl-6 pt-2 border-t border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Checklist ({m.completed_deliverables}/{m.total_deliverables})</span>
                            <span className="text-indigo-600">{m.progress_percentage}%</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {m.deliverables.map((del) => (
                              <label
                                key={del.id}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border cursor-pointer select-none transition-all ${
                                  del.completed
                                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-800 line-through opacity-80"
                                    : "bg-slate-50 hover:bg-white border-slate-200 text-slate-700"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={del.completed}
                                  onChange={() => handleToggleDeliverable(m.id, del.id, del.completed)}
                                  className="w-3.5 h-3.5 rounded text-indigo-600 accent-indigo-600"
                                />
                                <span className="truncate">{del.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "tasks" ? (
            /* TAB 4: TASK BREAKDOWN */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-0">Project Task Breakdown</h4>
                  <p className="text-[11px] text-slate-500 mb-0">
                    Granular execution tasks linked to this initiative
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-semibold">
                  {["all", "in_progress", "pending", "completed", "overdue"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setTaskFilter(f)}
                      className={`px-2 py-0.5 rounded-md transition-all capitalize cursor-pointer ${
                        taskFilter === f
                          ? "bg-white text-indigo-700 shadow-2xs font-bold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {f.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 text-base">
                    <i className="bi bi-card-checklist"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mb-0.5">No Tasks Found</p>
                  <p className="text-[11px] text-slate-400 mb-0">
                    {taskFilter !== "all"
                      ? `No tasks currently match the "${taskFilter.replace("_", " ")}" filter.`
                      : "No operational tasks have been assigned to this initiative yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-2 h-8 rounded-full shrink-0 ${
                            t.status === "completed"
                              ? "bg-emerald-500"
                              : t.priority === "critical"
                              ? "bg-rose-500"
                              : t.priority === "high"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        ></div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {t.title}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                t.priority === "critical"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : t.priority === "high"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {t.priority}
                            </span>
                          </div>
                          {t.description && (
                            <p className="text-[10px] text-slate-400 truncate mb-0">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[11px] font-semibold text-slate-700 block">
                            👤 {t.assignee_name || "Unassigned"}
                          </span>
                          {t.due_date && (
                            <span className="text-[9px] text-slate-400 block">
                              Due: {new Date(t.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : t.status === "in_progress"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {t.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB 5: AUDIT HISTORY */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-0">Initiative Change Ledger & Audit Trail</h4>
                  <p className="text-[11px] text-slate-500 mb-0">
                    Immutable history of updates, status changes, and administrative actions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {data.audit_logs.length} Logged Events
                  </span>
                  {onOpenAuditDrawer && (
                    <button
                      type="button"
                      onClick={() => onOpenAuditDrawer(data.project)}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                      title="Open full slide-out audit trail drawer with filters & CSV export"
                    >
                      <i className="bi bi-layout-sidebar-inset-reverse"></i>
                      <span>Open Full Ledger</span>
                    </button>
                  )}
                </div>
              </div>

              {data.audit_logs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 text-base">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mb-0.5">No Historical Audit Logs</p>
                  <p className="text-[11px] text-slate-400 mb-0">Activity records will record automatically as changes occur.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {data.audit_logs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Timeline Dot */}
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shadow-xs"></div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-indigo-700">
                              {log.action_type}
                            </span>
                            {log.field_name && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                                {log.field_name}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {log.details && (
                          <p className="text-xs text-slate-700 mb-1.5">
                            {log.details}
                          </p>
                        )}

                        {/* Value Diff (Old -> New) */}
                        {(log.old_value || log.new_value) && (
                          <div className="flex items-center gap-1.5 text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 mb-1">
                            {log.old_value && (
                              <span className="text-rose-700 line-through font-mono">
                                {log.old_value}
                              </span>
                            )}
                            {log.old_value && log.new_value && (
                              <span className="text-slate-400">➔</span>
                            )}
                            {log.new_value && (
                              <span className="text-emerald-700 font-bold font-mono">
                                {log.new_value}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <i className="bi bi-person-check text-slate-500"></i>
                          <span>Executed by {log.actor_name || "System Admin"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Strategic Initiative Dossier • Governance & Audit Certified
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
