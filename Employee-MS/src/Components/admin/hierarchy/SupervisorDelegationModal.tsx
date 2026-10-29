import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

export interface SupervisorDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  supervisor: {
    id: string | number;
    name: string;
    email?: string;
    department_name?: string;
    memberCount?: number;
    acting_supervisor_id?: string | number | null;
    acting_supervisor_name?: string | null;
    delegation_start_date?: string | null;
    delegation_end_date?: string | null;
    delegation_reason?: string | null;
  } | null;
  availableSupervisors: Array<{
    id: string | number;
    name: string;
    email?: string;
    department_name?: string;
    department?: string;
  }>;
  onSuccess?: (message: string) => void;
}

export const SupervisorDelegationModal: React.FC<SupervisorDelegationModalProps> = ({
  isOpen,
  onClose,
  supervisor,
  availableSupervisors,
  onSuccess,
}) => {
  const [actingSupervisorId, setActingSupervisorId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // Default 2 weeks
    return d.toISOString().slice(0, 10);
  });
  const [reason, setReason] = useState<string>("Temporary Leave Coverage");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [revoking, setRevoking] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (supervisor && isOpen) {
      setErrorMsg("");
      if (supervisor.acting_supervisor_id) {
        setActingSupervisorId(String(supervisor.acting_supervisor_id));
      } else {
        const eligible = availableSupervisors.filter(
          (s) => String(s.id) !== String(supervisor.id)
        );
        setActingSupervisorId(eligible.length > 0 ? String(eligible[0].id) : "");
      }
      if (supervisor.delegation_start_date) {
        setStartDate(supervisor.delegation_start_date.slice(0, 10));
      }
      if (supervisor.delegation_end_date) {
        setEndDate(supervisor.delegation_end_date.slice(0, 10));
      }
      if (supervisor.delegation_reason) {
        setReason(supervisor.delegation_reason);
      }
    }
  }, [supervisor, availableSupervisors, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !revoking) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting, revoking]);

  if (!isOpen || !supervisor) return null;

  const eligibleCandidates = availableSupervisors.filter(
    (s) => String(s.id) !== String(supervisor.id)
  );

  const hasActiveDelegation = Boolean(
    supervisor.acting_supervisor_name && supervisor.acting_supervisor_id
  );

  const handleActivateDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!actingSupervisorId) {
      setErrorMsg("Please select an acting team lead.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg("Please define the delegation start and end dates.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg("End date cannot precede the start date.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/api/admin/hierarchy/delegate-lead", {
        original_supervisor_id: supervisor.id,
        acting_supervisor_id: actingSupervisorId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || "Leave Coverage",
      });

      if (res.data?.status) {
        onSuccess?.(res.data.message || "Leadership delegation activated successfully!");
        onClose();
      } else {
        setErrorMsg(res.data?.error || "Failed to activate delegation");
      }
    } catch (err: any) {
      console.error("Delegation activation error:", err);
      setErrorMsg(
        err.response?.data?.error ||
          "Failed to activate acting lead delegation. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeDelegation = async () => {
    setErrorMsg("");
    setRevoking(true);
    try {
      // Find active delegation record
      const delRes = await api.get("/api/admin/hierarchy/delegations");

      const activeDel = delRes.data?.delegations?.find(
        (d: any) =>
          String(d.original_supervisor_id) === String(supervisor.id) && d.is_active
      );

      if (!activeDel) {
        onSuccess?.("No active delegation record found to cancel.");
        onClose();
        return;
      }

      const res = await api.put(
        `/api/admin/hierarchy/delegations/${activeDel.id}/cancel`,
        {}
      );

      if (res.data?.status) {
        onSuccess?.(res.data.message || "Delegation successfully revoked.");
        onClose();
      } else {
        setErrorMsg(res.data?.error || "Failed to cancel delegation.");
      }
    } catch (err: any) {
      console.error("Revoke delegation error:", err);
      setErrorMsg(
        err.response?.data?.error || "Failed to cancel delegation early."
      );
    } finally {
      setRevoking(false);
    }
  };

  const quickReasonChips = [
    "Parental Leave Coverage",
    "Medical Leave",
    "Annual Leave / Sabbatical",
    "Executive Leadership Training",
    "Special Project Secondment",
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Amber/Gold Wave Background */}
        <div className="relative px-4 sm:px-5 py-2.5 sm:py-3 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-[380px] sm:w-[480px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <mask id="delegationWaveFadeMask">
                  <linearGradient id="delWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="25%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#delWaveFadeGrad)" />
                </mask>

                <linearGradient id="delWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.25" />
                  <stop offset="30%" stopColor="#FDE68A" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#FEF3C7" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#FFFBEB" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="delWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#FCD34D" stopOpacity="0.7" />
                  <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.85" />
                  <stop offset="85%" stopColor="#FEF3C7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FFFBEB" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="delWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#FDE68A" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.5" />
                </linearGradient>
              </defs>

              <g mask="url(#delegationWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#delWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#delWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#delWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center text-base shadow-2xs shrink-0">
              <i className="bi bi-person-badge-fill"></i>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-normal mb-0">
                Temporary Team Lead Delegation
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mb-0 font-normal leading-normal mt-0.5 truncate">
                Designate an acting lead during leave without dissolving reporting structure
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
        <form onSubmit={handleActivateDelegation} className="flex flex-col">
          <div className="px-4 sm:px-5 py-3 sm:py-3.5 space-y-3 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-rose-500 shrink-0"></i>
                <span>{errorMsg}</span>
              </div>
            )}
            
            {/* Primary Supervisor Identity Card */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0 select-none">
                {supervisor.name ? supervisor.name.charAt(0) : "S"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm mb-0 truncate">
                    {supervisor.name}
                  </h4>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Primary Supervisor
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-0 truncate mt-0.5">
                  {supervisor.email || "supervisor@company.com"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                  <span>SUP-{String(supervisor.id).padStart(4, "0")}</span>
                  <span>•</span>
                  <span>{supervisor.department_name || "General"}</span>
                  {supervisor.memberCount !== undefined && (
                    <>
                      <span>•</span>
                      <span>{supervisor.memberCount} Direct Reports</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Active Delegation Warning Banner (if exists) */}
            {hasActiveDelegation && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 flex items-start justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <i className="bi bi-exclamation-triangle-fill text-amber-600 text-sm shrink-0 mt-0.5"></i>
                  <div>
                    <h5 className="font-bold text-xs text-amber-950 mb-0.5">
                      Active Leadership Delegation in Effect
                    </h5>
                    <p className="text-[11px] text-amber-900 mb-1 leading-snug">
                      Acting Lead: <strong className="font-bold">{supervisor.acting_supervisor_name}</strong>
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-amber-800">
                      <span>Period: {supervisor.delegation_start_date?.slice(0, 10)} to {supervisor.delegation_end_date?.slice(0, 10)}</span>
                      {supervisor.delegation_reason && (
                        <>
                          <span>•</span>
                          <span>{supervisor.delegation_reason}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRevokeDelegation}
                  disabled={revoking}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 text-[11px] font-bold shadow-2xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                  title="End delegation and restore primary supervisor"
                >
                  {revoking ? "Ending..." : "End Early"}
                </button>
              </div>
            )}

            {/* Candidate Acting Supervisor Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Designate Acting Team Lead <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all overflow-hidden h-9.5">
                <div className="w-9.5 h-9.5 flex items-center justify-center bg-slate-50/70 border-r border-slate-100 text-amber-600 text-sm shrink-0">
                  <i className="bi bi-person-check-fill"></i>
                </div>
                <select
                  value={actingSupervisorId}
                  onChange={(e) => setActingSupervisorId(e.target.value)}
                  required
                  className="w-full bg-transparent px-3 text-xs font-medium text-slate-900 focus:outline-hidden appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    -- Select peer supervisor or candidate --
                  </option>
                  {eligibleCandidates.map((cand) => (
                    <option key={cand.id} value={cand.id}>
                      {cand.name} (SUP-{String(cand.id).padStart(4, "0")} • {cand.department_name || cand.department || "General"})
                    </option>
                  ))}
                </select>
                <i className="bi bi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs"></i>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 mb-0">
                Acting lead will receive daily task notifications, approval workflows, and sprint updates during this period.
              </p>
            </div>

            {/* Date Range Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Effective Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-medium shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Expected Return Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-medium shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Reason & Quick Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Reason / Leave Context
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Parental Leave, Medical Leave, Sabbatical..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 font-medium shadow-2xs focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                {quickReasonChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setReason(chip)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-600 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Actions Footer */}
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || revoking}
              className="px-4 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <i className="bi bi-x-lg text-xs text-slate-500"></i>
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={submitting || revoking || !actingSupervisorId}
              className="px-5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Activating...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle text-xs"></i>
                  <span>{hasActiveDelegation ? "Update Delegation" : "Activate Acting Lead"}</span>
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
