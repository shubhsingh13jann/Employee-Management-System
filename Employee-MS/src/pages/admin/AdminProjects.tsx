import React, { useState, useEffect, useMemo } from "react";
import api from "../../api/axios";
import {
  AdminProjectsHeader,
  AdminProjectsKPIStats,
  AdminProjectsFilters,
  AdminProjectsTable,
  AdminProjectsGrid,
  CreateProjectModal,
  AdminMilestoneTracker,
  SupervisorCapacityDrawer,
  ProjectMilestonesModal,
  ProjectDetailDossierModal,
  ProjectSquadDrawer,
  QuickAddTaskModal,
  ProjectTasksTrayModal,
  AdminProjectsGanttRoadmap,
  ProjectBudgetBurnHUDModal,
  FloatingBatchActionBar,
  BatchOperationConfirmModal,
  ProjectBlockerModal,
  ColumnVisibility,
  DEFAULT_COLUMN_VISIBILITY,
} from "../../Components/admin/projects";

export interface ProjectItem {
  id: number | string;
  title: string;
  description: string;
  department_id: number | string;
  department_name?: string;
  department_code?: string;
  lead_supervisor_id?: number | string;
  supervisor_name?: string;
  supervisor_email?: string;
  supervisor_image?: string;
  creator_name?: string;
  status: "planning" | "active" | "on_hold" | "completed" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  budget?: number;
  start_date?: string;
  target_date?: string;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
  progress_percentage: number;
  days_left?: number | null;
  is_overdue?: boolean;
  health: "healthy" | "at_risk" | "critical" | "completed";
  is_blocked?: boolean;
  blocker_status?: "legal" | "vendor_dependency" | "staff_shortage" | "tech_debt" | "other" | "none" | string;
  blocker_notes?: string;
  blocker_escalated_at?: string | null;
  blocker_flagged_by?: number | string | null;
  blocker_flagged_by_name?: string | null;
  squad?: Array<{ id: number | string; name: string; image_url?: string; role_tag?: string }>;
  squad_members_count?: number;
  budget_allocated?: number;
  total_expenses?: number;
  runway_remaining?: number;
  budget_burn_pct?: number;
  is_over_budget?: boolean;
  is_critical_burn?: boolean;
  expense_count?: number;
}

