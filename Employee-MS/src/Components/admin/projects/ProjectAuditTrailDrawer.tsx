import React, { useState, useEffect, useMemo } from "react";
import api from "../../../api/axios";

export interface AuditTrailLogItem {
  id: number | string;
  user_id: number | string;
  action_type: string;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  details: string;
  performed_by?: string | null;
  performer_name?: string;
  performer_email?: string;
  performer_role?: string;
  performer_image?: string;
  created_at: string;
}

export interface ProjectAuditProject {
  id: number | string;
  project_code?: string;
  title: string;
  department_name?: string;
  supervisor_name?: string;
  status?: string;
  budget?: number | string;
  start_date?: string;
  target_date?: string;
  is_blocked?: boolean | number;
  blocker_status?: string;
  blocker_notes?: string;
}

export interface ProjectAuditTrailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectAuditProject | null;
}

type FilterCategory = "all" | "status" | "deadline" | "budget" | "supervisor" | "blocker";

export const ProjectAuditTrailDrawer: React.FC<ProjectAuditTrailDrawerProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [logs, setLogs] = useState<AuditTrailLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (isOpen && project?.id) {
      fetchAuditTrail();
    } else {
      setLogs([]);
      setError(null);
      setSelectedCategory("all");
      setSearchQuery("");
    }
  }, [isOpen, project?.id]);

  const fetchAuditTrail = async () => {
    if (!project?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/admin/projects/${project.id}/audit-trail`);
      if (res.data.status) {
        setLogs(res.data.audit_trail || []);
      } else {
        setError(res.data.error || "Failed to load project audit trail");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error connecting to audit service");
    } finally {
      setLoading(false);
    }
  };

  const categorizeLog = (log: AuditTrailLogItem): FilterCategory => {
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

  const categoryCounts = useMemo(() => {
    const counts = {
      all: logs.length,
      status: 0,
      deadline: 0,
      budget: 0,
      supervisor: 0,
      blocker: 0,
    };
    logs.forEach((log) => {
      const cat = categorizeLog(log);
      if (cat !== "all") {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedCategory !== "all" && categorizeLog(log) !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchAct = log.action_type.toLowerCase().includes(q);
        const matchDet = log.details.toLowerCase().includes(q);
        const matchPerf = (log.performer_name || "").toLowerCase().includes(q);
        const matchFld = (log.field_name || "").toLowerCase().includes(q);
        const matchOld = (log.old_value || "").toLowerCase().includes(q);
        const matchNew = (log.new_value || "").toLowerCase().includes(q);
        return matchAct || matchDet || matchPerf || matchFld || matchOld || matchNew;
      }
      return true;
    });
  }, [logs, selectedCategory, searchQuery]);

  const getLogVisual = (log: AuditTrailLogItem) => {
    const cat = categorizeLog(log);
    switch (cat) {
      case "budget":
        return {
          icon: "bi-cash-stack",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          nodeBg: "bg-emerald-600 text-white shadow-emerald-500/20",
          badge: "Budget Adjustment",
        };
      case "deadline":
        return {
          icon: "bi-calendar-event-fill",
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          nodeBg: "bg-amber-500 text-white shadow-amber-500/20",
          badge: "Deadline Modification",
        };
      case "supervisor":
        return {
          icon: "bi-person-badge-fill",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          nodeBg: "bg-purple-600 text-white shadow-purple-500/20",
          badge: "Supervisor Reassignment",
        };
      case "blocker":
        return {
          icon: "bi-shield-exclamation",
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          nodeBg: "bg-rose-600 text-white shadow-rose-500/20",
          badge: "Risk & Blocker Telemetry",
        };
      case "status":
      default:
        return {
          icon: "bi-arrow-repeat",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          nodeBg: "bg-indigo-600 text-white shadow-indigo-500/20",
          badge: "Lifecycle Transition",
        };
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        formatted: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        relative: getRelativeTimeString(d),
      };
    } catch {
      return { formatted: dateStr, relative: "" };
    }
  };

  const getRelativeTimeString = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const handleExportCSV = () => {
    if (!logs.length || !project) return;
    const headers = ["Log ID", "Date", "Action Type", "Field", "Previous Value", "New Value", "Details", "Performed By", "Email"];
    const rows = logs.map((l) => [
      l.id,
      new Date(l.created_at).toISOString(),
      `"${(l.action_type || "").replace(/"/g, '""')}"`,
      `"${(l.field_name || "").replace(/"/g, '""')}"`,
      `"${(l.old_value || "").replace(/"/g, '""')}"`,
      `"${(l.new_value || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      `"${(l.performer_name || l.performed_by || "Admin").replace(/"/g, '""')}"`,
      `"${(l.performer_email || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `project_audit_${project.project_code || "PRJ-" + project.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between gap-4 shrink-0 border-b border-indigo-900/40">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {project.project_code || `PRJ-${String(project.id).padStart(4, "0")}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <i className="bi bi-clock-history"></i>
                {logs.length} Recorded Changes
              </span>
              {project.department_name && (
                <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-white/10 text-white/80 border border-white/15">
                  🏢 {project.department_name}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white truncate mb-0.5">
              {project.title}
            </h3>
            <p className="text-xs text-slate-300 mb-0">
              Immutable historical change ledger & before/after differential audit
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer disabled:opacity-40"
              title="Export Audit Trail to CSV"
            >
              <i className="bi bi-file-earmark-spreadsheet"></i>
            </button>
            <button
              type="button"
              onClick={fetchAuditTrail}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Refresh Audit Ledger"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Close Drawer"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {/* Telemetry Quick Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Events</span>
              <span className="text-sm font-extrabold text-slate-800">{logs.length}</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-indigo-500 block tracking-wider">Status Shifts</span>
              <span className="text-sm font-extrabold text-indigo-700">{categoryCounts.status}</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">Deadlines</span>
              <span className="text-sm font-extrabold text-amber-700">{categoryCounts.deadline}</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">Budget Diffs</span>
              <span className="text-sm font-extrabold text-emerald-700">{categoryCounts.budget}</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Category Pills */}
        <div className="px-6 py-3.5 border-b border-slate-200 space-y-3 shrink-0 bg-white">
          {/* Search Box */}
          <div className="relative">
            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, performer name, values, or details..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Events ({categoryCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("status")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === "status"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <i className="bi bi-arrow-repeat"></i>
              Status ({categoryCounts.status})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("deadline")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === "deadline"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <i className="bi bi-calendar-event"></i>
              Deadlines ({categoryCounts.deadline})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("budget")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === "budget"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <i className="bi bi-cash-stack"></i>
              Budget ({categoryCounts.budget})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("supervisor")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === "supervisor"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <i className="bi bi-person-badge"></i>
              Supervisor ({categoryCounts.supervisor})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("blocker")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                selectedCategory === "blocker"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <i className="bi bi-shield-slash"></i>
              Blockers ({categoryCounts.blocker})
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Querying enterprise immutable audit trail...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-rose-600 text-base"></i>
              <span>{error}</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center text-2xl">
                <i className="bi bi-journal-x"></i>
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">No Audit Records Found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {searchQuery || selectedCategory !== "all"
                  ? "No change logs match your current filter criteria. Try resetting the filters."
                  : "No modifications have been recorded for this initiative yet."}
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {filteredLogs.map((log) => {
                const visual = getLogVisual(log);
                const { formatted, relative } = formatTimestamp(log.created_at);
                const hasDiff = (log.old_value !== null && log.old_value !== undefined) || (log.new_value !== null && log.new_value !== undefined);

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-md z-10 transition-transform group-hover:scale-110 ${visual.nodeBg}`}
                    >
                      <i className={`bi ${visual.icon} text-[11px]`}></i>
                    </div>

                    {/* Event Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all hover:border-slate-300">
                      {/* Top Header: Action Type, Badge & Timestamps */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${visual.bg}`}>
                            {log.action_type}
                          </span>
                          {log.field_name && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                              field: {log.field_name}
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-bold text-slate-700 block">
                            {formatted}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {relative}
                          </span>
                        </div>
                      </div>

                      {/* Before / After Diff Visual Component */}
                      {hasDiff && (
                        <div className="my-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/90 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <i className="bi bi-arrow-left-right"></i>
                            <span>Modification Difference</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900">
                              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                                <i className="bi bi-dash-circle-fill"></i> Previous
                              </span>
                              <div className="font-mono text-xs font-semibold truncate" title={log.old_value || "None"}>
                                {log.old_value || <span className="italic text-slate-400">None</span>}
                              </div>
                            </div>
                            <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                                <i className="bi bi-plus-circle-fill"></i> New
                              </span>
                              <div className="font-mono text-xs font-semibold truncate" title={log.new_value || "None"}>
                                {log.new_value || <span className="italic text-slate-400">None</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Event Narrative Details */}
                      <p className="text-xs text-slate-700 mb-3 leading-relaxed">
                        {log.details}
                      </p>

                      {/* Performer Footer Strip */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          {log.performer_image ? (
                            <img
                              src={log.performer_image}
                              alt={log.performer_name || "Performer"}
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {(log.performer_name || "A").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">
                              {log.performer_name || log.performed_by || "System Admin"}
                            </span>
                            {log.performer_role && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                {log.performer_role}
                              </span>
                            )}
                          </div>
                        </div>

                        {log.performer_email && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[200px]" title={log.performer_email}>
                            {log.performer_email}
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

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <i className="bi bi-shield-check text-emerald-600"></i>
            SOC2 & Enterprise Audit Logging Compliant
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-all cursor-pointer"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProjectAuditTrailDrawer;
