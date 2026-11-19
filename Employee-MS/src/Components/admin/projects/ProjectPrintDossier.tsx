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
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span
                style={{ fontSize: "9.5px" }}
                className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-800 border border-slate-300 uppercase tracking-wider"
              >
                🏢 {currentProject.department_name || "General Department"}
              </span>
              <span
                style={{ fontSize: "9.5px" }}
                className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider"
              >
                Priority: {currentProject.priority || "Medium"}
              </span>
              <span
                style={{ fontSize: "9.5px" }}
                className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider"
              >
                Status: {currentProject.status || "Active"}
              </span>
              {currentProject.health && (
                <span
                  style={{ fontSize: "9.5px" }}
                  className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${
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

            <div
              style={{ fontSize: "14px", lineHeight: "1.25", letterSpacing: "-0.01em" }}
              className="font-bold text-slate-900 mt-1 mb-1.5"
            >
              {currentProject.title || "Strategic Initiative"}
            </div>

            <div
              style={{ fontSize: "10.5px", lineHeight: "1.4" }}
              className="text-slate-600 bg-slate-50/80 px-3 py-2 rounded-lg border border-slate-200 mb-0"
            >
              {currentProject.description || "No strategic scope narrative specified."}
            </div>
          </div>

          {/* 3. EXECUTIVE BLOCKER ALERT (IF ACTIVE) */}
          {currentProject.is_blocked ? (
            <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 print-avoid-break">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  <div
                    style={{ fontSize: "11px", letterSpacing: "0.04em" }}
                    className="font-bold uppercase text-rose-900 m-0"
                  >
                    Active Executive Blocker Escalation
                  </div>
                </div>
                <span
                  style={{ fontSize: "9.5px" }}
                  className="px-2 py-0.2 rounded bg-rose-600 text-white font-bold uppercase tracking-wider"
                >
                  {currentProject.blocker_status
                    ? currentProject.blocker_status.replace("_", " ")
                    : "Critical Blocker"}
                </span>
              </div>
              <p
                style={{ fontSize: "10.5px", lineHeight: "1.35" }}
                className="text-rose-900 font-medium mb-1.5"
              >
                {currentProject.blocker_notes || "Executive intervention required to clear milestone path."}
              </p>
              <div
                style={{ fontSize: "9.5px" }}
                className="flex items-center gap-4 text-rose-700 font-semibold border-t border-rose-200 pt-1"
              >
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
            <div
              style={{ fontSize: "10.5px" }}
              className="p-2 sm:p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-300 text-emerald-900 flex items-center justify-between print-avoid-break"
            >
              <div className="flex items-center gap-2 font-semibold">
                <i className="bi bi-shield-check text-emerald-600 text-sm"></i>
                <span>Nominal Operational Health — No Active Blockers Recorded</span>
              </div>
              <span style={{ fontSize: "9.5px" }} className="text-emerald-700 font-mono font-bold uppercase">
                Schedule Clear
              </span>
            </div>
          )}

          {/* 4. EXECUTIVE METADATA 4-COLUMN MATRIX */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center py-2 px-3 bg-white border border-slate-200 rounded-xl shadow-2xs print-avoid-break">
            <div className="border-r border-slate-100 pr-2 text-left">
              <span
                style={{ fontSize: "8.5px", letterSpacing: "0.05em" }}
                className="text-slate-400 uppercase font-semibold tracking-wider block"
              >
                Lead Supervisor
              </span>
              <span
                style={{ fontSize: "12.5px" }}
                className="font-bold text-slate-900 block mt-0.5 truncate"
              >
                {currentProject.supervisor_name || "Unassigned"}
              </span>
              <span style={{ fontSize: "9.5px" }} className="text-slate-500 block truncate">
                {currentProject.supervisor_email || "N/A"}
              </span>
            </div>

            <div className="border-r border-slate-100 pr-2 text-left">
              <span
                style={{ fontSize: "8.5px", letterSpacing: "0.05em" }}
                className="text-slate-400 uppercase font-semibold tracking-wider block"
              >
                Timeline / Start Date
              </span>
              <span
                style={{ fontSize: "12.5px" }}
                className="font-bold text-slate-900 block mt-0.5 truncate"
              >
                {formatDate(currentProject.start_date || currentProject.created_at)}
              </span>
              <span style={{ fontSize: "9.5px" }} className="text-slate-500 block truncate">
                Target: {formatDate(currentProject.target_date)}
              </span>
            </div>

            <div className="border-r border-slate-100 pr-2 text-left">
              <span
                style={{ fontSize: "8.5px", letterSpacing: "0.05em" }}
                className="text-slate-400 uppercase font-semibold tracking-wider block"
              >
                Runway Remaining
              </span>
              <span
                style={{ fontSize: "12.5px" }}
                className="font-bold text-slate-900 block mt-0.5 truncate"
              >
                {currentProject.days_left !== undefined && currentProject.days_left !== null
                  ? `${currentProject.days_left} Days`
                  : "No Target Date"}
              </span>
              <span style={{ fontSize: "9.5px" }} className="font-semibold block truncate">
                {currentProject.is_overdue ? (
                  <span className="text-rose-600 font-bold">Schedule Overdue</span>
                ) : (
                  <span className="text-emerald-600">On Schedule</span>
                )}
              </span>
            </div>

            <div className="text-left">
              <span
                style={{ fontSize: "8.5px", letterSpacing: "0.05em" }}
                className="text-slate-400 uppercase font-semibold tracking-wider block"
              >
                Task Execution Velocity
              </span>
              <span
                style={{ fontSize: "12.5px" }}
                className="font-bold text-slate-900 block mt-0.5 truncate"
              >
                {currentProject.completed_tasks || 0} of {currentProject.total_tasks || 0} Closed
              </span>
              <span style={{ fontSize: "9.5px" }} className="font-semibold text-indigo-700 block truncate">
                {currentProject.progress_percentage || 0}% Completion
              </span>
            </div>
          </div>

          {/* 5. FINANCIAL TELEMETRY & CAPITAL BURN RATE HUD */}
          {activeSections.financials && (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 print-avoid-break">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                <div
                  style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                  className="font-bold text-slate-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
                >
                  <i className="bi bi-cash-stack text-emerald-600" style={{ fontSize: "12.6px" }}></i>
                  <span>Financial Telemetry & Capital Deployment</span>
                </div>
                <span
                  style={{ fontSize: "9.5px" }}
                  className={`font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
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

              <div className="grid grid-cols-4 gap-2 mb-2.5 text-center">
                <div className="py-1.5 px-2 bg-white rounded-lg border border-slate-200">
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.05em" }} className="font-bold text-slate-400 uppercase tracking-wider">
                    Allocated Budget
                  </div>
                  <div style={{ fontSize: "13.5px" }} className="font-bold text-slate-900 mt-0.5">
                    {formatCurrency(budget)}
                  </div>
                </div>
                <div className="py-1.5 px-2 bg-white rounded-lg border border-slate-200">
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.05em" }} className="font-bold text-slate-400 uppercase tracking-wider">
                    Actual Expenditure
                  </div>
                  <div style={{ fontSize: "13.5px" }} className="font-bold text-rose-700 mt-0.5">
                    {formatCurrency(expenses)}
                  </div>
                </div>
                <div className="py-1.5 px-2 bg-white rounded-lg border border-slate-200">
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.05em" }} className="font-bold text-slate-400 uppercase tracking-wider">
                    Remaining Runway
                  </div>
                  <div style={{ fontSize: "13.5px" }} className="font-bold text-emerald-700 mt-0.5">
                    {formatCurrency(remaining)}
                  </div>
                </div>
                <div className="py-1.5 px-2 bg-white rounded-lg border border-slate-200">
                  <div style={{ fontSize: "8.5px", letterSpacing: "0.05em" }} className="font-bold text-slate-400 uppercase tracking-wider">
                    Capital Burn %
                  </div>
                  <div style={{ fontSize: "13.5px" }} className="font-bold text-indigo-700 mt-0.5">
                    {burnPct}%
                  </div>
                </div>
              </div>

              {/* High Contrast Print Progress Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
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
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                <div
                  style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                  className="font-bold text-slate-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
                >
                  <i className="bi bi-flag-fill text-indigo-600" style={{ fontSize: "12px" }}></i>
                  <span>Phased Execution & Deliverable Milestones ({currentMilestones.length})</span>
                </div>
                <span
                  style={{ fontSize: "9.5px" }}
                  className="text-slate-400 font-normal whitespace-nowrap shrink-0"
                >
                  Sequential Phased Delivery
                </span>
              </div>

              {currentMilestones.length === 0 ? (
                <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                  No execution milestones scheduled for this initiative.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="px-2.5 py-1.5 border-r border-slate-200 w-10 text-center">#</th>
                        <th className="px-2.5 py-1.5 border-r border-slate-200">Milestone Title & Scope</th>
                        <th className="px-2.5 py-1.5 border-r border-slate-200 w-28">Target Date</th>
                        <th className="px-2.5 py-1.5 border-r border-slate-200 w-28">Owner</th>
                        <th className="px-2.5 py-1.5 border-r border-slate-200 w-20 text-center">Progress</th>
                        <th className="px-2.5 py-1.5 text-center w-22">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {currentMilestones.map((m, idx) => {
                        const completedCount = m.deliverables
                          ? m.deliverables.filter((d: any) => d.completed).length
                          : m.completed_deliverables || 0;
                        const totalCount = m.deliverables
                          ? m.deliverables.length
                          : m.total_deliverables || 0;
                        const pct = m.progress_percentage || (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

                        return (
                          <tr key={m.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                            <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="px-2.5 py-1.5 border-r border-slate-200">
                              <span className="font-bold text-slate-900 block leading-tight">{m.title}</span>
                              {m.description && (
                                <span className="text-[10px] text-slate-500 line-clamp-1 block mt-0.5">{m.description}</span>
                              )}
                              {totalCount > 0 && (
                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                  Checklist: {completedCount}/{totalCount} deliverables complete
                                </span>
                              )}
                            </td>
                            <td className="px-2.5 py-1.5 border-r border-slate-200 text-slate-700 whitespace-nowrap">
                              {formatDate(m.due_date)}
                            </td>
                            <td className="px-2.5 py-1.5 border-r border-slate-200 text-slate-700 truncate">
                              {m.owner_name || "Unassigned"}
                            </td>
                            <td className="px-2.5 py-1.5 border-r border-slate-200 text-center font-bold text-slate-800">
                              {pct}%
                            </td>
                            <td className="px-2.5 py-1.5 text-center">
                              <span
                                style={{ fontSize: "9.5px" }}
                                className={`inline-block px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  m.status === "completed"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : m.status === "in_progress"
                                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
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
                </div>
              )}
            </div>
          )}

          {/* 7. SQUAD RESOURCE ALLOCATION & ROSTER */}
          {activeSections.squad && (
            <div className="print-avoid-break">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                <div
                  style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                  className="font-bold text-slate-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
                >
                  <i className="bi bi-people-fill text-purple-600" style={{ fontSize: "12px" }}></i>
                  <span>Squad Resource Allocation & Key Personnel ({currentSquad.length})</span>
                </div>
                <span
                  style={{ fontSize: "9.5px" }}
                  className="text-slate-400 font-normal whitespace-nowrap shrink-0"
                >
                  Allocated Staff
                </span>
              </div>

              {currentSquad.length === 0 ? (
                <div className="p-3 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                  No squad members explicitly assigned.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {currentSquad.map((member, idx) => (
                    <div
                      key={member.id || idx}
                      className="p-2 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-start gap-2"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div style={{ fontSize: "11px" }} className="font-bold text-slate-900 truncate leading-tight">
                          {member.name}
                        </div>
                        <div style={{ fontSize: "9.5px" }} className="font-semibold text-indigo-700 truncate mt-0.5">
                          {member.squad_role || member.role_tag || member.role || "Squad Member"}
                        </div>
                        <div style={{ fontSize: "9px" }} className="text-slate-400 mt-0.5 truncate">
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
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                <div
                  style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                  className="font-bold text-slate-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
                >
                  <i className="bi bi-check2-square text-blue-600" style={{ fontSize: "12px" }}></i>
                  <span>Active Action Items & High-Priority Tasks ({currentTasks.length})</span>
                </div>
                <span
                  style={{ fontSize: "9.5px" }}
                  className="text-slate-400 font-normal whitespace-nowrap shrink-0"
                >
                  Priority Work Items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-2.5 py-1.5 border-r border-slate-200">Task Title</th>
                      <th className="px-2.5 py-1.5 border-r border-slate-200 w-28">Assignee</th>
                      <th className="px-2.5 py-1.5 border-r border-slate-200 w-24">Priority</th>
                      <th className="px-2.5 py-1.5 border-r border-slate-200 w-24 text-center">Status</th>
                      <th className="px-2.5 py-1.5 text-right w-24">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentTasks.slice(0, 8).map((task, idx) => (
                      <tr key={task.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                        <td className="px-2.5 py-1.5 border-r border-slate-200 font-medium text-slate-900">
                          {task.title}
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-slate-200 text-slate-700 truncate">
                          {task.assignee_name || "Unassigned"}
                        </td>
                        <td className="px-2.5 py-1.5 border-r border-slate-200 uppercase text-[9.5px] font-bold">
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
                        <td className="px-2.5 py-1.5 border-r border-slate-200 text-center uppercase">
                          <span
                            style={{ fontSize: "9.5px" }}
                            className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                              task.status === "completed"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : task.status === "in_progress"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {task.status ? task.status.replace("_", " ") : "Pending"}
                          </span>
                        </td>
                        <td className="px-2.5 py-1.5 text-right text-slate-600 whitespace-nowrap">
                          {formatDate(task.due_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 9. RECENT AUDIT TRAIL & GOVERNANCE LEDGER */}
          {activeSections.audit && currentAuditLogs.length > 0 && (
            <div className="print-avoid-break">
              <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                <div
                  style={{ fontSize: "11.6px", lineHeight: "1.2", letterSpacing: "0.04em" }}
                  className="font-bold text-slate-900 uppercase flex items-center gap-1.5 whitespace-nowrap"
                >
                  <i className="bi bi-shield-lock text-slate-700" style={{ fontSize: "12px" }}></i>
                  <span>Governance Ledger & Recent Change Log (Audit History)</span>
                </div>
                <span
                  style={{ fontSize: "9.5px" }}
                  className="text-slate-400 font-normal whitespace-nowrap shrink-0"
                >
                  Immutable Trail
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="px-2 py-1.5 border-r border-slate-200 w-32">Timestamp</th>
                      <th className="px-2 py-1.5 border-r border-slate-200 w-32">Performer</th>
                      <th className="px-2 py-1.5 border-r border-slate-200 w-28">Action</th>
                      <th className="px-2 py-1.5">Change Summary / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentAuditLogs.slice(0, 5).map((log, idx) => (
                      <tr key={log.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                        <td className="px-2 py-1.5 border-r border-slate-200 text-[10px] text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200 font-medium text-slate-800 truncate">
                          {log.actor_name || log.performed_by || "System"}
                        </td>
                        <td className="px-2 py-1.5 border-r border-slate-200 uppercase font-mono text-[9.5px] font-bold text-indigo-700">
                          {log.action_type || "MODIFIED"}
                        </td>
                        <td className="px-2 py-1.5 text-slate-700 text-[10px]">
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
