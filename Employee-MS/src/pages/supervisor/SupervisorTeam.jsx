import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const SupervisorTeam = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/supervisor/team");
        if (res.data.status) {
          setTeam(res.data.team);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load team members");
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div className="container-fluid p-0">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 rounded-3 bg-white p-4 mb-4">
        <h5 className="fw-bold mb-1">Direct Assigned Subordinates</h5>
        <p className="text-muted small mb-0">Staff members under your direct operational oversight and leadership.</p>
      </div>

      <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Employee</th>
                <th>Contact Email</th>
                <th>Phone</th>
                <th>Assigned Since</th>
                <th>Workload Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted">Loading team roster...</span>
                  </td>
                </tr>
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No employees currently assigned to your team. Please contact HR Admin for assignment.
                  </td>
                </tr>
              ) : (
                team.map((m) => {
                  const completed = Number(m.completed_tasks || 0);
                  const total = Number(m.total_tasks || 0);
                  return (
                    <tr key={m.id}>
                      <td className="px-4">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-info bg-opacity-10 text-info rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="mb-0 fw-semibold text-dark">{m.name}</p>
                            <small className="badge bg-info bg-opacity-10 text-info">💼 Team Contributor</small>
                          </div>
                        </div>
                      </td>
                      <td>{m.email}</td>
                      <td className="text-muted">{m.phone || "—"}</td>
                      <td className="small text-muted">{new Date(m.assigned_at).toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill">
                          {completed} / {total} Tasks Completed
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorTeam;
