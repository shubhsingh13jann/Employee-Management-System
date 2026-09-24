import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/manager/dashboard");
      if (res.data.status) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load manager dashboard");
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
        <p className="mt-2 text-gray-500">Loading Department Manager Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 p-0">
      {error && <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700">{error}</div>}

      {/* KPI Cards */}
      <div className="flex flex-wrap -mx-4 g-3 mb-6">
        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-primary">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Dept Projects</span>
                <h3 className="font-bold mb-0 text-gray-900 mt-1">{stats?.projectCount || 0}</h3>
              </div>
              <div className="p-6 bg-blue-600 bg-opacity-10 text-blue-600 rounded-full">
                <i className="bi bi-kanban text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-success">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Team Supervisors</span>
                <h3 className="font-bold mb-0 text-gray-900 mt-1">{stats?.supervisorCount || 0}</h3>
              </div>
              <div className="p-6 bg-green-600 bg-opacity-10 text-green-600 rounded-full">
                <i className="bi bi-person-badge text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-info">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Total Team Staff</span>
                <h3 className="font-bold mb-0 text-gray-900 mt-1">{stats?.employeeCount || 0}</h3>
              </div>
              <div className="p-6 bg-info bg-opacity-10 text-info rounded-full">
                <i className="bi bi-people text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-6 col-sm-6 col-xl-3">
          <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg p-6 bg-white border-l border-gray-200 border-4 border-danger">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-500 text-sm font-bold text-uppercase">Escalated Leaves</span>
                <h3 className="font-bold mb-0 text-red-600 mt-1">{stats?.escalatedLeaves || 0}</h3>
              </div>
              <div className="p-6 bg-red-600 bg-opacity-10 text-red-600 rounded-full">
                <i className="bi bi-calendar-check text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Quick Links */}
      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6">
        <h5 className="font-bold mb-6">Strategic Department Operations</h5>
        <div className="flex flex-wrap -mx-4 g-3">
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Create Project Milestones</h6>
              <p className="text-gray-500 text-sm mb-6">Define project scope, deliverables, and assign lead supervisors.</p>
              <Link to="/manager/projects" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm bg-blue-600 text-white hover:bg-blue-700 w-full">Manage Projects</Link>
            </div>
          </div>
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Department Supervisors</h6>
              <p className="text-gray-500 text-sm mb-6">View operational team leads heading squads within your department.</p>
              <Link to="/manager/supervisors" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm border border-gray-200 border-blue-600 text-blue-600 hover:bg-blue-50 w-full">View Supervisors</Link>
            </div>
          </div>
          <div className="w-full px-6 md:w-1/3 px-6">
            <div className="p-6 border border-gray-200 border-gray-200 rounded-lg bg-gray-50">
              <h6 className="font-bold text-gray-900 mb-1">Review Escalated Leaves</h6>
              <p className="text-gray-500 text-sm mb-6">Review extended leaves (&gt;3 days) escalated by team supervisors.</p>
              <Link to="/manager/leaves" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm btn-outline-danger w-full">Leave Approval Queue</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
