import React, { useEffect, useState } from "react";
import api from "../../api/axios";

const SupervisorLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/supervisor/leaves");
      if (res.data.status) {
        setLeaves(res.data.leaves);
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to load team leaves" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleReview = async () => {
    if (!selectedLeave || !actionType) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/api/supervisor/leaves/${selectedLeave.id}/review`, {
        action: actionType,
        supervisor_notes: notes
      });
      if (res.data.status) {
        setMsg({ type: "success", text: res.data.message });
        setSelectedLeave(null);
        setNotes("");
        fetchLeaves();
      }
    } catch (err) {
      setMsg({ type: "danger", text: err.response?.data?.error || "Failed to process leave review" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-6 p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white p-6 mb-6">
        <h5 className="font-bold mb-1">Tier-1 Routine Leave Review Queue</h5>
        <p className="text-gray-500 text-sm mb-0">
          First-line leave requests submitted by your direct squad subordinates. Approve short leaves directly, or escalate extended leaves to the Department Manager.
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
                <th className="text-right px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading team leave applications...</span>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <i className="bi bi-check-circle text-3xl text-green-600 block mb-1"></i>
                    No pending routine leave requests from your team!
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
                    <td className="text-sm text-gray-500" style={{ maxWidth: "250px" }}>{l.reason}</td>
                    <td className="text-right px-6">
                      <div className="btn-group shadow-sm">
                        <button
                          onClick={() => { setSelectedLeave(l); setActionType("approve"); }}
                          className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm btn-success flex items-center gap-1"
                        >
                          <i className="bi bi-check-lg"></i>
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => { setSelectedLeave(l); setActionType("escalate"); }}
                          className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center btn-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                        >
                          <i className="bi bi-arrow-up-circle"></i>
                          <span>Escalate</span>
                        </button>
                        <button
                          onClick={() => { setSelectedLeave(l); setActionType("reject"); }}
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

      {/* Confirmation Modal */}
      {selectedLeave && (
        <div className="modal show block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-xl">
              <div className={`modal-header text-white ${actionType === "approve" ? "bg-success" : actionType === "escalate" ? "bg-primary" : "bg-danger"}`}>
                <h5 className="modal-title font-bold">
                  {actionType === "approve" ? "Direct Approve Leave" : actionType === "escalate" ? "Escalate Leave to Manager" : "Reject Leave"}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedLeave(null)}></button>
              </div>
              <div className="modal-body p-6">
                <p className="mb-6">
                  You are selecting to <strong>{actionType.toUpperCase()}</strong> the leave application of <strong>{selectedLeave.employee_name}</strong>.
                </p>
                <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Supervisor Remarks / Justification</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="e.g. Recommended. Task tickets reassigned during this window."
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
                  className={`btn ${actionType === "approve" ? "btn-success" : actionType === "escalate" ? "btn-primary" : "btn-danger"} px-4`}
                >
                  {submitting ? <span className="spinner-border spinner-border-sm"></span> : `Confirm ${actionType}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorLeaves;
