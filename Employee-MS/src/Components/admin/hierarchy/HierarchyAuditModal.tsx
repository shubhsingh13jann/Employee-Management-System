import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

export interface AuditLogItem {
  id: number;
  action: "hierarchy_assigned" | "hierarchy_reassigned" | "hierarchy_unlinked" | "hierarchy_bulk_assigned" | string;
  details: {
    message?: string;
    supervisor_id?: number | string;
    manager_id?: number | string;
    employee_ids?: (number | string)[];
    count?: number;
    [key: string]: any;
  } | null;
  created_at: string;
  performed_by: number;
  performed_by_name?: string;
  performed_by_email?: string;
  employee_id?: number;
  user_id?: number;
  employee_name?: string;
  employee_email?: string;
}

interface HierarchyAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HierarchyAuditModal: React.FC<HierarchyAuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/hierarchy/audit-logs");
      if (res.data.status) {
        setLogs(res.data.logs || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load hierarchy audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmp = log.employee_name?.toLowerCase().includes(q) || log.employee_email?.toLowerCase().includes(q);
      const matchPerf = log.performed_by_name?.toLowerCase().includes(q) || log.performed_by_email?.toLowerCase().includes(q);
      const matchMsg = log.details?.message?.toLowerCase().includes(q);
      if (!matchEmp && !matchPerf && !matchMsg) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "hierarchy_assigned":
        return {
          label: "Assigned",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: "bi-person-plus-fill",
        };
      case "hierarchy_reassigned":
        return {
          label: "Reassigned",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: "bi-arrow-left-right",
        };
      case "hierarchy_unlinked":
        return {
          label: "Unlinked",
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: "bi-link-45deg",
        };
      case "hierarchy_bulk_assigned":
        return {
          label: "Bulk Onboard",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: "bi-people-fill",
        };
      default:
        return {
          label: action,
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: "bi-clock-history",
        };
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-lg shadow-md shrink-0">
              <i className="bi bi-clock-history"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white mb-0">
                  Hierarchy Audit Trail & Activity Log
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {logs.length} Recorded Events
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mb-0 font-normal">
                Verifiable historical timeline of reporting line assignments, reallocations, and unlinks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              title="Refresh Audit Logs"
            >
              <i className={`bi bi-arrow-clockwise text-sm ${loading ? "animate-spin" : ""}`}></i>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
            >
              <i className="bi bi-x-lg text-sm"></i>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            {[
              { id: "all", label: "All Activities" },
              { id: "hierarchy_assigned", label: "Assigned" },
              { id: "hierarchy_reassigned", label: "Reassigned" },
              { id: "hierarchy_bulk_assigned", label: "Bulk Onboard" },
              { id: "hierarchy_unlinked", label: "Unlinked" },
            ].map((pill) => (
              <button
                key={`audit-pill-${pill.id}`}
                type="button"
                onClick={() => setActionFilter(pill.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  actionFilter === pill.id
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Timeline Log Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 [scrollbar-width:thin]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium">Fetching verified reporting logs...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center">
              <i className="bi bi-exclamation-triangle-fill text-sm mr-1"></i>
              <span>{error}</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <i className="bi bi-journal-x text-3xl text-slate-300"></i>
              <p className="text-xs font-medium mb-0">No matching hierarchy audit events recorded.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((item) => {
                const badge = getActionBadge(item.action);
                const dateObj = new Date(item.created_at);
                const formattedDate = dateObj.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={`audit-event-${item.id}`}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-colors shadow-2xs flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border shrink-0 mt-0.5 ${badge.bg}`}>
                        <i className={`bi ${badge.icon}`}></i>
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          {item.employee_name && (
                            <span className="text-xs font-bold text-slate-900">
                              {item.employee_name}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            EMP-{String(item.employee_id || item.user_id || 1).padStart(4, "0")}
                          </span>
                        </div>

                        {/* Details Message */}
                        <p className="text-xs text-slate-700 mb-0 font-medium">
                          {item.details?.message || "Reporting relationship updated."}
                        </p>

                        {/* Performed by tag */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <i className="bi bi-shield-lock-fill text-indigo-500"></i>
                          <span>Executed by:</span>
                          <span className="font-semibold text-slate-700">
                            {item.performed_by_name || `Admin #${item.performed_by}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="shrink-0 text-right sm:self-start">
                      <span className="text-[11px] font-mono text-slate-500 block">
                        {formattedDate}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Ref #{item.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> events
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HierarchyAuditModal;
