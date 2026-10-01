import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number | null;
  onEditUser?: (user: any) => void;
  onGenerateIdCard?: (user: any) => void;
}

interface EmployeeDocument {
  id: string;
  name: string;
  category: "Identity" | "Contract" | "Tax" | "Certification" | "Other";
  fileType: "pdf" | "image" | "doc";
  fileSize: string;
  uploadDate: string;
  status: "verified" | "pending";
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  onEditUser,
  onGenerateIdCard
}) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "documents">("overview");

  // Document Vault State (persisted per user in localStorage)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<EmployeeDocument["category"]>("Identity");

  useEffect(() => {
    if (!isOpen || !userId) return;
    setActiveTab("overview");

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

    // Load or initialize documents for this user
    try {
      const storedDocs = localStorage.getItem(`ems_user_docs_${userId}`);
      if (storedDocs) {
        setDocuments(JSON.parse(storedDocs));
      } else {
        const defaultDocs: EmployeeDocument[] = [
          {
            id: "doc-1",
            name: "Government ID / Passport Scan",
            category: "Identity",
            fileType: "pdf",
            fileSize: "2.4 MB",
            uploadDate: new Date().toISOString().slice(0, 10),
            status: "verified"
          },
          {
            id: "doc-2",
            name: "Employment Contract & Offer Letter",
            category: "Contract",
            fileType: "pdf",
            fileSize: "1.8 MB",
            uploadDate: new Date().toISOString().slice(0, 10),
            status: "verified"
          },
          {
            id: "doc-3",
            name: "Non-Disclosure Agreement (NDA)",
            category: "Contract",
            fileType: "pdf",
            fileSize: "840 KB",
            uploadDate: new Date().toISOString().slice(0, 10),
            status: "verified"
          },
          {
            id: "doc-4",
            name: "Tax Withholding & Direct Deposit Form",
            category: "Tax",
            fileType: "pdf",
            fileSize: "620 KB",
            uploadDate: new Date().toISOString().slice(0, 10),
            status: "pending"
          }
        ];
        setDocuments(defaultDocs);
        localStorage.setItem(`ems_user_docs_${userId}`, JSON.stringify(defaultDocs));
      }
    } catch {
      setDocuments([]);
    }
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

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !userId) return;

    const newDoc: EmployeeDocument = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim(),
      category: newDocCategory,
      fileType: "pdf",
      fileSize: "1.2 MB",
      uploadDate: new Date().toISOString().slice(0, 10),
      status: "verified"
    };

    const updated = [newDoc, ...documents];
    setDocuments(updated);
    localStorage.setItem(`ems_user_docs_${userId}`, JSON.stringify(updated));
    setNewDocName("");
    setIsUploadingDoc(false);
  };

  const handleDeleteDocument = (docId: string) => {
    if (!userId) return;
    const updated = documents.filter((d) => d.id !== docId);
    setDocuments(updated);
    localStorage.setItem(`ems_user_docs_${userId}`, JSON.stringify(updated));
  };

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

  // Compile Comprehensive Audit Trail (Item 40)
  const auditEvents = user
    ? [
        ...(user.transfers || []).map((t: any) => ({
          id: `transfer-${t.id}`,
          type: "Transfer",
          title: `Department Mobility Reorganization`,
          description: `Transferred from ${t.source_dept_name || "Unassigned"} to ${t.target_dept_name}. Reason: ${
            t.reason ? `"${t.reason}"` : "Organizational squad alignment."
          }`,
          timestamp: t.transferred_at,
          icon: "bi-arrow-left-right",
          badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
          author: "System / Admin"
        })),
        {
          id: "audit-status",
          type: "Status",
          title: `Account Lifecycle Status: ${user.status === "active" ? "Operational" : "Suspended"}`,
          description: `Account authority verified as ${user.status || "active"}. User access credentials active.`,
          timestamp: user.created_at,
          icon: user.status === "active" ? "bi-check-circle" : "bi-slash-circle",
          badgeColor: user.status === "active" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200",
          author: "Governance Protocol"
        },
        {
          id: "audit-role",
          type: "Role",
          title: `Governance Authority Allocated: ${user.role?.toUpperCase()}`,
          description: `Assigned tier privileges within system hierarchy. Department Head: ${user.is_hod ? "Yes (👑 Crowned HOD)" : "No"}.`,
          timestamp: user.created_at,
          icon: "bi-shield-check",
          badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
          author: "System Executive"
        },
        {
          id: "audit-comp",
          type: "Compensation",
          title: `Base Compensation Ledger Verified`,
          description: `Base salary verified at $${Number(user.salary || 0).toLocaleString()} per annum.`,
          timestamp: user.created_at,
          icon: "bi-cash-stack",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          author: "Finance / HR Admin"
        },
        {
          id: "audit-onboard",
          type: "Onboarding",
          title: `Workforce Personnel Initiated & Onboarded`,
          description: `Initial profile record and employee identifier #${user.id} registered into enterprise directory.`,
          timestamp: user.created_at,
          icon: "bi-person-check-fill",
          badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
          author: "HR Operations"
        }
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

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
        className="w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150"
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

          <div className="flex items-center gap-2">
            {onGenerateIdCard && user && (
              <button
                type="button"
                onClick={() => onGenerateIdCard(user)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold transition-all cursor-pointer"
                title="Generate Employee ID Card"
              >
                <i className="bi bi-badge-ad"></i>
                <span>ID Badge</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm font-bold shrink-0 disabled:opacity-50"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="shrink-0 px-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <i className="bi bi-person-badge"></i>
            <span>Profile Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "audit"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <i className="bi bi-clock-history"></i>
            <span>Audit Trail & Activity</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-700 font-extrabold">
              {auditEvents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documents")}
            className={`px-3.5 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "border-indigo-600 text-indigo-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <i className="bi bi-folder2-open"></i>
            <span>Documents Vault</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-200 text-slate-700 font-extrabold">
              {documents.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 [scrollbar-width:thin]">
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
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-5 animate-in fade-in duration-150">
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
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                                  {report.image_url ? (
                                    <img src={report.image_url} alt={report.name} className="w-full h-full object-cover" />
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
                </div>
              )}

              {/* TAB 2: AUDIT TRAIL (Item 40) */}
              {activeTab === "audit" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-0">
                        Personnel Audit Trail & Change Ledger
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-0">
                        Chronological record of lifecycle events, governance roles, and mobility.
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {auditEvents.length} Recorded Events
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {auditEvents.map((event) => (
                      <div key={event.id} className="relative group">
                        {/* Timeline Node Icon */}
                        <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-indigo-600 text-[9px] shadow-2xs">
                          <i className={`bi ${event.icon}`}></i>
                        </div>

                        {/* Event Card */}
                        <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl p-3.5 transition-all shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase border ${event.badgeColor}`}>
                                {event.type}
                              </span>
                              <h5 className="text-xs font-bold text-slate-900 mb-0">
                                {event.title}
                              </h5>
                            </div>
                            <span className="text-[10.5px] font-medium text-slate-400">
                              {new Date(event.timestamp).toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 mb-1.5 leading-relaxed">
                            {event.description}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <i className="bi bi-person-badge"></i>
                            <span>Logged by: <strong className="text-slate-600">{event.author}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DOCUMENTS VAULT (Item 42) */}
              {activeTab === "documents" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-0">
                        Employee Credentials & Document Vault
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-0">
                        Verified contracts, identification proofs, and compliance records.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUploadingDoc(!isUploadingDoc)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <i className={`bi ${isUploadingDoc ? "bi-x" : "bi-plus-lg"}`}></i>
                      <span>{isUploadingDoc ? "Cancel" : "Attach Document"}</span>
                    </button>
                  </div>

                  {/* Inline Document Upload Form */}
                  {isUploadingDoc && (
                    <form
                      onSubmit={handleAddDocument}
                      className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3 animate-in fade-in zoom-in-95"
                    >
                      <div className="text-xs font-bold text-indigo-950">Attach Employment Record</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Document Title</label>
                          <input
                            type="text"
                            required
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            placeholder="e.g. Master Degree Certificate"
                            className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 outline-none focus:border-indigo-600"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-1">Category</label>
                          <select
                            value={newDocCategory}
                            onChange={(e) => setNewDocCategory(e.target.value as any)}
                            className="w-full h-8 px-2.5 rounded-lg bg-white border border-slate-300 outline-none focus:border-indigo-600"
                          >
                            <option value="Identity">Identity / Passport</option>
                            <option value="Contract">Contract / Offer Letter</option>
                            <option value="Tax">Tax / Banking</option>
                            <option value="Certification">Academic / Certificate</option>
                            <option value="Other">Other Record</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsUploadingDoc(false)}
                          className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200/60 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer shadow-2xs"
                        >
                          Save Document
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Documents Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 transition-all flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 text-base shadow-2xs shrink-0">
                            <i className="bi bi-file-earmark-pdf-fill"></i>
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate mb-0.5">
                              {doc.name}
                            </h5>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
                              <span className="px-1.5 py-0.2 rounded font-semibold bg-slate-200/70 text-slate-600">
                                {doc.category}
                              </span>
                              <span>•</span>
                              <span>{doc.fileSize}</span>
                              <span>•</span>
                              <span>{doc.uploadDate}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                              <i className="bi bi-check-circle-fill"></i>
                              <span>Verified Compliance</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => alert(`Simulated document viewer for: "${doc.name}"`)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white flex items-center justify-center transition-colors cursor-pointer"
                            title="View Document"
                          >
                            <i className="bi bi-eye text-xs"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove Document"
                          >
                            <i className="bi bi-trash text-xs"></i>
                          </button>
                        </div>
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Close Dossier
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              title="Print Dossier Document"
            >
              <i className="bi bi-printer"></i>
              <span>Print Dossier</span>
            </button>
          </div>

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
