import React, { useState, useEffect, useMemo } from "react";
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-200/90 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Soft Wave Accent & Color Theme from Image 2 */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-purple-50/60 border-b border-indigo-100/70 flex items-center justify-between gap-4 overflow-hidden">
          {/* Subtle Background Waves SVG */}
          <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none opacity-45 overflow-hidden">
            <svg
              className="w-full h-full text-indigo-300"
              viewBox="0 0 500 120"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M 0,60 C 150,110 300,10 500,70 L 500,0 L 0,0 Z"
                fill="url(#headerWaveGrad)"
                opacity="0.35"
              />
              <defs>
                <linearGradient id="headerWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Left Brand Title Block */}
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/25 shrink-0">
              <i className="bi bi-fire text-amber-300"></i>
            </div>
            <div className="h-9 w-px bg-slate-300/80 hidden sm:block"></div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight mb-0.5">
                Supervisor Workload Heatmap
              </h3>
              <p className="text-xs text-slate-500 mb-0 font-medium">
                Cross-department task distribution & capacity governance
              </p>
            </div>
          </div>

          {/* Right Controls: Period Selector & Close Button */}
          <div className="relative z-10 flex items-center gap-2.5">
            {/* Period Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <i className="bi bi-calendar3 text-indigo-600"></i>
                <span>{periodFilter}</span>
                <i className="bi bi-chevron-down text-[10px] text-slate-400"></i>
              </button>

              {isPeriodOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-white border border-slate-200 shadow-xl p-1 z-30 text-xs">
                  {["Current Period", "Q4 2026 Target", "All-Time Overview"].map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => {
                        setPeriodFilter(period);
                        setIsPeriodOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
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

            {/* Circular Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center text-xs transition-colors cursor-pointer shadow-2xs"
              title="Close modal"
            >
              <i className="bi bi-x-lg text-xs"></i>
            </button>
          </div>
        </div>

        {/* Modal Main Body (Two-Column Layout) */}
        <div className="p-5 sm:p-6 bg-[#fafbfe] overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">
                Loading supervisor capacity telemetry...
              </p>
            </div>
          ) : supervisors.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No active supervisors found.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Horizontal Supervisor Cards */}
              <div className="lg:col-span-8 space-y-3.5">
                {supervisors.map((sup) => {
                  const activeTasks = Number(sup.active_tasks_count) || 0;
                  const overdueTasks = Number(sup.overdue_tasks_count) || 0;
                  const activeProjects = Number(sup.active_projects_count) || 0;
                  const isSelected = sup.id === selectedSupervisorId;

                  // Workload load status calculation
                  let loadLabel = "Normal Load";
                  let loadBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                  let loadIcon = "●";
                  let leftAccentColor = "border-l-emerald-500";
                  let meterPercent = Math.min(100, Math.round((activeTasks / 8) * 100));

                  if (activeTasks > 6 || overdueTasks > 0) {
                    loadLabel = "Burnout Risk";
                    loadBg = "bg-rose-50 text-rose-700 border-rose-200";
                    loadIcon = "🔥";
                    leftAccentColor = "border-l-rose-500";
                  } else if (activeTasks === 0) {
                    loadLabel = "Low Load";
                    loadBg = "bg-blue-50 text-blue-700 border-blue-200";
                    loadIcon = "●";
                    leftAccentColor = "border-l-blue-500";
                  }

                  return (
                    <div
                      key={sup.id}
                      onClick={() => setSelectedSupervisorId(sup.id)}
                      className={`relative bg-white rounded-2xl border transition-all p-4 cursor-pointer border-l-4 ${leftAccentColor} ${
                        isSelected
                          ? "border-indigo-400/80 shadow-md ring-2 ring-indigo-500/10"
                          : "border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Supervisor Identity */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {sup.name ? sup.name.charAt(0).toUpperCase() : "S"}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 mb-0.5 truncate">
                              {sup.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-medium text-slate-600 truncate">
                                💼 {sup.department_name || "General"}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${loadBg}`}>
                                <span>{loadIcon}</span>
                                <span>{loadLabel}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Metric Chips */}
                        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-center">
                            <span className="text-indigo-600 text-xs">🚀</span>
                            <div>
                              <strong className="block text-slate-800 text-xs font-bold leading-none">{activeProjects}</strong>
                              <span className="text-[9px] text-slate-400 font-medium">Initiatives</span>
                            </div>
                          </div>

                          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-center">
                            <span className="text-emerald-600 text-xs">✓</span>
                            <div>
                              <strong className="block text-slate-800 text-xs font-bold leading-none">{activeTasks}</strong>
                              <span className="text-[9px] text-slate-400 font-medium">Active Tasks</span>
                            </div>
                          </div>

                          <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-center">
                            <span className="text-rose-500 text-xs">⏱️</span>
                            <div>
                              <strong className={`block text-xs font-bold leading-none ${overdueTasks > 0 ? "text-rose-600" : "text-slate-800"}`}>
                                {overdueTasks}
                              </strong>
                              <span className="text-[9px] text-slate-400 font-medium">Overdue</span>
                            </div>
                          </div>

                          {/* View Details CTA */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSupervisorId(sup.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200/80 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <span>View Details</span>
                            <i className="bi bi-arrow-right text-[10px]"></i>
                          </button>
                        </div>
                      </div>

                      {/* Workload Saturation Progress Bar */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                          <span>Workload Saturation</span>
                          <span className="text-slate-800 font-bold">{meterPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
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
                })}
              </div>

              {/* Right Column: Widgets Stack */}
              <div className="lg:col-span-4 space-y-4">
                {/* 1. Team Overview Widget */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                  <div className="flex items-center gap-2 mb-3">
                    <i className="bi bi-people-fill text-indigo-600 text-sm"></i>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-0">
                      Team Overview
                    </h4>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    {/* Circular Donut Metric */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-indigo-600"
                          strokeDasharray={`${teamMetrics.total > 0 ? (teamMetrics.normal / teamMetrics.total) * 100 : 0}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        {teamMetrics.burnout > 0 && (
                          <path
                            className="text-rose-500"
                            strokeDasharray={`${(teamMetrics.burnout / teamMetrics.total) * 100}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        )}
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-base font-black text-slate-900 block leading-tight">
                          {teamMetrics.total}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Members
                        </span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          Burnout Risk
                        </span>
                        <strong className="text-slate-900 font-bold">{teamMetrics.burnout}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Normal Load
                        </span>
                        <strong className="text-slate-900 font-bold">{teamMetrics.normal}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          Low Load
                        </span>
                        <strong className="text-slate-900 font-bold">{teamMetrics.low}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Key Insights Widget */}
                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/60 rounded-2xl border border-indigo-100/90 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="bi bi-lightbulb-fill text-amber-500 text-sm"></i>
                    <h4 className="font-bold text-xs sm:text-sm text-indigo-950 mb-0">
                      Key Insights
                    </h4>
                  </div>
                  <div className="p-3 bg-white/90 rounded-xl border border-indigo-100/80 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                    <i className="bi bi-info-circle-fill text-indigo-500 text-sm shrink-0 mt-0.5"></i>
                    <div>
                      {teamMetrics.burnout > 0 ? (
                        <span>
                          <strong>{teamMetrics.burnout} team member{teamMetrics.burnout > 1 ? "s are" : " is"}</strong> at burnout risk. Consider redistributing active tasks or adjusting initiative deadlines.
                        </span>
                      ) : (
                        <span>
                          All registered supervisors are operating within healthy capacity thresholds. Cross-functional workload is balanced.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Employee / Supervisor Details Widget */}
                {selectedSupervisor && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="bi bi-person-badge-fill text-indigo-600 text-sm"></i>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-0">
                        Employee Details
                      </h4>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <i className="bi bi-envelope"></i> Email
                        </span>
                        <span className="font-medium text-slate-800 truncate max-w-[170px]" title={selectedSupervisor.email}>
                          {selectedSupervisor.email || "supervisor@company.com"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <i className="bi bi-person-vcard"></i> Employee ID
                        </span>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 text-[11px]">
                          SUP-{String(selectedSupervisor.id).padStart(4, "0")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <i className="bi bi-building"></i> Department
                        </span>
                        <span className="font-semibold text-slate-700">
                          {selectedSupervisor.department_name || "General"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <i className="bi bi-shield-check"></i> Status
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer matching Image 2 */}
        <div className="px-6 py-4 bg-white border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200/90 shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <i className="bi bi-x-lg text-xs"></i>
            <span>Close</span>
          </button>

          <div className="flex items-center gap-2">
            {selectedSupervisor && (
              <button
                type="button"
                onClick={() => {
                  onSelectSupervisorFilter(String(selectedSupervisor.id));
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-2"
              >
                <i className="bi bi-funnel-fill text-xs"></i>
                <span>Filter Initiatives for {selectedSupervisor.name.split(" ")[0]}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
