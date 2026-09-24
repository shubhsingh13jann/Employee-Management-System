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
        return <span className="badge bg-green-600 px-2.5 py-1.5 text-base"><i className="bi bi-check-circle mr-1"></i>Approved</span>;
      case "rejected":
        return <span className="badge bg-red-600 px-2.5 py-1.5 text-base"><i className="bi bi-x-circle mr-1"></i>Rejected</span>;
      case "pending_manager":
        return <span className="badge bg-blue-600 px-2.5 py-1.5 text-base"><i className="bi bi-arrow-up-circle mr-1"></i>Escalated (Pending Manager)</span>;
      default:
        return <span className="badge bg-yellow-500 text-gray-900 px-2.5 py-1.5 text-base"><i className="bi bi-hourglass-split mr-1"></i>Pending Supervisor</span>;
    }
  };

  return (
    <div className="w-full px-6 p-0">
      {msg.text && <div className={`alert alert-${msg.type} alert-dismissible fade show`}>{msg.text}</div>}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h5 className="font-bold text-gray-900 mb-1">Leave Applications & Approvals Tracker</h5>
          <p className="text-gray-500 text-sm mb-0">Submit time-off requests and track real-time approval through the supervisor & manager workflow.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 shadow-sm">
          <i className="bi bi-calendar-plus-fill"></i>
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Leave Requests Table Card */}
      <div className="bg-white rounded-lg border border-gray-200 border-gray-200 shadow-sm flex flex-col shadow-sm border-0 rounded-lg bg-white overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="px-6">Leave Type</th>
                <th>Duration (Dates)</th>
                <th>Reason</th>
                <th>Current Status</th>
                <th>Supervisor Notes</th>
                <th>Manager Notes</th>
                <th className="text-right px-6">Applied Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="spinner-border spinner-border-sm text-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading leave history...</span>
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No leave requests found. Click 'Apply for Leave' to submit a time-off application.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id}>
                    <td className="px-6">
                      <span className="badge bg-gray-50 text-gray-900 border border-gray-200 border-gray-200 text-uppercase px-2.5 py-1.5 font-bold">
                        {l.leave_type} Leave
                      </span>
                    </td>
                    <td className="text-sm">
                      <strong className="text-gray-900">{new Date(l.start_date).toLocaleDateString()}</strong> to{" "}
                      <strong className="text-gray-900">{new Date(l.end_date).toLocaleDateString()}</strong>
                    </td>
                    <td className="text-sm text-gray-500" style={{ maxWidth: "200px" }}>{l.reason}</td>
                    <td>{getStatusBadge(l.status)}</td>
                    <td className="text-sm text-gray-500" style={{ maxWidth: "160px" }}>
                      {l.supervisor_notes ? <em>"{l.supervisor_notes}"</em> : "—"}
                    </td>
                    <td className="text-sm text-gray-500" style={{ maxWidth: "160px" }}>
                      {l.manager_notes ? <em>"{l.manager_notes}"</em> : "—"}
                    </td>
                    <td className="text-right px-6 text-sm text-gray-500">
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
        <div className="modal show block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-xl">
              <div className="modal-header bg-gray-900 text-white">
                <h5 className="modal-title font-bold">Apply for Leave</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleApplyLeave}>
                <div className="modal-body p-6">
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Leave Category</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.leave_type}
                      onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick / Medical Leave</option>
                      <option value="paid">Paid Annual Vacation</option>
                      <option value="unpaid">Unpaid Leave of Absence</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap -mx-4 g-2 mb-6">
                    <div className="col-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Start Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.start_date}
                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">End Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={form.end_date}
                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="block mb-2 font-medium text-gray-700 font-semibold text-sm">Reason for Leave</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-200 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Explain reason for absence..."
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-gray-50">
                  <button type="button" className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center border border-gray-200 border-gray-500 text-gray-500 hover:bg-gray-50" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2 rounded font-medium transition-colors cursor-pointer inline-block text-center bg-blue-600 text-white hover:bg-blue-700 px-6">
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
