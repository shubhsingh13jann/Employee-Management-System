import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

interface SupervisorCapacityItem {
  id: number | string;
  name: string;
  email: string;
  image_url?: string;
  department_name?: string;
  department_code?: string;
  active_projects_count: number;
  total_assigned_tasks: number;
  active_tasks_count: number;
  overdue_tasks_count: number;
}

interface SupervisorCapacityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupervisorFilter: (supervisorId: string) => void;
}

export const SupervisorCapacityDrawer: React.FC<SupervisorCapacityDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSupervisorFilter,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [supervisors, setSupervisors] = useState<SupervisorCapacityItem[]>([]);
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>("Current Period");
  const [isPeriodOpen, setIsPeriodOpen] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "burnout" | "normal" | "low">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCapacity = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/admin/projects/supervisors-capacity");
        if (res.data.status) {
          const list: SupervisorCapacityItem[] = res.data.supervisors || [];
          setSupervisors(list);
          // Default select the first supervisor or one with burnout risk
          if (list.length > 0) {
            const burnout = list.find(
              (s) => Number(s.overdue_tasks_count) > 0 || Number(s.active_tasks_count) > 6
            );
            setSelectedSupervisorId(burnout ? burnout.id : list[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load supervisor capacity", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCapacity();
  }, [isOpen]);

  // Selected supervisor object
  const selectedSupervisor = useMemo(() => {
    if (!supervisors.length) return null;
    return supervisors.find((s) => s.id === selectedSupervisorId) || supervisors[0];
  }, [supervisors, selectedSupervisorId]);

  // Compute team overview breakdown
  const teamMetrics = useMemo(() => {
    let burnout = 0;
    let normal = 0;
    let low = 0;

    supervisors.forEach((s) => {
      const active = Number(s.active_tasks_count) || 0;
      const overdue = Number(s.overdue_tasks_count) || 0;
      if (overdue > 0 || active > 6) {
        burnout++;
      } else if (active >= 1) {
        normal++;
      } else {
        low++;
      }
    });

    return {
      total: supervisors.length,
      burnout,
      normal,
      low,
    };
  }, [supervisors]);

  // Filtered supervisors
  const filteredSupervisors = useMemo(() => {
    return supervisors.filter((sup) => {
      const active = Number(sup.active_tasks_count) || 0;
      const overdue = Number(sup.overdue_tasks_count) || 0;
      const isBurnout = overdue > 0 || active > 6;
      const isLow = active === 0;
      const isNormal = !isBurnout && !isLow;

      if (statusFilter === "burnout" && !isBurnout) return false;
      if (statusFilter === "normal" && !isNormal) return false;
      if (statusFilter === "low" && !isLow) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = sup.name.toLowerCase().includes(q);
        const matchDept = (sup.department_name || "").toLowerCase().includes(q);
        const matchEmail = (sup.email || "").toLowerCase().includes(q);
        return matchName || matchDept || matchEmail;
      }
      return true;
    });
  }, [supervisors, statusFilter, searchQuery]);

  const handleCopyDetails = () => {
    if (!selectedSupervisor) return;
    const text = `Supervisor: ${selectedSupervisor.name}\nEmail: ${selectedSupervisor.email}\nDepartment: ${selectedSupervisor.department_name || "General"}\nActive Tasks: ${selectedSupervisor.active_tasks_count}\nOverdue Tasks: ${selectedSupervisor.overdue_tasks_count}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="w-full max-w-[840px] max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header with Fluid Pastel Wave Background matching Reference Modal */}
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
                <mask id="heatmapWaveFadeMask">
                  <linearGradient id="heatmapWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="18%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#heatmapWaveFadeGrad)" />
                </mask>

                <linearGradient id="heatmapWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="heatmapWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="heatmapWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g mask="url(#heatmapWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#heatmapWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#heatmapWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#heatmapWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          {/* Left: Electric Gradient Squircle Icon + Title & Subtitle */}
          <div className="flex items-center gap-2.5 relative z-10 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20 shrink-0 border border-white/20">
              <i className="bi bi-fire text-amber-300"></i>
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-[13.5px] sm:text-[14.5px] text-slate-900 mb-0 tracking-tight leading-tight truncate">
                Supervisor Workload Heatmap
              </h3>
              <p className="text-[10.5px] sm:text-[11px] text-slate-400 mb-0 font-normal leading-tight truncate mt-0.5">
                Cross-department task distribution & capacity governance
              </p>
            </div>
          </div>

          {/* Right: Period Dropdown & Square Close Button */}
          <div className="relative z-10 flex items-center gap-2">
            {/* Period Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i className="bi bi-calendar3 text-indigo-600 text-[10px]"></i>
                <span>{periodFilter}</span>
                <i className="bi bi-chevron-down text-[9px] text-slate-400"></i>
              </button>

              {isPeriodOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-white border border-slate-200 shadow-xl p-1 z-30 text-[11px]">
                  {["Current Period", "Q4 2026 Target", "All-Time Overview"].map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => {
                        setPeriodFilter(period);
                        setIsPeriodOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        periodFilter === period
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rounded Square Close Button matching reference modal */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs relative z-10"
              title="Close modal"
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-xs"></i>
            </button>
          </div>
        </div>

        {/* Modal Main Body (Two-Column Layout matching reference proportions) */}
        <div className="p-3.5 sm:p-4 bg-slate-50/50 overflow-y-auto max-h-[calc(85vh-120px)]">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2.5"></div>
              <p className="text-[11px] text-slate-500 font-medium">
                Loading supervisor capacity telemetry...
              </p>
            </div>
          ) : supervisors.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No active supervisors found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Left Column: Supervisor Workload Cards (8 of 12 cols) */}
              <div className="md:col-span-8 space-y-2.5">
                {/* Filter Chips and Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                        statusFilter === "all"
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs"
                      }`}
                    >
                      All ({supervisors.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("burnout")}
                      className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        statusFilter === "burnout"
                          ? "bg-rose-600 text-white shadow-2xs"
                          : "bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 shadow-2xs"
                      }`}
                    >
                      <span>🔥 Burnout Risk</span>
                      <span className="text-[9.5px] opacity-80">({teamMetrics.burnout})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("normal")}
                      className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        statusFilter === "normal"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 shadow-2xs"
                      }`}
                    >
                      <span>● Normal Load</span>
                      <span className="text-[9.5px] opacity-80">({teamMetrics.normal})</span>
                    </button>
                  </div>

                  <div className="relative min-w-[170px]">
                    <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                    <input
                      type="text"
                      placeholder="Search supervisor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {filteredSupervisors.length === 0 ? (
                  <div className="py-10 bg-white rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                    No supervisors match the current filter criteria.
                  </div>
                ) : (
                  filteredSupervisors.map((sup) => {
                    const activeTasks = Number(sup.active_tasks_count) || 0;
                    const overdueTasks = Number(sup.overdue_tasks_count) || 0;
                    const activeProjects = Number(sup.active_projects_count) || 0;
                    const isSelected = sup.id === selectedSupervisorId;

                    // Workload load status calculation
                    let loadLabel = "Normal Load";
                    let loadBg = "bg-emerald-50/80 text-emerald-700 border-emerald-200";
                    let loadIcon = "●";
                    let leftAccentColor = "border-l-emerald-500";
                    let avatarBg = "bg-gradient-to-br from-emerald-500 to-teal-600";
                    let meterPercent = Math.min(100, Math.round((activeTasks / 8) * 100));

                    if (activeTasks > 6 || overdueTasks > 0) {
                      loadLabel = "Burnout Risk";
                      loadBg = "bg-rose-50/80 text-rose-700 border-rose-200";
                      loadIcon = "🔥";
                      leftAccentColor = "border-l-rose-500";
                      avatarBg = "bg-gradient-to-br from-indigo-500 to-purple-600";
                    } else if (activeTasks === 0) {
                      loadLabel = "Low Load";
                      loadBg = "bg-blue-50/80 text-blue-700 border-blue-200";
                      loadIcon = "●";
                      leftAccentColor = "border-l-blue-500";
                      avatarBg = "bg-gradient-to-br from-blue-500 to-indigo-600";
                    }

                    return (
                      <div
                        key={sup.id}
                        onClick={() => setSelectedSupervisorId(sup.id)}
                        className={`relative bg-white rounded-xl sm:rounded-2xl border transition-all p-3 sm:p-3.5 cursor-pointer border-l-4 ${leftAccentColor} ${
                          isSelected
                            ? "border-indigo-400/90 shadow-md ring-2 ring-indigo-500/10"
                            : "border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          {/* Supervisor Identity */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl ${avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                              {sup.name ? sup.name.charAt(0).toUpperCase() : "S"}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 mb-0.5 truncate leading-tight">
                                {sup.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                                <span className="flex items-center gap-1 font-medium text-slate-500 truncate">
                                  <i className="bi bi-building text-[9.5px] text-indigo-500"></i>
                                  {sup.department_name || "General"}
                                </span>
                              </div>
                              <div className="mt-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold border ${loadBg}`}>
                                  <span>{loadIcon}</span>
                                  <span>{loadLabel}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Middle Metric Chips */}
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <div className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-center min-w-[58px]">
                              <span className="text-indigo-600 text-[10px]">🚀</span>
                              <div>
                                <strong className="block text-slate-800 text-[11px] font-bold leading-none">{activeProjects}</strong>
                                <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Initiatives</span>
                              </div>
                            </div>

                            <div className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-center min-w-[58px]">
                              <span className="text-emerald-600 text-[10px]">✓</span>
                              <div>
                                <strong className="block text-slate-800 text-[11px] font-bold leading-none">{activeTasks}</strong>
                                <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Tasks</span>
                              </div>
                            </div>

                            <div className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1.5 text-center min-w-[58px]">
                              <span className="text-rose-500 text-[10px]">⏱️</span>
                              <div>
                                <strong className={`block text-[11px] font-bold leading-none ${overdueTasks > 0 ? "text-rose-600" : "text-slate-800"}`}>
                                  {overdueTasks}
                                </strong>
                                <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Overdue</span>
                              </div>
                            </div>

                            {/* View Details / Filter CTA Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSupervisorId(sup.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                isSelected
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                  : "bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200/90 shadow-2xs"
                              }`}
                            >
                              <span>View Details</span>
                              <i className="bi bi-arrow-right text-[9.5px]"></i>
                            </button>
                          </div>
                        </div>

                        {/* Workload Saturation Progress Bar */}
                        <div className="mt-2 pt-1.5 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                            <span>Workload Saturation</span>
                            <span className="text-slate-800 font-bold">{meterPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                meterPercent > 75
                                  ? "bg-gradient-to-r from-rose-500 to-rose-600"
                                  : meterPercent >= 40
                                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                                  : "bg-gradient-to-r from-blue-400 to-indigo-500"
                              }`}
                              style={{ width: `${meterPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Widgets Stack (4 of 12 cols matching Reference Modal) */}
              <div className="md:col-span-4 space-y-2.5 sm:space-y-3">
                {/* 1. Team Overview Widget */}
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <h4 className="text-[11px] sm:text-[11.5px] font-bold text-slate-800 tracking-tight leading-snug truncate mb-0">
                      Team Overview
                    </h4>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Circular Donut Metric */}
                    <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center shrink-0">
                      <svg className="w-18 h-18 sm:w-20 sm:h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {/* Normal Segment */}
                        {teamMetrics.normal > 0 && teamMetrics.total > 0 && (
                          <path
                            className="text-emerald-500"
                            strokeDasharray={`${(teamMetrics.normal / teamMetrics.total) * 100}, 100`}
                            strokeDashoffset="0"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        )}
                        {/* Burnout Segment */}
                        {teamMetrics.burnout > 0 && teamMetrics.total > 0 && (
                          <path
                            className="text-rose-500"
                            strokeDasharray={`${(teamMetrics.burnout / teamMetrics.total) * 100}, 100`}
                            strokeDashoffset={`-${(teamMetrics.normal / teamMetrics.total) * 100}`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        )}
                        {/* Low Segment */}
                        {teamMetrics.low > 0 && teamMetrics.total > 0 && (
                          <path
                            className="text-blue-500"
                            strokeDasharray={`${(teamMetrics.low / teamMetrics.total) * 100}, 100`}
                            strokeDashoffset={`-${((teamMetrics.normal + teamMetrics.burnout) / teamMetrics.total) * 100}`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        )}
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-sm font-black text-slate-900 block leading-tight">
                          {teamMetrics.total}
                        </span>
                        <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Members
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Burnout
                        </span>
                        <strong className="text-slate-900 font-bold">{teamMetrics.burnout}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Normal
                        </span>
                        <strong className="text-slate-900 font-bold">{teamMetrics.normal}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Low Load
                        </span>
                        <strong className="text-slate-900 font-bold">{teamMetrics.low}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Key Insights Widget */}
                <div className="bg-indigo-50/30 rounded-xl sm:rounded-2xl border border-indigo-100/70 p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-6 h-6 rounded-md bg-amber-100/80 text-amber-600 flex items-center justify-center text-[10px] shrink-0">
                      <i className="bi bi-lightbulb-fill"></i>
                    </div>
                    <h4 className="text-[11px] font-bold text-slate-800 tracking-tight leading-snug mb-0">
                      Key Insights
                    </h4>
                  </div>
                  <div className="p-2 bg-white/95 rounded-lg border border-indigo-100/60 text-[10.5px] text-slate-600 leading-normal flex items-start gap-1.5">
                    <i className="bi bi-info-circle-fill text-indigo-500 text-[11px] shrink-0 mt-0.5"></i>
                    <div>
                      {teamMetrics.burnout > 0 ? (
                        <span>
                          <strong className="text-slate-800">{teamMetrics.burnout} member{teamMetrics.burnout > 1 ? "s" : ""}</strong> at burnout risk. Consider redistributing tasks.
                        </span>
                      ) : (
                        <span>
                          All registered supervisors operate within healthy capacity thresholds.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Employee / Supervisor Details Widget matching Reference Modal Card */}
                {selectedSupervisor && (
                  <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xs shadow-2xs shrink-0">
                        <i className="bi bi-person"></i>
                      </div>
                      <h4 className="text-[11px] sm:text-[11.5px] font-bold text-slate-800 tracking-tight leading-snug truncate mb-0">
                        Employee Details
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {/* Row 1: Email */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-indigo-50/70 border border-indigo-100/60 text-indigo-600 flex items-center justify-center text-[10.5px] shrink-0 shadow-2xs">
                          <i className="bi bi-envelope"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-medium text-slate-400 block leading-tight">
                            Email
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 block truncate mt-0.5" title={selectedSupervisor.email}>
                            {selectedSupervisor.email || "supervisor@company.com"}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Employee ID */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-indigo-50/70 border border-indigo-100/60 text-indigo-600 flex items-center justify-center text-[10.5px] shrink-0 shadow-2xs">
                          <i className="bi bi-person-vcard"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-medium text-slate-400 block leading-tight">
                            Employee ID
                          </span>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 inline-block mt-0.5">
                            SUP-{String(selectedSupervisor.id).padStart(4, "0")}
                          </span>
                        </div>
                      </div>

                      {/* Row 3: Department */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-indigo-50/70 border border-indigo-100/60 text-indigo-600 flex items-center justify-center text-[10.5px] shrink-0 shadow-2xs">
                          <i className="bi bi-building"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-medium text-slate-400 block leading-tight">
                            Department
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700 block truncate mt-0.5">
                            {selectedSupervisor.department_name || "General"}
                          </span>
                        </div>
                      </div>

                      {/* Row 4: Status */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-emerald-50/80 border border-emerald-100 text-emerald-600 flex items-center justify-center text-[10.5px] shrink-0 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-medium text-slate-400 block leading-tight">
                            Status
                          </span>
                          <span className="text-[10.5px] font-bold text-emerald-600 block truncate mt-0.5">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls matching Reference Modal */}
        <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
          >
            <i className="bi bi-x-lg text-xs"></i>
            <span>Close</span>
          </button>

          <div className="flex items-center gap-2">
            {selectedSupervisor && (
              <>
                <button
                  type="button"
                  onClick={handleCopyDetails}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                  title="Copy details"
                >
                  <i className={`bi ${copied ? "bi-check2 text-emerald-600 font-bold" : "bi-file-earmark-text text-slate-500 text-xs"}`}></i>
                  <span>{copied ? "Copied!" : "Copy Details"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectSupervisorFilter(String(selectedSupervisor.id));
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <i className="bi bi-funnel-fill text-xs"></i>
                  <span>Filter Initiatives ({selectedSupervisor.name.split(" ")[0]})</span>
                </button>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
