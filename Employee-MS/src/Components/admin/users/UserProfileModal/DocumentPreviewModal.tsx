import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export interface EmployeeDocument {
  id: string | number;
  name: string;
  description?: string;
  category: "Identity" | "Contract" | "Tax" | "Certification" | "NDA" | "Other";
  fileType: "pdf" | "image" | "doc";
  fileSize: string;
  fileData?: string | null;
  uploadDate: string;
  status: "verified" | "pending" | "expired";
}

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EmployeeDocument | null;
  employee: any;
  onToggleStatus: (doc: EmployeeDocument, nextStatus: "verified" | "pending" | "expired") => void;
  onDownload: (doc: EmployeeDocument) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  employee,
  onToggleStatus,
  onDownload,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  const isImage = doc.fileData && (doc.fileData.startsWith("data:image/") || doc.fileType === "image");
  const isPdf = doc.fileData && (doc.fileData.startsWith("data:application/pdf") || doc.fileType === "pdf");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Verified Record</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Pending Review</span>
          </span>
        );
      case "expired":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Expired</span>
          </span>
        );
    }
  };

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "Identity":
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "bi-person-vcard-fill" };
      case "Contract":
        return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: "bi-file-earmark-text-fill" };
      case "NDA":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "bi-shield-lock-fill" };
      case "Tax":
        return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "bi-cash-coin" };
      case "Certification":
        return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", icon: "bi-award-fill" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "bi-file-earmark-fill" };
    }
  };

  const theme = getCategoryTheme(doc.category);

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="shrink-0 px-5 sm:px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${theme.bg} ${theme.text} border ${theme.border} flex items-center justify-center text-lg shrink-0 shadow-2xs`}>
              <i className={`bi ${theme.icon}`}></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate mb-0">
                  {doc.name}
                </h3>
                {getStatusBadge(doc.status)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className={`font-semibold ${theme.text}`}>{doc.category}</span>
                <span>•</span>
                <span>{doc.fileSize}</span>
                <span>•</span>
                <span>Uploaded {doc.uploadDate}</span>
                {employee?.name && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-slate-700">For {employee.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Close Preview"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </div>

        {/* Document Viewer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70">
          {isImage ? (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl shadow-inner max-h-[550px] overflow-auto">
              <img
                src={doc.fileData || ""}
                alt={doc.name}
                className="max-h-[500px] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isPdf && doc.fileData?.startsWith("data:application/pdf") ? (
            <iframe
              src={doc.fileData}
              title={doc.name}
              className="w-full h-[540px] rounded-xl border border-slate-200 bg-white shadow-sm"
            />
          ) : (
            /* High-Fidelity Statutory Legal Document Canvas */
            <div className="relative mx-auto max-w-2xl bg-white rounded-xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6 overflow-hidden">
              {/* Subtle Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5">
                <span className="text-6xl sm:text-7xl font-extrabold uppercase tracking-widest text-slate-900 -rotate-25">
                  OFFICIAL EMS VAULT
                </span>
              </div>

              {/* Header Letterhead */}
              <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                      E
                    </span>
                    <span className="font-extrabold tracking-wider text-xs uppercase text-slate-900">
                      EMPLOYEE MANAGEMENT SYSTEM
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight mt-1 mb-0">
                    STATUTORY WORKFORCE RECORD
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-0">
                    Corporate Compliance & Regulatory Records Division
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-slate-500 block">
                    DOC-REF: #{String(doc.id).padStart(6, "0")}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Issued: {doc.uploadDate}
                  </span>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {doc.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personnel Particulars Box */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2 text-slate-500">
                  Beneficiary Personnel Particulars
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Full Legal Name</span>
                    <strong className="text-slate-900 block truncate">{employee?.name || "Verified Employee"}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Employee ID</span>
                    <strong className="text-slate-900 block font-mono">EMP-{String(employee?.id || 1).padStart(4, "0")}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Assigned Unit</span>
                    <strong className="text-slate-900 block truncate">{employee?.department_name || "Enterprise Operations"}</strong>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-slate-400 block">Role & Authority</span>
                    <strong className="text-slate-900 block capitalize">{employee?.role || "Staff Member"}</strong>
                  </div>
                </div>
              </div>

              {/* Record Summary / Substance */}
              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <div className="font-bold text-slate-900 text-sm">
                  {doc.name}
                </div>
                <p className="text-slate-600">
                  {doc.description ||
                    "This formal record has been submitted, verified, and archived in the enterprise personnel file in accordance with labor compliance statutes and internal operational regulations."}
                </p>

                {doc.category === "Contract" && (
                  <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 text-[11px] text-purple-900">
                    <strong className="block mb-1">Contractual Covenant Summary:</strong>
                    This employment agreement formalizes the compensation, scope of duties, and proprietary governance. All terms remain active throughout the tenure of the employee.
                  </div>
                )}

                {doc.category === "NDA" && (
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 text-[11px] text-amber-900">
                    <strong className="block mb-1">Confidentiality Clause:</strong>
                    The recipient undertakes strict confidentiality with respect to intellectual property, corporate proprietary databases, client records, and internal technical roadmaps.
                  </div>
                )}

                {doc.category === "Identity" && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-[11px] text-blue-900">
                    <strong className="block mb-1">Statutory Verification Proof:</strong>
                    Primary identification documents including government-authorized passport, national card, or resident permits have been validated by the HR Super Admin office.
                  </div>
                )}

                {doc.category === "Tax" && (
                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-[11px] text-emerald-900">
                    <strong className="block mb-1">Withholding & Banking Mandate:</strong>
                    Direct deposit bank routing numbers and statutory tax withholding certificates (W-4 / Form 16) are registered for automated monthly payroll reconciliation.
                  </div>
                )}
              </div>

              {/* Security Seal & Certification Footer */}
              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    <i className="bi bi-shield-check text-lg"></i>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">
                      Officially Verified & Archived
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-400 block">
                      SHA256: 7f83b165...9b82c61
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs font-serif italic text-slate-800 font-bold">
                    Super Admin HR Office
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Authorized Electronic Certification
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Controls */}
        <div className="shrink-0 px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Verification Status:</span>
            {doc.status !== "verified" ? (
              <button
                type="button"
                onClick={() => onToggleStatus(doc, "verified")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <i className="bi bi-check2-circle"></i>
                <span>Mark Verified</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onToggleStatus(doc, "pending")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="bi bi-clock-history"></i>
                <span>Set as Pending Review</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownload(doc)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i className="bi bi-download text-slate-500"></i>
              <span>Download File</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
            >
              <i className="bi bi-printer text-slate-500"></i>
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
