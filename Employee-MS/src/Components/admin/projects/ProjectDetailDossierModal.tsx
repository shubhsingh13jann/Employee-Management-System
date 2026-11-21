import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";
import { ProjectPrintDossier } from "./ProjectPrintDossier";

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
  const [auditCategory, setAuditCategory] = useState<"all" | "status" | "deadline" | "budget" | "supervisor" | "blocker">("all");
  const [auditSearch, setAuditSearch] = useState<string>("");
  const [showPrintDossier, setShowPrintDossier] = useState<boolean>(false);

  const categorizeDossierLog = (log: DossierAuditLog): "all" | "status" | "deadline" | "budget" | "supervisor" | "blocker" => {
    const act = (log.action_type || "").toLowerCase();
    const fld = (log.field_name || "").toLowerCase();
    const det = (log.details || "").toLowerCase();

    if (act.includes("budget") || fld.includes("budget") || act.includes("expense") || det.includes("expenditure")) {
      return "budget";
    }
    if (act.includes("deadline") || act.includes("target date") || fld.includes("target_date") || det.includes("deadline")) {
      return "deadline";
    }
    if (act.includes("supervisor") || fld.includes("lead_supervisor") || act.includes("squad") || det.includes("supervisor")) {
      return "supervisor";
    }
    if (act.includes("blocker") || fld.includes("is_blocked") || det.includes("blocked") || det.includes("escalat")) {
      return "blocker";
    }
    if (act.includes("status") || act.includes("lifecycle") || fld.includes("status")) {
      return "status";
    }
    return "all";
  };

  const auditCategoryCounts = useMemo(() => {
    const counts = { all: data?.audit_logs?.length || 0, status: 0, deadline: 0, budget: 0, supervisor: 0, blocker: 0 };
    (data?.audit_logs || []).forEach((log) => {
      const cat = categorizeDossierLog(log);
      if (cat !== "all") {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [data?.audit_logs]);

  const filteredAuditLogs = useMemo(() => {
    const logs = data?.audit_logs || [];
    return logs.filter((log) => {
      if (auditCategory !== "all" && categorizeDossierLog(log) !== auditCategory) {
        return false;
      }
      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        const matchAct = (log.action_type || "").toLowerCase().includes(q);
        const matchDet = (log.details || "").toLowerCase().includes(q);
        const matchActr = (log.actor_name || "").toLowerCase().includes(q);
        const matchFld = (log.field_name || "").toLowerCase().includes(q);
        const matchOld = (log.old_value || "").toLowerCase().includes(q);
        const matchNew = (log.new_value || "").toLowerCase().includes(q);
        return matchAct || matchDet || matchActr || matchFld || matchOld || matchNew;
      }
      return true;
    });
  }, [data?.audit_logs, auditCategory, auditSearch]);

  const handleExportAuditCSV = () => {
    if (!data?.audit_logs || !data?.project) return;
    const headers = ["Log ID", "Date", "Action Type", "Field", "Previous Value", "New Value", "Details", "Executed By", "Role"];
    const rows = data.audit_logs.map((l) => [
      l.id,
      new Date(l.created_at).toISOString(),
      `"${(l.action_type || "").replace(/"/g, '""')}"`,
      `"${(l.field_name || "").replace(/"/g, '""')}"`,
      `"${(l.old_value || "").replace(/"/g, '""')}"`,
      `"${(l.new_value || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      `"${(l.actor_name || "System Admin").replace(/"/g, '""')}"`,
      `"${(l.actor_role || "admin").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `project_audit_PRJ-${String(data.project.id).padStart(4, "0")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      // Handle ESC key to dismiss modal and Ctrl+P / Cmd+P to open Executive Print Dossier
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
          e.preventDefault();
          setShowPrintDossier(true);
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

        {/* Header with Fluid Pastel Wave Background matching Hierarchy Dossier Modal */}
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
                <mask id="projectDossierWaveFadeMask">
                  <linearGradient id="projectDossierWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="18%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#projectDossierWaveFadeGrad)" />
                </mask>

                <linearGradient id="projectDossierWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="projectDossierWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="projectDossierWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g mask="url(#projectDossierWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#projectDossierWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#projectDossierWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#projectDossierWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          {/* Left: Electric Gradient Squircle Project Icon + Title & Information Badges */}
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-indigo-500/20 shrink-0 border border-white/20">
              <i className="bi bi-briefcase-fill text-amber-300"></i>
            </div>

            <div className="min-w-0">
              {/* Project Title + PRJ-ID Pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-[13.5px] sm:text-[14.5px] text-slate-900 mb-0 tracking-tight leading-tight truncate">
                  {project?.title || "Project 360° Inspection Dossier"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                  PRJ-{String(projectId || "0").padStart(4, "0")}
                </span>
              </div>

              {/* Subtitle Line with Department, Lead Supervisor, and Timeline */}
              <div className="text-[10.5px] sm:text-[11px] text-slate-400 mb-1 font-normal leading-tight truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                {project?.department_name && (
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <i className="bi bi-building text-[9.5px] text-indigo-500"></i>
                    <span>{project.department_name}</span>
                  </span>
                )}
                {project?.supervisor_name && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <i className="bi bi-person text-[9.5px] text-emerald-500"></i>
                      <span>Lead: {project.supervisor_name}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Meta Pills: Status, Priority, Overdue */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Status Badge */}
                {project?.status && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold capitalize bg-emerald-50/80 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                    <span>{project.status}</span>
                  </div>
                )}

                {/* Priority Badge */}
                {project?.priority && (
                  <div className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold uppercase shadow-2xs border ${
                    project.priority === "critical"
                      ? "bg-rose-50/80 text-rose-700 border-rose-200"
                      : project.priority === "high"
                      ? "bg-amber-50/80 text-amber-700 border-amber-200"
                      : "bg-indigo-50/60 text-indigo-700 border-indigo-100"
                  }`}>
                    <span>{project.priority} Priority</span>
                  </div>
                )}

                {/* Overdue Badge if any */}
                {telemetry?.is_overdue && (
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>Overdue by {Math.abs(telemetry.days_left || 0)}d</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Print PDF Button & Rounded Square Close Button */}
          <div className="flex items-center gap-2 relative z-10 shrink-0">
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
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold border border-emerald-400/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Restore this archived initiative to Active status"
              >
                <i className="bi bi-arrow-counterclockwise text-xs"></i>
                <span>Restore</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPrintDossier(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/90 shadow-2xs text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Printable Executive Initiative Dossier / PDF Summary View"
            >
              <i className="bi bi-printer text-indigo-600 text-xs"></i>
              <span className="hidden sm:inline">Print Briefing / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs"
              title="Close Modal"
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-xs"></i>
            </button>
          </div>
        </div>

        {/* Executive Metrics HUD / Telemetry Bar */}
        {telemetry && (
          <div className="bg-slate-50/60 border-b border-slate-200/80 px-3.5 sm:px-4 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
            {/* 1. Task Velocity */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Task Velocity</span>
                <span className="font-bold text-slate-800 text-[11px]">{telemetry.task_velocity}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1 border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${telemetry.task_velocity}%` }}
                ></div>
              </div>
              <div className="text-[9.5px] text-slate-400">
                {telemetry.completed_tasks} of {telemetry.total_tasks} tasks delivered
              </div>
            </div>

            {/* 2. Milestones Progress */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Milestones Progress</span>
                <span className="font-bold text-slate-800 text-[11px]">{telemetry.milestones_progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1 border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${telemetry.milestones_progress}%` }}
                ></div>
              </div>
              <div className="text-[9.5px] text-slate-400">
                {telemetry.completed_milestones} of {telemetry.total_milestones} phases completed
              </div>
            </div>

            {/* 3. Target Countdown */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Target Countdown
              </div>
              <div className="flex items-center gap-1.5">
                <i className={`bi ${telemetry.is_overdue ? "bi-clock-fill text-rose-600" : "bi-stopwatch text-indigo-600"} text-xs`}></i>
                <span className={`text-[11px] font-bold ${telemetry.is_overdue ? "text-rose-600" : "text-slate-800"}`}>
                  {project?.target_date
                    ? telemetry.is_overdue
                      ? `Overdue by ${Math.abs(telemetry.days_left || 0)}d`
                      : telemetry.days_left === 0
                      ? "Due Today"
                      : `${telemetry.days_left}d remaining`
                    : "No deadline"}
                </span>
              </div>
              <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                {project?.target_date
                  ? new Date(project.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Target date unset"}
              </div>
            </div>

            {/* 4. Budget Telemetry */}
            <div
              onClick={() => onOpenBudgetHUD && onOpenBudgetHUD(project)}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
                onOpenBudgetHUD
                  ? "bg-white hover:bg-emerald-50/50 border-slate-200/80 hover:border-emerald-300 cursor-pointer group shadow-2xs"
                  : "bg-white border-slate-200/80 shadow-2xs"
              }`}
              title={onOpenBudgetHUD ? "Click to open Budget Allocation & Burn Rate HUD" : undefined}
            >
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <i className="bi bi-cash-stack text-emerald-600"></i>
                  <span>Budget Telemetry</span>
                </span>
                <span className="font-bold text-emerald-700 text-[11px]">
                  ${telemetry.budget_allocated.toLocaleString()}
                </span>
              </div>
              <div className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                <span>
                  ${telemetry.budget_spent.toLocaleString()} <span className="text-[9px] font-normal text-slate-400">spent</span>
                </span>
                {onOpenBudgetHUD && (
                  <span className="text-[9px] font-bold text-emerald-600 group-hover:underline">
                    Manage HUD →
                  </span>
                )}
              </div>
              <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                ${Math.max(0, telemetry.budget_allocated - telemetry.budget_spent).toLocaleString()} runway available
              </div>
            </div>
          </div>
        )}

        {/* 5-Tabs Navigation Header */}
        <div className="bg-white border-b border-slate-200 px-3.5 sm:px-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: "overview", label: "Overview & Scope", icon: "bi-info-circle", count: null },
            { id: "squad", label: "Assigned Squad", icon: "bi-people", count: data?.squad?.length },
            { id: "milestones", label: "Deliverable Milestones", icon: "bi-flag", count: data?.milestones?.length },
            { id: "tasks", label: "Task Breakdown", icon: "bi-check2-square", count: data?.tasks?.length },
            { id: "audit", label: "Audit History", icon: "bi-clock-history", count: data?.audit_logs?.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 text-[11px] sm:text-[11.5px] font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <i className={`bi ${tab.icon} text-xs`}></i>
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                  activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 bg-slate-50/40 space-y-3">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-[11px] text-slate-500 font-medium">Assembling 360° project dossier...</p>
            </div>
          ) : !data ? (
            <div className="py-16 text-center text-slate-400">
              <i className="bi bi-exclamation-circle text-2xl mb-1 block"></i>
              <p className="text-xs">Project dossier data could not be loaded.</p>
            </div>
          ) : activeTab === "overview" ? (
            /* TAB 1: OVERVIEW & SCOPE */
            <div className="space-y-3">
              {/* Executive Blocker Alert Banner (If Active) */}
              {Boolean(data?.project?.is_blocked && data?.project?.blocker_status && data?.project?.blocker_status !== "none") && (
                <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-50 via-rose-100/60 to-orange-50 border border-rose-200 shadow-2xs">
                  <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center text-sm shrink-0 shadow-2xs">
                        <i className="bi bi-shield-slash-fill"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-900 bg-rose-200/90 px-2 py-0.5 rounded-md border border-rose-300">
                            🚫 Active Blocker: {data?.project?.blocker_status ? data.project.blocker_status.replace(/_/g, " ") : "Critical Blocker"}
                          </span>
                          {data?.project?.blocker_escalated_at && (
                            <span className="text-[10.5px] font-bold text-rose-700">
                              Escalated on {new Date(data.project.blocker_escalated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                          {data?.project?.blocker_flagged_by_name && (
                            <span className="text-[10px] text-slate-500">
                              by {data.project.blocker_flagged_by_name}
                            </span>
                          )}
                        </div>
                        {data?.project?.blocker_notes && (
                          <p className="text-[11px] text-rose-950 font-medium mt-1.5 mb-0 leading-relaxed bg-white/80 p-2 rounded-lg border border-rose-200/90 shadow-2xs">
                            "{data.project.blocker_notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    {onOpenBlockerModal && (
                      <button
                        type="button"
                        onClick={() => {
                          if (data?.project) onOpenBlockerModal(data.project);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <i className="bi bi-sliders text-xs"></i>
                        <span>Manage Blocker</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Strategic Scope Card */}
              <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-slate-100">
                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                    <i className="bi bi-file-earmark-text"></i>
                  </div>
                  <h4 className="text-[11px] sm:text-[11.5px] font-bold text-slate-800 tracking-tight leading-snug truncate mb-0 uppercase">
                    Strategic Scope & Initiative Charter
                  </h4>
                </div>
                <p className="text-[11.5px] text-slate-700 leading-relaxed mb-0">
                  {project?.description || "No detailed scope description provided for this initiative."}
                </p>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {/* Department Info */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-tight mb-1.5">
                    Department Ownership
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50/80 text-indigo-700 font-bold text-xs flex items-center justify-center border border-indigo-100 shrink-0 shadow-2xs">
                      {project?.department_code || "DPT"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-bold text-slate-800 truncate">
                        {project?.department_name || "General"}
                      </div>
                      <div className="text-[9.5px] text-slate-400 font-mono">
                        DEPT ID: {project?.department_id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lead Supervisor */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-tight mb-1.5">
                    Designated Lead Supervisor
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 shrink-0 shadow-2xs">
                      {project?.supervisor_name ? project.supervisor_name.charAt(0) : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-bold text-slate-800 truncate">
                        {project?.supervisor_name || "Unassigned"}
                      </div>
                      <div className="text-[9.5px] text-slate-400 truncate">
                        {project?.supervisor_email || "No email assigned"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Lifecycle */}
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-tight mb-1.5">
                    Lifecycle Timeline
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[9.5px] text-slate-400">Start Date:</span>
                      <span className="font-semibold text-slate-700">
                        {project?.start_date ? new Date(project.start_date).toLocaleDateString() : "Unset"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-[9.5px] text-slate-400">Target Date:</span>
                      <span className="font-bold text-slate-900">
                        {project?.target_date ? new Date(project.target_date).toLocaleDateString() : "Unset"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority & Financials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-tight mb-1.5">
                    Priority & Governance
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                      {project?.priority} Priority
                    </span>
                    <span className="text-[10.5px] text-slate-500">
                      Created by {project?.creator_name || "Admin"} on{" "}
                      {project?.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block leading-tight mb-1.5">
                    Financial Allocation
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        ${Number(project?.budget || 0).toLocaleString()}
                      </span>
                      <span className="text-[9.5px] text-slate-400 block">Total Budget Cap</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Healthy
                      </span>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">Fiscal Assessment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "squad" ? (
            /* TAB 2: ASSIGNED SQUAD */
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-[11.5px] font-bold text-slate-800 mb-0 tracking-tight">
                      Project Squad Roster
                    </h4>
                    <p className="text-[9.5px] text-slate-400 mb-0">
                      Personnel assigned to this initiative and active contributors
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                  {data.squad.length} Personnel
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {data.squad.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-0.2 rounded-md text-[9.5px] font-bold ${
                            member.squad_role === "Lead Supervisor"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : member.squad_role === "Supervisor"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {member.squad_role}
                        </span>
                        <span className="text-[9.5px] text-slate-400">
                          {member.department_name || "General"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs border border-white/20 shrink-0">
                          {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-[11.5px] text-slate-900 truncate mb-0">
                            {member.name}
                          </h5>
                          <p className="text-[9.5px] text-slate-400 truncate mb-0">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9.5px]">
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
                <div className="flex items-center gap-2">
                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                    <i className="bi bi-flag-fill"></i>
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-[11.5px] font-bold text-slate-800 mb-0 tracking-tight">
                      Deliverable Milestones & Phases
                    </h4>
                    <p className="text-[9.5px] text-slate-400 mb-0">
                      Sequenced delivery roadmap, owners, and checklist verification
                    </p>
                  </div>
                </div>
                {onOpenMilestonesModal && project && (
                  <button
                    type="button"
                    onClick={() => onOpenMilestonesModal(project)}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-semibold text-[11px] border border-slate-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="bi bi-gear-wide-connected text-xs"></i>
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
                <div className="flex items-center gap-2">
                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                    <i className="bi bi-check2-square"></i>
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-[11.5px] font-bold text-slate-800 mb-0 tracking-tight">
                      Project Task Breakdown
                    </h4>
                    <p className="text-[9.5px] text-slate-400 mb-0">
                      Granular execution tasks linked to this initiative
                    </p>
                  </div>
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
              {/* Header with Counter, CSV Download & Full Drawer Link */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-[11.5px] font-bold text-slate-800 mb-0 tracking-tight">
                      Initiative Change Ledger & Audit Trail
                    </h4>
                    <p className="text-[9.5px] text-slate-400 mb-0">
                      Immutable history of updates, status changes, and administrative actions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-lg text-[9.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                    {data.audit_logs.length} Logged Events
                  </span>
                  <button
                    type="button"
                    onClick={handleExportAuditCSV}
                    disabled={!data.audit_logs?.length}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200/90 shadow-2xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
                    title="Export audit logs to CSV"
                  >
                    <i className="bi bi-file-earmark-spreadsheet text-xs"></i>
                    <span>Export CSV</span>
                  </button>
                  {onOpenAuditDrawer && (
                    <button
                      type="button"
                      onClick={() => onOpenAuditDrawer(data.project)}
                      className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white text-indigo-700 hover:bg-indigo-50 border border-slate-200/90 shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                      title="Open full slide-out audit trail drawer with filters & CSV export"
                    >
                      <i className="bi bi-layout-sidebar-inset-reverse text-xs"></i>
                      <span>Open Full Ledger</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Telemetry Quick Strip (4 Cards) */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Total Events</span>
                  <span className="text-xs sm:text-[13px] font-bold text-slate-800">{auditCategoryCounts.all}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-indigo-500 block tracking-wider">Status Shifts</span>
                  <span className="text-xs sm:text-[13px] font-bold text-indigo-700">{auditCategoryCounts.status}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-amber-600 block tracking-wider">Deadlines</span>
                  <span className="text-xs sm:text-[13px] font-bold text-amber-700">{auditCategoryCounts.deadline}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[9px] uppercase font-bold text-emerald-600 block tracking-wider">Budget Diffs</span>
                  <span className="text-xs sm:text-[13px] font-bold text-emerald-700">{auditCategoryCounts.budget}</span>
                </div>
              </div>

              {/* Search & Category Filter Chips */}
              <div className="space-y-2 pt-0.5">
                <div className="relative">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search audit events by action, performer, values, or details..."
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  {auditSearch && (
                    <button
                      type="button"
                      onClick={() => setAuditSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setAuditCategory("all")}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      auditCategory === "all"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Events ({auditCategoryCounts.all})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditCategory("status")}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      auditCategory === "status"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <i className="bi bi-arrow-repeat"></i>
                    Status ({auditCategoryCounts.status})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditCategory("deadline")}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      auditCategory === "deadline"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <i className="bi bi-calendar-event"></i>
                    Deadlines ({auditCategoryCounts.deadline})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditCategory("budget")}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      auditCategory === "budget"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <i className="bi bi-cash-stack"></i>
                    Budget ({auditCategoryCounts.budget})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditCategory("supervisor")}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      auditCategory === "supervisor"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <i className="bi bi-person-badge"></i>
                    Supervisor ({auditCategoryCounts.supervisor})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuditCategory("blocker")}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                      auditCategory === "blocker"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <i className="bi bi-shield-slash"></i>
                    Blockers ({auditCategoryCounts.blocker})
                  </button>
                </div>
              </div>

              {filteredAuditLogs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 text-base">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mb-0.5">No Historical Audit Logs Matching Criteria</p>
                  <p className="text-[11px] text-slate-400 mb-0">Try clearing your search query or switching categories.</p>
                  {(auditSearch || auditCategory !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditSearch("");
                        setAuditCategory("all");
                      }}
                      className="mt-2.5 px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {filteredAuditLogs.map((log) => {
                    const hasDiff = (log.old_value !== null && log.old_value !== undefined && log.old_value !== "") ||
                                    (log.new_value !== null && log.new_value !== undefined && log.new_value !== "");
                    return (
                      <div key={log.id} className="relative">
                        {/* Timeline Dot */}
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-indigo-600 shadow-xs"></div>

                        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
                          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-indigo-700">
                                {log.action_type}
                              </span>
                              {log.field_name && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
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
                            <p className="text-xs text-slate-700 mb-2 leading-relaxed">
                              {log.details}
                            </p>
                          )}

                          {/* Value Diff (Old -> New) */}
                          {hasDiff && (
                            <div className="my-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 space-y-1">
                              <div className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <i className="bi bi-arrow-left-right"></i>
                                <span>Modification Difference</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-900">
                                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                                    <i className="bi bi-dash-circle-fill"></i> Previous
                                  </span>
                                  <div className="font-mono text-[11px] font-semibold truncate" title={log.old_value || "None"}>
                                    {log.old_value || <span className="italic text-slate-400">None</span>}
                                  </div>
                                </div>
                                <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                                    <i className="bi bi-plus-circle-fill"></i> New
                                  </span>
                                  <div className="font-mono text-[11px] font-semibold truncate" title={log.new_value || "None"}>
                                    {log.new_value || <span className="italic text-slate-400">None</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <i className="bi bi-person-check text-slate-500"></i>
                              <span>Executed by <strong className="text-slate-700">{log.actor_name || "System Admin"}</strong></span>
                              {log.actor_role && (
                                <span className="px-1 py-0.1 rounded text-[8.5px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                  {log.actor_role}
                                </span>
                              )}
                            </div>
                            {log.actor_email && (
                              <span className="text-slate-400 truncate max-w-[180px]" title={log.actor_email}>
                                {log.actor_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls matching Hierarchy Dossier Modal */}
        <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1.5">
            <i className="bi bi-shield-check text-emerald-600 text-xs"></i>
            <span>Strategic Initiative Dossier • Governance & Audit Certified</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <i className="bi bi-x-lg text-xs"></i>
              <span>Close Dossier</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPrintDossier(true)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <i className="bi bi-printer text-xs"></i>
              <span>Print Executive Summary</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Printable Executive Initiative Dossier / PDF Summary View */}
      {showPrintDossier && data?.project && (
        <ProjectPrintDossier
          project={data.project}
          milestones={data.milestones}
          squad={data.squad}
          tasks={data.tasks}
          audit_logs={data.audit_logs}
          telemetry={data.telemetry}
          isOpen={showPrintDossier}
          onClose={() => setShowPrintDossier(false)}
        />
      )}
    </div>,
    document.body
  );
};
