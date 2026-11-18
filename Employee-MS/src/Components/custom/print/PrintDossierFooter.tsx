import React from "react";

export interface PrintDossierFooterProps {
  complianceText?: string;
  confidentialNotice?: string;
  documentDate?: string;
  showSignatures?: boolean;
  signatures?: {
    preparer?: string;
    preparerTitle?: string;
    reviewer?: string;
    reviewerTitle?: string;
    approver?: string;
    approverTitle?: string;
  };
}

export const PrintDossierFooter: React.FC<PrintDossierFooterProps> = ({
  complianceText = "EMS Corporate Governance • System Compliance Section 4.11",
  confidentialNotice = "Confidential Internal Audit Document",
  documentDate,
  showSignatures = false,
  signatures = {
    preparer: "Initiative Lead",
    preparerTitle: "Reporting Supervisor",
    reviewer: "Department Head",
    reviewerTitle: "Operations Manager",
    approver: "Executive Board",
    approverTitle: "Managing Director",
  },
}) => {
  const dateStr = documentDate || new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mt-6 pt-4 border-t border-slate-300 print-avoid-break">
      {/* Optional Executive Sign-off Block */}
      {showSignatures && (
        <div className="mb-5 grid grid-cols-3 gap-4 text-center">
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-800 text-[10px]">{signatures.preparer}</div>
            <div className="text-[9px] text-slate-500">{signatures.preparerTitle}</div>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-800 text-[10px]">{signatures.reviewer}</div>
            <div className="text-[9px] text-slate-500">{signatures.reviewerTitle}</div>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-800 text-[10px]">{signatures.approver}</div>
            <div className="text-[9px] text-slate-500">{signatures.approverTitle}</div>
          </div>
        </div>
      )}

      {/* Audit Footnote */}
      <div className="flex items-center justify-between text-[9px] text-slate-400">
        <p className="mb-0">
          {complianceText}
        </p>
        <p className="mb-0 font-mono">
          Generated {dateStr} • {confidentialNotice}
        </p>
      </div>
    </div>
  );
};

export default PrintDossierFooter;
