import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const ManagerLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/manager/leaves");
      if (res.data.status) {
        setLeaves(res.data.leaves);
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load escalated leaves" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleReview = async () => {
    if (!selectedLeave || !action) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/api/manager/leaves/${selectedLeave.id}/review`, {
        status: action,
        manager_notes: notes
      });
      if (res.data.status) {
        setMsg({ type: "success", text: `Leave application ${action} successfully!` });
        setSelectedLeave(null);
        setNotes("");
        fetchLeaves();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to submit review" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-6 p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6 mb-6">
        <h5 className="font-bold mb-1">Tier-2 Escalated Leave Approval Queue</h5>
        <p className="text-gray-500 text-sm mb-0">
          Extended leaves (&gt;3 days) or special leave requests escalated by squad supervisors for department managerial review.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-6">Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Supervisor Recommendation</th>
                <th className="text-right px-6">Decision</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading escalated queue...</span>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <i className="bi bi-check2-circle text-3xl text-green-600 block mb-1"></i>
                    No pending escalated leave applications requiring review!
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id}>
                    <td className="px-6">
                      <p className="mb-0 font-semibold text-gray-900">{l.employee_name}</p>
                      <small className="text-gray-500">{l.employee_email}</small>
                    </td>
                    <td>
                      <span className="badge bg-secondary text-uppercase">{l.leave_type}</span>
                    </td>
                    <td className="text-sm">
                      <strong>{new Date(l.start_date).toLocaleDateString()}</strong> to{" "}
                      <strong>{new Date(l.end_date).toLocaleDateString()}</strong>
                    </td>
                    <td className="text-sm text-gray-500" style={{ maxWidth: "200px" }}>{l.reason}</td>
                    <td className="text-sm text-gray-500" style={{ maxWidth: "220px" }}>
                      <div className="p-2 bg-gray-50 rounded border border-gray-200 border-gray-200">
                        <small className="text-gray-900 font-semibold block">
                          <i className="bi bi-person-badge text-green-600 mr-1"></i>
                          {l.supervisor_name}:
                        </small>
                        <em>"{l.supervisor_notes || "Recommended for approval"}"</em>
                      </div>
                    </td>
                    <td className="text-right px-6">
                      <div className="btn-group">
                        <button
                          onClick={() => { setSelectedLeave(l); setAction("approved"); }}
                          className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm btn-success flex items-center gap-1"
                        >
                          <i className="bi bi-check-lg"></i>
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => { setSelectedLeave(l); setAction("rejected"); }}
                          className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm btn-outline-danger flex items-center gap-1"
                        >
                          <i className="bi bi-x-lg"></i>
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedLeave && (
        <div className="modal show block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-xl">
              <div className={`modal-header text-white ${action === "approved" ? "bg-success" : "bg-danger"}`}>
                <h5 className="modal-title font-bold">
                  {action === "approved" ? "Confirm Leave Approval" : "Confirm Leave Rejection"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedLeave(null)}></button>
              </div>
              <div className="modal-body p-6">
                <p className="mb-6">
                  You are about to <strong>{action}</strong> the leave request for <strong>{selectedLeave.employee_name}</strong> ({selectedLeave.leave_type.toUpperCase()} Leave).
                </p>
                <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Manager's Notes / Justification (Optional)</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="e.g. Approved. Project delivery milestone timeline adjusted accordingly."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-footer bg-gray-50">
                <button type="button" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center border border-gray-200 border-gray-500 text-gray-500 hover:bg-gray-50" onClick={() => setSelectedLeave(null)}>Cancel</button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleReview}
                  className={`btn ${action === "approved" ? "btn-success" : "btn-danger"} px-4`}
                >
                  {submitting ? <span className="spinner-border spinner-border-sm"></span> : `Confirm ${action}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerLeaves;
