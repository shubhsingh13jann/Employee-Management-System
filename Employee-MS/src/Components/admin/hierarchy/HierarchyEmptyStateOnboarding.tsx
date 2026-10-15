import React from "react";

interface HierarchyEmptyStateOnboardingProps {
  onOpenAssignModal: () => void;
  onOpenAutoAssignWizard?: () => void;
  onResetFilters?: () => void;
  isSimulated?: boolean;
  onExitSimulation?: () => void;
  title?: string;
  description?: string;
}

export const HierarchyEmptyStateOnboarding: React.FC<HierarchyEmptyStateOnboardingProps> = ({
  onOpenAssignModal,
  onOpenAutoAssignWizard,
  onResetFilters,
  isSimulated = false,
  onExitSimulation,
  title = "No Reporting Lines Established Yet",
  description = "Connect employees to team leads, assign department managers, and establish transparent chains of command across your enterprise workforce.",
}) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center animate-in fade-in duration-200 overflow-hidden relative">
      {/* Simulation Banner */}
      {isSimulated && (
        <div className="mb-6 -mt-2 -mx-2 sm:-mx-6 p-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-xl border border-purple-200/80 flex items-center justify-between gap-3 text-xs text-purple-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
            <span className="font-bold">First-Time Setup & Empty State Simulation Mode</span>
            <span className="hidden sm:inline text-purple-700">
              — Previewing the new-tenant onboarding flow
            </span>
          </div>
          {onExitSimulation && (
            <button
              type="button"
              onClick={onExitSimulation}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Exit Preview Mode
            </button>
          )}
        </div>
      )}

      {/* Hero Visual Icon */}
      <div className="relative inline-flex items-center justify-center mb-5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-indigo-600/20 ring-8 ring-indigo-50">
          <i className="bi bi-diagram-3-fill"></i>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center text-sm font-bold shadow-md">
          <i className="bi bi-stars"></i>
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="max-w-xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-3">
          <i className="bi bi-rocket-takeoff-fill text-[11px]"></i>
          <span>First-Time Team Hierarchy Onboarding</span>
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>

      {/* 3-Step Guided Framework */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8 text-left">
        {/* Step 1 */}
        <div className="p-4 rounded-xl border border-amber-200/90 bg-amber-50/40 relative group hover:border-amber-300 transition-all shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              1
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
              Staff Pool
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900 mb-1">Select Employee</h4>
          <p className="text-[11px] text-slate-500 leading-normal mb-0">
            Choose an unassigned employee from your active roster or import new personnel.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-xl border border-emerald-200/90 bg-emerald-50/40 relative group hover:border-emerald-300 transition-all shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              2
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              Span Balance
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900 mb-1">Assign Direct Lead</h4>
          <p className="text-[11px] text-slate-500 leading-normal mb-0">
            Pick a qualified supervisor with live capacity telemetry to ensure balanced workloads.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-xl border border-indigo-200/90 bg-indigo-50/40 relative group hover:border-indigo-300 transition-all shadow-2xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              3
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
              Governance
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900 mb-1">Set Manager Chain</h4>
          <p className="text-[11px] text-slate-500 leading-normal mb-0">
            Route reporting lines to the department head for automated approvals & audit records.
          </p>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenAssignModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <i className="bi bi-person-plus-fill"></i>
          <span>Assign First Team Member</span>
        </button>

        {onOpenAutoAssignWizard && (
          <button
            type="button"
            onClick={onOpenAutoAssignWizard}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs sm:text-sm border border-indigo-200 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <i className="bi bi-magic text-indigo-500"></i>
            <span>Launch Auto-Assign Wizard</span>
          </button>
        )}

        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