const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: string; text: string }>({ type: "", text: "" });

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeKpiFilter, setActiveKpiFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid" | "milestones" | "gantt">("table");

  // Table Column Visibility State (Persisted in localStorage)
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(() => {
    try {
      const saved = localStorage.getItem("admin_projects_visible_columns");
      if (saved) {
        return { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_COLUMN_VISIBILITY;
  });

  useEffect(() => {
    try {
      localStorage.setItem("admin_projects_visible_columns", JSON.stringify(visibleColumns));
    } catch (e) {}
  }, [visibleColumns]);

  const handleToggleColumn = (columnKey: keyof ColumnVisibility) => {
    setVisibleColumns((prev) => {
      const isCurrentlyVisible = prev[columnKey];
      if (isCurrentlyVisible) {
        // Prevent hiding the last visible column
        const visibleCount = Object.values(prev).filter(Boolean).length;
        if (visibleCount <= 1) return prev;
      }
      return {
        ...prev,
        [columnKey]: !isCurrentlyVisible,
      };
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_COLUMN_VISIBILITY);
  };

  // Multi-Select & Batch Operation Suite State (matching User Directory & Team Hierarchy)
  const [selectedProjectIds, setSelectedProjectIds] = useState<(number | string)[]>([]);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  const showCheckboxes = isSelectMode || selectedProjectIds.length > 0;

  const handleToggleSelectMode = () => {
    if (showCheckboxes) {
      setIsSelectMode(false);
      setSelectedProjectIds([]);
    } else {
      setIsSelectMode(true);
    }
  };

  const handleSelectInitiativeFromMenu = (id: number | string) => {
    setIsSelectMode(true);
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const [batchConfirmModal, setBatchConfirmModal] = useState<{
    isOpen: boolean;
    mode: "archive" | "delete";
  }>({
    isOpen: false,
    mode: "delete",
  });

  const handleToggleSelectProject = (projectId: number | string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const handleSelectAllProjects = () => {
    const visibleIds = filteredProjects.map((p) => p.id);
    setSelectedProjectIds(visibleIds);
  };

  const handleDeselectAllProjects = () => {
    setSelectedProjectIds([]);
    setIsSelectMode(false);
  };

  // Modals / Drawers State (Wired in Commits 4 & 5)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [selectedMilestoneProject, setSelectedMilestoneProject] = useState<ProjectItem | null>(null);
  const [selectedDossierProject, setSelectedDossierProject] = useState<ProjectItem | null>(null);
  const [selectedSquadProject, setSelectedSquadProject] = useState<ProjectItem | null>(null);
  const [selectedTasksProject, setSelectedTasksProject] = useState<ProjectItem | null>(null);
  const [quickAddTaskProject, setQuickAddTaskProject] = useState<ProjectItem | null>(null);
  const [showCapacityDrawer, setShowCapacityDrawer] = useState<boolean>(false);
  const [selectedBudgetProject, setSelectedBudgetProject] = useState<ProjectItem | null>(null);
  const [selectedBlockerProject, setSelectedBlockerProject] = useState<ProjectItem | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const handleSaveBlocker = async (
    projectId: number | string,
    isBlocked: boolean,
    blockerStatus: string,
    blockerNotes: string
  ) => {
    try {
      setSaving(true);
      const res = await api.put(`/api/admin/projects/${projectId}/blocker`, {
        is_blocked: isBlocked,
        blocker_status: blockerStatus,
        blocker_notes: blockerNotes,
      });
      if (res.data.status) {
        setMsg({
          type: "success",
          text: isBlocked
            ? "Strategic initiative escalated with executive blocker!"
            : "Executive blocker resolved successfully!",
        });
        setSelectedBlockerProject(null);
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to update blocker status",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProject = async (formData: any) => {
    try {
      setSaving(true);
      if (editingProject) {
        const res = await api.put(`/api/admin/projects/${editingProject.id}`, formData);
        if (res.data.status) {
          setMsg({ type: "success", text: "Strategic initiative updated successfully!" });
          setShowCreateModal(false);
          setEditingProject(null);
          fetchData();
        }
      } else {
        const res = await api.post("/api/admin/projects", formData);
        if (res.data.status) {
          setMsg({ type: "success", text: "Strategic initiative launched successfully!" });
          setShowCreateModal(false);
          fetchData();
        }
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to save initiative",
      });
    } finally {
      setSaving(false);
    }
  };

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [projRes, deptRes, supRes] = await Promise.all([
        api.get("/api/admin/projects"),
        api.get("/api/admin/departments"),
        api.get("/api/admin/users/supervisors"),
      ]);

      if (projRes.data.status) setProjects(projRes.data.projects);
      if (deptRes.data.status) setDepartments(deptRes.data.departments);
      if (supRes.data.status) setSupervisors(supRes.data.supervisors);
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to load enterprise projects",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered initiatives calculation
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Department Filter
      if (selectedDepartment !== "all" && String(p.department_id) !== String(selectedDepartment)) {
        return false;
      }
      // Supervisor Filter
      if (selectedSupervisor !== "all" && String(p.lead_supervisor_id) !== String(selectedSupervisor)) {
        return false;
      }
      // Priority Filter
      if (selectedPriority !== "all" && p.priority !== selectedPriority) {
        return false;
      }
      // Status Filter
      if (statusFilter !== "all") {
        if (statusFilter === "critical") {
          if (p.health !== "critical" && !p.is_overdue && !p.is_blocked) return false;
        } else if (statusFilter === "blocked") {
          if (!p.is_blocked || p.blocker_status === "none") return false;
        } else if (p.status !== statusFilter) {
          return false;
        }
      }
      // Search Term Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchDept = p.department_name?.toLowerCase().includes(q);
        const matchSup = p.supervisor_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchDept && !matchSup) return false;
      }
      return true;
    });
  }, [projects, selectedDepartment, selectedSupervisor, selectedPriority, statusFilter, searchTerm]);

  // Executive KPI summary calculations
  const kpiStats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const planning = projects.filter((p) => p.status === "planning").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const blockedCount = projects.filter((p) => p.is_blocked && p.blocker_status !== "none").length;
    const critical = projects.filter((p) => p.health === "critical" || p.is_overdue || p.is_blocked).length;

    const totalProgress = projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0);
    const overallVelocity = total > 0 ? Math.round(totalProgress / total) : 0;

    return { total, active, planning, completed, critical, blockedCount, overallVelocity };
  }, [projects]);

  const handleToggleKpiCard = (key: string) => {
    if (activeKpiFilter === key) {
      setActiveKpiFilter(null);
      setStatusFilter("all");
    } else {
      setActiveKpiFilter(key);
      if (key === "total") {
        setStatusFilter("all");
      } else {
        setStatusFilter(key);
      }
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    if (status === "all") {
      setActiveKpiFilter(null);
    } else if (status === "active" || status === "critical" || status === "completed") {
      setActiveKpiFilter(status);
    } else {
      setActiveKpiFilter(null);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedSupervisor("all");
    setSelectedPriority("all");
    setStatusFilter("all");
    setActiveKpiFilter(null);
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedProjectIds.length === 0) return;
    try {
      setIsBatchProcessing(true);
      const res = await api.put("/api/admin/projects/bulk-status", {
        ids: selectedProjectIds,
        status: newStatus,
      });
      if (res.data.status) {
        setMsg({
          type: "success",
          text: `Successfully transitioned ${res.data.updatedCount || selectedProjectIds.length} initiatives to ${newStatus.toUpperCase()}`,
        });
        // Optimistic update
        setProjects((prev) =>
          prev.map((p) =>
            selectedProjectIds.includes(p.id) ? { ...p, status: newStatus as any } : p
          )
        );
        setSelectedProjectIds([]);
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to batch update project status",
      });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleOpenBatchArchive = () => {
    if (selectedProjectIds.length === 0) return;
    setBatchConfirmModal({ isOpen: true, mode: "archive" });
  };

  const handleBatchUnarchive = async () => {
    if (selectedProjectIds.length === 0) return;
    await handleBatchStatusChange("active");
  };

  const handleOpenBatchDelete = () => {
    if (selectedProjectIds.length === 0) return;
    setBatchConfirmModal({ isOpen: true, mode: "delete" });
  };

  const handleExecuteBatchConfirm = async () => {
    if (batchConfirmModal.mode === "archive") {
      await handleBatchStatusChange("archived");
      setBatchConfirmModal({ isOpen: false, mode: "archive" });
    } else {
      try {
        setIsBatchProcessing(true);
        const res = await api.post("/api/admin/projects/bulk-delete", {
          ids: selectedProjectIds,
        });
        if (res.data.status) {
          setMsg({
            type: "success",
            text: `Successfully deleted ${res.data.deletedCount || selectedProjectIds.length} strategic initiative(s)`,
          });
          setProjects((prev) => prev.filter((p) => !selectedProjectIds.includes(p.id)));
          setSelectedProjectIds([]);
          setBatchConfirmModal({ isOpen: false, mode: "delete" });
          fetchData();
        }
      } catch (err: any) {
        setMsg({
          type: "danger",
          text: err.response?.data?.error || "Failed to batch delete projects",
        });
      } finally {
        setIsBatchProcessing(false);
      }
    }
  };

  const handleBatchExportCSV = () => {
    if (selectedProjectIds.length === 0) return;
    const selectedProjects = projects.filter((p) => selectedProjectIds.includes(p.id));
    if (selectedProjects.length === 0) return;

    const headers = [
      "ID",
      "PRJ Code",
      "Title",
      "Department",
      "Lead Supervisor",
      "Status",
      "Priority",
      "Total Tasks",
      "Completed Tasks",
      "Velocity %",
      "Budget (INR)",
      "Actual Spent (INR)",
      "Burn Rate %",
      "Remaining Budget (INR)",
      "Health",
      "Start Date",
      "Target Date",
    ];

    const rows = selectedProjects.map((p) => [
      p.id,
      `"PRJ-${String(p.id).padStart(4, "0")}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.department_name || "General"}"`,
      `"${p.supervisor_name || "Unassigned"}"`,
      p.status,
      p.priority,
      p.total_tasks || 0,
      p.completed_tasks || 0,
      `${p.progress_percentage || 0}%`,
      p.budget || 0,
      p.spent_amount || 0,
      `${p.burn_rate_pct || 0}%`,
      p.remaining_budget !== undefined ? p.remaining_budget : ((p.budget || 0) - (p.spent_amount || 0)),
      p.health || "healthy",
      p.start_date ? p.start_date.split("T")[0] : "",
      p.target_date ? p.target_date.split("T")[0] : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Selected_Initiatives_Batch_Export_${selectedProjects.length}_Items_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMsg({
      type: "success",
      text: `Successfully exported ${selectedProjects.length} selected initiative(s) to CSV`,
    });
  };

  const handleUpdateStatus = async (projectId: number | string, newStatus: string) => {
    try {
      const res = await api.put(`/api/admin/projects/${projectId}/status`, { status: newStatus });
      if (res.data.status) {
        setMsg({ type: "success", text: `Initiative status successfully updated to ${newStatus}` });
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to update project status",
      });
    }
  };

  const handleDeleteProject = async (projectId: number | string) => {
    if (!window.confirm("Are you sure you want to archive / delete this strategic initiative?")) return;
    try {
      const res = await api.delete(`/api/admin/projects/${projectId}`);
      if (res.data.status) {
        setMsg({ type: "success", text: "Strategic initiative removed successfully" });
        fetchData();
      }
    } catch (err: any) {
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to delete project",
      });
    }
  };

  const handleExportCSV = () => {
    // Generate CSV in Commit 4
    if (filteredProjects.length === 0) return;
    const headers = [
      "ID",
      "Title",
      "Department",
      "Lead Supervisor",
      "Status",
      "Priority",
      "Total Tasks",
      "Completed Tasks",
      "Velocity %",
      "Start Date",
      "Target Date",
      "Budget",
      "Health",
    ];

    const rows = filteredProjects.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.department_name || "General"}"`,
      `"${p.supervisor_name || "Unassigned"}"`,
      p.status,
      p.priority,
      p.total_tasks,
      p.completed_tasks,
      `${p.progress_percentage}%`,
      p.start_date ? p.start_date.split("T")[0] : "",
      p.target_date ? p.target_date.split("T")[0] : "",
      p.budget || 0,
      p.health,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Enterprise_Projects_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-2.5 sm:space-y-3 pb-6">
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

        {/* Executive Header with View Mode Switcher */}
        <AdminProjectsHeader
          totalCount={projects.length}
          onOpenCreateModal={() => setShowCreateModal(true)}
          onOpenCapacityDrawer={() => setShowCapacityDrawer(true)}
          onExportCSV={handleExportCSV}
          onRefresh={fetchData}
          isRefreshing={refreshing}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* 4 Executive KPI Cards */}
        <AdminProjectsKPIStats
          totalCount={kpiStats.total}
          activeCount={kpiStats.active}
          planningCount={kpiStats.planning}
          completedCount={kpiStats.completed}
          criticalCount={kpiStats.critical}
          blockedCount={kpiStats.blockedCount}
          overallVelocity={kpiStats.overallVelocity}
          activeKpiFilter={activeKpiFilter}
          onToggleKpi={handleToggleKpiCard}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          onFilterOverdue={() => handleToggleKpiCard("critical")}
          isOverdueFilterActive={activeKpiFilter === "critical"}
        />

        {/* Omnibox Search and Department Filter Toolbar */}
        <AdminProjectsFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedDepartment={selectedDepartment}
          onDepartmentChange={setSelectedDepartment}
          departments={departments}
          selectedSupervisor={selectedSupervisor}
          onSupervisorChange={setSelectedSupervisor}
          supervisors={supervisors}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          totalFiltered={filteredProjects.length}
          totalCount={projects.length}
          onResetFilters={handleResetFilters}
          visibleColumns={visibleColumns}
          onToggleColumn={handleToggleColumn}
          onResetColumns={handleResetColumns}
          isSelectMode={isSelectMode}
          onToggleSelectMode={handleToggleSelectMode}
          selectedCount={selectedProjectIds.length}
        />

        {/* Dynamic View Rendering: Table vs Grid vs Milestones */}
        {loading ? (
          <div className="p-10 sm:p-12 text-center bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="inline-flex items-center gap-2 text-slate-500 text-xs font-medium">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading enterprise initiatives...</span>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-10 sm:p-12 text-center bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg mx-auto mb-2">
              <i className="bi bi-kanban"></i>
            </div>
            <p className="font-bold text-slate-800 text-sm mb-1">No Strategic Initiatives Found</p>
            <p className="text-xs text-slate-500 mb-3">No projects match the current filter criteria.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "gantt" ? (
          <AdminProjectsGanttRoadmap
            projects={filteredProjects}
            showCheckboxes={showCheckboxes}
            selectedProjectIds={selectedProjectIds}
            onToggleSelectProject={handleToggleSelectProject}
            onSelectAllProjects={handleSelectAllProjects}
            onDeselectAllProjects={handleDeselectAllProjects}
            onOpenEditModal={(proj) => {
              setEditingProject(proj);
              setShowCreateModal(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            onOpenMilestonesModal={(proj) => setSelectedMilestoneProject(proj)}
            onOpenDossierModal={(proj) => setSelectedDossierProject(proj)}
            onOpenSquadDrawer={(proj) => setSelectedSquadProject(proj)}
            onOpenTasksTray={(proj) => setSelectedTasksProject(proj)}
            onQuickAddTask={(proj) => setQuickAddTaskProject(proj)}
            onOpenBudgetHUD={(proj) => setSelectedBudgetProject(proj)}
            onOpenBlockerModal={(proj) => setSelectedBlockerProject(proj)}
          />
        ) : viewMode === "milestones" ? (
          <AdminMilestoneTracker
            projects={filteredProjects}
            showCheckboxes={showCheckboxes}
            selectedProjectIds={selectedProjectIds}
            onToggleSelectProject={handleToggleSelectProject}
            onSelectAllProjects={handleSelectAllProjects}
            onDeselectAllProjects={handleDeselectAllProjects}
            onOpenEditModal={(proj) => {
              setEditingProject(proj);
              setShowCreateModal(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            onOpenMilestonesModal={(proj) => setSelectedMilestoneProject(proj)}
            onOpenDossierModal={(proj) => setSelectedDossierProject(proj)}
          />
        ) : viewMode === "grid" ? (
          <AdminProjectsGrid
            projects={filteredProjects}
            showCheckboxes={showCheckboxes}
            selectedProjectIds={selectedProjectIds}
            onToggleSelectProject={handleToggleSelectProject}
            onSelectAllProjects={handleSelectAllProjects}
            onDeselectAllProjects={handleDeselectAllProjects}
            onSelectInitiative={handleSelectInitiativeFromMenu}
            onOpenEditModal={(proj) => {
              setEditingProject(proj);
              setShowCreateModal(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            onDeleteProject={handleDeleteProject}
            onOpenMilestonesModal={(proj) => setSelectedMilestoneProject(proj)}
            onOpenDossierModal={(proj) => setSelectedDossierProject(proj)}
            onOpenSquadDrawer={(proj) => setSelectedSquadProject(proj)}
            onOpenTasksTray={(proj) => setSelectedTasksProject(proj)}
            onQuickAddTask={(proj) => setQuickAddTaskProject(proj)}
            onOpenBudgetHUD={(proj) => setSelectedBudgetProject(proj)}
            onOpenBlockerModal={(proj) => setSelectedBlockerProject(proj)}
          />
        ) : (
          <AdminProjectsTable
            projects={filteredProjects}
            visibleColumns={visibleColumns}
            showCheckboxes={showCheckboxes}
            selectedProjectIds={selectedProjectIds}
            onToggleSelectProject={handleToggleSelectProject}
            onSelectAllProjects={handleSelectAllProjects}
            onDeselectAllProjects={handleDeselectAllProjects}
            onSelectInitiative={handleSelectInitiativeFromMenu}
            onOpenEditModal={(proj) => {
              setEditingProject(proj);
              setShowCreateModal(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            onDeleteProject={handleDeleteProject}
            onOpenMilestonesModal={(proj) => setSelectedMilestoneProject(proj)}
            onOpenDossierModal={(proj) => setSelectedDossierProject(proj)}
            onOpenSquadDrawer={(proj) => setSelectedSquadProject(proj)}
            onOpenTasksTray={(proj) => setSelectedTasksProject(proj)}
            onQuickAddTask={(proj) => setQuickAddTaskProject(proj)}
            onOpenBudgetHUD={(proj) => setSelectedBudgetProject(proj)}
            onOpenBlockerModal={(proj) => setSelectedBlockerProject(proj)}
          />
        )}

        {/* Floating Bottom Action Bar for Multi-Select Batch Operations */}
        <FloatingBatchActionBar
          selectedCount={selectedProjectIds.length}
          totalFilteredCount={filteredProjects.length}
          isAllSelected={
            filteredProjects.length > 0 &&
            filteredProjects.every((p) => selectedProjectIds.includes(p.id))
          }
          onSelectAll={handleSelectAllProjects}
          onDeselectAll={handleDeselectAllProjects}
          onBatchStatusChange={handleBatchStatusChange}
          onBatchExportCSV={handleBatchExportCSV}
          onBatchArchive={handleOpenBatchArchive}
          onBatchUnarchive={handleBatchUnarchive}
          hasArchived={projects
            .filter((p) => selectedProjectIds.includes(p.id))
            .some((p) => p.status === "archived")}
          onBatchDelete={handleOpenBatchDelete}
          isProcessing={isBatchProcessing}
        />

        {/* Batch Operation Confirmation Dialog (Archive & Delete) */}
        <BatchOperationConfirmModal
          isOpen={batchConfirmModal.isOpen}
          onClose={() => setBatchConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          onConfirm={handleExecuteBatchConfirm}
          mode={batchConfirmModal.mode}
          selectedProjects={projects.filter((p) => selectedProjectIds.includes(p.id))}
          isProcessing={isBatchProcessing}
        />

        {/* Create / Edit Strategic Initiative Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingProject(null);
          }}
          onSubmit={handleSaveProject}
          editingProject={editingProject}
          departments={departments}
          supervisors={supervisors}
          saving={saving}
        />

        {/* Interactive Sub-Milestones & Deliverables Modal */}
        <ProjectMilestonesModal
          isOpen={Boolean(selectedMilestoneProject)}
          onClose={() => setSelectedMilestoneProject(null)}
          project={selectedMilestoneProject}
          supervisors={supervisors}
          onMilestonesChanged={fetchData}
        />

        {/* Project 360° Inspection Dossier Modal */}
        <ProjectDetailDossierModal
          isOpen={Boolean(selectedDossierProject)}
          onClose={() => setSelectedDossierProject(null)}
          projectId={selectedDossierProject?.id || null}
          onOpenMilestonesModal={(proj) => {
            setSelectedDossierProject(null);
            setSelectedMilestoneProject(proj);
          }}
          onOpenBudgetHUD={(proj) => {
            setSelectedDossierProject(null);
            setSelectedBudgetProject(proj);
          }}
          onOpenBlockerModal={(proj) => {
            setSelectedDossierProject(null);
            setSelectedBlockerProject(proj);
          }}
        />

        {/* Project Squad & Resource Allocation Drawer */}
        <ProjectSquadDrawer
          isOpen={Boolean(selectedSquadProject)}
          onClose={() => setSelectedSquadProject(null)}
          project={selectedSquadProject}
          onSquadChanged={fetchData}
        />

        {/* In-View Project Tasks Breakdown Tray Modal */}
        <ProjectTasksTrayModal
          isOpen={Boolean(selectedTasksProject)}
          onClose={() => setSelectedTasksProject(null)}
          project={selectedTasksProject}
          onOpenQuickAddTask={(proj) => setQuickAddTaskProject(proj)}
          onTasksChanged={fetchData}
        />

        {/* Quick Add Project Task Modal */}
        <QuickAddTaskModal
          isOpen={Boolean(quickAddTaskProject)}
          onClose={() => setQuickAddTaskProject(null)}
          project={quickAddTaskProject}
          onTaskCreated={() => {
            fetchData();
            if (selectedTasksProject) {
              setSelectedTasksProject({ ...selectedTasksProject });
            }
          }}
        />

        {/* Project Budget & Expenditure Burn Rate HUD Modal */}
        <ProjectBudgetBurnHUDModal
          isOpen={Boolean(selectedBudgetProject)}
          onClose={() => setSelectedBudgetProject(null)}
          project={selectedBudgetProject}
          onBudgetUpdated={fetchData}
        />

        {/* Executive Blocker & Risk Escalation Modal */}
        <ProjectBlockerModal
          isOpen={Boolean(selectedBlockerProject)}
          onClose={() => setSelectedBlockerProject(null)}
          project={selectedBlockerProject}
          onSaveBlocker={handleSaveBlocker}
          saving={saving}
        />

        {/* Supervisor Capacity Heatmap Drawer */}
        <SupervisorCapacityDrawer
          isOpen={showCapacityDrawer}
          onClose={() => setShowCapacityDrawer(false)}
          onSelectSupervisorFilter={(supId) => setSelectedSupervisor(supId)}
        />
    </div>
  );
};

export default AdminProjects;
