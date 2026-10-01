import React, { useRef } from "react";
import { createPortal } from "react-dom";

interface EmployeeIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
    department_name?: string;
    department_code?: string;
    phone?: string;
    image_url?: string;
    created_at?: string;
    is_hod?: boolean;
  } | null;
}

export const EmployeeIdCardModal: React.FC<EmployeeIdCardModalProps> = ({
  isOpen,
  onClose,
  user
}) => {
  const badgeRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !user) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedId = `EMS-${String(user.id).padStart(4, "0")}`;
  const joinYear = user.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
  const validUntil = joinYear + 3;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <i className="bi bi-badge-ad text-indigo-400"></i>
            <span className="text-xs font-bold tracking-wide">Enterprise Digital ID Badge</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Printable Badge Area */}
        <div className="p-6 bg-slate-100 flex flex-col items-center justify-center">
          <div
            ref={badgeRef}
            className="w-72 bg-gradient-to-b from-[#0a0f29] via-[#0f1738] to-[#161245] rounded-2xl border-2 border-indigo-400/40 shadow-2xl p-5 text-white flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Luminous Top Ribbon */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500"></div>

            {/* Corporate Header */}
            <div className="w-full flex items-center justify-between pt-1 pb-3 border-b border-indigo-500/20 mb-4">
              <div className="flex items-center gap-1.5 text-left">
                <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center text-[10px] font-black">
                  E
                </div>
                <div>
                  <div className="text-[10px] font-black tracking-widest uppercase text-white leading-none">
                    ENTERPRISE EMS
                  </div>
                  <div className="text-[7.5px] font-bold tracking-wider text-indigo-300/80 uppercase">
                    Security Credential
                  </div>
                </div>
              </div>
              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                ACTIVE
              </span>
            </div>

            {/* Avatar Frame */}
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-xl">
                <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center overflow-hidden">
                  {user.image_url ? (
                    <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-indigo-200">
                      {user.name ? user.name.charAt(0) : "U"}
                    </span>
                  )}
                </div>
              </div>
              {user.is_hod && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-400 text-slate-950 shadow-md">
                  👑 HOD
                </span>
              )}
            </div>

            {/* Identity Information */}
            <h4 className="text-sm font-black text-white tracking-tight mb-0.5 truncate max-w-full">
              {user.name}
            </h4>
            <div className="mb-2">
              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-500/25 text-indigo-200 border border-indigo-400/30">
                {user.role || "Employee"}
              </span>
            </div>

            <div className="w-full space-y-1 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-[10px] mb-3">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Personnel ID:</span>
                <span className="font-mono font-bold text-white">{formattedId}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-white truncate max-w-[120px]">
                  {user.department_name || "Unassigned"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Validity:</span>
                <span className="font-medium text-slate-300">{joinYear} - {validUntil}</span>
              </div>
            </div>

            {/* Barcode & Security Hologram Strip */}
            <div className="w-full pt-1 flex flex-col items-center gap-1 border-t border-indigo-500/20">
              <div className="flex items-center justify-center gap-0.5 h-6 opacity-80">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-full bg-white ${
                      i % 4 === 0 ? "w-1" : i % 3 === 0 ? "w-0.5" : "w-px"
                    }`}
                  ></div>
                ))}
              </div>
              <span className="text-[7.5px] font-mono tracking-widest text-indigo-300/70">
                *{formattedId}*
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-medium">
            Ready for printer output (PDF / Badge)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="bi bi-printer-fill"></i>
              <span>Print Badge</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
