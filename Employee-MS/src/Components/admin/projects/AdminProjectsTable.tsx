import React, { useState } from "react";
import { ProjectItem } from "../../../pages/admin/AdminProjects";

interface AdminProjectsTableProps {
  projects: ProjectItem[];
  onOpenEditModal?: (project: ProjectItem) => void;
  onUpdateStatus?: (projectId: number | string, newStatus: string) => void;
  onDeleteProject?: (projectId: number | string) => void;
}

export const AdminProjectsTable: React.FC<AdminProjectsTableProps> = ({
  projects,
  onOpenEditModal,
  onUpdateStatus,
  onDeleteProject,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
            Critical
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Active
          </span>
        );
      case "planning":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Planning
          </span>
        );
      case "on_hold":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            On Hold
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <i className="bi bi-check2-circle text-emerald-600"></i>
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getHealthBadge = (health: string, isOverdue?: boolean) => {
    if (health === "critical" || isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100/80 text-rose-800 border border-rose-300">
          <i className="bi bi-exclamation-octagon-fill text-rose-600 text-[10px]"></i>
          Overdue
        </span>
      );
    }
    if (health === "at_risk") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-800 border border-amber-300">
          <i className="bi bi-exclamation-triangle-fill text-amber-600 text-[10px]"></i>
          At Risk
        </span>
      );
    }
    if (health === "completed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <i className="bi bi-check-all text-emerald-600 text-xs"></i>
          Delivered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Healthy
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden mb-3">
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4 text-left min-w-[240px]">Strategic Initiative</th>
              <th className="py-2.5 px-3 text-left min-w-[140px]">Department</th>
              <th className="py-2.5 px-3 text-left min-w-[170px]">Lead Supervisor</th>
              <th className="py-2.5 px-3 text-center min-w-[100px]">Priority</th>
              <th className="py-2.5 px-3 text-left min-w-[160px]">Task Velocity</th>
              <th className="py-2.5 px-3 text-left min-w-[130px]">Target Date</th>
              <th className="py-2.5 px-3 text-center min-w-[110px]">Health</th>
              <th className="py-2.5 px-3 text-center min-w-[100px]">Status</th>
              <th className="py-2.5 px-3 text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {projects.map((proj, idx, arr) => {
              const isMenuOpen = activeMenuId === proj.id;

              return (
                <tr key={proj.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* 1. Initiative Title & Details */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        <i className="bi bi-kanban"></i>
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 truncate text-xs sm:text-[13px]">
                            {proj.title}
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200">
                            PRJ-{String(proj.id).padStart(4, "0")}
                          </span>
                        </div>
                        {proj.description && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                            {proj.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 2. Department */}
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {proj.department_name || "General"}
                    </span>
                  </td>

                  {/* 3. Lead Supervisor */}
                  <td className="py-2.5 px-3">
                    {proj.supervisor_name ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {proj.supervisor_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 block text-xs truncate max-w-[120px] leading-tight">
                            {proj.supervisor_name}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate leading-tight">
                            Lead Supervisor
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Unassigned Lead
                      </span>
                    )}
                  </td>

                  {/* 4. Priority */}
                  <td className="py-2.5 px-3 text-center">
                    {getPriorityBadge(proj.priority)}
                  </td>

                  {/* 5. Task Rollup Velocity Bar */}
                  <td className="py-2.5 px-3">
                    <div className="w-full max-w-[150px]">
                      <div className="flex items-center justify-between text-[10px] font-medium mb-1">
                        <span className="text-slate-600">
                          {proj.completed_tasks}/{proj.total_tasks} tasks
                        </span>
                        <span className="font-bold text-slate-800">
                          {proj.progress_percentage}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            proj.progress_percentage >= 80
                              ? "bg-emerald-500"
                              : proj.progress_percentage >= 40
                              ? "bg-indigo-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${proj.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* 6. Target Date / Countdown */}
                  <td className="py-2.5 px-3">
                    {proj.target_date ? (
                      <div>
                        <span className="text-xs text-slate-700 block font-medium">
                          {new Date(proj.target_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {proj.status !== "completed" && proj.days_left !== null && (
                          <span
                            className={`text-[9px] font-bold block ${
                              proj.days_left < 0
                                ? "text-rose-600"
                                : proj.days_left <= 7
                                ? "text-amber-600"
                                : "text-slate-400"
                            }`}
                          >
                            {proj.days_left < 0
                              ? `Overdue by ${Math.abs(proj.days_left)}d`
                              : `${proj.days_left}d remaining`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px]">No deadline</span>
                    )}
                  </td>

                  {/* 7. Health / Risk */}
                  <td className="py-2.5 px-3 text-center">
                    {getHealthBadge(proj.health, proj.is_overdue)}
                  </td>

                  {/* 8. Status */}
                  <td className="py-2.5 px-3 text-center">
                    {getStatusBadge(proj.status)}
                  </td>

                  {/* 9. Actions Menu */}
                  <td className={`py-2.5 px-3 text-center whitespace-nowrap ${isMenuOpen ? "relative z-30" : ""}`}>
                    <div className="relative inline-flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId((prev) => (prev === proj.id ? null : proj.id));
                        }}
                        className={`w-6 h-6 rounded-md border transition-all inline-flex items-center justify-center cursor-pointer ${
                          isMenuOpen
                            ? "bg-slate-100 text-slate-900 border-slate-300 shadow-2xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-2xs"
                        }`}
                        title="Initiative Actions"
                      >
                        <i className="bi bi-three-dots text-[10px]"></i>
                      </button>

                      {isMenuOpen && (
                        <div
                          className={`absolute right-0 ${
                            idx >= arr.length - 2 && arr.length > 2
                              ? "bottom-full mb-1"
                              : "top-full mt-1"
                          } w-44 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-0.5">
                            Status Lifecycle
                          </div>
                          {onUpdateStatus && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onUpdateStatus(proj.id, "active");
                                }}
                                className="w-full px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                              >
                                <i className="bi bi-play-circle text-emerald-600 text-[10px]"></i>
                                <span>Mark Active</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onUpdateStatus(proj.id, "completed");
                                }}
                                className="w-full px-2 py-1 text-[11px] text-blue-700 hover:bg-blue-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                              >
                                <i className="bi bi-check2-circle text-blue-600 text-[10px]"></i>
                                <span>Mark Completed</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onUpdateStatus(proj.id, "on_hold");
                                }}
                                className="w-full px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                              >
                                <i className="bi bi-pause-circle text-amber-600 text-[10px]"></i>
                                <span>Place On Hold</span>
                              </button>
                            </>
                          )}

                          <div className="my-1 border-t border-slate-100"></div>

                          {onOpenEditModal && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onOpenEditModal(proj);
                              }}
                              className="w-full px-2 py-1 text-[11px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                            >
                              <i className="bi bi-pencil-square text-indigo-500 text-[10px]"></i>
                              <span>Edit Initiative</span>
                            </button>
                          )}

                          {onDeleteProject && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onDeleteProject(proj.id);
                              }}
                              className="w-full px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                            >
                              <i className="bi bi-trash3 text-rose-500 text-[10px]"></i>
                              <span>Archive / Delete</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
