import React, { useState, useEffect } from "react";
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

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pulsing Top Laser Accent Bar */}
        <div
          className={`h-1.5 w-full transition-colors duration-300 ${
            isBlocked
              ? "bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 animate-pulse"
              : "bg-gradient-to-r from-emerald-500 to-teal-600"
          }`}
        ></div>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/70">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isBlocked
                    ? "bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}
              >
                <i
                  className={`bi ${
                    isBlocked ? "bi-exclamation-triangle-fill text-rose-600" : "bi-check-circle-fill text-emerald-600"
                  } text-xs`}
                ></i>
                {isBlocked ? "Executive Blocker Flagged" : "Initiative Unblocked / Normal"}
              </span>

              <span className="text-xs font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                PRJ-{String(project.id).padStart(4, "0")}
              </span>

              {project.department_name && (
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full">
                  {project.department_name}
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate" title={project.title}>
              {project.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <i className="bi bi-x-lg text-sm"></i>
          </button>
        </div>

        {/* Existing Escalation Telemetry Ribbon (If currently blocked in DB) */}
        {project.is_blocked && project.blocker_status !== "none" && (
          <div className="bg-rose-50/90 border-b border-rose-200 p-3 sm:px-5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs animate-bounce">
                <i className="bi bi-shield-slash-fill"></i>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                    Active Blocker: {project.blocker_status?.replace(/_/g, " ")}
                  </span>
                  {escalationTelemetry && (
                    <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-1.5 py-0.2 rounded-full">
                      {escalationTelemetry.relative}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-rose-700 truncate">
                  {escalationTelemetry?.formattedDate && (
                    <span>Escalated on {escalationTelemetry.formattedDate}</span>
                  )}
                  {project.blocker_flagged_by_name && (
                    <span> by {project.blocker_flagged_by_name}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickResolve}
              disabled={saving}
              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Immediately mark this blocker resolved"
            >
              <i className="bi bi-check2-circle text-emerald-600"></i>
              <span>Resolve Blocker Now</span>
            </button>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mx-4 sm:mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <i className="bi bi-exclamation-octagon-fill text-rose-600 shrink-0"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* 1. Master Flag Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Initiative Blocker State
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setIsBlocked(false)}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isBlocked
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="bi bi-check-circle-fill text-emerald-600"></i>
                <span>Healthy / Clear</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBlocked(true)}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isBlocked
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="bi bi-exclamation-triangle-fill text-amber-200"></i>
                <span>Flagged as Blocker</span>
              </button>
            </div>
          </div>

          {/* Conditional Blocker Configuration Section */}
          {isBlocked ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* 2. Blocker Category Selection Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Blocker Category
                  </label>
                  <span className="text-[11px] text-slate-400">Select principal bottleneck</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BLOCKER_CATEGORIES.map((cat) => {
                    const isSelected = blockerStatus === cat.key;
                    return (
                      <div
                        key={cat.key}
                        onClick={() => setBlockerStatus(cat.key)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer text-left relative flex items-start gap-2.5 ${
                          isSelected
                            ? `${cat.bgLightClass} ${cat.borderClass} shadow-xs ring-1 ring-rose-500`
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                            isSelected
                              ? "bg-white shadow-2xs font-bold " + cat.colorClass
                              : "bg-slate-100 text-slate-500"
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
                          <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Executive Blocker Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Executive Blocker Notes & Unblocking Path <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">{blockerNotes.length} chars</span>
                </div>

                <textarea
                  rows={3}
                  value={blockerNotes}
                  onChange={(e) => setBlockerNotes(e.target.value)}
                  placeholder="Detail the blocker, impact on target deadline, accountable stakeholders, and action items needed to unblock..."
                  className="w-full text-xs rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 p-2.5 text-slate-800 placeholder-slate-400 transition-colors resize-none shadow-2xs"
                  required={isBlocked}
                />

                {/* Quick Suggestion Chips */}
                <div className="mt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Quick Suggestion Templates ({currentCategory.badgeLabel}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCategory.suggestedNotes.map((note, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyTemplate(note)}
                        className="text-[10.5px] bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors text-left cursor-pointer"
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
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center animate-in fade-in duration-200">
              <i className="bi bi-shield-check text-emerald-600 text-2xl block mb-1"></i>
              <h3 className="text-xs font-bold text-emerald-900 mb-0.5">
                Ready to Clear Blocker & Restore Normal Status
              </h3>
              <p className="text-[11px] text-emerald-700 max-w-md mx-auto">
                Saving will remove the high-visibility blocker banner from all project views and return the initiative health to its standard timeline calculation.
              </p>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {project.is_blocked && isBlocked && (
                <button
                  type="button"
                  onClick={handleQuickResolve}
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <i className="bi bi-check-lg"></i>
                  <span>Clear Blocker</span>
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  isBlocked
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
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
  );
};
