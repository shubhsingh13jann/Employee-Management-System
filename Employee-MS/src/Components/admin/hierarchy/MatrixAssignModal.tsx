import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

export interface MatrixAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
  availableSupervisors: Array<{
    id: string | number;
    name: string;
    email?: string;
    department_name?: string;
    department?: string;
  }>;
  availableProjects?: Array<{
    id: string | number;
    title?: string;
    name?: string;
  }>;
  onSuccess?: (message: string) => void;
}

export const MatrixAssignModal: React.FC<MatrixAssignModalProps> = ({
  isOpen,
  onClose,
  employee,
  availableSupervisors,
  availableProjects = [],
  onSuccess,
}) => {
  const [secondarySupervisorId, setSecondarySupervisorId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [roleTitle, setRoleTitle] = useState<string>("Dotted-Line Member");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (isOpen && employee) {
      setErrorMsg("");
      setSecondarySupervisorId("");
      setProjectId("");
      setRoleTitle("Dotted-Line Member");
    }
  }, [isOpen, employee]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen || !employee) return null;

  const empId = employee.employee_id || employee.id;
  const empName = employee.employee_name || employee.name;
  const empEmail = employee.employee_email || employee.email;
  const primarySupervisorId = employee.supervisor_id;

  // Filter out the employee themselves and their primary supervisor
  const eligibleSupervisors = availableSupervisors.filter(
    (s) =>
      String(s.id) !== String(empId) &&
      String(s.id) !== String(primarySupervisorId)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!secondarySupervisorId) {
      setErrorMsg("Please select a secondary (dotted-line) supervisor.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/api/admin/hierarchy/secondary", {
        employee_id: empId,
        secondary_supervisor_id: secondarySupervisorId,
        project_id: projectId ? Number(projectId) : null,
        role_title: roleTitle.trim() || "Dotted-Line Member",
      });

      if (res.data?.status) {
        onSuccess?.(res.data.message || "Dotted-line reporting assigned successfully!");
        onClose();
      } else {
        setErrorMsg(res.data?.error || "Failed to assign dotted-line reporting");
      }
    } catch (err: any) {
      console.error("Assign matrix error:", err);
      setErrorMsg(
        err.response?.data?.error || "Failed to assign secondary reporting relationship."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const quickRoles = [
    "Dotted-Line Member",
    "Technical Mentor",
    "Project Lead",
    "Scrum Master",
    "Functional SME",
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Purple/Violet Wave Background */}
        <div className="relative px-4 sm:px-5 py-2.5 sm:py-3 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-[380px] sm:w-[480px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <mask id="matrixWaveFadeMask">
                  <linearGradient id="matrixWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="25%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#matrixWaveFadeGrad)" />
                </mask>

                <linearGradient id="matrixWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.25" />
                  <stop offset="30%" stopColor="#DDD6FE" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#EDE9FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="matrixWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.85" />
                  <stop offset="85%" stopColor="#EDE9FE" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FAF5FF" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="matrixWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#FAF5FF" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              <g mask="url(#matrixWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#matrixWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#matrixWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#matrixWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/80 text-purple-600 flex items-center justify-center text-base shadow-2xs shrink-0">
              <i className="bi bi-diagram-2"></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-normal mb-0">
                Assign Dotted-Line Matrix Reporting
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mb-0 font-normal leading-normal mt-0.5 truncate">
                Cross-functional agile squads, project leads, or dual-reporting relationships
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer relative z-10"
            title="Close modal (Esc)"
          >
            <i className="bi bi-x text-lg"></i>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 space-y-3 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-rose-500 shrink-0"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Employee Profile Preview Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 select-none">
                {empName ? empName.charAt(0) : "E"}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-sm mb-0 truncate">
                  {empName}
                </h4>
                <p className="text-xs text-slate-400 mb-0 truncate mt-0.5">
                  {empEmail}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span>EMP-{String(empId).padStart(4, "0")}</span>
                  <span>•</span>
                  <span>{employee.department_name || "General"}</span>
                  {employee.supervisor_name && (
                    <>
                      <span>•</span>
                      <span>Primary: {employee.supervisor_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Secondary / Dotted-Line Supervisor Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Secondary / Dotted-Line Supervisor <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all overflow-hidden h-9.5">
                <div className="w-9.5 h-9.5 flex items-center justify-center bg-slate-50/70 border-r border-slate-100 text-purple-600 text-sm shrink-0">
                  <i className="bi bi-person-fill-gear"></i>
                </div>
                <select
                  value={secondarySupervisorId}
                  onChange={(e) => setSecondarySupervisorId(e.target.value)}
                  required
                  className="w-full bg-transparent px-3 text-xs font-medium text-slate-900 focus:outline-hidden appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select cross-functional / matrix supervisor --
                  </option>
                  {eligibleSupervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (SUP-{String(s.id).padStart(4, "0")} • {s.department_name || s.department || "General"})
                    </option>
                  ))}
                </select>
                <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs"></i>
              </div>
            </div>

            {/* Matrix Role Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Dotted-Line Role Title
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Dotted-Line Member, Technical Mentor..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-medium shadow-2xs focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {quickRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleTitle(role)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-600 transition-colors cursor-pointer"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Project Assignment */}
            {availableProjects.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Associated Project / Initiative (Optional)
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all overflow-hidden h-9.5">
                  <div className="w-9.5 h-9.5 flex items-center justify-center bg-slate-50/70 border-r border-slate-100 text-purple-600 text-sm shrink-0">
                    <i className="bi bi-kanban"></i>
                  </div>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-transparent px-3 text-xs font-medium text-slate-900 focus:outline-hidden appearance-none cursor-pointer"
                  >
                    <option value="">-- No specific project (General matrix link) --</option>
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || p.name || `Project #${p.id}`}
                      </option>
                    ))}
                  </select>
                  <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs"></i>
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <i className="bi bi-x-lg text-xs text-slate-500"></i>
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={submitting || !secondarySupervisorId}
              className="px-5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-link-45deg text-sm"></i>
                  <span>Assign Matrix Link</span>
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
