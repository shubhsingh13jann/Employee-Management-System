import React from "react";
import { createPortal } from "react-dom";
import "./ConfirmOffboardModal.css";

interface ConfirmOffboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  memberRole?: string;
  isDeleting: boolean;
}

export const ConfirmOffboardModal: React.FC<ConfirmOffboardModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  memberRole,
  isDeleting
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-inner">
            <i className="bi bi-person-x-fill text-2xl"></i>
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-0">
              Confirm Personnel Offboarding
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-0">
              Are you sure you want to offboard and remove{" "}
              <span className="font-semibold text-slate-800">{memberName}</span>
              {memberRole ? ` (${memberRole})` : ""} from the active directory?
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 flex items-start gap-2.5">
          <i className="bi bi-exclamation-triangle-fill text-amber-600 text-sm shrink-0 mt-0.5"></i>
          <p className="text-[11px] text-amber-800 leading-normal mb-0">
            This action immediately revokes authentication tokens, clears reporting hierarchy bindings, and archives their personnel history. This cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
