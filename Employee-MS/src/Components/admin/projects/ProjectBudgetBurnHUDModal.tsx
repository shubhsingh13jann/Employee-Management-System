import React, { useState, useEffect, useMemo } from "react";
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
      return () => window.removeEventListener("keydown", handleKeyDown);
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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Executive Dark Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRJ-{String(project.id).padStart(4, "0")}
              </span>
              {project.department_name && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/90 border border-white/15">
                  🏢 {project.department_name}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <i className="bi bi-cash-stack"></i>
                <span>Financial Runway HUD</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-0 truncate max-w-lg">
              {project.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Close modal"
            >
              <i className="bi bi-x-lg text-sm"></i>
            </button>
          </div>
        </div>

        {/* 2. Critical >90% Budget Alert Warning Banner */}
        {summary.is_critical_burn && (
          <div
            className={`px-6 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold shrink-0 animate-pulse ${
              summary.is_over_budget
                ? "bg-rose-600 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <i className="bi bi-exclamation-octagon-fill text-base"></i>
              <span>
                {summary.is_over_budget
                  ? `OVER BUDGET ALERT: Expenditure has exceeded allocated capital by ${formatCurrency(
                      summary.total_spent - summary.budget_allocated
                    )}!`
                  : `CRITICAL BURN ALERT: ${summary.burn_rate_pct}% of allocated funds consumed. Only ${formatCurrency(
                      summary.runway_remaining
                    )} runway remaining!`}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded font-bold">
              High Risk
            </span>
          </div>
        )}

        {/* 3. Executive Telemetry Bar: 4 Metric Cards */}
        <div className="p-6 bg-slate-50 border-b border-slate-200/80 shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {/* Metric 1: Budget Allocated */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Allocated Budget
              </span>
              <div className="text-lg font-black text-slate-900 leading-tight">
                {formatCurrency(summary.budget_allocated)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Total approved capital
              </span>
            </div>

            {/* Metric 2: Actual Expenditure */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Actual Expenditure
              </span>
              <div
                className={`text-lg font-black leading-tight ${
                  summary.is_critical_burn ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {formatCurrency(summary.total_spent)}
              </div>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">
                {summary.expense_count} logged receipts
              </span>
            </div>

            {/* Metric 3: Remaining Runway */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Remaining Runway
              </span>
              <div
                className={`text-lg font-black leading-tight ${
                  summary.runway_remaining <= 0
                    ? "text-rose-600"
                    : summary.runway_remaining < summary.budget_allocated * 0.15
                    ? "text-amber-600"
                    : "text-emerald-600"
                }`}
              >
                {formatCurrency(summary.runway_remaining)}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Available uncommitted
              </span>
            </div>

            {/* Metric 4: Burn Rate Percentage */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Budget Burn Rate
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-lg font-black leading-tight ${
                    summary.is_over_budget
                      ? "text-rose-600"
                      : summary.burn_rate_pct >= 90
                      ? "text-rose-600"
                      : summary.burn_rate_pct >= 75
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }`}
                >
                  {summary.burn_rate_pct}%
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                    summary.is_critical_burn
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {summary.is_over_budget
                    ? "Deficit"
                    : summary.is_critical_burn
                    ? "High Burn"
                    : "Optimal"}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Pacing vs scope
              </span>
            </div>
          </div>

          {/* Visual Budget Burn Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-slate-700">
                Capital Expenditure Progress Meter
              </span>
              <span className="font-semibold text-slate-500">
                {formatCurrency(summary.total_spent)} of {formatCurrency(summary.budget_allocated)} (
                {summary.burn_rate_pct}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden relative shadow-inner">
              <div
                style={{ width: `${Math.min(100, summary.burn_rate_pct)}%` }}
                className={`h-full transition-all duration-500 rounded-full ${
                  summary.is_over_budget
                    ? "bg-gradient-to-r from-red-600 to-rose-700"
                    : summary.burn_rate_pct >= 90
                    ? "bg-gradient-to-r from-amber-500 to-rose-600"
                    : summary.burn_rate_pct >= 75
                    ? "bg-gradient-to-r from-amber-400 to-orange-500"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600"
                }`}
              ></div>

              {/* 90% threshold safety guide line */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-10 shadow-xs"
                style={{ left: "90%" }}
                title="90% Critical Budget Burn Limit"
              ></div>
            </div>
            <div className="flex justify-between items-center text-[9.5px] text-slate-400 mt-1">
              <span>0% Commenced</span>
              <span className="text-amber-600 font-medium">90% Safety Limit</span>
              <span>100% Allocated Cap</span>
            </div>
          </div>
        </div>

        {/* 4. Category Breakdown Distribution Ribbon */}
        <div className="px-6 py-3 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Category Distribution:
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
                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-1.5"
                >
                  <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
                  <span className="text-slate-700 font-semibold">{cat.label}:</span>
                  <span className="text-slate-900 font-black">{formatCurrency(cat.amt)}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Logged Expenditures Ledger & Controls */}
        <div className="p-6 overflow-y-auto flex-1">
          {msg.text && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs mb-4 ${
                msg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <span>{msg.text}</span>
              <button
                type="button"
                onClick={() => setMsg({ type: "", text: "" })}
                className="text-slate-400 hover:text-slate-700"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
            <div className="relative w-full sm:w-64">
              <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search description, vendor..."
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {(
                [
                  { id: "all", label: "All Items" },
                  { id: "software", label: "Software" },
                  { id: "contractor", label: "Contractor" },
                  { id: "infra", label: "Infra" },
                  { id: "hardware", label: "Hardware" },
                  { id: "other", label: "Other" },
                ] as const
              ).map((f) => (
                <button
                  key={`filter-${f.id}`}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap leading-none ${
                    selectedCategoryFilter === f.id
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Expenses Table */}
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <span>Loading project expenditures...</span>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-base mx-auto mb-2">
                <i className="bi bi-receipt"></i>
              </div>
              <p className="font-bold text-slate-800 text-sm mb-0.5">
                No Expenditures Found
              </p>
              <p className="text-xs text-slate-400 mb-0">
                {searchTerm || selectedCategoryFilter !== "all"
                  ? "Try adjusting your search criteria or category filter."
                  : "No expenses have been logged for this initiative yet."}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-bold text-[10.5px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Title & Details</th>
                    <th className="py-2.5 px-3 text-center">Category</th>
                    <th className="py-2.5 px-3">Vendor / Recipient</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(exp.expense_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-2.5 px-3 min-w-[200px]">
                        <span className="font-bold text-slate-900 block leading-tight">
                          {exp.title}
                        </span>
                        {exp.notes && (
                          <span className="text-[10.5px] text-slate-400 block mt-0.5 truncate max-w-xs">
                            {exp.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border inline-flex items-center gap-1 ${getCategoryBadge(
                            exp.category
                          )}`}
                        >
                          <i className={`bi ${getCategoryIcon(exp.category)}`}></i>
                          <span className="capitalize">{exp.category}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {exp.vendor_recipient || "Internal Allocation"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatCurrency(exp.amount)}
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
  );
};
