import React, { useState, useEffect } from "react";
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
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Milestone Progress Summary
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const totalDeliverablesCount = milestones.reduce((sum, m) => sum + (m.deliverables?.length || 0), 0);
  const completedDeliverablesCount = milestones.reduce(
    (sum, m) => sum + (m.deliverables?.filter((d) => d.completed).length || 0),
    0
  );
  const overallMilestonePercent =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header with Project Context & Progress Gauge */}
        <div className="relative px-5 py-4 bg-gradient-to-r from-[#070d28] via-[#0d164d] to-[#1c1252] text-white border-b border-indigo-500/30 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  PRJ-{String(project.id).padStart(4, "0")}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  🏢 {project.department_name || "General"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  👷 {project.supervisor_name || "Unassigned"}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate mb-0.5">
                {project.title}
              </h3>
              <p className="text-xs text-indigo-200/80 mb-0 font-normal">
                Interactive Sub-Milestones & Deliverable Checklists Tracker
              </p>
            </div>

            {/* Quick Actions & Close Button */}
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              {!isEditingMode && (
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <i className="bi bi-plus-lg text-xs"></i>
                  <span>Add Phase</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>

          {/* Progress Telemetry Ribbon */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 text-[11px]">Milestone Delivery:</span>
              <strong className="text-white font-bold text-xs">
                {completedMilestones} of {totalMilestones} Phases Completed ({overallMilestonePercent}%)
              </strong>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-300 text-[11px]">
                Deliverable Checklist: <strong className="text-emerald-400">{completedDeliverablesCount}</strong>/{totalDeliverablesCount} Done
              </span>
              <div className="w-28 sm:w-36 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-300"
                  style={{ width: `${overallMilestonePercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 bg-slate-50/50 space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-rose-500"></i>
              <span>{error}</span>
            </div>
          )}

          {/* ADD / EDIT MILESTONE FORM TRAY */}
          {isEditingMode && (
            <form
              onSubmit={handleSaveMilestoneForm}
              className="p-4 rounded-xl bg-white border border-indigo-200 shadow-sm space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <i className="bi bi-flag-fill text-indigo-600"></i>
                  <span>{editingMilestoneId ? "Edit Milestone Phase" : "Create Sub-Milestone Phase"}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingMode(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phase Title *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Phase 1: MVP Architecture & Schema Setup"
                    required
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none cursor-pointer"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Milestone Owner
                  </label>
                  <select
                    value={formOwnerId}
                    onChange={(e) => setFormOwnerId(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none cursor-pointer"
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none cursor-pointer"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="in_progress">⚡ In Progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>

                <div className="md:col-span-12">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phase Scope & Description
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Deliverable parameters, verification protocols, architectural requirements..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none resize-none"
                  ></textarea>
                </div>

                {/* Deliverables Checklist Builder */}
                <div className="md:col-span-12">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Deliverable Checklists
                  </label>
                  <div className="space-y-1.5 mb-2">
                    {formDeliverables.map((delText, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <i className="bi bi-check2-square text-indigo-500"></i>
                          <span className="font-medium text-slate-800">{delText}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormDeliverables((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-rose-600 text-xs cursor-pointer"
                        >
                          <i className="bi bi-trash"></i>
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
                      className="flex-1 h-8.5 px-3 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newFormDeliverableText.trim()) {
                          setFormDeliverables((prev) => [...prev, newFormDeliverableText.trim()]);
                          setNewFormDeliverableText("");
                        }
                      }}
                      className="h-8.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingMode(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingForm ? "Saving..." : editingMilestoneId ? "Update Milestone" : "Create Milestone"}
                </button>
              </div>
            </form>
          )}

          {/* LIST OF NESTED MILESTONE PHASES */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Loading deliverable milestones...</span>
            </div>
          ) : milestones.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mx-auto mb-3 shadow-xs">
                <i className="bi bi-calendar2-range-fill"></i>
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">No Nested Milestones Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Deconstruct this initiative into phased deliverable milestones (MVP Architecture, Beta Rollout, Final Signoff) with checklists.
              </p>
              <button
                type="button"
                onClick={handleOpenAddForm}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                + Create Phase 1 Milestone
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
  );
};

