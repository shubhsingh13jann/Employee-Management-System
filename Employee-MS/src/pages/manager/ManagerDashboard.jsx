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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading Department Manager Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Dept Projects</span>
                <h3 className="fw-bold mb-0 text-dark mt-1">{stats?.projectCount || 0}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                <i className="bi bi-kanban fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Team Supervisors</span>
                <h3 className="fw-bold mb-0 text-dark mt-1">{stats?.supervisorCount || 0}</h3>
              </div>
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                <i className="bi bi-person-badge fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Total Team Staff</span>
                <h3 className="fw-bold mb-0 text-dark mt-1">{stats?.employeeCount || 0}</h3>
              </div>
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                <i className="bi bi-people fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white border-start border-4 border-danger">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Escalated Leaves</span>
                <h3 className="fw-bold mb-0 text-danger mt-1">{stats?.escalatedLeaves || 0}</h3>
              </div>
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle">
                <i className="bi bi-calendar-check fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Quick Links */}
      <div className="card shadow-sm border-0 rounded-3 bg-white p-4">
        <h5 className="fw-bold mb-3">Strategic Department Operations</h5>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Create Project Milestones</h6>
              <p className="text-muted small mb-3">Define project scope, deliverables, and assign lead supervisors.</p>
              <Link to="/manager/projects" className="btn btn-sm btn-primary w-100">Manage Projects</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Department Supervisors</h6>
              <p className="text-muted small mb-3">View operational team leads heading squads within your department.</p>
              <Link to="/manager/supervisors" className="btn btn-sm btn-outline-primary w-100">View Supervisors</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Review Escalated Leaves</h6>
              <p className="text-muted small mb-3">Review extended leaves (&gt;3 days) escalated by team supervisors.</p>
              <Link to="/manager/leaves" className="btn btn-sm btn-outline-danger w-100">Leave Approval Queue</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
