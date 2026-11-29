import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ProjectItem } from "../../../pages/admin/AdminProjects";

export type BlockerStatusKey =
  | "none"
  | "legal"
  | "vendor_dependency"
  | "staff_shortage"
  | "tech_debt"
  | "other";

export interface BlockerCategoryOption {
  key: BlockerStatusKey;
  label: string;
  badgeLabel: string;
  icon: string;
  colorClass: string;
  borderClass: string;
  bgLightClass: string;
  description: string;
  suggestedNotes: string[];
}

export const BLOCKER_CATEGORIES: BlockerCategoryOption[] = [
  {
    key: "legal",
    label: "Blocked on Legal",
    badgeLabel: "Legal & Compliance",
    icon: "bi-shield-shaded",
    colorClass: "text-rose-700",
    borderClass: "border-rose-300",
    bgLightClass: "bg-rose-50/90",
    description: "Regulatory scrutiny, pending contracts, licensing terms, or corporate compliance review.",
    suggestedNotes: [
      "Awaiting legal counsel review on cross-border data transfer policy.",
      "Contract amendments pending vendor signature under revised SLA.",
      "Regulatory audit finding requires remediation before deployment.",
    ],
  },
  {
    key: "vendor_dependency",
    label: "Vendor Dependency",
    badgeLabel: "Vendor Dependency",
    icon: "bi-building-gear",
    colorClass: "text-amber-700",
    borderClass: "border-amber-300",
    bgLightClass: "bg-amber-50/90",
    description: "External 3rd-party vendor SLA breach, API rate limit bottleneck, or hardware fulfillment delays.",
    suggestedNotes: [
      "Upstream vendor API quota exhausted; waiting for tier upgrade.",
      "Hardware delivery delayed by supplier backlog; staging environment blocked.",
      "3rd-party identity provider outage impacting production integration.",
    ],
  },
  {
    key: "staff_shortage",
    label: "Staff Shortage",
    badgeLabel: "Staff Shortage",
    icon: "bi-people-fill",
    colorClass: "text-blue-700",
    borderClass: "border-blue-300",
    bgLightClass: "bg-blue-50/90",
    description: "Key SME unavailability, critical resignation, engineering overallocation, or vacant skill roles.",
    suggestedNotes: [
      "Tech Lead on mandatory bereavement leave; code review pipeline paused.",
      "Frontend team capacity allocated 100% to urgent production hotfixes.",
      "Awaiting contractor onboarding for specialized database migration skills.",
    ],
  },
  {
    key: "tech_debt",
    label: "Tech Debt",
    badgeLabel: "Tech Debt & Arch",
    icon: "bi-cpu-fill",
    colorClass: "text-purple-700",
    borderClass: "border-purple-300",
    bgLightClass: "bg-purple-50/90",
    description: "Architectural deadlock, critical legacy fragility, high-severity CVE, or breaking schema migration.",
    suggestedNotes: [
      "Critical database deadlock observed under concurrent load; architectural refactor required.",
      "High-severity CVE in core dependency blocks deployment pipeline.",
      "Legacy microservice API contract breaking changes require coordinated deprecation.",
    ],
  },
  {
    key: "other",
    label: "Other Operational Risk",
    badgeLabel: "Operational Risk",
    icon: "bi-exclamation-octagon-fill",
    colorClass: "text-slate-700",
    borderClass: "border-slate-300",
    bgLightClass: "bg-slate-100",
    description: "Executive freeze, budget reallocation, client scope pivot, or unforeseen roadblock.",
    suggestedNotes: [
      "Executive freeze pending quarterly strategic roadmap alignment.",
      "Budget reallocation requested from finance department.",
      "Client scope change requires revising target delivery milestones.",
    ],
  },
];

interface ProjectBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem | null;
  onSaveBlocker: (
    projectId: number | string,
    isBlocked: boolean,
    blockerStatus: string,
    blockerNotes: string
  ) => Promise<void>;
  saving?: boolean;
}

