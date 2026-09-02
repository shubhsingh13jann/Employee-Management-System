import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const EmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/employee/profile");
        if (res.data.status) {
          setProfile(res.data.profile);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading employee profile...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          {/* Corporate Profile Card */}
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden bg-white">
            {/* Header Banner */}
            <div className="p-4 text-white" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
              <div className="d-flex flex-column flex-sm-row align-items-center gap-3">
                <div
                  className="bg-white text-primary rounded-circle fw-bold d-flex align-items-center justify-content-center shadow"
                  style={{ width: "80px", height: "80px", fontSize: "32px" }}
                >
                  {profile?.name?.charAt(0) || "E"}
                </div>
                <div className="text-center text-sm-start">
                  <h4 className="fw-bold mb-0">{profile?.name}</h4>
                  <p className="text-white-50 mb-1">{profile?.email}</p>
                  <span className="badge bg-light text-primary px-3 py-1 fw-bold text-uppercase">
                    💼 {profile?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div className="card-body p-4">
              <h6 className="text-muted fw-bold text-uppercase mb-3 small tracking-wider">Organizational Details</h6>
              <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block">Department</span>
                    <strong className="text-dark fs-6">{profile?.department_name || "General Engineering"}</strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block">Reporting Supervisor (Team Lead)</span>
                    <strong className="text-dark fs-6">
                      <i className="bi bi-person-badge text-success me-1"></i>
                      {profile?.supervisor_name || "Assigned by HR"}
                    </strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block">Department Manager</span>
                    <strong className="text-dark fs-6">
                      <i className="bi bi-person-gear text-primary me-1"></i>
                      {profile?.manager_name || "Assigned by HR"}
                    </strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block">Annual Base Salary</span>
                    <strong className="text-success fs-6">${Number(profile?.salary || 0).toLocaleString()} / year</strong>
                  </div>
                </div>
              </div>

              <h6 className="text-muted fw-bold text-uppercase mb-3 small tracking-wider">Contact & Location</h6>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block">Phone Number</span>
                    <strong className="text-dark">{profile?.phone || "+1 555-0104"}</strong>
                  </div>
                </div>
                <div className="col-12 col-sm-6">
                  <div className="p-3 bg-light rounded-3 border">
                    <span className="text-muted small d-block">Office Location / Address</span>
                    <strong className="text-dark">{profile?.address || "Building A, Floor 2"}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
