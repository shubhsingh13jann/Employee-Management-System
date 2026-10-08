import React, { useState } from "react";

export interface HierarchyMappingItem {
  id: number | string;
  assigned_at: string;
  employee_id: number | string;
  employee_name: string;
  employee_email: string;
  supervisor_id: number | string;
  supervisor_name: string;
  manager_id: number | string;
  manager_name: string;
  department_name?: string;
}

export interface UnassignedEmployee {
  id: number | string;
  name: string;
  email: string;
  department_name?: string;
  role?: string;
}

interface HierarchyTableViewProps {
  loading: boolean;
  mappings: HierarchyMappingItem[];
  unassignedStaff: UnassignedEmployee[];
  showUnassignedOnly: boolean;
  onOpenAssignModal: (preselectedEmployeeId?: string | number) => void;
  onResetFilters: () => void;
}

export const HierarchyTableView: React.FC<HierarchyTableViewProps> = ({
  loading,
  mappings,
  unassignedStaff,
  showUnassignedOnly,
  onOpenAssignModal,
  onResetFilters,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopyDetails = (item: HierarchyMappingItem) => {
    const text = `Employee: ${item.employee_name} (${item.employee_email}) -> Supervisor: ${item.supervisor_name} -> Manager: ${item.manager_name} [Dept: ${item.department_name || "General"}]`;
    navigator.clipboard.writeText(text);
    setCopyFeedback(String(item.id));
    setTimeout(() => setCopyFeedback(null), 2000);
    setActiveMenuId(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden mb-6">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs sm:text-[13px]">
          <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600">
            <tr>
              <th className="py-3.5 px-5 text-left min-w-[240px]">
                💼 Employee (Subordinate)
              </th>
              <th className="py-3.5 px-4 text-left min-w-[190px]">
                👷 Direct Supervisor (Team Lead)
              </th>
              <th className="py-3.5 px-4 text-left min-w-[190px]">
                👔 Department Manager
              </th>
              <th className="py-3.5 px-4 text-center min-w-[140px]">
                Department
              </th>
              <th className="py-3.5 px-4 text-right min-w-[130px]">
                Assigned On
              </th>
              <th className="py-3.5 px-4 text-center w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading hierarchy mappings...</span>
                  </div>
                </td>
              </tr>
            ) : showUnassignedOnly ? (
              unassignedStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mx-auto mb-2">
                        <i className="bi bi-check2-circle"></i>
                      </div>
                      <p className="font-bold text-slate-800 text-sm mb-1">
                        All Staff Are Mapped
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        Every active staff member currently has a direct supervisor and department manager assigned.
                      </p>
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Show All Mappings
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                unassignedStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-amber-50/40 transition-colors"
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          {staff.name ? staff.name.charAt(0) : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 mb-0 truncate text-xs sm:text-sm">
                            {staff.name}
                          </p>
                          <p className="text-[11px] text-slate-400 mb-0 truncate">
                            {staff.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4" colSpan={2}>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        <span>Unassigned — No Team Lead Mapped</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {staff.department_name || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                      Pending
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal(staff.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))
              )
            ) : mappings.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl mx-auto mb-2">
                      <i className="bi bi-diagram-3"></i>
                    </div>
                    <p className="font-bold text-slate-800 text-sm mb-1">
                      No Hierarchy Mappings Found
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      No staff match the current search or department filter.
                    </p>
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <i className="bi bi-arrow-counterclockwise"></i>
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              mappings.map((item, idx, arr) => {
                const isMenuOpen = activeMenuId === item.id;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Employee Cell */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                          {item.employee_name ? item.employee_name.charAt(0) : "E"}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                              {item.employee_name}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              EMP-{String(item.employee_id).padStart(4, "0")}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {item.employee_email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Supervisor Cell */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                        <i className="bi bi-person-badge-fill text-emerald-600 text-xs"></i>
                        <span className="truncate max-w-[140px]">{item.supervisor_name}</span>
                      </span>
                    </td>

                    {/* Manager Cell */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                        <i className="bi bi-person-gear text-indigo-600 text-xs"></i>
                        <span className="truncate max-w-[140px]">{item.manager_name}</span>
                      </span>
                    </td>

                    {/* Department Cell */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.department_name || "General"}
                      </span>
                    </td>

                    {/* Assigned Date */}
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                      {item.assigned_at
                        ? new Date(item.assigned_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Active"}
                    </td>

                    {/* Actions (Triple-Dot Menu) */}
                    <td className={`py-3.5 px-4 text-center whitespace-nowrap ${isMenuOpen ? "relative z-30" : ""}`}>
                      <div className="relative inline-flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId((prev) => (prev === item.id ? null : item.id));
                          }}
                          className={`w-7 h-7 rounded-lg border transition-all inline-flex items-center justify-center cursor-pointer ${
                            isMenuOpen
                              ? "bg-slate-100 text-slate-900 border-slate-300 shadow-2xs"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-2xs"
                          }`}
                          title="Actions"
                        >
                          <i className="bi bi-three-dots text-xs"></i>
                        </button>

                        {isMenuOpen && (
                          <div
                            className={`absolute right-0 ${
                              idx >= arr.length - 2 && arr.length > 2
                                ? "bottom-full mb-1.5"
                                : "top-full mt-1.5"
                            } w-44 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onOpenAssignModal(item.employee_id);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer font-medium"
                            >
                              <i className="bi bi-pencil-square text-indigo-500 text-xs"></i>
                              <span>Reassign Team</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyDetails(item)}
                              className="w-full px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg flex items-center gap-2 transition-colors cursor-pointer font-medium"
                            >
                              <i className="bi bi-clipboard text-slate-400 text-xs"></i>
                              <span>
                                {copyFeedback === String(item.id)
                                  ? "Copied!"
                                  : "Copy Details"}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
