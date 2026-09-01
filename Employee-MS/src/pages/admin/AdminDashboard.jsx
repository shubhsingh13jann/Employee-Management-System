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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading Enterprise Dashboard Metrics...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {error && <div className="alert alert-danger">{error}</div>}

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        {/* Total Employees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white h-100 border-start border-4 border-info">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Total Employees</span>
                <h3 className="fw-bold mb-0 text-dark mt-1">{stats?.totalEmployees || 0}</h3>
              </div>
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle">
                <i className="bi bi-people fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Supervisors */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white h-100 border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Supervisors</span>
                <h3 className="fw-bold mb-0 text-dark mt-1">{stats?.totalSupervisors || 0}</h3>
              </div>
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                <i className="bi bi-person-badge fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Managers */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white h-100 border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Department Managers</span>
                <h3 className="fw-bold mb-0 text-dark mt-1">{stats?.totalManagers || 0}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                <i className="bi bi-person-gear fs-4"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white h-100 border-start border-4 border-warning">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small fw-bold text-uppercase">Departments</span>
                <h3 className="fw-bold mb-0 text-dark mt-1">{stats?.totalDepartments || 0}</h3>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                <i className="bi bi-buildings fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="row g-3 mb-4">
        {/* Active Projects */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                <i className="bi bi-kanban fs-3"></i>
              </div>
              <div>
                <p className="text-muted small mb-0 fw-bold">Active Projects</p>
                <h4 className="fw-bold mb-0">{stats?.activeProjects || 0}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-3">
                <i className="bi bi-calendar-x fs-3"></i>
              </div>
              <div>
                <p className="text-muted small mb-0 fw-bold">Pending Leave Requests</p>
                <h4 className="fw-bold mb-0">{stats?.pendingLeaves || 0}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="col-12 col-md-4">
          <div className="card shadow-sm border-0 rounded-3 p-3 bg-white">
            <div className="d-flex align-items-center gap-3">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                <i className="bi bi-cash-stack fs-3"></i>
              </div>
              <div>
                <p className="text-muted small mb-0 fw-bold">Total Active Salary</p>
                <h4 className="fw-bold mb-0">${(stats?.totalSalaryPayout || 0).toLocaleString()}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="card shadow-sm border-0 rounded-3 bg-white p-4">
        <h5 className="fw-bold mb-3">Enterprise Governance & Actions</h5>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Manage Departments</h6>
              <p className="text-muted small mb-3">Add or modify company departments and organizational categories.</p>
              <Link to="/admin/departments" className="btn btn-sm btn-outline-primary w-100">Go to Departments</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Workforce Directory</h6>
              <p className="text-muted small mb-3">Onboard, view, and manage Managers, Supervisors, and Employees.</p>
              <Link to="/admin/users" className="btn btn-sm btn-outline-primary w-100">Manage Users</Link>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="p-3 border rounded-3 bg-light">
              <h6 className="fw-bold text-dark mb-1">Hierarchy Allocation</h6>
              <p className="text-muted small mb-3">Map which Employee reports to which Supervisor and Manager.</p>
              <Link to="/admin/hierarchy" className="btn btn-sm btn-outline-primary w-100">Team Hierarchy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
