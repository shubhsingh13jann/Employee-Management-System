import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

interface DashboardStats {
  totalEmployees: number;
  totalSupervisors: number;
  totalManagers: number;
  totalDepartments: number;
  activeProjects: number;
  pendingLeaves: number;
  totalSalaryPayout: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/stats");
      if (res.data.status) {
        setStats(res.data.stats);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Loading Enterprise Dashboard Metrics...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-red-500 text-sm"></i>
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Row (4 Columns - Compact Executive Density) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Employees */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Employees</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100/70 flex items-center justify-center text-sm transition-transform duration-200 group-hover:scale-105">
              <i className="bi bi-people-fill"></i>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.totalEmployees || 0}</h3>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200/60">
              Staff
            </span>
          </div>
        </div>

        {/* Supervisors */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Supervisors</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/70 flex items-center justify-center text-sm transition-transform duration-200 group-hover:scale-105">
              <i className="bi bi-person-badge-fill"></i>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.totalSupervisors || 0}</h3>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              Team Leads
            </span>
          </div>
        </div>

        {/* Department Managers */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dept Managers</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/70 flex items-center justify-center text-sm transition-transform duration-200 group-hover:scale-105">
              <i className="bi bi-person-gear"></i>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.totalManagers || 0}</h3>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
              Leadership
            </span>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Departments</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100/70 flex items-center justify-center text-sm transition-transform duration-200 group-hover:scale-105">
              <i className="bi bi-buildings-fill"></i>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{stats?.totalDepartments || 0}</h3>
            <span className="inline-flex items-center text-[10.5px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
              Active Units
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row (3 Columns - Compact Telemetry) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Active Projects */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/70 flex items-center justify-center text-sm shrink-0">
            <i className="bi bi-kanban-fill"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Active Projects</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-xl font-extrabold text-slate-900 mb-0">{stats?.activeProjects || 0}</h4>
              <span className="text-xs text-slate-500 font-medium">in delivery</span>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-100/70 flex items-center justify-center text-sm shrink-0">
            <i className="bi bi-calendar2-x-fill"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Pending Leaves</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-xl font-extrabold text-slate-900 mb-0">{stats?.pendingLeaves || 0}</h4>
              <span
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                  (stats?.pendingLeaves || 0) > 0
                    ? "bg-rose-50 text-rose-600 border-rose-200/60"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200/60"
                }`}
              >
                {(stats?.pendingLeaves || 0) > 0 ? "Needs Review" : "All Clear"}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/70 flex items-center justify-center text-sm shrink-0">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Total Active Salary</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-xl font-extrabold text-slate-900 mb-0">
                ${(stats?.totalSalaryPayout || 0).toLocaleString()}
              </h4>
              <span className="text-xs text-slate-500 font-medium">monthly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Governance & Actions (Row 3 - Compact Executive Density) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3.5">
          <div>
            <h5 className="font-bold text-slate-900 text-sm sm:text-base mb-0.5">Enterprise Governance & Quick Pathways</h5>
            <p className="text-xs text-slate-500 mb-0">
              Administrative gateways to manage organizational topology, workforce, and operational structures.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60 self-start">
            <i className="bi bi-shield-lock-fill text-indigo-500 text-[10px]"></i>
            <span>Super Admin Access</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Manage Departments */}
          <div className="p-3.5 sm:p-4 border border-slate-200/70 rounded-xl bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group shadow-2xs hover:shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/70 flex items-center justify-center text-sm mb-2.5 transition-transform duration-200 group-hover:scale-105">
                <i className="bi bi-buildings"></i>
              </div>
              <h6 className="font-bold text-slate-900 text-sm mb-1">Departments Hub</h6>
              <p className="text-slate-500 text-xs mb-3.5 leading-relaxed">
                Configure corporate units, assign department heads, and manage charters.
              </p>
            </div>
            <Link
              to="/admin/departments"
              className="dashboard-pathway-btn dashboard-pathway-btn-blue inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg text-xs font-semibold text-blue-700 bg-white border border-blue-200 shadow-2xs cursor-pointer"
            >
              <span>Manage Departments</span>
              <i className="bi bi-arrow-right text-[11px] transition-transform duration-200 dashboard-arrow-icon"></i>
            </Link>
          </div>

          {/* Workforce Directory */}
          <div className="p-3.5 sm:p-4 border border-slate-200/70 rounded-xl bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group shadow-2xs hover:shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/70 flex items-center justify-center text-sm mb-2.5 transition-transform duration-200 group-hover:scale-105">
                <i className="bi bi-people"></i>
              </div>
              <h6 className="font-bold text-slate-900 text-sm mb-1">Workforce Directory</h6>
              <p className="text-slate-500 text-xs mb-3.5 leading-relaxed">
                Onboard and manage Managers, Supervisors, and Employees across all roles.
              </p>
            </div>
            <Link
              to="/admin/users"
              className="dashboard-pathway-btn dashboard-pathway-btn-indigo inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 shadow-2xs cursor-pointer"
            >
              <span>Manage Users</span>
              <i className="bi bi-arrow-right text-[11px] transition-transform duration-200 dashboard-arrow-icon"></i>
            </Link>
          </div>

          {/* Hierarchy Allocation */}
          <div className="p-3.5 sm:p-4 border border-slate-200/70 rounded-xl bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group shadow-2xs hover:shadow-xs">
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 border border-purple-100/70 flex items-center justify-center text-sm mb-2.5 transition-transform duration-200 group-hover:scale-105">
                <i className="bi bi-diagram-3"></i>
              </div>
              <h6 className="font-bold text-slate-900 text-sm mb-1">Hierarchy Allocation</h6>
              <p className="text-slate-500 text-xs mb-3.5 leading-relaxed">
                Map supervisory reporting lines and manage multi-tier chain-of-command.
              </p>
            </div>
            <Link
              to="/admin/hierarchy"
              className="dashboard-pathway-btn dashboard-pathway-btn-purple inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg text-xs font-semibold text-purple-700 bg-white border border-purple-200 shadow-2xs cursor-pointer"
            >
              <span>Team Hierarchy</span>
              <i className="bi bi-arrow-right text-[11px] transition-transform duration-200 dashboard-arrow-icon"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
