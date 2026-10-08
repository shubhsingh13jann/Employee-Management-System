import React, { useEffect, useState, useMemo, useRef } from "react";
import api from "../../api/axios";
import {
  ProjectFormModal,
  ProjectDeleteModal,
  SupervisorWorkloadDrawer,
} from "../../Components/manager/projects";

interface Project {
  id: number;
  title: string;
  description?: string;
  department_id: number;
  department_name?: string;
  created_by: number;
  lead_supervisor_id: number;
  lead_supervisor_name: string;
  status: "planning" | "active" | "completed";
  start_date: string;
  target_date: string;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
}

interface Supervisor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  active_projects_count?: number;
  team_size?: number;
  total_tasks_count?: number;
  completed_tasks_count?: number;
}

const ProjectsManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedSupervisorFilter, setSelectedSupervisorFilter] = useState<number | string | null>(null);
  const [sortField, setSortField] = useState<string>("target_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isWorkloadOpen, setIsWorkloadOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "danger" | ""; text: string }>({ type: "", text: "" });

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!msg.text) return;
    const timer = setTimeout(() => {
      setMsg({ type: "", text: "" });
    }, 4000);
    return () => clearTimeout(timer);
  }, [msg.text]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setActiveActionMenuId(null);
      }
      if (!target.closest(".hero-menu-container")) {
        setIsHeroMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveActionMenuId(null);
        setIsHeroMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Keyboard shortcut (/ or Ctrl+K to focus search)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "/" && !isInput) || ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K"))) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes] = await Promise.all([
        api.get("/api/manager/projects"),
        api.get("/api/manager/supervisors"),
      ]);
      if (pRes.data.status) {
        setProjects(pRes.data.projects || []);
      }
      if (sRes.data.status) {
        setSupervisors(sRes.data.supervisors || []);
      }
    } catch (err: any) {
      console.error("Fetch projects error:", err);
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to load project records",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick Status Toggle Handler
  const handleQuickStatusChange = async (project: Project, newStatus: "planning" | "active" | "completed") => {
    setActiveActionMenuId(null);
    try {
      const cleanTargetDate = project.target_date
        ? new Date(project.target_date).toISOString().slice(0, 10)
        : "";
      const res = await api.put(`/api/manager/projects/${project.id}`, {
        title: project.title,
        description: project.description || "",
        lead_supervisor_id: project.lead_supervisor_id,
        target_date: cleanTargetDate,
        status: newStatus,
      });
      if (res.data.status) {
        setMsg({
          type: "success",
          text: `Project "${project.title}" marked as ${newStatus}.`,
        });
        fetchData();
      }
    } catch (err: any) {
      console.error("Quick status change error:", err);
      setMsg({
        type: "danger",
        text: err.response?.data?.error || "Failed to update project status",
      });
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (projects.length === 0) return;
    const headers = ["ID", "Title", "Status", "Lead Supervisor", "Department", "Start Date", "Target Deadline", "Total Tasks", "Completed Tasks", "Progress %"];
    const rows = projects.map((p) => {
      const total = Number(p.total_tasks || 0);
      const completed = Number(p.completed_tasks || 0);
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        p.status,
        `"${(p.lead_supervisor_name || "").replace(/"/g, '""')}"`,
        `"${(p.department_name || "Unassigned").replace(/"/g, '""')}"`,
        p.start_date ? new Date(p.start_date).toISOString().slice(0, 10) : "",
        p.target_date ? new Date(p.target_date).toISOString().slice(0, 10) : "",
        total,
        completed,
        `${pct}%`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `department_projects_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Counts
  const statusCounts = useMemo(() => {
    return {
      all: projects.length,
      active: projects.filter((p) => p.status === "active").length,
      planning: projects.filter((p) => p.status === "planning").length,
      completed: projects.filter((p) => p.status === "completed").length,
    };
  }, [projects]);

  // Overall Task Completion Velocity Rate
  const overallVelocity = useMemo(() => {
    const total = projects.reduce((acc, p) => acc + Number(p.total_tasks || 0), 0);
    const completed = projects.reduce((acc, p) => acc + Number(p.completed_tasks || 0), 0);
    return {
      total,
      completed,
      pct: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [projects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (selectedSupervisorFilter && String(p.lead_supervisor_id) !== String(selectedSupervisorFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchSup = p.lead_supervisor_name?.toLowerCase().includes(q);
        const matchDept = p.department_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchSup && !matchDept) return false;
      }
      return true;
    });
  }, [projects, statusFilter, selectedSupervisorFilter, searchQuery]);

  const sortedProjects = useMemo(() => {
    const list = [...filteredProjects];
    list.sort((a, b) => {
      if (sortField === "target_date") {
        const timeA = new Date(a.target_date).getTime();
        const timeB = new Date(b.target_date).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortField === "progress") {
        const pctA = Number(a.total_tasks) > 0 ? Number(a.completed_tasks) / Number(a.total_tasks) : 0;
        const pctB = Number(b.total_tasks) > 0 ? Number(b.completed_tasks) / Number(b.total_tasks) : 0;
        return sortOrder === "asc" ? pctA - pctB : pctB - pctA;
      }
      if (sortField === "title") {
        return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      if (sortField === "created_at") {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      }
      return 0;
    });
    return list;
  }, [filteredProjects, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Helper for deadline calculations
  const getDeadlineMeta = (targetDateStr: string, status?: string) => {
    if (!targetDateStr) return { text: "No deadline", isOverdue: false, badgeClass: "bg-slate-100 text-slate-600" };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (status === "completed") {
      return {
        text: `Completed on ${target.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
        isOverdue: false,
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      };
    }

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `Overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""}`,
        isOverdue: true,
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 animate-pulse",
      };
    }
    if (diffDays === 0) {
      return {
        text: "Due today",
        isOverdue: false,
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
      };
    }
    if (diffDays === 1) {
      return {
        text: "Due tomorrow",
        isOverdue: false,
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    if (diffDays <= 7) {
      return {
        text: `${diffDays} days left`,
        isOverdue: false,
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    }
    return {
      text: `${diffDays} days remaining`,
      isOverdue: false,
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Completed</span>
          </span>
        );
      case "planning":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Planning</span>
          </span>
        );
      case "active":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Active</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-3.5 xl:h-full xl:flex xl:flex-col xl:min-h-0 xl:overflow-hidden">
      {/* Toast Alert Message */}
      {msg.text && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 shrink-0 ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <i
              className={`bi ${
                msg.type === "success"
                  ? "bi-check-circle-fill text-emerald-600"
                  : "bi-exclamation-triangle-fill text-rose-600"
              }`}
            ></i>
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

      {/* Main Responsive Layout with Optional Workload Drawer */}
      <div className="flex flex-col xl:flex-row items-start xl:flex-1 xl:min-h-0 xl:h-full w-full">
        {/* Left Column (Hero, Metrics, Filter Tabs, Content) */}
        <div
          className={`min-w-0 xl:h-full xl:overflow-y-auto space-y-3 transition-all duration-300 ease-in-out [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 ${
            isWorkloadOpen ? "xl:w-[calc(100%-365px)] xl:pr-1" : "w-full"
          }`}
        >
          {/* Executive Gradient Hero Banner with Micro-Lightning Waves */}
          <div className="relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-gradient-to-r from-[#070d28] via-[#0d164d] to-[#1c1252] border border-indigo-500/30 shadow-xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 select-none">
            {/* Micro-Lightning Wave Effect Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-0">
              <svg
                className="absolute right-0 bottom-0 w-[65%] sm:w-[52%] h-full text-cyan-400 micro-lightning-waves opacity-85"
                viewBox="0 0 600 120"
                preserveAspectRatio="none"
                fill="none"
              >
                <defs>
                  <linearGradient id="projHeroGrad1" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                    <stop offset="45%" stopColor="#818cf8" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="projHeroCyan" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                    <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {Array.from({ length: 22 }).map((_, i) => {
                  const startX = 60 + i * 15;
                  const cp1x = 190 + i * 11;
                  const cp1y = 105 - i * 3;
                  const cp2x = 350 + i * 8;
                  const cp2y = 35 - i * 1.5;
                  const endX = 500 + i * 6;
                  const endY = -10 + i * 1.8;
                  const opacity = 0.08 + Math.sin((i / 22) * Math.PI) * 0.3;
                  return (
                    <path
                      key={`proj-wave-${i}`}
                      d={`M ${startX},130 C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`}
                      stroke="url(#projHeroGrad1)"
                      strokeWidth={i % 3 === 0 ? "1.2" : "0.75"}
                      strokeOpacity={opacity}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Left Side: Icon & Title */}
            <div className="relative z-10 flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-400/40 flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md shadow-indigo-500/25 shrink-0 backdrop-blur-xs">
                <i className="bi bi-kanban-fill text-indigo-200"></i>
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-white mb-0.5 whitespace-nowrap">
                  Department Projects & Milestones
                </h2>
                <p className="text-[11px] text-indigo-200/80 mb-0 font-normal truncate max-w-[280px] sm:max-w-md">
                  Strategic Initiatives, Supervisor Allocations & Sprint Velocity
                </p>
              </div>
            </div>

            {/* Right Side: View Switcher + Action Buttons */}
            <div className="relative z-10 flex items-center gap-2 shrink-0 self-end md:self-center hero-menu-container">
              {/* Table vs Grid Switcher */}
              <div className="h-9 p-0.5 rounded-xl bg-white/10 border border-white/20 flex items-center gap-1 backdrop-blur-xs box-border shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="Interactive Milestone Cards"
                >
                  <i className="bi bi-grid-fill text-sm"></i>
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`h-8 px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer leading-none ${
                    viewMode === "table"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="Dense Enterprise Table"
                >
                  <i className="bi bi-table text-sm"></i>
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              {/* Primary Action Button: Launch Initiative */}
              <button
                type="button"
                onClick={() => {
                  setProjectToEdit(null);
                  setIsFormModalOpen(true);
                }}
                className="h-9 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <i className="bi bi-plus-lg font-bold text-xs"></i>
                <span className="hidden sm:inline">New Milestone</span>
              </button>

              {/* Triple-Line Consolidated Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsHeroMenuOpen(!isHeroMenuOpen)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                    isHeroMenuOpen
                      ? "bg-indigo-600 text-white border border-indigo-400/50 shadow-indigo-500/30 ring-2 ring-indigo-400/30"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs"
                  }`}
                  title="Projects Action Menu"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  </svg>
                </button>

                {isHeroMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        setProjectToEdit(null);
                        setIsFormModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-sm text-left"
                    >
                      <i className="bi bi-plus-lg font-bold text-xs"></i>
                      <span>Create New Milestone</span>
                    </button>

                    <div className="h-px bg-white/10 my-1.5"></div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        setIsWorkloadOpen(!isWorkloadOpen);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <i className={`bi ${isWorkloadOpen ? "bi-people-fill" : "bi-people"} text-amber-400 text-sm`}></i>
                        <span>Supervisor Workload</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                        {isWorkloadOpen ? "Open" : "Closed"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        handleExportCSV();
                      }}
                      disabled={projects.length === 0}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50 text-left"
                    >
                      <i className="bi bi-download text-indigo-400 text-sm"></i>
                      <span>Export Projects CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsHeroMenuOpen(false);
                        fetchData();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <i className="bi bi-arrow-clockwise text-indigo-400 text-sm"></i>
                      <span>Refresh Records</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Row (5 Compact Stat Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
            {/* Total Initiatives */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Initiatives</span>
                <span className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">{statusCounts.all}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                <i className="bi bi-folder2-open"></i>
              </div>
            </div>

            {/* Active Execution */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-indigo-500 uppercase tracking-wider block">Active</span>
                <span className="text-lg sm:text-xl font-extrabold text-indigo-700 leading-tight">{statusCounts.active}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                <i className="bi bi-play-circle-fill"></i>
              </div>
            </div>

            {/* Planning */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-amber-500 uppercase tracking-wider block">Planning</span>
                <span className="text-lg sm:text-xl font-extrabold text-amber-700 leading-tight">{statusCounts.planning}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold">
                <i className="bi bi-hourglass-split"></i>
              </div>
            </div>

            {/* Completed */}
            <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold text-emerald-500 uppercase tracking-wider block">Completed</span>
                <span className="text-lg sm:text-xl font-extrabold text-emerald-700 leading-tight">{statusCounts.completed}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">
                <i className="bi bi-check2-circle"></i>
              </div>
            </div>

            {/* Overall Task Velocity Rate */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-1 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Velocity</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">{overallVelocity.pct}%</span>
                  <span className="text-[10px] text-slate-500 truncate">({overallVelocity.completed}/{overallVelocity.total})</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center text-sm font-bold">
                <i className="bi bi-speedometer2"></i>
              </div>
            </div>
          </div>

          {/* Controls Bar: Status Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar shrink-0">
              {[
                { id: "", label: "All Initiatives", count: statusCounts.all, activeCls: "bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400/20" },
                { id: "active", label: "Active", count: statusCounts.active, activeCls: "bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400/20" },
                { id: "planning", label: "Planning", count: statusCounts.planning, activeCls: "bg-amber-50 border-amber-400 text-amber-800 ring-1 ring-amber-400/20" },
                { id: "completed", label: "Completed", count: statusCounts.completed, activeCls: "bg-emerald-50 border-emerald-400 text-emerald-800 ring-1 ring-emerald-400/20" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id || "all"}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                      isActive
                        ? tab.activeCls
                        : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200/90"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Sort Selector */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64 flex items-center h-9 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-2.5 shadow-2xs">
                <i className="bi bi-search text-slate-400 text-xs mr-2 shrink-0"></i>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search project, lead, department..."
                  className="w-full text-xs text-slate-800 placeholder:text-slate-400 bg-transparent outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer ml-1"
                  >
                    ✕
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded ml-1">
                  Ctrl K
                </kbd>
              </div>

              {/* Sort Selector */}
              <select
                value={sortField}
                onChange={(e) => handleSort(e.target.value)}
                className="h-9 px-2.5 rounded-xl text-xs bg-white border border-slate-200/90 text-slate-700 font-semibold outline-none cursor-pointer hover:border-slate-300 shadow-2xs"
                title="Sort Projects"
              >
                <option value="target_date">Sort: Deadline</option>
                <option value="progress">Sort: Progress %</option>
                <option value="title">Sort: Title</option>
                <option value="created_at">Sort: Recent</option>
              </select>
            </div>
          </div>

          {/* Active Supervisor Filter Pill */}
          {selectedSupervisorFilter && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 w-fit">
              <i className="bi bi-funnel-fill text-amber-600"></i>
              <span>
                Filtered by Lead Supervisor:{" "}
                <strong>
                  {supervisors.find((s) => String(s.id) === String(selectedSupervisorFilter))?.name || "Supervisor"}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSupervisorFilter(null)}
                className="ml-2 font-bold text-amber-800 hover:text-amber-950 cursor-pointer"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* Content Area: Grid View or Table View */}
          {loading ? (
            <div className="py-24 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex flex-col items-center justify-center gap-2.5">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading department initiatives...</span>
              </div>
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 text-xl mx-auto mb-3 shadow-2xs">
                <i className="bi bi-folder2-open"></i>
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">No project initiatives found</h4>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto mb-3">
                {searchQuery || statusFilter || selectedSupervisorFilter
                  ? "No initiatives match your active search terms or filters."
                  : "Launch your first strategic department initiative to delegate sprint tasks to operational supervisors."}
              </p>
              {searchQuery || statusFilter || selectedSupervisorFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("");
                    setSelectedSupervisorFilter(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setProjectToEdit(null);
                    setIsFormModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Launch New Project Milestone</span>
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* Interactive Initiative Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {sortedProjects.map((p) => {
                const total = Number(p.total_tasks || 0);
                const completed = Number(p.completed_tasks || 0);
                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                const deadline = getDeadlineMeta(p.target_date, p.status);
                const isMenuActive = activeActionMenuId === p.id;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-4.5 flex flex-col justify-between group relative"
                  >
                    {/* Top Row: Status, Overdue Badge & 3-Dots Menu */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(p.status)}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${deadline.badgeClass}`}>
                          <i className="bi bi-clock-history text-[9.5px]"></i>
                          <span>{deadline.text}</span>
                        </span>
                      </div>

                      {/* 3-Dots Action Menu */}
                      <div className="relative inline-flex items-center justify-center action-menu-container">
                        <button
                          type="button"
                          onClick={() => setActiveActionMenuId((prev) => (prev === p.id ? null : p.id))}
                          className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shadow-2xs"
                          title="Actions"
                        >
                          <i className="bi bi-three-dots text-xs"></i>
                        </button>

                        {isMenuActive && (
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(null);
                                setProjectToEdit(p);
                                setIsFormModalOpen(true);
                              }}
                              className="w-full px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <i className="bi bi-pencil-square text-slate-400"></i>
                              <span>Edit Milestone</span>
                            </button>

                            {p.status !== "completed" && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(p, "completed")}
                                className="w-full px-2.5 py-1.5 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <i className="bi bi-check2-circle text-emerald-600"></i>
                                <span>Mark Completed</span>
                              </button>
                            )}

                            {p.status !== "active" && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(p, "active")}
                                className="w-full px-2.5 py-1.5 text-[11px] text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <i className="bi bi-play-circle text-indigo-600"></i>
                                <span>Set as Active</span>
                              </button>
                            )}

                            {p.status !== "planning" && (
                              <button
                                type="button"
                                onClick={() => handleQuickStatusChange(p, "planning")}
                                className="w-full px-2.5 py-1.5 text-[11px] text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <i className="bi bi-hourglass-split text-amber-600"></i>
                                <span>Set to Planning</span>
                              </button>
                            )}

                            <div className="h-px bg-slate-100 my-1"></div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveActionMenuId(null);
                                setProjectToDelete(p);
                              }}
                              className="w-full px-2.5 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <i className="bi bi-trash3 text-rose-500"></i>
                              <span>Delete Milestone</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mb-3">
                      <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-[14.5px] leading-snug mb-1">
                        {p.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-0 font-normal">
                        {p.description || "No specific project goals specified. Lead supervisor coordinates sprint tasks."}
                      </p>
                    </div>

                    {/* Progress Bar & Velocity */}
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 mb-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <i className="bi bi-list-check text-indigo-600"></i>
                          <span>Sprint Progress</span>
                        </span>
                        <span className="font-mono text-slate-900">
                          {completed} / {total} Tasks ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percent === 100
                              ? "bg-emerald-500"
                              : percent >= 50
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                              : "bg-indigo-500"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer Row: Lead Supervisor & Target Date */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 gap-2">
                      <div
                        onClick={() => setSelectedSupervisorFilter(p.lead_supervisor_id)}
                        className="flex items-center gap-2 min-w-0 cursor-pointer hover:text-indigo-600 transition-colors"
                        title="Click to filter by this supervisor"
                      >
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0 border border-amber-200">
                          {p.lead_supervisor_name ? p.lead_supervisor_name.charAt(0) : "S"}
                        </div>
                        <span className="font-semibold text-slate-800 truncate text-[11.5px]">
                          {p.lead_supervisor_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 shrink-0 text-[11px]">
                        <i className="bi bi-calendar3 text-indigo-500 text-[10px]"></i>
                        <span>{new Date(p.target_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Dense Enterprise Table View */
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full min-w-[760px] text-left border-collapse text-xs">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-700">
                    <tr>
                      <th
                        className="px-4 py-3 cursor-pointer hover:text-slate-900 transition-colors"
                        onClick={() => handleSort("title")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Milestone Initiative</span>
                          <i className="bi bi-arrow-down-up text-[10px] text-slate-400"></i>
                        </div>
                      </th>
                      <th className="px-3.5 py-3">Status</th>
                      <th
                        className="px-3.5 py-3 cursor-pointer hover:text-slate-900 transition-colors"
                        onClick={() => handleSort("progress")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Velocity</span>
                          <i className="bi bi-arrow-down-up text-[10px] text-slate-400"></i>
                        </div>
                      </th>
                      <th className="px-3.5 py-3">Lead Supervisor</th>
                      <th
                        className="px-3.5 py-3 cursor-pointer hover:text-slate-900 transition-colors"
                        onClick={() => handleSort("target_date")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Target Deadline</span>
                          <i className="bi bi-arrow-down-up text-[10px] text-slate-400"></i>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedProjects.map((p) => {
                      const total = Number(p.total_tasks || 0);
                      const completed = Number(p.completed_tasks || 0);
                      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                      const deadline = getDeadlineMeta(p.target_date, p.status);
                      const isMenuActive = activeActionMenuId === p.id;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3">
                            <div className="min-w-0 max-w-xs">
                              <span className="font-semibold text-slate-900 text-xs sm:text-[13px] block truncate">
                                {p.title}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                                {p.description || "No description provided"}
                              </span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            {getStatusBadge(p.status)}
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <div className="w-28 space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-600 font-medium">
                                <span>{percent}%</span>
                                <span>{completed}/{total}</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${percent === 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <div
                              onClick={() => setSelectedSupervisorFilter(p.lead_supervisor_id)}
                              className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors"
                            >
                              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center shrink-0 border border-amber-200">
                                {p.lead_supervisor_name ? p.lead_supervisor_name.charAt(0) : "S"}
                              </div>
                              <span className="font-medium text-slate-800 text-xs">
                                {p.lead_supervisor_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <span className="text-xs text-slate-800 font-semibold block">
                                {new Date(p.target_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${deadline.badgeClass}`}>
                                {deadline.text}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="relative inline-flex items-center justify-center action-menu-container">
                              <button
                                type="button"
                                onClick={() => setActiveActionMenuId((prev) => (prev === p.id ? null : p.id))}
                                className="w-7 h-7 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shadow-2xs"
                                title="Actions"
                              >
                                <i className="bi bi-three-dots text-xs"></i>
                              </button>

                              {isMenuActive && (
                                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white border border-slate-200/90 shadow-xl p-1 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setProjectToEdit(p);
                                      setIsFormModalOpen(true);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-pencil-square text-slate-400"></i>
                                    <span>Edit Milestone</span>
                                  </button>

                                  {p.status !== "completed" && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickStatusChange(p, "completed")}
                                      className="w-full px-2.5 py-1.5 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                      <i className="bi bi-check2-circle text-emerald-600"></i>
                                      <span>Mark Completed</span>
                                    </button>
                                  )}

                                  {p.status !== "active" && (
                                    <button
                                      type="button"
                                      onClick={() => handleQuickStatusChange(p, "active")}
                                      className="w-full px-2.5 py-1.5 text-[11px] text-indigo-700 hover:bg-indigo-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                      <i className="bi bi-play-circle text-indigo-600"></i>
                                      <span>Set as Active</span>
                                    </button>
                                  )}

                                  <div className="h-px bg-slate-100 my-1"></div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveActionMenuId(null);
                                      setProjectToDelete(p);
                                    }}
                                    className="w-full px-2.5 py-1.5 text-[11px] text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                  >
                                    <i className="bi bi-trash3 text-rose-500"></i>
                                    <span>Delete Milestone</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Supervisor Workload Drawer */}
        <SupervisorWorkloadDrawer
          isOpen={isWorkloadOpen}
          onClose={() => setIsWorkloadOpen(false)}
          supervisors={supervisors}
          selectedSupervisorId={selectedSupervisorFilter}
          onFilterBySupervisor={(id) => setSelectedSupervisorFilter(id)}
        />
      </div>

      {/* Project Form Modal (Create & Edit) */}
      <ProjectFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProjectToEdit(null);
        }}
        onSuccess={(message) => {
          setMsg({ type: "success", text: message });
          fetchData();
        }}
        supervisors={supervisors}
        projectToEdit={projectToEdit}
      />

      {/* Project Delete Modal */}
      <ProjectDeleteModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onSuccess={(message) => {
          setMsg({ type: "success", text: message });
          fetchData();
        }}
        project={projectToDelete}
      />
    </div>
  );
};

export default ProjectsManager;
