import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

interface QuickAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: number | string;
    title: string;
    department_name?: string;
    department_id?: number | string;
    target_date?: string;
  } | null;
  onTaskCreated?: () => void;
}

export const QuickAddTaskModal: React.FC<QuickAddTaskModalProps> = ({
  isOpen,
  onClose,
  project,
  onTaskCreated,
}) => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDate, setDueDate] = useState<string>("");

  const [squadMembers, setSquadMembers] = useState<any[]>([]);
  const [availableCandidates, setAvailableCandidates] = useState<any[]>([]);
  const [loadingSquad, setLoadingSquad] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen && project?.id) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setErrorMsg("");
      setSuccessMsg("");

      // Default due date to 7 days from now or project target_date
      if (project.target_date) {
        setDueDate(project.target_date.split("T")[0]);
      } else {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setDueDate(nextWeek.toISOString().split("T")[0]);
      }

      // Fetch squad members and candidates
      const loadSquad = async () => {
        try {
          setLoadingSquad(true);
          const res = await api.get(`/api/admin/projects/${project.id}/members`);
          if (res.data.status) {
            setSquadMembers(res.data.members || []);
            setAvailableCandidates(res.data.available_users || []);
            if (res.data.members && res.data.members.length > 0) {
              setAssignedTo(String(res.data.members[0].user_id));
            } else if (res.data.available_users && res.data.available_users.length > 0) {
              setAssignedTo(String(res.data.available_users[0].id));
            } else {
              setAssignedTo("");
            }
          }
        } catch (err: any) {
          console.warn("Could not load squad members for quick add task:", err);
        } finally {
          setLoadingSquad(false);
        }
      };
      loadSquad();

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, project?.id]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a task title");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await api.post(`/api/admin/projects/${project.id}/tasks`, {
        title: title.trim(),
        description: description.trim(),
        assigned_to: assignedTo ? Number(assignedTo) : null,
        priority,
        due_date: dueDate || null,
      });

      if (res.data.status) {
        setSuccessMsg("Task successfully dispatched to initiative!");
        setTimeout(() => {
          if (onTaskCreated) onTaskCreated();
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to create project task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRJ-{String(project.id).padStart(4, "0")}
              </span>
              <span className="text-xs text-indigo-200 font-semibold truncate max-w-[240px]">
                {project.title}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-0 flex items-center gap-2">
              <i className="bi bi-plus-circle text-indigo-400"></i>
              <span>Quick Add Project Task</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-rose-600 shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <i className="bi bi-check-circle-fill text-emerald-600 shrink-0"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Implement OAuth2 integration & unit tests"
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Assignee */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 mb-0">
                Assignee
              </label>
              {loadingSquad && (
                <span className="text-[10px] text-slate-400 animate-pulse">
                  Loading squad members...
                </span>
              )}
            </div>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Unassigned (Open for Claiming)</option>
              {squadMembers.length > 0 && (
                <optgroup label="── Project Squad Members ──">
                  {squadMembers.map((m) => (
                    <option key={`squad-${m.user_id}`} value={m.user_id}>
                      {m.name} ({m.role_tag || "Contributor"}) {m.capacity_status === "overloaded" ? "⚠️ Overloaded" : ""}
                    </option>
                  ))}
                </optgroup>
              )}
              {availableCandidates.length > 0 && (
                <optgroup label="── Other Departmental Personnel ──">
                  {availableCandidates.map((c) => (
                    <option key={`avail-${c.id}`} value={c.id}>
                      {c.name} ({c.role} • {c.department_name || "General"})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Priority & Due Date in 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🔵 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent / Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description & Acceptance Criteria <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline deliverables, technical notes, or edge cases..."
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill text-xs"></i>
                  <span>Dispatch Task</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