export const ProjectBlockerModal: React.FC<ProjectBlockerModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveBlocker,
  saving = false,
}) => {
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [blockerStatus, setBlockerStatus] = useState<BlockerStatusKey>("legal");
  const [blockerNotes, setBlockerNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (project) {
      const active = Boolean(project.is_blocked) && project.blocker_status !== "none";
      setIsBlocked(active);
      const matchedCategory = BLOCKER_CATEGORIES.find((c) => c.key === project.blocker_status);
      setBlockerStatus(matchedCategory ? (project.blocker_status as BlockerStatusKey) : "legal");
      setBlockerNotes(project.blocker_notes || "");
      setErrorMessage("");
    }
  }, [project, isOpen]);

  // Handle ESC key to dismiss & lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, saving, onClose]);

  if (!isOpen || !project) return null;

  const currentCategory =
    BLOCKER_CATEGORIES.find((c) => c.key === blockerStatus) || BLOCKER_CATEGORIES[0];

  const handleApplyTemplate = (noteText: string) => {
    setBlockerNotes((prev) => {
      if (!prev.trim()) return noteText;
      return `${prev.trim()}\n• ${noteText}`;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isBlocked) {
      if (!blockerNotes.trim()) {
        setErrorMessage("Please enter executive blocker notes detailing the bottleneck and unblocking path.");
        return;
      }
    }

    try {
      await onSaveBlocker(
        project.id,
        isBlocked,
        isBlocked ? blockerStatus : "none",
        isBlocked ? blockerNotes.trim() : ""
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update initiative blocker status");
    }
  };

  const handleQuickResolve = async () => {
    try {
      await onSaveBlocker(project.id, false, "none", "");
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to clear blocker");
    }
  };

  const formatEscalatedTime = (isoString?: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;

    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let relative = "just now";
    if (diffDays > 0) {
      relative = `${diffDays}d ago`;
    } else if (diffHours > 0) {
      relative = `${diffHours}h ago`;
    }

    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return { relative, formattedDate };
  };

  const escalationTelemetry = formatEscalatedTime(project.blocker_escalated_at);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="relative w-full max-w-[780px] max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Dynamic Glowing Top Edge Accent Line matching Login Card Style */}
        <div
          className="absolute top-0 left-0 right-0 h-[2.5px] z-30 pointer-events-none transition-all duration-400"
          style={{
            background: isBlocked
              ? "linear-gradient(90deg, transparent 5%, #e11d48 50%, transparent 95%)"
              : "linear-gradient(90deg, transparent 5%, #059669 50%, transparent 95%)",
            boxShadow: isBlocked
              ? "0 0 14px rgba(225, 29, 72, 0.65)"
              : "0 0 14px rgba(5, 150, 105, 0.6)",
          }}
        ></div>

        {/* Header with Fluid Pastel Wave Background matching Executive Modal Suite */}
        <div className="relative px-3.5 sm:px-4 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
          {/* Top-Right Fluid Pastel Wave Background */}
          <div className="absolute top-0 right-0 w-[340px] sm:w-[420px] h-full pointer-events-none overflow-hidden z-0">
            <svg
              viewBox="0 0 500 74"
              fill="none"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <mask id="blockerModalWaveFadeMask">
                  <linearGradient id="blockerModalWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="black" />
                    <stop offset="18%" stopColor="white" />
                    <stop offset="100%" stopColor="white" />
                  </linearGradient>
                  <rect width="500" height="74" fill="url(#blockerModalWaveFadeGrad)" />
                </mask>

                <linearGradient id="blockerModalWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                  <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                  <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                  <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                </linearGradient>

                <linearGradient id="blockerModalWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                  <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                  <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                </linearGradient>

                <linearGradient id="blockerModalWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                  <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              <g mask="url(#blockerModalWaveFadeMask)">
                <path
                  d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                  fill="url(#blockerModalWaveGrad1)"
                />
                <path
                  d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                  fill="url(#blockerModalWaveGrad2)"
                />
                <path
                  d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                  fill="url(#blockerModalWaveGrad3)"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>

          {/* Left: Squircle Governance Icon + Project Information */}
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-indigo-500/20 shrink-0 border border-white/20">
              <i className={`bi ${isBlocked ? "bi-exclamation-triangle-fill text-rose-200" : "bi-shield-check text-amber-300"}`}></i>
            </div>

            <div className="min-w-0">
              {/* Project Title + PRJ-ID Pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-[13.5px] sm:text-[14.5px] text-slate-900 mb-0 tracking-tight leading-tight truncate" title={project.title}>
                  {project.title}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
                  PRJ-{String(project.id).padStart(4, "0")}
                </span>
              </div>

              {/* Subtitle Line with Department, Lead Supervisor & Target Date */}
              <div className="text-[10.5px] sm:text-[11px] text-slate-400 mb-1 font-normal leading-tight truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
                {project.department_name && (
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <i className="bi bi-building text-[9.5px] text-indigo-500"></i>
                    <span>{project.department_name}</span>
                  </span>
                )}
                {project.supervisor_name && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <i className="bi bi-person text-[9.5px] text-emerald-500"></i>
                      <span>Lead: {project.supervisor_name}</span>
                    </span>
                  </>
                )}
                {project.target_date && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                      <i className="bi bi-calendar-event text-[9.5px] text-amber-500"></i>
                      <span>Target: {project.target_date}</span>
                    </span>
                  </>
                )}
              </div>

              {/* Meta Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold shadow-2xs border ${
                    isBlocked
                      ? "bg-rose-50/90 text-rose-700 border-rose-200/90"
                      : "bg-emerald-50/90 text-emerald-700 border-emerald-200/90"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shadow-xs ${
                      isBlocked ? "bg-rose-500 shadow-rose-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                    }`}
                  ></span>
                  <span>{isBlocked ? "Executive Blocker Flagged" : "Initiative Unblocked / Normal"}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold bg-indigo-50/80 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                  <i className="bi bi-shield-exclamation text-[9px] text-indigo-600"></i>
                  <span>Risk & Blocker Governance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center shrink-0 transition-all cursor-pointer text-xs relative z-10"
            title="Close Blocker Dialog"
            aria-label="Close"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </div>

        {/* Existing Escalation Telemetry Ribbon (If currently blocked in DB) */}
        {project.is_blocked && project.blocker_status !== "none" && (
          <div className="bg-rose-50/70 border-b border-rose-200/80 px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center text-sm shrink-0 shadow-2xs">
                <i className="bi bi-shield-slash-fill"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10.5px] font-bold text-rose-900 uppercase tracking-wider">
                    Active Blocker: {project.blocker_status?.replace(/_/g, " ")}
                  </span>
                  {escalationTelemetry && (
                    <span className="text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200/80 px-2 py-0.2 rounded-full shadow-2xs">
                      {escalationTelemetry.relative}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-rose-700/90 truncate mt-0.5">
                  {escalationTelemetry?.formattedDate && (
                    <span>Escalated on {escalationTelemetry.formattedDate}</span>
                  )}
                  {project.blocker_flagged_by_name && (
                    <span> by <strong className="font-semibold text-rose-900">{project.blocker_flagged_by_name}</strong></span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickResolve}
              disabled={saving}
              className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-200/90 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-98"
              title="Immediately mark this blocker resolved"
            >
              <i className="bi bi-check2-circle text-emerald-600 text-xs"></i>
              <span>Resolve Blocker Now</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 bg-slate-50/40 space-y-3.5">
            {/* Error message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <i className="bi bi-exclamation-octagon-fill text-rose-600 shrink-0"></i>
                  <span className="font-medium">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            )}

            {/* 1. Master Flag Toggle Card */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0">
                  Initiative Blocker State
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  Select operational risk status
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setIsBlocked(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    !isBlocked
                      ? "bg-white text-emerald-700 shadow-2xs border border-slate-200/80"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <i className="bi bi-check-circle-fill text-emerald-600"></i>
                  <span>Healthy / Clear</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBlocked(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isBlocked
                      ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <i className={`bi bi-exclamation-triangle-fill ${isBlocked ? "text-amber-200" : "text-amber-500"}`}></i>
                  <span>Flagged as Blocker</span>
                </button>
              </div>
            </div>

            {/* Conditional Blocker Configuration Section */}
            {isBlocked ? (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* 2. Blocker Category Selection Card */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0">
                      Blocker Category
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Select principal bottleneck
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {BLOCKER_CATEGORIES.map((cat) => {
                      const isSelected = blockerStatus === cat.key;
                      return (
                        <div
                          key={cat.key}
                          onClick={() => setBlockerStatus(cat.key)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative flex items-start gap-2.5 ${
                            isSelected
                              ? `${cat.bgLightClass} ${cat.borderClass} shadow-2xs ring-1 ring-rose-500/70`
                              : "bg-slate-50/70 hover:bg-white border-slate-200/80 text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-2xs border ${
                              isSelected
                                ? `bg-white border-white/80 font-bold ${cat.colorClass}`
                                : "bg-white border-slate-200/80 text-slate-500"
                            }`}
                          >
                            <i className={`bi ${cat.icon}`}></i>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {cat.label}
                              </span>
                              {isSelected && (
                                <i className="bi bi-check-circle-fill text-rose-600 text-xs"></i>
                              )}
                            </div>
                            <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5 line-clamp-2 mb-0">
                              {cat.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Executive Blocker Notes Card */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0">
                      Executive Blocker Notes & Unblocking Path <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                      {blockerNotes.length} chars
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={blockerNotes}
                    onChange={(e) => setBlockerNotes(e.target.value)}
                    placeholder="Detail the blocker, impact on target deadline, accountable stakeholders, and action items needed to unblock..."
                    className="w-full text-xs font-medium rounded-xl bg-slate-50/70 border border-slate-200/80 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 p-3 text-slate-800 placeholder-slate-400 transition-all resize-none shadow-2xs"
                    required={isBlocked}
                  />

                  {/* Quick Suggestion Chips */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Quick Suggestion Templates ({currentCategory.badgeLabel}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentCategory.suggestedNotes.map((note, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyTemplate(note)}
                          className="text-[10.5px] font-medium bg-slate-50/80 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 px-2.5 py-1 rounded-xl border border-slate-200/80 shadow-2xs transition-all text-left cursor-pointer"
                          title="Click to append this note"
                        >
                          + {note}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-center animate-in fade-in duration-200">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center text-lg mx-auto mb-3 shadow-2xs">
                <i className="bi bi-shield-check"></i>
              </div>
              <h3 className="text-[13px] font-bold text-slate-900 mb-1 tracking-tight">
                Ready to Clear Blocker & Restore Normal Status
              </h3>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed mb-0">
                Saving will remove the high-visibility blocker banner from all project views and return the initiative health to its standard timeline calculation.
              </p>
            </div>
          )}

          </div>

          {/* Modal Footer matching Executive Tab Standard */}
          <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
            <div className="text-[10.5px] text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full shadow-xs ${
                  isBlocked ? "bg-rose-500 shadow-rose-500/50" : "bg-emerald-500 shadow-emerald-500/50"
                }`}
              ></span>
              <span>Risk Escalation Protocol • Governance Certified</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                Cancel
              </button>

              {project.is_blocked && isBlocked && (
                <button
                  type="button"
                  onClick={handleQuickResolve}
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-200/90 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
                >
                  <i className="bi bi-check-lg"></i>
                  <span>Clear Blocker</span>
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98 ${
                  isBlocked
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                }`}
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Saving...</span>
                  </>
                ) : isBlocked ? (
                  <>
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Escalate & Flag Blocker</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle"></i>
                    <span>Confirm Unblocked</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
