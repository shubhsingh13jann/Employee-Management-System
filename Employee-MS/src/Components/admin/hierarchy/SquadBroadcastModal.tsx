import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";
import { SquadGroup } from "./HierarchySquadCardsView";

export interface SquadBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  squad: SquadGroup | null;
  onSuccess: (message: string) => void;
}

export const SquadBroadcastModal: React.FC<SquadBroadcastModalProps> = ({
  isOpen,
  onClose,
  squad,
  onSuccess,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"standard" | "important" | "urgent">("standard");
  const [includeLead, setIncludeLead] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSubject("");
      setMessage("");
      setPriority("standard");
      setIncludeLead(true);
      setErrorMsg("");
    }
  }, [isOpen, squad?.supervisorId]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, sending]);

  if (!isOpen || !squad) return null;

  const totalRecipients = squad.members.length + (includeLead ? 1 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg("Please provide both a broadcast subject and announcement message.");
      return;
    }

    try {
      setSending(true);
      setErrorMsg("");
      const res = await api.post("/api/admin/hierarchy/broadcast-squad", {
        supervisor_id: squad.supervisorId,
        subject: subject.trim(),
        message: message.trim(),
        priority,
        include_supervisor: includeLead,
      });

      if (res.data.status) {
        onSuccess(
          res.data.message ||
            `Squad announcement "${subject.trim()}" dispatched successfully to ${squad.supervisorName}'s team.`
        );
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error || "Failed to dispatch squad broadcast announcement. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={!sending ? onClose : undefined}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Fluid Pastel Wave Background */}
        <div className="relative px-5 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
          {/* Wave SVG */}
          <div className="absolute top-0 right-0 w-[380px] sm:w-[480px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <mask id="squadBroadcastFadeMask">
                  <linearGradient id="squadBroadcastFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="22%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#squadBroadcastFadeGrad)" />
                </mask>
                <linearGradient id="squadBroadcastGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.25" />
                  <stop offset="35%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="70%" stopColor="#E0E7FF" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="squadBroadcastGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.3" />
                  <stop offset="35%" stopColor="#A5B4FC" stopOpacity="0.7" />
                  <stop offset="65%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <g mask="url(#squadBroadcastFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#squadBroadcastGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#squadBroadcastGrad2)"
                />
              </g>
            </svg>
          </div>

          {/* Header Title */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center text-base shadow-2xs">
              <i className="bi bi-megaphone-fill"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-0">
                  Broadcast to Squad
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {totalRecipients} Recipient{totalRecipients > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-0">
                Dispatch targeted announcement to <strong className="text-slate-700">{squad.supervisorName}</strong>&apos;s squad.
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="relative z-10 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer text-xs disabled:opacity-50"
            title="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[calc(85vh-120px)] [scrollbar-width:thin]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Squad Roster Target Pill */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Target Squad Roster
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={includeLead}
                  onChange={(e) => setIncludeLead(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                />
                <span>Include Team Lead ({squad.supervisorName})</span>
              </label>
            </div>

            {/* Members Chip List */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200/60 [scrollbar-width:thin]">
              {includeLead && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                  <i className="bi bi-person-fill text-indigo-500"></i>
                  <span>{squad.supervisorName} (Lead)</span>
                </span>
              )}
              {squad.members.map((m) => (
                <span
                  key={`recipient-${m.employee_id}`}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium"
                >
                  <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 text-[9px] font-bold flex items-center justify-center">
                    {m.employee_name.charAt(0)}
                  </span>
                  <span>{m.employee_name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Broadcast Subject <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden h-9.5">
              <div className="w-9.5 h-9.5 flex items-center justify-center bg-slate-50 border-r border-slate-100 text-slate-400 text-sm shrink-0">
                <i className="bi bi-chat-left-text"></i>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Q4 Sprint Planning & Delivery Cadence"
                required
                className="w-full h-full px-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Broadcast Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority("standard")}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  priority === "standard"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <i className="bi bi-info-circle text-xs"></i>
                <span>Standard</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority("important")}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  priority === "important"
                    ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50/50"
                }`}
              >
                <i className="bi bi-star-fill text-xs"></i>
                <span>Important</span>
              </button>
              <button
                type="button"
                onClick={() => setPriority("urgent")}
                className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  priority === "urgent"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-rose-50/50"
                }`}
              >
                <i className="bi bi-fire text-xs"></i>
                <span>Urgent</span>
              </button>
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Announcement Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter details, instructions, or meeting links for the squad members..."
              rows={4}
              required
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-2xs resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1 mb-0 flex items-center justify-between">
              <span>Emails will be dispatched to official work addresses via SendGrid/SMTP.</span>
              <span>{message.length} chars</span>
            </p>
          </div>

          {/* Modal Actions Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !subject.trim() || !message.trim()}
              className="px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {sending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-send-fill text-xs"></i>
                  <span>Send Broadcast</span>
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
