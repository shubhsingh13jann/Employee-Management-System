import React, { useState } from "react";
import { createPortal } from "react-dom";

interface BulkBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  selectedUsers: Array<{
    id: number;
    name: string;
    email: string;
    role?: string;
  }>;
}

export const BulkBroadcastModal: React.FC<BulkBroadcastModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedUsers
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"standard" | "important" | "urgent">("standard");
  const [channels, setChannels] = useState({
    email: true,
    inApp: true,
    sms: false
  });
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || selectedUsers.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMsg("Please provide both a broadcast subject and announcement message.");
      return;
    }

    try {
      setSending(true);
      setErrorMsg("");
      // Simulate enterprise broadcast dispatch latency
      await new Promise((res) => setTimeout(res, 600));

      onSuccess(
        `Broadcast announcement "${subject.trim()}" dispatched successfully to ${selectedUsers.length} personnel.`
      );
      setSubject("");
      setMessage("");
      onClose();
    } catch {
      setErrorMsg("Failed to dispatch broadcast. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-lg shadow-inner">
              <i className="bi bi-broadcast"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight mb-0">
                Personnel Broadcast Announcement
              </h3>
              <p className="text-[11px] text-indigo-200/70 mb-0">
                Direct communication to {selectedUsers.length} selected workforce members
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Recipients Chips Preview */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
              <span>Recipients ({selectedUsers.length})</span>
              <span className="text-[10px] text-indigo-600 font-semibold">Active Selection</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap max-h-20 overflow-y-auto [scrollbar-width:thin] pt-1">
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="truncate max-w-[120px]">{u.name}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Priority Tag & Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Priority Classification
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500"
              >
                <option value="standard">Standard Circular</option>
                <option value="important">Important Notification</option>
                <option value="urgent">Urgent Operational Directive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Dispatch Channels
              </label>
              <div className="flex items-center gap-3 pt-1.5 text-xs text-slate-600 font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channels.inApp}
                    onChange={(e) => setChannels({ ...channels, inApp: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>In-App</span>
                </label>
              </div>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Announcement Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Q4 Town Hall & Governance Policy Update"
              className="w-full h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Message Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Compose announcement directive..."
              className="w-full p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-900 outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Transmitting...</span>
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
