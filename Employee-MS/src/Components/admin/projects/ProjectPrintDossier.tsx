import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import "./printDossier.css";

export interface PrintDossierProps {
  project: any;
  milestones?: any[];
  squad?: any[];
  tasks?: any[];
  audit_logs?: any[];
  telemetry?: any;
  isOpen: boolean;
  onClose: () => void;
  autoPrintOnOpen?: boolean;
}

export const ProjectPrintDossier: React.FC<PrintDossierProps> = ({
  project,
  milestones: initialMilestones,
  squad: initialSquad,
  tasks: initialTasks,
  audit_logs: initialAuditLogs,
  telemetry: initialTelemetry,
  isOpen,
  onClose,
  autoPrintOnOpen = false,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [dossierData, setDossierData] = useState<{
    project: any;
    milestones: any[];
    squad: any[];
    tasks: any[];
    audit_logs: any[];
    telemetry: any;
  }>({
    project: project || {},
    milestones: initialMilestones || [],
    squad: initialSquad || [],
    tasks: initialTasks || [],
    audit_logs: initialAuditLogs || [],
    telemetry: initialTelemetry || null,
  });

  // If passed project or sub-lists change, sync them
  useEffect(() => {
    if (project) {
      setDossierData((prev) => ({
        ...prev,
        project: project,
        milestones: initialMilestones || prev.milestones,
        squad: initialSquad || prev.squad,
        tasks: initialTasks || prev.tasks,
        audit_logs: initialAuditLogs || prev.audit_logs,
        telemetry: initialTelemetry || prev.telemetry,
      }));
    }
  }, [project, initialMilestones, initialSquad, initialTasks, initialAuditLogs, initialTelemetry]);

  // If sub-lists are empty and modal is opened, fetch full dossier payload
  useEffect(() => {
    if (!isOpen || !project?.id) return;

    const needsFetch =
      !initialMilestones?.length &&
      !initialSquad?.length &&
      !initialTasks?.length &&
      !initialAuditLogs?.length;

    if (needsFetch) {
      setLoading(true);
      api
        .get(`/api/admin/projects/${project.id}/dossier`)
        .then((res) => {
          if (res.data?.status && res.data?.data) {
            const d = res.data.data;
            setDossierData({
              project: d.project || project,
              milestones: d.milestones || [],
              squad: d.squad || [],
              tasks: d.tasks || [],
              audit_logs: d.audit_logs || [],
              telemetry: d.telemetry || null,
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load full project dossier for printing:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, project?.id, initialMilestones, initialSquad, initialTasks, initialAuditLogs]);

  // Auto trigger print if requested
  useEffect(() => {
    if (isOpen && autoPrintOnOpen && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrintOnOpen, loading]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentProject = dossierData.project || project || {};
  const currentTelemetry = dossierData.telemetry;
  const currentMilestones = dossierData.milestones || [];
  const currentSquad = dossierData.squad || [];
  const currentTasks = dossierData.tasks || [];
  const currentAuditLogs = dossierData.audit_logs || [];

  // Formatter helpers
  const formatCurrency = (val: number | string | undefined | null) => {
    const n = Number(val) || 0;
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        " " +
        d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return dateStr;
    }
  };

  // Financial calculations
  const budget = Number(currentProject.budget || currentProject.budget_allocated || currentTelemetry?.budget_allocated || 0);
  const expenses = Number(currentProject.total_expenses || currentTelemetry?.budget_spent || 0);
  const remaining = budget > expenses ? budget - expenses : 0;
  const burnPct = budget > 0 ? Math.min(100, Math.round((expenses / budget) * 100)) : 0;
  const isOverBudget = expenses > budget && budget > 0;

  const prjCode = `PRJ-${String(currentProject.id || "0").padStart(4, "0")}`;
  const printDocDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6 flex flex-col items-center">
      {/* Top Floating Action & Preview Toolbar (Hidden in Print) */}
      <div className="preview-toolbar no-print w-full max-w-[210mm] mb-4 bg-slate-900 border border-indigo-500/40 rounded-xl p-3 sm:p-4 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 text-lg">
            🖨️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                {prjCode}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white mb-0">
                Executive Initiative Dossier
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-0">
              Print-formatted briefing view • Optimized for A4 paper & PDF export
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold border border-indigo-400/30 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="bi bi-printer-fill text-sm"></i>
            <span>Print / Save as PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <i className="bi bi-x-lg text-xs"></i>
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Helpful Print Tip Card (Hidden in Print) */}
      <div className="no-print w-full max-w-[210mm] mb-4 p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 text-xs flex items-center gap-2">
        <i className="bi bi-info-circle-fill text-indigo-400 text-sm shrink-0"></i>
        <span>
          <strong>PDF Export Tip:</strong> In your browser print dialog, select Destination: <em>Save as PDF</em>, Layout: <em>Portrait</em>, and enable <em>Background graphics</em> for crisp executive styling.
        </span>
      </div>

      {/* Printable Paper Canvas (The actual A4 page container) */}
      <div className="printable-dossier-root a4-paper-preview rounded-xl p-8 sm:p-10 font-sans text-slate-900 leading-normal">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 font-medium text-sm">
              Assembling executive briefing telemetry...
            </p>
          </div>
        ) : (
          <>
            {/* 1. CORPORATE LETTERHEAD & MEMORANDUM CLASSIFICATION */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-900 text-white font-black text-xl flex items-center justify-center tracking-wider shadow-sm">
                    EMS
                  </div>
                  <div>
                    <h1 className="text-base font-black tracking-wider uppercase text-slate-900 m-0 leading-tight">
                      Enterprise Management System
                    </h1>
                    <div className="text-[11px] font-bold text-slate-600 tracking-wide uppercase mt-0.5">
                      Strategic Initiative Executive Dossier & Briefing Memorandum
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded tracking-widest uppercase">
                    {prjCode}
                  </div>
                  <div className="text-[10px] font-bold text-rose-700 tracking-wider uppercase mt-1">
                    CLASSIFICATION: STRICTLY CONFIDENTIAL
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Date: {printDocDate}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. INITIATIVE TITLE & STRATEGIC OBJECTIVE */}
            <div className="mb-6 print-avoid-break">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 uppercase tracking-wide">
                  🏢 {currentProject.department_name || "General Department"}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
                  Priority: {currentProject.priority || "Medium"}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                  Status: {currentProject.status || "Active"}
                </span>
                {currentProject.health && (
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide border ${
                      currentProject.health === "healthy"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : currentProject.health === "at_risk"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    Health: {currentProject.health.replace("_", " ")}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 mb-2 leading-tight">
                {currentProject.title || "Strategic Initiative"}
              </h2>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 mb-0">
                {currentProject.description || "No strategic scope narrative specified."}
              </p>
            </div>

            {/* 3. EXECUTIVE BLOCKER ALERT (IF ACTIVE) */}
            {currentProject.is_blocked ? (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 print-avoid-break">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-900 m-0">
                      Active Executive Blocker Escalation
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    {currentProject.blocker_status
                      ? currentProject.blocker_status.replace("_", " ")
                      : "Critical Blocker"}
                  </span>
                </div>
                <p className="text-xs text-rose-900 font-medium mb-2 leading-relaxed">
                  {currentProject.blocker_notes || "Executive intervention required to clear milestone path."}
                </p>
                <div className="flex items-center gap-4 text-[10px] text-rose-700 font-semibold border-t border-rose-200 pt-1.5">
                  <span>
                    Escalated: {formatDateTime(currentProject.blocker_escalated_at)}
                  </span>
                  {currentProject.blocker_flagged_by_name && (
                    <span>
                      Flagged By: {currentProject.blocker_flagged_by_name}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-300 text-emerald-900 flex items-center justify-between print-avoid-break text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <i className="bi bi-shield-check text-emerald-600 text-sm"></i>
                  <span>Nominal Operational Health — No Active Blockers Recorded</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono font-bold uppercase">
                  Schedule Clear
                </span>
              </div>
            )}

            {/* 4. EXECUTIVE METADATA 4-COLUMN MATRIX */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 print-avoid-break">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Lead Supervisor
                </div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentProject.supervisor_name || "Unassigned"}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentProject.supervisor_email || "N/A"}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Timeline / Start Date
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {formatDate(currentProject.start_date || currentProject.created_at)}
                </div>
                <div className="text-[10px] text-slate-500">
                  Target: {formatDate(currentProject.target_date)}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Runway Remaining
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {currentProject.days_left !== undefined && currentProject.days_left !== null
                    ? `${currentProject.days_left} Days`
                    : "No Target Date"}
                </div>
                <div className="text-[10px] font-semibold text-slate-500">
                  {currentProject.is_overdue ? (
                    <span className="text-rose-600 font-bold">Schedule Overdue</span>
                  ) : (
                    <span className="text-emerald-600">On Schedule</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Task Execution Velocity
                </div>
                <div className="text-xs font-bold text-slate-900">
                  {currentProject.completed_tasks || 0} of {currentProject.total_tasks || 0} Closed
                </div>
                <div className="text-[10px] font-semibold text-indigo-700">
                  {currentProject.progress_percentage || 0}% Completion
                </div>
              </div>
            </div>

            {/* 5. FINANCIAL TELEMETRY & CAPITAL BURN RATE HUD */}
            <div className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 print-avoid-break">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 m-0 flex items-center gap-2">
                  <span>💰 Financial Telemetry & Capital Deployment</span>
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    isOverBudget
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : burnPct > 80
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border-emerald-300"
                  }`}
                >
                  {isOverBudget
                    ? "Budget Overrun"
                    : burnPct > 80
                    ? "High Burn Rate"
                    : "Capital Runway Healthy"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Allocated Budget</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{formatCurrency(budget)}</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Actual Expenditure</div>
                  <div className="text-xs sm:text-sm font-black text-rose-700 mt-0.5">{formatCurrency(expenses)}</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Remaining Runway</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5">{formatCurrency(remaining)}</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Capital Burn %</div>
                  <div className="text-xs sm:text-sm font-black text-indigo-700 mt-0.5">{burnPct}%</div>
                </div>
              </div>

              {/* High Contrast Print Progress Bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                <div
                  className={`h-full ${
                    isOverBudget ? "bg-rose-600" : burnPct > 80 ? "bg-amber-500" : "bg-indigo-600"
                  }`}
                  style={{ width: `${Math.min(100, burnPct)}%` }}
                ></div>
              </div>
            </div>

            {/* 6. DELIVERABLE MILESTONES & PHASED EXECUTION TABLE */}
            <div className="mb-6 print-avoid-break">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 m-0">
                  🚩 Phased Execution & Deliverable Milestones ({currentMilestones.length})
                </h3>
              </div>

              {currentMilestones.length === 0 ? (
                <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                  No execution milestones scheduled for this initiative.
                </div>
              ) : (
                <table className="print-table w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 w-12 text-center">#</th>
                      <th className="p-2 border-r border-slate-300">Milestone Title & Scope</th>
                      <th className="p-2 border-r border-slate-300 w-28">Target Date</th>
                      <th className="p-2 border-r border-slate-300 w-28">Owner</th>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">Progress</th>
                      <th className="p-2 w-24 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMilestones.map((m, idx) => {
                      const completedCount = m.deliverables
                        ? m.deliverables.filter((d: any) => d.completed).length
                        : m.completed_deliverables || 0;
                      const totalCount = m.deliverables
                        ? m.deliverables.length
                        : m.total_deliverables || 0;
                      const pct = m.progress_percentage || (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

                      return (
                        <tr key={m.id || idx} className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200">
                            <div className="font-bold text-slate-900">{m.title}</div>
                            {m.description && (
                              <div className="text-[10px] text-slate-500 line-clamp-1">{m.description}</div>
                            )}
                            {totalCount > 0 && (
                              <div className="text-[9px] text-slate-500 mt-0.5">
                                Checklist: {completedCount}/{totalCount} deliverables complete
                              </div>
                            )}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                            {formatDate(m.due_date)}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700 truncate">
                            {m.owner_name || "Unassigned"}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-800">
                            {pct}%
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                m.status === "completed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : m.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {m.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* 7. SQUAD RESOURCE ALLOCATION & ROSTER */}
            <div className="mb-6 print-avoid-break">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                👥 Squad Resource Allocation & Key Personnel ({currentSquad.length})
              </h3>

              {currentSquad.length === 0 ? (
                <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                  No squad members explicitly assigned.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {currentSquad.map((member, idx) => (
                    <div
                      key={member.id || idx}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {member.name}
                        </div>
                        <div className="text-[10px] font-semibold text-indigo-700 truncate">
                          {member.squad_role || member.role_tag || member.role || "Squad Member"}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 truncate">
                          Tasks: {member.assigned_tasks_count || 0} Assigned • {member.completed_tasks_count || 0} Closed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 8. CRITICAL & UPCOMING TASKS (Top 5-8 tasks) */}
            {currentTasks.length > 0 && (
              <div className="mb-6 print-avoid-break">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                  📌 Active Action Items & High-Priority Tasks
                </h3>
                <table className="print-table w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300">Task Title</th>
                      <th className="p-2 border-r border-slate-300 w-28">Assignee</th>
                      <th className="p-2 border-r border-slate-300 w-24">Priority</th>
                      <th className="p-2 border-r border-slate-300 w-24 text-center">Status</th>
                      <th className="p-2 w-28 text-right">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTasks.slice(0, 8).map((task, idx) => (
                      <tr key={task.id || idx} className="border-b border-slate-200">
                        <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                          {task.title}
                        </td>
                        <td className="p-2 border-r border-slate-200 text-slate-700 truncate">
                          {task.assignee_name || "Unassigned"}
                        </td>
                        <td className="p-2 border-r border-slate-200 uppercase text-[10px] font-bold">
                          <span
                            className={
                              task.priority === "critical"
                                ? "text-rose-600 font-black"
                                : task.priority === "high"
                                ? "text-amber-600 font-bold"
                                : "text-slate-600"
                            }
                          >
                            {task.priority || "Medium"}
                          </span>
                        </td>
                        <td className="p-2 border-r border-slate-200 text-center uppercase text-[9px] font-bold">
                          <span
                            className={`px-1.5 py-0.5 rounded ${
                              task.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {task.status ? task.status.replace("_", " ") : "Pending"}
                          </span>
                        </td>
                        <td className="p-2 text-right text-slate-600 whitespace-nowrap">
                          {formatDate(task.due_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 9. RECENT AUDIT TRAIL & GOVERNANCE LEDGER (Last 5 events) */}
            {currentAuditLogs.length > 0 && (
              <div className="mb-6 print-avoid-break">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                  📜 Governance Ledger & Recent Change Log (Audit History)
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="print-table w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <th className="p-1.5 border-r border-slate-200 w-32">Timestamp</th>
                        <th className="p-1.5 border-r border-slate-200 w-32">Performer</th>
                        <th className="p-1.5 border-r border-slate-200 w-28">Action</th>
                        <th className="p-1.5">Change Summary / Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAuditLogs.slice(0, 5).map((log, idx) => (
                        <tr key={log.id || idx} className="border-b border-slate-200">
                          <td className="p-1.5 border-r border-slate-200 text-[10px] text-slate-500 whitespace-nowrap">
                            {formatDateTime(log.created_at)}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 font-medium text-slate-800 truncate">
                            {log.actor_name || log.performed_by || "System"}
                          </td>
                          <td className="p-1.5 border-r border-slate-200 uppercase font-mono text-[9px] font-bold text-indigo-700">
                            {log.action_type || "MODIFIED"}
                          </td>
                          <td className="p-1.5 text-slate-700 text-[10px]">
                            {log.details || `Updated ${log.field_name || "project record"}`}
                            {log.old_value && log.new_value && (
                              <span className="text-slate-500 ml-1">
                                ({log.old_value} → {log.new_value})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 10. FORMAL EXECUTIVE SIGN-OFF BLOCK */}
            <div className="border-t-2 border-slate-900 pt-4 mt-8 print-avoid-break">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-6 text-center">
                Executive Review & Governance Authorization
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="border-t border-slate-400 pt-2">
                  <div className="text-xs font-bold text-slate-900">Executive Sponsor</div>
                  <div className="text-[10px] text-slate-500">Corporate Strategy / VP</div>
                  <div className="text-[9px] text-slate-400 mt-4">Signature & Date: ___________________</div>
                </div>

                <div className="border-t border-slate-400 pt-2">
                  <div className="text-xs font-bold text-slate-900">
                    {currentProject.department_name ? `${currentProject.department_name} Head` : "Department Head"}
                  </div>
                  <div className="text-[10px] text-slate-500">Division Operations Director</div>
                  <div className="text-[9px] text-slate-400 mt-4">Signature & Date: ___________________</div>
                </div>

                <div className="border-t border-slate-400 pt-2">
                  <div className="text-xs font-bold text-slate-900">
                    {currentProject.supervisor_name || "Lead Supervisor"}
                  </div>
                  <div className="text-[10px] text-slate-500">Initiative Technical Lead</div>
                  <div className="text-[9px] text-slate-400 mt-4">Signature & Date: ___________________</div>
                </div>
              </div>

              {/* Security Footer Notice */}
              <div className="text-center text-[9px] text-slate-400 mt-6 border-t border-slate-200 pt-3">
                Employee Management System Enterprise Edition • PRJ Internal Ledger Document • Generated on {printDocDate}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectPrintDossier;
