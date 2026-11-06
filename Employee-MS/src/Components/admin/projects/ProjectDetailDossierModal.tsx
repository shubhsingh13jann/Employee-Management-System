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
  onOpenMilestonesModal?: (projectId: number | string) => void;
}

export const ProjectDetailDossierModal: React.FC<ProjectDetailDossierModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onOpenMilestonesModal,
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
    } else {
      setData(null);
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const project = data?.project;
  const telemetry = data?.telemetry;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className="bg-slate-50 w-full max-w-5xl rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
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
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                <span>Budget Telemetry</span>
                <span className="font-bold text-emerald-700">
                  ${telemetry.budget_allocated.toLocaleString()}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800">
                ${telemetry.budget_spent.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">spent</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                ${(telemetry.budget_allocated - telemetry.budget_spent).toLocaleString()} runway available
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
          ) : (
            /* PLACEHOLDER FOR TABS 3, 4, 5 (Fleshed out in Commit 3) */
            <div className="py-10 text-center text-slate-400">
              <i className="bi bi-hourglass-split text-2xl mb-1 block text-indigo-500"></i>
              <p className="text-xs font-medium">Tab content active</p>
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
