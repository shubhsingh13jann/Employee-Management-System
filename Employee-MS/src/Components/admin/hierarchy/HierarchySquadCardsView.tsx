import React, { useState, useMemo } from "react";
import { HierarchyMappingItem, UnassignedEmployee } from "./HierarchyTableView";
import { SupervisorCapacityDrawer } from "./SupervisorCapacityDrawer";

export interface SquadGroup {
  supervisorId: string | number;
  supervisorName: string;
  managerId?: string | number;
  managerName?: string;
  departmentName?: string;
  members: HierarchyMappingItem[];
}

export interface HierarchySquadCardsViewProps {
  mappings: HierarchyMappingItem[];
  unassignedStaff?: UnassignedEmployee[];
  searchTerm?: string;
  onOpenAssignModal: (
    employeeId?: string | number,
    supervisorId?: string | number,
    managerId?: string | number
  ) => void;
  onInitiateReassign?: (employee: HierarchyMappingItem) => void;
  onInitiateUnlink?: (employee: HierarchyMappingItem) => void;
  onInspectSquad?: (squad: SquadGroup) => void;
}

export const HierarchySquadCardsView: React.FC<HierarchySquadCardsViewProps> = ({
  mappings,
  unassignedStaff = [],
  searchTerm = "",
  onOpenAssignModal,
  onInitiateReassign,
  onInitiateUnlink,
  onInspectSquad,
}) => {
  const [collapsedSquads, setCollapsedSquads] = useState<Set<string>>(new Set());
  const [capacityFilter, setCapacityFilter] = useState<"all" | "light" | "optimal" | "high" | "unassigned">("all");
  const [sortBy, setSortBy] = useState<"size-desc" | "size-asc" | "name" | "dept">("size-desc");
  const [cardSearches, setCardSearches] = useState<Record<string, string>>({});
  const [inspectingSquad, setInspectingSquad] = useState<SquadGroup | null>(null);
  const [unassignedSearch, setUnassignedSearch] = useState("");
  const [targetSquadId, setTargetSquadId] = useState<string>("");
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<Set<string | number>>(new Set());
  const [isTrayCollapsed, setIsTrayCollapsed] = useState(false);

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

    return Array.from(map.values());
  }, [mappings]);

  // Capacity breakdown
  const { lightCount, optimalCount, highCount } = useMemo(() => {
    let light = 0;
    let optimal = 0;
    let high = 0;
    squadGroups.forEach((s) => {
      if (s.members.length <= 3) light++;
      else if (s.members.length <= 7) optimal++;
      else high++;
    });
    return { lightCount: light, optimalCount: optimal, highCount: high };
  }, [squadGroups]);

  // Filtered and sorted squads
  const displayedSquads = useMemo(() => {
    if (capacityFilter === "unassigned") return [];

    const filtered = squadGroups.filter((s) => {
      if (capacityFilter === "light") return s.members.length <= 3;
      if (capacityFilter === "optimal") return s.members.length >= 4 && s.members.length <= 7;
      if (capacityFilter === "high") return s.members.length >= 8;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "size-desc") return b.members.length - a.members.length;
      if (sortBy === "size-asc") return a.members.length - b.members.length;
      if (sortBy === "name") return a.supervisorName.localeCompare(b.supervisorName);
      if (sortBy === "dept") return (a.departmentName || "").localeCompare(b.departmentName || "");
      return 0;
    });
  }, [squadGroups, capacityFilter, sortBy]);

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

  const handleExpandAll = () => setCollapsedSquads(new Set());
  const handleCollapseAll = () =>
    setCollapsedSquads(new Set(squadGroups.map((s) => String(s.supervisorId))));

  const selectedTargetSquad = useMemo(() => {
    if (!targetSquadId) return null;
    return squadGroups.find((s) => String(s.supervisorId) === targetSquadId) || null;
  }, [squadGroups, targetSquadId]);

  const filteredUnassigned = useMemo(() => {
    const q = unassignedSearch.toLowerCase().trim();
    if (!q) return unassignedStaff;
    return unassignedStaff.filter(
      (staff) =>
        staff.name.toLowerCase().includes(q) ||
        staff.email.toLowerCase().includes(q) ||
        String(staff.id).includes(q)
    );
  }, [unassignedStaff, unassignedSearch]);

  const toggleSelectUnassigned = (id: string | number) => {
    setSelectedUnassignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllUnassigned = () => {
    if (selectedUnassignedIds.size === filteredUnassigned.length && filteredUnassigned.length > 0) {
      setSelectedUnassignedIds(new Set());
    } else {
      setSelectedUnassignedIds(new Set(filteredUnassigned.map((s) => s.id)));
    }
  };

  const avgSquadSize =
    squadGroups.length > 0 ? (mappings.length / squadGroups.length).toFixed(1) : "0";

  const getCapacityMeta = (count: number) => {
    if (count <= 3) {
      return {
        label: "Light Load",
        badgeText: "Light (1-3)",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        bar: "bg-emerald-500",
        capacityPercent: Math.min(100, Math.round((count / 8) * 100)),
        statusText: "Optimal for Mentorship",
      };
    } else if (count <= 7) {
      return {
        label: "Optimal Squad",
        badgeText: "Optimal (4-7)",
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
        bar: "bg-indigo-500",
        capacityPercent: Math.min(100, Math.round((count / 8) * 100)),
        statusText: "Healthy Span",
      };
    } else if (count === 8) {
      return {
        label: "Full Capacity",
        badgeText: "Full (8/8)",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        bar: "bg-amber-500",
        capacityPercent: 100,
        statusText: "At Target Limit",
      };
    } else {
      return {
        label: "High Span",
        badgeText: "High Span (8+)",
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        bar: "bg-rose-500",
        capacityPercent: 100,
        statusText: "Consider Squad Split",
      };
    }
  };

  const renderUnassignedStaffTray = () => (
    <div className="bg-amber-50/50 border border-amber-200/90 rounded-xl p-3 sm:p-4 shadow-2xs space-y-3 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              unassignedStaff.length > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
            }`}
          ></span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-amber-950 mb-0 flex items-center gap-2">
              <span>Unassigned Staff Allocation Tray</span>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.2 rounded-full border border-amber-300">
                {unassignedStaff.length > 0
                  ? `${unassignedStaff.length} Unallocated Staff`
                  : "All Staff Assigned (100% Coverage)"}
              </span>
            </h4>
            <p className="text-[10px] text-amber-800/80 mb-0">
              Select a target supervisor squad for quick 1-click allocation or onboard staff individually.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTrayCollapsed(!isTrayCollapsed)}
            className="p-1 rounded-md text-amber-800 hover:bg-amber-100/80 transition-colors cursor-pointer text-xs"
            title={isTrayCollapsed ? "Expand allocation tray" : "Collapse allocation tray"}
          >
            <i className={`bi bi-chevron-${isTrayCollapsed ? "down" : "up"}`}></i>
          </button>
        </div>
      </div>

      {!isTrayCollapsed && (
        <>
          {/* Controls: Target Squad Selector + Live Search */}
          <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2.5">
            {/* Target Squad Quick Dropdown */}
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <span className="text-[11px] font-bold text-amber-900 shrink-0">
                Target Squad:
              </span>
              <div className="relative flex-1">
                <select
                  value={targetSquadId}
                  onChange={(e) => setTargetSquadId(e.target.value)}
                  className="w-full bg-white border border-amber-300 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-medium outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="">-- Choose Target Supervisor Squad --</option>
                  {squadGroups.map((s) => (
                    <option key={`target-squad-${s.supervisorId}`} value={String(s.supervisorId)}>
                      {s.supervisorName} ({s.members.length}/8 members{s.departmentName ? ` • ${s.departmentName}` : ""})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter and Select All */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                <input
                  type="text"
                  placeholder="Filter unassigned staff..."
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                  className="pl-7 pr-6 py-1 text-xs rounded-lg bg-white border border-amber-300 text-slate-800 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 shadow-2xs w-44 sm:w-48"
                />
                {unassignedSearch && (
                  <button
                    type="button"
                    onClick={() => setUnassignedSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleSelectAllUnassigned}
                disabled={filteredUnassigned.length === 0}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60 transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedUnassignedIds.size === filteredUnassigned.length && filteredUnassigned.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
          </div>

          {/* Batch Action Banner if items selected */}
          {selectedUnassignedIds.size > 0 && (
            <div className="bg-indigo-600 text-white rounded-lg px-3 py-2 flex items-center justify-between text-xs shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <i className="bi bi-check2-circle text-sm"></i>
                <span className="font-semibold">
                  {selectedUnassignedIds.size} personnel selected
                </span>
                {selectedTargetSquad ? (
                  <span className="text-indigo-200">
                    ➔ Ready to onboard into <strong>{selectedTargetSquad.supervisorName}</strong>'s squad
                  </span>
                ) : (
                  <span className="text-indigo-200">
                    ➔ Select a target squad above to batch allocate
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const firstId = Array.from(selectedUnassignedIds)[0];
                    if (firstId) {
                      onOpenAssignModal(
                        firstId,
                        selectedTargetSquad ? selectedTargetSquad.supervisorId : undefined,
                        selectedTargetSquad ? selectedTargetSquad.managerId : undefined
                      );
                    }
                  }}
                  className="px-3 py-1 rounded bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors cursor-pointer shadow-2xs"
                >
                  {selectedTargetSquad ? "Onboard to Squad" : "Assign Selected"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUnassignedIds(new Set())}
                  className="px-2 py-1 rounded text-white/80 hover:text-white hover:bg-indigo-500 text-[11px] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Unassigned Cards Grid */}
          {unassignedStaff.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-white/80 border border-amber-200/80 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm mx-auto mb-1.5 border border-emerald-200">
                <i className="bi bi-shield-check"></i>
              </div>
              <h5 className="text-xs font-bold text-slate-800 mb-0.5">
                All Workforce Personnel Allocated (100% Coverage)
              </h5>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto mb-2">
                Every active employee is currently assigned to a supervisor squad. When new staff join or are unlinked from a squad (via the ⓧ button on any squad card above), they will appear here in this tray for direct 1-click batch allocation!
              </p>
              <button
                type="button"
                onClick={() => onOpenAssignModal()}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <i className="bi bi-person-plus-fill text-[11px]"></i>
                <span>Open Assignment Modal</span>
              </button>
            </div>
          ) : filteredUnassigned.length === 0 ? (
            <div className="p-4 text-center text-xs text-amber-800 bg-white rounded-lg border border-amber-200">
              No unassigned staff match "{unassignedSearch}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredUnassigned.map((staff) => {
                const isSelected = selectedUnassignedIds.has(staff.id);
                return (
                  <div
                    key={`unassigned-pool-${staff.id}`}
                    className={`bg-white rounded-lg p-2.5 border transition-all flex items-center justify-between gap-2 shadow-2xs ${
                      isSelected
                        ? "border-indigo-500 ring-1 ring-indigo-500/20 bg-indigo-50/20"
                        : "border-amber-200/90 hover:border-amber-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUnassigned(staff.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate mb-0 leading-tight">
                          {staff.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mb-0 font-mono">
                          EMP-{String(staff.id).padStart(4, "0")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenAssignModal(
                          staff.id,
                          selectedTargetSquad ? selectedTargetSquad.supervisorId : undefined,
                          selectedTargetSquad ? selectedTargetSquad.managerId : undefined
                        )
                      }
                      className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs transition-all ${
                        selectedTargetSquad
                          ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                      title={
                        selectedTargetSquad
                          ? `Assign to ${selectedTargetSquad.supervisorName}`
                          : "Assign employee"
                      }
                    >
                      {selectedTargetSquad ? "Onboard" : "Assign"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Executive Squad Telemetry & Controls HUD */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 space-y-3">
        {/* Top Row: Overview Metrics & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <i className="bi bi-people-fill"></i>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight mb-0.5 flex items-center gap-2">
                <span>Supervisor Squad Operations</span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded-full border border-indigo-200">
                  {squadGroups.length} Squads
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight mb-0">
                {mappings.length} assigned personnel • Avg Span: ~{avgSquadSize} staff/squad
              </p>
            </div>
          </div>

          {/* Action Buttons: Expand/Collapse & Sort Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer text-[11px]"
                title="Expand all squads"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer text-[11px]"
                title="Collapse all squads"
              >
                Collapse All
              </button>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 text-xs">
              <i className="bi bi-arrow-down-up text-slate-400 text-[10px]"></i>
              <span className="text-slate-400 text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-800 font-semibold text-[11px] outline-none cursor-pointer"
              >
                <option value="size-desc">Largest Squad First</option>
                <option value="size-asc">Smallest Squad First</option>
                <option value="name">Supervisor (A-Z)</option>
                <option value="dept">Department (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Row: Interactive Capacity Health Filters */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Capacity Filters:</span>
            <button
              type="button"
              onClick={() => setCapacityFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                capacityFilter === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Squads ({squadGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setCapacityFilter("optimal")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                capacityFilter === "optimal"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              <span>Optimal 4-7 ({optimalCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setCapacityFilter("light")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                capacityFilter === "light"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Light 1-3 ({lightCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setCapacityFilter("high")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                capacityFilter === "high"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/80"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>High Span 8+ ({highCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setCapacityFilter("unassigned")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                capacityFilter === "unassigned"
                  ? "bg-amber-600 text-white shadow-2xs ring-2 ring-amber-400/50"
                  : "bg-amber-50/90 text-amber-900 hover:bg-amber-100 border border-amber-300"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  unassignedStaff.length > 0 ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                }`}
              ></span>
              <span>Unassigned Tray ({unassignedStaff.length})</span>
            </button>
          </div>

          {capacityFilter !== "all" && (
            <button
              type="button"
              onClick={() => setCapacityFilter("all")}
              className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <i className="bi bi-x-circle text-[10px]"></i>
              <span>{capacityFilter === "unassigned" ? "Back to All Squads" : "Clear Health Filter"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Squad Grid or Unassigned Tray View */}
      {capacityFilter === "unassigned" ? (
        renderUnassignedStaffTray()
      ) : (
        displayedSquads.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl mx-auto mb-3 shadow-xs">
            <i className="bi bi-people"></i>
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">No Matching Squads</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {capacityFilter !== "all"
              ? `No supervisor squads match the "${capacityFilter}" capacity load filter.`
              : searchTerm
              ? `No supervisor squads match the search term "${searchTerm}".`
              : "No team lead reporting lines have been established yet."}
          </p>
          <div className="flex items-center justify-center gap-2">
            {capacityFilter !== "all" && (
              <button
                type="button"
                onClick={() => setCapacityFilter("all")}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Show All Squads
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenAssignModal()}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <i className="bi bi-person-plus-fill"></i>
              <span>Create Squad Mapping</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {displayedSquads.map((squad) => {
            const supKey = String(squad.supervisorId);
            const isCollapsed = collapsedSquads.has(supKey);
            const capMeta = getCapacityMeta(squad.members.length);
            const cardSearch = (cardSearches[supKey] || "").toLowerCase().trim();
            const displayedMembers = cardSearch
              ? squad.members.filter(
                  (m) =>
                    m.employee_name.toLowerCase().includes(cardSearch) ||
                    m.employee_email.toLowerCase().includes(cardSearch) ||
                    String(m.employee_id).includes(cardSearch)
                )
              : squad.members;

            const cardAccentGlow =
              squad.members.length <= 3
                ? "hover:border-emerald-300 hover:ring-1 hover:ring-emerald-400/20"
                : squad.members.length <= 7
                ? "hover:border-indigo-300 hover:ring-1 hover:ring-indigo-400/20"
                : squad.members.length === 8
                ? "hover:border-amber-300 hover:ring-1 hover:ring-amber-400/20"
                : "hover:border-rose-300 hover:ring-1 hover:ring-rose-400/20";

            return (
              <div
                key={`squad-${supKey}`}
                className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col overflow-hidden group ${cardAccentGlow}`}
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

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (onInspectSquad) {
                            onInspectSquad(squad);
                          } else {
                            setInspectingSquad(squad);
                          }
                        }}
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white transition-all cursor-pointer shadow-2xs border border-transparent hover:border-indigo-200"
                        title="Inspect squad capacity and details"
                      >
                        <i className="bi bi-sliders text-xs"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSquad(supKey)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                        title={isCollapsed ? "Expand squad roster" : "Collapse squad roster"}
                      >
                        <i className={`bi bi-chevron-${isCollapsed ? "down" : "up"} text-xs`}></i>
                      </button>
                    </div>
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

                  {/* Capacity Bar & Ratio Gauge */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span>Roster Capacity:</span>
                        <span className="font-bold text-slate-900">{squad.members.length} / 8</span>
                        <span className="text-slate-400 font-normal">({capMeta.capacityPercent}%)</span>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded border text-[9.5px] font-semibold ${capMeta.bg}`}>
                        {capMeta.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${capMeta.bar} transition-all duration-300 rounded-full`}
                        style={{ width: `${capMeta.capacityPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1">
                      <span>{capMeta.statusText}</span>
                      <span>
                        {8 - squad.members.length > 0
                          ? `${8 - squad.members.length} slots available`
                          : squad.members.length === 8
                          ? "Target reached"
                          : `${squad.members.length - 8} over target`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Squad Members List */}
                {!isCollapsed && (
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    {/* Inline Filter if squad has > 3 members */}
                    {squad.members.length > 3 && (
                      <div className="mb-2 relative">
                        <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                        <input
                          type="text"
                          placeholder="Filter squad members..."
                          value={cardSearches[supKey] || ""}
                          onChange={(e) =>
                            setCardSearches((prev) => ({
                              ...prev,
                              [supKey]: e.target.value,
                            }))
                          }
                          className="w-full pl-7 pr-6 py-1 rounded-md text-[11px] bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:outline-none transition-all placeholder:text-slate-400"
                        />
                        {cardSearches[supKey] && (
                          <button
                            type="button"
                            onClick={() =>
                              setCardSearches((prev) => ({
                                ...prev,
                                [supKey]: "",
                              }))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
                          >
                            <i className="bi bi-x-circle-fill"></i>
                          </button>
                        )}
                      </div>
                    )}

                    {displayedMembers.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        No members match search
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5 [scrollbar-width:thin]">
                        {displayedMembers.map((member) => (
                          <div
                            key={`member-${member.id}`}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 hover:bg-slate-100/80 border border-slate-200/70 transition-colors group/item"
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
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover/item:opacity-100 transition-opacity">
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
                    )}

                    {/* Squad Card Bottom Action */}
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {squad.members.length} direct report{squad.members.length === 1 ? "" : "s"}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal(undefined, squad.supervisorId, squad.managerId)}
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
        )
      )}

      {/* Quick Access Shortcut when viewing squad cards and unassigned personnel exist */}
      {capacityFilter !== "unassigned" && unassignedStaff.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/30 border border-amber-200/90 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <div>
              <p className="text-xs font-bold text-amber-950 mb-0 flex items-center gap-1.5">
                <span>{unassignedStaff.length} Unallocated Staff Personnel in Queue</span>
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-full font-semibold">
                  Awaiting Squad Assignment
                </span>
              </p>
              <p className="text-[11px] text-amber-800/80 mb-0">
                Staff members not yet linked to any supervisor squad. Click the <strong>Unassigned Tray ({unassignedStaff.length})</strong> tab above or use the button to onboard them.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCapacityFilter("unassigned")}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <i className="bi bi-person-plus-fill text-[11px]"></i>
            <span>Switch to Unassigned Tray</span>
          </button>
        </div>
      )}

      {/* Slide-out Supervisor Capacity Inspector Drawer */}
      <SupervisorCapacityDrawer
        isOpen={Boolean(inspectingSquad)}
        onClose={() => setInspectingSquad(null)}
        squad={inspectingSquad}
        onOpenAssignModal={onOpenAssignModal}
        onInitiateReassign={onInitiateReassign}
        onInitiateUnlink={onInitiateUnlink}
      />
    </div>
  );
};
