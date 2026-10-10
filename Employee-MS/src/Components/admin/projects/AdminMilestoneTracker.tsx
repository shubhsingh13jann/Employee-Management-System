import React from "react";
import { ProjectItem } from "../../../pages/admin/AdminProjects";

interface AdminMilestoneTrackerProps {
  projects: ProjectItem[];
  onOpenEditModal?: (project: ProjectItem) => void;
  onUpdateStatus?: (projectId: number | string, newStatus: string) => void;
}

export const AdminMilestoneTracker: React.FC<AdminMilestoneTrackerProps> = ({
  projects,
  onOpenEditModal,
  onUpdateStatus,
}) => {
  // Sort projects by target_date
  const sortedProjects = [...projects].sort((a, b) => {
    if (!a.target_date) return 1;
    if (!b.target_date) return -1;
    return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  });

  const overdue = sortedProjects.filter((p) => p.is_overdue && p.status !== "completed");
  const upcoming = sortedProjects.filter(
    (p) => !p.is_overdue && p.status !== "completed" && p.days_left !== null && p.days_left <= 30
  );
  const future = sortedProjects.filter(
    (p) => !p.is_overdue && p.status !== "completed" && (p.days_left === null || p.days_left > 30)
  );
  const completed = sortedProjects.filter((p) => p.status === "completed");

  const renderTimelineGroup = (
    title: string,
    badgeColor: string,
    items: ProjectItem[],
    icon: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-5 last:mb-0">
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${badgeColor}`}>
            <i className={`bi ${icon}`}></i>
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0">
            {title} ({items.length})
          </h4>
        </div>

        <div className="relative pl-4 sm:pl-6 border-l-2 border-slate-200 space-y-3 ml-3">
          {items.map((proj) => {
            const isCritical = proj.is_overdue || proj.health === "critical";

            return (
              <div
                key={proj.id}
                className="relative bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all p-3 sm:p-3.5"
              >
                {/* Timeline node dot */}
                <div
                  className={`absolute -left-[23px] sm:-left-[31px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs ${
                    proj.status === "completed"
                      ? "bg-emerald-500"
                      : isCritical
                      ? "bg-rose-500 animate-ping"
                      : "bg-indigo-500"
                  }`}
                ></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {proj.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      PRJ-{String(proj.id).padStart(4, "0")}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      🏢 {proj.department_name || "General"}
                    </span>
                  </div>

                  {/* Target Date Pill */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                    {proj.target_date ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCritical
                            ? "bg-rose-50 text-rose-700 border-rose-300"
                            : proj.days_left !== null && proj.days_left <= 7
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        <i className="bi bi-calendar-check mr-1 text-[9px]"></i>
                        Target:{" "}
                        {new Date(proj.target_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                        {proj.days_left !== null && (
                          <span className="ml-1">
                            ({proj.days_left < 0 ? `${Math.abs(proj.days_left)}d overdue` : `${proj.days_left}d left`})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">No Target Date</span>
                    )}
                  </div>
                </div>

                {proj.description && (
                  <p className="text-[11px] text-slate-500 mb-2 line-clamp-1">
                    {proj.description}
                  </p>
                )}

                {/* Bottom Row: Lead Supervisor, Progress Bar, Quick Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {proj.supervisor_name ? proj.supervisor_name.charAt(0) : "U"}
                    </div>
                    <span className="text-[11px] font-medium text-slate-700">
                      {proj.supervisor_name || "Unassigned Supervisor"}
                    </span>
                  </div>

                  {/* Task Rollup */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            proj.progress_percentage >= 80
                              ? "bg-emerald-500"
                              : proj.progress_percentage >= 40
                              ? "bg-indigo-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${proj.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">
                        {proj.progress_percentage}%
                      </span>
                    </div>

                    {onUpdateStatus && proj.status !== "completed" && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(proj.id, "completed")}
                        className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold transition-colors cursor-pointer"
                        title="Mark Complete"
                      >
                        Complete
                      </button>
                    )}

                    {onOpenEditModal && (
                      <button
                        type="button"
                        onClick={() => onOpenEditModal(proj)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 mb-3">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-0.5">
            Enterprise Deliverables & Milestone Schedule
          </h3>
          <p className="text-[11px] text-slate-500 mb-0">
            Timeline sequenced by target milestone dates, overdue bottlenecks, and delivery milestones
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          No projects available in schedule.
        </div>
      ) : (
        <>
          {renderTimelineGroup("🔴 Critical Overdue Milestones", "bg-rose-100 text-rose-700", overdue, "bi-exclamation-octagon-fill")}
          {renderTimelineGroup("🟡 Upcoming Milestones (Next 30 Days)", "bg-amber-100 text-amber-700", upcoming, "bi-clock-history")}
          {renderTimelineGroup("🔵 Scheduled Future Milestones", "bg-indigo-100 text-indigo-700", future, "bi-calendar-event")}
          {renderTimelineGroup("🟢 Successfully Delivered Initiatives", "bg-emerald-100 text-emerald-700", completed, "bi-check2-circle")}
        </>
      )}
    </div>
  );
};
