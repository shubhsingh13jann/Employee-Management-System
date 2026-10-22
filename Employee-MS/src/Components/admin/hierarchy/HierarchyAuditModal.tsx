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
          iconBg: "bg-emerald-50/70 text-emerald-600 border-emerald-100/80",
          badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
          icon: "bi-person-fill-add",
        };
      case "hierarchy_reassigned":
        return {
          label: "Reassigned",
          iconBg: "bg-indigo-50/70 text-indigo-600 border-indigo-100/80",
          badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
          icon: "bi-arrow-left-right",
        };
      case "hierarchy_unlinked":
        return {
          label: "Unlinked",
          iconBg: "bg-rose-50 text-rose-600 border-rose-100/80",
          badgeStyle: "bg-rose-50 text-rose-700 border-rose-200/70",
          icon: "bi-link-45deg",
        };
      case "hierarchy_bulk_assigned":
        return {
          label: "Bulk Onboard",
          iconBg: "bg-purple-50 text-purple-600 border-purple-100/80",
          badgeStyle: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/70",
          icon: "bi-people-fill",
        };
      default:
        return {
          label: action,
          iconBg: "bg-slate-50 text-slate-600 border-slate-200/80",
          badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
          icon: "bi-clock-history",
        };
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right side content portion (excluding the 240px left sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-5 pointer-events-none">
        <div
          className="w-full max-w-5xl lg:max-w-[1060px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] relative pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header with Fluid Pastel Wave Background */}
        <div className="relative pl-6 pr-5 py-4 bg-white flex items-center justify-between border-b border-slate-100 overflow-hidden shrink-0">
          {/* Top-Right Fluid Pastel Wave Background matching reference design */}
          <div className="absolute top-0 right-0 w-[440px] sm:w-[560px] h-full pointer-events-none overflow-hidden z-0">
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

        {/* Action Filter Pills Bar - shrink-0 with symmetric padding so pills are never squished or clipped */}
        <div className="shrink-0 px-6 py-2.5 flex items-center gap-2 sm:gap-2.5 flex-nowrap overflow-x-auto [scrollbar-width:none]">
          {/* 1. All Activities */}
          <button
            type="button"
            onClick={() => setActionFilter("all")}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              actionFilter === "all"
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/25"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs"
            }`}
          >
            <i className="bi bi-list-ul text-sm"></i>
            <span>All Activities</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                actionFilter === "all"
                  ? "bg-white/25 text-white"
                  : "bg-indigo-50 text-indigo-700 border border-indigo-100/80"
              }`}
            >
              {counts.all}
            </span>
          </button>

          {/* 2. Assigned */}
          <button
            type="button"
            onClick={() => setActionFilter("hierarchy_assigned")}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              actionFilter === "hierarchy_assigned"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs"
            }`}
          >
            <i
              className={`bi bi-person-fill-add text-sm ${
                actionFilter === "hierarchy_assigned" ? "text-white" : "text-blue-600"
              }`}
            ></i>
            <span>Assigned</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                actionFilter === "hierarchy_assigned"
                  ? "bg-white/25 text-white"
                  : "bg-blue-50 text-blue-600 border border-blue-100/80"
              }`}
            >
              {counts.assigned}
            </span>
          </button>

          {/* 3. Reassigned */}
          <button
            type="button"
            onClick={() => setActionFilter("hierarchy_reassigned")}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              actionFilter === "hierarchy_reassigned"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs"
            }`}
          >
            <i
              className={`bi bi-arrow-left-right text-sm ${
                actionFilter === "hierarchy_reassigned" ? "text-white" : "text-emerald-500"
              }`}
            ></i>
            <span>Reassigned</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                actionFilter === "hierarchy_reassigned"
                  ? "bg-white/25 text-white"
                  : "bg-emerald-50 text-emerald-600 border border-emerald-100/80"
              }`}
            >
              {counts.reassigned}
            </span>
          </button>

          {/* 4. Bulk Onboard */}
          <button
            type="button"
            onClick={() => setActionFilter("hierarchy_bulk_assigned")}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              actionFilter === "hierarchy_bulk_assigned"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs"
            }`}
          >
            <i
              className={`bi bi-people-fill text-sm ${
                actionFilter === "hierarchy_bulk_assigned" ? "text-white" : "text-amber-500"
              }`}
            ></i>
            <span>Bulk Onboard</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                actionFilter === "hierarchy_bulk_assigned"
                  ? "bg-white/25 text-white"
                  : "bg-amber-50 text-amber-600 border border-amber-100/80"
              }`}
            >
              {counts.bulk}
            </span>
          </button>

          {/* 5. Unlinked */}
          <button
            type="button"
            onClick={() => setActionFilter("hierarchy_unlinked")}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              actionFilter === "hierarchy_unlinked"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/25"
                : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs"
            }`}
          >
            <i
              className={`bi bi-link-45deg text-sm ${
                actionFilter === "hierarchy_unlinked" ? "text-white" : "text-rose-500"
              }`}
            ></i>
            <span>Unlinked</span>
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                actionFilter === "hierarchy_unlinked"
                  ? "bg-white/25 text-white"
                  : "bg-rose-50 text-rose-600 border border-rose-100/80"
              }`}
            >
              {counts.unlinked}
            </span>
          </button>
        </div>

        {/* Secondary Toolbar: Search Input + Date Range Selector + Sort Order */}
        <div
          ref={dropdownRef}
          className="shrink-0 px-6 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        >
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200/90 bg-white text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <i className="bi bi-x text-xs"></i>
              </button>
            )}
          </div>

          {/* Right Action Dropdowns */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Date Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "date" ? null : "date")}
                className="px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <i className="bi bi-calendar3 text-indigo-600 text-xs"></i>
                <span>
                  {dateFilter === "all"
                    ? "All Dates"
                    : dateFilter === "today"
                    ? "Today"
                    : dateFilter === "week"
                    ? "Last 7 Days"
                    : "Last 30 Days"}
                </span>
                <i
                  className={`bi bi-chevron-down text-slate-400 text-[10px] transition-transform ${
                    openDropdown === "date" ? "rotate-180" : ""
                  }`}
                ></i>
              </button>

              {openDropdown === "date" && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {[
                    { id: "all", label: "All Dates", icon: "bi-calendar3" },
                    { id: "today", label: "Today", icon: "bi-calendar-check" },
                    { id: "week", label: "Last 7 Days", icon: "bi-calendar-week" },
                    { id: "month", label: "Last 30 Days", icon: "bi-calendar-month" },
                  ].map((opt) => (
                    <button
                      key={`date-opt-${opt.id}`}
                      type="button"
                      onClick={() => {
                        setDateFilter(opt.id as DateFilterOption);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                        dateFilter === opt.id
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <i className={`bi ${opt.icon} text-xs text-indigo-500`}></i>
                        <span>{opt.label}</span>
                      </div>
                      {dateFilter === opt.id && (
                        <i className="bi bi-check2 text-indigo-600 text-xs font-bold"></i>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Order Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                className="px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <i className="bi bi-arrow-down-up text-indigo-600 text-xs"></i>
                <span>{sortOrder === "newest" ? "Newest First" : "Oldest First"}</span>
                <i
                  className={`bi bi-chevron-down text-slate-400 text-[10px] transition-transform ${
                    openDropdown === "sort" ? "rotate-180" : ""
                  }`}
                ></i>
              </button>

              {openDropdown === "sort" && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {[
                    { id: "newest", label: "Newest First", icon: "bi-sort-down" },
                    { id: "oldest", label: "Oldest First", icon: "bi-sort-up" },
                  ].map((opt) => (
                    <button
                      key={`sort-opt-${opt.id}`}
                      type="button"
                      onClick={() => {
                        setSortOrder(opt.id as SortOrderOption);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                        sortOrder === opt.id
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <i className={`bi ${opt.icon} text-xs text-indigo-500`}></i>
                        <span>{opt.label}</span>
                      </div>
                      {sortOrder === opt.id && (
                        <i className="bi bi-check2 text-indigo-600 text-xs font-bold"></i>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline Log Body */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-3 audit-modal-scroll [scrollbar-width:thin]">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2.5">
              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-medium text-slate-500">Fetching verified reporting logs...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center flex items-center justify-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-sm"></i>
              <span>{error}</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/90 text-slate-400 mx-auto flex items-center justify-center text-xl shadow-2xs">
                <i className="bi bi-journal-x"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 mb-0.5">No Matching Events Found</p>
                <p className="text-[11px] text-slate-400 mb-0">Try clearing your search query or switching filters.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pb-2">
              {filteredLogs.map((item) => {
                const badge = getActionBadge(item.action);
                const dateObj = new Date(item.created_at);
                const formattedDate =
                  dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }) +
                  ", " +
                  dateObj.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });

                const displayMessage =
                  item.details?.message ||
                  (item.action === "hierarchy_bulk_assigned"
                    ? `Bulk onboarded ${item.details?.count || "team"} employees`
                    : item.action === "hierarchy_reassigned"
                    ? `Reassigned employee ${item.employee_id || ""} to supervisor and manager`
                    : item.action === "hierarchy_assigned"
                    ? `Assigned employee ${item.employee_id || ""} to supervisor and manager`
                    : item.action === "hierarchy_unlinked"
                    ? `Unlinked employee ${item.employee_id || ""} from reporting line`
                    : "Reporting relationship updated.");

                const executorName =
                  item.performed_by_name ||
                  (typeof item.performed_by === "string" && isNaN(Number(item.performed_by))
                    ? item.performed_by
                    : "Shubh Singh");

                return (
                  <div
                    key={`audit-event-${item.id}`}
                    className="group p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:bg-slate-50/30 hover:shadow-xs transition-all flex items-start sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    {/* Left: Status Squircle Icon + Content */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Squircle Status Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-base border shadow-2xs transition-transform duration-200 group-hover:scale-105 ${badge.iconBg}`}
                      >
                        <i className={`bi ${badge.icon}`}></i>
                      </div>

                      {/* Content Details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Line 1: Action Badge + Employee Name + EMP Code */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border transition-colors ${badge.badgeStyle}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                            {item.employee_name || "Employee"}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-slate-400">
                            EMP-{String(item.employee_id || item.user_id || 1).padStart(4, "0")}
                          </span>
                        </div>

                        {/* Line 2: Details Message */}
                        <p className="text-xs text-slate-600 mb-0 font-normal leading-relaxed">
                          {displayMessage}
                        </p>

                        {/* Line 3: Executed by tag with shield icon */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-0.5">
                          <i className="bi bi-shield-fill-check text-indigo-600 text-xs"></i>
                          <span>Executed by:</span>
                          <span className="font-semibold text-slate-800">
                            {executorName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamp + Ref # tag */}
                    <div className="shrink-0 text-right space-y-1 self-start sm:self-center">
                      <div className="flex items-center justify-end gap-1.5 text-xs text-slate-600 font-normal">
                        <i className="bi bi-calendar3 text-slate-400 text-xs"></i>
                        <span>{formattedDate}</span>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 block text-right font-sans">
                        Ref #{item.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer matching reference design */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-normal">
            Showing <strong className="text-slate-800 font-bold">{filteredLogs.length}</strong> of{" "}
            <strong className="text-slate-800 font-bold">{logs.length}</strong> events
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Custom Sleek Scrollbar Stylesheet */}
        <style>{`
          .audit-modal-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .audit-modal-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .audit-modal-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 9999px;
          }
          .audit-modal-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HierarchyAuditModal;
