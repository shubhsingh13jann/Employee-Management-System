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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading Team Lead Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Assigned Team</span>
                <h3 className="fw-bold mb-0 text-dark mt-1">{stats?.teamSize || 0}</h3>
              </div>
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                <i className="bi bi-people fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Active Tasks</span>
                <h3 className="fw-bold mb-0 text-primary mt-1">{stats?.activeTasks || 0}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                <i className="bi bi-list-task fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Completed Tasks</span>
                <h3 className="fw-bold mb-0 text-success mt-1">{stats?.completedTasks || 0}</h3>
              </div>
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                <i className="bi bi-check2-all fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Pending Leaves</span>
                <h3 className="fw-bold mb-0 text-warning mt-1">{stats?.pendingLeaves || 0}</h3>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                <i className="bi bi-calendar-check fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Panels */}
      <div className="card shadow-sm border-0 rounded-3 bg-white p-4">
        <h5 className="fw-bold mb-3">Operational Team Operations</h5>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Delegate & Track Tasks</h6>
              <p className="text-muted small mb-3">Assign daily task tickets, set priorities, and chat on task threads.</p>
              <Link to="/supervisor/tasks" className="btn btn-sm btn-primary w-100">Open Task Board</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Direct Team Members</h6>
              <p className="text-muted small mb-3">View staff members reporting directly to your supervision.</p>
              <Link to="/supervisor/team" className="btn btn-sm btn-outline-primary w-100">View Team</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Tier-1 Routine Leaves</h6>
              <p className="text-muted small mb-3">Directly approve casual/sick leaves or escalate long leaves to Manager.</p>
              <Link to="/supervisor/leaves" className="btn btn-sm btn-outline-warning w-100">Review Leaves</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
