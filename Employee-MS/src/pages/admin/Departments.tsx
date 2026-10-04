import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import { DepartmentRosterModal } from "../../Components/admin/departments/DepartmentRosterModal";
import { TransferMemberModal } from "../../Components/admin/departments/TransferMemberModal";
import { GlobalMobilityModal } from "../../Components/admin/departments/GlobalMobilityModal";
import { DecommissionDepartmentModal } from "../../Components/admin/departments/DecommissionDepartmentModal";
import { DepartmentFormModal } from "../../Components/admin/departments/DepartmentFormModal";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eligibleHeads, setEligibleHeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [rosterDept, setRosterDept] = useState<any>(null);
  const [transferModal, setTransferModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    deptId: number | null;
  }>({ isOpen: false, userId: null, deptId: null });
  const [globalMobilityOpen, setGlobalMobilityOpen] = useState(false);
  const [decommissionDeptId, setDecommissionDeptId] = useState<number | null>(null);
  const [formModal, setFormModal] = useState<{ isOpen: boolean; dept: any | null }>({ isOpen: false, dept: null });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [sortField, setSortField] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      dept.name?.toLowerCase().includes(query) ||
      dept.code?.toLowerCase().includes(query) ||
      dept.description?.toLowerCase().includes(query) ||
      dept.head_name?.toLowerCase().includes(query) ||
      dept.parent_name?.toLowerCase().includes(query)
    );
  });

  const sortedDepartments = useMemo(() => {
    const list = [...filteredDepartments];
    list.sort((a, b) => {
      let valA: any = a[sortField] ?? "";
      let valB: any = b[sortField] ?? "";
      if (sortField === "employee_count") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredDepartments, sortField, sortOrder]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/departments");
      if (res.data.status) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load departments" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleHeads = async () => {
    try {
      const res = await api.get("/api/admin/departments/eligible-heads");
      if (res.data.status) {
        setEligibleHeads(res.data.eligibleHeads || []);
      }
    } catch (err) {
      console.error("Failed to load eligible department heads:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEligibleHeads();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-menu-container")) {
        setActiveActionMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Lock background window and main workspace scroll whenever any modal dialog is active
  const isAnyModalActive = Boolean(
    formModal.isOpen ||
    rosterDept ||
    transferModal.isOpen ||
    globalMobilityOpen ||
    decommissionDeptId
  );

  useEffect(() => {
    if (!isAnyModalActive) return;
    const originalBodyOverflow = document.body.style.overflow;
    const mainEl = document.querySelector("main");
    const originalMainOverflow = mainEl ? mainEl.style.overflow : "";

    document.body.style.overflow = "hidden";
    if (mainEl) {
      mainEl.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      if (mainEl) {
        mainEl.style.overflow = originalMainOverflow;
      }
    };
  }, [isAnyModalActive]);

  const handleStartEdit = (dept: any) => {
    setActiveActionMenuId(null);
    setFormModal({ isOpen: true, dept });
  };

  const handleDelete = (id: number) => {
    setDecommissionDeptId(id);
  };

  return (
    <div className="w-full space-y-6">
      {msg.text && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between shadow-2xs border ${
            msg.type === "danger"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`bi ${msg.type === "danger" ? "bi-exclamation-triangle-fill text-rose-500" : "bi-check-circle-fill text-emerald-500"}`}></i>
            <span className="font-medium">{msg.text}</span>
          </div>
          <button onClick={() => setMsg({ type: "", text: "" })} className="p-1 hover:opacity-70 transition-opacity font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Full-Width Active Departments Card */}
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
          {/* Active Departments Header with Compact Single-Row Controls */}
          <div className="px-4 sm:px-6 py-3 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100/70 flex items-center justify-center text-purple-600 shadow-2xs shrink-0">
                <i className="bi bi-buildings text-sm"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-bold text-slate-900 text-sm mb-0">Active Departments</h5>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                    {filteredDepartments.length} {filteredDepartments.length === 1 ? "Unit" : "Units"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-0 font-medium truncate max-w-[240px] lg:max-w-none">
                  Corporate organizational hierarchy, department charters & leadership topology
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap overflow-x-auto py-0.5">
              {/* Compact Search Bar */}
              <div className="relative flex items-center shrink-0">
                <span className="absolute left-2.5 text-slate-400 text-[11px] pointer-events-none">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ borderRadius: "0.5rem" }}
                  className="pl-7 pr-6 py-1.5 text-xs bg-slate-50/70 border border-slate-200 !rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-700 placeholder:text-slate-400 w-28 sm:w-36 md:w-40 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Primary + Add Department Button - Compact & Curved */}
              <button
                type="button"
                onClick={() => setFormModal({ isOpen: true, dept: null })}
                style={{ borderRadius: "0.5rem" }}
                className="px-2.5 sm:px-3 py-1.5 !rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs shrink-0 whitespace-nowrap"
                title="Create New Corporate Department"
              >
                <i className="bi bi-plus-lg text-[10px] font-bold"></i>
                <span>Add Department</span>
              </button>

              {/* Mobility Transfer Action - Compact & Curved */}
              <button
                type="button"
                onClick={() => setTransferModal({ isOpen: true, userId: null, deptId: null })}
                style={{ borderRadius: "0.5rem" }}
                className="px-2.5 sm:px-3 py-1.5 !rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs shrink-0 whitespace-nowrap"
                title="Initiate Personnel or Squad Transfer"
              >
                <i className="bi bi-arrow-left-right text-[10px]"></i>
                <span>Mobility Transfer</span>
              </button>

              {/* Company-Wide Mobility Ledger Action - Compact & Curved */}
              <button
                type="button"
                onClick={() => setGlobalMobilityOpen(true)}
                style={{ borderRadius: "0.5rem" }}
                className="px-2.5 sm:px-3 py-1.5 !rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs shrink-0 whitespace-nowrap"
                title="View Company-Wide Mobility Audit Ledger"
              >
                <i className="bi bi-clock-history text-[10px] text-indigo-600"></i>
                <span>Org Mobility Ledger</span>
              </button>
            </div>
          </div>

            {/* Table Area */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                  <tr>
                    <th
                      className="w-[28%] px-6 py-3.5 cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort("name")}
                      title="Click to sort by Department Name"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Department</span>
                        <i className={`bi ${sortField === "name" ? (sortOrder === "asc" ? "bi-arrow-up text-indigo-600 font-bold" : "bi-arrow-down text-indigo-600 font-bold") : "bi-arrow-down-up text-slate-300 text-[10px]"}`}></i>
                      </div>
                    </th>
                    <th
                      className="w-[36%] px-4 py-3.5 cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort("description")}
                      title="Click to sort by Description"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Description</span>
                        <i className={`bi ${sortField === "description" ? (sortOrder === "asc" ? "bi-arrow-up text-indigo-600 font-bold" : "bi-arrow-down text-indigo-600 font-bold") : "bi-arrow-down-up text-slate-300 text-[10px]"}`}></i>
                      </div>
                    </th>
                    <th
                      className="w-[18%] px-4 py-3.5 cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort("head_name")}
                      title="Click to sort by Head of Department"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Head of Dept</span>
                        <i className={`bi ${sortField === "head_name" ? (sortOrder === "asc" ? "bi-arrow-up text-indigo-600 font-bold" : "bi-arrow-down text-indigo-600 font-bold") : "bi-arrow-down-up text-slate-300 text-[10px]"}`}></i>
                      </div>
                    </th>
                    <th
                      className="w-[11%] px-3 py-3.5 text-center cursor-pointer hover:text-slate-700 transition-colors"
                      onClick={() => handleSort("employee_count")}
                      title="Click to sort by Members Count"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Members</span>
                        <i className={`bi ${sortField === "employee_count" ? (sortOrder === "asc" ? "bi-arrow-up text-indigo-600 font-bold" : "bi-arrow-down text-indigo-600 font-bold") : "bi-arrow-down-up text-slate-300 text-[10px]"}`}></i>
                      </div>
                    </th>
                    <th className="w-[7%] px-3 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      </td>
                    </tr>
                  ) : sortedDepartments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 text-xs font-medium">
                        <div className="flex flex-col items-center justify-center gap-2.5">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 text-lg">
                            <i className="bi bi-buildings"></i>
                          </div>
                          <span className="font-semibold text-slate-600 text-sm">
                            {searchQuery ? "No matching departments found" : "No departments established yet"}
                          </span>
                          <p className="text-xs text-slate-400 max-w-sm mb-1">
                            {searchQuery
                              ? `No departments match "${searchQuery}". Try a different keyword.`
                              : "Get started by establishing corporate departmental units, assigning leadership, and mapping teams."}
                          </p>
                          {!searchQuery && (
                            <button
                              type="button"
                              onClick={() => setFormModal({ isOpen: true, dept: null })}
                              style={{ borderRadius: "0.75rem" }}
                              className="px-4 py-2 !rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-2 shadow-2xs cursor-pointer mt-1"
                            >
                              <i className="bi bi-plus-lg text-xs"></i>
                              <span>Add First Department</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedDepartments.map((dept, index) => {
                      const icons = ["bi-code-slash", "bi-graph-up", "bi-people", "bi-megaphone", "bi-cart", "bi-shield-check"];
                      const colors = [
                        "bg-blue-50 text-blue-600 border-blue-100",
                        "bg-emerald-50 text-emerald-600 border-emerald-100",
                        "bg-purple-50 text-purple-600 border-purple-100",
                        "bg-amber-50 text-amber-600 border-amber-100",
                        "bg-rose-50 text-rose-600 border-rose-100",
                        "bg-cyan-50 text-cyan-600 border-cyan-100"
                      ];
                      const badgeColors = [
                        "bg-blue-50 text-blue-700 border-blue-100",
                        "bg-emerald-50 text-emerald-700 border-emerald-100",
                        "bg-purple-50 text-purple-700 border-purple-100",
                        "bg-amber-50 text-amber-700 border-amber-100",
                        "bg-rose-50 text-rose-700 border-rose-100",
                        "bg-cyan-50 text-cyan-700 border-cyan-100"
                      ];
                      const iconClass = icons[index % icons.length];
                      const colorClass = colors[index % colors.length];
                      const memberBadgeClass = badgeColors[index % badgeColors.length];

                      return (
                        <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Department Name & Code */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-bold ${colorClass} shrink-0 shadow-2xs`}>
                                <i className={`bi ${iconClass}`}></i>
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 block text-xs truncate">{dept.name}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200/80">
                                    {dept.code || dept.name.substring(0, 3).toUpperCase()}
                                  </span>
                                  {dept.parent_name && (
                                    <span className="text-[10px] text-slate-400 font-medium truncate">
                                      ↳ {dept.parent_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Description */}
                          <td className="px-4 py-4 text-slate-500 font-medium text-xs">
                            <p className="truncate mb-0" title={dept.description}>
                              {dept.description || "No description provided"}
                            </p>
                          </td>

                          {/* Department Head (HOD) */}
                          <td className="px-4 py-4">
                            {dept.head_name ? (
                              <div className="flex items-center gap-2.5 min-w-0">
                                {dept.head_image_url ? (
                                  <img
                                    src={dept.head_image_url}
                                    alt={dept.head_name}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
                                    {dept.head_name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-800 text-xs block leading-tight truncate">
                                    {dept.head_name}
                                  </span>
                                  <span className="text-[10px] text-indigo-600 font-medium block truncate">
                                    {dept.head_role ? `${dept.head_role.toUpperCase()} / HOD` : "HOD"}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                <i className="bi bi-dash-circle text-[9px]"></i>
                                Vacant
                              </span>
                            )}
                          </td>

                          {/* Members Count with Breakdown - Centered & Compact */}
                          <td className="px-3 py-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setRosterDept(dept)}
                              className="inline-flex flex-col items-center group cursor-pointer"
                              title={`View ${dept.name} Roster & Org`}
                            >
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold border ${memberBadgeClass} shadow-2xs group-hover:ring-2 group-hover:ring-indigo-400/50 transition-all`}>
                                <i className="bi bi-people-fill text-[10px]"></i>
                                {dept.member_count} Members
                              </span>
                              {(dept.supervisor_count > 0 || dept.employee_count > 0) && (
                                <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 font-medium mt-1 transition-colors">
                                  {dept.supervisor_count > 0 ? `${dept.supervisor_count} lead${dept.supervisor_count > 1 ? "s" : ""}` : ""}
                                  {dept.supervisor_count > 0 && dept.employee_count > 0 ? " • " : ""}
                                  {dept.employee_count > 0 ? `${dept.employee_count} staff` : ""}
                                </span>
                              )}
                            </button>
                          </td>

                          {/* Actions: 3-Dots Dropdown Menu - Centered & Compact */}
                          <td className="px-3 py-4 text-center whitespace-nowrap">
                            <div className="relative inline-flex items-center justify-center action-menu-container">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(activeActionMenuId === dept.id ? null : dept.id);
                                }}
                                style={{ borderRadius: "0.75rem" }}
                                className={`w-8 h-8 !rounded-xl transition-all cursor-pointer inline-flex items-center justify-center border ${
                                  activeActionMenuId === dept.id
                                    ? "bg-slate-100 text-slate-800 border-slate-300 shadow-2xs"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-transparent hover:border-slate-200"
                                }`}
                                title="Department Actions"
                              >
                                <i className="bi bi-three-dots-vertical text-xs"></i>
                              </button>

                              {activeActionMenuId === dept.id && (
                                <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100">
                                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    {dept.code || dept.name} Actions
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setRosterDept(dept);
                                    }}
                                    className="w-full px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-people text-slate-400"></i>
                                    <span>View Roster & Org</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleStartEdit(dept);
                                    }}
                                    className="w-full px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-amber-600 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-pencil text-slate-400"></i>
                                    <span>Edit Department</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setTransferModal({ isOpen: true, userId: null, deptId: dept.id });
                                    }}
                                    className="w-full px-2.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-arrow-left-right text-slate-400"></i>
                                    <span>Transfer Members</span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100"></div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleDelete(dept.id);
                                    }}
                                    className="w-full px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                                  >
                                    <i className="bi bi-shield-slash text-rose-500"></i>
                                    <span>Decommission Unit</span>
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

            {/* Table Footer / Pagination Note */}
            <div className="px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Showing 1 to {filteredDepartments.length} of {departments.length} departments</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled className="w-7 h-7 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 opacity-50 cursor-not-allowed">
                  <i className="bi bi-chevron-left text-[10px]"></i>
                </button>
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">1</span>
                <button type="button" disabled className="w-7 h-7 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 opacity-50 cursor-not-allowed">
                  <i className="bi bi-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Enterprise Department Roster & Org Hierarchy Modal */}
      <DepartmentRosterModal
        isOpen={!!rosterDept}
        onClose={() => setRosterDept(null)}
        departmentId={rosterDept?.id || null}
        departmentName={rosterDept?.name}
        onEditClick={(deptToEdit) => {
          handleStartEdit(deptToEdit);
        }}
        onTransferClick={(userId) => {
          setTransferModal({ isOpen: true, userId: userId || null, deptId: rosterDept?.id || null });
        }}
        onDecommissionClick={(dept) => {
          setDecommissionDeptId(dept.id);
        }}
      />

      {/* Workforce Mobility Personnel Transfer Modal */}
      <TransferMemberModal
        isOpen={transferModal.isOpen}
        onClose={() => setTransferModal({ isOpen: false, userId: null, deptId: null })}
        departments={departments}
        initialUserId={transferModal.userId}
        initialDeptId={transferModal.deptId}
        onTransferSuccess={(successMsg) => {
          setMsg({ type: "success", text: successMsg });
          fetchDepartments();
          if (rosterDept) {
            setRosterDept({ ...rosterDept });
          }
        }}
      />

      {/* Global Organization-Wide Workforce Mobility Ledger */}
      <GlobalMobilityModal
        isOpen={globalMobilityOpen}
        onClose={() => setGlobalMobilityOpen(false)}
        departments={departments}
      />

      {/* Department Create & Edit Modal */}
      <DepartmentFormModal
        isOpen={formModal.isOpen}
        onClose={() => setFormModal({ isOpen: false, dept: null })}
        department={formModal.dept}
        departments={departments}
        eligibleHeads={eligibleHeads}
        onSuccess={(successMsg) => {
          setMsg({ type: "success", text: successMsg });
          fetchDepartments();
          fetchEligibleHeads();
        }}
      />

      {/* Enterprise Safe Decommissioning & Sunset Modal */}
      <DecommissionDepartmentModal
        isOpen={!!decommissionDeptId}
        onClose={() => setDecommissionDeptId(null)}
        departmentId={decommissionDeptId}
        departments={departments}
        onDecommissionSuccess={(successMsg) => {
          setMsg({ type: "success", text: successMsg });
          if (formModal.dept?.id === decommissionDeptId) {
            setFormModal({ isOpen: false, dept: null });
          }
          fetchDepartments();
          fetchEligibleHeads();
        }}
      />
    </div>
  );
};

export default Departments;
