import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  supervisors: Array<{
    id: number;
    name: string;
    email: string;
    phone?: string;
    active_projects_count?: number;
    team_size?: number;
  }>;
  projectToEdit?: {
    id: number;
    title: string;
    description?: string;
    lead_supervisor_id: number | string;
    target_date: string;
    status?: "planning" | "active" | "completed";
  } | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  supervisors,
  projectToEdit,
}) => {
  const isEditMode = Boolean(projectToEdit);

  const [form, setForm] = useState({
    title: "",
    description: "",
    lead_supervisor_id: "",
    target_date: "",
    status: "active" as "planning" | "active" | "completed",
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (projectToEdit) {
      setForm({
        title: projectToEdit.title || "",
        description: projectToEdit.description || "",
        lead_supervisor_id: projectToEdit.lead_supervisor_id ? String(projectToEdit.lead_supervisor_id) : "",
        target_date: projectToEdit.target_date ? new Date(projectToEdit.target_date).toISOString().slice(0, 10) : "",
        status: projectToEdit.status || "active",
      });
    } else {
      setForm({
        title: "",
        description: "",
        lead_supervisor_id: supervisors.length > 0 ? String(supervisors[0].id) : "",
        target_date: "",
        status: "active",
      });
    }
    setErrorMsg("");
  }, [projectToEdit, supervisors, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !saving) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrorMsg("Please enter a valid project milestone title.");
      return;
    }
    if (!form.lead_supervisor_id) {
      setErrorMsg("Please select an operational lead supervisor.");
      return;
    }
    if (!form.target_date) {
      setErrorMsg("Please specify the target completion date.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      // Import axios dynamically to ensure instance configuration
      const { default: api } = await import("../../../api/axios");

      if (isEditMode && projectToEdit) {
        const res = await api.put(`/api/manager/projects/${projectToEdit.id}`, {
          title: form.title.trim(),
          description: form.description.trim(),
          lead_supervisor_id: Number(form.lead_supervisor_id),
          target_date: form.target_date,
          status: form.status,
        });
        if (res.data.status) {
          onSuccess(res.data.message || `Milestone "${form.title}" updated successfully.`);
          onClose();
        } else {
          setErrorMsg(res.data.error || "Failed to update project milestone.");
        }
      } else {
        const res = await api.post("/api/manager/projects", {
          title: form.title.trim(),
          description: form.description.trim(),
          lead_supervisor_id: Number(form.lead_supervisor_id),
          target_date: form.target_date,
        });
        if (res.data.status) {
          onSuccess(res.data.message || `Initiative "${form.title}" launched successfully.`);
          onClose();
        } else {
          setErrorMsg(res.data.error || "Failed to create project milestone.");
        }
      }
    } catch (err: any) {
      console.error("Save project error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to save project. Please verify inputs.");
    } finally {
      setSaving(false);
    }
  };

  const selectedSupervisor = supervisors.find((s) => String(s.id) === form.lead_supervisor_id);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={!saving ? onClose : undefined}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Header Banner */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-4.5 bg-gradient-to-r from-[#070d28] via-[#0d164d] to-[#1c1252] text-white border-b border-indigo-500/20 flex items-center justify-between">
          {/* Subtle Silk Wave Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <svg className="w-full h-full" viewBox="0 0 500 80" preserveAspectRatio="none" fill="none">
              <path d="M0,20 C150,70 300,10 500,40 L500,0 L0,0 Z" fill="#818cf8" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base font-bold shadow-md shadow-indigo-500/30 shrink-0">
              <i className={`bi ${isEditMode ? "bi-pencil-square" : "bi-kanban-fill"}`}></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-[17px] font-bold text-white tracking-tight leading-tight truncate">
                {isEditMode ? "Modify Project Milestone" : "Launch Department Milestone"}
              </h3>
              <p className="text-xs text-indigo-200/80 mt-0.5 leading-tight truncate">
                {isEditMode ? "Update target timelines, supervisor ownership, and status" : "Define strategic deliverables and designate lead supervisor"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="relative z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs shrink-0"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <i className="bi bi-exclamation-triangle-fill text-rose-500 shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Project Initiative Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center h-10 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-3">
              <i className="bi bi-bookmark-fill text-slate-400 text-xs mr-2 shrink-0"></i>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Enterprise Microservices Migration Q4"
                className="w-full text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 bg-transparent outline-none font-medium"
              />
            </div>
          </div>

          {/* Lead Supervisor Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Lead Supervisor (Operational Owner) <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center h-10 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-3">
              <i className="bi bi-person-badge-fill text-amber-500 text-xs mr-2 shrink-0"></i>
              <select
                required
                value={form.lead_supervisor_id}
                onChange={(e) => setForm({ ...form, lead_supervisor_id: e.target.value })}
                className="w-full text-xs sm:text-[13px] text-slate-800 bg-transparent outline-none font-medium cursor-pointer"
              >
                <option value="" disabled>
                  Select Designated Supervisor...
                </option>
                {supervisors.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.email}) — {sup.active_projects_count || 0} active initiatives
                  </option>
                ))}
              </select>
            </div>
            {selectedSupervisor && (
              <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <i className="bi bi-check-circle-fill text-amber-600 text-[10px]"></i>
                  <span>Direct team capacity: <strong>{selectedSupervisor.team_size || 0}</strong> staff</span>
                </span>
                <span className="text-[10px] text-amber-700 font-semibold">
                  {selectedSupervisor.active_projects_count || 0} running projects
                </span>
              </div>
            )}
          </div>

          {/* Row: Target Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Target Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Target Deadline <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center h-10 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-3">
                <i className="bi bi-calendar-event text-slate-400 text-xs mr-2 shrink-0"></i>
                <input
                  type="date"
                  required
                  value={form.target_date}
                  onChange={(e) => setForm({ ...form, target_date: e.target.value })}
                  className="w-full text-xs sm:text-[13px] text-slate-800 bg-transparent outline-none font-medium cursor-pointer"
                />
              </div>
            </div>

            {/* Status (Visible in Edit mode or defaults to active) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Milestone Status
              </label>
              <div className="relative flex items-center h-10 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all px-3">
                <i className="bi bi-flag-fill text-indigo-500 text-xs mr-2 shrink-0"></i>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full text-xs sm:text-[13px] text-slate-800 bg-transparent outline-none font-medium cursor-pointer capitalize"
                >
                  <option value="planning">Planning (Draft)</option>
                  <option value="active">Active Execution</option>
                  <option value="completed">Completed & Signed Off</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description & Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Scope, Goals & Deliverables
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Outline project objectives, key milestones, deliverables, and acceptance criteria..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none text-xs sm:text-[13px] text-slate-800 placeholder:text-slate-400 font-medium transition-all"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className={`bi ${isEditMode ? "bi-check2-circle" : "bi-rocket-takeoff-fill"} text-xs font-bold`}></i>
                  <span>{isEditMode ? "Save Changes" : "Launch Initiative"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
