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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [targetDeptId, setTargetDeptId] = useState<string>("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
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

  // Set initial selected user or department
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(String(initialUserId));
      setStep(1);
    } else {
      setSelectedUserId("");
    }
    setTargetDeptId("");
    setError("");
  }, [isOpen, initialUserId, initialDeptId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedUser = users.find((u) => String(u.id) === String(selectedUserId));
  const currentDept = departments.find((d) => d.id === selectedUser?.department_id);
  const availableTargetDepts = departments.filter((d) => d.id !== selectedUser?.department_id);
  const selectedTargetDept = departments.find((d) => String(d.id) === String(targetDeptId));

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-xl font-bold shadow-inner shrink-0">
              <i className="bi bi-arrow-left-right"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight mb-0">
                  Workforce Mobility Transfer
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Step {step} of 2
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 mb-0">
                Reassign personnel across operational departments & reporting structures
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill text-rose-500"></i>
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Member Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Select Employee / Leader to Transfer
            </label>

            {!initialUserId ? (
              <div className="space-y-2">
                <div className="relative">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search candidate by name, email, or role..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading directory...</div>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUserId(String(u.id))}
                        className={`w-full p-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          String(selectedUserId) === String(u.id)
                            ? "bg-indigo-50/80 text-indigo-900 font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold block text-xs leading-tight">{u.name}</span>
                            <span className="text-[10px] text-slate-400">{u.email}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 block mb-0.5">
                            {u.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {u.department_name || "Unassigned"}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">No personnel match search query</div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Selected User Details Card */}
            {selectedUser && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  {selectedUser.image_url ? (
                    <img
                      src={selectedUser.image_url}
                      alt={selectedUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-slate-800 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                      {selectedUser.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h6 className="font-bold text-slate-900 text-xs mb-0">{selectedUser.name}</h6>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                        {selectedUser.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">{selectedUser.email}</span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[10px] text-slate-400 block font-medium">Source Department</span>
                  <span className="font-bold text-indigo-700">
                    {currentDept?.name || selectedUser.department_name || "Unassigned"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Destination Department */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Target Destination Department
            </label>

            <select
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all cursor-pointer font-medium text-slate-800"
            >
              <option value="">-- Choose Target Department --</option>
              {availableTargetDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""} • {d.member_count || 0} members
                </option>
              ))}
            </select>

            {/* Target Department Overview Card */}
            {selectedTargetDept && (
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    <i className="bi bi-building"></i>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">
                      {selectedTargetDept.name}
                    </span>
                    <span className="text-[11px] text-indigo-700 font-medium">
                      HOD: {selectedTargetDept.head_name || "Vacant"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-indigo-700 border border-indigo-200">
                    {selectedTargetDept.member_count || 0} Current Staff
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
            Enterprise Transfer Governance
          </span>
        </div>
      </div>
    </div>
  );
};
