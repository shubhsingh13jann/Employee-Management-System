import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";

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
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "documents">("overview");

  // Determine whether this dossier belongs to the currently logged in session user
  const isOwnProfile = Boolean(currentUser && user && Number(currentUser.id) === Number(user.id));

  // Document Vault State (persisted per user in localStorage)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<EmployeeDocument["category"]>("Identity");
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState("");

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
        ...(user.audit_logs || []).map((log: any) => ({
          id: `audit-db-${log.id}`,
          type: log.action_type || "Activity",
          title:
            log.field_name === "salary"
              ? "Compensation Adjustment"
              : log.field_name === "phone"
              ? "Contact Phone Number Updated"
              : log.field_name === "email"
              ? "Communication Email Address Updated"
              : log.field_name === "address"
              ? "Office Work Location Updated"
              : log.field_name === "name"
              ? "Legal Identity / Name Updated"
              : log.field_name === "department"
              ? "Department Reallocation"
              : log.field_name === "role"
              ? "Governance Authority Realignment"
              : log.field_name === "status"
              ? "Account Lifecycle Status Change"
              : log.field_name === "password"
              ? "Security Credentials Reset"
              : log.action_type || "Activity Log",
          description: log.details || `Updated ${log.field_name || "profile"} record.`,
          timestamp: log.created_at,
          icon:
            log.action_type === "Compensation"
              ? "bi-cash-stack"
              : log.action_type === "Role"
              ? "bi-shield-check"
              : log.action_type === "Security"
              ? "bi-key-fill"
              : log.action_type === "Status"
              ? "bi-check-circle"
              : log.field_name === "phone" || log.action_type === "Contact"
              ? "bi-telephone-fill"
              : log.field_name === "address" || log.action_type === "Location"
              ? "bi-geo-alt-fill"
              : log.field_name === "department" || log.action_type === "Department"
              ? "bi-diagram-3-fill"
              : log.field_name === "name" || log.action_type === "Identity"
              ? "bi-person-badge-fill"
              : "bi-activity",
          badgeColor:
            log.action_type === "Compensation"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : log.action_type === "Role"
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : log.action_type === "Security"
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : log.field_name === "phone" || log.action_type === "Contact"
              ? "bg-teal-100 text-teal-800 border-teal-200"
              : log.field_name === "address" || log.action_type === "Location"
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : log.field_name === "department" || log.action_type === "Department"
              ? "bg-indigo-100 text-indigo-700 border-indigo-200"
              : "bg-blue-100 text-blue-700 border-blue-200",
          author: log.performed_by || "HR Admin"
        })),
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
          id: "audit-comp-initial",
          type: "Compensation",
          title: `Initial Base Compensation Baseline`,
          description: `Starting baseline salary established at $${Number(user.salary || 0).toLocaleString()} per annum.`,
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
        className="w-full max-w-6xl max-h-[92vh] bg-white rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Executive Header Banner */}
        <div className="shrink-0 px-5 sm:px-6 py-3.5 bg-[#0B132B] text-white flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-200 text-lg font-bold shadow-inner shrink-0 overflow-hidden">
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
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    user?.status === "active"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${user?.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}></span>
                  <span>{user?.status === "active" ? "Active" : "Inactive"}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 mb-0 font-normal truncate flex items-center gap-2 flex-wrap">
                <span>EMP-{String(user?.id || 1).padStart(4, "0")}</span>
                <span className="text-slate-600">|</span>
                <span>{user?.email}</span>
                <span className="text-slate-600">|</span>
                <span>{user?.department_name ? `${user.department_name} Department` : "Unassigned Department"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 relative">
            {copyFeedback && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-700/50 animate-in fade-in">
                {copyFeedback}
              </span>
            )}
            {onGenerateIdCard && user && (
              <button
                type="button"
                onClick={() => onGenerateIdCard(user)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title="Generate Employee ID Card"
              >
                <i className="bi bi-badge-ad"></i>
                <span>ID Badge</span>
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-sm"
                title="More Actions"
              >
                <i className="bi bi-three-dots"></i>
              </button>
              {isHeaderMenuOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-48 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 py-1 text-xs text-slate-200 animate-in fade-in zoom-in-95"
                  onClick={() => setIsHeaderMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.email || "");
                      setCopyFeedback("Email copied!");
                      setTimeout(() => setCopyFeedback(""), 2000);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <i className="bi bi-clipboard text-indigo-400"></i>
                    <span>Copy Work Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`EMP-${String(user?.id || 1).padStart(4, "0")}`);
                      setCopyFeedback("Employee ID copied!");
                      setTimeout(() => setCopyFeedback(""), 2000);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer"
                  >
                    <i className="bi bi-person-badge text-indigo-400"></i>
                    <span>Copy Employee ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 flex items-center gap-2 cursor-pointer border-t border-slate-800"
                  >
                    <i className="bi bi-printer text-indigo-400"></i>
                    <span>Print Dossier</span>
                  </button>
                </div>
              )}
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
        </div>

        {/* Modal Main Body (Dual Column: Left Navigation Drawer + Right Content Canvas) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Left Vertical Sidebar Navigation */}
          <aside className="w-full md:w-56 shrink-0 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200/90 p-3 space-y-1.5 flex md:flex-col justify-between overflow-x-auto md:overflow-x-visible">
            <div className="flex md:flex-col gap-1.5 w-full">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className="bi bi-person-badge text-sm"></i>
                  <span>Profile Overview</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "audit"
                    ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className="bi bi-clock-history text-sm"></i>
                  <span>Audit Trail & Activity</span>
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-700 font-extrabold">
                  {auditEvents.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "documents"
                    ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className="bi bi-folder2-open text-sm"></i>
                  <span>Documents Vault</span>
                </div>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-200 text-slate-700 font-extrabold">
                  {documents.length}
                </span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Canvas */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/30 [scrollbar-width:thin]">
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
                  {/* Hero Profile Banner Card */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-slate-200 overflow-hidden shrink-0 bg-indigo-50 flex items-center justify-center text-indigo-700 text-2xl font-extrabold shadow-xs">
                        {user.image_url ? (
                          <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{user.name ? user.name.charAt(0) : "U"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-0 truncate">
                            {user.name}
                          </h2>
                          {getRoleBadge(user.role)}
                          {user.is_hod ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 border border-amber-400/40">
                              👑 HOD
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs font-semibold text-slate-500 mt-0.5 mb-2 truncate">
                          {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Employee"} | {user.department_name ? `${user.department_name} Department` : "Unassigned Department"}
                        </p>
                        <div className="flex items-center gap-3.5 text-xs text-slate-500 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <i className="bi bi-envelope text-slate-400"></i>
                            <span className="truncate max-w-[200px]">{user.email}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <i className="bi bi-telephone text-slate-400"></i>
                            <span>{user.phone || "Not recorded"}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <i className="bi bi-geo-alt text-slate-400"></i>
                            <span>{user.address ? user.address.split(",")[0] : "Corporate Headquarters"}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-end justify-between gap-3 shrink-0 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <div className="flex items-center md:flex-col md:items-end gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            user.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                          <span>{user.status === "active" ? "Active" : "Inactive"}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Since {user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onEditUser && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditUser(user);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                          >
                            <i className="bi bi-pencil-square"></i>
                            <span>Edit Profile</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 5-Column Personnel Key Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
                    <div className="p-2 sm:px-3.5 sm:py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Employee ID
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        EMP-{String(user.id).padStart(4, "0")}
                      </span>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">Directory Index</span>
                    </div>

                    <div className="p-2 sm:px-3.5 sm:py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Employment Type
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        Full-time
                      </span>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">Permanent</span>
                    </div>

                    <div className="p-2 sm:px-3.5 sm:py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Annual Salary
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        ${Number(user.salary || 0).toLocaleString()}
                      </span>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">Approved Base Compensation</span>
                    </div>

                    <div className="p-2 sm:px-3.5 sm:py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Joined On
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US") : "N/A"}
                      </span>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5">Tenure Initiation Date</span>
                    </div>

                    <div className="p-2 sm:px-3.5 sm:py-1 col-span-2 sm:col-span-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Work Location
                      </span>
                      <span className="font-extrabold text-slate-900 text-sm block truncate">
                        {user.address ? user.address.split(",")[0] : "Corporate Headquarters"}
                      </span>
                      <span className="text-[10.5px] text-slate-400 block mt-0.5 truncate">
                        {user.address && user.address.includes(",") ? user.address : "(Unspecified Suite)"}
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
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-0">
                        Employee Credentials & Document Vault
                      </h4>
                      <p className="text-[11px] text-slate-400 mb-0">
                        {isOwnProfile
                          ? "Manage your personal verification files, identity credentials, and tax records."
                          : "Audit employee credentials to verify statutory files and compliance records."}
                      </p>
                    </div>
                    {isOwnProfile ? (
                      <button
                        type="button"
                        onClick={() => setIsUploadingDoc(!isUploadingDoc)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <i className={`bi ${isUploadingDoc ? "bi-x" : "bi-plus-lg"}`}></i>
                        <span>{isUploadingDoc ? "Cancel" : "Attach Document"}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs shrink-0">
                        <i className="bi bi-shield-check text-emerald-600"></i>
                        <span>HR Compliance Mode</span>
                      </div>
                    )}
                  </div>

                  {/* Informational Banner for HR reviewing employee records */}
                  {!isOwnProfile && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-600 text-xs flex items-start gap-3 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="bi bi-clipboard-check-fill text-sm"></i>
                      </div>
                      <div className="text-[11.5px] leading-relaxed">
                        <strong className="text-slate-800">Compliance & Verification Audit:</strong> Reviewing documentation submitted by <span className="font-semibold text-slate-900">{user.name}</span> to ensure all regulatory contracts and identity certificates are on file with the company. File modifications and deletions are restricted to the employee's personal portal.
                      </div>
                    </div>
                  )}

                  {/* Inline Document Upload Form (Only for own profile) */}
                  {isOwnProfile && isUploadingDoc && (
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
                          {isOwnProfile && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white flex items-center justify-center transition-colors cursor-pointer"
                              title="Remove Document"
                            >
                              <i className="bi bi-trash text-xs"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
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
