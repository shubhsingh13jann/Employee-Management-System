import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../api/axios";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  onEditUser?: (user: any) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  onEditUser
}) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await api.get(`/api/admin/users/${userId}`);
        if (res.data.status) {
          setUser(res.data.user);
        }
      } catch (err: any) {
        console.error("Fetch user details error:", err);
        setErrorMsg(err.response?.data?.error || "Failed to load member profile details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [isOpen, userId]);

  // Lock background scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-200 border border-rose-400/30">
            👑 HR Admin
          </span>
        );
      case "manager":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
            👔 Manager
          </span>
        );
      case "supervisor":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            👷 Supervisor
          </span>
        );
      case "employee":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-200 border border-sky-400/30">
            💼 Employee
          </span>
        );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Executive Header Banner */}
        <div className="shrink-0 px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-indigo-900/40">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-200 text-lg font-bold shadow-inner shrink-0 overflow-hidden">
              {user?.image_url ? (
                <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name ? user.name.charAt(0) : "U"}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-white tracking-tight mb-0 truncate">
                  {user?.name || "Member Profile"}
                </h3>
                {user && getRoleBadge(user.role)}
                {user?.is_hod ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    👑 HOD
                  </span>
                ) : null}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    user?.status === "active" ? "bg-emerald-500/20 text-emerald-200" : "bg-slate-500/20 text-slate-300"
                  }`}
                >
                  {user?.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 mt-0.5 mb-0 font-normal truncate">
                {user?.email} • {user?.department_name ? `${user.department_name} Department` : "Unassigned Department"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm font-bold shrink-0 disabled:opacity-50"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading complete member profile...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{errorMsg}</span>
            </div>
          ) : user ? (
            <>
              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Annual Salary</span>
                  <span className="font-extrabold text-slate-900 text-base">
                    ${Number(user.salary || 0).toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Approved Base Compensation</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contact Phone</span>
                  <span className="font-semibold text-slate-800 text-xs block truncate">
                    {user.phone || "Not recorded"}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Mobile / Direct Extension</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Onboarded Since</span>
                  <span className="font-semibold text-slate-800 text-xs block">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Tenure Initiation Date</span>
                </div>

                <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Office / Work Location</span>
                  <span className="font-semibold text-slate-800 text-xs block">
                    {user.address || "Corporate Headquarters (Unspecified Suite)"}
                  </span>
                </div>
              </div>

              {/* Reporting Line / Hierarchy Section */}
              <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5 mb-0">
                  <i className="bi bi-diagram-3-fill text-indigo-600"></i>
                  <span>Institutional Reporting Chain</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Assigned Department
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {user.department_name || "Unassigned"}
                      </span>
                      {user.department_code && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {user.department_code}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Direct Supervisor
                    </span>
                    {user.supervisor_name ? (
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{user.supervisor_name}</span>
                        <span className="text-[11px] text-slate-400">{user.supervisor_email}</span>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-500 italic text-xs">
                        Direct to Department Head / Apex Authority
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct Reports Squad (Only if Supervisor or Manager) */}
              {(user.role === "supervisor" || user.role === "manager") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-0">
                      <i className="bi bi-people-fill text-indigo-600"></i>
                      <span>Assigned Squad Roster ({user.direct_reports?.length || 0} Direct Reports)</span>
                    </h4>
                  </div>

                  {user.direct_reports && user.direct_reports.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                      {user.direct_reports.map((report: any) => (
                        <div key={report.id} className="p-3 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                              {report.image_url ? (
                                <img src={report.image_url} alt={report.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <span>{report.name ? report.name.charAt(0) : "U"}</span>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block text-xs leading-tight">
                                {report.name}
                              </span>
                              <span className="text-[11px] text-slate-400 block">{report.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 text-slate-600">
                              {report.role}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                report.status === "active" ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                              title={report.status}
                            ></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                      No direct team members currently mapped to this supervisor.
                    </div>
                  )}
                </div>
              )}

              {/* Mobility History (If transfers exist) */}
              {user.transfers && user.transfers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-0">
                    <i className="bi bi-clock-history text-indigo-600"></i>
                    <span>Department Mobility History</span>
                  </h4>

                  <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                    {user.transfers.map((t: any) => (
                      <div key={t.id} className="p-3 text-xs flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs">
                            <span>{t.source_dept_name || "Unassigned"}</span>
                            <i className="bi bi-arrow-right text-slate-400 text-[10px]"></i>
                            <span className="text-indigo-700">{t.target_dept_name}</span>
                          </div>
                          {t.reason && <p className="text-[11px] text-slate-400 italic mb-0">"{t.reason}"</p>}
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(t.transferred_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer Controls */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            Close Profile
          </button>

          {user && onEditUser && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditUser(user);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer"
            >
              <i className="bi bi-pencil-square"></i>
              <span>Edit Member Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
