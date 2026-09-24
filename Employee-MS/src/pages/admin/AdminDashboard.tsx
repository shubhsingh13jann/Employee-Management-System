import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/stats");
      if (res.data.status) {
        setStats(res.data.stats);
      }
    } catch (err) {
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
      <div className="text-center py-12">
        <div className="spinner-border text-blue-600" role="status"></div>
        <p className="mt-2 text-gray-500">Loading Enterprise Dashboard Metrics...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 p-0">
      {error && <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700">{error}</div>}

      {/* KPI Cards Row */}
      <div className="flex flex-wrap -mx-4 g-3 mb-6">
        {/* Total Employees */}
        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white h-full border-l border-gray-200 border-4 border-info">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Total Employees</span>
                <h3 className="font-bold mb-0 text-gray-900 mt-1">{stats?.totalEmployees || 0}</h3>
              </div>
              <div className="p-6 bg-info bg-opacity-10 text-info rounded-full">
                <i className="bi bi-people text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisors */}
        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white h-full border-l border-gray-200 border-4 border-success">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Supervisors</span>
                <h3 className="font-bold mb-0 text-gray-900 mt-1">{stats?.totalSupervisors || 0}</h3>
              </div>
              <div className="p-6 bg-green-600 bg-opacity-10 text-green-600 rounded-full">
                <i className="bi bi-person-badge text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Managers */}
        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white h-full border-l border-gray-200 border-4 border-primary">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Department Managers</span>
                <h3 className="font-bold mb-0 text-gray-900 mt-1">{stats?.totalManagers || 0}</h3>
              </div>
              <div className="p-6 bg-blue-600 bg-opacity-10 text-blue-600 rounded-full">
                <i className="bi bi-person-gear text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white h-full border-l border-gray-200 border-4 border-warning">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Departments</span>
                <h3 className="font-bold mb-0 text-gray-900 mt-1">{stats?.totalDepartments || 0}</h3>
              </div>
              <div className="p-6 bg-yellow-500 bg-opacity-10 text-yellow-500 rounded-full">
                <i className="bi bi-buildings text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="flex flex-wrap -mx-4 g-3 mb-6">
        {/* Active Projects */}
        <div className="w-full px-6 md:w-1/3 px-6">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white">
            <div className="flex items-center gap-6">
              <div className="p-6 bg-blue-600 bg-opacity-10 text-blue-600 rounded-lg">
                <i className="bi bi-kanban text-2xl"></i>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-0 font-bold">Active Projects</p>
                <h4 className="font-bold mb-0">{stats?.activeProjects || 0}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="w-full px-6 md:w-1/3 px-6">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white">
            <div className="flex items-center gap-6">
              <div className="p-6 bg-red-600 bg-opacity-10 text-red-600 rounded-lg">
                <i className="bi bi-calendar-x text-2xl"></i>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-0 font-bold">Pending Leave Requests</p>
                <h4 className="font-bold mb-0">{stats?.pendingLeaves || 0}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="w-full px-6 md:w-1/3 px-6">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white">
            <div className="flex items-center gap-6">
              <div className="p-6 bg-green-600 bg-opacity-10 text-green-600 rounded-lg">
                <i className="bi bi-cash-stack text-2xl"></i>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-0 font-bold">Total Active Salary</p>
                <h4 className="font-bold mb-0">${(stats?.totalSalaryPayout || 0).toLocaleString()}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6">
        <h5 className="font-bold mb-6">Enterprise Governance & Actions</h5>
        <div className="flex flex-wrap -mx-4 g-3">
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Manage Departments</h6>
              <p className="text-gray-500 text-sm mb-6">Add or modify company departments and organizational categories.</p>
              <Link to="/admin/departments" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-blue-600 text-blue-600 hover:bg-blue-50 w-full">Go to Departments</Link>
            </div>
          </div>
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Workforce Directory</h6>
              <p className="text-gray-500 text-sm mb-6">Onboard, view, and manage Managers, Supervisors, and Employees.</p>
              <Link to="/admin/users" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-blue-600 text-blue-600 hover:bg-blue-50 w-full">Manage Users</Link>
            </div>
          </div>
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Hierarchy Allocation</h6>
              <p className="text-gray-500 text-sm mb-6">Map which Employee reports to which Supervisor and Manager.</p>
              <Link to="/admin/hierarchy" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-blue-600 text-blue-600 hover:bg-blue-50 w-full">Team Hierarchy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
