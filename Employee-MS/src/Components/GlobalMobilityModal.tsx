import React, { useEffect, useState } from "react";
import api from "../api/axios";

interface GlobalMobilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: any[];
}

export const GlobalMobilityModal: React.FC<GlobalMobilityModalProps> = ({
  isOpen,
  onClose,
  departments
}) => {
  const [loading, setLoading] = useState(false);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchGlobalTransfers = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/api/admin/departments/transfers/global");
        if (res.data.status) {
          setTransfers(res.data.transfers || []);
        } else {
          setError(res.data.error || "Failed to load global mobility ledger");
        }
      } catch (err: any) {
        console.error("Global transfers load error:", err);
        setError(err.response?.data?.error || "Error loading mobility transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalTransfers();
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTransfers = transfers.filter((t) => {
    if (deptFilter) {
      const dId = Number(deptFilter);
      if (t.source_department_id !== dId && t.target_department_id !== dId) {
        return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.user_name?.toLowerCase().includes(q) ||
      t.user_email?.toLowerCase().includes(q) ||
      t.source_dept_name?.toLowerCase().includes(q) ||
      t.target_dept_name?.toLowerCase().includes(q) ||
      t.previous_supervisor_name?.toLowerCase().includes(q) ||
      t.new_supervisor_name?.toLowerCase().includes(q) ||
      t.reason?.toLowerCase().includes(q)
    );
  });

  const handleExportFullCSV = () => {
    if (!transfers || transfers.length === 0) return;
    const headers = [
      "Transaction ID",
      "Employee Name",
      "Email",
      "Role",
      "Source Department",
      "Source Code",
      "Destination Department",
      "Destination Code",
      "Previous Supervisor",
      "New Supervisor",
      "Governance Justification",
      "Transferred At"
    ];
    const rows = transfers.map((t: any) => [
      t.id,
      `"${(t.user_name || "").replace(/"/g, '""')}"`,
      `"${t.user_email || ""}"`,
      t.user_role || "employee",
      `"${(t.source_dept_name || "Unassigned").replace(/"/g, '""')}"`,
      t.source_dept_code || "",
      `"${(t.target_dept_name || "").replace(/"/g, '""')}"`,
      t.target_dept_code || "",
      `"${(t.previous_supervisor_name || "Direct to HOD").replace(/"/g, '""')}"`,
      `"${(t.new_supervisor_name || "Direct to HOD").replace(/"/g, '""')}"`,
      `"${(t.reason || "Realignment").replace(/"/g, '""')}"`,
      `"${new Date(t.transferred_at).toLocaleString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `org_wide_mobility_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniquePersonnelCount = new Set(transfers.map((t) => t.user_id)).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-xl font-bold shadow-inner shrink-0">
              <i className="bi bi-clock-history"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight mb-0">
                  Workforce Mobility Audit Ledger
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Global Enterprise Scope
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 mb-0">
                Complete organization-wide history of cross-department transfers and squad reorganizations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {transfers.length > 0 && (
              <button
                type="button"
                onClick={handleExportFullCSV}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download Organization Ledger (CSV)"
              >
                <i className="bi bi-download text-[11px]"></i>
                <span className="hidden sm:inline">Export Org Ledger</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
              title="Close Ledger"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Executive Metrics Ribbon */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Logged Movements:</span>
              <span className="font-bold text-slate-800 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-2xs">
                {transfers.length} Transactions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Unique Personnel:</span>
              <span className="font-bold text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                {uniquePersonnelCount} Mobilized
              </span>
            </div>
          </div>

          {/* Quick Search & Filter Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, dept, lead, reason..."
                className="pl-7 pr-3 py-1.5 rounded-lg text-xs bg-white border border-slate-200 focus:border-indigo-500 outline-none w-48 sm:w-60 text-slate-700 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-white border border-slate-200 text-slate-700 outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">Loading organization mobility ledger...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          ) : filteredTransfers.length > 0 ? (
            <div className="space-y-3">
              {filteredTransfers.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all space-y-3 shadow-2xs"
                >
                  {/* Top Bar: Candidate & Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {t.user_image_url ? (
                        <img
                          src={t.user_image_url}
                          alt={t.user_name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                          {t.user_name ? t.user_name.charAt(0) : "U"}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="font-bold text-slate-900 text-xs mb-0">{t.user_name}</h6>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {t.user_role}
                          </span>
                          <span className="text-[10px] text-slate-400">ID #{t.id}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{t.user_email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <i className="bi bi-calendar-check text-[10px]"></i>
                      <span>{new Date(t.transferred_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Middle Bar: Route & Reporting Line */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">
                        Operational Route
                      </span>
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <span className="text-slate-700">
                          {t.source_dept_name || "Unassigned"} {t.source_dept_code ? `(${t.source_dept_code})` : ""}
                        </span>
                        <i className="bi bi-arrow-right text-indigo-500 text-xs"></i>
                        <span className="text-indigo-900">
                          {t.target_dept_name} {t.target_dept_code ? `(${t.target_dept_code})` : ""}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-1">
                        Reporting Line Alignment
                      </span>
                      <div className="text-slate-600 text-[11px]">
                        <span>From: <strong className="text-slate-800">{t.previous_supervisor_name || "Direct to HOD"}</strong></span>
                        <span className="mx-1.5 text-slate-300">→</span>
                        <span>To: <strong className="text-indigo-700">{t.new_supervisor_name || "Direct to HOD"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Justification & Governance Attribution */}
                  {t.reason && (
                    <div className="text-[11px] text-slate-600 flex items-start gap-2 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/60">
                      <i className="bi bi-shield-check text-indigo-600 mt-0.5 shrink-0"></i>
                      <span className="italic">"{t.reason}"</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl mx-auto">
                <i className="bi bi-clock-history"></i>
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-1">No Mobility Records Logged</h5>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mb-0">
                  {searchQuery || deptFilter
                    ? "No transfer events match the active search filter criteria."
                    : "No cross-department personnel transfers have been executed yet in the system."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Enterprise Workforce Mobility Ledger • Complete Audit Chain</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
