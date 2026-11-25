import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
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

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Fluid Pastel Wave Background matching Squad Roster & Dossier Modals */}
          <div className="relative px-3.5 sm:px-4 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
            {/* Top-Right Fluid Pastel Wave Background */}
            <div className="absolute top-0 right-0 w-[280px] sm:w-[360px] h-full pointer-events-none overflow-hidden z-0">
              <svg
                viewBox="0 0 500 74"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <mask id="quickAddModalWaveFadeMask">
                    <linearGradient id="quickAddModalWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="18%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#quickAddModalWaveFadeGrad)" />
                  </mask>

                  <linearGradient id="quickAddModalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                  </linearGradient>

                  <linearGradient id="quickAddModalWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="quickAddModalWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <g mask="url(#quickAddModalWaveFadeMask)">
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#quickAddModalWaveGrad1)"
                  />
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#quickAddModalWaveGrad2)"
                  />
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#quickAddModalWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left: Squircle Plus Icon + Title Information */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-indigo-500/20 shrink-0 border border-white/20">
                <i className="bi bi-plus-circle text-amber-300"></i>
              </div>

              <div className="min-w-0">
                {/* Project Title + PRJ-ID Pill */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[13.5px] sm:text-[14.5px] text-slate-900 mb-0 tracking-tight leading-tight truncate">
                    Quick Add Project Task
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                    PRJ-{String(project.id).padStart(4, "0")}
                  </span>
                </div>

                {/* Subtitle Line with Project Title & Department */}
                <div className="text-[10.5px] sm:text-[11px] text-slate-400 mb-0.5 font-normal leading-tight truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-600">{project.title}</span>
                  {project.department_name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <i className="bi bi-building text-[9.5px] text-indigo-500"></i>
                        <span>{project.department_name}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs shrink-0 relative z-10"
              title="Close Modal"
              aria-label="Close"
            >
              <i className="bi bi-x-lg text-xs"></i>
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 bg-slate-50/40">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 shadow-2xs">
                <i className="bi bi-exclamation-triangle-fill text-rose-600 shrink-0"></i>
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-2xs">
                <i className="bi bi-check-circle-fill text-emerald-600 shrink-0"></i>
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Implement OAuth2 integration & unit tests"
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>

            {/* Assignee */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-0">
                  Assignee
                </label>
                {loadingSquad && (
                  <span className="text-[10px] text-slate-400 animate-pulse font-medium">
                    Loading squad members...
                  </span>
                )}
              </div>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 shadow-2xs">
                  {(
                    [
                      { id: "low", label: "Low", color: "text-emerald-700", active: "bg-emerald-600 text-white shadow-xs font-bold" },
                      { id: "medium", label: "Med", color: "text-indigo-700", active: "bg-indigo-600 text-white shadow-xs font-bold" },
                      { id: "high", label: "High", color: "text-amber-700", active: "bg-amber-600 text-white shadow-xs font-bold" },
                      { id: "urgent", label: "Urgent", color: "text-rose-700", active: "bg-rose-600 text-white shadow-xs font-bold" },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`py-1.5 rounded-lg text-[10.5px] transition-all cursor-pointer text-center leading-none ${
                        priority === p.id
                          ? p.active
                          : `${p.color} hover:bg-white/80 font-semibold`
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all cursor-pointer h-[35px]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10.5px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description & Acceptance Criteria <span className="text-slate-400 font-normal lowercase tracking-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline deliverables, technical notes, or edge cases..."
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs transition-all"
              ></textarea>
            </div>

            {/* Action buttons footer matching Squad Roster & Tasks modal standard */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                <span>Governance Certified Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer active:scale-98"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
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
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
