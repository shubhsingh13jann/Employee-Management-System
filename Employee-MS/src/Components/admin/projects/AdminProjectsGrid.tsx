import React from "react";
import { ProjectItem } from "../../../pages/admin/AdminProjects";

interface AdminProjectsGridProps {
  projects: ProjectItem[];
  onOpenEditModal?: (project: ProjectItem) => void;
  onUpdateStatus?: (projectId: number | string, newStatus: string) => void;
  onDeleteProject?: (projectId: number | string) => void;
}

export const AdminProjectsGrid: React.FC<AdminProjectsGridProps> = ({
  projects,
  onOpenEditModal,
  onUpdateStatus,
  onDeleteProject,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
      {projects.map((proj) => {
        const isOverdue = proj.is_overdue || (proj.health === "critical" && proj.status !== "completed");

        return (
          <div
            key={proj.id}
            className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all p-3.5 flex flex-col justify-between"
          >
            <div>
              {/* Card Header: Dept & Priority */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  🏢 {proj.department_name || "General"}
                </span>

                <div className="flex items-center gap-1.5">
                  {proj.priority === "critical" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                      Critical
                    </span>
                  )}
                  {proj.priority === "high" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      High
                    </span>
                  )}
                  {proj.priority === "medium" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      Medium
                    </span>
                  )}
                  {proj.priority === "low" && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Low
                    </span>
                  )}

                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      proj.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : proj.status === "planning"
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : proj.status === "completed"
                        ? "bg-slate-100 text-slate-700 border border-slate-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {proj.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 mb-0 line-clamp-1">
                    {proj.title}
                  </h4>
                  <span className="text-[9px] font-mono font-semibold text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                    PRJ-{String(proj.id).padStart(4, "0")}
                  </span>
                </div>
                {proj.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-0">
                    {proj.description}
                  </p>
                )}
              </div>

              {/* Lead Supervisor Chip */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {proj.supervisor_name ? proj.supervisor_name.charAt(0) : "U"}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-800 block truncate">
                      {proj.supervisor_name || "Unassigned Lead"}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      Lead Supervisor
                    </span>
                  </div>
                </div>

                {proj.target_date && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-600 block font-medium">
                      {new Date(proj.target_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {proj.days_left !== null && proj.status !== "completed" && (
                      <span
                        className={`text-[9px] font-bold block ${
                          isOverdue ? "text-rose-600" : "text-slate-400"
                        }`}
                      >
                        {isOverdue ? `Overdue ${Math.abs(proj.days_left)}d` : `${proj.days_left}d left`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Task Rollup Velocity Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] font-medium mb-1">
                  <span className="text-slate-500">
                    {proj.completed_tasks}/{proj.total_tasks} Tasks Complete
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
            </div>

            {/* Bottom Footer Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-1">
              <div className="flex items-center gap-1">
                {isOverdue ? (
                  <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-octagon-fill text-[9px]"></i>
                    Overdue
                  </span>
                ) : proj.health === "at_risk" ? (
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-triangle-fill text-[9px]"></i>
                    At Risk
                  </span>
                ) : proj.status === "completed" ? (
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <i className="bi bi-check2-circle text-[10px]"></i>
                    Delivered
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    On Track
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                {onUpdateStatus && proj.status !== "active" && proj.status !== "completed" && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(proj.id, "active")}
                    className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Start
                  </button>
                )}
                {onOpenEditModal && (
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(proj)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                )}
                {onDeleteProject && (
                  <button
                    type="button"
                    onClick={() => onDeleteProject(proj.id)}
                    className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[10px] transition-colors cursor-pointer"
                    title="Delete Initiative"
                  >
                    <i className="bi bi-trash3"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
