import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const DepartmentSupervisors = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/manager/supervisors");
        if (res.data.status) {
          setSupervisors(res.data.supervisors);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load supervisors");
      } finally {
        setLoading(false);
      }
    };
    fetchSupervisors();
  }, []);

  return (
    <div className="container-fluid p-0">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-0 rounded-3 bg-white p-4 mb-4">
        <h5 className="fw-bold mb-1">Department Supervisors</h5>
        <p className="text-muted small mb-0">Operational team leads heading squads within your department.</p>
      </div>

      <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Supervisor Name</th>
                <th>Work Email</th>
                <th>Phone</th>
                <th>Annual Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted">Loading supervisors...</span>
                  </td>
                </tr>
              ) : supervisors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">No supervisors registered in this department.</td>
                </tr>
              ) : (
                supervisors.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-success bg-opacity-10 text-success rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="mb-0 fw-semibold text-dark">{s.name}</p>
                          <small className="badge bg-success bg-opacity-10 text-success">👷 Supervisor Lead</small>
                        </div>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td className="text-muted">{s.phone || "—"}</td>
                    <td className="fw-semibold">${Number(s.salary).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${s.status === "active" ? "bg-success bg-opacity-10 text-success" : "bg-danger bg-opacity-10 text-danger"} border px-2 py-1`}>
                        {s.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentSupervisors;
