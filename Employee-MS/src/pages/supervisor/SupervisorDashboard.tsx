import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const SupervisorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/supervisor/dashboard");
      if (res.data.status) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load supervisor dashboard metrics");
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
        <p className="mt-2 text-gray-500">Loading Team Lead Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 p-0">
      {error && <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700">{error}</div>}

      {/* KPI Cards */}
      <div className="flex flex-wrap -mx-4 g-3 mb-6">
        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-info">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Assigned Team</span>
                <h3 className="font-bold mb-0 text-gray-900 mt-1">{stats?.teamSize || 0}</h3>
              </div>
              <div className="p-6 bg-info bg-opacity-10 text-info rounded-full">
                <i className="bi bi-people text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-primary">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Active Tasks</span>
                <h3 className="font-bold mb-0 text-blue-600 mt-1">{stats?.activeTasks || 0}</h3>
              </div>
              <div className="p-6 bg-blue-600 bg-opacity-10 text-blue-600 rounded-full">
                <i className="bi bi-list-task text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-success">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Completed Tasks</span>
                <h3 className="font-bold mb-0 text-green-600 mt-1">{stats?.completedTasks || 0}</h3>
              </div>
              <div className="p-6 bg-green-600 bg-opacity-10 text-green-600 rounded-full">
                <i className="bi bi-check2-all text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-warning">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Pending Leaves</span>
                <h3 className="font-bold mb-0 text-yellow-500 mt-1">{stats?.pendingLeaves || 0}</h3>
              </div>
              <div className="p-6 bg-yellow-500 bg-opacity-10 text-yellow-500 rounded-full">
                <i className="bi bi-calendar-check text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Panels */}
      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6">
        <h5 className="font-bold mb-6">Operational Team Operations</h5>
        <div className="flex flex-wrap -mx-4 g-3">
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Delegate & Track Tasks</h6>
              <p className="text-gray-500 text-sm mb-6">Assign daily task tickets, set priorities, and chat on task threads.</p>
              <Link to="/supervisor/tasks" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm bg-blue-600 text-white hover:bg-blue-700 w-full">Open Task Board</Link>
            </div>
          </div>
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Direct Team Members</h6>
              <p className="text-gray-500 text-sm mb-6">View staff members reporting directly to your supervision.</p>
              <Link to="/supervisor/team" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-blue-600 text-blue-600 hover:bg-blue-50 w-full">View Team</Link>
            </div>
          </div>
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Tier-1 Routine Leaves</h6>
              <p className="text-gray-500 text-sm mb-6">Directly approve casual/sick leaves or escalate long leaves to Manager.</p>
              <Link to="/supervisor/leaves" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm btn-outline-warning w-full">Review Leaves</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
