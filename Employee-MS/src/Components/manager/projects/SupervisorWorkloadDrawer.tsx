import React from "react";

export interface SupervisorWorkloadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  supervisors: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    active_projects_count?: number;
    team_size?: number;
    total_tasks_count?: number;
    completed_tasks_count?: number;
  }>;
  selectedSupervisorId?: string | number | null;
  onFilterBySupervisor: (supervisorId: number | string | null) => void;
}

export const SupervisorWorkloadDrawer: React.FC<SupervisorWorkloadDrawerProps> = ({
  isOpen,
  onClose,
  supervisors,
  selectedSupervisorId,
  onFilterBySupervisor,
}) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out shrink-0 xl:h-full overflow-hidden ${
        isOpen
          ? "w-full xl:w-[350px] opacity-100 xl:translate-x-0 mt-3.5 xl:mt-0 xl:ml-3.5 pointer-events-auto"
          : "w-0 xl:w-0 opacity-0 xl:translate-x-8 mt-0 xl:mt-0 xl:ml-0 pointer-events-none"
      }`}
    >
      <div className="w-full xl:w-[350px] xl:min-w-[350px] xl:max-w-[350px] min-w-0 xl:h-full xl:overflow-y-auto space-y-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 font-bold text-sm">
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                Supervisor Capacity
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Workload allocation across team leads
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-xs"
            title="Close Drawer"
          >
            ✕
          </button>
        </div>

        {/* Filter Indicator / Reset */}
        {selectedSupervisorId && (
          <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between text-xs text-indigo-900">
            <span className="flex items-center gap-1.5 font-medium">
              <i className="bi bi-funnel-fill text-indigo-600 text-xs"></i>
              <span>Filtering by supervisor</span>
            </span>
            <button
              type="button"
              onClick={() => onFilterBySupervisor(null)}
              className="font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer underline text-[11px]"
            >
              Show All
            </button>
          </div>
        )}

        {/* Supervisors List */}
        <div className="space-y-2.5">
          {supervisors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <i className="bi bi-person-x text-2xl block mb-1"></i>
              No operational supervisors found in this department.
            </div>
          ) : (
            supervisors.map((sup) => {
              const activeProjects = Number(sup.active_projects_count || 0);
              const totalTasks = Number(sup.total_tasks_count || 0);
              const completedTasks = Number(sup.completed_tasks_count || 0);
              const teamSize = Number(sup.team_size || 0);
              const isFiltered = String(selectedSupervisorId) === String(sup.id);

              // Calculate workload tier
              let workloadTier = { label: "Optimal", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
              if (activeProjects === 0) {
                workloadTier = { label: "Available", color: "bg-sky-50 text-sky-700 border-sky-200" };
              } else if (activeProjects >= 3 || totalTasks >= 10) {
                workloadTier = { label: "High Capacity", color: "bg-rose-50 text-rose-700 border-rose-200" };
              } else if (activeProjects === 2) {
                workloadTier = { label: "Active", color: "bg-amber-50 text-amber-700 border-amber-200" };
              }

              return (
                <div
                  key={sup.id}
                  onClick={() => onFilterBySupervisor(isFiltered ? null : sup.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isFiltered
                      ? "border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-400/30 shadow-xs"
                      : "border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60"
                  }`}
                  title={isFiltered ? "Click to clear filter" : "Click to view initiatives led by this supervisor"}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200">
                        {sup.name ? sup.name.charAt(0) : "S"}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 block truncate leading-tight">
                          {sup.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate leading-tight">
                          {sup.email}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-bold border ${workloadTier.color}`}>
                      {workloadTier.label}
                    </span>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-slate-100 text-center">
                    <div className="p-1 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-400 block">Initiatives</span>
                      <span className="text-xs font-bold text-slate-800">{activeProjects}</span>
                    </div>
                    <div className="p-1 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-400 block">Team Staff</span>
                      <span className="text-xs font-bold text-slate-800">{teamSize}</span>
                    </div>
                    <div className="p-1 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-400 block">Tasks</span>
                      <span className="text-xs font-bold text-slate-800">{completedTasks}/{totalTasks}</span>
                    </div>
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
