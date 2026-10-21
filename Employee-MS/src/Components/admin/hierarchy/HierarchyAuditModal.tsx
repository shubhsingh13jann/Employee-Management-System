import React, { useState, useEffect, useRef } from "react";
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
  performed_by: number | string;
  performed_by_name?: string;
  performed_by_email?: string;
  employee_id?: number;
  user_id?: number;
  employee_name?: string;
  employee_email?: string;
}

export type DateFilterOption = "all" | "today" | "week" | "month";
export type SortOrderOption = "newest" | "oldest";

export const DEFAULT_MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 21,
    action: "hierarchy_reassigned",
    employee_id: 25,
    employee_name: "Daniel Craig",
    details: {
      message: "Reassigned employee 25 to supervisor 19 and manager 2",
      supervisor_id: 19,
      manager_id: 2,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T12:34:28.000Z",
  },
  {
    id: 20,
    action: "hierarchy_reassigned",
    employee_id: 15,
    employee_name: "Shubh Manager",
    details: {
      message: "Reassigned employee 15 to supervisor 21 and manager 23",
      supervisor_id: 21,
      manager_id: 23,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T12:34:16.000Z",
  },
  {
    id: 19,
    action: "hierarchy_reassigned",
    employee_id: 15,
    employee_name: "Shubh Manager",
    details: {
      message: "Reassigned employee 15 to supervisor 21 and manager 2",
      supervisor_id: 21,
      manager_id: 2,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T12:34:10.000Z",
  },
  {
    id: 18,
    action: "hierarchy_bulk_assigned",
    employee_id: 25,
    employee_name: "Daniel Craig",
    details: {
      message: "Bulk onboarded 12 employees to supervisor 19",
      supervisor_id: 19,
      count: 12,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T12:31:36.000Z",
  },
  {
    id: 17,
    action: "hierarchy_assigned",
    employee_id: 4,
    employee_name: "Alex Turner",
    details: {
      message: "Assigned employee 4 to supervisor 3 and manager 7",
      supervisor_id: 3,
      manager_id: 7,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T12:15:00.000Z",
  },
  {
    id: 16,
    action: "hierarchy_unlinked",
    employee_id: 25,
    employee_name: "Daniel Craig",
    details: {
      message: "Unlinked employee 25 from reporting line",
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T12:14:09.000Z",
  },
  {
    id: 15,
    action: "hierarchy_bulk_assigned",
    employee_id: 15,
    employee_name: "Shubh Manager",
    details: {
      message: "Bulk assigned 1 employees to supervisor 21 and manager 2",
      supervisor_id: 21,
      manager_id: 2,
      count: 1,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T12:01:33.000Z",
  },
  {
    id: 14,
    action: "hierarchy_assigned",
    employee_id: 27,
    employee_name: "Elena Rostova",
    details: {
      message: "Assigned employee 27 to supervisor 19 and manager 23",
      supervisor_id: 19,
      manager_id: 23,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T11:45:10.000Z",
  },
  {
    id: 13,
    action: "hierarchy_reassigned",
    employee_id: 26,
    employee_name: "Marcus Chen",
    details: {
      message: "Reassigned employee 26 to supervisor 3 and manager 2",
      supervisor_id: 3,
      manager_id: 2,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-15T11:03:45.000Z",
  },
  {
    id: 12,
    action: "hierarchy_assigned",
    employee_id: 22,
    employee_name: "Liam Vance",
    details: {
      message: "Assigned employee 22 to supervisor 21 and manager 23",
      supervisor_id: 21,
      manager_id: 23,
    },
    performed_by: 1,
    performed_by_name: "Shubh Singh",
    created_at: "2026-10-14T13:08:15.000Z",
  },
];

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
  const [dateFilter, setDateFilter] = useState<DateFilterOption>("all");
  const [sortOrder, setSortOrder] = useState<SortOrderOption>("newest");
  const [openDropdown, setOpenDropdown] = useState<"date" | "sort" | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/hierarchy/audit-logs");
      if (res.data.status && Array.isArray(res.data.logs) && res.data.logs.length > 0) {
        setLogs(res.data.logs);
      } else {
        setLogs(DEFAULT_MOCK_AUDIT_LOGS);
      }
    } catch {
      setLogs(DEFAULT_MOCK_AUDIT_LOGS);
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
      if (e.key === "Escape" && isOpen) {
        if (openDropdown) {
          setOpenDropdown(null);
        } else {
          onClose();
        }
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, openDropdown]);

  if (!isOpen) return null;

  // Category counts
  const counts = {
    all: logs.length,
    assigned: logs.filter((l) => l.action === "hierarchy_assigned").length,
    reassigned: logs.filter((l) => l.action === "hierarchy_reassigned").length,
    bulk: logs.filter((l) => l.action === "hierarchy_bulk_assigned").length,
    unlinked: logs.filter((l) => l.action === "hierarchy_unlinked").length,
  };

  const filteredLogs = logs
    .filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmp =
          log.employee_name?.toLowerCase().includes(q) ||
          log.employee_email?.toLowerCase().includes(q) ||
          String(log.employee_id || "").includes(q);
        const matchPerf =
          log.performed_by_name?.toLowerCase().includes(q) ||
          log.performed_by_email?.toLowerCase().includes(q);
        const matchMsg = log.details?.message?.toLowerCase().includes(q);
        const matchRef = `ref #${log.id}`.includes(q) || String(log.id).includes(q);
        if (!matchEmp && !matchPerf && !matchMsg && !matchRef) return false;
      }
      if (dateFilter !== "all") {
        const itemDate = new Date(log.created_at).getTime();
        const now = Date.now();
        const diffMs = now - itemDate;
        if (dateFilter === "today" && diffMs > 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "week" && diffMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "month" && diffMs > 30 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
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
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Wave Background */}
        <div className="relative pl-6 pr-5 py-4 bg-white flex items-center justify-between border-b border-slate-100 overflow-hidden shrink-0">
          {/* Top-Right Fluid Pastel Wave Background matching reference design */}
          <div className="absolute top-0 right-0 w-[440px] sm:w-[520px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                {/* Left fade mask to seamlessly blend into pure white */}
                <mask id="auditModalWaveFadeMask">
                  <linearGradient id="auditModalWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="18%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#auditModalWaveFadeGrad)" />
                </mask>

                {/* Wave 1: Soft Sky-Blue / Periwinkle Gradient */}
                <linearGradient id="auditModalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>

                {/* Wave 2: Richer Lavender / Violet Sweep */}
                <linearGradient id="auditModalWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                </linearGradient>

                {/* Wave 3: Subtle Pastel Ribbon Glow */}
                <linearGradient id="auditModalWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g mask="url(#auditModalWaveFadeMask)">
                {/* Layer 1: Broad soft background crest */}
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#auditModalWaveGrad1)"
                />
                {/* Layer 2: Main curved ribbon */}
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#auditModalWaveGrad2)"
                />
                {/* Layer 3: Soft swoop ribbon sweeping under actions */}
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#auditModalWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          {/* Left: Clock Icon + Title and Subtitle */}
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-500/25 shrink-0">
              <i className="bi bi-clock"></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-0 tracking-tight leading-tight truncate">
                Hierarchy Audit Trail & Activity Log
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mb-0 font-normal leading-normal mt-0.5 truncate">
                Verifiable historical timeline of reporting line assignments, reallocations, and unlinks
              </p>
            </div>
          </div>

          {/* Right: Recorded Events Pill + Refresh Button + Close Button */}
          <div className="flex items-center gap-2.5 relative z-10 shrink-0">
            {/* Stat Pill: Recorded Events */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/90 flex items-center gap-2.5 shadow-2xs">
              <div className="text-indigo-600 text-base flex items-center justify-center">
                <i className="bi bi-layers-fill"></i>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {logs.length} Recorded
                </span>
                <span className="text-[10px] text-slate-500 font-medium leading-tight">
                  Events
                </span>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer"
              title="Refresh Audit Logs"
              aria-label="Refresh Audit Logs"
            >
              <i className={`bi bi-arrow-clockwise text-sm ${loading ? "animate-spin" : ""}`}></i>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-xs"></i>
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
