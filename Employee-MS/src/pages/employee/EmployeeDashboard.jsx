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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading Employee Workspace...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Pending Tasks</span>
                <h3 className="fw-bold mb-0 text-warning mt-1">{stats?.pendingCount || 0}</h3>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                <i className="bi bi-clock-history fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">In Progress</span>
                <h3 className="fw-bold mb-0 text-primary mt-1">{stats?.inProgressCount || 0}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                <i className="bi bi-gear-wide-connected fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Completed Tasks</span>
                <h3 className="fw-bold mb-0 text-success mt-1">{stats?.completedCount || 0}</h3>
              </div>
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                <i className="bi bi-check-circle-fill fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Active Leaves</span>
                <h3 className="fw-bold mb-0 text-info mt-1">{stats?.activeLeavesCount || 0}</h3>
              </div>
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                <i className="bi bi-calendar-range fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="card shadow-sm border-0 rounded-3 bg-white p-4">
        <h5 className="fw-bold mb-3">My Workspace Actions</h5>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Execute Assigned Tasks</h6>
              <p className="text-muted small mb-3">View tasks delegated by your supervisor, update status, and ask questions.</p>
              <Link to="/employee/tasks" className="btn btn-sm btn-primary w-100">Go to My Tasks</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Apply & Track Leaves</h6>
              <p className="text-muted small mb-3">Submit leave requests and monitor approval status in real-time.</p>
              <Link to="/employee/leaves" className="btn btn-sm btn-outline-primary w-100">Leave Portal</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Employee Profile</h6>
              <p className="text-muted small mb-3">View your departmental assignment, reporting supervisor, and salary details.</p>
              <Link to="/employee/profile" className="btn btn-sm btn-outline-secondary w-100">View Profile</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
