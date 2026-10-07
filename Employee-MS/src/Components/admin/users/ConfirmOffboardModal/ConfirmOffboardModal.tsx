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
      {/* MAIN MODAL DIALOG CARD - RESTORED TO ORIGINAL MAX-W-MD SIZE */}
      <div
        className="offboard-modal-card relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden z-10 animate-in zoom-in-95 duration-150 border border-slate-200/80"
        style={{ maxWidth: "448px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Right Corner Wave SVG */}
        <svg className="top-right-wave" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 0C80 40 140 30 180 15C200 7.5 210 0 220 0V180C190 140 150 110 100 130C50 150 20 110 0 80V0H40Z" fill="url(#pinkGradTop)" opacity="0.12" />
          <path d="M100 0C140 25 180 35 220 10V120C190 90 160 80 120 100C80 120 40 80 0 50V0H100Z" fill="url(#pinkGradTop)" opacity="0.18" />
          <path d="M150 0C180 20 200 15 220 5V60C200 40 180 45 160 30C140 15 100 20 60 0H150Z" fill="url(#pinkGradTop)" opacity="0.25" />
          <defs>
            <linearGradient id="pinkGradTop" x1="0" y1="0" x2="220" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#fb7185" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Left Corner Wave SVG */}
        <svg className="bottom-left-wave" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 160V60C30 80 70 90 110 70C150 50 180 90 200 120V160H0Z" fill="url(#pinkGradBot)" opacity="0.15" />
          <path d="M0 160V100C20 115 50 120 80 105C120 90 150 120 170 140V160H0Z" fill="url(#pinkGradBot)" opacity="0.22" />
          <defs>
            <linearGradient id="pinkGradBot" x1="0" y1="160" x2="200" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#fda4af" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Close (X) Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 z-20 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header Section */}
        <div className="relative z-10 flex items-start gap-3.5 sm:gap-4 mb-4">
          {/* Soft Pink Circular Avatar Badge */}
          <div className="offboard-header-badge mt-0.5">
            <svg className="w-7 h-7 text-crimson" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 11a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z" />
            </svg>
            <div className="absolute top-[16px] right-[10px] text-crimson font-extrabold text-xs">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Title and Subtitle Text */}
          <div className="pt-0.5 min-w-0 pr-6">
            <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 leading-[1.2] tracking-tight mb-0">
              Confirm Personnel<br />
              <span className="text-crimson">Offboarding</span>
            </h2>
            <p className="text-[12px] sm:text-[12.5px] text-slate-500 mt-1.5 leading-snug mb-0">
              Are you sure you want to offboard and remove{" "}
              <span className="font-bold text-slate-800">{memberName || "this employee"}</span>{" "}
              ({memberRole ? memberRole.toLowerCase() : "employee"}) from the active directory?
            </p>
          </div>
        </div>

        {/* Warning Box Alert */}
        <div className="relative z-10 mb-3.5 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#fff7f7] alert-box-border flex items-start gap-3 shadow-2xs">
          {/* Warning Triangle Icon Badge */}
          <div className="offboard-warning-badge mt-0.5">
            <div className="offboard-warning-icon-inner">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
          </div>

          {/* Vertical Red Divider */}
          <div className="w-[1px] bg-red-200/80 self-stretch my-0.5 shrink-0"></div>

          {/* Warning Text Content */}
          <div className="text-[11.5px] sm:text-[12px] leading-snug">
            <h4 className="font-bold text-crimson mb-0.5 text-[12.5px]">This action cannot be undone</h4>
            <p className="text-slate-600 font-normal leading-relaxed mb-0">
              This action immediately revokes authentication tokens, clears reporting hierarchy bindings, and archives their personnel history.
            </p>
          </div>
        </div>

        {/* Employee Profile Summary Card */}
        <div className="relative z-10 mb-5 p-3 rounded-xl sm:rounded-2xl bg-[#f5f7fc] border border-slate-200/70 flex items-center gap-3 shadow-2xs">
          {/* Avatar Badge */}
          {memberImage ? (
            <img
              src={memberImage}
              alt={memberName}
              className="w-10 h-10 rounded-full object-cover shrink-0 shadow-2xs border border-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs tracking-wide shrink-0 shadow-2xs">
              {initials}
            </div>
          )}

          {/* Employee Info Metadata */}
          <div className="min-w-0">
            <div className="text-[13px] sm:text-[13.5px] font-bold text-slate-900 leading-tight truncate">
              {memberName || "Alex Mercer"}
            </div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5 truncate">
              <span>{formattedId}</span>
              <span className="text-slate-300">|</span>
              <span className="truncate">{displayDepartment}</span>
              <span className="text-slate-300">|</span>
              <span className="capitalize">{displayRole}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="relative z-10 flex items-center justify-end gap-2.5 pt-0.5">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-[13px] transition-all shadow-2xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Confirm Offboarding Red Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-crimson hover:bg-rose-700 text-white font-bold text-xs sm:text-[13px] flex items-center gap-1.5 btn-crimson-glow transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
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
