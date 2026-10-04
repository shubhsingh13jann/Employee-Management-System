import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import ErrorBoundary from "../../common/ErrorBoundary";

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
  description?: string;
  category: "Identity" | "Contract" | "Tax" | "Certification" | "Other";
  fileType: "pdf" | "image" | "doc";
  fileSize: string;
  uploadDate: string;
  status: "verified" | "pending";
}

const formatDateSafe = (
  dateVal: any,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-US",
  fallback = "N/A"
): string => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString(locale, options);
  } catch {
    return fallback;
  }
};

const formatDateTimeSafe = (
  dateVal: any,
  options?: Intl.DateTimeFormatOptions,
  locale = "en-US",
  fallback = "N/A"
): string => {
  if (!dateVal) return fallback;
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString(locale, options);
  } catch {
    return fallback;
  }
};

const getTimestampSafe = (dateVal: any): number => {
  if (!dateVal) return 0;
  try {
    const t = new Date(dateVal).getTime();
    return isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
};

const getAddressCity = (addr: any, fallback = "Corporate Headquarters"): string => {
  if (typeof addr !== "string" || !addr.trim()) return fallback;
  const parts = addr.split(",");
  return parts[0]?.trim() || fallback;
};

const getAddressFull = (addr: any, fallback = "Not specified"): string => {
  if (typeof addr !== "string" || !addr.trim()) return fallback;
  return addr.trim() || fallback;
};

const formatRoleTitle = (role?: any): string => {
  if (typeof role !== "string" || !role.trim()) return "Employee";
  const r = role.toLowerCase().trim();
  if (r === "admin") return "HR Admin";
  if (r === "manager") return "Manager";
  if (r === "supervisor") return "Supervisor";
  return r.charAt(0).toUpperCase() + r.slice(1);
};

const formatSalarySafe = (val: any): string => {
  const num = Number(val);
  return isNaN(num) ? "0" : num.toLocaleString();
};

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
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>("all");

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
            description: "Statutory proof of identity and citizenship verification",
            category: "Identity",
            fileType: "pdf",
            fileSize: "2.4 MB",
            uploadDate: new Date().toISOString().slice(0, 10),
            status: "verified"
          },
          {
            id: "doc-2",
            name: "Employment Contract & Offer Letter",
            description: "Signed formal executive contract and terms",
            category: "Contract",
            fileType: "pdf",
            fileSize: "1.8 MB",
            uploadDate: new Date().toISOString().slice(0, 10),
            status: "verified"
          },
          {
            id: "doc-3",
            name: "Non-Disclosure Agreement (NDA)",
            description: "Confidentiality and proprietary rights covenants",
            category: "Contract",
            fileType: "pdf",
            fileSize: "840 KB",
            uploadDate: new Date().toISOString().slice(0, 10),
            status: "verified"
          },
          {
            id: "doc-4",
            name: "Tax Withholding & Direct Deposit Form",
            description: "W-4 withholding declaration and verified bank coordinates",
            category: "Tax",
            fileType: "pdf",
            fileSize: "620 KB",
            uploadDate: new Date().toISOString().slice(0, 10),
            status: "verified"
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
      description: "User submitted compliance document",
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

  const getRoleBadge = (role: string, isDark: boolean = false) => {
    if (isDark) {
      switch (role) {
        case "admin":
          return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/30">
              👑 HR Admin
            </span>
          );
        case "manager":
          return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
              👔 Manager
            </span>
          );
        case "supervisor":
          return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              👷 Supervisor
            </span>
          );
        case "employee":
        default:
          return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30">
              💼 Employee
            </span>
          );
      }
    }

    switch (role) {
      case "admin":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            👑 HR Admin
          </span>
        );
      case "manager":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
            👔 Manager
          </span>
        );
      case "supervisor":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            👷 Supervisor
          </span>
        );
      case "employee":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs">
            💼 Employee
          </span>
        );
    }
  };

  // Compile Comprehensive Audit Trail (Item 40)
  const auditEvents = user
    ? [
        ...(Array.isArray(user.audit_logs) ? user.audit_logs : []).map((log: any) => ({
          id: `audit-db-${log?.id || Math.random()}`,
          type: log?.action_type || "Activity",
          title:
            log?.field_name === "salary"
              ? "Compensation Adjustment"
              : log?.field_name === "phone"
              ? "Contact Phone Number Updated"
              : log?.field_name === "email"
              ? "Communication Email Address Updated"
              : log?.field_name === "address"
              ? "Office Work Location Updated"
              : log?.field_name === "name"
              ? "Legal Identity / Name Updated"
              : log?.field_name === "department"
              ? "Department Reallocation"
              : log?.field_name === "role"
              ? "Governance Authority Realignment"
              : log?.field_name === "status"
              ? "Account Lifecycle Status Change"
              : log?.field_name === "password"
              ? "Security Credentials Reset"
              : log?.action_type || "Activity Log",
          description: log?.details || `Updated ${log?.field_name || "profile"} record.`,
          timestamp: log?.created_at,
          icon:
            log?.action_type === "Compensation"
              ? "bi-cash-stack"
              : log?.action_type === "Role"
              ? "bi-shield-check"
              : log?.action_type === "Security"
              ? "bi-key-fill"
              : log?.action_type === "Status"
              ? "bi-check-circle"
              : log?.field_name === "phone" || log?.action_type === "Contact"
              ? "bi-telephone-fill"
              : log?.field_name === "address" || log?.action_type === "Location"
              ? "bi-geo-alt-fill"
              : log?.field_name === "department" || log?.action_type === "Department"
              ? "bi-diagram-3-fill"
              : log?.field_name === "name" || log?.action_type === "Identity"
              ? "bi-person-badge-fill"
              : "bi-activity",
          badgeColor:
            log?.action_type === "Compensation"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : log?.action_type === "Role"
              ? "bg-purple-100 text-purple-700 border-purple-200"
              : log?.action_type === "Security"
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : log?.field_name === "phone" || log?.action_type === "Contact"
              ? "bg-teal-100 text-teal-800 border-teal-200"
              : log?.field_name === "address" || log?.action_type === "Location"
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : log?.field_name === "department" || log?.action_type === "Department"
              ? "bg-indigo-100 text-indigo-700 border-indigo-200"
              : "bg-blue-100 text-blue-700 border-blue-200",
          author: log?.performed_by || "HR Admin"
        })),
        ...(Array.isArray(user.transfers) ? user.transfers : []).map((t: any) => ({
          id: `transfer-${t?.id || Math.random()}`,
          type: "Transfer",
          title: `Department Mobility Reorganization`,
          description: `Transferred from ${t?.source_dept_name || "Unassigned"} to ${t?.target_dept_name || "New Department"}. Reason: ${
            t?.reason ? `"${t.reason}"` : "Organizational squad alignment."
          }`,
          timestamp: t?.transferred_at,
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
          title: `Governance Authority Allocated: ${formatRoleTitle(user.role)}`,
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
          description: `Starting baseline salary established at $${formatSalarySafe(user.salary)} per annum.`,
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
      ].sort((a, b) => getTimestampSafe(b.timestamp) - getTimestampSafe(a.timestamp))
    : [];

  const displayedAuditEvents = user && auditEvents
    ? (auditCategoryFilter === "all"
        ? auditEvents
        : auditEvents.filter((e) => {
            if (auditCategoryFilter === "Transfer") return e.type === "Transfer";
            if (auditCategoryFilter === "Compensation") return e.type === "Compensation";
            if (auditCategoryFilter === "Contact") return e.type === "Contact" || e.title.includes("Phone") || e.title.includes("Email") || e.title.includes("Location") || e.type === "Location";
            if (auditCategoryFilter === "Role") return e.type === "Role";
            if (auditCategoryFilter === "Status") return e.type === "Status";
            if (auditCategoryFilter === "Security") return e.type === "Security";
            if (auditCategoryFilter === "Onboarding") return e.type === "Onboarding";
            return e.type.toLowerCase() === auditCategoryFilter.toLowerCase();
          }))
    : [];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] pointer-events-none overscroll-contain animate-in fade-in duration-200"
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {/* Invisible backdrop over uncovered left navbar area so clicking outside closes dossier */}
      <div
        className="fixed inset-y-0 left-0 w-0 md:w-[240px] pointer-events-auto cursor-pointer"
        onClick={onClose}
        title="Click to close dossier"
      />

      {/* Main modal container covering only the right portion area (leaving background navbar view clear) */}
      <div
        className="fixed inset-y-0 right-0 left-0 md:left-[240px] flex items-center justify-center p-2 sm:p-3 md:p-4 bg-slate-950/60 backdrop-blur-xs pointer-events-auto"
        onClick={onClose}
      >
        <div
          className="w-full max-h-[94vh] bg-white rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <ErrorBoundary fallbackTitle="Personnel Dossier Error" onReset={onClose}>
            {/* Pinned Executive Header Banner */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#0B132B] text-white flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-200 text-base font-bold shadow-inner shrink-0 overflow-hidden">
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
                {user && getRoleBadge(user.role, true)}
                {user?.is_hod ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                    👑 HOD
                  </span>
                ) : null}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                    user?.status === "active"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-500/20 text-slate-300 border border-slate-500/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${user?.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`}></span>
                  <span>{user?.status === "active" ? "Active" : "Inactive"}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 mb-0 font-normal truncate flex items-center gap-2 flex-wrap">
                <span>EMP-{String(user?.id || 1).padStart(4, "0")}</span>
                <span className="text-slate-500">|</span>
                <span>{user?.email}</span>
                <span className="text-slate-500">|</span>
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
          <aside className="w-full md:w-64 lg:w-72 shrink-0 bg-slate-50/70 border-b md:border-b-0 md:border-r border-slate-200/80 p-3 space-y-1 flex md:flex-col justify-between overflow-x-auto md:overflow-x-visible">
            <div className="flex md:flex-col gap-1 w-full">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`w-full px-3.5 py-2.5 rounded-r-xl rounded-l-none text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  activeTab === "overview"
                    ? "border-l-[3px] border-indigo-600 bg-indigo-50/70 text-indigo-600 font-semibold shadow-2xs"
                    : "border-l-[3px] border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <i className="bi bi-person text-lg text-indigo-600 shrink-0"></i>
                  <span className="whitespace-nowrap">Profile Overview</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("audit")}
                className={`w-full px-3.5 py-2.5 rounded-r-xl rounded-l-none text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  activeTab === "audit"
                    ? "border-l-[3px] border-indigo-600 bg-indigo-50/70 text-indigo-600 font-semibold shadow-2xs"
                    : "border-l-[3px] border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <i className="bi bi-clock text-lg text-indigo-600 shrink-0"></i>
                  <span className="whitespace-nowrap">Audit Trail & Activity</span>
                </div>
                <span className="ml-auto ml-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 shrink-0">
                  {auditEvents.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`w-full px-3.5 py-2.5 rounded-r-xl rounded-l-none text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  activeTab === "documents"
                    ? "border-l-[3px] border-indigo-600 bg-indigo-50/70 text-indigo-600 font-semibold shadow-2xs"
                    : "border-l-[3px] border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <i className="bi bi-file-earmark-text text-lg text-indigo-600 shrink-0"></i>
                  <span className="whitespace-nowrap">Documents Vault</span>
                </div>
                <span className="ml-auto ml-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 shrink-0">
                  {documents.length}
                </span>
              </button>
            </div>
          </aside>

          {/* Right Main Content Canvas */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-50/30 [scrollbar-width:thin]">
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
                <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
                  {/* Unified Hero & 5-Column Metrics Container (Outer border removed as requested in Image 2) */}
                  <div className="rounded-2xl bg-white shadow-2xs overflow-hidden">
                    {/* Upper Profile Hero Area (Compact padding to remove unnecessary blank space) */}
                    <div className="px-4 sm:px-5 py-3 sm:py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar photo cleanly scaled to match the 3 lines of text beside it */}
                        <div className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full border-2 border-slate-200 overflow-hidden shrink-0 bg-indigo-50 flex items-center justify-center text-indigo-700 text-xl sm:text-2xl font-extrabold shadow-2xs">
                          {user.image_url ? (
                            <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{user.name ? user.name.charAt(0) : "U"}</span>
                          )}
                        </div>

                        {/* Text Container with exactly equal vertical spacing between all 3 lines */}
                        <div className="flex flex-col justify-center gap-1 sm:gap-1.5 min-w-0">
                          {/* Line 1: Name + Role Badge */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-0 truncate">
                              {user.name}
                            </h2>
                            {getRoleBadge(user.role, false)}
                            {user.is_hod ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-800 border border-amber-300 shadow-2xs">
                                👑 HOD
                              </span>
                            ) : null}
                          </div>

                          {/* Line 2: Role | Department */}
                          <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-none truncate m-0">
                            {formatRoleTitle(user.role)} | {user.department_name ? `${user.department_name} Department` : "Accounts Department"}
                          </p>

                          {/* Line 3: Email, Phone, Address */}
                          <div className="flex items-center gap-3.5 text-xs sm:text-[13px] text-slate-600 flex-wrap leading-none">
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <i className="bi bi-envelope text-indigo-600"></i>
                              <span className="truncate max-w-[220px]">{user.email}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <i className="bi bi-telephone text-indigo-600"></i>
                              <span>{user.phone || "Not recorded"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <i className="bi bi-geo-alt text-indigo-600"></i>
                              <span>{getAddressCity(user.address)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action / Status Area */}
                      <div className="flex items-center md:items-end justify-between md:justify-center gap-3 shrink-0 self-stretch md:self-auto border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
                        <div className="flex flex-col items-start md:items-end gap-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                                user.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${user.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                              <span>{user.status === "active" ? "Active" : "Inactive"}</span>
                            </span>
                            {onEditUser && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onEditUser(user);
                                }}
                                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                              >
                                <i className="bi bi-pencil-square"></i>
                                <span>Edit Profile</span>
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            Since {formatDateSafe(user.created_at, { day: "numeric", month: "short", year: "numeric" }, "en-GB")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Thin Divider Line Separating Upper Hero and 5-Column Metrics Section */}
                    <div className="border-t border-slate-200/80"></div>

                    {/* 5-Column Personnel Key Metrics Row with Thin Divider Lines */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 px-4 sm:px-5 py-2.5 sm:py-3 bg-white">
                      <div className="py-1 px-2 sm:px-3">
                        <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                          Employee ID
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base block">
                          EMP-{String(user.id).padStart(4, "0")}
                        </span>
                        <span className="text-[11px] text-slate-400 block">Directory Index</span>
                      </div>

                      <div className="py-1 px-2 sm:px-3">
                        <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                          Employment Type
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base block">
                          Full-time
                        </span>
                        <span className="text-[11px] text-slate-400 block">Permanent</span>
                      </div>

                      <div className="py-1 px-2 sm:px-3">
                        <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                          Annual Salary
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base block">
                          ${formatSalarySafe(user.salary)}
                        </span>
                        <span className="text-[11px] text-slate-400 block">Approved Base Compensation</span>
                      </div>

                      <div className="py-1 px-2 sm:px-3">
                        <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                          Joined On
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base block">
                          {formatDateSafe(user.created_at)}
                        </span>
                        <span className="text-[11px] text-slate-400 block">Tenure Initiation Date</span>
                      </div>

                      <div className="py-1 px-2 sm:px-3 col-span-2 sm:col-span-1">
                        <span className="text-xs font-semibold text-slate-500 block mb-0.5">
                          Work Location
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base block truncate">
                          {getAddressCity(user.address)}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {typeof user.address === "string" && user.address.includes(",") ? user.address : "(Unspecified Suite)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Cards Section (Matching Image 2 and Image 3 Grid) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 items-stretch">
                    {/* CARD 1: Employment Details */}
                    <div className="col-span-12 lg:col-span-4 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-0.5 shrink-0">
                        <div className="flex items-center gap-2 text-sm sm:text-[15px] font-bold text-slate-900">
                          <i className="bi bi-briefcase text-indigo-600 text-lg"></i>
                          <span>Employment Details</span>
                        </div>
                        {onEditUser && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditUser(user);
                            }}
                            className="text-xs sm:text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      <div className="text-xs sm:text-[13px] divide-y divide-slate-100/80 flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                          <span className="text-slate-500 font-medium whitespace-nowrap">Department</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{user.department_name || "Accounts"}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                              {user.department_code || "ACC"}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                          <span className="text-slate-500 font-medium whitespace-nowrap">Role</span>
                          <span className="font-bold text-slate-900 capitalize">
                            {formatRoleTitle(user.role)}
                          </span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                          <span className="text-slate-500 font-medium whitespace-nowrap">Employment Type</span>
                          <span className="font-bold text-slate-900">Full-time</span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-start gap-2.5 py-1.5 sm:py-2">
                          <span className="text-slate-500 font-medium whitespace-nowrap pt-0.5">Annual Salary</span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              ${formatSalarySafe(user.salary)}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-normal">Approved Base Compensation</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                          <span className="text-slate-500 font-medium whitespace-nowrap">Account Status</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{user.status === "active" ? "Active" : "Inactive"}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-start gap-2.5 py-1.5 sm:py-2">
                          <span className="text-slate-500 font-medium whitespace-nowrap pt-0.5">Onboarded Since</span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {formatDateSafe(user.created_at)}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5 font-normal">Tenure Initiation Date</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMN 2: Stack of Contact Info & Office Location */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col justify-between gap-3">
                      {/* CARD 2: Contact Information */}
                      <div className="flex-1 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-0.5 shrink-0">
                          <div className="flex items-center gap-2 text-sm sm:text-[15px] font-bold text-slate-900">
                            <i className="bi bi-telephone text-indigo-600 text-lg"></i>
                            <span>Contact Information</span>
                          </div>
                          {onEditUser && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEditUser(user);
                              }}
                              className="text-xs sm:text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>

                        <div className="text-xs sm:text-[13px] divide-y divide-slate-100/80 flex-1 flex flex-col justify-between">
                          <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                            <span className="text-slate-500 font-medium flex items-center gap-2 whitespace-nowrap">
                              <i className="bi bi-envelope text-indigo-600"></i>
                              <span>Work Email</span>
                            </span>
                            <span className="font-semibold text-slate-900 truncate" title={user.email}>
                              {user.email}
                            </span>
                          </div>

                          <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                            <span className="text-slate-500 font-medium flex items-center gap-2 whitespace-nowrap">
                              <i className="bi bi-telephone text-indigo-600"></i>
                              <span>Contact Phone</span>
                            </span>
                            <span className={`font-semibold truncate ${user.phone ? "text-slate-900" : "text-slate-400 italic"}`}>
                              {user.phone || "Not recorded"}
                            </span>
                          </div>

                          <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                            <span className="text-slate-500 font-medium flex items-center gap-2 whitespace-nowrap">
                              <i className="bi bi-phone text-indigo-600"></i>
                              <span>Mobile / Direct</span>
                            </span>
                            <span className={`font-semibold truncate ${user.phone ? "text-slate-900" : "text-slate-400 italic"}`}>
                              {user.phone || "Not recorded"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CARD 3: Office / Work Location */}
                      <div className="flex-1 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-0.5 shrink-0">
                          <div className="flex items-center gap-2 text-sm sm:text-[15px] font-bold text-slate-900">
                            <i className="bi bi-geo-alt text-indigo-600 text-lg"></i>
                            <span>Office / Work Location</span>
                          </div>
                          {onEditUser && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onEditUser(user);
                              }}
                              className="text-xs sm:text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>

                        <div className="text-xs sm:text-[13px] divide-y divide-slate-100/80 flex-1 flex flex-col justify-between">
                          <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                            <span className="text-slate-500 font-medium whitespace-nowrap">Location</span>
                            <span className="font-semibold text-slate-900 truncate">
                              {getAddressCity(user.address)}
                            </span>
                          </div>

                          <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                            <span className="text-slate-500 font-medium whitespace-nowrap">Address</span>
                            <span className={`font-semibold truncate ${typeof user.address === "string" && user.address.trim() ? "text-slate-900" : "text-slate-400 italic"}`}>
                              {getAddressFull(user.address)}
                            </span>
                          </div>

                          <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[115px_1fr] items-center gap-2.5 py-1.5 sm:py-2">
                            <span className="text-slate-500 font-medium whitespace-nowrap">Suite / Floor</span>
                            <span className="font-semibold text-slate-400 italic">Not specified</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CARD 4: Institutional Reporting Chain (Visual Node Tree Graph) */}
                    <div className="col-span-12 lg:col-span-4 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-0.5 shrink-0">
                        <div className="flex items-center gap-2 text-sm sm:text-[15px] font-bold text-slate-900">
                          <i className="bi bi-diagram-3 text-indigo-600 text-lg"></i>
                          <span>Institutional Reporting Chain</span>
                        </div>
                        {onEditUser && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onEditUser(user);
                            }}
                            className="text-xs sm:text-[13px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      {/* Interactive Node Graph */}
                      <div className="py-2.5 sm:py-3.5 flex-1 flex flex-col items-center justify-center">
                        {/* Node 1: Top Department Head / Supervisor */}
                        <div className="w-full p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/90 flex items-center gap-2.5 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                            <i className="bi bi-people-fill text-sm"></i>
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-500 block leading-none mb-1">
                              Department Head (HOD)
                            </span>
                            <span className="font-bold text-slate-900 text-xs sm:text-[13px] block truncate">
                              {user.head_of_department_name || user.supervisor_name || "— Unassigned / Vacant —"}
                            </span>
                          </div>
                        </div>

                        {/* Connecting Dotted Line */}
                        <div className="w-0.5 h-4 sm:h-5 border-l-2 border-dashed border-slate-300 my-1"></div>

                        {/* Node 2: Current Member (Target User) */}
                        <div className="w-full p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center gap-2.5 shadow-2xs">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                            {user.image_url ? (
                              <img src={user.image_url} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span>{user.name ? user.name.charAt(0) : "U"}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-slate-900 text-xs sm:text-[13px] block truncate">
                              {user.name}
                            </span>
                            <span className="text-xs text-indigo-700 font-semibold block truncate">
                              {formatRoleTitle(user.role)} {isOwnProfile ? "(You)" : ""} • {user.department_name || "Accounts"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 text-center italic mb-0 pt-2 border-t border-slate-100 shrink-0">
                        {user.supervisor_name
                          ? `Direct supervisory routing to ${user.supervisor_name}`
                          : "Direct to Department Head / Apex Authority"}
                      </p>
                    </div>
                  </div>

                  {/* Direct Reports Squad (Only if Supervisor or Manager) */}
                  {(user.role === "supervisor" || user.role === "manager") && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 mb-0">
                          <i className="bi bi-people-fill text-indigo-600 text-base"></i>
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
                                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
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
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2 mb-0">
                        <i className="bi bi-clock-history text-indigo-600 text-base"></i>
                        <span>Department Mobility History</span>
                      </h4>

                      <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
                        {user.transfers.map((t: any) => (
                          <div key={t.id} className="p-3 text-xs sm:text-[13px] flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs sm:text-[13px]">
                                <span>{t.source_dept_name || "Unassigned"}</span>
                                <i className="bi bi-arrow-right text-slate-400 text-[10px]"></i>
                                <span className="text-indigo-700">{t.target_dept_name}</span>
                              </div>
                              {t.reason && <p className="text-xs text-slate-400 italic mb-0">"{t.reason}"</p>}
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                              {formatDateSafe(t.transferred_at)}
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <i className="bi bi-clock-history text-indigo-600 text-xl sm:text-2xl shrink-0"></i>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">
                          Personnel Audit Trail & Change Ledger
                        </h4>
                        <p className="text-xs text-slate-500 mb-0">
                          Chronological record of lifecycle events, governance roles, compensation changes, and mobility.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <select
                          value={auditCategoryFilter}
                          onChange={(e) => setAuditCategoryFilter(e.target.value)}
                          className="text-xs sm:text-[13px] font-semibold bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 pr-7 appearance-none focus:outline-none focus:border-indigo-500 shadow-2xs cursor-pointer hover:border-slate-300 transition-colors"
                        >
                          <option value="all">All Events ({auditEvents.length})</option>
                          <option value="Compensation">Compensation</option>
                          <option value="Transfer">Mobility / Transfer</option>
                          <option value="Contact">Contact & Location</option>
                          <option value="Role">Role & Authority</option>
                          <option value="Status">Account Status</option>
                          <option value="Security">Security & Access</option>
                          <option value="Onboarding">Onboarding</option>
                        </select>
                        <i className="bi bi-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[9px]"></i>
                      </div>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                        {displayedAuditEvents.length} Records
                      </span>
                    </div>
                  </div>

                  {displayedAuditEvents.length > 0 ? (
                    <div className="relative pl-7 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {displayedAuditEvents.map((event) => (
                        <div key={event.id} className="relative group">
                          {/* Timeline Node Icon */}
                          <div className="absolute -left-7 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-indigo-600 text-[10px] shadow-2xs group-hover:scale-110 transition-transform">
                            <i className={`bi ${event.icon}`}></i>
                          </div>

                          {/* Event Card */}
                          <div className="bg-slate-50/70 hover:bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${event.badgeColor}`}>
                                  {event.type}
                                </span>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 mb-0">
                                  {event.title}
                                </h5>
                              </div>
                              <span className="text-xs font-medium text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-2xs">
                                {formatDateTimeSafe(event.timestamp, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>

                            <p className="text-xs sm:text-[13px] text-slate-600 mb-2.5 leading-relaxed">
                              {event.description}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <i className="bi bi-person-check text-slate-400"></i>
                                <span>Logged by: <strong className="text-slate-700 font-semibold">{event.author}</strong></span>
                              </div>
                              <span className="text-xs text-slate-400 font-mono">
                                {event.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-base mb-2">
                        <i className="bi bi-funnel"></i>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mb-0.5">No records match "{auditCategoryFilter}"</p>
                      <p className="text-[11px] text-slate-400 mb-3">Try selecting a different filter category or reset to view all events.</p>
                      <button
                        type="button"
                        onClick={() => setAuditCategoryFilter("all")}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: DOCUMENTS VAULT (Item 42) */}
              {activeTab === "documents" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <i className="bi bi-folder2-open text-indigo-600 text-xl sm:text-2xl shrink-0"></i>
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-0">
                          Employee Credentials & Document Vault
                        </h4>
                        <p className="text-xs text-slate-500 mb-0">
                          {isOwnProfile
                            ? "Manage your personal verification files, identity credentials, and tax records."
                            : "Audit employee credentials to verify statutory files and compliance records."}
                        </p>
                      </div>
                    </div>
                    {isOwnProfile ? (
                      <button
                        type="button"
                        onClick={() => setIsUploadingDoc(!isUploadingDoc)}
                        className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/30"
                      >
                        <i className={`bi ${isUploadingDoc ? "bi-x" : "bi-plus-lg"}`}></i>
                        <span>{isUploadingDoc ? "Cancel" : "+ Attach Document"}</span>
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
                      <div className="text-xs leading-relaxed">
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

                  {/* Enterprise Document Vault Table Layout */}
                  {documents.length > 0 ? (
                    <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-[13px]">
                          <thead className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600">
                            <tr>
                              <th className="py-3.5 px-4">Document Name</th>
                              <th className="py-3.5 px-4">Type</th>
                              <th className="py-3.5 px-4">Size</th>
                              <th className="py-3.5 px-4">Uploaded On</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {documents.map((doc) => (
                              <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 text-base shrink-0 shadow-2xs">
                                      <i className="bi bi-file-earmark-pdf-fill"></i>
                                    </div>
                                    <div className="min-w-0 max-w-xs sm:max-w-md">
                                      <span className="font-bold text-slate-900 block truncate text-xs sm:text-sm">
                                        {doc.name}
                                      </span>
                                      <span className="text-xs text-slate-400 block truncate">
                                        {doc.description || "Statutory compliance record"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    {doc.category}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium text-xs sm:text-[13px]">
                                  {doc.fileSize}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-xs sm:text-[13px]">
                                  {doc.uploadDate}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span>Verified</span>
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="inline-flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => alert(`Previewing statutory record: "${doc.name}"`)}
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                      title="Preview Document"
                                    >
                                      <i className="bi bi-eye text-xs"></i>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => alert(`Downloading verified record: "${doc.name}"`)}
                                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                                      title="Download Document"
                                    >
                                      <i className="bi bi-download text-xs"></i>
                                    </button>
                                    {isOwnProfile && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDocument(doc.id)}
                                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                                        title="Delete Document"
                                      >
                                        <i className="bi bi-trash text-xs"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-base mb-2">
                        <i className="bi bi-file-earmark-x"></i>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mb-0.5">No Documents Recorded</p>
                      <p className="text-[11px] text-slate-400 mb-0">No statutory files or credentials have been uploaded yet.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>

        {/* Modal Footer Controls */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <i className="bi bi-x text-sm"></i>
              <span>Close Dossier</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
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
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer"
            >
              <i className="bi bi-pencil-square"></i>
              <span>Edit Member Profile</span>
            </button>
          )}
        </div>
      </ErrorBoundary>
    </div>
  </div>
</div>,
document.body
);
};
