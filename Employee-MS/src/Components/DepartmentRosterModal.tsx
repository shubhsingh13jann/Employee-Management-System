import React, { useEffect, useState } from "react";
import api from "../api/axios";

interface DepartmentRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number | null;
  departmentName?: string;
  onTransferClick?: (userId?: number) => void;
  onEditClick?: (dept: any) => void;
}

export const DepartmentRosterModal: React.FC<DepartmentRosterModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName = "Department",
  onTransferClick,
  onEditClick
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"leadership" | "staff" | "tree">("leadership");

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

    fetchRoster();
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

          <div className="flex items-center gap-3">
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
                  {/* Department Head Card */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <i className="bi bi-award-fill text-indigo-500"></i>
                      <span>Department Leadership (Tier 1)</span>
                    </h4>

                    {roster?.head ? (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-center gap-3.5">
                          {roster.head.image_url ? (
                            <img
                              src={roster.head.image_url}
                              alt={roster.head.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                              {roster.head.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-sm mb-0">{roster.head.name}</h5>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                                {roster.head.role} • HOD
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mb-0 font-medium">{roster.head.email}</p>
                            <p className="text-[11px] text-slate-400 mb-0 mt-0.5">
                              Executive department accountability & budget oversight
                            </p>
                          </div>
                        </div>

                        {onTransferClick && (
                          <button
                            type="button"
                            onClick={() => onTransferClick(roster.head.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0 cursor-pointer flex items-center gap-1.5"
                          >
                            <i className="bi bi-arrow-left-right text-indigo-600"></i>
                            <span>Transfer HOD</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        <p className="font-medium mb-1 text-slate-600">No Department Head Designated</p>
                        <p className="text-[11px] text-slate-400 mb-0">
                          This department operates without an assigned HOD. Use "Edit Dept" to assign a leader.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Supervisors Section */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <i className="bi bi-shield-check text-emerald-500"></i>
                      <span>Supervisors & Pod Leads (Tier 2)</span>
                    </h4>

                    {roster?.supervisors?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roster.supervisors.map((sup: any) => (
                          <div
                            key={sup.id}
                            className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                  {sup.name.charAt(0)}
                                </div>
                                <div>
                                  <h6 className="font-bold text-slate-800 text-xs mb-0">{sup.name}</h6>
                                  <span className="text-[11px] text-slate-400">{sup.email}</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                {sup.direct_reports_count} Reports
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <span>Pod Lead Status: Active</span>
                              {onTransferClick && (
                                <button
                                  type="button"
                                  onClick={() => onTransferClick(sup.id)}
                                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
                                >
                                  <span>Transfer</span>
                                  <i className="bi bi-arrow-right text-[10px]"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                        No team leads or supervisors currently assigned in this department.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Staff Members List */}
              {activeTab === "staff" && (
                <div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Employee</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Direct Supervisor</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {roster?.employees?.length > 0 ? (
                          roster.employees.map((emp: any) => (
                            <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                    {emp.name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="font-semibold text-slate-800 block text-xs">{emp.name}</span>
                                    <span className="text-[10px] text-slate-400">{emp.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  {emp.role}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {emp.supervisor_name ? (
                                  <span className="font-medium text-slate-700 text-xs flex items-center gap-1.5">
                                    <i className="bi bi-person text-slate-400"></i>
                                    {emp.supervisor_name}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">Reports to HOD</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  {emp.status || "active"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {onTransferClick && (
                                  <button
                                    type="button"
                                    onClick={() => onTransferClick(emp.id)}
                                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors cursor-pointer"
                                  >
                                    Transfer
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-medium">
                              No operational staff members currently assigned to this department.
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  {/* Root: HOD */}
                  <div className="flex flex-col items-center">
                    <div className="px-4 py-2.5 rounded-xl bg-indigo-900 text-white text-center shadow-xs border border-indigo-800 max-w-xs w-full">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        Department Head (Tier 1)
                      </div>
                      <div className="font-bold text-sm">{roster?.head?.name || "Vacant HOD"}</div>
                      <div className="text-[11px] text-indigo-200">{department?.name}</div>
                    </div>

                    {/* Stem down to supervisors */}
                    <div className="w-0.5 h-6 bg-indigo-300"></div>

                    {/* Supervisors Tier */}
                    {roster?.supervisors?.length > 0 ? (
                      <div className="w-full flex flex-wrap justify-center gap-6">
                        {roster.supervisors.map((sup: any) => (
                          <div key={sup.id} className="flex flex-col items-center min-w-[200px] max-w-xs">
                            <div className="px-3.5 py-2 rounded-xl bg-white border border-emerald-200 shadow-2xs text-center w-full">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Pod Lead (Tier 2)
                              </span>
                              <div className="font-bold text-xs text-slate-800 mt-1">{sup.name}</div>
                              <div className="text-[10px] text-slate-400">{sup.direct_reports_count} direct reports</div>
                            </div>

                            {/* Stem down to direct reports */}
                            {sup.direct_reports?.length > 0 && (
                              <>
                                <div className="w-0.5 h-4 bg-emerald-300"></div>
                                <div className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-100 w-full space-y-1">
                                  {sup.direct_reports.map((dr: any) => (
                                    <div
                                      key={dr.id}
                                      className="px-2 py-1 rounded bg-white border border-slate-200/80 text-[10px] font-medium text-slate-700 flex items-center justify-between"
                                    >
                                      <span>{dr.name}</span>
                                      <span className="text-[9px] text-slate-400">Employee</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-400">
                        No subordinate team leads reporting to this department.
                      </div>
                    )}
                  </div>
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
