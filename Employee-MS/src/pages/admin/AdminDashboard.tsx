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
    <div className="w-full space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-red-500"></i>
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Row (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Employees */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Employees</span>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-105">
              <i className="bi bi-people-fill"></i>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.totalEmployees || 0}</h3>
            <span className="inline-flex items-center text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200/60">
              Staff
            </span>
          </div>
        </div>

        {/* Supervisors */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Supervisors</span>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-105">
              <i className="bi bi-person-badge-fill"></i>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.totalSupervisors || 0}</h3>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              Team Leads
            </span>
          </div>
        </div>

        {/* Department Managers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Department Managers</span>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-105">
              <i className="bi bi-person-gear"></i>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.totalManagers || 0}</h3>
            <span className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
              Leadership
            </span>
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Departments</span>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl transition-transform duration-200 group-hover:scale-105">
              <i className="bi bi-buildings-fill"></i>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.totalDepartments || 0}</h3>
            <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60">
              Active Units
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Projects */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <i className="bi bi-kanban-fill"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Active Projects</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-extrabold text-slate-900 mb-0">{stats?.activeProjects || 0}</h4>
              <span className="text-xs text-slate-400 font-medium">in delivery</span>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-xl shrink-0">
            <i className="bi bi-calendar2-x-fill"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Pending Leave Requests</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-extrabold text-slate-900 mb-0">{stats?.pendingLeaves || 0}</h4>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  (stats?.pendingLeaves || 0) > 0
                    ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                }`}
              >
                {(stats?.pendingLeaves || 0) > 0 ? "Needs Review" : "All Clear"}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">Total Active Salary</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-extrabold text-slate-900 mb-0">
                ${(stats?.totalSalaryPayout || 0).toLocaleString()}
              </h4>
              <span className="text-xs text-slate-400 font-medium">monthly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Governance & Actions (Row 3) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h5 className="font-bold text-slate-900 text-lg mb-0.5">Enterprise Governance & Actions</h5>
            <p className="text-xs font-medium text-slate-500 mb-0">
              Quick administrative pathways to manage company topology and accounts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Manage Departments */}
          <div className="p-5 border border-slate-200/80 rounded-xl bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow">
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center text-lg mb-3">
                <i className="bi bi-buildings"></i>
              </div>
              <h6 className="font-bold text-slate-900 text-base mb-1">Manage Departments</h6>
              <p className="text-slate-500 text-xs mb-5 leading-relaxed">
                Add or modify company departments and organizational categories.
              </p>
            </div>
            <Link
              to="/admin/departments"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-blue-600 bg-white hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <span>Go to Departments</span>
              <i className="bi bi-arrow-right text-xs"></i>
            </Link>
          </div>

          {/* Workforce Directory */}
          <div className="p-5 border border-slate-200/80 rounded-xl bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow">
            <div>
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center text-lg mb-3">
                <i className="bi bi-people"></i>
              </div>
              <h6 className="font-bold text-slate-900 text-base mb-1">Workforce Directory</h6>
              <p className="text-slate-500 text-xs mb-5 leading-relaxed">
                Onboard, view, and manage Managers, Supervisors, and Employees.
              </p>
            </div>
            <Link
              to="/admin/users"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-indigo-600 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <span>Manage Users</span>
              <i className="bi bi-arrow-right text-xs"></i>
            </Link>
          </div>

          {/* Hierarchy Allocation */}
          <div className="p-5 border border-slate-200/80 rounded-xl bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow">
            <div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center text-lg mb-3">
                <i className="bi bi-diagram-3"></i>
              </div>
              <h6 className="font-bold text-slate-900 text-base mb-1">Hierarchy Allocation</h6>
              <p className="text-slate-500 text-xs mb-5 leading-relaxed">
                Map which Employee reports to which Supervisor and Manager.
              </p>
            </div>
            <Link
              to="/admin/hierarchy"
              className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-purple-600 bg-white hover:bg-purple-600 hover:text-white border border-purple-200 hover:border-purple-600 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <span>Team Hierarchy</span>
              <i className="bi bi-arrow-right text-xs"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
