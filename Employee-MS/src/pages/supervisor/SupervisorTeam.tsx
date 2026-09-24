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
    <div className="w-full px-6 p-0">
      {error && <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700">{error}</div>}

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6 mb-6">
        <h5 className="font-bold mb-1">Direct Assigned Subordinates</h5>
        <p className="text-gray-500 text-sm mb-0">Staff members under your direct operational oversight and leadership.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-6">Employee</th>
                <th>Contact Email</th>
                <th>Phone</th>
                <th>Assigned Since</th>
                <th>Workload Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading team roster...</span>
                  </td>
                </tr>
              ) : team.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    No employees currently assigned to your team. Please contact HR Admin for assignment.
                  </td>
                </tr>
              ) : (
                team.map((m) => {
                  const completed = Number(m.completed_tasks || 0);
                  const total = Number(m.total_tasks || 0);
                  return (
                    <tr key={m.id}>
                      <td className="px-6">
                        <div className="flex items-center gap-2">
                          <div className="bg-info bg-opacity-10 text-info rounded-full font-bold flex items-center justify-center" style={{ width: "36px", height: "36px" }}>
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="mb-0 font-semibold text-gray-900">{m.name}</p>
                            <small className="badge bg-info bg-opacity-10 text-info">💼 Team Contributor</small>
                          </div>
                        </div>
                      </td>
                      <td>{m.email}</td>
                      <td className="text-gray-500">{m.phone || "—"}</td>
                      <td className="text-sm text-gray-500">{new Date(m.assigned_at).toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-gray-50 text-gray-900 border border-gray-200 border-gray-200 px-6 py-1.5 rounded-full">
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
