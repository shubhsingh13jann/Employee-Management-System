import React, { useEffect, useState } from "react";
import api from "../api/axios";

interface DepartmentRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number | null;
  departmentName?: string;
  onTransferClick?: (userId?: number) => void;
  onEditClick?: (dept: any) => void;
  onDecommissionClick?: (dept: any) => void;
}

export const DepartmentRosterModal: React.FC<DepartmentRosterModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName = "Department",
  onTransferClick,
  onEditClick,
  onDecommissionClick
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"leadership" | "staff" | "tree" | "history">("leadership");
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState<boolean>(false);
  const [transfersError, setTransfersError] = useState<string>("");
  const [transferFilterMode, setTransferFilterMode] = useState<"all" | "inbound" | "outbound">("all");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [expandedSupervisorIds, setExpandedSupervisorIds] = useState<number[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [staffFilterMode, setStaffFilterMode] = useState<"all" | "assigned" | "direct_hod">("all");
  const [collapsedTreeSupervisors, setCollapsedTreeSupervisors] = useState<number[]>([]);

  const toggleSupervisorExpand = (supId: number) => {
    setExpandedSupervisorIds((prev) =>
      prev.includes(supId) ? prev.filter((id) => id !== supId) : [...prev, supId]
    );
  };

  const toggleTreeSupervisorCollapse = (supId: number) => {
    setCollapsedTreeSupervisors((prev) =>
      prev.includes(supId) ? prev.filter((id) => id !== supId) : [...prev, supId]
    );
  };

  const collapseAllTreeSupervisors = (allIds: number[]) => {
    setCollapsedTreeSupervisors(allIds);
  };

  const expandAllTreeSupervisors = () => {
    setCollapsedTreeSupervisors([]);
  };

  const handleExportCSV = () => {
    if (!roster?.all_members) return;
    const headers = ["Employee ID", "Full Name", "Email", "Role", "Department", "Direct Supervisor", "Status"];
    const rows = roster.all_members.map((m: any) => [
      m.id,
      `"${(m.name || "").replace(/"/g, '""')}"`,
      `"${m.email || ""}"`,
      m.role,
      `"${(department?.name || departmentName).replace(/"/g, '""')}"`,
      `"${m.supervisor_name || (department?.head_id === m.id ? "HOD (Tier 1)" : "Reports to HOD")}"`,
      m.status || "active"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `department_${department?.code || "roster"}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMobilityCSV = () => {
    if (!transfers || transfers.length === 0) return;
    const headers = [
      "Transfer ID",
      "Employee Name",
      "Email",
      "Role",
      "Direction",
      "Source Department",
      "Destination Department",
      "Previous Supervisor",
      "New Supervisor",
      "Governance Justification",
      "Transferred At"
    ];
    const rows = transfers.map((t: any) => [
      t.id,
      `"${(t.user_name || "").replace(/"/g, '""')}"`,
      `"${t.user_email || ""}"`,
      t.user_role || "employee",
      t.target_department_id === departmentId ? "INBOUND" : "OUTBOUND",
      `"${(t.source_dept_name || "Unassigned").replace(/"/g, '""')}"`,
      `"${(t.target_dept_name || "").replace(/"/g, '""')}"`,
      `"${(t.previous_supervisor_name || "Direct to HOD").replace(/"/g, '""')}"`,
      `"${(t.new_supervisor_name || "Direct to HOD").replace(/"/g, '""')}"`,
      `"${(t.reason || "Realignment").replace(/"/g, '""')}"`,
      `"${new Date(t.transferred_at).toLocaleString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `department_${department?.code || "mobility"}_audit_trail.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (!isOpen || !departmentId) return;

    const fetchRoster = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/admin/departments/${departmentId}/roster`);
        if (res.data.status) {
          setData(res.data);
        } else {
          setError(res.data.error || "Failed to load department roster");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Error fetching department roster");
      } finally {
        setLoading(false);
      }
    };

    const fetchTransfers = async () => {
      try {
        setLoadingTransfers(true);
        setTransfersError("");
        const res = await api.get(`/api/admin/departments/${departmentId}/transfers`);
        if (res.data.status) {
          setTransfers(res.data.transfers || []);
        } else {
          setTransfersError(res.data.error || "Failed to load mobility history");
        }
      } catch (err: any) {
        setTransfersError(err.response?.data?.error || "Error fetching mobility history");
      } finally {
        setLoadingTransfers(false);
      }
    };

    fetchRoster();
    fetchTransfers();
  }, [isOpen, departmentId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const department = data?.department;
  const roster = data?.roster;

  const filteredEmployees = (roster?.employees || []).filter((emp: any) => {
    if (staffFilterMode === "assigned" && !emp.supervisor_name) return false;
    if (staffFilterMode === "direct_hod" && emp.supervisor_name) return false;

    if (!staffSearchQuery.trim()) return true;
    const query = staffSearchQuery.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query) ||
      emp.role?.toLowerCase().includes(query) ||
      emp.supervisor_name?.toLowerCase().includes(query)
    );
  });

  const directHodEmployees = (roster?.employees || []).filter((emp: any) => !emp.supervisor_name);

  const filteredTransfers = transfers.filter((t: any) => {
    if (transferFilterMode === "inbound" && t.target_department_id !== departmentId) return false;
    if (transferFilterMode === "outbound" && t.source_department_id !== departmentId) return false;
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      t.user_name?.toLowerCase().includes(q) ||
      t.user_email?.toLowerCase().includes(q) ||
      t.reason?.toLowerCase().includes(q) ||
      t.source_dept_name?.toLowerCase().includes(q) ||
      t.target_dept_name?.toLowerCase().includes(q) ||
      t.previous_supervisor_name?.toLowerCase().includes(q) ||
      t.new_supervisor_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-xl font-bold shadow-inner shrink-0">
              <i className="bi bi-diagram-3"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight mb-0">
                  {department?.name || departmentName}
                </h3>
                {department?.code && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                    {department.code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1 mb-0 flex items-center gap-2">
                <span>{department?.description || "Corporate organizational unit charter & span of control"}</span>
                {department?.parent_name && (
                  <span className="text-[11px] text-indigo-300 font-medium">
                    • Sub-unit of {department.parent_name}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {roster?.all_members?.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Export Department Roster to CSV"
              >
                <i className="bi bi-download text-[11px]"></i>
                <span>Export CSV</span>
              </button>
            )}
            {department && onEditClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditClick(department);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="bi bi-pencil text-[11px]"></i>
                <span>Edit Dept</span>
              </button>
            )}
            {department && onDecommissionClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDecommissionClick(department);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Decommission Department Charter"
              >
                <i className="bi bi-shield-slash text-[11px]"></i>
                <span className="hidden sm:inline">Decommission</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
              title="Close Roster"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Headcount:</span>
              <span className="font-bold text-slate-800 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                {roster?.total_members ?? "..."} Members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Leadership:</span>
              <span className="font-bold text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                {roster?.head ? roster.head.name : "Vacant HOD"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Supervisors:</span>
              <span className="font-bold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
                {roster?.supervisors?.length ?? 0} Leads
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("leadership")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "leadership"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Leadership & Leads
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "staff"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Staff ({roster?.employees?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tree")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "tree"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hierarchy Tree
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-white text-slate-800 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Mobility Audit</span>
              {transfers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  {transfers.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">Loading departmental roster & hierarchy...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-rose-500"></i>
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab 1: Leadership & Supervisors */}
              {activeTab === "leadership" && (
                <div className="space-y-6">
                  {/* Department Head Card (Tier 1) */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <i className="bi bi-award-fill text-indigo-600"></i>
                        <span>Department Leadership (Tier 1 Apex)</span>
                      </h4>
                      <span className="text-[11px] font-medium text-slate-400">
                        Strategic Accountability & Final Approver
                      </span>
                    </div>

                    {roster?.head ? (
                      <div className="rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-200/80 p-5 shadow-xs transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                          {/* Profile & Avatar */}
                          <div className="flex items-start gap-4">
                            <div className="relative shrink-0">
                              {roster.head.image_url ? (
                                <img
                                  src={roster.head.image_url}
                                  alt={roster.head.name}
                                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-xs"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs ring-2 ring-indigo-500/20">
                                  {roster.head.name.charAt(0)}
                                </div>
                              )}
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center" title="Active HOD">
                                <i className="bi bi-check text-white text-[10px]"></i>
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="font-bold text-slate-900 text-base mb-0 tracking-tight">
                                  {roster.head.name}
                                </h5>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
                                  {roster.head.role} • HOD
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Apex Leader
                                </span>
                              </div>

                              <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mb-0">
                                <i className="bi bi-envelope text-slate-400"></i>
                                <span>{roster.head.email}</span>
                              </p>

                              <p className="text-[11px] text-slate-400 mb-0 pt-0.5">
                                Accountable for strategic directives, fiscal approvals, and managerial span of control across {department?.name}.
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex sm:flex-row md:flex-col items-stretch gap-2 shrink-0">
                            {onTransferClick && (
                              <button
                                type="button"
                                onClick={() => onTransferClick(roster.head.id)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                                title="Transfer HOD to another department or role"
                              >
                                <i className="bi bi-arrow-left-right text-indigo-600"></i>
                                <span>Transfer HOD</span>
                              </button>
                            )}
                            {department && onEditClick && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onEditClick(department);
                                }}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <i className="bi bi-person-gear text-indigo-600"></i>
                                <span>Reassign HOD</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Leadership Metrics Ribbon */}
                        <div className="mt-4 pt-3.5 border-t border-indigo-100/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/70">
                            <span className="text-[10px] text-slate-400 block font-medium">Department Unit</span>
                            <span className="font-bold text-slate-800">{department?.code || departmentName}</span>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/70">
                            <span className="text-[10px] text-slate-400 block font-medium">Direct Pods</span>
                            <span className="font-bold text-indigo-700">{roster?.supervisors?.length || 0} Supervisors</span>
                          </div>
                          <div className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200/70 col-span-2 sm:col-span-1">
                            <span className="text-[10px] text-slate-400 block font-medium">Total Unit Headcount</span>
                            <span className="font-bold text-slate-800">{roster?.total_members || 0} Members</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-amber-50/60 border border-dashed border-amber-200 text-center text-xs">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 text-lg">
                          <i className="bi bi-shield-exclamation"></i>
                        </div>
                        <p className="font-bold text-slate-800 mb-1">No Department Head Currently Appointed</p>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto mb-3">
                          This department is operating without designated Tier 1 leadership. Tier 1 heads provide operational accountability, executive sign-off, and supervisor oversight.
                        </p>
                        {department && onEditClick && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditClick(department);
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <i className="bi bi-person-plus"></i>
                            <span>Appoint Department Head</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Supervisors Section (Tier 2) */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <i className="bi bi-shield-check text-emerald-600"></i>
                        <span>Supervisors & Pod Leads (Tier 2 Operations)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 ml-1">
                          {roster?.supervisors?.length || 0} Pods
                        </span>
                      </h4>
                      <span className="text-[11px] font-medium text-slate-400">
                        Operational Day-to-Day People Leaders
                      </span>
                    </div>

                    {roster?.supervisors?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roster.supervisors.map((sup: any) => {
                          const isExpanded = expandedSupervisorIds.includes(sup.id);
                          return (
                            <div
                              key={sup.id}
                              className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 p-4 transition-all shadow-xs flex flex-col justify-between gap-3.5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                                    {sup.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <h6 className="font-bold text-slate-800 text-xs mb-0 leading-tight">{sup.name}</h6>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        Lead
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-slate-400 block mt-0.5">{sup.email}</span>
                                  </div>
                                </div>

                                <span
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 border ${
                                    sup.direct_reports_count > 0
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-50 text-slate-500 border-slate-200"
                                  }`}
                                >
                                  {sup.direct_reports_count} {sup.direct_reports_count === 1 ? "Report" : "Reports"}
                                </span>
                              </div>

                              {/* Direct Reports Toggle and Dropdown Preview */}
                              {sup.direct_reports?.length > 0 ? (
                                <div className="pt-2 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => toggleSupervisorExpand(sup.id)}
                                    className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 hover:text-indigo-600 transition-colors py-1 cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <i className="bi bi-people-fill text-slate-400"></i>
                                      <span>Assigned Pod Members ({sup.direct_reports.length})</span>
                                    </span>
                                    <i className={`bi bi-chevron-${isExpanded ? "up" : "down"} text-[10px]`}></i>
                                  </button>

                                  {isExpanded && (
                                    <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-emerald-300 animate-in fade-in duration-150">
                                      {sup.direct_reports.map((dr: any) => (
                                        <div
                                          key={dr.id}
                                          className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between text-[11px]"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[9px]">
                                              {dr.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-slate-800 text-xs">{dr.name}</span>
                                          </div>
                                          <span className="text-[10px] text-slate-400 font-mono">Staff</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 italic">
                                  No direct reports linked to this supervisor yet.
                                </div>
                              )}

                              {/* Pod Footer Actions */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  Operational Pod
                                </span>
                                {onTransferClick && (
                                  <button
                                    type="button"
                                    onClick={() => onTransferClick(sup.id)}
                                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1 text-xs"
                                  >
                                    <span>Transfer Lead</span>
                                    <i className="bi bi-arrow-right text-[10px]"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                        <i className="bi bi-diagram-3 text-slate-400 text-xl block mb-1"></i>
                        <p className="font-semibold text-slate-700 mb-0.5">No Supervisors Assigned</p>
                        <p className="text-[11px] text-slate-400 mb-0">
                          Staff members in this department currently report directly to the department head.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Staff Members List */}
              {activeTab === "staff" && (
                <div className="space-y-4">
                  {/* Search & Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                      <input
                        type="text"
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        placeholder="Search staff by name, email, role, or supervisor..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                      {staffSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStaffSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      <button
                        type="button"
                        onClick={() => setStaffFilterMode("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          staffFilterMode === "all"
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        All Staff ({roster?.employees?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffFilterMode("assigned")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          staffFilterMode === "assigned"
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Under Supervisor ({(roster?.employees || []).filter((e: any) => e.supervisor_name).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffFilterMode("direct_hod")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          staffFilterMode === "direct_hod"
                            ? "bg-indigo-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Direct to HOD ({directHodEmployees.length})
                      </button>
                    </div>
                  </div>

                  {/* Staff Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3.5">Employee Name & Email</th>
                          <th className="px-4 py-3.5">Designation / Role</th>
                          <th className="px-4 py-3.5">Reporting Line</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5 text-right">Mobility Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((emp: any) => (
                            <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  {emp.image_url ? (
                                    <img
                                      src={emp.image_url}
                                      alt={emp.name}
                                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shadow-2xs shrink-0">
                                      {emp.name.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-semibold text-slate-900 block text-xs leading-tight">
                                      {emp.name}
                                    </span>
                                    <span className="text-[11px] text-slate-400 block mt-0.5">{emp.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  {emp.role || "Employee"}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                {emp.supervisor_name ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <i className="bi bi-shield-check text-emerald-600"></i>
                                    <span>{emp.supervisor_name}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <i className="bi bi-award text-indigo-600"></i>
                                    <span>Direct to HOD</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>Active</span>
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {onTransferClick && (
                                  <button
                                    type="button"
                                    onClick={() => onTransferClick(emp.id)}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                                    title="Initiate transfer for this staff member"
                                  >
                                    <i className="bi bi-arrow-left-right text-[10px]"></i>
                                    <span>Transfer</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                              <i className="bi bi-people text-slate-300 text-2xl block mb-2"></i>
                              {staffSearchQuery ? (
                                <p className="font-medium text-slate-600 mb-0">
                                  No department members match your search "{staffSearchQuery}".
                                </p>
                              ) : (
                                <p className="font-medium text-slate-600 mb-0">
                                  No operational staff members currently assigned to this department.
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Org Hierarchy Tree */}
              {activeTab === "tree" && (
                <div className="space-y-6">
                  {/* Tree Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs">
                        <i className="bi bi-diagram-3"></i>
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs mb-0">Interactive Organization Chart</h5>
                        <p className="text-[11px] text-slate-400 mb-0">
                          Three-tier operational reporting structure: HOD &rarr; Supervisors &rarr; Staff
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={expandAllTreeSupervisors}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          collapseAllTreeSupervisors(roster?.supervisors?.map((s: any) => s.id) || [])
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        Collapse All
                      </button>
                    </div>
                  </div>

                  {/* Visual Hierarchy Diagram */}
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-50/70 to-slate-100/40 border border-slate-200/90 overflow-x-auto">
                    {/* Tier 1: Department Head (Apex) */}
                    <div className="flex flex-col items-center min-w-[600px]">
                      <div className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 shadow-md border border-indigo-400/30 text-center relative group">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 inline-block mb-2">
                          Tier 1 Apex • Department Head
                        </span>

                        <div className="flex items-center justify-center gap-3">
                          {roster?.head?.image_url ? (
                            <img
                              src={roster.head.image_url}
                              alt={roster.head.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400/50 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center border-2 border-indigo-400/50 shadow-xs">
                              {roster?.head?.name ? roster.head.name.charAt(0) : "?"}
                            </div>
                          )}
                          <div className="text-left">
                            <h6 className="font-bold text-sm text-white mb-0 leading-tight">
                              {roster?.head?.name || "Vacant HOD"}
                            </h6>
                            <span className="text-[11px] text-indigo-200 block">
                              {roster?.head?.email || "No email assigned"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-indigo-800/80 flex items-center justify-between text-[10px] text-indigo-300">
                          <span>Charter: {department?.name}</span>
                          <span className="font-semibold text-white">
                            {roster?.total_members || 0} Total Staff
                          </span>
                        </div>
                      </div>

                      {/* Stem from Tier 1 to Tier 2 */}
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-6 bg-indigo-300"></div>
                        <div className="w-5 h-5 rounded-full bg-white border border-indigo-300 text-indigo-600 text-[10px] flex items-center justify-center shadow-2xs font-bold">
                          <i className="bi bi-chevron-down"></i>
                        </div>
                        <div className="w-0.5 h-4 bg-indigo-300"></div>
                      </div>

                      {/* Tier 2: Supervisors & Functional Pods */}
                      {roster?.supervisors?.length > 0 || directHodEmployees.length > 0 ? (
                        <div className="w-full flex flex-wrap justify-center gap-6 pt-2">
                          {/* Supervisor Pods */}
                          {roster?.supervisors?.map((sup: any) => {
                            const isCollapsed = collapsedTreeSupervisors.includes(sup.id);
                            return (
                              <div
                                key={sup.id}
                                className="flex flex-col items-center min-w-[240px] max-w-xs transition-all"
                              >
                                {/* Supervisor Node Card */}
                                <div className="w-full rounded-2xl bg-white border border-emerald-200 shadow-xs p-3.5 text-center relative hover:border-emerald-300 transition-colors">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Tier 2 Pod Lead
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleTreeSupervisorCollapse(sup.id)}
                                      className="text-[10px] font-semibold text-slate-500 hover:text-emerald-700 cursor-pointer flex items-center gap-1"
                                      title={isCollapsed ? "Expand pod direct reports" : "Collapse pod"}
                                    >
                                      <span>{isCollapsed ? "Expand" : "Collapse"}</span>
                                      <i className={`bi bi-chevron-${isCollapsed ? "down" : "up"}`}></i>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2.5 text-left mb-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs shrink-0">
                                      {sup.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-900 text-xs leading-tight">
                                        {sup.name}
                                      </div>
                                      <span className="text-[10px] text-slate-400 block">{sup.email}</span>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                                    <span>Pod Span:</span>
                                    <span className="font-bold text-emerald-700">
                                      {sup.direct_reports_count} Direct Reports
                                    </span>
                                  </div>
                                </div>

                                {/* Connecting Stem to Tier 3 Direct Reports */}
                                {!isCollapsed && sup.direct_reports?.length > 0 && (
                                  <>
                                    <div className="w-0.5 h-4 bg-emerald-300"></div>

                                    {/* Tier 3: Subordinate Employees */}
                                    <div className="w-full space-y-1.5 p-2 rounded-xl bg-emerald-50/40 border border-emerald-100">
                                      <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 px-1 mb-1">
                                        Tier 3 Staff Members ({sup.direct_reports.length})
                                      </div>
                                      {sup.direct_reports.map((dr: any) => (
                                        <div
                                          key={dr.id}
                                          className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-[11px] gap-2"
                                        >
                                          <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center shrink-0">
                                              {dr.name.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-slate-800 text-xs truncate">
                                              {dr.name}
                                            </span>
                                          </div>
                                          {onTransferClick && (
                                            <button
                                              type="button"
                                              onClick={() => onTransferClick(dr.id)}
                                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer shrink-0"
                                              title="Transfer member"
                                            >
                                              Transfer
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}

                                {isCollapsed && (
                                  <div className="text-[10px] text-slate-400 mt-1 font-medium">
                                    +{sup.direct_reports_count} direct reports hidden
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Direct HOD Reportees Branch (if any staff report directly to HOD without supervisor) */}
                          {directHodEmployees.length > 0 && (
                            <div className="flex flex-col items-center min-w-[240px] max-w-xs">
                              <div className="w-full rounded-2xl bg-white border border-indigo-200 shadow-xs p-3.5 text-center">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-1">
                                  Tier 2/3 Direct HOD Line
                                </span>
                                <div className="font-bold text-slate-800 text-xs mt-1">Direct Operational Staff</div>
                                <span className="text-[10px] text-slate-400">
                                  {directHodEmployees.length} employees reporting directly to HOD
                                </span>
                              </div>

                              <div className="w-0.5 h-4 bg-indigo-300"></div>

                              <div className="w-full space-y-1.5 p-2 rounded-xl bg-indigo-50/40 border border-indigo-100">
                                {directHodEmployees.map((emp: any) => (
                                  <div
                                    key={emp.id}
                                    className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between text-[11px] gap-2"
                                  >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                      <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center shrink-0">
                                        {emp.name.charAt(0)}
                                      </div>
                                      <span className="font-semibold text-slate-800 text-xs truncate">
                                        {emp.name}
                                      </span>
                                    </div>
                                    {onTransferClick && (
                                      <button
                                        type="button"
                                        onClick={() => onTransferClick(emp.id)}
                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer shrink-0"
                                      >
                                        Transfer
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-400 mt-4">
                          No subordinate team leads or staff members currently assigned to this department.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hierarchy Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-slate-900 border border-slate-700"></span>
                      <strong className="text-slate-700">Tier 1:</strong> Department Head (Apex Governance)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-300"></span>
                      <strong className="text-slate-700">Tier 2:</strong> Supervisors & Pod Leads (Operations)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300"></span>
                      <strong className="text-slate-700">Tier 3:</strong> Operational Staff Members
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 4: MOBILITY & TRANSFER HISTORY AUDIT */}
              {activeTab === "history" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Filter & Metric Pill Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <span className="font-bold">{transfers.length}</span>
                        <span className="text-slate-400">Total Events</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                        <span>{transfers.filter((t: any) => t.target_department_id === departmentId).length}</span>
                        <span className="text-slate-500 font-normal">Inbound</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                        <span>{transfers.filter((t: any) => t.source_department_id === departmentId).length}</span>
                        <span className="text-slate-500 font-normal">Outbound</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search in Mobility History */}
                      <div className="relative">
                        <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
                        <input
                          type="text"
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                          placeholder="Search audit events..."
                          className="pl-7 pr-3 py-1 rounded-lg text-xs bg-white border border-slate-200 focus:border-indigo-400 outline-none w-36 sm:w-44 text-slate-700 placeholder:text-slate-400"
                        />
                        {historySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setHistorySearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setTransferFilterMode("all")}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            transferFilterMode === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          All ({transfers.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferFilterMode("inbound")}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            transferFilterMode === "inbound" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Inbound
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransferFilterMode("outbound")}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                            transferFilterMode === "outbound" ? "bg-amber-600 text-white" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Outbound
                        </button>
                      </div>

                      {transfers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleExportMobilityCSV}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Export Mobility Audit Trail to CSV"
                        >
                          <i className="bi bi-download text-[11px]"></i>
                          <span className="hidden sm:inline">Export Audit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {loadingTransfers ? (
                    <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading mobility audit trail...</span>
                    </div>
                  ) : transfersError ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <i className="bi bi-exclamation-triangle-fill"></i>
                      <span>{transfersError}</span>
                    </div>
                  ) : filteredTransfers.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                      {filteredTransfers.map((t: any) => {
                        const isInbound = t.target_department_id === departmentId;
                        return (
                          <div key={t.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                    isInbound
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  <i className={`bi ${isInbound ? "bi-arrow-down-left" : "bi-arrow-up-right"}`}></i>
                                  <span>{isInbound ? "Inbound Transfer" : "Outbound Transfer"}</span>
                                </span>

                                <div className="flex items-center gap-2">
                                  {t.user_image_url ? (
                                    <img
                                      src={t.user_image_url}
                                      alt={t.user_name}
                                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                                      {t.user_name ? t.user_name.charAt(0) : "U"}
                                    </div>
                                  )}
                                  <span className="font-bold text-xs text-slate-900">{t.user_name}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                                    {t.user_role}
                                  </span>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-400 font-medium">
                                <i className="bi bi-clock-history mr-1 text-[10px]"></i>
                                <span>{new Date(t.transferred_at).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Movement Route & Reporting Line */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">
                                  Operational Route
                                </span>
                                <div className="flex items-center gap-2 font-semibold text-slate-800">
                                  <span className={t.source_department_id === departmentId ? "text-amber-800 font-bold" : ""}>
                                    {t.source_dept_name || "Unassigned"}
                                  </span>
                                  <i className="bi bi-arrow-right text-slate-400 text-xs"></i>
                                  <span className={t.target_department_id === departmentId ? "text-emerald-800 font-bold" : ""}>
                                    {t.target_dept_name}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">
                                  Reporting Line Realignment
                                </span>
                                <div className="text-slate-600 text-[11px]">
                                  <span>From: <strong className="text-slate-700">{t.previous_supervisor_name || "Direct to HOD"}</strong></span>
                                  <span className="mx-1.5 text-slate-300">→</span>
                                  <span>To: <strong className="text-indigo-700">{t.new_supervisor_name || "Direct to HOD"}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Governance Justification Note */}
                            {t.reason && (
                              <div className="text-[11px] text-slate-600 flex items-start gap-1.5 bg-white p-2 rounded-lg border border-slate-100">
                                <i className="bi bi-chat-left-quote text-slate-400 mt-0.5 shrink-0"></i>
                                <span className="italic">"{t.reason}"</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl mx-auto">
                        <i className="bi bi-arrow-left-right"></i>
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 mb-1">No Mobility Records Found</h5>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto mb-0">
                          Cross-department transfers involving {department?.name || "this department"} will appear here with complete audit trail history.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise Organizational Governance • Workday & BambooHR Pattern</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
};
