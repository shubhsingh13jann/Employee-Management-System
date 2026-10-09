import React, { useState, useMemo, useEffect, useRef } from "react";
import { HierarchyMappingItem } from "./HierarchyTableView";

interface HierarchyOrgChartViewProps {
  mappings: HierarchyMappingItem[];
  searchTerm: string;
  onOpenAssignModal: (employeeId?: string | number) => void;
  onInitiateReassign?: (employee: HierarchyMappingItem) => void;
  onInitiateUnlink?: (employee: HierarchyMappingItem) => void;
}

interface TreeNodeManager {
  id: string | number;
  name: string;
  email?: string;
  image?: string;
  department?: string;
  supervisors: Map<string | number, TreeNodeSupervisor>;
}

interface TreeNodeSupervisor {
  id: string | number;
  name: string;
  email?: string;
  image?: string;
  department?: string;
  employees: HierarchyMappingItem[];
}

export const HierarchyOrgChartView: React.FC<HierarchyOrgChartViewProps> = ({
  mappings,
  searchTerm,
  onOpenAssignModal,
  onInitiateReassign,
  onInitiateUnlink,
}) => {
  // Collapsed state tracking (IDs of nodes that are collapsed)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Interactive Canvas Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.6, Number((prev + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only pan if clicking on empty canvas background (not on buttons or cards)
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest(".org-card-clickable")) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const toggleNodeCollapse = (nodeKey: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
      }
      return next;
    });
  };

  // Build hierarchical tree structure from flat mappings
  const managersTree = useMemo(() => {
    const managersMap = new Map<string | number, TreeNodeManager>();

    mappings.forEach((item) => {
      // 1. Manager level
      if (!managersMap.has(item.manager_id)) {
        managersMap.set(item.manager_id, {
          id: item.manager_id,
          name: item.manager_name,
          department: item.department_name || "General",
          supervisors: new Map(),
        });
      }
      const mgrNode = managersMap.get(item.manager_id)!;

      // 2. Supervisor level
      if (!mgrNode.supervisors.has(item.supervisor_id)) {
        mgrNode.supervisors.set(item.supervisor_id, {
          id: item.supervisor_id,
          name: item.supervisor_name,
          department: item.department_name || "General",
          employees: [],
        });
      }
      const supNode = mgrNode.supervisors.get(item.supervisor_id)!;

      // 3. Employee level
      supNode.employees.push(item);
    });

    return Array.from(managersMap.values());
  }, [mappings]);

  // Auto-expand branches when search term matches any employee, supervisor, or manager
  useEffect(() => {
    if (!searchTerm.trim()) return;
    const query = searchTerm.toLowerCase();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      managersTree.forEach((m) => {
        const mgrMatch = m.name?.toLowerCase().includes(query) || m.department?.toLowerCase().includes(query);
        Array.from(m.supervisors.values()).forEach((s) => {
          const supMatch = s.name?.toLowerCase().includes(query) || s.department?.toLowerCase().includes(query);
          const hasMatchingEmp = s.employees.some(
            (e) =>
              e.employee_name?.toLowerCase().includes(query) ||
              e.employee_email?.toLowerCase().includes(query)
          );
          if (mgrMatch || supMatch || hasMatchingEmp) {
            next.delete(`mgr-${m.id}`);
            next.delete(`sup-${s.id}`);
          }
        });
      });
      return next;
    });
  }, [searchTerm, managersTree]);

  // Total matching records count
  const totalMatches = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    const query = searchTerm.toLowerCase();
    let count = 0;
    mappings.forEach((item) => {
      if (
        item.employee_name?.toLowerCase().includes(query) ||
        item.employee_email?.toLowerCase().includes(query) ||
        item.supervisor_name?.toLowerCase().includes(query) ||
        item.manager_name?.toLowerCase().includes(query)
      ) {
        count++;
      }
    });
    return count;
  }, [mappings, searchTerm]);

  const totalEmployeesInTree = mappings.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 mb-6 overflow-hidden">
      {/* Tree View Top Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base shadow-2xs">
            <i className="bi bi-diagram-3"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-0">
                Interactive Chain of Command Tree
              </h3>
              {searchTerm.trim() !== "" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  <i className="bi bi-search mr-1"></i>
                  {totalMatches} {totalMatches === 1 ? "match" : "matches"} found
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mb-0">
              Visual parent-child reporting: Company ➔ Managers ➔ Team Leads ➔ Direct Reports
            </p>
          </div>
        </div>

        {/* Canvas Toolbar: Expand/Collapse & Zoom/Pan Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100/90 border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.6}
              className="w-7 h-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white flex items-center justify-center text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              title="Zoom Out"
            >
              <i className="bi bi-dash"></i>
            </button>
            <span className="px-2 text-[11px] font-mono font-bold text-slate-700 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 1.6}
              className="w-7 h-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white flex items-center justify-center text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              title="Zoom In"
            >
              <i className="bi bi-plus"></i>
            </button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <button
              type="button"
              onClick={handleResetView}
              className="px-2 h-7 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white flex items-center justify-center text-[10px] font-semibold transition-all cursor-pointer"
              title="Reset Zoom & Pan"
            >
              Reset (100%)
            </button>
          </div>

          {/* Branch Expand/Collapse */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setCollapsedNodes(new Set())}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Expand All Nodes"
            >
              <i className="bi bi-arrows-expand mr-1"></i>
              <span>Expand</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const allKeys = new Set<string>();
                managersTree.forEach((m) => {
                  allKeys.add(`mgr-${m.id}`);
                  Array.from(m.supervisors.values()).forEach((s) => {
                    allKeys.add(`sup-${s.id}`);
                  });
                });
                setCollapsedNodes(allKeys);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Collapse All Nodes"
            >
              <i className="bi bi-arrows-collapse mr-1"></i>
              <span>Collapse</span>
            </button>
          </div>
        </div>
      </div>

      {/* Org Chart Legend */}
      <div className="flex flex-wrap items-center gap-3 pb-3 mb-2 text-[10px] text-slate-500 border-b border-slate-100">
        <span className="font-semibold text-slate-600">Hierarchy Levels:</span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-900 text-white font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Enterprise HQ
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Department Manager
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Team Lead / Supervisor
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Direct Report
        </span>
        <span className="ml-auto text-slate-400 italic">
          💡 Click and drag empty space to pan canvas • Use + / - to zoom
        </span>
      </div>

      {/* Main Tree Canvas Container with Pan/Zoom Transform */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`overflow-auto min-h-[520px] pb-10 pt-4 bg-radial from-slate-50/80 via-white to-slate-50/40 rounded-xl select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {managersTree.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl mx-auto mb-2">
              <i className="bi bi-diagram-3"></i>
            </div>
            <p className="font-bold text-slate-800 text-sm mb-1">No Hierarchy Mappings</p>
            <p className="text-xs text-slate-500 mb-3">
              Assign staff members to create visual organizational reporting trees.
            </p>
            <button
              type="button"
              onClick={() => onOpenAssignModal()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-500 cursor-pointer"
            >
              Assign First Team
            </button>
          </div>
        ) : (
          <div
            className="flex flex-col items-center min-w-max px-4 transition-transform duration-75 ease-out origin-top"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top center",
            }}
          >
            {/* Level 0: Enterprise Root Node */}
            <div className="flex flex-col items-center">
              <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold text-base shadow-inner">
                  <i className="bi bi-buildings-fill"></i>
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white mb-0 tracking-wide">
                    Enterprise Executive Headquarters
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.5">
                    <span>{managersTree.length} Department Managers</span>
                    <span>•</span>
                    <span>{totalEmployeesInTree} Active Staff Mapped</span>
                  </div>
                </div>
              </div>

              {/* Vertical connector line below Root */}
              <div className="w-0.5 h-8 bg-indigo-300"></div>
            </div>

            {/* Level 1: Managers Tier (Horizontal Row) */}
            <div className="flex items-start justify-center gap-8 relative pt-2">
              {managersTree.map((manager, mIdx) => {
                const mgrKey = `mgr-${manager.id}`;
                const isMgrCollapsed = collapsedNodes.has(mgrKey);
                const isMgrMatch =
                  searchTerm.trim() !== "" &&
                  (manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    manager.department?.toLowerCase().includes(searchTerm.toLowerCase()));
                const supervisorsList = Array.from(manager.supervisors.values());
                const totalDirectReports = supervisorsList.reduce(
                  (sum, s) => sum + s.employees.length,
                  0
                );

                return (
                  <div key={manager.id} className="flex flex-col items-center relative">
                    {/* Manager Node Card */}
                    <div
                      className={`w-64 p-3.5 rounded-2xl bg-white transition-all flex flex-col gap-2 relative group border-t-4 ${
                        isMgrMatch
                          ? "border-amber-400 ring-2 ring-amber-300 shadow-lg border-t-amber-500"
                          : "border-indigo-100 shadow-md hover:shadow-lg border-t-indigo-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          👔 Manager
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {manager.department}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          {manager.name ? manager.name.charAt(0) : "M"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-0 truncate">
                            {manager.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {supervisorsList.length} Team Leads • {totalDirectReports} Total Staff
                          </span>
                        </div>
                      </div>

                      {/* Expand / Collapse Toggle Button */}
                      {supervisorsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleNodeCollapse(mgrKey)}
                          className="mt-1 w-full py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <i
                            className={`bi ${
                              isMgrCollapsed ? "bi-chevron-down" : "bi-chevron-up"
                            } text-xs`}
                          ></i>
                          <span>
                            {isMgrCollapsed
                              ? `Show ${supervisorsList.length} Team Leads`
                              : "Collapse Squads"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Level 2: Supervisors Connector and Branch */}
                    {!isMgrCollapsed && supervisorsList.length > 0 && (
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-6 bg-slate-300"></div>

                        <div className="flex items-start justify-center gap-6 relative">
                          {supervisorsList.map((sup) => {
                            const supKey = `sup-${sup.id}`;
                            const isSupCollapsed = collapsedNodes.has(supKey);
                            const isSupMatch =
                              searchTerm.trim() !== "" &&
                              (sup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                sup.department?.toLowerCase().includes(searchTerm.toLowerCase()));

                            return (
                              <div key={sup.id} className="flex flex-col items-center relative">
                                {/* Supervisor Node Card */}
                                <div
                                  className={`w-56 p-3 rounded-2xl bg-white transition-all flex flex-col gap-2 relative border-t-4 ${
                                    isSupMatch
                                      ? "border-amber-400 ring-2 ring-amber-300 shadow-md border-t-amber-500"
                                      : "border-emerald-100 shadow-sm hover:shadow-md border-t-emerald-500"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      👷 Team Lead
                                    </span>
                                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      {sup.employees.length} reports
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                      {sup.name ? sup.name.charAt(0) : "S"}
                                    </div>
                                    <div className="min-w-0">
                                      <h5 className="font-bold text-slate-900 text-xs mb-0 truncate">
                                        {sup.name}
                                      </h5>
                                      <span className="text-[10px] text-slate-400 block truncate">
                                        {sup.department}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Expand / Collapse Employees button */}
                                  {sup.employees.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleNodeCollapse(supKey)}
                                      className="mt-0.5 w-full py-1 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                    >
                                      <i
                                        className={`bi ${
                                          isSupCollapsed ? "bi-chevron-down" : "bi-chevron-up"
                                        } text-[10px]`}
                                      ></i>
                                      <span>
                                        {isSupCollapsed
                                          ? `Show ${sup.employees.length} Staff`
                                          : "Collapse Staff"}
                                      </span>
                                    </button>
                                  )}
                                </div>

                                {/* Level 3: Direct Reports (Staff Members) */}
                                {!isSupCollapsed && sup.employees.length > 0 && (
                                  <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-5 bg-slate-300"></div>

                                    <div className="flex flex-col gap-2.5 items-center">
                                      {sup.employees.map((emp) => {
                                        const isSearchMatch =
                                          searchTerm.trim() !== "" &&
                                          (emp.employee_name
                                            ?.toLowerCase()
                                            .includes(searchTerm.toLowerCase()) ||
                                            emp.employee_email
                                              ?.toLowerCase()
                                              .includes(searchTerm.toLowerCase()));

                                        return (
                                          <div
                                            key={emp.id}
                                            className={`w-52 p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${
                                              isSearchMatch
                                                ? "bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-md"
                                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                                {emp.employee_name
                                                  ? emp.employee_name.charAt(0)
                                                  : "E"}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-xs mb-0 truncate">
                                                  {emp.employee_name}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mb-0 truncate">
                                                  EMP-{String(emp.employee_id).padStart(4, "0")}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex items-center gap-1 shrink-0">
                                              {onInitiateReassign && (
                                                <button
                                                  type="button"
                                                  onClick={() => onInitiateReassign(emp)}
                                                  className="w-6 h-6 rounded-md bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                                                  title="Reassign Supervisor"
                                                >
                                                  <i className="bi bi-arrow-left-right"></i>
                                                </button>
                                              )}
                                              {onInitiateUnlink && (
                                                <button
                                                  type="button"
                                                  onClick={() => onInitiateUnlink(emp)}
                                                  className="w-6 h-6 rounded-md bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 flex items-center justify-center text-[10px] transition-colors cursor-pointer"
                                                  title="Unlink Reporting Relationship"
                                                >
                                                  <i className="bi bi-link-45deg"></i>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
