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
  const [viewMode, setViewMode] = useState<"table" | "grid" | "milestones">("table");

  // Modals / Drawers State (Wired in Commits 4 & 5)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [showCapacityDrawer, setShowCapacityDrawer] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

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
          if (p.health !== "critical" && !p.is_overdue) return false;
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
    const critical = projects.filter((p) => p.health === "critical" || p.is_overdue).length;

    const totalProgress = projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0);
    const overallVelocity = total > 0 ? Math.round(totalProgress / total) : 0;

    return { total, active, planning, completed, critical, overallVelocity };
  }, [projects]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedSupervisor("all");
    setSelectedPriority("all");
    setStatusFilter("all");
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
          overallVelocity={kpiStats.overallVelocity}
          onFilterOverdue={() =>
            setStatusFilter((prev) => (prev === "critical" ? "all" : "critical"))
          }
          isOverdueFilterActive={statusFilter === "critical"}
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
          onStatusFilterChange={setStatusFilter}
          totalFiltered={filteredProjects.length}
          totalCount={projects.length}
          onResetFilters={handleResetFilters}
        />

        {/* Dynamic View Rendering: Table vs Grid vs Milestones */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <div className="inline-flex items-center gap-2 text-slate-500 text-xs font-medium">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading enterprise initiatives...</span>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-lg mx-auto mb-2">
              <i className="bi bi-kanban"></i>
            </div>
            <p className="font-bold text-slate-800 text-sm mb-1">No Strategic Initiatives Found</p>
            <p className="text-xs text-slate-500 mb-3">No projects match the current filter criteria.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-xs border border-indigo-200 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === "milestones" ? (
          <AdminMilestoneTracker
            projects={filteredProjects}
            onOpenEditModal={(proj) => {
              setEditingProject(proj);
              setShowCreateModal(true);
            }}
            onUpdateStatus={handleUpdateStatus}
          />
        ) : viewMode === "grid" ? (
          <AdminProjectsGrid
            projects={filteredProjects}
            onOpenEditModal={(proj) => {
              setEditingProject(proj);
              setShowCreateModal(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            onDeleteProject={handleDeleteProject}
          />
        ) : (
          <AdminProjectsTable
            projects={filteredProjects}
            onOpenEditModal={(proj) => {
              setEditingProject(proj);
              setShowCreateModal(true);
            }}
            onUpdateStatus={handleUpdateStatus}
            onDeleteProject={handleDeleteProject}
          />
        )}

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
