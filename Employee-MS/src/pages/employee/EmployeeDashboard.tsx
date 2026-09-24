import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const EmployeeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/employee/dashboard");
      if (res.data.status) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load employee metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="spinner-border text-blue-600" role="status"></div>
        <p className="mt-2 text-gray-500">Loading Employee Workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 p-0">
      {error && <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700">{error}</div>}

      {/* KPI Cards */}
      <div className="flex flex-wrap -mx-4 g-3 mb-6">
        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-warning">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Pending Tasks</span>
                <h3 className="font-bold mb-0 text-yellow-500 mt-1">{stats?.pendingCount || 0}</h3>
              </div>
              <div className="p-6 bg-yellow-500 bg-opacity-10 text-yellow-500 rounded-full">
                <i className="bi bi-clock-history text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-primary">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">In Progress</span>
                <h3 className="font-bold mb-0 text-blue-600 mt-1">{stats?.inProgressCount || 0}</h3>
              </div>
              <div className="p-6 bg-blue-600 bg-opacity-10 text-blue-600 rounded-full">
                <i className="bi bi-gear-wide-connected text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-success">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Completed Tasks</span>
                <h3 className="font-bold mb-0 text-green-600 mt-1">{stats?.completedCount || 0}</h3>
              </div>
              <div className="p-6 bg-green-600 bg-opacity-10 text-green-600 rounded-full">
                <i className="bi bi-check-circle-fill text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-info">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Active Leaves</span>
                <h3 className="font-bold mb-0 text-info mt-1">{stats?.activeLeavesCount || 0}</h3>
              </div>
              <div className="p-6 bg-info bg-opacity-10 text-info rounded-full">
                <i className="bi bi-calendar-range text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6">
        <h5 className="font-bold mb-6">My Workspace Actions</h5>
        <div className="flex flex-wrap -mx-4 g-3">
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Execute Assigned Tasks</h6>
              <p className="text-gray-500 text-sm mb-6">View tasks delegated by your supervisor, update status, and ask questions.</p>
              <Link to="/employee/tasks" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm bg-blue-600 text-white hover:bg-blue-700 w-full">Go to My Tasks</Link>
            </div>
          </div>
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Apply & Track Leaves</h6>
              <p className="text-gray-500 text-sm mb-6">Submit leave requests and monitor approval status in real-time.</p>
              <Link to="/employee/leaves" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-blue-600 text-blue-600 hover:bg-blue-50 w-full">Leave Portal</Link>
            </div>
          </div>
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Employee Profile</h6>
              <p className="text-gray-500 text-sm mb-6">View your departmental assignment, reporting supervisor, and salary details.</p>
              <Link to="/employee/profile" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-gray-500 text-gray-500 hover:bg-gray-50 w-full">View Profile</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
