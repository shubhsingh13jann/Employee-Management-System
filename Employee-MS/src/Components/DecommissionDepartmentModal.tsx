import React, { useEffect, useState } from "react";
import api from "../api/axios";

interface DecommissionDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: number | null;
  departments: any[];
  onDecommissionSuccess?: (msg: string) => void;
}

export const DecommissionDepartmentModal: React.FC<DecommissionDepartmentModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  departments,
  onDecommissionSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [action, setAction] = useState<"reassign" | "unassign">("reassign");
  const [targetDeptId, setTargetDeptId] = useState("");
  const [targetSupervisors, setTargetSupervisors] = useState<any[]>([]);
  const [targetSupervisorId, setTargetSupervisorId] = useState("");
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch decommissioning preview when opened
  useEffect(() => {
    if (!isOpen || !departmentId) return;

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/api/admin/departments/${departmentId}/decommission-preview`);
        if (res.data.status) {
          setPreview(res.data);
        } else {
          setError(res.data.error || "Failed to inspect department blast radius");
        }
      } catch (err: any) {
        console.error("Failed to load decommissioning preview:", err);
        setError(err.response?.data?.error || "Error loading department impact assessment");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
    setAction("reassign");
    setTargetDeptId("");
    setTargetSupervisorId("");
    setTargetSupervisors([]);
    setReason("");
    setConfirmInput("");
  }, [isOpen, departmentId]);

  // Load target supervisors when destination department selected
  useEffect(() => {
    if (!targetDeptId) {
      setTargetSupervisors([]);
      setTargetSupervisorId("");
      return;
    }

    const fetchSupervisors = async () => {
      try {
        setLoadingSupervisors(true);
        const res = await api.get(`/api/admin/departments/${targetDeptId}/roster`);
        if (res.data.status && res.data.roster?.supervisors) {
          setTargetSupervisors(res.data.roster.supervisors);
        } else {
          setTargetSupervisors([]);
        }
      } catch (err) {
        console.error("Failed to load target supervisors:", err);
        setTargetSupervisors([]);
      } finally {
        setLoadingSupervisors(false);
      }
    };

    fetchSupervisors();
  }, [targetDeptId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen || !departmentId) return null;

  const department = preview?.department;
  const impact = preview?.impact;
  const members = preview?.members || [];
  const canHardDelete = impact?.can_hard_delete;

  const availableDestinations = departments.filter((d) => d.id !== departmentId);
  const selectedTargetDept = departments.find((d) => String(d.id) === String(targetDeptId));

  const requiredCode = department?.code || department?.name || "CONFIRM";
  const isCodeConfirmed = confirmInput.trim().toUpperCase() === requiredCode.trim().toUpperCase();

  const handleExecuteDecommission = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canHardDelete && action === "reassign" && !targetDeptId) {
      setError("Please select a target destination department to reassign personnel.");
      return;
    }

    if (!isCodeConfirmed) {
      setError(`Please type "${requiredCode}" exactly to authorize decommissioning.`);
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const res = await api.post(`/api/admin/departments/${departmentId}/decommission`, {
        action: canHardDelete ? "force" : action,
        target_department_id: targetDeptId ? Number(targetDeptId) : null,
        target_supervisor_id: targetSupervisorId ? Number(targetSupervisorId) : null,
        reason: reason.trim() || `Department Sunset Protocol: ${department?.name} decommissioned`
      });

      if (res.data.status) {
        if (onDecommissionSuccess) {
          onDecommissionSuccess(res.data.message || `Successfully decommissioned ${department?.name}`);
        }
        onClose();
      } else {
        setError(res.data.error || "Failed to decommission department");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error executing department decommissioning");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white flex items-start justify-between border-b border-rose-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 text-xl font-bold shadow-inner shrink-0">
              <i className="bi bi-shield-slash"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight mb-0">
                  Decommission Department
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  Sunset Protocol
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-1 mb-0">
                {department ? `${department.name} (${department.code || "DEP"})` : "Organizational Dissolution"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold disabled:opacity-50"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleExecuteDecommission} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-4.5 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing organizational blast radius & dependencies...</span>
              </div>
            ) : error ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-rose-500 shrink-0"></i>
                <span>{error}</span>
              </div>
            ) : (
              <>
                {/* Blast Radius Impact Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Organizational Impact Assessment
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        canHardDelete ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {canHardDelete ? "Zero Dependencies (Safe)" : `${impact?.total_members} Active Members`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Headcount</span>
                      <strong className="text-sm text-slate-900">{impact?.total_members || 0}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Supervisors</span>
                      <strong className="text-sm text-slate-900">{impact?.supervisors_count || 0}</strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                      <span className="text-[10px] text-slate-400 block font-medium">Sub-Units</span>
                      <strong className="text-sm text-slate-900">{impact?.child_departments_count || 0}</strong>
                    </div>
                  </div>

                  {department?.head_name && (
                    <div className="text-xs text-slate-600 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <i className="bi bi-person-badge text-indigo-600"></i>
                      <span>
                        Current HOD: <strong>{department.head_name}</strong> ({department.head_email})
                      </span>
                    </div>
                  )}
                </div>

                {/* Sub-departments detachment alert */}
                {impact?.child_departments_count > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <i className="bi bi-diagram-2 text-amber-600"></i>
                      <span>Sub-Unit Hierarchy Detachment</span>
                    </div>
                    <p className="text-[11px] text-amber-700 mb-0">
                      {impact.child_departments_count} child department(s) (
                      {impact.child_departments.map((c: any) => c.name).join(", ")}) will be safely detached
                      from this department and elevated to top-level organizational units.
                    </p>
                  </div>
                )}

                {/* Governance Options when active members exist */}
                {!canHardDelete ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Personnel Disposition Protocol
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option A: Reassign */}
                      <div
                        onClick={() => setAction("reassign")}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          action === "reassign"
                            ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <input
                            type="radio"
                            name="decommissionAction"
                            checked={action === "reassign"}
                            onChange={() => setAction("reassign")}
                            className="text-indigo-600 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-slate-900">Reassign Personnel</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-0 leading-relaxed">
                          Bulk transfer all {impact?.total_members} members to another active department.
                        </p>
                      </div>

                      {/* Option B: Unassign */}
                      <div
                        onClick={() => setAction("unassign")}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          action === "unassign"
                            ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-200"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <input
                            type="radio"
                            name="decommissionAction"
                            checked={action === "unassign"}
                            onChange={() => setAction("unassign")}
                            className="text-amber-600 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-slate-900">Unassign Staff</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mb-0 leading-relaxed">
                          Release members into the unassigned talent pool without deleting accounts.
                        </p>
                      </div>
                    </div>

                    {/* Reassign Destination Form */}
                    {action === "reassign" && (
                      <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Destination Department
                          </label>
                          <select
                            value={targetDeptId}
                            onChange={(e) => setTargetDeptId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 focus:border-indigo-500 outline-none font-medium text-slate-800 cursor-pointer"
                          >
                            <option value="">-- Select Destination Department --</option>
                            {availableDestinations.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name} {d.code ? `(${d.code})` : ""} • Current: {d.member_count || 0} staff
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedTargetDept && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0">
                                Destination Supervisor (Optional)
                              </label>
                              <span className="text-[10px] text-slate-400">Direct to HOD by default</span>
                            </div>
                            <select
                              value={targetSupervisorId}
                              onChange={(e) => setTargetSupervisorId(e.target.value)}
                              disabled={loadingSupervisors}
                              className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-200 focus:border-indigo-500 outline-none font-medium text-slate-800 cursor-pointer disabled:opacity-50"
                            >
                              <option value="">
                                Direct to Department Head ({selectedTargetDept.head_name || "HOD Apex"})
                              </option>
                              {targetSupervisors.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} (Pod Lead • {s.direct_reports_count} reports)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <p className="mb-0">
                      This department has zero active members and zero sub-departments. Decommissioning can proceed
                      immediately without personnel reassignments.
                    </p>
                  </div>
                )}

                {/* Justification note */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Decommissioning Justification Note
                  </label>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="E.g., Q3 restructuring, operational consolidation into Product division..."
                    className="w-full p-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>

                {/* Fail-Safe Confirmation Input */}
                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <label className="block text-xs font-bold text-rose-900">
                    Security Authorization: Type{" "}
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-rose-300 text-rose-700">
                      {requiredCode}
                    </span>{" "}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder={`Type ${requiredCode} to confirm destruction`}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none font-semibold text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                !isCodeConfirmed ||
                (!canHardDelete && action === "reassign" && !targetDeptId)
              }
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Decommissioning...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-trash3-fill"></i>
                  <span>Authorize & Decommission Department</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
