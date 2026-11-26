import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

export interface ExpenseItem {
  id: number | string;
  project_id: number | string;
  title: string;
  category: "software" | "contractor" | "infra" | "hardware" | "travel" | "other";
  amount: number;
  expense_date: string;
  logged_by?: number | string;
  logged_by_name?: string;
  logged_by_image?: string;
  vendor_recipient?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
}

export interface BudgetSummary {
  budget_allocated: number;
  total_spent: number;
  runway_remaining: number;
  burn_rate_pct: number;
  is_critical_burn: boolean;
  is_over_budget: boolean;
  burn_status: "healthy" | "caution" | "warning_90" | "over_budget";
  expense_count: number;
}

export interface CategoryBreakdown {
  software: number;
  contractor: number;
  infra: number;
  hardware: number;
  travel: number;
  other: number;
}

interface ProjectBudgetBurnHUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: number | string;
    title: string;
    budget?: number;
    department_name?: string;
    target_date?: string;
    status?: string;
    priority?: string;
    supervisor_name?: string;
  } | null;
  onBudgetUpdated?: () => void;
}

export const ProjectBudgetBurnHUDModal: React.FC<ProjectBudgetBurnHUDModalProps> = ({
  isOpen,
  onClose,
  project,
  onBudgetUpdated,
}) => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [summary, setSummary] = useState<BudgetSummary>({
    budget_allocated: 0,
    total_spent: 0,
    runway_remaining: 0,
    burn_rate_pct: 0,
    is_critical_burn: false,
    is_over_budget: false,
    burn_status: "healthy",
    expense_count: 0,
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown>({
    software: 0,
    contractor: 0,
    infra: 0,
    hardware: 0,
    travel: 0,
    other: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [msg, setMsg] = useState<{ type: string; text: string }>({ type: "", text: "" });

  // Logging Expenditure Form State
  const [showLogForm, setShowLogForm] = useState<boolean>(false);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formCategory, setFormCategory] = useState<"software" | "contractor" | "infra" | "hardware" | "travel" | "other">("software");
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [formVendor, setFormVendor] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [submittingExpense, setSubmittingExpense] = useState<boolean>(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | string | null>(null);

  const fetchExpenses = async () => {
    if (!project?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/api/admin/projects/${project.id}/expenses`);
      if (res.data.status) {
        setExpenses(res.data.expenses || []);
        if (res.data.summary) setSummary(res.data.summary);
        if (res.data.category_breakdown) setCategoryBreakdown(res.data.category_breakdown);
      }
    } catch (err: any) {
      console.error("Failed to load project expenditures:", err);
      setMsg({ type: "danger", text: "Failed to load budget and expenditure data" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.id) return;
    if (!formTitle.trim()) {
      setMsg({ type: "danger", text: "Please provide an expenditure title" });
      return;
    }
    const numAmt = parseFloat(formAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setMsg({ type: "danger", text: "Please enter a valid amount greater than $0" });
      return;
    }

    try {
      setSubmittingExpense(true);
      const res = await api.post(`/api/admin/projects/${project.id}/expenses`, {
        title: formTitle.trim(),
        amount: numAmt,
        category: formCategory,
        expense_date: formDate,
        vendor_recipient: formVendor.trim() || null,
        notes: formNotes.trim() || null,
      });

      if (res.data.status) {
        setMsg({ type: "success", text: "Expenditure logged successfully!" });
        setFormTitle("");
        setFormAmount("");
        setFormVendor("");
        setFormNotes("");
        setShowLogForm(false);
        await fetchExpenses();
        if (onBudgetUpdated) onBudgetUpdated();
      }
    } catch (err: any) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to log expenditure" });
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (exp: ExpenseItem) => {
    if (!window.confirm(`Delete expenditure "${exp.title}" (${formatCurrency(exp.amount)})?`)) return;

    try {
      setDeletingExpenseId(exp.id);
      const res = await api.delete(`/api/admin/projects/expenses/${exp.id}`);
      if (res.data.status) {
        setMsg({ type: "success", text: "Expenditure record deleted" });
        await fetchExpenses();
        if (onBudgetUpdated) onBudgetUpdated();
      }
    } catch (err: any) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to delete expenditure" });
    } finally {
      setDeletingExpenseId(null);
    }
  };

  useEffect(() => {
    if (isOpen && project?.id) {
      fetchExpenses();
      setSearchTerm("");
      setSelectedCategoryFilter("all");
      setMsg({ type: "", text: "" });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, project?.id]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchCategory =
        selectedCategoryFilter === "all" || e.category === selectedCategoryFilter;
      const matchSearch =
        !searchTerm.trim() ||
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.vendor_recipient &&
          e.vendor_recipient.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [expenses, selectedCategoryFilter, searchTerm]);

  if (!isOpen || !project) return null;

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "software":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "contractor":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "infra":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "hardware":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "travel":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "software":
        return "bi-code-slash";
      case "contractor":
        return "bi-people";
      case "infra":
        return "bi-hdd-network";
      case "hardware":
        return "bi-cpu";
      case "travel":
        return "bi-airplane";
      default:
        return "bi-receipt";
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Centered strictly within the right-side content portion (offsetting sidebar on md+) */}
      <div className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="w-full max-w-[880px] max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header with Fluid Pastel Wave Background matching Squad Roster & In-View Tasks Modals */}
          <div className="relative px-3.5 sm:px-4 py-3 sm:py-3.5 bg-white flex items-center justify-between border-b border-slate-200 overflow-hidden shrink-0">
            {/* Top-Right Fluid Pastel Wave Background */}
            <div className="absolute top-0 right-0 w-[360px] sm:w-[460px] h-full pointer-events-none overflow-hidden z-0">
              <svg
                viewBox="0 0 500 74"
                fill="none"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <mask id="budgetHudWaveFadeMask">
                    <linearGradient id="budgetHudWaveFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="black" />
                      <stop offset="18%" stopColor="white" />
                      <stop offset="100%" stopColor="white" />
                    </linearGradient>
                    <rect width="500" height="74" fill="url(#budgetHudWaveFadeGrad)" />
                  </mask>

                  <linearGradient id="budgetHudWaveGrad1" x1="0%" y1="0%" x2="100%" y2="70%">
                    <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.2" />
                    <stop offset="30%" stopColor="#D7E0FC" stopOpacity="0.85" />
                    <stop offset="65%" stopColor="#E0E7FE" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#EDE9FE" stopOpacity="0.7" />
                  </linearGradient>

                  <linearGradient id="budgetHudWaveGrad2" x1="15%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D8E2FB" stopOpacity="0.3" />
                    <stop offset="30%" stopColor="#C7D2FE" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#DDD6FE" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#E9D5FF" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.4" />
                  </linearGradient>

                  <linearGradient id="budgetHudWaveGrad3" x1="30%" y1="10%" x2="95%" y2="100%">
                    <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.5" />
                    <stop offset="45%" stopColor="#DDD6FE" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                <g mask="url(#budgetHudWaveFadeMask)">
                  <path
                    d="M0 26 C60 10 120 8 180 18 C245 28 305 50 370 38 C425 28 465 10 500 20 V0 H0 Z"
                    fill="url(#budgetHudWaveGrad1)"
                  />
                  <path
                    d="M0 50 C80 34 145 12 215 10 C280 8 330 32 390 44 C445 54 475 38 500 28 V0 H0 Z"
                    fill="url(#budgetHudWaveGrad2)"
                  />
                  <path
                    d="M130 38 C195 26 260 48 325 56 C385 64 445 50 500 38 V8 C470 20 420 18 370 24 C310 34 235 32 130 38 Z"
                    fill="url(#budgetHudWaveGrad3)"
                    opacity="0.75"
                  />
                </g>
              </svg>
            </div>

            {/* Left: Squircle Finance Icon + Project Information */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-indigo-500/20 shrink-0 border border-white/20">
                <i className="bi bi-cash-stack text-amber-300"></i>
              </div>

              <div className="min-w-0">
                {/* Project Title + PRJ-ID Pill */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-[13.5px] sm:text-[14.5px] text-slate-900 mb-0 tracking-tight leading-tight truncate">
                    {project.title}
                  </h3>
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
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold capitalize bg-emerald-50/80 text-emerald-700 border border-emerald-200/90 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                    <span>{project.status || "Active"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold bg-indigo-50/80 text-indigo-700 border border-indigo-200/90 shadow-2xs">
                    <i className="bi bi-graph-up-arrow text-[9px] text-indigo-600"></i>
                    <span>Financial Runway HUD</span>
                  </div>
                  {project.priority && (
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[9.5px] font-bold uppercase shadow-2xs border ${
                        project.priority === "urgent" || project.priority === "critical"
                          ? "bg-rose-50/80 text-rose-700 border-rose-200"
                          : project.priority === "high"
                          ? "bg-amber-50/80 text-amber-700 border-amber-200"
                          : "bg-indigo-50/60 text-indigo-700 border-indigo-100"
                      }`}
                    >
                      <span>{project.priority}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Log Expenditure Action + Close Button */}
            <div className="flex items-center gap-2 shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => setShowLogForm((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-98 ${
                  showLogForm
                    ? "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                }`}
              >
                <i className={`bi ${showLogForm ? "bi-dash-lg" : "bi-plus-lg"} text-xs`}></i>
                <span>{showLogForm ? "Hide Form" : "Log Expenditure"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200/90 shadow-2xs flex items-center justify-center transition-all cursor-pointer text-xs shrink-0"
                title="Close Budget & Burn HUD"
                aria-label="Close"
              >
                <i className="bi bi-x-lg text-xs"></i>
              </button>
            </div>
          </div>

          {/* 1.5 Collapsible Log Expenditure Executive Form Card */}
          {showLogForm && (
            <div className="px-3.5 sm:px-4 py-3.5 bg-slate-50/70 border-b border-slate-200/80 animate-in slide-in-from-top-2 duration-150 shrink-0">
              <form
                onSubmit={handleLogExpense}
                className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-indigo-600 border border-purple-100 flex items-center justify-center text-sm shadow-2xs shrink-0">
                      <i className="bi bi-receipt-cutoff"></i>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900 mb-0 tracking-tight leading-tight">
                        Log New Project Expenditure
                      </h4>
                      <p className="text-[10px] text-slate-400 mb-0">
                        Automatically adjusts live budget burn metrics and runway telemetry
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Expenditure Title / Deliverable <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Datadog Production APM License"
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Amount ($ USD) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        placeholder="4500.00"
                        className="w-full text-xs pl-7 pr-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-900 font-semibold placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                    >
                      <option value="software">💻 Software License</option>
                      <option value="contractor">👥 External Contractor</option>
                      <option value="infra">☁️ Cloud Infra (AWS/GCP)</option>
                      <option value="hardware">🖥️ Hardware & Equipment</option>
                      <option value="travel">✈️ Travel & Offsite</option>
                      <option value="other">📦 Other Operations</option>
                    </select>
                  </div>

                  {/* Expense Date */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs cursor-pointer"
                    />
                  </div>

                  {/* Vendor / Recipient */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Vendor / Contractor
                    </label>
                    <input
                      type="text"
                      value={formVendor}
                      onChange={(e) => setFormVendor(e.target.value)}
                      placeholder="e.g. Amazon Web Services"
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Receipt Memo / PO Notes
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="e.g. Approved via PO #9281, includes 10 engineering seats"
                      className="w-full text-xs font-medium px-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setShowLogForm(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200/90 shadow-2xs transition-all cursor-pointer active:scale-98"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingExpense || !formTitle.trim() || !formAmount}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm shadow-indigo-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 active:scale-98"
                  >
                    {submittingExpense ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Recording...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle text-xs"></i>
                        <span>Log Expenditure</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. Critical >90% Budget Alert Warning Banner */}
          {summary.is_critical_burn && (
            <div
              className={`px-3.5 sm:px-4 py-2 flex items-center justify-between gap-3 text-[11px] font-bold shrink-0 border-b ${
                summary.is_over_budget
                  ? "bg-rose-600 text-white border-rose-700"
                  : "bg-amber-500 text-white border-amber-600"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <i className="bi bi-exclamation-octagon-fill text-xs shrink-0"></i>
                <span className="truncate">
                  {summary.is_over_budget
                    ? `OVER BUDGET ALERT: Expenditure exceeded allocated capital by ${formatCurrency(
                        summary.total_spent - summary.budget_allocated
                      )}`
                    : `CRITICAL BURN ALERT: ${summary.burn_rate_pct}% of allocated funds consumed (${formatCurrency(
                        summary.runway_remaining
                      )} remaining)`}
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md font-bold shrink-0">
                High Risk
              </span>
            </div>
          )}

          {/* 3. Executive Telemetry Bar / HUD Grid matching In-View Tasks & Dossier Modals */}
          <div className="bg-slate-50/60 border-b border-slate-200/80 px-3.5 sm:px-4 py-2.5 shrink-0 space-y-2.5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Metric 1: Budget Allocated */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  <span>Allocated Budget</span>
                  <i className="bi bi-wallet2 text-indigo-500 text-xs"></i>
                </div>
                <div className="text-[13.5px] sm:text-[14.5px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  {formatCurrency(summary.budget_allocated)}
                </div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">
                  Total approved capital
                </div>
              </div>

              {/* Metric 2: Actual Expenditure */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  <span>Actual Spend</span>
                  <i className="bi bi-receipt text-purple-500 text-xs"></i>
                </div>
                <div
                  className={`text-[13.5px] sm:text-[14.5px] font-extrabold tracking-tight leading-tight ${
                    summary.is_critical_burn ? "text-rose-600" : "text-slate-900"
                  }`}
                >
                  {formatCurrency(summary.total_spent)}
                </div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">
                  {summary.expense_count} logged receipts
                </div>
              </div>

              {/* Metric 3: Remaining Runway */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  <span>Remaining Runway</span>
                  <i className="bi bi-safe2 text-emerald-500 text-xs"></i>
                </div>
                <div
                  className={`text-[13.5px] sm:text-[14.5px] font-extrabold tracking-tight leading-tight ${
                    summary.runway_remaining <= 0
                      ? "text-rose-600"
                      : summary.runway_remaining < summary.budget_allocated * 0.15
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {formatCurrency(summary.runway_remaining)}
                </div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">
                  Available uncommitted
                </div>
              </div>

              {/* Metric 4: Burn Rate Percentage */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  <span>Budget Burn Rate</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                      summary.is_over_budget
                        ? "bg-rose-50 text-rose-700 border-rose-200/80"
                        : summary.is_critical_burn
                        ? "bg-amber-50 text-amber-700 border-amber-200/80"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                    }`}
                  >
                    {summary.is_over_budget
                      ? "Deficit"
                      : summary.is_critical_burn
                      ? "High Burn"
                      : "Optimal"}
                  </span>
                </div>
                <div
                  className={`text-[13.5px] sm:text-[14.5px] font-extrabold tracking-tight leading-tight ${
                    summary.is_over_budget || summary.burn_rate_pct >= 90
                      ? "text-rose-600"
                      : summary.burn_rate_pct >= 75
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {summary.burn_rate_pct}%
                </div>
                <div className="text-[9.5px] text-slate-400 mt-0.5">
                  Pacing vs scope
                </div>
              </div>
            </div>

            {/* Visual Budget Burn Progress Meter */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] mb-1.5">
                <span className="font-bold uppercase tracking-wider text-slate-500 text-[9px]">
                  Capital Expenditure Progress Meter
                </span>
                <span className="font-bold text-slate-700">
                  {formatCurrency(summary.total_spent)} of {formatCurrency(summary.budget_allocated)} (
                  <span className="text-indigo-700">{summary.burn_rate_pct}%</span>)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200/60">
                <div
                  style={{ width: `${Math.min(100, summary.burn_rate_pct)}%` }}
                  className={`h-full transition-all duration-500 rounded-full ${
                    summary.is_over_budget
                      ? "bg-gradient-to-r from-rose-500 to-rose-700"
                      : summary.burn_rate_pct >= 90
                      ? "bg-gradient-to-r from-amber-500 to-rose-600"
                      : summary.burn_rate_pct >= 75
                      ? "bg-gradient-to-r from-amber-400 to-orange-500"
                      : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                  }`}
                ></div>

                {/* 90% threshold safety guide line */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-10 shadow-xs"
                  style={{ left: "90%" }}
                  title="90% Critical Budget Burn Limit"
                ></div>
              </div>
              <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 font-medium">
                <span>0% Commenced</span>
                <span className="text-amber-600 font-semibold">90% Safety Limit</span>
                <span>100% Allocated Cap</span>
              </div>
            </div>
          </div>

          {/* 4. Category Breakdown Distribution Ribbon */}
          <div className="px-3.5 sm:px-4 py-2 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
                Distribution:
              </span>
              {(
                [
                  { id: "software", label: "Software", amt: categoryBreakdown.software, color: "bg-indigo-600" },
                  { id: "contractor", label: "Contractor", amt: categoryBreakdown.contractor, color: "bg-purple-600" },
                  { id: "infra", label: "Infra", amt: categoryBreakdown.infra, color: "bg-cyan-600" },
                  { id: "hardware", label: "Hardware", amt: categoryBreakdown.hardware, color: "bg-amber-600" },
                  { id: "other", label: "Other", amt: categoryBreakdown.other + categoryBreakdown.travel, color: "bg-slate-600" },
                ] as const
              ).map((cat) => {
                const pct = summary.total_spent > 0 ? Math.round((cat.amt / summary.total_spent) * 100) : 0;
                return (
                  <div
                    key={`cat-dist-${cat.id}`}
                    className="px-2 py-0.5 rounded-lg bg-slate-50/80 border border-slate-200/80 text-[10.5px] flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.color}`}></span>
                    <span className="text-slate-600 font-semibold">{cat.label}:</span>
                    <span className="text-slate-900 font-bold">{formatCurrency(cat.amt)}</span>
                    <span className="text-[9.5px] text-slate-400 font-medium">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4.5 Filter & Search Toolbar matching In-View Tasks Breakdown */}
          <div className="px-3.5 sm:px-4 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-white">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: "all", label: "All Items", count: expenses.length },
                  { id: "software", label: "Software", count: expenses.filter((e) => e.category === "software").length },
                  { id: "contractor", label: "Contractor", count: expenses.filter((e) => e.category === "contractor").length },
                  { id: "infra", label: "Infra", count: expenses.filter((e) => e.category === "infra").length },
                  { id: "hardware", label: "Hardware", count: expenses.filter((e) => e.category === "hardware").length },
                  { id: "other", label: "Other", count: expenses.filter((e) => e.category === "other" || e.category === "travel").length },
                ] as const
              ).map((f) => (
                <button
                  key={`filter-${f.id}`}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(f.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategoryFilter === f.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      selectedCategoryFilter === f.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative min-w-[200px] sm:min-w-[230px]">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search receipts or vendors..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-50/70 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* 5. Logged Expenditures Ledger */}
          <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 bg-slate-50/40 space-y-3">
            {msg.text && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs animate-in fade-in shadow-2xs ${
                  msg.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <i
                    className={`bi ${
                      msg.type === "success"
                        ? "bi-check-circle-fill text-emerald-600"
                        : "bi-exclamation-triangle-fill text-rose-600"
                    }`}
                  ></i>
                  <span className="font-medium">{msg.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMsg({ type: "", text: "" })}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer text-xs"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            )}

            {/* Expenses Table */}
            {loading ? (
              <div className="py-14 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-xs font-medium">Loading project expenditures...</span>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center text-base mx-auto mb-2.5">
                  <i className="bi bi-receipt"></i>
                </div>
                <p className="font-bold text-slate-800 text-xs mb-1">
                  No Expenditures Found
                </p>
                <p className="text-[11px] text-slate-400 mb-3.5">
                  {searchTerm || selectedCategoryFilter !== "all"
                    ? "Try adjusting your search criteria or category filter."
                    : "No expenses have been logged for this initiative yet."}
                </p>
                {!showLogForm && (
                  <button
                    type="button"
                    onClick={() => setShowLogForm(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm shadow-indigo-600/20"
                  >
                    <i className="bi bi-plus-lg"></i>
                    <span>Log First Expenditure</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-500 font-bold text-[9.5px] uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">Date</th>
                      <th className="py-2.5 px-3.5">Title & Details</th>
                      <th className="py-2.5 px-3.5 text-center">Category</th>
                      <th className="py-2.5 px-3.5">Vendor / Recipient</th>
                      <th className="py-2.5 px-3.5 text-right">Amount</th>
                      <th className="py-2.5 px-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                          {new Date(exp.expense_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 px-3.5 min-w-[200px]">
                          <span className="font-bold text-xs text-slate-900 block leading-tight">
                            {exp.title}
                          </span>
                          {exp.notes && (
                            <span className="text-[10.5px] text-slate-400 block mt-0.5 truncate max-w-xs">
                              {exp.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold border inline-flex items-center gap-1 shadow-2xs ${getCategoryBadge(
                              exp.category
                            )}`}
                          >
                            <i className={`bi ${getCategoryIcon(exp.category)} text-[8.5px]`}></i>
                            <span className="capitalize">{exp.category}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-[11.5px] font-medium text-slate-700 whitespace-nowrap">
                          {exp.vendor_recipient || "Internal Allocation"}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-extrabold text-xs text-slate-900 whitespace-nowrap">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp)}
                            disabled={deletingExpenseId === exp.id}
                            className="w-7 h-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 inline-flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                            title="Delete expenditure record"
                          >
                            {deletingExpenseId === exp.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <i className="bi bi-trash3 text-xs"></i>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
