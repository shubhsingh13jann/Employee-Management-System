import React, { useState, useEffect } from "react";
import { ProjectItem } from "../../../pages/admin/AdminProjects";

interface DepartmentOption {
  id: number | string;
  name: string;
}

interface SupervisorOption {
  id: number | string;
  name: string;
  department_id?: number | string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<boolean | void>;
  editingProject?: ProjectItem | null;
  departments: DepartmentOption[];
  supervisors: SupervisorOption[];
  saving: boolean;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProject,
  departments,
  supervisors,
  saving,
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    department_id: "",
    lead_supervisor_id: "",
    status: "planning",
    priority: "medium",
    budget: "",
    start_date: "",
    target_date: "",
  });

  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (editingProject) {
      setForm({
        title: editingProject.title || "",
        description: editingProject.description || "",
        department_id: String(editingProject.department_id || ""),
        lead_supervisor_id: String(editingProject.lead_supervisor_id || ""),
        status: editingProject.status || "planning",
        priority: editingProject.priority || "medium",
        budget: editingProject.budget ? String(editingProject.budget) : "",
        start_date: editingProject.start_date ? editingProject.start_date.split("T")[0] : "",
        target_date: editingProject.target_date ? editingProject.target_date.split("T")[0] : "",
      });
    } else {
      setForm({
        title: "",
        description: "",
        department_id: departments.length > 0 ? String(departments[0].id) : "",
        lead_supervisor_id: "",
        status: "planning",
        priority: "medium",
        budget: "",
        start_date: new Date().toISOString().split("T")[0],
        target_date: "",
      });
    }
    setError("");
  }, [editingProject, isOpen, departments]);

  if (!isOpen) return null;

  // Filter supervisors matching selected department or unassigned
  const eligibleSupervisors = form.department_id
    ? supervisors.filter(
        (s) => !s.department_id || String(s.department_id) === String(form.department_id)
      )
    : supervisors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Strategic initiative title is required.");
      return;
    }
    if (!form.department_id) {
      setError("Please select an organizing department.");
      return;
    }

    try {
      setError("");
      await onSubmit(form);
    } catch (err: any) {
      setError(err?.message || "Failed to save initiative");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
              <i className="bi bi-kanban-fill"></i>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white mb-0">
                {editingProject ? "Edit Strategic Initiative" : "Launch Strategic Initiative"}
              </h3>
              <p className="text-[10px] text-slate-300 mb-0">
                {editingProject
                  ? "Update parameters, deadlines, or lead supervisor allocation"
                  : "Establish a company-wide project across departments"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs">
              <i className="bi bi-exclamation-triangle-fill text-rose-500"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Initiative Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Core Platform Redesign 2026"
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Scope & Business Objectives
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide strategic deliverables, business milestones, and target outcomes..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
            ></textarea>
          </div>

          {/* Department & Lead Supervisor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Organizing Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value, lead_supervisor_id: "" })}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lead Supervisor (Team Lead)
              </label>
              <select
                value={form.lead_supervisor_id}
                onChange={(e) => setForm({ ...form, lead_supervisor_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="">Unassigned (Assign Later)</option>
                {eligibleSupervisors.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status, Priority & Budget Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lifecycle Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="planning">Planning</option>
                <option value="active">Active Execution</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Strategic Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="critical">🔴 Critical Priority</option>
                <option value="high">🟠 High Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="low">🟢 Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Budget Allocation ($)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Timeline Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Target Milestone Deadline
              </label>
              <input
                type="date"
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Initiative...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle text-xs"></i>
                  <span>{editingProject ? "Update Initiative" : "Launch Initiative"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
