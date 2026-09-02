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
    <div className="container-fluid p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="card shadow-sm border-0 rounded-3 bg-white p-4 mb-4">
        <h5 className="fw-bold mb-1">Tier-2 Escalated Leave Approval Queue</h5>
        <p className="text-muted small mb-0">
          Extended leaves (&gt;3 days) or special leave requests escalated by squad supervisors for department managerial review.
        </p>
      </div>

      <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Supervisor Recommendation</th>
                <th className="text-end px-4">Decision</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted">Loading escalated queue...</span>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <i className="bi bi-check2-circle fs-2 text-success d-block mb-1"></i>
                    No pending escalated leave applications requiring review!
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4">
                      <p className="mb-0 fw-semibold text-dark">{l.employee_name}</p>
                      <small className="text-muted">{l.employee_email}</small>
                    </td>
                    <td>
                      <span className="badge bg-secondary text-uppercase">{l.leave_type}</span>
                    </td>
                    <td className="small">
                      <strong>{new Date(l.start_date).toLocaleDateString()}</strong> to{" "}
                      <strong>{new Date(l.end_date).toLocaleDateString()}</strong>
                    </td>
                    <td className="small text-muted" style={{ maxWidth: "200px" }}>{l.reason}</td>
                    <td className="small text-muted" style={{ maxWidth: "220px" }}>
                      <div className="p-2 bg-light rounded border">
                        <small className="text-dark fw-semibold d-block">
                          <i className="bi bi-person-badge text-success me-1"></i>
                          {l.supervisor_name}:
                        </small>
                        <em>"{l.supervisor_notes || "Recommended for approval"}"</em>
                      </div>
                    </td>
                    <td className="text-end px-4">
                      <div className="btn-group">
                        <button
                          onClick={() => { setSelectedLeave(l); setAction("approved"); }}
                          className="btn btn-sm btn-success d-flex align-items-center gap-1"
                        >
                          <i className="bi bi-check-lg"></i>
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => { setSelectedLeave(l); setAction("rejected"); }}
                          className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
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
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className={`modal-header text-white ${action === "approved" ? "bg-success" : "bg-danger"}`}>
                <h5 className="modal-title fw-bold">
                  {action === "approved" ? "Confirm Leave Approval" : "Confirm Leave Rejection"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedLeave(null)}></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-3">
                  You are about to <strong>{action}</strong> the leave request for <strong>{selectedLeave.employee_name}</strong> ({selectedLeave.leave_type.toUpperCase()} Leave).
                </p>
                <label className="form-label fw-semibold small">Manager's Notes / Justification (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Approved. Project delivery milestone timeline adjusted accordingly."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedLeave(null)}>Cancel</button>
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
