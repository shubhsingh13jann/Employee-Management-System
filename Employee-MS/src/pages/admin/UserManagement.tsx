import React, { useEffect, useState, useMemo, useRef } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { UserFormModal } from "../../Components/admin/users/UserFormModal";
import { UserProfileModal } from "../../Components/admin/users/UserProfileModal";
import { ConfirmOffboardModal } from "../../Components/admin/users/ConfirmOffboardModal";
import { WorkforceAnalyticsSidebar } from "../../Components/admin/users/WorkforceAnalyticsSidebar";
import { CsvImportModal } from "../../Components/admin/users/CsvImportModal";
interface FilterDropdownOption {
  value: string;
  label: string;
  sublabel?: string;
  dot?: string;
}

interface FilterDropdownProps {
  label: string;
  icon: string;
  value: string;
  options: FilterDropdownOption[];
  placeholder?: string;
  fieldName: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  themeColor?: "purple" | "emerald" | "indigo";
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  icon,
  value,
  options,
  placeholder = "Select...",
  fieldName,
  isOpen,
  onToggle,
  onSelect,
  themeColor = "purple"
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  const themeClasses = {
    purple: {
      btn: isOpen
        ? "border-indigo-500 bg-white ring-2 ring-purple-100"
        : "border-purple-200/90 hover:border-purple-300 bg-purple-50/40",
      icon: "text-indigo-600",
      activeItem: "bg-indigo-50 text-[#4f46e5]",
      hoverItem: "text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
      check: "text-[#4f46e5]"
    },
    emerald: {
      btn: isOpen
        ? "border-emerald-500 bg-white ring-2 ring-emerald-100"
        : "border-emerald-200/90 hover:border-emerald-300 bg-emerald-50/30",
      icon: "text-emerald-600",
      activeItem: "bg-emerald-50 text-emerald-700",
      hoverItem: "text-slate-700 hover:bg-slate-50 hover:text-emerald-700",
      check: "text-emerald-600"
    },
    indigo: {
      btn: isOpen
        ? "border-indigo-500 bg-white ring-2 ring-indigo-100"
        : "border-slate-200 hover:border-indigo-300 bg-white/70",
      icon: "text-indigo-600",
      activeItem: "bg-indigo-50 text-[#4f46e5]",
      hoverItem: "text-slate-700 hover:bg-slate-50 hover:text-indigo-600",
      check: "text-[#4f46e5]"
    }
  }[themeColor];

