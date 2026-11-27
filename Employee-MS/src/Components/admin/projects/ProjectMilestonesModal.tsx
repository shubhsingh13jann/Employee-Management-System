import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";
import { ProjectItem } from "../../../pages/admin/AdminProjects";

export interface DeliverableItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectMilestoneItem {
  id: number | string;
  project_id: number | string;
  title: string;
  description?: string;
  due_date?: string | null;
  owner_id?: number | string | null;
  owner_name?: string;
  owner_email?: string;
  owner_image?: string;
  owner_role?: string;
  status: "pending" | "in_progress" | "completed";
  order_index: number;
  deliverables: DeliverableItem[];
  total_deliverables: number;
  completed_deliverables: number;
  progress_percentage: number;
  created_at?: string;
}

interface ProjectMilestonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem | null;
  supervisors?: Array<{ id: number | string; name: string }>;
  onMilestonesChanged?: () => void;
}

export const ProjectMilestonesModal: React.FC<ProjectMilestonesModalProps> = ({
  isOpen,
  onClose,
  project,
  supervisors = [],
  onMilestonesChanged,
}) => {
  const [milestones, setMilestones] = useState<ProjectMilestoneItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [newDeliverableInput, setNewDeliverableInput] = useState<{ [milestoneId: string]: string }>({});

  // Add/Edit Milestone Form State
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formOwnerId, setFormOwnerId] = useState("");
  const [formStatus, setFormStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [formDeliverables, setFormDeliverables] = useState<string[]>([]);
  const [newFormDeliverableText, setNewFormDeliverableText] = useState("");
  const [savingForm, setSavingForm] = useState(false);

  const fetchMilestones = async () => {
    if (!project) return;
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/api/admin/projects/${project.id}/milestones`);
      if (res.data.status) {
        setMilestones(res.data.milestones);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load project deliverable milestones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      fetchMilestones();
      setIsEditingMode(false);
      setEditingMilestoneId(null);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Milestone Progress Summary
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const inProgressMilestones = milestones.filter((m) => m.status === "in_progress").length;
  const pendingMilestones = milestones.filter((m) => m.status === "pending").length;
  const overdueMilestones = milestones.filter(
    (m) => m.status !== "completed" && m.due_date && new Date(m.due_date).getTime() < Date.now()
  ).length;
  const totalDeliverablesCount = milestones.reduce((sum, m) => sum + (m.deliverables?.length || 0), 0);
  const completedDeliverablesCount = milestones.reduce(
    (sum, m) => sum + (m.deliverables?.filter((d) => d.completed).length || 0),
    0
  );
  const overallMilestonePercent =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const deliverablePercent =
    totalDeliverablesCount > 0 ? Math.round((completedDeliverablesCount / totalDeliverablesCount) * 100) : 0;

  // Toggle Entire Milestone Status
  const handleToggleMilestone = async (milestone: ProjectMilestoneItem) => {
    try {
      const nextStatus = milestone.status === "completed" ? "in_progress" : "completed";
      
      // Optimistic update
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id === milestone.id) {
            const updatedDel =
              nextStatus === "completed"
                ? m.deliverables.map((d) => ({ ...d, completed: true }))
                : m.deliverables;
            return {
              ...m,
              status: nextStatus,
              deliverables: updatedDel,
              completed_deliverables: nextStatus === "completed" ? updatedDel.length : m.completed_deliverables,
              progress_percentage: nextStatus === "completed" ? 100 : m.progress_percentage,
            };
          }
          return m;
        })
      );

      const res = await api.put(`/api/admin/projects/milestones/${milestone.id}/status`, {
        status: nextStatus,
      });

      if (!res.data.status) {
        fetchMilestones();
      } else {
        onMilestonesChanged?.();
      }
    } catch (err) {
      fetchMilestones();
    }
  };

  // Toggle Single Deliverable Checkbox
  const handleToggleDeliverable = async (milestoneId: number | string, deliverableId: string, currentVal: boolean) => {
    try {
      const nextVal = !currentVal;

      // Optimistic update
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id === milestoneId) {
            const nextDel = m.deliverables.map((d) =>
              d.id === deliverableId ? { ...d, completed: nextVal } : d
            );
            const allDone = nextDel.length > 0 && nextDel.every((d) => d.completed);
            const anyDone = nextDel.some((d) => d.completed);
            const newStatus = allDone ? "completed" : anyDone ? "in_progress" : m.status;

            return {
              ...m,
              deliverables: nextDel,
              status: newStatus,
              completed_deliverables: nextDel.filter((d) => d.completed).length,
              progress_percentage: Math.round((nextDel.filter((d) => d.completed).length / nextDel.length) * 100),
            };
          }
          return m;
        })
      );

      const res = await api.put(`/api/admin/projects/milestones/${milestoneId}/deliverable-toggle`, {
        deliverableId,
        completed: nextVal,
      });

      if (!res.data.status) {
        fetchMilestones();
      } else {
        onMilestonesChanged?.();
      }
    } catch (err) {
      fetchMilestones();
    }
  };

  // Add Inline Deliverable Item to existing milestone
  const handleAddInlineDeliverable = async (milestone: ProjectMilestoneItem) => {
    const text = newDeliverableInput[String(milestone.id)]?.trim();
    if (!text) return;

    try {
      const newItem: DeliverableItem = {
        id: `del-${Date.now()}`,
        title: text,
        completed: false,
      };

      const updatedDeliverables = [...milestone.deliverables, newItem];

      // Optimistic update
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestone.id ? { ...m, deliverables: updatedDeliverables } : m))
      );
      setNewDeliverableInput((prev) => ({ ...prev, [String(milestone.id)]: "" }));

      await api.put(`/api/admin/projects/milestones/${milestone.id}`, {
        deliverables: updatedDeliverables,
      });

      onMilestonesChanged?.();
    } catch (err) {
      fetchMilestones();
    }
  };

  // Remove Deliverable Item
  const handleRemoveDeliverable = async (milestone: ProjectMilestoneItem, deliverableId: string) => {
    try {
      const updatedDeliverables = milestone.deliverables.filter((d) => d.id !== deliverableId);

      // Optimistic update
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestone.id ? { ...m, deliverables: updatedDeliverables } : m))
      );

      await api.put(`/api/admin/projects/milestones/${milestone.id}`, {
        deliverables: updatedDeliverables,
      });

      onMilestonesChanged?.();
    } catch (err) {
      fetchMilestones();
    }
  };

  // Open Form for Adding New Milestone
  const handleOpenAddForm = () => {
    setIsEditingMode(true);
    setEditingMilestoneId(null);
    setFormTitle(`Phase ${milestones.length + 1}: `);
    setFormDescription("");
    setFormDueDate("");
    setFormOwnerId(project.lead_supervisor_id ? String(project.lead_supervisor_id) : "");
    setFormStatus("pending");
    setFormDeliverables([]);
    setNewFormDeliverableText("");
  };

  // Open Form for Editing Existing Milestone
  const handleOpenEditForm = (m: ProjectMilestoneItem) => {
    setIsEditingMode(true);
    setEditingMilestoneId(m.id);
    setFormTitle(m.title);
    setFormDescription(m.description || "");
    setFormDueDate(m.due_date ? m.due_date.split("T")[0] : "");
    setFormOwnerId(m.owner_id ? String(m.owner_id) : "");
    setFormStatus(m.status);
    setFormDeliverables(m.deliverables?.map((d) => d.title) || []);
    setNewFormDeliverableText("");
  };

  // Save Milestone Form (Add or Edit)
  const handleSaveMilestoneForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setError("Please provide a milestone title");
      return;
    }

    try {
      setSavingForm(true);
      setError("");

      const deliverablesPayload = formDeliverables.map((title, idx) => ({
        id: `del-${Date.now()}-${idx}`,
        title,
        completed: false,
      }));

      if (editingMilestoneId) {
        // Keep completed state if existing
        const existing = milestones.find((m) => m.id === editingMilestoneId);
        const mergedDeliverables = formDeliverables.map((title, idx) => {
          const match = existing?.deliverables?.find((d) => d.title === title);
          return {
            id: match ? match.id : `del-${Date.now()}-${idx}`,
            title,
            completed: match ? match.completed : false,
          };
        });

        await api.put(`/api/admin/projects/milestones/${editingMilestoneId}`, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          due_date: formDueDate || null,
          owner_id: formOwnerId ? Number(formOwnerId) : null,
          status: formStatus,
          deliverables: mergedDeliverables,
        });
      } else {
        await api.post(`/api/admin/projects/${project.id}/milestones`, {
          title: formTitle.trim(),
          description: formDescription.trim(),
          due_date: formDueDate || null,
          owner_id: formOwnerId ? Number(formOwnerId) : null,
          status: formStatus,
          order_index: milestones.length + 1,
          deliverables: deliverablesPayload,
        });
      }

      setIsEditingMode(false);
      setEditingMilestoneId(null);
      await fetchMilestones();
      onMilestonesChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save milestone");
    } finally {
      setSavingForm(false);
    }
  };

  // Delete Milestone
  const handleDeleteMilestone = async (milestoneId: number | string) => {
    if (!window.confirm("Are you sure you want to delete this deliverable milestone?")) return;
    try {
      await api.delete(`/api/admin/projects/milestones/${milestoneId}`);
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      onMilestonesChanged?.();
    } catch (err) {
      fetchMilestones();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="w-full max-w-[880px] max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Wave Background matching In-View Tasks, Budget HUD & Dossier Modals */}
          <div className="relative px-3.5 sm:px-4 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
            {/* Top-Right Fluid Pastel Wave Background */}
            <div className="absolute top-0 right-0 w-[360px] sm:w-[460px] h-full pointer-events-none overflow-hidden z-0">
              <svg
                viewBox="0 0 500 74"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <mask id="milestonesModalWaveFadeMask">
                    <linearGradient id="milestonesModalWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="18%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#milestonesModalWaveFadeGrad)" />
                  </mask>

                  <linearGradient id="milestonesModalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                  </linearGradient>

                  <linearGradient id="milestonesModalWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="milestonesModalWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <g mask="url(#milestonesModalWaveFadeMask)">
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#milestonesModalWaveGrad1)"
                  />
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#milestonesModalWaveGrad2)"
                  />
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#milestonesModalWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left: Squircle Milestone Icon + Project Information */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-indigo-500/20 shrink-0 border border-white/20">
                <i className="bi bi-flag-fill text-amber-300"></i>
              </div>

              <div className="min-w-0">
                {/* Project Title + PRJ-ID Pill */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[13.5px] sm:text-[14.5px] text-slate-900 mb-0 tracking-tight leading-tight truncate">
                    {project.title}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                    PRJ-{String(project.id).padStart(4, "0")}
                  </span>
                </div>

                {/* Subtitle Line with Department, Lead Supervisor & Target Date */}
                <div className="text-[10.5px] sm:text-[11px] text-slate-400 mb-1 font-normal leading-tight truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <i className="bi bi-building text-[9.5px] text-indigo-500"></i>
                    <span>{project.department_name || "General"}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <i className="bi bi-person text-[9.5px] text-emerald-500"></i>
                    <span>Lead: {project.supervisor_name || "Unassigned"}</span>
                  </span>
                  {project.target_date && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <i className="bi bi-calendar-event text-[9.5px] text-amber-500"></i>
                        <span>Target: {project.target_date}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Meta Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold capitalize bg-emerald-50/80 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                    <span>{project.status || "Active"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold bg-indigo-50/80 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                    <i className="bi bi-layers text-[9px] text-indigo-600"></i>
                    <span>Deliverable Milestones Tracker</span>
                  </div>
                  {project.priority && (
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold uppercase shadow-2xs border ${
                        project.priority === "critical"
                          ? "bg-rose-50/80 text-rose-700 border-rose-200"
                          : project.priority === "high"
                          ? "bg-amber-50/80 text-amber-700 border-amber-200"
                          : "bg-indigo-50/60 text-indigo-700 border-indigo-100"
                      }`}
                    >
                      <span>{project.priority}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Add Phase Button + Close Button */}
            <div className="flex items-center gap-2 shrink-0 relative z-10">
              {!isEditingMode && (
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <i className="bi bi-plus-lg text-xs"></i>
                  <span>Add Phase</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs shrink-0"
                title="Close Milestones Tracker"
                aria-label="Close"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>
          </div>

          {/* Executive Telemetry HUD Grid matching In-View Tasks, Squad Roster & Dossier Modals */}
          <div className="bg-slate-50/60 border-b border-slate-200/80 px-3.5 sm:px-4 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
            {/* 1. Milestone Delivery */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Milestone Delivery</span>
                <span className="font-bold text-slate-800 text-[11px]">{overallMilestonePercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1 border border-slate-200/60">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${overallMilestonePercent}%` }}
                ></div>
              </div>
              <div className="text-[9.5px] text-slate-400">
                {completedMilestones} of {totalMilestones} phases completed
              </div>
            </div>

            {/* 2. Deliverable Checklist */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <span>Deliverables Done</span>
                <span className="font-bold text-emerald-700 text-[11px]">
                  {completedDeliverablesCount}/{totalDeliverablesCount}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-200/80 flex items-center gap-1 shadow-2xs">
                  <i className="bi bi-check2-circle text-[8.5px]"></i>
                  <span>{deliverablePercent}% Verified</span>
                </span>
              </div>
            </div>

            {/* 3. Active Execution */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span>Phase Execution</span>
                <i className="bi bi-layers text-indigo-500 text-xs"></i>
              </div>
              <div className="text-[11.5px] font-bold text-slate-800">
                {inProgressMilestones} In Progress
              </div>
              <div className="text-[9.5px] text-slate-400 mt-0.5">
                {pendingMilestones} queued phases
              </div>
            </div>

            {/* 4. Schedule Health */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                <span>Schedule Health</span>
                <i className="bi bi-clock-history text-slate-400 text-xs"></i>
              </div>
              <div className="text-[11.5px] font-bold text-slate-800 truncate">
                {overdueMilestones > 0 ? (
                  <span className="text-rose-600 flex items-center gap-1">
                    <i className="bi bi-exclamation-octagon-fill text-[10px]"></i>
                    <span>{overdueMilestones} Overdue</span>
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <i className="bi bi-shield-check text-[10px]"></i>
                    <span>On Schedule</span>
                  </span>
                )}
              </div>
              <div className="text-[9.5px] text-slate-400 truncate mt-0.5">
                {project.target_date ? `Target: ${project.target_date}` : "Active milestone pacing"}
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 bg-slate-50/40 space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-2xs">
                <div className="flex items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill text-rose-600"></i>
                  <span className="font-medium">{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            )}

            {/* ADD / EDIT MILESTONE FORM CARD */}
            {isEditingMode && (
              <form
                onSubmit={handleSaveMilestoneForm}
                className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs relative overflow-hidden space-y-3.5 animate-in fade-in duration-150"
              >
                {/* Subtle Pastel Wave Accent */}
                <div className="absolute top-0 right-0 w-[260px] h-[85px] pointer-events-none overflow-hidden z-0 opacity-70">
                  <svg viewBox="0 0 400 95" fill="none" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="milestoneFormWave1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.1" />
                        <stop offset="40%" stopColor="#DDD6FE" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.75" />
                      </linearGradient>
                    </defs>
                    <path d="M0,45 C110,15 220,75 400,25 L400,0 L0,0 Z" fill="url(#milestoneFormWave1)" />
                  </svg>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-indigo-600 border border-purple-100 flex items-center justify-center text-base shadow-2xs shrink-0">
                      <i className="bi bi-flag-fill"></i>
                    </div>
                    <div>
                      <h4 className="text-[13px] sm:text-[13.5px] font-bold text-slate-900 mb-0 tracking-tight leading-tight">
                        {editingMilestoneId ? "Edit Milestone Phase" : "Create Sub-Milestone Phase"}
                      </h4>
                      <p className="text-[10px] text-slate-400 mb-0">
                        Configure phase schedule, ownership, lifecycle status & deliverable checklists
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingMode(false)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/80 flex items-center justify-center text-xs cursor-pointer shadow-2xs"
                    title="Close form"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 relative z-10">
                  <div className="md:col-span-8">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phase Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Phase 1: MVP Architecture & Schema Setup"
                      required
                      className="w-full h-9 px-3 text-xs font-medium rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Due Date
                    </label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full h-9 px-3 text-xs font-medium rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Milestone Owner
                    </label>
                    <select
                      value={formOwnerId}
                      onChange={(e) => setFormOwnerId(e.target.value)}
                      className="w-full h-9 px-3 text-xs font-medium rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {supervisors.map((s) => (
                        <option key={s.id} value={String(s.id)}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Lifecycle Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full h-9 px-3 text-xs font-medium rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="in_progress">⚡ In Progress</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                  </div>

                  <div className="md:col-span-12">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phase Scope & Description
                    </label>
                    <textarea
                      rows={2}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Deliverable parameters, verification protocols, architectural requirements..."
                      className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs resize-none"
                    ></textarea>
                  </div>

                  {/* Deliverables Checklist Builder */}
                  <div className="md:col-span-12">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Deliverable Checklists
                    </label>
                    <div className="space-y-1.5 mb-2">
                      {formDeliverables.map((delText, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <i className="bi bi-check2-square text-indigo-600"></i>
                            <span className="font-medium text-slate-800">{delText}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFormDeliverables((prev) => prev.filter((_, i) => i !== idx))
                            }
                            className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs cursor-pointer transition-colors"
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Checklist Input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newFormDeliverableText}
                        onChange={(e) => setNewFormDeliverableText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (newFormDeliverableText.trim()) {
                              setFormDeliverables((prev) => [...prev, newFormDeliverableText.trim()]);
                              setNewFormDeliverableText("");
                            }
                          }
                        }}
                        placeholder="Add specific deliverable checklist item (Press Enter)..."
                        className="flex-1 h-9 px-3 text-xs font-medium rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newFormDeliverableText.trim()) {
                            setFormDeliverables((prev) => [...prev, newFormDeliverableText.trim()]);
                            setNewFormDeliverableText("");
                          }
                        }}
                        className="h-9 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs text-xs font-semibold cursor-pointer shrink-0 transition-all"
                      >
                        + Add Item
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200/80 relative z-10">
                  <button
                    type="button"
                    onClick={() => setIsEditingMode(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingForm}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                  >
                    {savingForm ? "Saving..." : editingMilestoneId ? "Update Milestone" : "Create Milestone"}
                  </button>
                </div>
              </form>
            )}

            {/* LIST OF NESTED MILESTONE PHASES */}
            {loading ? (
              <div className="py-16 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-xs font-medium">Loading deliverable milestones...</span>
              </div>
            ) : milestones.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-indigo-600 border border-purple-100 flex items-center justify-center text-lg mx-auto mb-3 shadow-2xs">
                  <i className="bi bi-calendar2-range-fill"></i>
                </div>
                <h4 className="text-[13px] font-bold text-slate-900 mb-1 tracking-tight">No Nested Milestones Yet</h4>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                  Deconstruct this initiative into phased deliverable milestones (MVP Architecture, Beta Rollout, Final Signoff) with checklists.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-98"
                >
                  <i className="bi bi-plus-lg text-xs"></i>
                  <span>Create Phase 1 Milestone</span>
                </button>
              </div>
          ) : (
            <div className="space-y-2.5">
              {milestones.map((milestone, idx) => {
                const isCompleted = milestone.status === "completed";
                const totalDel = milestone.deliverables?.length || 0;
                const completedDel = milestone.deliverables?.filter((d) => d.completed).length || 0;
                const percent = totalDel > 0 ? Math.round((completedDel / totalDel) * 100) : isCompleted ? 100 : 0;

                let isOverdue = false;
                let daysLeft = null;
                if (milestone.due_date) {
                  const diff = new Date(milestone.due_date).getTime() - Date.now();
                  daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                  if (daysLeft < 0 && !isCompleted) isOverdue = true;
                }

                return (
                  <div
                    key={milestone.id}
                    className={`relative rounded-xl border transition-all overflow-hidden bg-white ${
                      isCompleted
                        ? "border-emerald-200/90 shadow-2xs"
                        : isOverdue
                        ? "border-rose-200/90 shadow-2xs ring-1 ring-rose-200"
                        : "border-slate-200/90 shadow-2xs hover:shadow-xs"
                    }`}
                  >
                    {/* Top Status Banner Strip */}
                    <div
                      className={`h-1 w-full ${
                        isCompleted
                          ? "bg-emerald-500"
                          : milestone.status === "in_progress"
                          ? "bg-indigo-500"
                          : "bg-slate-300"
                      }`}
                    ></div>

                    <div className="p-3 sm:p-3.5">
                      {/* Milestone Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Large Checkbox for 1-Click Milestone Completion */}
                          <button
                            type="button"
                            onClick={() => handleToggleMilestone(milestone)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 ${
                              isCompleted
                                ? "bg-emerald-500 border-emerald-600 text-white shadow-xs"
                                : "bg-white hover:bg-slate-50 border-slate-300 text-transparent hover:text-slate-300"
                            }`}
                            title={isCompleted ? "Mark Phase Incomplete" : "Mark Phase Complete"}
                          >
                            <i className="bi bi-check-lg text-sm font-black"></i>
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Phase {idx + 1}
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded-md text-[10px] font-semibold border ${
                                  isCompleted
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : milestone.status === "in_progress"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {isCompleted
                                  ? "✅ Completed"
                                  : milestone.status === "in_progress"
                                  ? "⚡ In Progress"
                                  : "⏳ Pending"}
                              </span>

                              {/* Due Date Indicator */}
                              {milestone.due_date && (
                                <span
                                  className={`px-2 py-0.2 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${
                                    isOverdue
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : daysLeft !== null && daysLeft <= 7
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  <i className="bi bi-calendar-event text-[9px]"></i>
                                  <span>
                                    Due:{" "}
                                    {new Date(milestone.due_date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                    {daysLeft !== null && (
                                      <strong className="ml-1">
                                        ({daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})
                                      </strong>
                                    )}
                                  </span>
                                </span>
                              )}
                            </div>

                            <h4
                              className={`text-sm sm:text-base font-bold mb-0.5 tracking-tight ${
                                isCompleted ? "text-slate-500 line-through" : "text-slate-900"
                              }`}
                            >
                              {milestone.title}
                            </h4>

                            {milestone.description && (
                              <p className="text-xs text-slate-500 mb-0 leading-relaxed">
                                {milestone.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Owner Badge & Edit/Delete Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          {milestone.owner_name && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {milestone.owner_name.charAt(0)}
                              </div>
                              <span className="text-[11px] font-medium text-slate-700">
                                {milestone.owner_name}
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(milestone)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Edit Milestone"
                          >
                            <i className="bi bi-pencil-fill text-[11px]"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMilestone(milestone.id)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
                            title="Delete Milestone"
                          >
                            <i className="bi bi-trash-fill text-[11px]"></i>
                          </button>
                        </div>
                      </div>

                      {/* Deliverables Checklist Box */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 rounded-xl bg-slate-50/70 p-2.5">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <i className="bi bi-check2-circle text-indigo-500"></i>
                            <span>
                              Deliverable Checklist ({completedDel} of {totalDel} Completed)
                            </span>
                          </span>

                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            {percent}% Velocity
                          </span>
                        </div>

                        {/* Deliverables List */}
                        <div className="space-y-1 mb-2">
                          {milestone.deliverables?.map((del) => (
                            <div
                              key={del.id}
                              className={`flex items-center justify-between px-2.5 py-1 rounded-lg border transition-all ${
                                del.completed
                                  ? "bg-emerald-50/60 border-emerald-200/80"
                                  : "bg-white border-slate-200/80 hover:border-slate-300"
                              }`}
                            >
                              <label className="flex items-center cursor-pointer select-none flex-1 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={del.completed}
                                  onChange={() =>
                                    handleToggleDeliverable(milestone.id, del.id, del.completed)
                                  }
                                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600 shrink-0"
                                />
                                <span
                                  className={`text-xs font-medium truncate ${
                                    del.completed ? "text-emerald-800 line-through opacity-75" : "text-slate-800"
                                  }`}
                                  style={{ marginLeft: "6px" }}
                                >
                                  {del.title}
                                </span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveDeliverable(milestone, del.id)}
                                className="text-slate-300 hover:text-rose-500 text-xs cursor-pointer ml-2"
                                title="Remove checklist item"
                              >
                                <i className="bi bi-x"></i>
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Inline Deliverable Quick Add */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newDeliverableInput[String(milestone.id)] || ""}
                            onChange={(e) =>
                              setNewDeliverableInput({
                                ...newDeliverableInput,
                                [String(milestone.id)]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddInlineDeliverable(milestone);
                              }
                            }}
                            placeholder="Add deliverable checklist item (Press Enter)..."
                            className="flex-1 h-8 px-2.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:border-indigo-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddInlineDeliverable(milestone)}
                            className="h-8 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shrink-0 transition-colors"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Total Sub-Milestones: <strong className="text-slate-800">{totalMilestones}</strong> | Deliverable Items:{" "}
            <strong className="text-slate-800">{totalDeliverablesCount}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Tracker
          </button>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

