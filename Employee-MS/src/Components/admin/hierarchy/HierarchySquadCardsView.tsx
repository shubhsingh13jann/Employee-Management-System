import React, { useState, useMemo } from "react";
import { HierarchyMappingItem, UnassignedEmployee } from "./HierarchyTableView";

interface HierarchySquadCardsViewProps {
  mappings: HierarchyMappingItem[];
  unassignedStaff?: UnassignedEmployee[];
  searchTerm?: string;
  onOpenAssignModal: (employeeId?: string | number, supervisorId?: string | number) => void;
  onInitiateReassign?: (employee: HierarchyMappingItem) => void;
  onInitiateUnlink?: (employee: HierarchyMappingItem) => void;
}

interface SquadGroup {
  supervisorId: string | number;
  supervisorName: string;
  managerId?: string | number;
  managerName?: string;
  departmentName?: string;
  members: HierarchyMappingItem[];
}

export const HierarchySquadCardsView: React.FC<HierarchySquadCardsViewProps> = ({
  mappings,
  unassignedStaff = [],
  searchTerm = "",
  onOpenAssignModal,
  onInitiateReassign,
  onInitiateUnlink,
}) => {
  const [collapsedSquads, setCollapsedSquads] = useState<Set<string>>(new Set());

  // Group mappings by supervisor
  const squadGroups = useMemo<SquadGroup[]>(() => {
    const map = new Map<string, SquadGroup>();

    mappings.forEach((item) => {
      const supKey = String(item.supervisor_id);
      if (!map.has(supKey)) {
        map.set(supKey, {
          supervisorId: item.supervisor_id,
          supervisorName: item.supervisor_name,
          managerId: item.manager_id,
          managerName: item.manager_name,
          departmentName: item.department_name,
          members: [],
        });
      }
      map.get(supKey)!.members.push(item);
    });

    return Array.from(map.values()).sort((a, b) =>
      b.members.length - a.members.length || a.supervisorName.localeCompare(b.supervisorName)
    );
  }, [mappings]);

  const toggleSquad = (supKey: string) => {
    setCollapsedSquads((prev) => {
      const next = new Set(prev);
      if (next.has(supKey)) {
        next.delete(supKey);
      } else {
        next.add(supKey);
      }
      return next;
    });
  };

  const getCapacityMeta = (count: number) => {
    if (count <= 3) {
      return {
        label: "Light Load",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar: "bg-emerald-500",
        capacityPercent: Math.min(100, Math.round((count / 8) * 100)),
      };
    } else if (count <= 7) {
      return {
        label: "Optimal Squad",
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        bar: "bg-indigo-500",
        capacityPercent: Math.min(100, Math.round((count / 8) * 100)),
      };
    } else {
      return {
        label: "High Span",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        bar: "bg-amber-500",
        capacityPercent: 100,
      };
    }
  };

  return (
    <div className="space-y-4">
      {/* Squad Telemetry Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            <i className="bi bi-people-fill"></i>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 leading-none mb-0.5">
              Squad Management Overview
            </h4>
            <p className="text-[10px] text-slate-500 leading-none mb-0">
              {squadGroups.length} Active Squads • {mappings.length} Assigned Subordinates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Light (1-3)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Optimal (4-7)
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            High (8+)
          </span>
        </div>
      </div>

      {/* Main Squad Grid */}
      {squadGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl mx-auto mb-3 shadow-xs">
            <i className="bi bi-people"></i>
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No Squads Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {searchTerm
              ? `No supervisor squads match the search term "${searchTerm}".`
              : "No team lead reporting lines have been established yet."}
          </p>
          <button
            type="button"
            onClick={() => onOpenAssignModal()}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Create Squad Mapping</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {squadGroups.map((squad) => {
            const supKey = String(squad.supervisorId);
            const isCollapsed = collapsedSquads.has(supKey);
            const capMeta = getCapacityMeta(squad.members.length);

            return (
              <div
                key={`squad-${supKey}`}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col overflow-hidden"
              >
                {/* Squad Card Header */}
                <div className="p-3 sm:p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-200/70">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border border-emerald-500/20">
                        {squad.supervisorName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate mb-0">
                            {squad.supervisorName}
                          </h4>
                          <span className="text-[9.5px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Team Lead
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mb-0 mt-0.5">
                          ID: SUP-{String(squad.supervisorId).padStart(4, "0")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSquad(supKey)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      title={isCollapsed ? "Expand squad list" : "Collapse squad list"}
                    >
                      <i className={`bi bi-chevron-${isCollapsed ? "down" : "up"} text-xs`}></i>
                    </button>
                  </div>

                  {/* Department & Manager Chain */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] pt-1">
                    {squad.departmentName && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        <i className="bi bi-building text-[9px] text-slate-500"></i>
                        <span>{squad.departmentName}</span>
                      </span>
                    )}
                    {squad.managerName && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium border border-indigo-200/80">
                        <i className="bi bi-person-gear text-[9px] text-indigo-500"></i>
                        <span>Mgr: {squad.managerName}</span>
                      </span>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                      <span className="text-slate-600">
                        Direct Reports ({squad.members.length})
                      </span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9.5px] ${capMeta.bg}`}>
                        {capMeta.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${capMeta.bar} transition-all duration-300 rounded-full`}
                        style={{ width: `${capMeta.capacityPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Squad Members List */}
                {!isCollapsed && (
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                      {squad.members.map((member) => (
                        <div
                          key={`member-${member.id}`}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/70 transition-colors group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {member.employee_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800 text-xs truncate">
                                  {member.employee_name}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">
                                  EMP-{String(member.employee_id).padStart(4, "0")}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {member.employee_email}
                              </span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                            {onInitiateReassign && (
                              <button
                                type="button"
                                onClick={() => onInitiateReassign(member)}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-all cursor-pointer"
                                title="Reassign to another Team Lead"
                              >
                                <i className="bi bi-arrow-left-right text-[10px]"></i>
                              </button>
                            )}
                            {onInitiateUnlink && (
                              <button
                                type="button"
                                onClick={() => onInitiateUnlink(member)}
                                className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                title="Unlink from this squad"
                              >
                                <i className="bi bi-x-circle text-[10px]"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Squad Card Bottom Action */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {squad.members.length} member{squad.members.length === 1 ? "" : "s"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal(undefined, squad.supervisorId)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 border border-indigo-200/60"
                      >
                        <i className="bi bi-plus-lg text-[10px]"></i>
                        <span>Add Member</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned Staff Pool Card (if any unassigned exist) */}
      {unassignedStaff.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <h4 className="text-xs font-bold text-amber-900 mb-0">
                Unassigned Staff Pool ({unassignedStaff.length})
              </h4>
            </div>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
              Needs Squad Assignment
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {unassignedStaff.map((staff) => (
              <div
                key={`unassigned-pool-${staff.id}`}
                className="bg-white rounded-lg p-2 border border-amber-200/80 shadow-2xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate mb-0">{staff.name}</p>
                  <p className="text-[10px] text-slate-400 truncate mb-0">{staff.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAssignModal(staff.id)}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold shrink-0 cursor-pointer shadow-2xs"
                >
                  Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
