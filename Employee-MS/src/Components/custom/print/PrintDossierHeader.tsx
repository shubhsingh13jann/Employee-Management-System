import React from "react";
import { HeaderStyleOption } from "./UniversalPrintStudio";

export interface PrintDossierHeaderProps {
  headerStyle?: HeaderStyleOption;
  systemTitle?: string;
  documentTitle: string;
  documentSubtitle?: string;
  documentId?: string;
  classification?: string;
  scopeDesc?: string;
  pageSize?: string;
  orientation?: string;
  currentDate?: string;
  currentTime?: string;
  metadataItems?: { label: string; value: string; isHighlight?: boolean }[];
}

export const PrintDossierHeader: React.FC<PrintDossierHeaderProps> = ({
  headerStyle = "default",
  systemTitle = "Enterprise Management System",
  documentTitle,
  documentSubtitle = "Official Corporate Intelligence & Audit Record",
  documentId,
  classification = "CONFIDENTIAL BRIEFING",
  scopeDesc,
  pageSize = "A4",
  orientation = "Portrait",
  currentDate,
  currentTime,
  metadataItems,
}) => {
  const dateStr = currentDate || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = currentTime || new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Executive Style (Rich Slate/Indigo Gradient with Gold/Amber Accents)
  if (headerStyle === "executive") {
    return (
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-xl shadow-sm border border-slate-800 flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="w-5.5 h-5.5 rounded-md bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[11px] shadow-sm shrink-0">
              <i className="bi bi-shield-check"></i>
            </div>
            <div
              style={{ fontSize: "14px", letterSpacing: "0.06em" }}
              className="font-black text-amber-300 uppercase whitespace-nowrap"
            >
              {systemTitle}
            </div>
            {documentId && (
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-widest shrink-0">
                {documentId}
              </span>
            )}
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-widest shrink-0">
              Executive Dossier
            </span>
          </div>

          <div style={{ fontSize: "12.6px" }} className="font-bold text-white whitespace-nowrap truncate">
            {documentTitle}
          </div>
          {documentSubtitle && (
            <div style={{ fontSize: "10px" }} className="text-slate-300 mb-0 mt-0.5 whitespace-nowrap truncate">
              {documentSubtitle}
            </div>
          )}
        </div>

        <div style={{ fontSize: "10px" }} className="text-right text-slate-300 space-y-0.5 shrink-0">
          <div
            style={{ fontSize: "10.5px" }}
            className="font-bold text-amber-300 tracking-wider uppercase mb-0.5"
          >
            {classification}
          </div>
          <p className="mb-0">Date: <strong className="text-white">{dateStr}</strong></p>
          <p className="mb-0">Time: <span className="text-slate-200">{timeStr}</span></p>
          {scopeDesc && (
            <p className="mb-0">Scope: <strong className="capitalize text-white">{scopeDesc}</strong></p>
          )}
          <p className="mb-0">Format: <strong className="uppercase text-amber-300">{pageSize} • {orientation}</strong></p>
          {metadataItems && metadataItems.map((m, idx) => (
            <p key={idx} className="mb-0">
              {m.label}: <strong className={m.isHighlight ? "text-amber-300" : "text-white"}>{m.value}</strong>
            </p>
          ))}
        </div>
      </div>
    );
  }

  // Minimal Style (Clean, low-ink border line)
  if (headerStyle === "minimal") {
    return (
      <div className="border-b border-slate-200 pb-2.5 flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            {systemTitle}
          </div>
          <div style={{ fontSize: "13px" }} className="font-black text-slate-900 truncate">
            {documentTitle}
          </div>
          {documentSubtitle && (
            <div style={{ fontSize: "10px" }} className="text-slate-500 mt-0.5 truncate">
              {documentSubtitle}
            </div>
          )}
        </div>

        <div style={{ fontSize: "9.5px" }} className="text-right text-slate-500 space-y-0.5 shrink-0">
          {documentId && (
            <div className="font-mono font-bold text-slate-800 text-[10px]">{documentId}</div>
          )}
          <div>Date: {dateStr}</div>
          <div>Time: {timeStr}</div>
          {scopeDesc && <div>Scope: {scopeDesc}</div>}
          <div>Format: {pageSize.toUpperCase()} • {orientation}</div>
        </div>
      </div>
    );
  }

  // Default Style (Corporate Letterhead with EMS Badge)
  return (
    <div className="border-b-2 border-slate-900 pb-2.5 sm:pb-3 mb-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center tracking-wider shadow-xs shrink-0">
            EMS
          </div>
          <div className="min-w-0">
            <div
              style={{ fontSize: "13.75px", lineHeight: "1.2", letterSpacing: "0.05em" }}
              className="font-bold text-slate-900 uppercase whitespace-nowrap truncate"
            >
              {systemTitle}
            </div>
            <div
              style={{ fontSize: "12.6px", lineHeight: "1.3" }}
              className="font-semibold text-slate-800 whitespace-nowrap truncate mt-0.5"
            >
              {documentTitle}
            </div>
            {documentSubtitle && (
              <div
                style={{ fontSize: "10px", lineHeight: "1.2" }}
                className="text-slate-500 mb-0 mt-0.5 whitespace-nowrap truncate"
              >
                {documentSubtitle}
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: "10px", lineHeight: "1.3" }} className="text-right text-slate-600 space-y-0.5 shrink-0">
          {documentId && (
            <div
              style={{ fontSize: "10px" }}
              className="inline-block px-2 py-0.5 bg-slate-900 text-white font-mono font-bold rounded tracking-wider uppercase mb-0.5"
            >
              {documentId}
            </div>
          )}
          <div
            style={{ fontSize: "10.5px" }}
            className="font-bold text-rose-700 tracking-wider uppercase mb-0.5"
          >
            {classification}
          </div>
          <div style={{ fontSize: "9.5px" }} className="text-slate-600">
            Date: <strong className="text-slate-800">{dateStr}</strong>
          </div>
          {scopeDesc && (
            <div style={{ fontSize: "9.5px" }} className="text-slate-500">
              Scope: <strong className="text-slate-800">{scopeDesc}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintDossierHeader;
