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
    <div className="w-full px-6 p-0">
      {error && <div className="px-6 py-4 rounded relative bg-red-100 border border-gray-200 border-red-400 text-red-700">{error}</div>}

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6 mb-6">
        <h5 className="font-bold mb-1">Department Supervisors</h5>
        <p className="text-gray-500 text-sm mb-0">Operational team leads heading squads within your department.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-6">Supervisor Name</th>
                <th>Work Email</th>
                <th>Phone</th>
                <th>Annual Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading supervisors...</span>
                  </td>
                </tr>
              ) : supervisors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">No supervisors registered in this department.</td>
                </tr>
              ) : (
                supervisors.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-600 bg-opacity-10 text-green-600 rounded-full font-bold flex items-center justify-center" style={{ width: "36px", height: "36px" }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="mb-0 font-semibold text-gray-900">{s.name}</p>
                          <small className="badge bg-green-600 bg-opacity-10 text-green-600">👷 Supervisor Lead</small>
                        </div>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td className="text-gray-500">{s.phone || "—"}</td>
                    <td className="font-semibold">${Number(s.salary).toLocaleString()}</td>
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
