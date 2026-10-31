import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/axios";
import {
  HierarchyHeader,
  HierarchyKPIStats,
  OrphanedStaffBanner,
  HierarchyFilters,
  HierarchyTableView,
  HierarchyOrgChartView,
  HierarchySquadCardsView,
  AssignHierarchyModal,
  ReassignConfirmModal,
  UnlinkConfirmModal,
  HierarchyExportModal,
  HierarchyPrintModal,
  BatchOnboardModal,
  HierarchyAuditModal,
  AutoAssignWizardModal,
  SquadBroadcastModal,
  SupervisorDelegationModal,
  SupervisorCapacityDrawer,
  MatrixAssignModal,
  ReorgSimulationReviewModal,
  StagedReorgChange,
  HierarchyEmployeeDossierModal,
  SwapReportingConfirmModal,
} from "../../Components/admin/hierarchy";

const HierarchyMapping = () => {
  const [hierarchy, setHierarchy] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAutoAssignWizardOpen, setIsAutoAssignWizardOpen] = useState(false);
  const [broadcastSquadTarget, setBroadcastSquadTarget] = useState<any | null>(null);
  const [delegationTargetSupervisor, setDelegationTargetSupervisor] = useState<any | null>(null);
  const [capacityDrawerSquad, setCapacityDrawerSquad] = useState<any | null>(null);
  const [matrixReports, setMatrixReports] = useState<any[]>([]);
  const [matrixAssignTargetEmployee, setMatrixAssignTargetEmployee] = useState<any | null>(null);
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [stagedChanges, setStagedChanges] = useState<StagedReorgChange[]>([]);
  const [isSimulationReviewOpen, setIsSimulationReviewOpen] = useState<boolean>(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedDossierEmployee, setSelectedDossierEmployee] = useState<any | null>(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "tree" | "squad">("table");
  const [activeKpiFilter, setActiveKpiFilter] = useState<"mapped" | "leads" | "managers" | "orphaned" | null>(null);
  const [isPreviewEmptyState, setIsPreviewEmptyState] = useState(false);

  const unassignedEmployees = useMemo(
    () => employees.filter((e: any) => !hierarchy.some((h: any) => String(h.employee_id) === String(e.id))),
    [employees, hierarchy]
  );
  const unassignedCount = unassignedEmployees.length;
  const uniqueSupervisorsCount = useMemo(() => new Set(hierarchy.map((h: any) => h.supervisor_id)).size, [hierarchy]);
  const uniqueManagersCount = useMemo(() => new Set(hierarchy.map((h: any) => h.manager_id)).size, [hierarchy]);

  const departments = useMemo(
    () => Array.from(new Set(hierarchy.map((h: any) => h.department_name).filter(Boolean))) as string[],
    [hierarchy]
  );

  // Bulk Square Select State (matching User Directory)
  const [selectedStaffIds, setSelectedStaffIds] = useState<(string | number)[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);

  const showCheckboxes = isSelectMode || selectedStaffIds.length > 0;

  const handleToggleSelectMode = () => {
    if (showCheckboxes) {
      setIsSelectMode(false);
      setSelectedStaffIds([]);
    } else {
      setIsSelectMode(true);
    }
  };

  const handleToggleSelectStaff = (id: string | number) => {
    setSelectedStaffIds((prev) => {
      const idStr = String(id);
      const exists = prev.some((item) => String(item) === idStr);
      if (exists) {
        return prev.filter((item) => String(item) !== idStr);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllStaff = (ids: (string | number)[]) => {
    setSelectedStaffIds((prev) => {
      const prevStr = new Set(prev.map(String));
      const allIn = ids.every((id) => prevStr.has(String(id)));
      if (allIn) {
        return prev.filter((id) => !ids.map(String).includes(String(id)));
      } else {
        const merged = new Set([...prev.map(String), ...ids.map(String)]);
        return Array.from(merged);
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedStaffIds([]);
    setIsSelectMode(false);
  };

  const handleBulkExportSelectedCSV = () => {
    if (selectedStaffIds.length === 0) return;
    const selectedSet = new Set(selectedStaffIds.map(String));
    const selectedMapped = hierarchy.filter((h: any) => selectedSet.has(String(h.employee_id)));
    const selectedUnassigned = unassignedEmployees.filter((u: any) => selectedSet.has(String(u.id)));

    const headers = ["Employee ID", "Employee Name", "Email", "Department", "Team Lead", "Reporting Manager", "Status"];
    const rows = [
      ...selectedMapped.map((m: any) => [
        `EMP-${String(m.employee_id).padStart(4, "0")}`,
        `"${m.employee_name || ""}"`,
        m.employee_email || "",
        `"${m.department_name || "General"}"`,
        `"${m.supervisor_name || ""}"`,
        `"${m.manager_name || ""}"`,
        "Mapped",
      ]),
      ...selectedUnassigned.map((u: any) => [
        `EMP-${String(u.id).padStart(4, "0")}`,
        `"${u.name || ""}"`,
        u.email || "",
        `"${u.department_name || "General"}"`,
        "Unassigned",
        "Unassigned",
        "Unassigned",
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `selected_staff_hierarchy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [form, setForm] = useState({
    employee_id: "",
    supervisor_id: "",
    manager_id: "",
  });
  const [saving, setSaving] = useState(false);

  // Quick Reallocation / Drag-and-Drop State
  const [reassignState, setReassignState] = useState<{
    isOpen: boolean;
    employee: any | null;
    targetSupervisor: any | null;
    targetManager: any | null;
  }>({
    isOpen: false,
    employee: null,
    targetSupervisor: null,
    targetManager: null,
  });

  // Unlink State
  const [unlinkState, setUnlinkState] = useState<{
    isOpen: boolean;
    employee: any | null;
  }>({
    isOpen: false,
    employee: null,
  });

  // Swap Reporting State
  const [swapState, setSwapState] = useState<{
    isOpen: boolean;
    employee1: any | null;
    employee2: any | null;
  }>({
    isOpen: false,
    employee1: null,
    employee2: null,
  });

  // Batch Onboarding State
  const [batchModalState, setBatchModalState] = useState<{
    isOpen: boolean;
    candidates: any[];
    targetSquad: any | null;
  }>({
    isOpen: false,
    candidates: [],
    targetSquad: null,
  });

  const handleToggleKpiCard = (key: "mapped" | "leads" | "managers" | "orphaned") => {
    setActiveKpiFilter((prev) => {
      if (prev === key) {
        setStatusFilter("all");
        return null;
      }
      if (key === "mapped") {
        setStatusFilter("assigned");
      } else if (key === "orphaned") {
        setStatusFilter("unassigned");
      } else {
        setStatusFilter("all");
      }
      return key;
    });
  };

  const filteredHierarchy = hierarchy.filter((h) => {
    // Hide mapped relationships if orphaned/unassigned filter is active
    if (activeKpiFilter === "orphaned" || statusFilter === "unassigned") {
      return false;
    }
    if (selectedDepartment !== "all" && h.department_name !== selectedDepartment) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchEmp =
        h.employee_name?.toLowerCase().includes(q) ||
        h.employee_email?.toLowerCase().includes(q);
      const matchSup = h.supervisor_name?.toLowerCase().includes(q);
      const matchMgr = h.manager_name?.toLowerCase().includes(q);
      const matchDept = h.department_name?.toLowerCase().includes(q);
      if (!matchEmp && !matchSup && !matchMgr && !matchDept) return false;
    }
    if (activeKpiFilter === "leads") {
      if (!h.supervisor_id || !h.supervisor_name) return false;
    }
    if (activeKpiFilter === "managers") {
      if (!h.manager_id || !h.manager_name) return false;
    }
    return true;
  });

  const filteredUnassigned = unassignedEmployees.filter((u: any) => {
    // Hide unassigned staff if mapped, leads, or managers filter is active
    if (
      activeKpiFilter === "mapped" ||
      activeKpiFilter === "leads" ||
      activeKpiFilter === "managers" ||
      statusFilter === "assigned"
    ) {
      return false;
    }
    if (selectedDepartment !== "all" && u.department_name && u.department_name !== selectedDepartment) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchEmp = u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchDept = u.department_name?.toLowerCase().includes(q);
      if (!matchEmp && !matchDept) return false;
    }
    return true;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hRes, uRes, secRes, projRes] = await Promise.all([
        api.get("/api/admin/hierarchy"),
        api.get("/api/admin/users"),
        api.get("/api/admin/hierarchy/secondary").catch(() => ({ data: { status: false, data: [] } })),
        api.get("/api/admin/projects").catch(() => ({ data: { status: false, projects: [] } })),
      ]);

      if (hRes.data.status) setHierarchy(hRes.data.hierarchy);
      if (uRes.data.status) {
        const all = uRes.data.users;
        setEmployees(all.filter((u) => u.role === "employee"));
        setSupervisors(all.filter((u) => u.role === "supervisor"));
        setManagers(all.filter((u) => u.role === "manager"));
      }
      if (secRes.data?.status && Array.isArray(secRes.data.data)) {
        setMatrixReports(secRes.data.data);
      }
      if (projRes.data?.status && Array.isArray(projRes.data.projects)) {
        setProjects(projRes.data.projects);
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load team hierarchy" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-dismiss alert notification after 4 seconds
  useEffect(() => {
    if (!msg.text) return;
    const timer = setTimeout(() => {
      setMsg({ type: "", text: "" });
    }, 4000);
    return () => clearTimeout(timer);
  }, [msg.text]);

  const [modalError, setModalError] = useState("");

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.supervisor_id || !form.manager_id) {
      setModalError("Please select Employee, Supervisor, and Manager.");
      return;
    }

    try {
      setSaving(true);
      setModalError("");
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/admin/hierarchy", form);
      if (res.data.status) {
        setMsg({ type: "success", text: "Team assignment successfully updated!" });
        setShowModal(false);
        setForm({ employee_id: "", supervisor_id: "", manager_id: "" });
        setModalError("");
        fetchData();
      }
    } catch (err: any) {
      const errText = err.response?.data?.error || "Failed to assign team hierarchy";
      setModalError(errText);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSupervisorCapacity = async (supervisorId: string | number, maxCapacity: number) => {
    try {
      const res = await api.put("/api/admin/hierarchy/supervisor-capacity", {
        supervisor_id: supervisorId,
        max_span_capacity: maxCapacity,
      });
      if (res.data.status) {
        setMsg({ type: "success", text: res.data.message || `Supervisor capacity updated to ${maxCapacity} reports!` });
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to update supervisor capacity",
      });
    }
  };

  const handleOpenDelegation = (squadOrLead: any) => {
    const supervisorId = squadOrLead.supervisorId || squadOrLead.supervisor_id || squadOrLead.id;
    const supervisorName = squadOrLead.supervisorName || squadOrLead.supervisor_name || squadOrLead.name;
    const departmentName = squadOrLead.departmentName || squadOrLead.department_name;
    const memberCount = squadOrLead.members ? squadOrLead.members.length : undefined;

    const sampleRecord = hierarchy.find((h: any) => String(h.supervisor_id) === String(supervisorId));

    setDelegationTargetSupervisor({
      id: supervisorId,
      name: supervisorName,
      email: squadOrLead.supervisorEmail || squadOrLead.email || sampleRecord?.supervisor_email,
      department_name: departmentName,
      memberCount,
      acting_supervisor_id: squadOrLead.actingSupervisorId || sampleRecord?.acting_supervisor_id,
      acting_supervisor_name: squadOrLead.actingSupervisorName || sampleRecord?.acting_supervisor_name,
      delegation_start_date: squadOrLead.delegationStartDate || sampleRecord?.delegation_start_date,
      delegation_end_date: squadOrLead.delegationEndDate || sampleRecord?.delegation_end_date,
      delegation_reason: squadOrLead.delegationReason || sampleRecord?.delegation_reason,
    });
  };

  const handleConfirmReassign = async (payload: {
    employee_id: string | number;
    supervisor_id: string | number;
    manager_id?: string | number;
    sync_department?: boolean;
  }) => {
    if (isSimulationMode) {
      const emp = reassignState.employee;
      const targetSup = (supervisors as any[]).find((s) => String(s.id) === String(payload.supervisor_id)) || reassignState.targetSupervisor;

      const newStaged: StagedReorgChange = {
        employee_id: payload.employee_id,
        employee_name: emp?.employee_name || emp?.name || `Employee #${payload.employee_id}`,
        employee_email: emp?.employee_email || emp?.email,
        employee_department: emp?.department_name || emp?.department,
        current_supervisor_id: emp?.supervisor_id,
        current_supervisor_name: emp?.supervisor_name,
        target_supervisor_id: payload.supervisor_id,
        target_supervisor_name: targetSup?.name || `Supervisor #${payload.supervisor_id}`,
        target_supervisor_department: targetSup?.department_name || targetSup?.department,
        sync_department: payload.sync_department ?? true,
      };

      setStagedChanges((prev) => {
        const filtered = prev.filter((c) => String(c.employee_id) !== String(payload.employee_id));
        return [...filtered, newStaged];
      });

      setReassignState({ isOpen: false, employee: null, targetSupervisor: null, targetManager: null });
      setMsg({
        type: "success",
        text: `Staged reassignment for ${newStaged.employee_name} to ${newStaged.target_supervisor_name} in simulation sandbox!`,
      });
      return;
    }

    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.put("/api/admin/hierarchy/reassign", payload);
      if (res.data.status) {
        setMsg({ type: "success", text: res.data.message || "Reporting line successfully reallocated!" });
        setReassignState({ isOpen: false, employee: null, targetSupervisor: null, targetManager: null });
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to reassign reporting line",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmUnlink = async (employeeId: string | number) => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.delete(`/api/admin/hierarchy/${employeeId}`);
      if (res.data.status) {
        setMsg({ type: "success", text: "Reporting relationship severed successfully." });
        setUnlinkState({ isOpen: false, employee: null });
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to unlink reporting relationship",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSwap = async (emp1Id: string | number, emp2Id: string | number) => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/admin/hierarchy/swap", {
        employeeId1: emp1Id,
        employeeId2: emp2Id,
      });
      if (res.data.status) {
        setMsg({ type: "success", text: res.data.message || "Reporting lines swapped successfully!" });
        setSwapState({ isOpen: false, employee1: null, employee2: null });
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to swap reporting lines",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmBatch = async (payload: {
    employee_ids: (string | number)[];
    supervisor_id: string | number;
    manager_id: string | number;
  }) => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/admin/hierarchy/bulk-assign", payload);
      if (res.data.status) {
        setMsg({ type: "success", text: res.data.message || "Batch onboarding completed successfully!" });
        setBatchModalState({ isOpen: false, candidates: [], targetSquad: null });
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to execute batch onboarding",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteAutoAssign = async (
    assignments: { employee_id: string | number; supervisor_id: string | number; manager_id: string | number }[]
  ) => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });

      const grouped = new Map<
        string,
        { supervisor_id: string | number; manager_id: string | number; empIds: (string | number)[] }
      >();

      assignments.forEach((a) => {
        const key = `${a.supervisor_id}_${a.manager_id}`;
        if (!grouped.has(key)) {
          grouped.set(key, { supervisor_id: a.supervisor_id, manager_id: a.manager_id, empIds: [] });
        }
        grouped.get(key)!.empIds.push(a.employee_id);
      });

      for (const grp of grouped.values()) {
        await api.post("/api/admin/hierarchy/bulk-assign", {
          employee_ids: grp.empIds,
          supervisor_id: grp.supervisor_id,
          manager_id: grp.manager_id,
        });
      }

      setMsg({
        type: "success",
        text: `Successfully auto-allocated ${assignments.length} staff members to balanced department squads!`,
      });
      setIsAutoAssignWizardOpen(false);
      fetchData();
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to execute auto-assignment wizard",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBatchUnlink = async (employeeIds: (string | number)[]) => {
    if (!employeeIds.length) return;
    if (!window.confirm(`Are you sure you want to unlink ${employeeIds.length} employees from their reporting lines?`)) return;
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      await Promise.all(employeeIds.map((id) => api.delete(`/api/admin/hierarchy/${id}`)));
      setMsg({ type: "success", text: `Successfully unlinked ${employeeIds.length} staff members.` });
      fetchData();
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to unlink reporting lines",
      });
    } finally {
      setSaving(false);
    }
  };
  const handleApplyReorgPlan = async (changes: StagedReorgChange[], reason: string) => {
    const payload = {
      changes: changes.map((c) => ({
        employee_id: c.employee_id,
        supervisor_id: c.target_supervisor_id,
        sync_department: c.sync_department,
      })),
      reason,
    };

    const res = await api.post("/api/admin/hierarchy/apply-reorg-plan", payload);
    if (res.data?.status) {
      setMsg({ type: "success", text: res.data.message || "Reorganization plan published successfully!" });
      setStagedChanges([]);
      setIsSimulationMode(false);
      fetchData();
    } else {
      throw new Error(res.data?.error || "Failed to apply reorganization plan");
    }
  };

  const handleUnlinkSecondary = async (secondaryId: string | number) => {
    if (!window.confirm("Are you sure you want to remove this dotted-line reporting link?")) return;
    try {
      const res = await api.delete(`/api/admin/hierarchy/secondary/${secondaryId}`);
      if (res.data?.status) {
        setMsg({ type: "success", text: "Dotted-line reporting link removed successfully" });
        fetchData();
      } else {
        setMsg({ type: "danger", text: res.data?.error || "Failed to remove dotted-line reporting link" });
      }
    } catch (err: any) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to remove dotted-line link" });
    }
  };



  return (
    <div className="w-full space-y-3 sm:space-y-3.5">
      {/* Alert Notification */}
        {msg.text && (
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in ${
              msg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <i
                className={`bi ${
                  msg.type === "success"
                    ? "bi-check-circle-fill text-emerald-500"
                    : "bi-exclamation-triangle-fill text-rose-500"
                } text-base`}
              ></i>
              <span className="font-medium">{msg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMsg({ type: "", text: "" })}
              className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        )}

        {/* Modern Executive Header with View Mode Switcher */}
        <HierarchyHeader
          totalCount={hierarchy.length}
          onOpenAssignModal={() => {
            setForm({ employee_id: "", supervisor_id: "", manager_id: "" });
            setModalError("");
            setShowModal(true);
          }}
          onRefresh={fetchData}
          isRefreshing={loading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onPrint={() => setIsPrintModalOpen(true)}
          onOpenAuditModal={() => setIsAuditModalOpen(true)}
          onOpenAutoAssignWizard={() => setIsAutoAssignWizardOpen(true)}
          isSimulationMode={isSimulationMode}
          onToggleSimulationMode={() => setIsSimulationMode((prev) => !prev)}
          stagedChangesCount={stagedChanges.length}
          onOpenSimulationReview={() => setIsSimulationReviewOpen(true)}
        />

        {/* KPI Stats Grid */}
        <HierarchyKPIStats
          totalMapped={hierarchy.length}
          totalSupervisors={uniqueSupervisorsCount}
          totalManagers={uniqueManagersCount}
          unassignedCount={unassignedCount}
          onFilterMapped={() => handleToggleKpiCard("mapped")}
          isMappedFilterActive={activeKpiFilter === "mapped"}
          onFilterLeads={() => handleToggleKpiCard("leads")}
          isLeadsFilterActive={activeKpiFilter === "leads"}
          onFilterManagers={() => handleToggleKpiCard("managers")}
          isManagersFilterActive={activeKpiFilter === "managers"}
          onFilterUnassigned={() => handleToggleKpiCard("orphaned")}
          isUnassignedFilterActive={activeKpiFilter === "orphaned"}
        />

        {/* Orphaned Staff Alert Banner */}
        <OrphanedStaffBanner
          unassignedCount={unassignedCount}
          onQuickAssign={() => {
            setForm({ employee_id: "", supervisor_id: "", manager_id: "" });
            setModalError("");
            setShowModal(true);
          }}
          onFilterUnassigned={() => handleToggleKpiCard("orphaned")}
          isFilterActive={activeKpiFilter === "orphaned"}
          onOpenAutoAssignWizard={() => setIsAutoAssignWizardOpen(true)}
        />

        {/* Filter and Search Bar */}
        <HierarchyFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          departments={departments}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => {
            setStatusFilter(val);
            if (val === "assigned") {
              setActiveKpiFilter("mapped");
            } else if (val === "unassigned") {
              setActiveKpiFilter("orphaned");
            } else {
              setActiveKpiFilter(null);
            }
          }}
          activeKpiFilter={activeKpiFilter}
          unassignedCount={unassignedCount}
          totalFiltered={
            activeKpiFilter === "leads"
              ? uniqueSupervisorsCount
              : activeKpiFilter === "managers"
              ? uniqueManagersCount
              : filteredHierarchy.length +
                (activeKpiFilter === "orphaned" || statusFilter === "unassigned" || statusFilter === "all"
                  ? filteredUnassigned.length
                  : 0)
          }
          totalCount={hierarchy.length + unassignedCount}
          onResetFilters={() => {
            setSearchTerm("");
            setSelectedDepartment("all");
            setStatusFilter("all");
            setActiveKpiFilter(null);
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onPrint={() => setIsPrintModalOpen(true)}
          isPreviewEmptyState={isPreviewEmptyState}
          onTogglePreviewEmptyState={() => setIsPreviewEmptyState((prev) => !prev)}
          isSelectMode={isSelectMode}
          onToggleSelectMode={handleToggleSelectMode}
          selectedCount={selectedStaffIds.length}
        />

        {/* Dynamic View Rendering: Org Chart Tree vs Table View */}
        {viewMode === "tree" ? (
          <HierarchyOrgChartView
            matrixReports={matrixReports}
            mappings={filteredHierarchy}
            unassignedStaff={filteredUnassigned}
            searchTerm={searchTerm}
            isSelectMode={isSelectMode}
            selectedStaffIds={selectedStaffIds}
            onToggleSelectStaff={handleToggleSelectStaff}
            onOpenAssignModal={(empId) => {
              setModalError("");
              if (empId) {
                setForm((prev) => ({ ...prev, employee_id: String(empId) }));
              }
              setShowModal(true);
            }}
            onInitiateReassign={(emp) => {
              setReassignState({
                isOpen: true,
                employee: emp,
                targetSupervisor: null,
                targetManager: null,
              });
            }}
            onInitiateUnlink={(emp) => {
              setUnlinkState({
                isOpen: true,
                employee: emp,
              });
            }}
            onReassignDrop={(payload) => {
              setReassignState({
                isOpen: true,
                employee: payload.employee,
                targetSupervisor: payload.targetSupervisor || null,
                targetManager: payload.targetManager || null,
              });
            }}
            onSwapDrop={(payload) => {
              setSwapState({
                isOpen: true,
                employee1: payload.employee1,
                employee2: payload.employee2,
              });
            }}
            onViewDossier={(emp) => setSelectedDossierEmployee(emp)}
            isPreviewEmptyState={isPreviewEmptyState}
            onExitSimulation={() => setIsPreviewEmptyState(false)}
          />
        ) : viewMode === "squad" ? (
          <HierarchySquadCardsView
            mappings={filteredHierarchy}
            unassignedStaff={selectedDepartment !== "all" ? unassignedEmployees.filter((u: any) => u.department_name === selectedDepartment) : unassignedEmployees}
            searchTerm={searchTerm}
            isSelectMode={isSelectMode}
            onToggleSelectMode={handleToggleSelectMode}
            selectedStaffIds={selectedStaffIds}
            onToggleSelectStaff={handleToggleSelectStaff}
            onClearSelection={handleClearSelection}
            onOpenAssignModal={(empId, supId, mgrId) => {
              setModalError("");
              if (empId) {
                setForm((prev) => ({ ...prev, employee_id: String(empId) }));
              }
              if (supId) {
                setForm((prev) => ({ ...prev, supervisor_id: String(supId) }));
              }
              if (mgrId) {
                setForm((prev) => ({ ...prev, manager_id: String(mgrId) }));
              }
              setShowModal(true);
            }}
            onInitiateReassign={(emp) => {
              setReassignState({
                isOpen: true,
                employee: emp,
                targetSupervisor: null,
                targetManager: null,
              });
            }}
            onInitiateUnlink={(emp) => {
              setUnlinkState({
                isOpen: true,
                employee: emp,
              });
            }}
            onOpenBatchModal={(candidates, targetSquad) => {
              setBatchModalState({
                isOpen: true,
                candidates,
                targetSquad: targetSquad || null,
              });
            }}
            onViewDossier={(emp) => setSelectedDossierEmployee(emp)}
            isPreviewEmptyState={isPreviewEmptyState}
            onExitSimulation={() => setIsPreviewEmptyState(false)}
          />
        ) : (
          <HierarchyTableView
            loading={loading}
            mappings={filteredHierarchy}
            unassignedStaff={filteredUnassigned}
            showUnassignedOnly={activeKpiFilter === "orphaned" || statusFilter === "unassigned"}
            statusFilter={statusFilter}
            activeKpiFilter={activeKpiFilter}
            isSelectMode={isSelectMode}
            onToggleSelectMode={handleToggleSelectMode}
            selectedStaffIds={selectedStaffIds}
            onToggleSelectStaff={handleToggleSelectStaff}
            onClearSelection={handleClearSelection}
            onSelectAllStaff={handleSelectAllStaff}
            onOpenAssignModal={(empId, supId, mgrId) => {
              setModalError("");
              setForm((prev) => ({
                ...prev,
                employee_id: empId ? String(empId) : prev.employee_id,
                supervisor_id: supId ? String(supId) : prev.supervisor_id,
                manager_id: mgrId ? String(mgrId) : prev.manager_id,
              }));
              setShowModal(true);
            }}
            onResetFilters={() => {
              setSearchTerm("");
              setSelectedDepartment("all");
              setStatusFilter("all");
              setActiveKpiFilter(null);
            }}
            onInitiateReassign={(emp) => {
              setReassignState({
                isOpen: true,
                employee: emp,
                targetSupervisor: null,
                targetManager: null,
              });
            }}
            onInitiateUnlink={(emp) => {
              setUnlinkState({
                isOpen: true,
                employee: emp,
              });
            }}
            onViewDossier={(emp) => setSelectedDossierEmployee(emp)}
            onOpenBatchModal={(candidates, targetSquad) => {
              setBatchModalState({
                isOpen: true,
                candidates,
                targetSquad: targetSquad || null,
              });
            }}
            onBatchUnlink={handleBatchUnlink}
            isPreviewEmptyState={isPreviewEmptyState}
            onExitSimulation={() => setIsPreviewEmptyState(false)}
            onBroadcastSquad={(squad: any) => setBroadcastSquadTarget(squad)}
            onDelegateLead={handleOpenDelegation}
            onUpdateSupervisorCapacity={handleUpdateSupervisorCapacity}
            onViewCapacity={(lead) => setCapacityDrawerSquad(lead)}
            matrixReports={matrixReports}
          />
        )}

      {/* Modern Assignment Modal */}
      <AssignHierarchyModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setForm({ employee_id: "", supervisor_id: "", manager_id: "" });
        }}
        form={form}
        onFormChange={setForm}
        onSubmit={handleAssign}
        employees={employees}
        supervisors={supervisors}
        managers={managers}
        mappings={hierarchy}
        saving={saving}
        errorMessage={modalError}
        onClearError={() => setModalError("")}
      />

      {/* Modern Reassignment Confirmation Modal */}
      <ReassignConfirmModal
        isOpen={reassignState.isOpen}
        onClose={() =>
          setReassignState({
            isOpen: false,
            employee: null,
            targetSupervisor: null,
            targetManager: null,
          })
        }
        employee={reassignState.employee}
        targetSupervisor={reassignState.targetSupervisor}
        targetManager={reassignState.targetManager}
        supervisors={supervisors}
        managers={managers}
        onConfirm={handleConfirmReassign}
        saving={saving}
      />

      {/* Modern Unlink Relationship Confirmation Modal */}
      <UnlinkConfirmModal
        isOpen={unlinkState.isOpen}
        onClose={() => setUnlinkState({ isOpen: false, employee: null })}
        employee={unlinkState.employee}
        onConfirm={handleConfirmUnlink}
        saving={saving}
      />

      {/* Modern Reporting Line Swap Confirmation Modal */}
      <SwapReportingConfirmModal
        isOpen={swapState.isOpen}
        onClose={() => setSwapState({ isOpen: false, employee1: null, employee2: null })}
        employee1={swapState.employee1}
        employee2={swapState.employee2}
        onConfirm={handleConfirmSwap}
        saving={saving}
      />

      {/* Comprehensive CSV Hierarchy Roster Export Modal */}
      <HierarchyExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        hierarchy={hierarchy}
        filteredHierarchy={filteredHierarchy}
        unassignedStaff={unassignedEmployees}
        filteredUnassigned={filteredUnassigned}
        activeFiltersDesc={
          selectedDepartment !== "all" || searchTerm.trim() || statusFilter !== "all"
            ? `${selectedDepartment !== "all" ? `Dept: ${selectedDepartment}` : ""}${
                searchTerm.trim() ? ` • Query: "${searchTerm}"` : ""
              }${statusFilter !== "all" ? ` • Status: ${statusFilter}` : ""}`
            : undefined
        }
        onSuccessNotification={(msgText) => setMsg({ type: "success", text: msgText })}
      />

      {/* Executive Printable Hierarchy Dossier Modal */}
      <HierarchyPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        hierarchy={hierarchy}
        filteredHierarchy={filteredHierarchy}
        unassignedStaff={unassignedEmployees}
        filteredUnassigned={filteredUnassigned}
        activeFiltersDesc={
          selectedDepartment !== "all" || searchTerm.trim() || statusFilter !== "all"
            ? `${selectedDepartment !== "all" ? `Dept: ${selectedDepartment}` : ""}${
                searchTerm.trim() ? ` • Query: "${searchTerm}"` : ""
              }${statusFilter !== "all" ? ` • Status: ${statusFilter}` : ""}`
            : undefined
        }
        totalMappedCount={hierarchy.length}
        uniqueSupervisorsCount={uniqueSupervisorsCount}
        uniqueManagersCount={uniqueManagersCount}
        unassignedCount={unassignedCount}
      />

      {/* Modern Multi-Staff Batch Onboarding Modal */}
      <BatchOnboardModal
        isOpen={batchModalState.isOpen}
        onClose={() => setBatchModalState({ isOpen: false, candidates: [], targetSquad: null })}
        selectedCandidates={batchModalState.candidates}
        initialTargetSquad={batchModalState.targetSquad}
        supervisors={supervisors}
        managers={managers}
        onConfirmBatch={handleConfirmBatch}
        saving={saving}
      />

      {/* Reporting Line Audit Trail & Activity Log Modal */}
      <HierarchyAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
      />

      {/* Intelligent Auto-Assign Wizard Modal */}
      <AutoAssignWizardModal
        isOpen={isAutoAssignWizardOpen}
        onClose={() => setIsAutoAssignWizardOpen(false)}
        unassignedStaff={unassignedEmployees}
        supervisors={supervisors}
        managers={managers}
        mappings={hierarchy}
        onExecuteAutoAssign={handleExecuteAutoAssign}
        saving={saving}
      />

      {/* Targeted Squad Broadcast Modal */}
      <SquadBroadcastModal
        isOpen={Boolean(broadcastSquadTarget)}
        onClose={() => setBroadcastSquadTarget(null)}
        squad={broadcastSquadTarget}
        onSuccess={(msgText) => setMsg({ type: "success", text: msgText })}
      />

      {/* Global Supervisor Capacity Drawer */}
      <SupervisorCapacityDrawer
        isOpen={Boolean(capacityDrawerSquad)}
        onClose={() => setCapacityDrawerSquad(null)}
        squad={capacityDrawerSquad}
        onOpenAssignModal={(empId, supId, mgrId) => {
          setCapacityDrawerSquad(null);
          setForm({ employee_id: empId ? String(empId) : "", supervisor_id: supId ? String(supId) : "", manager_id: mgrId ? String(mgrId) : "" });
          setShowModal(true);
        }}
        onInitiateReassign={(emp) => {
          setCapacityDrawerSquad(null);
          setReassignState({
            isOpen: true,
            employee: emp,
            targetSupervisor: null,
            targetManager: null,
          });
        }}
        onInitiateUnlink={(emp) => {
          setCapacityDrawerSquad(null);
          setUnlinkState({
            isOpen: true,
            employee: emp,
          });
        }}
        onUpdateSupervisorCapacity={handleUpdateSupervisorCapacity}
        onBroadcastSquad={(squad) => {
          setCapacityDrawerSquad(null);
          setBroadcastSquadTarget(squad);
        }}
        onDelegateLead={(squad) => {
          setCapacityDrawerSquad(null);
          handleOpenDelegation(squad);
        }}
      />

      {/* Temporary Team Lead Delegation Modal */}
      <SupervisorDelegationModal
        isOpen={Boolean(delegationTargetSupervisor)}
        onClose={() => setDelegationTargetSupervisor(null)}
        supervisor={delegationTargetSupervisor}
        availableSupervisors={supervisors}
        onSuccess={() => {
          fetchData();
          setMsg({ type: "success", text: "Team lead delegation updated successfully!" });
        }}
      />
      {/* Floating Simulation Sandbox Control Bar */}
      {isSimulationMode && (
        <div
          className="fixed bottom-6 flex justify-center items-center z-[1040] pointer-events-none px-4"
          style={{ left: "240px", right: "0px" }}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3.5 ring-1 ring-amber-400/20 pointer-events-auto animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-300">
                  Simulation Sandbox Active
                </span>
                <span className="text-[10.5px] text-slate-300">
                  {stagedChanges.length === 0
                    ? "Drag & drop or reassign to stage changes"
                    : `${stagedChanges.length} staged change${stagedChanges.length === 1 ? "" : "s"} ready`}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-white/20"></div>

            <div className="flex items-center gap-2">
              {stagedChanges.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsSimulationReviewOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="bi bi-eye-fill"></i>
                    <span>Review & Publish ({stagedChanges.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Discard all staged reorganization changes?")) {
                        setStagedChanges([]);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                    title="Discard all staged changes"
                  >
                    Discard
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsSimulationMode(false)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                title="Exit Simulation Mode"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reorganization Simulation Review Modal */}
      <ReorgSimulationReviewModal
        isOpen={isSimulationReviewOpen}
        onClose={() => setIsSimulationReviewOpen(false)}
        stagedChanges={stagedChanges}
        onUpdateChange={(idx, updated) => {
          setStagedChanges((prev) => {
            const next = [...prev];
            next[idx] = updated;
            return next;
          });
        }}
        onRemoveChange={(idx) => {
          setStagedChanges((prev) => prev.filter((_, i) => i !== idx));
        }}
        onClearAll={() => {
          if (window.confirm("Discard all staged reorganization changes?")) {
            setStagedChanges([]);
          }
        }}
        onApplyPlan={handleApplyReorgPlan}
      />

      {/* Secondary / Matrix Assignment Modal */}
      <MatrixAssignModal
        isOpen={Boolean(matrixAssignTargetEmployee)}
        onClose={() => setMatrixAssignTargetEmployee(null)}
        employee={matrixAssignTargetEmployee}
        availableSupervisors={supervisors}
        availableProjects={projects}
        onSuccess={(text) => {
          fetchData();
          setMsg({ type: "success", text });
        }}
      />



      {/* Interactive Employee Dossier Modal */}
      <HierarchyEmployeeDossierModal
        isOpen={Boolean(selectedDossierEmployee)}
        onClose={() => setSelectedDossierEmployee(null)}
        employee={selectedDossierEmployee}
        secondaryReports={matrixReports}
        onOpenMatrixModal={(emp) => setMatrixAssignTargetEmployee(emp)}
        onUnlinkSecondary={handleUnlinkSecondary}
        onInitiateReassign={(emp) => {
          setSelectedDossierEmployee(null);
          setReassignState({
            isOpen: true,
            employee: emp,
            targetSupervisor: null,
            targetManager: null,
          });
        }}
        onInitiateUnlink={(emp) => {
          setSelectedDossierEmployee(null);
          setUnlinkState({
            isOpen: true,
            employee: emp,
          });
        }}
        onOpenAssignModal={(empId) => {
          setSelectedDossierEmployee(null);
          setForm((prev) => ({ ...prev, employee_id: String(empId) }));
          setShowModal(true);
        }}
      />

      {/* Floating Bulk Action Bar (Exact match with User Directory) */}
      {selectedStaffIds.length > 0 && (
        <div
          className="fixed bottom-6 flex justify-center items-center z-[1050] pointer-events-none px-4"
          style={{ left: "240px", right: "0px" }}
        >
          <div className="floating-action-bar-anim bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 text-white rounded-2xl shadow-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 flex items-center gap-2 sm:gap-3.5 ring-1 ring-white/10 pointer-events-auto max-w-full overflow-visible">
            {/* Selected Counter Pill */}
            <div className="flex items-center gap-2 pr-1.5 sm:pr-3 border-r border-slate-700/80 shrink-0">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {selectedStaffIds.length} <span className="hidden sm:inline">Selected</span>
              </span>
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Batch Assign to Squad */}
              <button
                type="button"
                onClick={() => {
                  const selectedSet = new Set(selectedStaffIds.map(String));
                  const candidates = [
                    ...unassignedEmployees.filter((u: any) => selectedSet.has(String(u.id))),
                    ...hierarchy
                      .filter((h: any) => selectedSet.has(String(h.employee_id)))
                      .map((h: any) => ({
                        id: h.employee_id,
                        name: h.employee_name,
                        email: h.employee_email,
                        department_name: h.department_name,
                      })),
                  ];
                  setBatchModalState({
                    isOpen: true,
                    candidates,
                    targetSquad: null,
                  });
                }}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-indigo-500/25 hover:bg-indigo-500/35 text-indigo-200 border border-indigo-400/40 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                title="Batch Assign Selected Staff to Squad"
              >
                <i className="bi bi-people-fill text-indigo-300 text-xs"></i>
                <span className="hidden md:inline">Batch Assign</span>
              </button>

              {/* Bulk Unlink Relationship */}
              <button
                type="button"
                onClick={() => {
                  const selectedSet = new Set(selectedStaffIds.map(String));
                  const mappedToUnlink = hierarchy
                    .filter((h: any) => selectedSet.has(String(h.employee_id)))
                    .map((h: any) => h.employee_id);
                  if (mappedToUnlink.length > 0) {
                    handleBatchUnlink(mappedToUnlink);
                    handleClearSelection();
                  } else {
                    setMsg({
                      type: "warning",
                      text: "Selected staff members are already unassigned from any team lead.",
                    });
                  }
                }}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                title="Unlink Selected Reporting Relationships"
              >
                <i className="bi bi-link-45deg text-rose-400 text-xs"></i>
                <span className="hidden md:inline">Unlink Reporting</span>
              </button>

              {/* Export Selected CSV */}
              <button
                type="button"
                onClick={handleBulkExportSelectedCSV}
                className="h-8 px-2.5 sm:px-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                title="Export Selected Members as CSV"
              >
                <i className="bi bi-download text-indigo-300 text-xs"></i>
                <span className="hidden md:inline">Export</span>
              </button>
            </div>

            {/* Clear Selection / Close */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="w-7 h-7 ml-0.5 sm:ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-xs shrink-0"
              title="Deselect All & Exit Multi-Select"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HierarchyMapping;
