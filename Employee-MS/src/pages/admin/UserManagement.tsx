import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { UserFormModal } from "../../Components/admin/users/UserFormModal";
import { UserProfileModal } from "../../Components/admin/users/UserProfileModal";
import { ConfirmOffboardModal } from "../../Components/admin/users/ConfirmOffboardModal";
import { WorkforceAnalyticsSidebar } from "../../Components/admin/users/WorkforceAnalyticsSidebar";

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "danger" | ""; text: string }>({ type: "", text: "" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedUserIdForProfile, setSelectedUserIdForProfile] = useState<number | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [offboardTarget, setOffboardTarget] = useState<{ id: number; name: string; role?: string } | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".action-menu-container")) {
        setActiveActionMenuId(null);
      }
      if (!(e.target as HTMLElement).closest(".hero-menu-container")) {
        setIsHeroMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedDept) params.department_id = selectedDept;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/api/admin/users", { params });
      if (res.data.status) {
        const fetched = res.data.users || [];
        setAllUsers(fetched);
        setUsers(fetched);
      }
    } catch (err: any) {
      console.error("Fetch users error:", err);
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load workforce directory" });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/admin/departments");
      if (res.data.status) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const res = await api.get("/api/admin/users/supervisors");
      if (res.data.status) {
        setSupervisors(res.data.supervisors || []);
      }
    } catch (err) {
      console.error("Fetch supervisors error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchSupervisors();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedDept, searchQuery]);

  const handleRequestDelete = (user: any) => {
    setOffboardTarget({ id: user.id, name: user.name, role: user.role });
  };

  const handleConfirmOffboard = async () => {
    if (!offboardTarget) return;

    try {
      setDeletingId(offboardTarget.id);
      const res = await api.delete(`/api/admin/users/${offboardTarget.id}`);
      if (res.data.status) {
        setMsg({ type: "success", text: `Staff member '${offboardTarget.name}' offboarded successfully` });
        fetchUsers();
        fetchSupervisors();
      }
    } catch (err: any) {
      console.error("Delete user error:", err);
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to offboard user" });
    } finally {
      setDeletingId(null);
      setOffboardTarget(null);
    }
  };

  const handleOpenOnboard = () => {
    setSelectedUserForEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUserForEdit(user);
    setIsFormModalOpen(true);
  };

  const handleOpenProfile = (id: number) => {
    setSelectedUserIdForProfile(id);
    setIsProfileModalOpen(true);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const headers = ["ID", "Name", "Email", "Role", "Department", "Supervisor", "Salary", "Phone", "Status", "Joined"];
    const rows = users.map((u) => [
      u.id,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      u.role,
      `"${(u.department_name || "Unassigned").replace(/"/g, '""')}"`,
      `"${(u.supervisor_name || "Direct to HOD").replace(/"/g, '""')}"`,
      u.salary || 0,
      `"${(u.phone || "").replace(/"/g, '""')}"`,
      u.status || "active",
      u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workforce_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Role Counts for Tabs
  const roleCounts = useMemo(() => {
    return {
      all: allUsers.length,
      manager: allUsers.filter((u) => u.role === "manager").length,
      supervisor: allUsers.filter((u) => u.role === "supervisor").length,
      employee: allUsers.filter((u) => u.role === "employee").length,
      admin: allUsers.filter((u) => u.role === "admin").length,
      hod: allUsers.filter((u) => u.is_hod).length,
    };
  }, [allUsers]);

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = allUsers.length;
    const active = allUsers.filter((u) => u.status === "active").length;
    const supervisorsCount = allUsers.filter((u) => u.role === "supervisor").length;
    const leadersCount = allUsers.filter((u) => u.role === "manager" || u.is_hod).length;
    return { total, active, supervisorsCount, leadersCount };
  }, [allUsers]);

  // Sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortField(null);
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Filtered and sorted users
  const displayedUsers = useMemo(() => {
    let list = [...allUsers];

    // Filter by role
    if (selectedRole === "hod") {
      list = list.filter((u) => u.is_hod);
    } else if (selectedRole) {
      list = list.filter((u) => u.role === selectedRole);
    }

    // Filter by account status
    if (selectedStatus) {
      list = list.filter((u) => u.status === selectedStatus);
    }

    // Sort
    if (sortField) {
      list.sort((a, b) => {
        let valA: any = a[sortField] ?? "";
        let valB: any = b[sortField] ?? "";

        if (sortField === "salary") {
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
    }

    return list;
  }, [allUsers, selectedRole, selectedStatus, sortField, sortOrder]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole, selectedDept, selectedStatus, searchQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(displayedUsers.length / pageSize));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedUsers.slice(start, start + pageSize);
  }, [displayedUsers, currentPage, pageSize]);

  const activeFilterCount = (selectedDept ? 1 : 0) + (selectedStatus ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedRole("");
    setSelectedDept("");
    setSelectedStatus("");
    setSearchQuery("");
  };

  const roleTabs = [
    {
      id: "",
      label: "All Users",
      count: roleCounts.all,
      activeStyles: "bg-indigo-50/80 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400/25 shadow-xs",
      badgeActive: "bg-indigo-600 text-white",
    },
    {
      id: "manager",
      label: "Managers",
      count: roleCounts.manager,
      activeStyles: "bg-indigo-50/80 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400/25 shadow-xs",
      badgeActive: "bg-indigo-600 text-white",
    },
    {
      id: "supervisor",
      label: "Supervisors",
      count: roleCounts.supervisor,
      activeStyles: "bg-emerald-50/80 border-emerald-400 text-emerald-700 ring-1 ring-emerald-400/25 shadow-xs",
      badgeActive: "bg-emerald-600 text-white",
    },
    {
      id: "employee",
      label: "Employees",
      count: roleCounts.employee,
      activeStyles: "bg-sky-50/80 border-sky-400 text-sky-700 ring-1 ring-sky-400/25 shadow-xs",
      badgeActive: "bg-sky-600 text-white",
    },
    {
      id: "admin",
      label: "Admins",
      count: roleCounts.admin,
      activeStyles: "bg-rose-50/80 border-rose-400 text-rose-700 ring-1 ring-rose-400/25 shadow-xs",
      badgeActive: "bg-rose-600 text-white",
    },
    {
      id: "hod",
      label: "Dept Heads",
      count: roleCounts.hod,
      activeStyles: "bg-amber-50/80 border-amber-400 text-amber-700 ring-1 ring-amber-400/25 shadow-xs",
      badgeActive: "bg-amber-600 text-white",
    },
  ];

  const getDepartmentIcon = (deptName?: string) => {
    if (!deptName) return { icon: "bi-building", color: "text-slate-400" };
    const lower = deptName.toLowerCase();
    if (lower.includes("hr") || lower.includes("human")) return { icon: "bi-people-fill", color: "text-purple-500" };
    if (lower.includes("market")) return { icon: "bi-megaphone-fill", color: "text-amber-500" };
    if (lower.includes("finan") || lower.includes("account")) return { icon: "bi-graph-up-arrow", color: "text-emerald-500" };
    if (lower.includes("sale")) return { icon: "bi-cart-fill", color: "text-pink-500" };
    if (lower.includes("operat")) return { icon: "bi-shield-check", color: "text-cyan-500" };
    if (lower.includes("it") || lower.includes("tech")) return { icon: "bi-laptop", color: "text-blue-500" };
    if (lower.includes("eng") || lower.includes("dev")) return { icon: "bi-code-slash", color: "text-cyan-600" };
    if (lower.includes("prod")) return { icon: "bi-box-seam", color: "text-purple-500" };
    if (lower.includes("desig")) return { icon: "bi-palette-fill", color: "text-pink-500" };
    return { icon: "bi-building", color: "text-indigo-500" };
  };

  const getRoleBadge = (u: any) => {
    switch (u.role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <span>👑</span>
            <span>HR Admin</span>
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
            <span>👔</span>
            <span>Manager</span>
          </span>
        );
      case "supervisor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span>👷</span>
            <span>Supervisor</span>
            {u.direct_reports_count > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-200/70 text-emerald-900">
                {u.direct_reports_count}
              </span>
            )}
          </span>
        );
      case "employee":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs">
            <span>💼</span>
            <span>Employee</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-5 xl:h-full xl:flex xl:flex-col xl:min-h-0 xl:overflow-hidden">
      {/* Alert Notification */}
      {msg.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shrink-0 ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <i className={`bi ${msg.type === "success" ? "bi-check-circle-fill text-emerald-600" : "bi-exclamation-triangle-fill text-rose-600"}`}></i>
            <span className="font-medium">{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg({ type: "", text: "" })}
            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Responsive Layout with Smooth Sidebar Expansion */}
      <div className="flex flex-col xl:flex-row gap-5 sm:gap-6 items-start xl:flex-1 xl:min-h-0 xl:h-full w-full">
        {/* Left Column (Hero, Tabs, Table) */}
        <div
          className={`min-w-0 xl:h-full xl:overflow-y-auto space-y-4 sm:space-y-5 transition-all duration-300 ease-in-out [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 ${
            isSidebarOpen ? "xl:w-2/3 xl:pr-1.5" : "w-full"
          }`}
        >
          {/* Executive Gradient Hero Banner & Action Toolbar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-900/40 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            {/* Left Side: Icon & Title */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-lg font-bold shadow-inner shrink-0">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white mb-0.5 whitespace-nowrap">
                  Workforce Management
                </h2>
                <p className="text-xs text-indigo-200/70 mb-0 font-normal truncate max-w-[280px] sm:max-w-md">
                  Enterprise Personnel Directory, Reporting Line Hierarchy & Governance Operations
                </p>
              </div>
            </div>

            {/* Right Side: Action Buttons or 3-Lines Dropdown Menu */}
            {isSidebarOpen ? (
              <div className="relative hero-menu-container shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => setIsHeroMenuOpen(!isHeroMenuOpen)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    isHeroMenuOpen
                      ? "bg-indigo-600 text-white border border-indigo-400/50 shadow-indigo-500/30 ring-2 ring-indigo-400/30"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs"
                  }`}
                  title="Menu Options"
                  aria-label="Toggle Actions Menu"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  </svg>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-slate-900 text-[9px] font-bold flex items-center justify-center text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isHeroMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        handleOpenOnboard();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm text-left"
                    >
                      <i className="bi bi-plus-lg text-xs font-bold"></i>
                      <span>Onboard Member</span>
                    </button>

                    <div className="h-px bg-white/10 my-1"></div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        setIsSidebarOpen(!isSidebarOpen);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <i className={`bi ${isSidebarOpen ? "bi-pie-chart-fill" : "bi-pie-chart"} text-indigo-400 text-xs`}></i>
                        <span>Workforce Overview</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300">
                        {isSidebarOpen ? "Open" : "Closed"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        setIsFilterOpen(!isFilterOpen);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <i className="bi bi-funnel text-indigo-400 text-xs"></i>
                        <span>Filter Directory</span>
                      </div>
                      {activeFilterCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        handleExportCSV();
                      }}
                      disabled={users.length === 0}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 text-left"
                    >
                      <i className="bi bi-download text-indigo-400 text-xs"></i>
                      <span>Export Directory</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {/* Workforce Overview Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                    isSidebarOpen
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/30 ring-2 ring-indigo-400/30"
                      : "bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/20"
                  }`}
                  title="Toggle Workforce Overview Analytics"
                >
                  <i className={`bi ${isSidebarOpen ? "bi-pie-chart-fill" : "bi-pie-chart"} text-xs`}></i>
                  <span>Workforce Overview</span>
                </button>

                {/* Filter Button */}
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                    isFilterOpen || activeFilterCount > 0
                      ? "bg-indigo-600/40 border-indigo-400 text-white shadow-indigo-500/20"
                      : "bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/20"
                  }`}
                >
                  <i className="bi bi-funnel text-xs"></i>
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={users.length === 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/20 backdrop-blur-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  title="Export Workforce Directory as CSV"
                >
                  <i className="bi bi-download text-xs"></i>
                  <span>Export</span>
                </button>

                {/* Onboard Member Button */}
                <button
                  type="button"
                  onClick={handleOpenOnboard}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <i className="bi bi-plus-lg font-bold text-xs"></i>
                  <span>Onboard Member</span>
                </button>
              </div>
            )}
          </div>

          {/* Expandable Filter Drawer Panel */}
          {isFilterOpen && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <i className="bi bi-sliders2 text-indigo-600 text-sm"></i>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Directory Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {activeFilterCount} active
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
                  >
                    <i className="bi bi-x-circle text-[11px]"></i>
                    <span>Clear All Filters</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Keywords</label>
                  <div className="relative">
                    <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by name, email..."
                      className="w-full pl-8 pr-7 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.code ? `(${d.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Status Filter */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none font-medium text-slate-700 cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active Members</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Role Filter Tabs & Workforce Overview Tab */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
            {roleTabs.map((tab) => {
              const isActive = selectedRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRole(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? tab.activeStyles
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                      isActive ? tab.badgeActive : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {/* Toggle Workforce Overview Tab */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-2xs shrink-0 ml-auto ${
                isSidebarOpen
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-500/20"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 hover:border-slate-300"
              }`}
              title="Toggle Workforce Overview Sidebar"
            >
              <i className={`bi ${isSidebarOpen ? "bi-pie-chart-fill" : "bi-pie-chart"} text-xs ${isSidebarOpen ? "text-white" : "text-indigo-600"}`}></i>
              <span>Workforce Overview</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold transition-colors ${
                  isSidebarOpen ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
                }`}
              >
                {isSidebarOpen ? "Open" : "View"}
              </span>
            </button>
          </div>

          {/* Workforce Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
              <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-semibold text-slate-600 normal-case tracking-normal">
                  <tr>
                    <th
                      className="px-4 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors"
                      onClick={() => handleSort("name")}
                      title="Click to sort by Name"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>User</span>
                        <i
                          className={`bi ${
                            sortField === "name"
                              ? sortOrder === "asc"
                                ? "bi-arrow-up text-indigo-600 font-bold"
                                : "bi-arrow-down text-indigo-600 font-bold"
                              : "bi-arrow-down-up text-slate-400 text-[10px]"
                          }`}
                        ></i>
                      </div>
                    </th>
                    <th
                      className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors whitespace-nowrap"
                      onClick={() => handleSort("role")}
                      title="Click to sort by Role Tier"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Role Tier</span>
                        <i
                          className={`bi ${
                            sortField === "role"
                              ? sortOrder === "asc"
                                ? "bi-arrow-up text-indigo-600 font-bold"
                                : "bi-arrow-down text-indigo-600 font-bold"
                              : "bi-arrow-down-up text-slate-400 text-[10px]"
                          }`}
                        ></i>
                      </div>
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Department</th>
                    <th
                      className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 transition-colors whitespace-nowrap"
                      onClick={() => handleSort("salary")}
                      title="Click to sort by Annual Salary"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Annual Salary</span>
                        <i
                          className={`bi ${
                            sortField === "salary"
                              ? sortOrder === "asc"
                                ? "bi-arrow-up text-indigo-600 font-bold"
                                : "bi-arrow-down text-indigo-600 font-bold"
                              : "bi-arrow-down-up text-slate-400 text-[10px]"
                          }`}
                        ></i>
                      </div>
                    </th>
                    <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Phone</th>
                    <th className="px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2.5">
                          <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs">Loading workforce directory...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displayedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-slate-400 text-xs">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <i className="bi bi-people text-3xl text-slate-300"></i>
                          <p className="font-medium text-slate-600 mb-0">No workforce personnel found</p>
                          <p className="text-[11px] text-slate-400 mb-0">
                            Try adjusting your filters, search terms, or onboard a new team member.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const isCurrentUser = currentUser?.id === u.id || currentUser?.email === u.email;
                      const deptInfo = getDepartmentIcon(u.department_name);

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Staff Member Identity */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200/90 shadow-2xs shrink-0 overflow-hidden ring-1 ring-slate-200/50">
                                {u.image_url ? (
                                  <img src={u.image_url} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{u.name ? u.name.charAt(0) : "U"}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-nowrap">
                                  <span className="font-semibold text-slate-900 text-xs leading-tight truncate">
                                    {u.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs shrink-0">
                                      You
                                    </span>
                                  )}
                                  {Boolean(u.is_hod) && !isCurrentUser ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs shrink-0">
                                      👑 HOD
                                    </span>
                                  ) : null}
                                </div>
                                <span className="text-[11px] text-slate-400 block truncate mt-0.5">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role Tier */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            {getRoleBadge(u)}
                          </td>

                          {/* Department */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <i className={`bi ${deptInfo.icon} ${deptInfo.color} text-xs shrink-0`}></i>
                              <span className="font-medium text-slate-700 text-xs">
                                {u.department_name || "Unassigned"}
                              </span>
                            </div>
                          </td>

                          {/* Compensation */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-900 text-xs">
                              ${Number(u.salary || 0).toLocaleString()}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-700">
                            {u.phone ? (
                              <span className="font-medium text-slate-700">{u.phone}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                u.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                                  : "bg-slate-100 text-slate-600 border border-slate-200/70"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              ></span>
                              <span className="capitalize">{u.status || "active"}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="relative inline-flex items-center justify-end action-menu-container">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(activeActionMenuId === u.id ? null : u.id);
                                }}
                                className={`w-8 h-8 rounded-xl border transition-all inline-flex items-center justify-center cursor-pointer ${
                                  activeActionMenuId === u.id
                                    ? "bg-slate-100 text-slate-800 border-slate-300 shadow-2xs"
                                    : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-2xs"
                                }`}
                                title="User Actions"
                              >
                                <i className="bi bi-three-dots text-xs"></i>
                              </button>

                              {activeActionMenuId === u.id && (
                                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleOpenProfile(u.id);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-eye text-slate-400"></i>
                                    <span>View Profile</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleOpenEdit(u);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-pencil-square text-slate-400"></i>
                                    <span>Edit Details</span>
                                  </button>
                                  <div className="h-px bg-slate-100 my-1"></div>
                                  <button
                                    type="button"
                                    disabled={deletingId === u.id}
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleRequestDelete(u);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    <i className="bi bi-person-x text-rose-500"></i>
                                    <span>Offboard Member</span>
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

            {/* Bottom Pagination Bar */}
            <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Left Counter */}
              <div className="text-slate-500 font-medium">
                Showing <span className="font-semibold text-slate-800">{displayedUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-semibold text-slate-800">{Math.min(currentPage * pageSize, displayedUsers.length)}</span> of{" "}
                <span className="font-semibold text-slate-800">{displayedUsers.length}</span> users
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Previous Page Button */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer text-xs"
                  title="Previous Page"
                >
                  <i className="bi bi-chevron-left text-[11px]"></i>
                </button>

                {/* Page Navigation Pills */}
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === page
                          ? "bg-indigo-600 text-white shadow-xs font-bold"
                          : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Page Button */}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="w-8 h-8 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer text-xs"
                  title="Next Page"
                >
                  <i className="bi bi-chevron-right text-[11px]"></i>
                </button>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5 ml-2">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs bg-white border border-slate-200 text-slate-700 font-medium outline-none cursor-pointer hover:border-slate-300"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Workforce Analytics Sidebar with Smooth Slide-in */}
        {isSidebarOpen && (
          <div className="w-full xl:w-1/3 xl:min-w-[340px] xl:max-w-[420px] min-w-0 xl:h-full xl:overflow-y-auto xl:pl-1 space-y-4 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 animate-in fade-in slide-in-from-right-4 duration-300">
            <WorkforceAnalyticsSidebar
              allUsers={allUsers}
              departments={departments}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        )}
      </div>

  {/* User Form Modal (Onboard & Edit) */}
  <UserFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedUserForEdit(null);
        }}
        onSuccess={() => {
          fetchUsers();
          fetchSupervisors();
          setMsg({
            type: "success",
            text: selectedUserForEdit
              ? "Member profile updated successfully"
              : "New workforce member onboarded successfully"
          });
        }}
        departments={departments}
        supervisors={supervisors}
        editUser={selectedUserForEdit}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedUserIdForProfile(null);
        }}
        userId={selectedUserIdForProfile}
        onEditUser={(user) => {
          setSelectedUserForEdit(user);
          setIsFormModalOpen(true);
        }}
      />

      {/* Enterprise Personnel Offboard Confirmation Modal */}
      <ConfirmOffboardModal
        isOpen={Boolean(offboardTarget)}
        onClose={() => setOffboardTarget(null)}
        onConfirm={handleConfirmOffboard}
        memberName={offboardTarget?.name || ""}
        memberRole={offboardTarget?.role}
        isDeleting={deletingId !== null}
      />
    </div>
  );
};

export default UserManagement;
