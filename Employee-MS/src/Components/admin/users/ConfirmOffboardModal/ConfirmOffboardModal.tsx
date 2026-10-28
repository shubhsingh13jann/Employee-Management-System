import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import "./ConfirmOffboardModal.css";

export interface ConfirmOffboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  memberRole?: string;
  memberId?: number | string;
  memberDepartment?: string;
  memberImage?: string | null;
  isDeleting: boolean;
}

export const ConfirmOffboardModal: React.FC<ConfirmOffboardModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  memberRole,
  memberId,
  memberDepartment,
  memberImage,
  isDeleting,
}) => {
  // Keyboard navigation (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  // Format initials from employee name
  const getInitials = (name: string) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(memberName);

  // Formatted Employee ID
  const formattedId = memberId
    ? typeof memberId === "number"
      ? `EMP-${String(memberId).padStart(4, "0")}`
      : String(memberId)
    : "EMP-0176";

  const displayDepartment = memberDepartment || "Engineering";
  const displayRole = memberRole
    ? memberRole.charAt(0).toUpperCase() + memberRole.slice(1).toLowerCase()
    : "Employee";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={!isDeleting ? onClose : undefined}
    >
      {/* MAIN MODAL DIALOG CARD - WIDER & COMPACT HEIGHT */}
      <div
        className="offboard-modal-card relative w-full bg-white rounded-2xl sm:rounded-3xl px-5 py-4 sm:px-6 sm:py-4.5 overflow-hidden z-10 animate-in zoom-in-95 duration-150 border border-slate-200/80"
        style={{ maxWidth: "672px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Fluid Pastel Rose Wave Background matching Unlink Hierarchy modal */}
        <div className="absolute top-0 right-0 w-[360px] sm:w-[460px] h-[78px] sm:h-[84px] pointer-events-none overflow-hidden z-0">
          <svg
            viewBox="0 0 500 74"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <defs>
              {/* Left fade mask to seamlessly blend into pure white without harsh edges */}
              <mask id="offboardWaveFadeMask">
                <linearGradient id="offboardWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="black" />
                  <stop offset="22%" stopColor="white" />
                  <stop offset="100%" stopColor="white" />
                </linearGradient>
                <rect width="500" height="74" fill="url(#offboardWaveFadeGrad)" />
              </mask>

              {/* Wave 1: Soft Rose Blush */}
              <linearGradient id="offboardWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                <stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.25" />
                <stop offset="30%" stopColor="#FECDD3" stopOpacity="0.85" />
                <stop offset="65%" stopColor="#FFE4E6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#FFF1F2" stopOpacity="0.7" />
              </linearGradient>

              {/* Wave 2: Richer Rose / Pink Sweep */}
              <linearGradient id="offboardWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE4E6" stopOpacity="0.3" />
                <stop offset="30%" stopColor="#FDA4AF" stopOpacity="0.7" />
                <stop offset="60%" stopColor="#FECDD3" stopOpacity="0.85" />
                <stop offset="85%" stopColor="#FFE4E6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFF1F2" stopOpacity="0.4" />
              </linearGradient>

              {/* Wave 3: Subtle Warm Pink Ribbon Glow */}
              <linearGradient id="offboardWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                <stop offset="0%" stopColor="#FFF1F2" stopOpacity="0.5" />
                <stop offset="45%" stopColor="#FECDD3" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            <g mask="url(#offboardWaveFadeMask)">
              <path
                d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                fill="url(#offboardWaveGrad1)"
              />
              <path
                d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                fill="url(#offboardWaveGrad2)"
              />
              <path
                d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                fill="url(#offboardWaveGrad3)"
                opacity="0.75"
              />
            </g>
          </svg>
        </div>

        {/* Close (X) Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-3.5 right-3.5 z-20 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header Section */}
        <div className="relative z-10 flex items-start gap-3 sm:gap-3.5 mb-2.5">
          {/* Soft Pink Circular Avatar Badge */}
          <div className="offboard-header-badge mt-0.5">
            <svg className="w-6 h-6 text-crimson" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 11a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z" />
            </svg>
            <div className="absolute top-[13px] right-[8px] text-crimson font-extrabold text-xs">
              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Title and Subtitle Text */}
          <div className="pt-0 min-w-0 pr-6">
            <h2 className="text-[19px] sm:text-[20px] font-bold text-slate-900 leading-[1.2] tracking-tight mb-0">
              <span className="whitespace-nowrap">Confirm Personnel</span><br />
              <span className="text-crimson">Offboarding</span>
            </h2>
            <p className="text-[11.5px] sm:text-[12px] text-slate-500 mt-1 leading-snug mb-0">
              Are you sure you want to offboard and remove{" "}
              <span className="font-bold text-slate-800">{memberName || "this employee"}</span>{" "}
              ({memberRole ? memberRole.toLowerCase() : "employee"}) from the active directory?
            </p>
          </div>
        </div>

        {/* Warning Box Alert */}
        <div className="relative z-10 mb-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#fff7f7] alert-box-border flex items-start gap-2.5 shadow-2xs">
          {/* Warning Triangle Icon Badge */}
          <div className="offboard-warning-badge mt-0.5">
            <div className="offboard-warning-icon-inner">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
          </div>

          {/* Vertical Red Divider */}
          <div className="w-[1px] bg-red-200/80 self-stretch my-0.5 shrink-0"></div>

          {/* Warning Text Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-crimson mb-0.5 text-[11.5px] sm:text-[12px]">This action cannot be undone</h4>
            <p className="text-slate-600 font-normal leading-snug text-[10.5px] sm:text-[11px] tracking-tight mb-0">
              This action immediately revokes authentication tokens, clears reporting hierarchy bindings, and archives their personnel history.
            </p>
          </div>
        </div>

        {/* Employee Profile Summary Card */}
        <div className="relative z-10 mb-3.5 p-2 sm:p-2.5 rounded-xl bg-[#f5f7fc] border border-slate-200/70 flex items-center gap-2.5 shadow-2xs">
          {/* Avatar Badge */}
          {memberImage ? (
            <img
              src={memberImage}
              alt={memberName}
              className="w-8 h-8 rounded-full object-cover shrink-0 shadow-2xs border border-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[11px] tracking-wide shrink-0 shadow-2xs">
              {initials}
            </div>
          )}

          {/* Employee Info Metadata */}
          <div className="min-w-0">
            <div className="text-[12.5px] sm:text-[13px] font-bold text-slate-900 leading-tight truncate">
              {memberName || "Alex Mercer"}
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 truncate">
              <span>{formattedId}</span>
              <span className="text-slate-300">|</span>
              <span className="truncate">{displayDepartment}</span>
              <span className="text-slate-300">|</span>
              <span className="capitalize">{displayRole}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="relative z-10 flex items-center justify-end gap-2 pt-0">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-1.5 sm:px-4.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all shadow-2xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Confirm Offboarding Red Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-1.5 sm:px-4.5 sm:py-2 rounded-xl sm:rounded-2xl bg-crimson hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 btn-crimson-glow transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Offboarding...</span>
              </>
            ) : (
              <>
                <i className="bi bi-trash3-fill text-xs"></i>
                <span>Confirm Offboarding</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmOffboardModal;
