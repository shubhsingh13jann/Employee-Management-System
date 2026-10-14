import React, { useEffect, useState } from "react";
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
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "tree" | "squad">("table");
  const [activeKpiFilter, setActiveKpiFilter] = useState<"mapped" | "leads" | "managers" | "orphaned" | null>(null);

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

  const unassignedEmployees = employees.filter(
    (e) => !hierarchy.some((h) => String(h.employee_id) === String(e.id))
  );
  const unassignedCount = unassignedEmployees.length;
  const uniqueSupervisorsCount = new Set(hierarchy.map((h) => h.supervisor_id)).size;
  const uniqueManagersCount = new Set(hierarchy.map((h) => h.manager_id)).size;

  const departments = Array.from(
    new Set(hierarchy.map((h) => h.department_name).filter(Boolean))
  ) as string[];

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
      const [hRes, uRes] = await Promise.all([
        api.get("/api/admin/hierarchy"),
        api.get("/api/admin/users")
      ]);

      if (hRes.data.status) setHierarchy(hRes.data.hierarchy);
      if (uRes.data.status) {
        const all = uRes.data.users;
        setEmployees(all.filter((u) => u.role === "employee"));
        setSupervisors(all.filter((u) => u.role === "supervisor"));
        setManagers(all.filter((u) => u.role === "manager"));
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

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.supervisor_id || !form.manager_id) {
      return setMsg({ type: "danger", text: "Please select Employee, Supervisor, and Manager." });
    }

    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/admin/hierarchy", form);
      if (res.data.status) {
        setMsg({ type: "success", text: "Team assignment successfully updated!" });
        setShowModal(false);
        setForm({ employee_id: "", supervisor_id: "", manager_id: "" });
        fetchData();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to assign team hierarchy" });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReassign = async (payload: {
    employee_id: string | number;
    supervisor_id: string | number;
    manager_id?: string | number;
  }) => {
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });
      const res = await api.put("/api/admin/hierarchy/reassign", payload);
      if (res.data.status) {
        setMsg({ type: "success", text: "Reporting line successfully reallocated!" });
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
          onOpenAssignModal={() => setShowModal(true)}
          onRefresh={fetchData}
          isRefreshing={loading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onPrint={() => setIsPrintModalOpen(true)}
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
          onQuickAssign={() => setShowModal(true)}
          onFilterUnassigned={() => handleToggleKpiCard("orphaned")}
          isFilterActive={activeKpiFilter === "orphaned"}
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
        />

        {/* Dynamic View Rendering: Org Chart Tree vs Table View */}
        {viewMode === "tree" ? (
          <HierarchyOrgChartView
            mappings={filteredHierarchy}
            unassignedStaff={filteredUnassigned}
            searchTerm={searchTerm}
            onOpenAssignModal={(empId) => {
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
          />
        ) : viewMode === "squad" ? (
          <HierarchySquadCardsView
            mappings={filteredHierarchy}
            unassignedStaff={filteredUnassigned}
            searchTerm={searchTerm}
            onOpenAssignModal={(empId, supId, mgrId) => {
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
          />
        ) : (
          <HierarchyTableView
            loading={loading}
            mappings={filteredHierarchy}
            unassignedStaff={filteredUnassigned}
            showUnassignedOnly={activeKpiFilter === "orphaned" || statusFilter === "unassigned"}
            statusFilter={statusFilter}
            activeKpiFilter={activeKpiFilter}
            onOpenAssignModal={(empId, supId, mgrId) => {
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
    </div>
  );
};

export default HierarchyMapping;
