import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const EmployeeLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    leave_type: "casual",
    start_date: "",
    end_date: "",
    reason: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/employee/leaves");
      if (res.data.status) {
        setLeaves(res.data.leaves);
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load leave history" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date || !form.reason.trim()) return;

    try {
      setSubmitting(true);
      setMsg({ type: "", text: "" });
      const res = await api.post("/api/employee/leaves", form);
      if (res.data.status) {
        setMsg({ type: "success", text: "Leave request submitted to your supervisor successfully!" });
        setShowModal(false);
        setForm({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
        fetchLeaves();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to submit leave request" });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="badge bg-success px-2.5 py-1.5 fs-6"><i className="bi bi-check-circle me-1"></i>Approved</span>;
      case "rejected":
        return <span className="badge bg-danger px-2.5 py-1.5 fs-6"><i className="bi bi-x-circle me-1"></i>Rejected</span>;
      case "pending_manager":
        return <span className="badge bg-primary px-2.5 py-1.5 fs-6"><i className="bi bi-arrow-up-circle me-1"></i>Escalated (Pending Manager)</span>;
      default:
        return <span className="badge bg-warning text-dark px-2.5 py-1.5 fs-6"><i className="bi bi-hourglass-split me-1"></i>Pending Supervisor</span>;
    }
  };

  return (
    <div className="container-fluid p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-1">Leave Applications & Approvals Tracker</h5>
          <p className="text-muted small mb-0">Submit time-off requests and track real-time approval through the supervisor & manager workflow.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
          <i className="bi bi-calendar-plus-fill"></i>
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Requests Table Card */}
      <div className="card shadow-sm border-0 rounded-3 bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-4">Leave Type</th>
                <th>Duration (Dates)</th>
                <th>Reason</th>
                <th>Current Status</th>
                <th>Supervisor Notes</th>
                <th>Manager Notes</th>
                <th className="text-end px-4">Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                    <span className="ms-2 text-muted">Loading leave history...</span>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    No leave requests found. Click 'Apply for Leave' to submit a time-off application.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4">
                      <span className="badge bg-light text-dark border text-uppercase px-2.5 py-1.5 fw-bold">
                        {l.leave_type} Leave
                      </span>
                    </td>
                    <td className="small">
                      <strong className="text-dark">{new Date(l.start_date).toLocaleDateString()}</strong> to{" "}
                      <strong className="text-dark">{new Date(l.end_date).toLocaleDateString()}</strong>
                    </td>
                    <td className="small text-muted" style={{ maxWidth: "200px" }}>{l.reason}</td>
                    <td>{getStatusBadge(l.status)}</td>
                    <td className="small text-muted" style={{ maxWidth: "160px" }}>
                      {l.supervisor_notes ? <em>"{l.supervisor_notes}"</em> : "—"}
                    </td>
                    <td className="small text-muted" style={{ maxWidth: "160px" }}>
                      {l.manager_notes ? <em>"{l.manager_notes}"</em> : "—"}
                    </td>
                    <td className="text-end px-4 small text-muted">
                      {new Date(l.applied_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">Apply for Leave</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Leave Category</label>
                    <select
                      className="form-select"
                      value={form.leave_type}
                      onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick / Medical Leave</option>
                      <option value="paid">Paid Annual Vacation</option>
                      <option value="unpaid">Unpaid Leave of Absence</option>
                    </select>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold small">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold small">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Reason for Leave</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Explain reason for absence..."
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary px-4">
                    {submitting ? <span className="spinner-border spinner-border-sm"></span> : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaves;
