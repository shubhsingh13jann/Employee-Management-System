import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export interface ProjectDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  project: {
    id: number;
    title: string;
    total_tasks?: number;
    lead_supervisor_name?: string;
  } | null;
}

export const ProjectDeleteModal: React.FC<ProjectDeleteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  project,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !deleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, deleting, onClose]);

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setErrorMsg("");

      const { default: api } = await import("../../../api/axios");
      const res = await api.delete(`/api/manager/projects/${project.id}`);

      if (res.data.status) {
        onSuccess(res.data.message || `Project "${project.title}" deleted successfully.`);
        onClose();
      } else {
        setErrorMsg(res.data.error || "Failed to delete project initiative.");
      }
    } catch (err: any) {
      console.error("Delete project error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to delete project. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={!deleting ? onClose : undefined}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl p-5 sm:p-6 text-slate-800 animate-in zoom-in-95 duration-150 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-xl shrink-0 shadow-xs">
            <i className="bi bi-trash3-fill"></i>
          </div>
          <div>
            <h3 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight leading-tight">
              Delete Project Milestone
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-normal">
              Are you sure you want to delete this strategic initiative?
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill shrink-0"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <div className="text-xs font-bold text-slate-900 truncate">
            {project.title}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>Lead: <strong>{project.lead_supervisor_name || "Assigned Supervisor"}</strong></span>
            <span>{project.total_tasks || 0} associated tasks</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Associated task tickets will be safely detached from this milestone and preserved. This deletion is recorded in audit logs.
        </p>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="px-4.5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {deleting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <i className="bi bi-trash3 text-xs"></i>
                <span>Confirm Deletion</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
