import React, { useState, useEffect } from "react";
import api from "../../../api/axios";
import {
  UniversalPrintStudio,
  PrintScopeOption,
  PrintSectionToggle,
  PrintDossierHeader,
  PrintDossierFooter,
} from "../../custom/print";

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
  const [scope, setScope] = useState<string>("all");
  const [activeSections, setActiveSections] = useState<Record<string, boolean>>({
    financials: true,
    milestones: true,
    squad: true,
    tasks: true,
    audit: true,
  });

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

  if (!isOpen) return null;

  const currentProject = dossierData.project || project || {};
  const currentTelemetry = dossierData.telemetry;
  const rawMilestones = dossierData.milestones || [];
  const rawSquad = dossierData.squad || [];
  const rawTasks = dossierData.tasks || [];
  const rawAuditLogs = dossierData.audit_logs || [];

  // Filter tasks and milestones based on selected scope
  const currentTasks = scope === "active"
    ? rawTasks.filter((t: any) => t.status !== "completed")
    : rawTasks;

  const currentMilestones = scope === "active"
    ? rawMilestones.filter((m: any) => m.status !== "completed")
    : rawMilestones;

  const currentSquad = rawSquad;
  const currentAuditLogs = rawAuditLogs;

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

  const scopes: PrintScopeOption[] = [
    {
      id: "all",
      label: "Full Dossier",
      icon: "bi bi-journal-text",
      count: rawMilestones.length + rawTasks.length,
    },
    {
      id: "active",
      label: "Active Focus",
      icon: "bi bi-funnel",
      count: rawTasks.filter((t: any) => t.status !== "completed").length,
    },
  ];

  const sections: PrintSectionToggle[] = [
    {
      id: "financials",
      label: "Financial Telemetry & Burn",
      description: "Allocated budget, expenditures, burn rate, and capital runway",
      icon: "bi bi-cash-stack",
      defaultChecked: true,
    },
    {
      id: "milestones",
      label: "Phased Execution Milestones",
      description: "Deliverables roadmap and phase progress percentages",
      icon: "bi bi-flag-fill",
      count: rawMilestones.length,
      defaultChecked: true,
    },
    {
      id: "squad",
      label: "Squad Allocation Roster",
      description: "Assigned personnel, squad roles, and workload",
      icon: "bi bi-people-fill",
      count: rawSquad.length,
      defaultChecked: true,
    },
    {
      id: "tasks",
      label: "Work Breakdown Tasks",
      description: "Action items with assignees, priorities, and deadlines",
      icon: "bi bi-list-check",
      count: rawTasks.length,
      defaultChecked: true,
    },
    {
      id: "audit",
      label: "Governance Audit Ledger",
      description: "Chronological ledger of project modifications and diffs",
      icon: "bi bi-clock-history",
      count: rawAuditLogs.length,
      defaultChecked: true,
    },
  ];

  return (
    <UniversalPrintStudio
      isOpen={isOpen}
      onClose={onClose}
      title="Executive Initiative Dossier"
      subtitle="Print-formatted briefing view • Optimized for A4 paper & PDF export"
      icon="bi bi-printer-fill"
      documentId={prjCode}
      scopes={scopes}
      activeScope={scope}
      onScopeChange={(s) => setScope(s)}
      sections={sections}
      activeSections={activeSections}
      onToggleSection={(secId, enabled) =>
        setActiveSections((prev) => ({ ...prev, [secId]: enabled }))
      }
      defaultPageSize="a4"
      defaultOrientation="portrait"
      defaultMargins="standard"
      defaultHeaderStyle="default"
      loading={loading}
      loadingMessage="Assembling executive briefing telemetry..."
      renderContent={({
        pageSize,
        orientation,
        margins,
        headerStyle,
        currentDate,
        currentTime,
      }) => (
        <div className="space-y-6">
          {/* 1. Header (Corporate / Minimal / Executive) */}
          <PrintDossierHeader
            headerStyle={headerStyle}
            systemTitle="Enterprise Management System"
            documentTitle="Strategic Initiative Executive Dossier & Briefing Memorandum"
            documentSubtitle={`${currentProject.department_name || "Enterprise"} • Priority: ${currentProject.priority || "Medium"}`}
            documentId={prjCode}
            classification="CONFIDENTIAL BRIEFING"
            scopeDesc={scope === "active" ? "Active Focus" : "Full Initiative Dossier"}
            pageSize={pageSize.toUpperCase()}
            orientation={orientation.charAt(0).toUpperCase() + orientation.slice(1)}
            currentDate={currentDate}
            currentTime={currentTime}
            metadataItems={[
              { label: "Status", value: currentProject.status || "Active", isHighlight: true },
              { label: "Health", value: currentProject.health ? currentProject.health.replace("_", " ") : "Healthy" },
            ]}
          />

          {/* 2. INITIATIVE TITLE & STRATEGIC OBJECTIVE */}
          <div className="print-avoid-break">
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
            <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 print-avoid-break">
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
            <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-300 text-emerald-900 flex items-center justify-between print-avoid-break text-xs">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-avoid-break">
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
          {activeSections.financials && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 print-avoid-break">
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
          )}

          {/* 6. DELIVERABLE MILESTONES & PHASED EXECUTION TABLE */}
          {activeSections.milestones && (
            <div className="print-avoid-break">
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
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
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
          )}

          {/* 7. SQUAD RESOURCE ALLOCATION & ROSTER */}
          {activeSections.squad && (
            <div className="print-avoid-break">
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
          )}

          {/* 8. CRITICAL & UPCOMING TASKS */}
          {activeSections.tasks && currentTasks.length > 0 && (
            <div className="print-avoid-break">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                📌 Active Action Items & High-Priority Tasks
              </h3>
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
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

          {/* 9. RECENT AUDIT TRAIL & GOVERNANCE LEDGER */}
          {activeSections.audit && currentAuditLogs.length > 0 && (
            <div className="print-avoid-break">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                📜 Governance Ledger & Recent Change Log (Audit History)
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
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

          {/* 10. FORMAL EXECUTIVE SIGN-OFF & AUDIT FOOTER */}
          <PrintDossierFooter
            showSignatures={true}
            complianceText="Employee Management System Enterprise Edition • Strategic Initiatives Governance Module"
            confidentialNotice="Internal Executive Memorandum"
            documentDate={currentDate}
            signatures={{
              preparer: currentProject.supervisor_name || "Lead Supervisor",
              preparerTitle: "Initiative Technical Lead",
              reviewer: currentProject.department_name ? `${currentProject.department_name} Head` : "Department Head",
              reviewerTitle: "Division Operations Director",
              approver: "Executive Sponsor",
              approverTitle: "Managing Director / Corporate VP",
            }}
          />
        </div>
      )}
    />
  );
};

export default ProjectPrintDossier;