  return (
    <div>
      <label className="flex items-center text-xs font-bold text-slate-800 mb-1">
        <span className={`inline-flex items-center justify-center mr-2 ${themeClasses.icon}`}>
          <i className={`${icon} text-xs`}></i>
        </span>
        <span>{label}</span>
      </label>
      <div className="relative" data-filter-dropdown={fieldName}>
        <button
          type="button"
          onClick={onToggle}
          className={`w-full relative flex items-center h-9 rounded-xl border transition-all px-2.5 shadow-2xs text-left cursor-pointer outline-none ${themeClasses.btn}`}
        >
          {selectedOption?.dot ? (
            <span className={`w-2.5 h-2.5 rounded-full mr-2 shrink-0 shadow-2xs ${selectedOption.dot}`}></span>
          ) : (
            <i className={`${icon} ${themeClasses.icon} text-xs mr-2 shrink-0`}></i>
          )}

          <span className="w-full text-xs font-semibold text-slate-700 truncate pr-2">
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <i
            className={`bi bi-chevron-down text-slate-500 text-[10px] font-bold shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-indigo-600" : ""
            }`}
          ></i>
        </button>

        {/* Floating Menu Popover (Matching UserFormModal structure) */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 w-full min-w-[210px] bg-white rounded-xl border border-slate-200/90 shadow-2xl z-50 py-1.5 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value || "__all__"}
                    type="button"
                    onClick={() => onSelect(opt.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs sm:text-[13px] flex items-center justify-between text-left cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? `${themeClasses.activeItem} font-semibold`
                        : `${themeClasses.hoverItem} font-medium`
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {opt.dot && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${opt.dot}`}></span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[10px] text-slate-400 truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <i className={`bi bi-check2 text-base ${themeClasses.check} shrink-0 font-bold ml-1`}></i>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null);

  // Bulk Selection States
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
  const [isBulkOffboardConfirmOpen, setIsBulkOffboardConfirmOpen] = useState(false);
  const [copiedEmailId, setCopiedEmailId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const showCheckboxes = isSelectMode || selectedUserIds.length > 0;

  // Salary Privacy Mode State
  const [isSalaryMasked, setIsSalaryMasked] = useState<boolean>(() => {
    return localStorage.getItem("ems_salary_privacy") === "true";
  });
  const toggleSalaryMask = () => {
    setIsSalaryMasked((prev) => {
      const next = !prev;
      localStorage.setItem("ems_salary_privacy", String(next));
      return next;
    });
  };

  // CSV Import Modal State
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Column Visibility Customizer State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("ems_user_columns");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      role: true,
      department: true,
      supervisor: true,
      salary: true,
      phone: true,
      status: true
    };
  });
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("ems_user_columns", JSON.stringify(next));
      return next;
    });
  };

  // Global search input ref for keyboard shortcut (/ or Ctrl+K)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper to calculate employee tenure from created_at
  const formatTenure = (dateStr?: string) => {
    if (!dateStr) return "Recent";
    const start = new Date(dateStr);
    if (isNaN(start.getTime())) return "Recent";
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (months < 1) return "< 1 mo";
    if (months < 12) return `${months} mo${months > 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} yr${years > 1 ? "s" : ""}${remainingMonths > 0 ? ` ${remainingMonths} mo` : ""}`;
  };

  const activeColSpan = 2 + Object.values(visibleColumns).filter(Boolean).length + (showCheckboxes ? 1 : 0);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setActiveActionMenuId(null);
      }
      if (!target.closest(".hero-menu-container")) {
        setIsHeroMenuOpen(false);
      }
      if (!target.closest("[data-filter-dropdown]")) {
        setOpenFilterDropdown(null);
      }
      if (!target.closest(".bulk-transfer-container")) {
        setIsBulkTransferOpen(false);
      }
      if (!target.closest(".column-visibility-container")) {
        setIsColumnDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenFilterDropdown(null);
        setIsHeroMenuOpen(false);
        setActiveActionMenuId(null);
        setIsBulkTransferOpen(false);
        setIsColumnDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Keyboard shortcut listener (/ or Ctrl+K / Cmd+K to open filter & focus search)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "/" && !isInput) || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
        e.preventDefault();
        setIsFilterOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 60);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
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
        const uniqueMap = new Map();
        fetched.forEach((u: any) => {
          if (!uniqueMap.has(u.id)) {
            uniqueMap.set(u.id, u);
          }
        });
        const uniqueUsers = Array.from(uniqueMap.values());
        setAllUsers(uniqueUsers);
        setUsers(uniqueUsers);
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

  const handleCopyEmail = (email: string, id: number) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmailId(id);
    setTimeout(() => {
      setCopiedEmailId(null);
    }, 1800);
  };

  // Bulk Selection Handlers
  const handleToggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    const pageIds = paginatedUsers.map((u) => u.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setIsBulkOperating(true);
      await Promise.all(
        selectedUserIds.map((id) => api.put(`/api/admin/users/${id}`, { status: "active" }))
      );
      setMsg({ type: "success", text: `Successfully activated ${selectedUserIds.length} personnel accounts` });
      fetchUsers();
      setSelectedUserIds([]);
      setIsSelectMode(false);
    } catch (err: any) {
      console.error("Bulk activate error:", err);
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to bulk activate users" });
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setIsBulkOperating(true);
      await Promise.all(
        selectedUserIds.map((id) => api.put(`/api/admin/users/${id}`, { status: "inactive" }))
      );
      setMsg({ type: "success", text: `Successfully suspended ${selectedUserIds.length} personnel accounts` });
      fetchUsers();
      setSelectedUserIds([]);
      setIsSelectMode(false);
    } catch (err: any) {
      console.error("Bulk deactivate error:", err);
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to bulk suspend users" });
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleToggleUserStatus = async (userToToggle: any) => {
    setActiveActionMenuId(null);
    const isSuspending = userToToggle.status === "active";
    const newStatus = isSuspending ? "inactive" : "active";
    try {
      const res = await api.put(`/api/admin/users/${userToToggle.id}`, { status: newStatus });
      if (res.data.status) {
        setMsg({
          type: "success",
          text: `Account for ${userToToggle.name} ${isSuspending ? "suspended" : "reactivated"} successfully.`
        });
        fetchUsers();
      }
    } catch (err: any) {
      console.error("Toggle user status error:", err);
      setMsg({
        type: "danger",
        text: err.response?.data?.error || `Failed to ${isSuspending ? "suspend" : "reactivate"} account`
      });
    }
  };

  const handleBulkDepartmentTransfer = async (deptId: number) => {
    if (selectedUserIds.length === 0) return;
    try {
      setIsBulkOperating(true);
      await Promise.all(
        selectedUserIds.map((id) => api.put(`/api/admin/users/${id}`, { department_id: deptId }))
      );
      const targetDept = departments.find((d) => d.id === deptId);
      setMsg({
        type: "success",
        text: `Transferred ${selectedUserIds.length} members to ${targetDept?.name || "department"} successfully`
      });
      fetchUsers();
      setSelectedUserIds([]);
      setIsSelectMode(false);
      setIsBulkTransferOpen(false);
    } catch (err: any) {
      console.error("Bulk dept transfer error:", err);
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to transfer users" });
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkExportCSV = () => {
    const selectedList = allUsers.filter((u) => selectedUserIds.includes(u.id));
    if (selectedList.length === 0) return;
    const headers = ["ID", "Name", "Email", "Role", "Department", "Supervisor", "Salary", "Phone", "Status", "Joined"];
    const rows = selectedList.map((u) => [
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
    link.setAttribute("download", `workforce_selected_${selectedList.length}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkOffboardConfirm = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setIsBulkOperating(true);
      await Promise.all(selectedUserIds.map((id) => api.delete(`/api/admin/users/${id}`)));
      setMsg({ type: "success", text: `Successfully offboarded ${selectedUserIds.length} personnel` });
      fetchUsers();
      fetchSupervisors();
      setSelectedUserIds([]);
      setIsSelectMode(false);
      setIsBulkOffboardConfirmOpen(false);
    } catch (err: any) {
      console.error("Bulk offboard error:", err);
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to offboard selected members" });
    } finally {
      setIsBulkOperating(false);
    }
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
    setOpenFilterDropdown(null);
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

  const getSupervisorInfo = (u: any) => {
    if (Boolean(u.is_hod) || u.role === "admin") {
      return {
        type: "executive",
        label: u.role === "admin" ? "Board / Exec" : "Dept Head (HOD)",
      };
    }
    const sup = supervisors.find((s) => s.id === u.supervisor_id);
    const name = u.supervisor_name || sup?.name;
    if (!name) {
      return {
        type: "unassigned",
        label: "Direct to HOD",
      };
    }
    return {
      type: "assigned",
      label: name,
    };
  };

  const getRoleBadge = (u: any) => {
    switch (u.role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <span>👑</span>
            <span>HR Admin</span>
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
            <span>👔</span>
            <span>Manager</span>
          </span>
        );
      case "supervisor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs">
            <span>💼</span>
            <span>Employee</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-3.5 xl:h-full xl:flex xl:flex-col xl:min-h-0 xl:overflow-hidden">
      {/* Alert Notification */}
      {msg.text && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shrink-0 ${
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
      <div className="flex flex-col xl:flex-row items-start xl:flex-1 xl:min-h-0 xl:h-full w-full">
        {/* Left Column (Hero, Tabs, Table) */}
        <div
          className={`min-w-0 xl:h-full xl:overflow-y-auto space-y-3 transition-all duration-300 ease-in-out [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 ${
            isSidebarOpen ? "xl:w-[calc(100%-365px)] xl:pr-1" : "w-full"
          }`}
        >
          {/* Executive Gradient Hero Banner & Action Toolbar with Micro-Lightning / Wave Effect */}
          <div className="relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-[#070d28] via-[#0d164d] to-[#1c1252] border border-indigo-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 select-none">
            {/* Micro-Lightning Wave Effect Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-0">
              {/* Harmonic Waves / Micro Lightning SVG */}
              <svg
                className="absolute right-0 bottom-0 w-[65%] sm:w-[52%] h-full text-cyan-400 micro-lightning-waves opacity-85"
                viewBox="0 0 600 120"
                preserveAspectRatio="none"
                fill="none"
              >
                <defs>
                  <linearGradient id="heroWaveGradient1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                    <stop offset="45%" stopColor="#818cf8" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="heroWaveCyan" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                    <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {/* Primary Harmonic Fan */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const startX = 50 + i * 14;
                  const cp1x = 180 + i * 11;
                  const cp1y = 110 - i * 3.2;
                  const cp2x = 340 + i * 8;
                  const cp2y = 35 - i * 1.5;
                  const endX = 490 + i * 6;
                  const endY = -10 + i * 1.8;
                  const opacity = 0.08 + Math.sin((i / 24) * Math.PI) * 0.32;
                  return (
                    <path
                      key={`hero-wave-1-${i}`}
                      d={`M ${startX},130 C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                      stroke="url(#heroWaveGradient1)"
                      strokeWidth={i % 3 === 0 ? "1.2" : "0.75"}
                      strokeOpacity={opacity}
                    />
                  );
                })}

                {/* Intersecting Silk Filament Ribbon */}
                {Array.from({ length: 16 }).map((_, i) => {
                  const startX = 140 + i * 16;
                  const cp1x = 260 + i * 10;
                  const cp1y = 95 - i * 2.5;
                  const cp2x = 400 + i * 7;
                  const cp2y = 45 - i * 1.2;
                  const endX = 550 + i * 5;
                  const endY = 5 + i * 2.2;
                  const opacity = 0.05 + Math.sin((i / 16) * Math.PI) * 0.22;
                  return (
                    <path
                      key={`hero-wave-2-${i}`}
                      d={`M ${startX},130 C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                      stroke="url(#heroWaveCyan)"
                      strokeWidth="0.8"
                      strokeOpacity={opacity}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Left Side: Icon & Title */}
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-blue-400/40 flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md shadow-blue-500/25 shrink-0 backdrop-blur-xs">
                <i className="bi bi-people-fill text-blue-200"></i>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white mb-0.5 whitespace-nowrap">
                  Workforce Management
                </h2>
                <p className="text-[11px] text-indigo-200/80 mb-0 font-normal truncate max-w-[280px] sm:max-w-md">
                  Enterprise Personnel Directory, Reporting Line Hierarchy & Governance Operations
                </p>
              </div>
            </div>

            {/* Right Side: Action Buttons or 3-Lines Dropdown Menu */}
            {isSidebarOpen ? (
              <div className="relative z-10 hero-menu-container shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => setIsHeroMenuOpen(!isHeroMenuOpen)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                    isHeroMenuOpen
                      ? "bg-indigo-600 text-white border border-indigo-400/50 shadow-indigo-500/30 ring-2 ring-indigo-400/30"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs"
                  }`}
                  title="Menu Options"
                  aria-label="Toggle Actions Menu"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  </svg>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-slate-900 text-[8px] font-bold flex items-center justify-center text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {isHeroMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        handleOpenOnboard();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-xs text-left"
                    >
                      <i className="bi bi-plus-lg text-[10px] font-bold"></i>
                      <span>Onboard Member</span>
                    </button>

                    <div className="h-px bg-white/10 my-1"></div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        setIsSidebarOpen(!isSidebarOpen);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <i className={`bi ${isSidebarOpen ? "bi-pie-chart-fill" : "bi-pie-chart"} text-indigo-400 text-xs`}></i>
                        <span>Workforce Overview</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300">
                        {isSidebarOpen ? "Open" : "Closed"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        setIsFilterOpen(!isFilterOpen);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <i className="bi bi-funnel text-indigo-400 text-xs"></i>
                        <span>Filter Directory</span>
                      </div>
                      {activeFilterCount > 0 && (
                        <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        setViewMode(viewMode === "table" ? "grid" : "table");
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <i className={`bi ${viewMode === "table" ? "bi-grid-fill" : "bi-table"} text-indigo-400 text-xs`}></i>
                        <span>{viewMode === "table" ? "Switch to Grid View" : "Switch to Table View"}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 uppercase">
                        {viewMode}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        toggleSalaryMask();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2">
                        <i className={`bi ${isSalaryMasked ? "bi-eye-slash-fill text-amber-300" : "bi-eye text-indigo-400"} text-xs`}></i>
                        <span>{isSalaryMasked ? "Reveal Salary Figures" : "Salary Privacy Mode"}</span>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                        {isSalaryMasked ? "Masked" : "Visible"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        setIsCsvImportOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <i className="bi bi-file-earmark-arrow-up text-indigo-400 text-xs"></i>
                      <span>Bulk CSV Import</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        handleExportCSV();
                      }}
                      disabled={users.length === 0}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 text-left"
                    >
                      <i className="bi bi-download text-indigo-400 text-xs"></i>
                      <span>Export Directory</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative z-10 flex items-center gap-1.5 shrink-0 self-end md:self-center">
                {/* View Switcher: Table vs. Grid */}
                <div className="h-8 p-0.5 rounded-lg bg-white/10 border border-white/20 flex items-center gap-0.5 backdrop-blur-xs box-border">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`h-7 px-2 sm:px-2.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
                      viewMode === "table"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                    title="Dense Table View"
                  >
                    <i className="bi bi-table text-xs"></i>
                    <span className="hidden sm:inline">Table</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`h-7 px-2 sm:px-2.5 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
                      viewMode === "grid"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white"
                    }`}
                    title="Interactive Team Card Grid View"
                  >
                    <i className="bi bi-grid-fill text-xs"></i>
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                </div>

                {/* Workforce Overview Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold border backdrop-blur-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs box-border ${
                    isSidebarOpen
                      ? "bg-indigo-600 border-indigo-400 text-white shadow-indigo-500/30 ring-2 ring-indigo-400/30"
                      : "bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/20"
                  }`}
                  title="Toggle Workforce Overview Analytics"
                >
                  <i className={`bi ${isSidebarOpen ? "bi-pie-chart-fill" : "bi-pie-chart"} text-xs leading-none`}></i>
                  <span className="leading-none">Workforce Overview</span>
                </button>

                {/* Filter Button with Shortcut Hint */}
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold border backdrop-blur-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs box-border ${
                    isFilterOpen || activeFilterCount > 0
                      ? "bg-indigo-600/40 border-indigo-400 text-white shadow-indigo-500/20"
                      : "bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/20"
                  }`}
                  title="Search & Filters (Shortcut: Ctrl+K or /)"
                >
                  <i className="bi bi-funnel text-xs leading-none"></i>
                  <span className="leading-none">Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Salary Privacy Mode Toggle (Feature 1) */}
                <button
                  type="button"
                  onClick={toggleSalaryMask}
                  className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold border backdrop-blur-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs box-border leading-none ${
                    isSalaryMasked
                      ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-amber-500/20 ring-1 ring-amber-400/40"
                      : "bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/20"
                  }`}
                  title={isSalaryMasked ? "Salary Privacy Active ($••••••) — Click to Reveal" : "Enable Salary Privacy Mode (Masks compensation)"}
                >
                  <i className={`bi ${isSalaryMasked ? "bi-eye-slash-fill text-amber-300" : "bi-eye text-slate-300"} text-xs`}></i>
                  <span className="hidden xl:inline">{isSalaryMasked ? "Masked" : "Privacy"}</span>
                </button>

                {/* Column Visibility Customizer Dropdown (Feature 4) */}
                {viewMode === "table" && (
                  <div className="relative column-visibility-container">
                    <button
                      type="button"
                      onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg text-[11px] font-semibold border backdrop-blur-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs box-border leading-none ${
                        isColumnDropdownOpen
                          ? "bg-indigo-600/40 border-indigo-400 text-white"
                          : "bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border-white/20"
                      }`}
                      title="Customize Visible Columns in Directory"
                    >
                      <i className="bi bi-layout-three-columns text-xs"></i>
                      <span className="hidden xl:inline">Columns</span>
                      <i className={`bi bi-chevron-down text-[9px] transition-transform ${isColumnDropdownOpen ? "rotate-180" : ""}`}></i>
                    </button>

                    {isColumnDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-slate-200/90 shadow-2xl p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                          Visible Columns
                        </div>
                        <div className="space-y-0.5">
                          {[
                            { key: "role", label: "Role Tier" },
                            { key: "department", label: "Department" },
                            { key: "supervisor", label: "Reports To" },
                            { key: "salary", label: "Annual Salary" },
                            { key: "phone", label: "Phone Number" },
                            { key: "status", label: "Status" }
                          ].map((col) => (
                            <label
                              key={col.key}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={visibleColumns[col.key] !== false}
                                onChange={() => toggleColumn(col.key)}
                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600 cursor-pointer"
                              />
                              <span>{col.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Import CSV Button (Feature 5) */}
                <button
                  type="button"
                  onClick={() => setIsCsvImportOpen(true)}
                  className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/20 backdrop-blur-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs box-border leading-none"
                  title="Bulk Onboard Personnel via CSV Upload"
                >
                  <i className="bi bi-file-earmark-arrow-up text-xs leading-none"></i>
                  <span className="leading-none hidden sm:inline">Import CSV</span>
                </button>

                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={users.length === 0}
                  className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/20 backdrop-blur-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 box-border leading-none"
                  title="Export Workforce Directory as CSV"
                >
                  <i className="bi bi-download text-xs leading-none"></i>
                  <span className="leading-none">Export</span>
                </button>

                {/* Onboard Member Button */}
                <button
                  type="button"
                  onClick={handleOpenOnboard}
                  className="h-8 px-3 rounded-lg text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 shadow-md shadow-indigo-600/30 transition-all inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap box-border leading-none"
                >
                  <i className="bi bi-plus-lg font-bold text-[10px] leading-none"></i>
                  <span className="leading-none">Onboard Member</span>
                </button>
              </div>
            )}
          </div>

          {/* Expandable Filter Drawer Panel (Matching Reference UI) */}
          {/* Expandable Filter Drawer Panel with Smooth Watery Opening & Closing */}
          <div
            className={`water-drawer-wrapper ${
              isFilterOpen ? "water-drawer-open" : "water-drawer-closed"
            } ${openFilterDropdown ? "z-30 relative" : "z-10 relative"}`}
          >
            <div className={`${isFilterOpen ? "overflow-visible" : "overflow-hidden"} min-h-0 py-0.5`}>
              <div className="water-drop-card p-[1px] rounded-[16px] bg-gradient-to-r from-sky-300/40 via-purple-300/40 to-pink-300/50 shadow-md shadow-indigo-500/5 shrink-0">
                <div className="relative rounded-[15px] bg-white/85 backdrop-blur-2xl px-4 py-2.5 sm:px-5 sm:py-3">
                  {/* Luminous Ethereal Silk Waves & Water Effects in Background */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-[15px]">
                    {/* Concentric Water Droplet Ripple Wave */}
                    <div className="absolute -top-10 left-1/3 w-80 h-40 rounded-full border border-sky-300/40 bg-gradient-to-b from-sky-400/15 via-indigo-300/10 to-transparent water-ripple-ring" />

                    {/* Liquid Caustic Water Sheen Sweep */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent water-caustic-gleam" />

                    {/* Atmospheric Glow Blobs */}
                    <div className="absolute -top-12 -right-10 w-72 h-40 bg-gradient-to-bl from-pink-300/35 via-rose-200/25 to-transparent blur-2xl"></div>
                    <div className="absolute -top-16 left-1/4 w-96 h-40 bg-gradient-to-b from-sky-200/35 via-indigo-100/20 to-transparent blur-2xl"></div>
                    <div className="absolute -top-10 -left-10 w-64 h-36 bg-gradient-to-br from-indigo-200/25 via-purple-100/20 to-transparent blur-2xl"></div>

                    {/* Silky Wave Ribbons & Luminous Highlight Edges with Liquid Drift */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none watery-silk-waves"
                      viewBox="0 0 1000 120"
                      preserveAspectRatio="none"
                      fill="none"
                    >
                      <defs>
                        <linearGradient id="silkRibbon1" x1="0%" y1="0%" x2="100%" y2="80%">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
                          <stop offset="35%" stopColor="#818cf8" stopOpacity="0.25" />
                          <stop offset="70%" stopColor="#c084fc" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.0" />
                        </linearGradient>

                        <linearGradient id="silkFold" x1="20%" y1="0%" x2="80%" y2="100%">
                          <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.38" />
                          <stop offset="45%" stopColor="#c7d2fe" stopOpacity="0.22" />
                          <stop offset="80%" stopColor="#e9d5ff" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                        </linearGradient>

                        <linearGradient id="silkPinkViolet" x1="40%" y1="0%" x2="100%" y2="70%">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.0" />
                          <stop offset="35%" stopColor="#c084fc" stopOpacity="0.18" />
                          <stop offset="70%" stopColor="#f472b6" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#fda4af" stopOpacity="0.38" />
                        </linearGradient>

                        <linearGradient id="edgeGlow1" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.0" />
                          <stop offset="25%" stopColor="#38bdf8" stopOpacity="0.55" />
                          <stop offset="55%" stopColor="#818cf8" stopOpacity="0.65" />
                          <stop offset="85%" stopColor="#c084fc" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#f472b6" stopOpacity="0.0" />
                        </linearGradient>

                        <linearGradient id="edgeGlow2" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="25%" stopColor="#a855f7" stopOpacity="0.0" />
                          <stop offset="55%" stopColor="#c084fc" stopOpacity="0.5" />
                          <stop offset="85%" stopColor="#f472b6" stopOpacity="0.65" />
                          <stop offset="100%" stopColor="#fb7185" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Flowing Translucent Silk Wave Fills */}
                      <path
                        d="M -50,-10 C 250,55 520,70 780,25 C 890,5 980,-5 1050,-10 L 1050,-20 L -50,-20 Z"
                        fill="url(#silkRibbon1)"
                      />
                      <path
                        d="M 280,-20 C 450,45 680,85 850,55 C 930,40 980,15 1050,0 L 1050,-20 Z"
                        fill="url(#silkFold)"
                      />
                      <path
                        d="M 550,-20 C 720,35 880,45 1050,15 L 1050,-20 Z"
                        fill="url(#silkPinkViolet)"
                      />

                      {/* Silk Wave Luminous Highlight Lines */}
                      <path
                        d="M 0,25 C 260,68 530,68 780,24 C 880,5 970,2 1050,5"
                        stroke="url(#edgeGlow1)"
                        strokeWidth="1.2"
                        fill="none"
                      />
                      <path
                        d="M 320,12 C 510,62 720,72 880,42 C 950,28 1000,10 1050,2"
                        stroke="url(#edgeGlow2)"
                        strokeWidth="1"
                        fill="none"
                      />
                    </svg>
                  </div>

                  {/* Header Row: Title & Action Buttons */}
                  <div className="relative z-10 flex items-center justify-between gap-3 mb-2">
                    {/* Left: Funnel Badge + Title */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center text-white shadow-xs shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                      </div>
                      <div className="flex flex-col justify-center">
                        <h3 className="font-bold text-slate-900 text-[12.5px] sm:text-[13px] tracking-tight leading-tight mb-0">
                          Directory Filters
                        </h3>
                        <p className="text-slate-500 text-[10px] font-normal leading-tight mt-0.5 mb-0">
                          Search and refine the workforce directory
                        </p>
                      </div>
                    </div>

                    {/* Right: Reset Filters + OK */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="h-7.5 px-3 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50/70 border border-slate-200/80 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="bi bi-arrow-counterclockwise text-xs"></i>
                        <span>Reset Filters</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="h-7.5 px-3.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="bi bi-check2 text-xs font-bold"></i>
                        <span>OK</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Fields Row */}
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Field 1: Search Keywords */}
                    <div>
                      <label className="flex items-center text-xs font-bold text-slate-800 mb-1">
                        <span className="inline-flex items-center justify-center mr-2 text-indigo-600">
                          <i className="bi bi-search text-xs"></i>
                        </span>
                        <span>Search Keywords</span>
                      </label>
                      <div className="relative flex items-center h-9 rounded-xl bg-white/70 border border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-2.5 shadow-2xs">
                        <i className="bi bi-search text-slate-400 text-xs mr-2 shrink-0"></i>
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filter by name, email, department..."
                          className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent outline-none font-medium"
                        />
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer w-4 h-4 rounded-full hover:bg-slate-100 flex items-center justify-center"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          )}
                          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded select-none">
                            Ctrl K
                          </kbd>
                        </div>
                      </div>
                    </div>

                    {/* Field 2: Department (Modern Custom Dropdown) */}
                    <FilterDropdown
                      label="Department"
                      icon="bi bi-building"
                      value={selectedDept}
                      options={[
                        { value: "", label: "All Departments" },
                        ...departments.map((d) => ({
                          value: String(d.id),
                          label: `${d.name} ${d.code ? `(${d.code})` : ""}`
                        }))
                      ]}
                      fieldName="department"
                      isOpen={openFilterDropdown === "department"}
                      onToggle={() =>
                        setOpenFilterDropdown(
                          openFilterDropdown === "department" ? null : "department"
                        )
                      }
                      onSelect={(val) => {
                        setSelectedDept(val);
                        setOpenFilterDropdown(null);
                      }}
                      themeColor="purple"
                    />

                    {/* Field 3: Account Status (Modern Custom Dropdown) */}
                    <FilterDropdown
                      label="Account Status"
                      icon="bi bi-shield-check"
                      value={selectedStatus}
                      options={[
                        { value: "", label: "All Statuses", dot: "bg-slate-400" },
                        { value: "active", label: "Active Members", dot: "bg-emerald-500" },
                        { value: "inactive", label: "Inactive / Suspended", dot: "bg-rose-500" }
                      ]}
                      fieldName="status"
                      isOpen={openFilterDropdown === "status"}
                      onToggle={() =>
                        setOpenFilterDropdown(
                          openFilterDropdown === "status" ? null : "status"
                        )
                      }
                      onSelect={(val) => {
                        setSelectedStatus(val);
                        setOpenFilterDropdown(null);
                      }}
                      themeColor="emerald"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Role Filter Tabs (Clean Floating Pills) & Multi-Select Action Tab */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
              {roleTabs.map((tab) => {
                const isActive = selectedRole === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedRole(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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
            </div>

            {/* Select Tab at the right-most corner */}
            <div className="shrink-0 pl-1">
              <button
                type="button"
                onClick={() => {
                  if (showCheckboxes) {
                    setIsSelectMode(false);
                    setSelectedUserIds([]);
                  } else {
                    setIsSelectMode(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
                  showCheckboxes
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-400/40"
                    : "bg-white hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-600 border-slate-200/90 hover:border-indigo-300"
                }`}
                title={showCheckboxes ? "Exit Multi-Select Mode" : "Enable Multi-Select Mode"}
              >
                <i className={`bi ${showCheckboxes ? "bi-check2-all text-white font-bold" : "bi-check2-square text-indigo-500"} text-xs`}></i>
                <span>{showCheckboxes ? `Done (${selectedUserIds.length})` : "Select"}</span>
              </button>
            </div>
          </div>

          {/* Workforce Directory View (Table or Interactive Card Grid) */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                {viewMode === "table" ? (
                  <div className="overflow-x-auto min-h-[340px] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                    <table className="w-full min-w-[760px] text-left border-collapse text-xs">
                    <thead className="bg-slate-50/80 border-b border-slate-200/90 text-xs font-semibold text-slate-700 normal-case tracking-normal">
                      <tr>
                        {showCheckboxes && (
                          <th className="w-10 px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              aria-label="Select all members on current page"
                              checked={
                                paginatedUsers.length > 0 &&
                                paginatedUsers.every((u) => selectedUserIds.includes(u.id))
                              }
                              ref={(el) => {
                                if (el) {
                                  const someSelected = paginatedUsers.some((u) => selectedUserIds.includes(u.id));
                                  const allSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(u.id));
                                  el.indeterminate = someSelected && !allSelected;
                                }
                              }}
                              onChange={handleToggleSelectAll}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                            />
                          </th>
                        )}
                        <th
                          className="px-4 py-2.5 cursor-pointer select-none hover:text-slate-900 transition-colors"
                          onClick={() => handleSort("name")}
                          title="Click to sort by Name"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-700">User</span>
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
                        {visibleColumns.role && (
                          <th
                            className="px-3.5 py-2.5 cursor-pointer select-none hover:text-slate-900 transition-colors whitespace-nowrap"
                            onClick={() => handleSort("role")}
                            title="Click to sort by Role Tier"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-700">Role Tier</span>
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
                        )}
                        {visibleColumns.department && (
                          <th className="px-3.5 py-2.5 font-semibold text-slate-700 text-xs whitespace-nowrap">Department</th>
                        )}
                        {visibleColumns.supervisor && (
                          <th className="px-3.5 py-2.5 font-semibold text-slate-700 text-xs whitespace-nowrap">Reports To</th>
                        )}
                        {visibleColumns.salary && (
                          <th
                            className="px-3.5 py-2.5 cursor-pointer select-none hover:text-slate-900 transition-colors whitespace-nowrap"
                            onClick={() => handleSort("salary")}
                            title="Click to sort by Annual Salary"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Annual Salary</span>
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSalaryMask();
                                }}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title={isSalaryMasked ? "Show Compensation Numbers" : "Hide / Mask Compensation (Privacy Mode)"}
                              >
                                <i className={`bi ${isSalaryMasked ? "bi-eye-slash text-indigo-600 font-bold" : "bi-eye text-slate-400"} text-xs`}></i>
                              </button>
                            </div>
                          </th>
                        )}
                        {visibleColumns.phone && (
                          <th className="px-3.5 py-2.5 font-semibold text-slate-700 text-xs whitespace-nowrap">Phone</th>
                        )}
                        {visibleColumns.status && (
                          <th className="px-3.5 py-2.5 font-semibold text-slate-700 text-xs whitespace-nowrap">Status</th>
                        )}
                        <th className="px-4 py-2.5 font-semibold text-slate-700 text-xs text-center whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={activeColSpan} className="px-6 py-20 text-center text-slate-400">
                            <div className="flex flex-col items-center justify-center gap-2.5">
                              <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs">Loading workforce directory...</span>
                            </div>
                          </td>
                        </tr>
                      ) : displayedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={activeColSpan} className="px-6 py-16 text-center text-slate-400 text-xs">
                            <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 text-xl shadow-xs">
                                <i className="bi bi-people"></i>
                              </div>
                              <p className="font-bold text-slate-800 text-sm mb-0">No workforce personnel found</p>
                              <p className="text-[11px] text-slate-500 leading-normal mb-1">
                                {activeFilterCount > 0 || selectedRole
                                  ? "No team members matched your active filters or search terms."
                                  : "Your workforce directory is currently empty. Onboard new members to get started."}
                              </p>
                              {(activeFilterCount > 0 || selectedRole) && (
                                <button
                                  type="button"
                                  onClick={handleClearFilters}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer mt-1"
                                >
                                  <i className="bi bi-arrow-counterclockwise text-xs"></i>
                                  <span>Clear All Filters & Search</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                    paginatedUsers.map((u, index) => {
                      const isCurrentUser = currentUser?.id === u.id || currentUser?.email === u.email;
                      const deptInfo = getDepartmentIcon(u.department_name);
                      const isMenuActive = activeActionMenuId === u.id;
                      const isNearBottom = index >= paginatedUsers.length - 2 && paginatedUsers.length > 2;

                      return (
                        <tr
                          key={u.id}
                          onClick={() => handleOpenProfile(u.id)}
                          className={`hover:bg-indigo-50/30 transition-colors cursor-pointer group ${
                            isMenuActive ? "relative z-30 bg-slate-50/60" : "relative z-0"
                          }`}
                          title="Click row to view profile dossier"
                        >
                          {/* Checkbox Selector */}
                          {showCheckboxes && (
                            <td className="w-10 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                aria-label={`Select ${u.name}`}
                                checked={selectedUserIds.includes(u.id)}
                                onChange={() => handleToggleSelectUser(u.id)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                              />
                            </td>
                          )}

                          {/* Staff Member Identity */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenProfile(u.id);
                                }}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200/90 shadow-2xs shrink-0 overflow-hidden ring-1 ring-slate-200/50 hover:ring-indigo-400 hover:scale-105 transition-all cursor-pointer"
                                title="Click to view full profile"
                              >
                                {u.image_url ? (
                                   <img src={u.image_url} alt={u.name} className="w-full h-full object-cover" />
                                ) : (
                                   <span>{u.name ? u.name.charAt(0) : "U"}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-nowrap">
                                  <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-xs sm:text-[13px] leading-tight truncate">
                                    {u.name}
                                  </span>
                                  {isCurrentUser && (
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs shrink-0">
                                      You
                                    </span>
                                  )}
                                  {Boolean(u.is_hod) && !isCurrentUser ? (
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs shrink-0">
                                      👑 HOD
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[11px] text-slate-500 truncate max-w-[130px] sm:max-w-[170px]">{u.email}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyEmail(u.email, u.id);
                                    }}
                                    className={`transition-all inline-flex items-center justify-center cursor-pointer shrink-0 ${
                                      copiedEmailId === u.id
                                        ? "h-4 px-1.5 rounded text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold gap-1 shadow-2xs"
                                        : "w-4.5 h-4.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent"
                                    }`}
                                    title={copiedEmailId === u.id ? "Email copied!" : "Copy email to clipboard"}
                                  >
                                    <i className={`bi ${copiedEmailId === u.id ? "bi-check2 text-emerald-600 font-bold" : "bi-copy"} text-[9.5px]`}></i>
                                    {copiedEmailId === u.id && <span>Copied!</span>}
                                  </button>
                                  {u.created_at && (
                                    <span
                                      className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70 shrink-0"
                                      title={`Joined ${new Date(u.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`}
                                    >
                                      <i className="bi bi-clock-history text-[8.5px] text-slate-400"></i>
                                      <span>{formatTenure(u.created_at)}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role Tier */}
                          {visibleColumns.role && (
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              {getRoleBadge(u)}
                            </td>
                          )}

                          {/* Department */}
                          {visibleColumns.department && (
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <i className={`bi ${deptInfo.icon} ${deptInfo.color} text-xs shrink-0`}></i>
                                <span className="font-medium text-slate-800 text-xs sm:text-[12.5px]">
                                  {u.department_name || "Unassigned"}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* Reports To Supervisor */}
                          {visibleColumns.supervisor && (
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              {(() => {
                                const sup = getSupervisorInfo(u);
                                if (sup.type === "executive") {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                                      <i className="bi bi-star-fill text-amber-500 text-[9px]"></i>
                                      <span>{sup.label}</span>
                                    </span>
                                  );
                                }
                                if (sup.type === "unassigned") {
                                  return (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                      <i className="bi bi-arrow-up-right text-slate-400 text-[9px]"></i>
                                      <span>{sup.label}</span>
                                    </span>
                                  );
                                }
                                return (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px] flex items-center justify-center shrink-0 border border-indigo-200 shadow-2xs">
                                      {sup.label.charAt(0)}
                                    </div>
                                    <span className="font-medium text-slate-800 text-xs sm:text-[12.5px] truncate max-w-[130px]" title={sup.label}>
                                      {sup.label}
                                    </span>
                                  </div>
                                );
                              })()}
                            </td>
                          )}

                          {/* Compensation */}
                          {visibleColumns.salary && (
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
                              <span className="font-semibold text-slate-900 text-xs sm:text-[12.5px]">
                                {isSalaryMasked ? (
                                  <span className="inline-flex items-center gap-1 font-mono text-slate-500 font-bold tracking-widest text-[11px] bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 select-none">
                                    <i className="bi bi-shield-lock-fill text-[10px] text-slate-400"></i>
                                    ••••••
                                  </span>
                                ) : (
                                  `$${Number(u.salary || 0).toLocaleString()}`
                                )}
                              </span>
                            </td>
                          )}

                          {/* Contact */}
                          {visibleColumns.phone && (
                            <td className="px-3.5 py-2.5 whitespace-nowrap text-xs text-slate-700" onClick={(e) => e.stopPropagation()}>
                              {u.phone ? (
                                <a
                                  href={`tel:${u.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-medium text-slate-800 hover:text-indigo-600 hover:underline text-xs sm:text-[12.5px] inline-flex items-center gap-1.5 group/phone"
                                  title={`Direct Call ${u.phone}`}
                                >
                                  <i className="bi bi-telephone text-slate-400 group-hover/phone:text-indigo-600 text-[11px]"></i>
                                  <span>{u.phone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          )}

                          {/* Status */}
                          {visibleColumns.status && (
                            <td className="px-3.5 py-2.5 whitespace-nowrap">
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
                          )}

                          {/* Actions (Centered Matching Option 2) */}
                          <td className={`px-4 py-2.5 text-center whitespace-nowrap ${isMenuActive ? "relative z-40" : ""}`}>
                            <div className="relative inline-flex items-center justify-center action-menu-container">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId((prev) => (prev === u.id ? null : u.id));
                                }}
                                className={`w-7.5 h-7.5 rounded-lg border transition-all inline-flex items-center justify-center cursor-pointer ${
                                  isMenuActive
                                    ? "bg-slate-100 text-slate-800 border-slate-300 shadow-2xs"
                                    : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 shadow-2xs"
                                }`}
                                title="User Actions"
                              >
                                <i className="bi bi-three-dots text-xs"></i>
                              </button>

                              {isMenuActive && (
                                <div
                                  className={`absolute right-0 ${
                                    isNearBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                                  } w-44 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleOpenProfile(u.id);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
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
                                    className="w-full px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-pencil-square text-slate-400"></i>
                                    <span>Edit Details</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setIsSelectMode(true);
                                      if (!selectedUserIds.includes(u.id)) {
                                        setSelectedUserIds((prev) => [...prev, u.id]);
                                      }
                                    }}
                                    className="w-full px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-check2-square text-indigo-500"></i>
                                    <span>Select Member</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserStatus(u)}
                                    className={`w-full px-2.5 py-1.5 text-[11px] rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                                      u.status === "active"
                                        ? "text-amber-700 hover:bg-amber-50"
                                        : "text-emerald-700 hover:bg-emerald-50"
                                    }`}
                                  >
                                    <i className={`bi ${u.status === "active" ? "bi-slash-circle text-amber-500" : "bi-check-circle text-emerald-500"}`}></i>
                                    <span>{u.status === "active" ? "Suspend Account" : "Reactivate Account"}</span>
                                  </button>
                                  <div className="h-px bg-slate-100 my-1"></div>
                                  <button
                                    type="button"
                                    disabled={deletingId === u.id}
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      handleRequestDelete(u);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
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
          ) : (
            <div className="p-3.5 sm:p-4 min-h-[340px] bg-slate-50/50">
              {loading ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Loading workforce directory...</span>
                  </div>
                </div>
              ) : displayedUsers.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2.5 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 text-xl shadow-xs">
                      <i className="bi bi-people"></i>
                    </div>
                    <p className="font-bold text-slate-800 text-sm mb-0">No workforce personnel found</p>
                    <p className="text-[11px] text-slate-500 leading-normal mb-1">
                      {activeFilterCount > 0 || selectedRole
                        ? "No team members matched your active filters or search terms."
                        : "Your workforce directory is currently empty. Onboard new members to get started."}
                    </p>
                    {(activeFilterCount > 0 || selectedRole) && (
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer mt-1"
                      >
                        <i className="bi bi-arrow-counterclockwise text-xs"></i>
                        <span>Clear All Filters & Search</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {paginatedUsers.map((u) => {
                    const isCurrentUser = currentUser?.id === u.id || currentUser?.email === u.email;
                    const deptInfo = getDepartmentIcon(u.department_name);
                    const sup = getSupervisorInfo(u);
                    const isSelected = selectedUserIds.includes(u.id);
                    const isMenuActive = activeActionMenuId === u.id;

                    return (
                      <div
                        key={u.id}
                        onClick={() => handleOpenProfile(u.id)}
                        className={`bg-white rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between group cursor-pointer relative shadow-2xs hover:shadow-md ${
                          isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/15"
                            : "border-slate-200/90 hover:border-indigo-300"
                        } ${isMenuActive ? "z-30" : "z-0"}`}
                      >
                        {/* Card Top: Checkbox, Status & Action Menu */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {showCheckboxes && (
                              <input
                                type="checkbox"
                                aria-label={`Select ${u.name}`}
                                checked={isSelected}
                                onChange={() => handleToggleSelectUser(u.id)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer accent-indigo-600"
                              />
                            )}
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
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
                          </div>

                          {/* 3-dots action in card */}
                          <div
                            className="relative inline-flex items-center justify-center action-menu-container"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveActionMenuId((prev) => (prev === u.id ? null : u.id))}
                              className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shadow-2xs"
                              title="Actions"
                            >
                              <i className="bi bi-three-dots text-xs"></i>
                            </button>
                            {activeActionMenuId === u.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleOpenProfile(u.id);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
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
                                  className="w-full px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <i className="bi bi-pencil-square text-slate-400"></i>
                                  <span>Edit Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    setIsSelectMode(true);
                                    if (!selectedUserIds.includes(u.id)) {
                                      setSelectedUserIds((prev) => [...prev, u.id]);
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  <i className="bi bi-check2-square text-indigo-500"></i>
                                  <span>Select Member</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u)}
                                  className={`w-full px-2.5 py-1.5 text-[11px] rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
                                    u.status === "active"
                                      ? "text-amber-700 hover:bg-amber-50"
                                      : "text-emerald-700 hover:bg-emerald-50"
                                  }`}
                                >
                                  <i className={`bi ${u.status === "active" ? "bi-slash-circle text-amber-500" : "bi-check-circle text-emerald-500"}`}></i>
                                  <span>{u.status === "active" ? "Suspend Account" : "Reactivate Account"}</span>
                                </button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button
                                  type="button"
                                  disabled={deletingId === u.id}
                                  onClick={() => {
                                    setActiveActionMenuId(null);
                                    handleRequestDelete(u);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <i className="bi bi-person-x text-rose-500"></i>
                                  <span>Offboard Member</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Profile Info: Avatar, Name, Role */}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 font-bold text-base flex items-center justify-center border border-slate-200/90 shadow-2xs overflow-hidden ring-1 ring-slate-200/60 group-hover:ring-indigo-400 transition-all">
                              {u.image_url ? (
                                <img src={u.image_url} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{u.name ? u.name.charAt(0) : "U"}</span>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm leading-tight truncate mb-0">
                                {u.name}
                              </h4>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                  You
                                </span>
                              )}
                              {Boolean(u.is_hod) && !isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-extrabold uppercase bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                                  👑 HOD
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                              {getRoleBadge(u)}
                            </div>
                          </div>
                        </div>

                        {/* Meta Rows: Department, Reports To, Salary */}
                        <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <i className={`bi ${deptInfo.icon} ${deptInfo.color} text-xs`}></i>
                              <span>Department</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-xs truncate max-w-[130px]">
                              {u.department_name || "Unassigned"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <i className="bi bi-diagram-2 text-indigo-500 text-xs"></i>
                              <span>Reports To</span>
                            </span>
                            <span className="font-semibold text-slate-800 text-xs truncate max-w-[130px]">
                              {sup.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <i className="bi bi-cash-stack text-emerald-500 text-xs"></i>
                              <span>Salary</span>
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {isSalaryMasked ? (
                                <span className="inline-flex items-center gap-1 font-mono text-slate-500 font-bold tracking-widest text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 select-none">
                                  <i className="bi bi-shield-lock-fill text-[9.5px] text-slate-400"></i>
                                  ••••••
                                </span>
                              ) : (
                                <>
                                  ${Number(u.salary || 0).toLocaleString()}
                                  <span className="text-[10px] text-slate-400 font-normal">/yr</span>
                                </>
                              )}
                            </span>
                          </div>
                          {u.created_at && (
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <i className="bi bi-calendar3 text-indigo-400 text-xs"></i>
                                <span>Tenure</span>
                              </span>
                              <span
                                className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-600"
                                title={`Joined ${new Date(u.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`}
                              >
                                <i className="bi bi-clock-history text-[9px] text-slate-400"></i>
                                {formatTenure(u.created_at)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Contact Row: 1-click email copy & 1-click phone call */}
                        <div className="mt-2.5 pt-1 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(u.email, u.id)}
                            className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer truncate flex-1 justify-center ${
                              copiedEmailId === u.id
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold"
                                : "bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/80"
                            }`}
                            title="Copy Email"
                          >
                            <i className={`bi ${copiedEmailId === u.id ? "bi-check2 text-emerald-600 font-bold" : "bi-envelope"} text-xs shrink-0`}></i>
                            <span className="truncate">{copiedEmailId === u.id ? "Copied!" : u.email}</span>
                          </button>

                          {u.phone ? (
                            <a
                              href={`tel:${u.phone}`}
                              className="h-7 px-2.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/80 transition-all flex items-center gap-1.5 shrink-0"
                              title={`Call ${u.phone}`}
                            >
                              <i className="bi bi-telephone text-emerald-600 text-xs"></i>
                              <span className="hidden sm:inline">Call</span>
                            </a>
                          ) : null}
                        </div>

                        {/* Quick Action Footer */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenProfile(u.id)}
                            className="flex-1 h-7.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <i className="bi bi-person-badge text-xs"></i>
                            <span>View Dossier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="h-7.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            title="Edit Details"
                          >
                            <i className="bi bi-pencil-square text-xs text-slate-500"></i>
                            <span>Edit</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

            {/* Bottom Pagination Bar */}
            <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Left Counter */}
              <div className="text-slate-600 font-medium">
                Showing <span className="font-semibold text-slate-900">{displayedUsers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, displayedUsers.length)}</span> of{" "}
                <span className="font-semibold text-slate-900">{displayedUsers.length}</span> users
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-1.5">
                {/* Previous Page Button */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="w-7.5 h-7.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer text-xs"
                  title="Previous Page"
                >
                  <i className="bi bi-chevron-left text-[11px]"></i>
                </button>

                {/* Page Navigation Pills */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-7.5 h-7.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center ${
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
                  className="w-7.5 h-7.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer text-xs"
                  title="Next Page"
                >
                  <i className="bi bi-chevron-right text-[11px]"></i>
                </button>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1 ml-1.5">
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 font-medium outline-none cursor-pointer hover:border-slate-300"
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

        {/* Right Column: Workforce Analytics Sidebar with Smooth Slide-in & Slide-out */}
        <div
          className={`transition-all duration-300 ease-in-out shrink-0 xl:h-full overflow-hidden ${
            isSidebarOpen
              ? "w-full xl:w-[350px] opacity-100 xl:translate-x-0 mt-3.5 xl:mt-0 xl:ml-3.5 pointer-events-auto"
              : "w-0 xl:w-0 opacity-0 xl:translate-x-8 mt-0 xl:mt-0 xl:ml-0 pointer-events-none"
          }`}
        >
          <div className="w-full xl:w-[350px] xl:min-w-[350px] xl:max-w-[350px] min-w-0 xl:h-full xl:overflow-y-auto xl:overflow-x-hidden space-y-3 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 pb-2">
            <WorkforceAnalyticsSidebar
              allUsers={allUsers}
              departments={departments}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
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

      {/* Floating Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div
          className="fixed bottom-6 -translate-x-1/2 z-[1050] floating-action-bar-anim max-w-[calc(100vw-280px)]"
          style={{ left: "calc(50% + 120px)" }}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 text-white rounded-2xl shadow-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 flex items-center gap-2 sm:gap-3.5 ring-1 ring-white/10">
            {/* Selected Counter Pill */}
            <div className="flex items-center gap-2 pr-1.5 sm:pr-3 border-r border-slate-700/80 shrink-0">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {selectedUserIds.length} <span className="hidden sm:inline">Selected</span>
              </span>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Activate */}
              <button
                type="button"
                disabled={isBulkOperating}
                onClick={handleBulkActivate}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                title="Activate Selected Accounts"
              >
                <i className="bi bi-check-circle text-emerald-400 text-xs"></i>
                <span className="hidden md:inline">Activate</span>
              </button>

              {/* Suspend */}
              <button
                type="button"
                disabled={isBulkOperating}
                onClick={handleBulkDeactivate}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                title="Suspend Selected Accounts"
              >
                <i className="bi bi-slash-circle text-amber-400 text-xs"></i>
                <span className="hidden md:inline">Suspend</span>
              </button>

              {/* Transfer Department Dropdown */}
              <div className="relative bulk-transfer-container">
                <button
                  type="button"
                  disabled={isBulkOperating}
                  onClick={() => setIsBulkTransferOpen(!isBulkTransferOpen)}
                  className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  title="Move Selected to Department"
                >
                  <i className="bi bi-building text-indigo-300 text-xs"></i>
                  <span className="hidden md:inline">Transfer Dept</span>
                  <i className={`bi bi-chevron-up text-[10px] transition-transform ${isBulkTransferOpen ? "rotate-180" : ""}`}></i>
                </button>

                {isBulkTransferOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-slate-900 border border-indigo-500/40 rounded-xl shadow-2xl p-2 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[11px] font-bold text-slate-300 px-2 py-1 mb-1">
                      Select Destination Department:
                    </div>
                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                      {departments.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleBulkDepartmentTransfer(d.id)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-indigo-600/50 text-slate-200 hover:text-white transition-colors truncate cursor-pointer"
                        >
                          {d.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Export Selected */}
              <button
                type="button"
                disabled={isBulkOperating}
                onClick={handleBulkExportCSV}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                title="Export Selected Members as CSV"
              >
                <i className="bi bi-download text-indigo-300 text-xs"></i>
                <span className="hidden md:inline">Export</span>
              </button>

              {/* Offboard Bulk */}
              <button
                type="button"
                disabled={isBulkOperating}
                onClick={() => setIsBulkOffboardConfirmOpen(true)}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                title="Offboard Selected Members"
              >
                <i className="bi bi-trash3 text-rose-400 text-xs"></i>
                <span className="hidden md:inline">Offboard</span>
              </button>
            </div>

            {/* Clear Selection / Close */}
            <button
              type="button"
              onClick={() => {
                setSelectedUserIds([]);
                setIsSelectMode(false);
              }}
              className="w-7 h-7 ml-0.5 sm:ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-xs shrink-0"
              title="Deselect All & Exit Multi-Select"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Bulk Offboard Confirmation Modal */}
      {isBulkOffboardConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 text-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-lg shrink-0">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">Confirm Bulk Offboarding</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to offboard all <span className="font-bold text-rose-700">{selectedUserIds.length}</span> selected personnel? Their active sessions and assignments will be terminated immediately.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isBulkOperating}
                onClick={() => setIsBulkOffboardConfirmOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkOperating}
                onClick={handleBulkOffboardConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isBulkOperating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Offboarding...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash3"></i>
                    <span>Confirm Offboard ({selectedUserIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onSuccess={() => {
          fetchUsers();
          setMsg({ type: "success", text: "Workforce directory updated successfully from bulk CSV import." });
        }}
        departments={departments}
      />
    </div>
  );
};

export default UserManagement;
