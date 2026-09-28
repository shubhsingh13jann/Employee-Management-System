import React, { useEffect, useState } from "react";
import api from "../api/axios";

interface TransferMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: any[];
  initialUserId?: number | null;
  initialDeptId?: number | null;
  onTransferSuccess?: (msg: string) => void;
}

export const TransferMemberModal: React.FC<TransferMemberModalProps> = ({
  isOpen,
  onClose,
  departments,
  initialUserId,
  initialDeptId,
  onTransferSuccess
}) => {
  // Wizard Step: 1 = Candidate, 2 = Destination, 3 = Reporting & Reason, 4 = Diff Review
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [targetDeptId, setTargetDeptId] = useState<string>("");
  const [targetSupervisorId, setTargetSupervisorId] = useState<string>("");
  const [targetSupervisors, setTargetSupervisors] = useState<any[]>([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [confirmedSafeguards, setConfirmedSafeguards] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch users when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        setError("");
        const res = await api.get("/api/admin/users");
        if (res.data.status) {
          setUsers(res.data.users || []);
        }
      } catch (err: any) {
        console.error("Failed to load users for transfer:", err);
        setError("Failed to load employee directory");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isOpen]);

  // Set initial selected user or department and reset step
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(String(initialUserId));
      setCurrentStep(2); // If candidate pre-selected from row action, jump directly to destination step!
    } else {
      setSelectedUserId("");
      setCurrentStep(1);
    }
    setTargetDeptId("");
    setTargetSupervisorId("");
    setTargetSupervisors([]);
    setTransferReason("");
    setConfirmedSafeguards(false);
    setError("");
  }, [isOpen, initialUserId, initialDeptId]);

  // Load target department supervisors when targetDeptId changes
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
        console.error("Failed to load destination supervisors:", err);
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

  if (!isOpen) return null;

  const selectedUser = users.find((u) => String(u.id) === String(selectedUserId));
  const currentDept = departments.find((d) => d.id === selectedUser?.department_id);
  const availableTargetDepts = departments.filter((d) => d.id !== selectedUser?.department_id);
  const selectedTargetDept = departments.find((d) => String(d.id) === String(targetDeptId));
  const selectedSupervisor = targetSupervisors.find((s) => String(s.id) === String(targetSupervisorId));

  const isSupervisor = selectedUser?.role === "supervisor";
  const isSourceHod = currentDept && currentDept.head_id === selectedUser?.id;

  const filteredUsers = users.filter((u) => {
    if (initialDeptId && u.department_id !== initialDeptId && !initialUserId) return false;
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.department_name?.toLowerCase().includes(q)
    );
  });

  const handleNextStep = () => {
    setError("");
    if (currentStep === 1) {
      if (!selectedUserId) {
        setError("Please select a candidate to initiate transfer.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!targetDeptId) {
        setError("Please select a destination department.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (currentStep > 1) {
      // If candidate was pre-selected through direct row action, don't go back to step 1
      if (currentStep === 2 && initialUserId) {
        return;
      }
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !targetDeptId) {
      setError("Candidate and target destination department are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await api.post("/api/admin/departments/transfer-member", {
        user_id: Number(selectedUserId),
        target_department_id: Number(targetDeptId),
        target_supervisor_id: targetSupervisorId ? Number(targetSupervisorId) : null,
        reason: transferReason.trim() || "Workforce mobility realignment"
      });

      if (res.data.status) {
        if (onTransferSuccess) {
          onTransferSuccess(res.data.message || `Successfully transferred ${selectedUser?.name}`);
        }
        onClose();
      } else {
        setError(res.data.error || "Failed to execute transfer");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error executing personnel transfer");
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Candidate", icon: "bi-person-check" },
    { num: 2, label: "Destination", icon: "bi-building-up" },
    { num: 3, label: "Reporting", icon: "bi-diagram-3" },
    { num: 4, label: "Diff Review", icon: "bi-file-earmark-diff" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-lg font-bold shadow-inner shrink-0">
              <i className="bi bi-arrow-left-right"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight mb-0">
                  Workforce Mobility Transfer
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Step {currentStep} of 4
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 mb-0">
                Cross-department personnel transfer & reporting structure alignment
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

        {/* Stepper Wizard Progress Indicator */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            {stepsList.map((s, idx) => {
              const isPassed = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <React.Fragment key={s.num}>
                  <div
                    onClick={() => {
                      if (isPassed && (!initialUserId || s.num > 1)) {
                        setCurrentStep(s.num);
                      }
                    }}
                    className={`flex items-center gap-2 transition-all ${
                      isPassed ? "cursor-pointer" : ""
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs ${
                        isPassed
                          ? "bg-emerald-600 text-white"
                          : isCurrent
                          ? "bg-indigo-600 text-white ring-3 ring-indigo-100"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isPassed ? <i className="bi bi-check-lg text-xs"></i> : s.num}
                    </div>
                    <span
                      className={`text-xs font-semibold hidden sm:inline ${
                        isCurrent
                          ? "text-indigo-900 font-bold"
                          : isPassed
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {idx < stepsList.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                        currentStep > s.num ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Modal Wizard Body */}
        <form onSubmit={handleExecuteTransfer} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto max-h-[64vh]">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <i className="bi bi-exclamation-triangle-fill text-rose-500 shrink-0"></i>
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Candidate Selection */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Select Transfer Candidate</h4>
                  <p className="text-xs text-slate-500 mb-0">
                    Search and choose the employee or team lead you wish to mobilize.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search candidates by name, email, department, or role..."
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white shadow-2xs">
                    {loadingUsers ? (
                      <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading active personnel...</span>
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => {
                        const isSelected = String(selectedUserId) === String(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setSelectedUserId(String(u.id))}
                            className={`w-full p-3 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50/90 text-indigo-950 font-semibold"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {u.image_url ? (
                                <img
                                  src={u.image_url}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                                  {u.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <span className="font-bold block text-xs leading-tight">{u.name}</span>
                                <span className="text-[11px] text-slate-400">{u.email}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 block mb-0.5 uppercase tracking-wider">
                                {u.role}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {u.department_name || "Unassigned"}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No active employees match the search filter.
                      </div>
                    )}
                  </div>
                </div>

                {selectedUser && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {selectedUser.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="font-bold text-slate-900 text-xs mb-0">{selectedUser.name}</h6>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            Selected
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{selectedUser.email}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Current Department</span>
                      <span className="font-bold text-indigo-700 text-xs">
                        {currentDept?.name || selectedUser.department_name || "Unassigned"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Target Destination Department */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Target Destination Department</h4>
                  <p className="text-xs text-slate-500 mb-0">
                    Select the operational unit where {selectedUser?.name || "the candidate"} will be deployed.
                  </p>
                </div>

                {/* Candidate Summary Mini Bar */}
                {selectedUser && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
                        {selectedUser.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 leading-tight block">{selectedUser.name}</span>
                        <span className="text-[10px] text-slate-400">{selectedUser.role}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Origin</span>
                      <span className="font-bold text-slate-700 text-xs">{currentDept?.name || "Unassigned"}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select Target Department
                  </label>
                  <select
                    value={targetDeptId}
                    onChange={(e) => setTargetDeptId(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer font-medium text-slate-800"
                  >
                    <option value="">-- Choose Target Department --</option>
                    {availableTargetDepts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.code ? `(${d.code})` : ""} • Current Staff: {d.member_count || 0}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTargetDept && (
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-xs animate-in fade-in duration-150 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        <i className="bi bi-building"></i>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs leading-tight">
                          {selectedTargetDept.name} {selectedTargetDept.code ? `(${selectedTargetDept.code})` : ""}
                        </span>
                        <span className="text-[11px] text-indigo-700 font-medium">
                          HOD: {selectedTargetDept.head_name || "Vacant"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200 shadow-2xs block">
                        {(selectedTargetDept.member_count || 0) + 1} Staff Post-Transfer
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Reporting Structure & Reason */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Destination Reporting & Justification</h4>
                  <p className="text-xs text-slate-500 mb-0">
                    Define reporting line in {selectedTargetDept?.name} and record transfer justification.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-0">
                      Destination Supervisor / Lead
                    </label>
                    <span className="text-[10px] text-slate-400">Direct to HOD by default</span>
                  </div>

                  <select
                    value={targetSupervisorId}
                    onChange={(e) => setTargetSupervisorId(e.target.value)}
                    disabled={loadingSupervisors}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer font-medium text-slate-800 disabled:opacity-50"
                  >
                    <option value="">
                      Direct to Department Head ({selectedTargetDept?.head_name || "Department HOD"})
                    </option>
                    {targetSupervisors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Pod Lead • {s.direct_reports_count} direct reports)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-0">
                    Transfer Reason & Governance Justification
                  </label>
                  <textarea
                    rows={3}
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="E.g., Cross-functional realignment, skill allocation for project launch, or promotional lateral transfer..."
                    className="w-full p-3 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                  ></textarea>
                </div>

                {/* Safeguard & Policy Alerts */}
                {isSupervisor && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 animate-in fade-in duration-150">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <i className="bi bi-shield-exclamation text-amber-600"></i>
                      <span>Managerial Span Safeguard Active</span>
                    </div>
                    <p className="text-[11px] text-amber-700 mb-0">
                      Transferring this supervisor will automatically reassign any direct reportees in {currentDept?.name} directly to the source Department Head to prevent orphaned reporting lines.
                    </p>
                  </div>
                )}

                {isSourceHod && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1 animate-in fade-in duration-150">
                    <div className="font-bold flex items-center gap-1.5 text-rose-800">
                      <i className="bi bi-exclamation-octagon text-rose-600"></i>
                      <span>Department Head Vacancy Alert</span>
                    </div>
                    <p className="text-[11px] text-rose-700 mb-0">
                      {selectedUser?.name} is the designated Head of Department for {currentDept?.name}. Completing this transfer will leave {currentDept?.name} vacant until an interim or replacement HOD is appointed.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Executive Review & Diff Comparison */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Executive Review & Mobility Diff</h4>
                  <p className="text-xs text-slate-500 mb-0">
                    Inspect the proposed organizational changes before finalizing workforce reassignment.
                  </p>
                </div>

                {/* Side-by-side Before & After Diff Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Before / Source State */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Current Assignment
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-200 text-slate-700">
                        Source
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Department</span>
                        <span className="font-bold text-slate-800">{currentDept?.name || "Unassigned"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Leadership Tier</span>
                        <span className="font-semibold text-slate-700">
                          {isSourceHod ? "Head of Department (HOD)" : "Staff / Functional"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Headcount Impact</span>
                        <span className="font-semibold text-slate-600">
                          {currentDept ? `${currentDept.member_count || 1} → ${(currentDept.member_count || 1) - 1} members` : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* After / Target State */}
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-indigo-200/70">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                        Proposed Assignment
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-indigo-600 text-white">
                        Destination
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] text-indigo-500 block font-medium">Department</span>
                        <span className="font-bold text-indigo-950">{selectedTargetDept?.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-500 block font-medium">Assigned Reporting Line</span>
                        <span className="font-semibold text-indigo-900">
                          {selectedSupervisor
                            ? `Pod Lead: ${selectedSupervisor.name}`
                            : `Direct to HOD: ${selectedTargetDept?.head_name || "Apex Leader"}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-indigo-500 block font-medium">Headcount Impact</span>
                        <span className="font-semibold text-emerald-700">
                          {selectedTargetDept
                            ? `${selectedTargetDept.member_count || 0} → ${(selectedTargetDept.member_count || 0) + 1} members`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Justification summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Recorded Transfer Justification
                  </span>
                  <p className="text-slate-700 italic mb-0">
                    "{transferReason.trim() || "Workforce mobility realignment and strategic resource balancing."}"
                  </p>
                </div>

                {/* Acknowledgment checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors text-xs">
                  <input
                    type="checkbox"
                    checked={confirmedSafeguards}
                    onChange={(e) => setConfirmedSafeguards(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-slate-700 leading-snug">
                    I confirm this workforce transfer complies with organizational governance protocols and approve
                    immediate reporting realignment.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Modal Footer with Stepper Navigation */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            {currentStep > 1 && (!initialUserId || currentStep > 2) ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <i className="bi bi-chevron-left text-xs"></i>
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !selectedUserId) ||
                  (currentStep === 2 && !targetDeptId)
                }
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <i className="bi bi-chevron-right text-xs"></i>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!confirmedSafeguards || submitting}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Executing Realignment...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Authorize & Execute Transfer</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
