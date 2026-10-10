import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (!isOpen) return;

    const fetchCapacity = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/admin/projects/supervisors-capacity");
        if (res.data.status) {
          setSupervisors(res.data.supervisors);
        }
      } catch (err) {
        console.error("Failed to load supervisor capacity", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCapacity();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-sm">
              <i className="bi bi-fire"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white mb-0">
                Supervisor Workload Heatmap
              </h3>
              <p className="text-[10px] text-slate-300 mb-0">
                Cross-department task distribution & capacity governance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Content Roster */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Loading supervisor capacity ledger...</p>
            </div>
          ) : supervisors.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No active supervisors registered in the system.
            </div>
          ) : (
            supervisors.map((sup) => {
              const activeTasks = Number(sup.active_tasks_count) || 0;
              const overdueTasks = Number(sup.overdue_tasks_count) || 0;
              const activeProjects = Number(sup.active_projects_count) || 0;

              // Workload load status calculation
              let loadLabel = "Normal Load";
              let loadColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
              let meterPercent = Math.min(100, Math.round((activeTasks / 8) * 100));

              if (activeTasks > 6 || overdueTasks > 0) {
                loadLabel = "Burnout Risk";
                loadColor = "bg-rose-50 text-rose-700 border-rose-300";
              } else if (activeTasks >= 4) {
                loadLabel = "Heavy Load";
                loadColor = "bg-amber-50 text-amber-700 border-amber-200";
              }

              return (
                <div
                  key={sup.id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center justify-center shrink-0">
                        {sup.name ? sup.name.charAt(0) : "S"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 mb-0 truncate">
                          {sup.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block truncate">
                          🏢 {sup.department_name || "General"}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${loadColor} shrink-0`}>
                      {loadLabel}
                    </span>
                  </div>

                  {/* Metrics Pills */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Initiatives</span>
                      <strong className="text-slate-800 font-bold text-xs">{activeProjects}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Active Tasks</span>
                      <strong className="text-slate-800 font-bold text-xs">{activeTasks}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Overdue</span>
                      <strong className={`font-bold text-xs ${overdueTasks > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                        {overdueTasks}
                      </strong>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>Workload Saturation</span>
                      <span className="font-bold text-slate-700">{meterPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          meterPercent > 75
                            ? "bg-rose-500"
                            : meterPercent >= 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${meterPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Filter Action */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSupervisorFilter(String(sup.id));
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <i className="bi bi-funnel text-[10px]"></i>
                      <span>Filter Initiatives</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
