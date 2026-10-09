import React, { useState, useMemo, useEffect, useRef } from "react";
import { HierarchyMappingItem, UnassignedEmployee } from "./HierarchyTableView";

export interface ReassignDropPayload {
  employee: HierarchyMappingItem;
  targetSupervisor?: { id: string | number; name: string; department?: string };
  targetManager?: { id: string | number; name: string; department?: string };
}

interface HierarchyOrgChartViewProps {
  mappings: HierarchyMappingItem[];
  unassignedStaff?: UnassignedEmployee[];
  searchTerm: string;
  onOpenAssignModal: (employeeId?: string | number) => void;
  onInitiateReassign?: (employee: HierarchyMappingItem) => void;
  onInitiateUnlink?: (employee: HierarchyMappingItem) => void;
  onReassignDrop?: (payload: ReassignDropPayload) => void;
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
  unassignedStaff = [],
  searchTerm,
  onOpenAssignModal,
  onInitiateReassign,
  onInitiateUnlink,
  onReassignDrop,
}) => {
  // Collapsed state tracking (IDs of nodes that are collapsed)
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Drag and Drop reporting line reallocation state
  const [draggingEmpId, setDraggingEmpId] = useState<string | number | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  // Interactive Canvas Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.5, Number((prev + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
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
          const hasEmpMatch = s.employees.some(
            (e) =>
              e.employee_name?.toLowerCase().includes(query) ||
              e.employee_email?.toLowerCase().includes(query)
          );
          if (mgrMatch || supMatch || hasEmpMatch) {
            next.delete(`mgr-${m.id}`);
            next.delete(`sup-${s.id}`);
          }
        });
      });
      return next;
    });
  }, [searchTerm, managersTree]);

  // Search match statistics
  const totalMatches = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    const q = searchTerm.toLowerCase();
    let count = 0;
    mappings.forEach((m) => {
      if (
        m.employee_name?.toLowerCase().includes(q) ||
        m.supervisor_name?.toLowerCase().includes(q) ||
        m.manager_name?.toLowerCase().includes(q) ||
        m.department_name?.toLowerCase().includes(q)
      ) {
        count++;
      }
    });
    return count;
  }, [mappings, searchTerm]);

  const totalEmployeesInTree = mappings.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-4 mb-3 overflow-hidden">
      {/* Tree View Compact Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            <i className="bi bi-diagram-3"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-0">
                Visual Chain of Command
              </h3>
              {searchTerm.trim() !== "" && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <i className="bi bi-search mr-1"></i>
                  {totalMatches} match{totalMatches === 1 ? "" : "es"}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mb-0">
              Interactive parent-child view: Enterprise ➔ Managers ➔ Team Leads ➔ Direct Reports
            </p>
          </div>
        </div>

        {/* Canvas Toolbar: Expand/Collapse & Zoom/Pan Controls */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.6}
              className="w-6 h-6 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white flex items-center justify-center text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              title="Zoom Out"
            >
              <i className="bi bi-dash"></i>
            </button>
            <span className="px-1.5 text-[10px] font-mono font-bold text-slate-700 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 1.5}
              className="w-6 h-6 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white flex items-center justify-center text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
              title="Zoom In"
            >
              <i className="bi bi-plus"></i>
            </button>
            <div className="w-px h-3 bg-slate-300 mx-1"></div>
            <button
              type="button"
              onClick={handleResetView}
              className="px-1.5 h-6 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white flex items-center justify-center text-[10px] font-semibold transition-all cursor-pointer"
              title="Reset Zoom & Pan"
            >
              Reset
            </button>
          </div>

          {/* Branch Expand/Collapse */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setCollapsedNodes(new Set())}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
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
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer"
              title="Collapse All Nodes"
            >
              <i className="bi bi-arrows-collapse mr-1"></i>
              <span>Collapse</span>
            </button>
          </div>
        </div>
      </div>

      {/* Org Chart Legend */}
      <div className="flex flex-wrap items-center gap-2 pb-2 mb-2 text-[10px] text-slate-500 border-b border-slate-100">
        <span className="font-semibold text-slate-600">Levels:</span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-900 text-white font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Enterprise HQ
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> Manager
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Team Lead
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Direct Report
        </span>
        <span className="ml-auto text-slate-400 italic hidden md:inline">
          💡 Drag & drop staff cards to reallocate reporting lines
        </span>
      </div>

      {/* Unassigned Staff Quick Allocation Tray / Dock */}
      {unassignedStaff && unassignedStaff.length > 0 && (
        <div className="mb-2.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-[11px] font-bold text-amber-950">
                Unassigned Staff Pool ({unassignedStaff.length} unmapped):
              </span>
              <span className="text-[10px] text-amber-800 hidden sm:inline">
                Drag card onto any Team Lead card below to assign reporting line
              </span>
            </div>
            <button
              type="button"
              onClick={() => onOpenAssignModal()}
              className="px-2 py-0.5 rounded bg-amber-600 text-white hover:bg-amber-500 text-[10px] font-semibold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <i className="bi bi-plus-lg mr-1"></i>
              <span>Assign Staff</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {unassignedStaff.map((staff) => (
              <div
                key={staff.id}
                draggable={true}
                onDragStart={(e) => {
                  const dragPayload: HierarchyMappingItem = {
                    id: staff.id,
                    employee_id: staff.id,
                    employee_name: staff.name,
                    employee_email: staff.email,
                    supervisor_id: "",
                    supervisor_name: "Unassigned",
                    manager_id: "",
                    manager_name: "Unassigned",
                    department_name: staff.department_name || "General",
                    assigned_at: new Date().toISOString(),
                  };
                  e.dataTransfer.setData("application/json", JSON.stringify(dragPayload));
                  e.dataTransfer.effectAllowed = "move";
                  setDraggingEmpId(staff.id);
                }}
                onDragEnd={() => {
                  setDraggingEmpId(null);
                  setDropTargetKey(null);
                }}
                className={`shrink-0 px-2 py-1 rounded-lg border bg-white border-amber-200 hover:border-amber-400 hover:shadow-xs transition-all flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none text-[11px] ${
                  draggingEmpId === staff.id ? "opacity-40 scale-95 border-dashed border-amber-500" : ""
                }`}
                title="Drag onto a Team Lead card to assign"
              >
                <i className="bi bi-grip-vertical text-amber-400 text-xs"></i>
                <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                  {staff.name ? staff.name.charAt(0) : "U"}
                </div>
                <div className="text-left min-w-0">
                  <span className="font-bold text-slate-800 block text-[11px] truncate max-w-[100px] leading-tight">
                    {staff.name}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate leading-tight">
                    {staff.department_name || "General"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenAssignModal(staff.id)}
                  className="ml-1 px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[9px] font-semibold transition-colors cursor-pointer"
                  title="Assign Team"
                >
                  Map
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Tree Canvas Container with Pan/Zoom Transform */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`overflow-auto min-h-[380px] max-h-[560px] pb-8 pt-3 bg-slate-50/50 rounded-xl select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {managersTree.length === 0 ? (
          <div className="py-14 text-center max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg mx-auto mb-2">
              <i className="bi bi-diagram-3"></i>
            </div>
            <p className="font-bold text-slate-800 text-xs sm:text-sm mb-0.5">No Hierarchy Mappings Active</p>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Assign staff members to create visual organizational reporting trees.
            </p>
            <button
              type="button"
              onClick={() => onOpenAssignModal()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-xs hover:bg-indigo-500 cursor-pointer"
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
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-slate-800 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center font-bold text-xs shadow-inner">
                  <i className="bi bi-buildings-fill"></i>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0 tracking-wide">
                    Enterprise Executive Headquarters
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-0.2">
                    <span>{managersTree.length} Department Managers</span>
                    <span>•</span>
                    <span>{totalEmployeesInTree} Active Staff Mapped</span>
                  </div>
                </div>
              </div>

              {/* Vertical connector line below Root */}
              <div className="w-0.5 h-5 bg-indigo-300"></div>
            </div>

            {/* Level 1: Managers Tier (Horizontal Row) */}
            <div className="flex items-start justify-center gap-8 relative pt-1">
              {managersTree.map((manager) => {
                const mgrKey = `mgr-${manager.id}`;
                const isMgrCollapsed = collapsedNodes.has(mgrKey);
                const supervisorsList = Array.from(manager.supervisors.values());
                const totalDirectReports = supervisorsList.reduce(
                  (sum, s) => sum + s.employees.length,
                  0
                );

                const isMgrMatch =
                  searchTerm.trim() !== "" &&
                  (manager.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    manager.department?.toLowerCase().includes(searchTerm.toLowerCase()));

                const isMgrDropTarget = dropTargetKey === mgrKey;

                return (
                  <div key={manager.id} className="flex flex-col items-center relative">
                    {/* Manager Node Card (Drop target for reallocation) */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dropTargetKey !== mgrKey) setDropTargetKey(mgrKey);
                      }}
                      onDragLeave={() => {
                        if (dropTargetKey === mgrKey) setDropTargetKey(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDropTargetKey(null);
                        try {
                          const dataStr = e.dataTransfer.getData("application/json");
                          if (!dataStr) return;
                          const droppedEmp = JSON.parse(dataStr) as HierarchyMappingItem;
                          if (String(droppedEmp.manager_id) === String(manager.id)) return;
                          if (onReassignDrop) {
                            onReassignDrop({
                              employee: droppedEmp,
                              targetManager: { id: manager.id, name: manager.name, department: manager.department },
                            });
                          }
                        } catch (err) {
                          console.error("Drop error", err);
                        }
                      }}
                      className={`w-56 p-2.5 rounded-xl bg-white transition-all flex flex-col gap-1.5 relative group border-t-4 ${
                        isMgrDropTarget
                          ? "ring-4 ring-indigo-400 border-2 border-dashed border-indigo-600 bg-indigo-50/90 scale-105 shadow-xl"
                          : isMgrMatch
                          ? "border-amber-400 ring-2 ring-amber-300 shadow-md border-t-amber-500"
                          : "border-indigo-100 shadow-xs hover:shadow-md border-t-indigo-600"
                      }`}
                    >
                      {isMgrDropTarget && (
                        <div className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold text-center animate-pulse flex items-center justify-center gap-1 shadow-xs">
                          <i className="bi bi-box-arrow-in-down"></i>
                          <span>Drop to Reassign Manager</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          👔 Manager
                        </span>
                        <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                          {manager.department}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {manager.name ? manager.name.charAt(0) : "M"}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs mb-0 truncate">
                            {manager.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {supervisorsList.length} Team Leads • {totalDirectReports} Staff
                          </span>
                        </div>
                      </div>

                      {/* Expand / Collapse Toggle Button */}
                      {supervisorsList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleNodeCollapse(mgrKey)}
                          className="mt-0.5 w-full py-0.5 rounded-md bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <i
                            className={`bi ${
                              isMgrCollapsed ? "bi-chevron-down" : "bi-chevron-up"
                            } text-[10px]`}
                          ></i>
                          <span>
                            {isMgrCollapsed
                              ? `Show ${supervisorsList.length} Leads`
                              : "Collapse Squads"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Level 2: Supervisors Connector and Branch */}
                    {!isMgrCollapsed && supervisorsList.length > 0 && (
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-4 bg-slate-300"></div>

                        <div className="flex items-start justify-center gap-5 relative">
                          {supervisorsList.map((sup) => {
                            const supKey = `sup-${sup.id}`;
                            const isSupCollapsed = collapsedNodes.has(supKey);
                            const isSupMatch =
                              searchTerm.trim() !== "" &&
                              (sup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                sup.department?.toLowerCase().includes(searchTerm.toLowerCase()));
                            const isSupDropTarget = dropTargetKey === supKey;

                            return (
                              <div key={sup.id} className="flex flex-col items-center relative">
                                {/* Supervisor Node Card (Drop target for reporting line reallocation) */}
                                <div
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "move";
                                    if (dropTargetKey !== supKey) setDropTargetKey(supKey);
                                  }}
                                  onDragLeave={() => {
                                    if (dropTargetKey === supKey) setDropTargetKey(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setDropTargetKey(null);
                                    try {
                                      const dataStr = e.dataTransfer.getData("application/json");
                                      if (!dataStr) return;
                                      const droppedEmp = JSON.parse(dataStr) as HierarchyMappingItem;
                                      if (String(droppedEmp.supervisor_id) === String(sup.id)) return;
                                      if (onReassignDrop) {
                                        onReassignDrop({
                                          employee: droppedEmp,
                                          targetSupervisor: { id: sup.id, name: sup.name, department: sup.department },
                                          targetManager: { id: manager.id, name: manager.name, department: manager.department },
                                        });
                                      }
                                    } catch (err) {
                                      console.error("Drop error", err);
                                    }
                                  }}
                                  className={`w-50 p-2.5 rounded-xl bg-white transition-all flex flex-col gap-1.5 relative border-t-4 ${
                                    isSupDropTarget
                                      ? "ring-4 ring-emerald-400 border-2 border-dashed border-emerald-600 bg-emerald-50/90 scale-105 shadow-xl"
                                      : isSupMatch
                                      ? "border-amber-400 ring-2 ring-amber-300 shadow-md border-t-amber-500"
                                      : "border-emerald-100 shadow-2xs hover:shadow-sm border-t-emerald-500"
                                  }`}
                                >
                                  {isSupDropTarget && (
                                    <div className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold text-center animate-pulse flex items-center justify-center gap-1 shadow-xs">
                                      <i className="bi bi-box-arrow-in-down"></i>
                                      <span>Drop to Assign Lead</span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      👷 Team Lead
                                    </span>
                                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                      {sup.employees.length} reports
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
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
                                      className="mt-0.5 w-full py-0.5 rounded-md bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
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

                                {/* Level 3: Direct Reports (Staff Members with Draggable reallocation) */}
                                {!isSupCollapsed && sup.employees.length > 0 && (
                                  <div className="flex flex-col items-center">
                                    <div className="w-0.5 h-4 bg-slate-300"></div>

                                    <div className="flex flex-col gap-1.5 items-center">
                                      {sup.employees.map((emp) => {
                                        const isSearchMatch =
                                          searchTerm.trim() !== "" &&
                                          (emp.employee_name
                                            ?.toLowerCase()
                                            .includes(searchTerm.toLowerCase()) ||
                                            emp.employee_email
                                              ?.toLowerCase()
                                              .includes(searchTerm.toLowerCase()));
                                        const isBeingDragged = draggingEmpId === emp.employee_id;

                                        return (
                                          <div
                                            key={emp.id}
                                            draggable={true}
                                            onDragStart={(e) => {
                                              e.dataTransfer.setData(
                                                "application/json",
                                                JSON.stringify(emp)
                                              );
                                              e.dataTransfer.effectAllowed = "move";
                                              setDraggingEmpId(emp.employee_id);
                                            }}
                                            onDragEnd={() => {
                                              setDraggingEmpId(null);
                                              setDropTargetKey(null);
                                            }}
                                            className={`w-48 p-2 rounded-lg border transition-all flex items-center justify-between gap-1.5 shadow-2xs cursor-grab active:cursor-grabbing select-none ${
                                              isBeingDragged
                                                ? "opacity-30 scale-95 border-dashed border-indigo-500 bg-indigo-50/50"
                                                : isSearchMatch
                                                ? "bg-amber-50 border-amber-400 ring-2 ring-amber-300 shadow-md"
                                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                                            }`}
                                          >
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <span
                                                className="text-slate-400 hover:text-slate-600 cursor-grab text-xs shrink-0"
                                                title="Drag to reallocate reporting line"
                                              >
                                                <i className="bi bi-grip-vertical"></i>
                                              </span>
                                              <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
                                                {emp.employee_name
                                                  ? emp.employee_name.charAt(0)
                                                  : "E"}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-[11px] mb-0 truncate">
                                                  {emp.employee_name}
                                                </p>
                                                <p className="text-[9px] text-slate-400 mb-0 truncate">
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
                                                  className="w-5 h-5 rounded bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 flex items-center justify-center text-[9px] transition-colors cursor-pointer"
                                                  title="Reassign Reporting Line"
                                                >
                                                  <i className="bi bi-arrow-left-right"></i>
                                                </button>
                                              )}
                                              {onInitiateUnlink && (
                                                <button
                                                  type="button"
                                                  onClick={() => onInitiateUnlink(emp)}
                                                  className="w-5 h-5 rounded bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 flex items-center justify-center text-[9px] transition-colors cursor-pointer"
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
