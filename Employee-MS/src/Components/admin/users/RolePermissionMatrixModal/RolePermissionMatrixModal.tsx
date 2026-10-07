import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import "./RolePermissionMatrixModal.css";

export type RoleType = "admin" | "manager" | "supervisor" | "employee";

export type ActionType = "view" | "create" | "edit" | "delete" | "export";

export type ModuleCategory = "CORE" | "OPERATIONS" | "HR" | "FINANCE" | "SECURITY" | "INTEGRATIONS";

export interface ModuleDefinition {
  id: string;
  name: string;
  category: ModuleCategory;
  categoryLabel: string;
  description: string;
  icon: string;
}

export type RolePermissionsMap = Record<RoleType, Record<string, Record<ActionType, boolean>>>;

export interface RolePermissionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  // Core System Modules
  {
    id: "users",
    name: "User Directory & Profiles",
    category: "CORE",
    categoryLabel: "Core System",
    description: "Manage employee profiles, credentials, onboarding, and offboarding",
    icon: "bi-people-fill"
  },
  {
    id: "departments",
    name: "Department Management",
    category: "CORE",
    categoryLabel: "Core System",
    description: "Manage business departments, budgets, and head-of-department assignments",
    icon: "bi-building"
  },
  {
    id: "hierarchy",
    name: "Organizational Hierarchy",
    category: "CORE",
    categoryLabel: "Core System",
    description: "Configure supervisor reporting lines, team trees, and mobility",
    icon: "bi-diagram-3-fill"
  },

  // Operational Modules
  {
    id: "tasks",
    name: "Task Assignment & Sprints",
    category: "OPERATIONS",
    categoryLabel: "Operations",
    description: "Create, assign, track, and complete departmental tasks and projects",
    icon: "bi-list-check"
  },
  {
    id: "projects",
    name: "Project Milestones & Deliverables",
    category: "OPERATIONS",
    categoryLabel: "Operations",
    description: "Track sprint deliverables, project milestones, and resource allocation",
    icon: "bi-kanban-fill"
  },

  // HR & Organization
  {
    id: "leaves",
    name: "Leave Requests & Approvals",
    category: "HR",
    categoryLabel: "HR & Organization",
    description: "Review, approve, reject, and adjust employee time-off and sick leaves",
    icon: "bi-calendar-event"
  },
  {
    id: "onboarding",
    name: "Employee Lifecycle & Mobility",
    category: "HR",
    categoryLabel: "HR & Organization",
    description: "Coordinate new hire onboarding workflows, badge provisioning, and transfers",
    icon: "bi-person-badge"
  },

  // Finance & Reporting
  {
    id: "payroll",
    name: "Payroll & Compensation",
    category: "FINANCE",
    categoryLabel: "Finance & Reporting",
    description: "Access salary records, compensation history, and disbursement statements",
    icon: "bi-currency-dollar"
  },
  {
    id: "analytics",
    name: "Workforce Intelligence & Audit",
    category: "FINANCE",
    categoryLabel: "Finance & Reporting",
    description: "Inspect enterprise KPIs, turnover stats, and performance metrics",
    icon: "bi-graph-up-arrow"
  },

  // Security & Compliance
  {
    id: "audit",
    name: "Audit Logs & Activity Tracking",
    category: "SECURITY",
    categoryLabel: "Security & Compliance",
    description: "View system activity, login logs, and permission policy modification history",
    icon: "bi-file-earmark-text"
  },
  {
    id: "security",
    name: "Security Policies & Session Guard",
    category: "SECURITY",
    categoryLabel: "Security & Compliance",
    description: "Configure multi-factor authentication, IP whitelists, and session timeouts",
    icon: "bi-shield-check"
  },

  // Integrations & Extensibility
  {
    id: "integrations",
    name: "Enterprise API & Webhooks",
    category: "INTEGRATIONS",
    categoryLabel: "Integrations",
    description: "Manage REST webhooks, third-party connectors, and automated notification endpoints",
    icon: "bi-link-45deg"
  }
];

export const DEFAULT_PERMISSIONS: RolePermissionsMap = {
  admin: {
    users: { view: true, create: true, edit: true, delete: true, export: true },
    departments: { view: true, create: true, edit: true, delete: true, export: true },
    hierarchy: { view: true, create: true, edit: true, delete: true, export: true },
    tasks: { view: true, create: true, edit: true, delete: true, export: true },
    projects: { view: true, create: true, edit: true, delete: true, export: true },
    leaves: { view: true, create: true, edit: true, delete: true, export: true },
    onboarding: { view: true, create: true, edit: true, delete: true, export: true },
    payroll: { view: true, create: true, edit: true, delete: true, export: true },
    analytics: { view: true, create: true, edit: true, delete: true, export: true },
    audit: { view: true, create: true, edit: true, delete: true, export: true },
    security: { view: true, create: true, edit: true, delete: true, export: true },
    integrations: { view: true, create: true, edit: true, delete: true, export: true }
  },
  manager: {
    users: { view: true, create: true, edit: true, delete: false, export: true },
    departments: { view: true, create: false, edit: true, delete: false, export: true },
    hierarchy: { view: true, create: false, edit: true, delete: false, export: true },
    tasks: { view: true, create: true, edit: true, delete: true, export: true },
    projects: { view: true, create: true, edit: true, delete: true, export: true },
    leaves: { view: true, create: true, edit: true, delete: false, export: true },
    onboarding: { view: true, create: true, edit: true, delete: false, export: true },
    payroll: { view: true, create: false, edit: false, delete: false, export: false },
    analytics: { view: true, create: false, edit: false, delete: false, export: true },
    audit: { view: true, create: false, edit: false, delete: false, export: true },
    security: { view: false, create: false, edit: false, delete: false, export: false },
    integrations: { view: false, create: false, edit: false, delete: false, export: false }
  },
  supervisor: {
    users: { view: true, create: false, edit: false, delete: false, export: false },
    departments: { view: true, create: false, edit: false, delete: false, export: false },
    hierarchy: { view: true, create: false, edit: false, delete: false, export: false },
    tasks: { view: true, create: true, edit: true, delete: false, export: true },
    projects: { view: true, create: true, edit: true, delete: false, export: true },
    leaves: { view: true, create: true, edit: true, delete: false, export: false },
    onboarding: { view: true, create: false, edit: false, delete: false, export: false },
    payroll: { view: false, create: false, edit: false, delete: false, export: false },
    analytics: { view: true, create: false, edit: false, delete: false, export: false },
    audit: { view: false, create: false, edit: false, delete: false, export: false },
    security: { view: false, create: false, edit: false, delete: false, export: false },
    integrations: { view: false, create: false, edit: false, delete: false, export: false }
  },
  employee: {
    users: { view: true, create: false, edit: false, delete: false, export: false },
    departments: { view: true, create: false, edit: false, delete: false, export: false },
    hierarchy: { view: true, create: false, edit: false, delete: false, export: false },
    tasks: { view: true, create: false, edit: true, delete: false, export: false },
    projects: { view: true, create: false, edit: false, delete: false, export: false },
    leaves: { view: true, create: true, edit: false, delete: false, export: false },
    onboarding: { view: true, create: false, edit: false, delete: false, export: false },
    payroll: { view: false, create: false, edit: false, delete: false, export: false },
    analytics: { view: false, create: false, edit: false, delete: false, export: false },
    audit: { view: false, create: false, edit: false, delete: false, export: false },
    security: { view: false, create: false, edit: false, delete: false, export: false },
    integrations: { view: false, create: false, edit: false, delete: false, export: false }
  }
};

export const ROLE_METADATA: Record<
  RoleType,
  {
    label: string;
    badge: string;
    desc: string;
    icon: string;
    accentColor: string;
    iconBg: string;
    iconColor: string;
    tierBadgeColor: string;
    activeBorder: string;
    activeBg: string;
    activeText: string;
    activeBadge: string;
    activeCheckmark: string;
    activeInnerShadow: string;
  }
> = {
  admin: {
    label: "Admin",
    badge: "FULL PRIVILEGE",
    desc: "Unrestricted operational authority, role management, and organizational governance.",
    icon: "bi-shield-shaded",
    accentColor: "from-purple-500 to-indigo-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    tierBadgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    activeBorder: "border-purple-500",
    activeBg: "bg-purple-50",
    activeText: "text-purple-950",
    activeBadge: "text-purple-700",
    activeCheckmark: "text-purple-600",
    activeInnerShadow: "shadow-[inset_0_2px_8px_rgba(126,34,206,0.45),inset_0_-2px_8px_rgba(126,34,206,0.25),inset_0_0_14px_rgba(147,51,234,0.35)]"
  },
  manager: {
    label: "Manager",
    badge: "DEPARTMENT LEAD",
    desc: "Oversees business units, approves requisitions, and manages team deliverables.",
    icon: "bi-briefcase-fill",
    accentColor: "from-indigo-500 to-blue-600",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    tierBadgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    activeBorder: "border-indigo-500",
    activeBg: "bg-indigo-50",
    activeText: "text-indigo-950",
    activeBadge: "text-indigo-700",
    activeCheckmark: "text-indigo-600",
    activeInnerShadow: "shadow-[inset_0_2px_8px_rgba(67,56,202,0.45),inset_0_-2px_8px_rgba(67,56,202,0.25),inset_0_0_14px_rgba(99,102,241,0.35)]"
  },
  supervisor: {
    label: "Supervisor",
    badge: "TEAM LEAD",
    desc: "Day-to-day workflow orchestration, task reviews, and direct reporting lines.",
    icon: "bi-people-fill",
    accentColor: "from-blue-500 to-indigo-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    tierBadgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50",
    activeText: "text-blue-950",
    activeBadge: "text-blue-700",
    activeCheckmark: "text-blue-600",
    activeInnerShadow: "shadow-[inset_0_2px_8px_rgba(29,78,216,0.45),inset_0_-2px_8px_rgba(29,78,216,0.25),inset_0_0_14px_rgba(59,130,246,0.35)]"
  },
  employee: {
    label: "Employee",
    badge: "STANDARD ACCESS",
    desc: "Core individual contributor access for assigned work, attendance, and self-service.",
    icon: "bi-person-badge-fill",
    accentColor: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    tierBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    activeBorder: "border-emerald-500",
    activeBg: "bg-emerald-50",
    activeText: "text-emerald-950",
    activeBadge: "text-emerald-700",
    activeCheckmark: "text-emerald-600",
    activeInnerShadow: "shadow-[inset_0_2px_8px_rgba(4,120,87,0.45),inset_0_-2px_8px_rgba(4,120,87,0.25),inset_0_0_14px_rgba(16,185,129,0.35)]"
  }
};

export const ACTION_LABELS: Record<ActionType, { label: string; icon: string; tag: string }> = {
  view: { label: "View", icon: "bi-eye", tag: "Read" },
  create: { label: "Create", icon: "bi-plus-circle", tag: "Add" },
  edit: { label: "Edit", icon: "bi-pencil-square", tag: "Update" },
  delete: { label: "Delete", icon: "bi-trash3", tag: "Remove" },
  export: { label: "Export", icon: "bi-download", tag: "CSV/PDF" }
};

export const RolePermissionMatrixModal: React.FC<RolePermissionMatrixModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleType>("admin");
  const [permissions, setPermissions] = useState<RolePermissionsMap>(DEFAULT_PERMISSIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Accordion toggle states per category
  const [collapsedSections, setCollapsedSections] = useState<Record<ModuleCategory, boolean>>({
    CORE: false,
    OPERATIONS: false,
    HR: false,
    FINANCE: false,
    SECURITY: false,
    INTEGRATIONS: false
  });

  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem("ems_role_permissions");
      if (stored) {
        setPermissions(JSON.parse(stored));
      } else {
        setPermissions(DEFAULT_PERMISSIONS);
      }
    } catch {
      setPermissions(DEFAULT_PERMISSIONS);
    }
    setHasChanges(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  const toggleSection = (cat: ModuleCategory) => {
    setCollapsedSections((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleToggle = (role: RoleType, moduleId: string, action: ActionType) => {
    setPermissions((prev) => {
      const rolePerms = { ...prev[role] };
      const modPerms = {
        ...(rolePerms[moduleId] || {
          view: false,
          create: false,
          edit: false,
          delete: false,
          export: false
        })
      };
      modPerms[action] = !modPerms[action];
      rolePerms[moduleId] = modPerms;
      return { ...prev, [role]: rolePerms };
    });
    setHasChanges(true);
  };

  const handleToggleRow = (role: RoleType, moduleId: string) => {
    setPermissions((prev) => {
      const rolePerms = { ...prev[role] };
      const current = rolePerms[moduleId] || {
        view: false,
        create: false,
        edit: false,
        delete: false,
        export: false
      };
      const allActive =
        current.view && current.create && current.edit && current.delete && current.export;
      const targetState = !allActive;

      rolePerms[moduleId] = {
        view: role === "admin" ? true : targetState,
        create: targetState,
        edit: targetState,
        delete: targetState,
        export: targetState
      };
      return { ...prev, [role]: rolePerms };
    });
    setHasChanges(true);
    showToast(`Row permissions updated for ${MODULE_DEFINITIONS.find((m) => m.id === moduleId)?.name || moduleId}`);
  };

  const handleGrantAll = () => {
    setPermissions((prev) => {
      const updatedRole: Record<string, Record<ActionType, boolean>> = {};
      MODULE_DEFINITIONS.forEach((mod) => {
        updatedRole[mod.id] = {
          view: true,
          create: true,
          edit: true,
          delete: true,
          export: true
        };
      });
      return { ...prev, [selectedRole]: updatedRole };
    });
    setHasChanges(true);
    showToast(`All permissions granted for ${ROLE_METADATA[selectedRole].label}`);
  };

  const handleRevokeAll = () => {
    setPermissions((prev) => {
      const updatedRole: Record<string, Record<ActionType, boolean>> = {};
      MODULE_DEFINITIONS.forEach((mod) => {
        updatedRole[mod.id] = {
          view: selectedRole === "admin" ? true : false,
          create: false,
          edit: false,
          delete: false,
          export: false
        };
      });
      return { ...prev, [selectedRole]: updatedRole };
    });
    setHasChanges(true);
    showToast(`Write permissions revoked for ${ROLE_METADATA[selectedRole].label}`);
  };

  const handleResetDefaults = () => {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: DEFAULT_PERMISSIONS[selectedRole]
    }));
    setHasChanges(true);
    showToast(`Reset ${ROLE_METADATA[selectedRole].label} permissions to system defaults`);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await new Promise((res) => setTimeout(res, 350));
      localStorage.setItem("ems_role_permissions", JSON.stringify(permissions));
      setHasChanges(false);
      onSaved?.(`Role permission policy updated and enforced successfully across all workforce tiers.`);
      onClose();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  // Filter modules based on search query and category
  const filteredModules = useMemo(() => {
    return MODULE_DEFINITIONS.filter((mod) => {
      const matchesSearch =
        mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = categoryFilter === "ALL" || mod.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, categoryFilter]);

  // Group filtered modules by category
  const groupedModules = useMemo(() => {
    const groups: Partial<Record<ModuleCategory, ModuleDefinition[]>> = {};
    filteredModules.forEach((mod) => {
      if (!groups[mod.category]) {
        groups[mod.category] = [];
      }
      groups[mod.category]!.push(mod);
    });
    return groups;
  }, [filteredModules]);

  // Calculate permissions statistics for current role
  const roleStats = useMemo(() => {
    const roleMap = permissions[selectedRole] || {};
    let grantedCount = 0;
    MODULE_DEFINITIONS.forEach((mod) => {
      const act = roleMap[mod.id];
      if (act) {
        if (act.view) grantedCount++;
        if (act.create) grantedCount++;
        if (act.edit) grantedCount++;
        if (act.delete) grantedCount++;
        if (act.export) grantedCount++;
      }
    });
    const totalPossible = MODULE_DEFINITIONS.length * 5;
    return {
      grantedCount,
      totalPossible,
      modulesCount: MODULE_DEFINITIONS.length,
      categoriesCount: 6
    };
  }, [permissions, selectedRole]);

  if (!isOpen) return null;

  const currentRoleMeta = ROLE_METADATA[selectedRole];
  const rolePermMap = permissions[selectedRole] || {};

  const categoriesList: Array<{ key: ModuleCategory | "ALL"; label: string; icon: string }> = [
    { key: "ALL", label: "All Modules", icon: "bi-grid-fill" },
    { key: "CORE", label: "Core System", icon: "bi-folder-fill" },
    { key: "OPERATIONS", label: "Operations", icon: "bi-gear-fill" },
    { key: "HR", label: "HR & Organization", icon: "bi-people" },
    { key: "FINANCE", label: "Finance & Reporting", icon: "bi-bar-chart-fill" },
    { key: "SECURITY", label: "Security & Compliance", icon: "bi-shield-shaded" },
    { key: "INTEGRATIONS", label: "Integrations & API", icon: "bi-link-45deg" }
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overscroll-contain overflow-y-auto bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* ==================== MAIN GLASS DASHBOARD CONTAINER ==================== */}
      <div
        className="relative z-10 w-full max-w-[1140px] max-h-[92vh] glass-modal rounded-3xl border border-white/20 overflow-hidden flex flex-col my-auto transition-all shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================== CARD BACKGROUND ARTWORK & WAVE STREAKS ==================== */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          {/* Top Glowing Shield Halo Center Light */}
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-500/30 via-purple-600/20 to-transparent rounded-full blur-[100px] animate-wave-glow"></div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-cyan-400/20 rounded-full blur-[70px]"></div>

          {/* Vector Electric Light Wave Curved Streaks */}
          <svg
            className="absolute inset-0 w-full h-full opacity-80"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 1440 900"
          >
            <defs>
              <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id="waveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.7" />
                <stop offset="60%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
              </linearGradient>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="12" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-heavy" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="25" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <path
              d="M-100 250 C 300 50, 700 450, 1540 100 L 1540 -100 L -100 -100 Z"
              fill="url(#waveGrad1)"
              opacity="0.15"
              filter="url(#glow-heavy)"
            />
            <path
              d="M-50 180 C 350 -20, 800 320, 1500 40"
              fill="none"
              stroke="url(#waveGrad1)"
              strokeWidth="4"
              filter="url(#glow)"
            />
            <path
              d="M-50 210 C 380 20, 830 350, 1500 70"
              fill="none"
              stroke="url(#waveGrad2)"
              strokeWidth="2.5"
              opacity="0.85"
              filter="url(#glow)"
            />
            <path
              d="M-50 140 C 320 -50, 770 290, 1500 10"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <path
              d="M-100 700 C 400 950, 900 550, 1540 820"
              fill="none"
              stroke="url(#waveGrad2)"
              strokeWidth="5"
              filter="url(#glow)"
            />
            <path
              d="M-100 740 C 430 990, 930 590, 1540 860"
              fill="none"
              stroke="url(#waveGrad1)"
              strokeWidth="3"
              opacity="0.7"
              filter="url(#glow)"
            />
          </svg>

          {/* Ambient Orb Glows */}
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-600/25 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
        </div>

        {/* TOP DARK HEADER WITH COSMIC SHIELD ICON & LIGHT RAYS */}
        <header className="glass-header text-white p-3.5 sm:p-4 px-5 sm:px-6 flex justify-between items-center relative overflow-hidden border-b border-indigo-500/20 shrink-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-500/20 to-transparent opacity-70 pointer-events-none"></div>
          <div className="absolute -top-20 right-1/4 w-96 h-48 bg-cyan-400/15 blur-2xl skew-x-12 pointer-events-none"></div>

          <div className="flex items-center gap-3 sm:gap-3.5 relative z-10 min-w-0">
            {/* Glowing Multi-Ring Shield Badge */}
            <div className="relative flex items-center justify-center shrink-0">
              <div className="absolute inset-0 bg-indigo-500/50 rounded-2xl blur-md"></div>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/40">
                <div className="w-full h-full bg-[#080b1d] rounded-[14px] flex items-center justify-center p-2">
                  <i className="bi bi-shield-lock-fill text-xl sm:text-2xl text-indigo-300"></i>
                </div>
              </div>
            </div>

            <div className="min-w-0">
              {/* REQUIREMENT 1: Main heading strictly on ONE line with balanced font size */}
              <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap">
                <h1 className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 sm:gap-2 whitespace-nowrap mb-0">
                  <span>Granular</span>
                  <span className="bg-gradient-to-r from-purple-300 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                    Role-Permission
                  </span>
                  <span>Policy Matrix</span>
                </h1>
                <span className="bg-emerald-950/90 text-emerald-300 text-[9px] sm:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/60 tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.4)] shrink-0 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE GUARD
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300/80 mt-0.5 font-normal tracking-wide truncate mb-0">
                Define access control rights, operational boundaries, and CRUD authorizations per workforce tier.
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shrink-0 ml-3"
            title="Close matrix"
          >
            <i className="bi bi-x-lg text-xs"></i>
          </button>
        </header>

        {/* INNER CONTENT BODY (Compact with no wasted space) */}
        <div className="relative z-10 p-3.5 sm:p-4 md:p-4.5 space-y-3 overflow-y-auto flex-1 matrix-scrollbar">
          {/* ROLE SELECTION TABS ROW (4 Workforce Tiers) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {(Object.keys(ROLE_METADATA) as RoleType[]).map((roleKey) => {
              const meta = ROLE_METADATA[roleKey];
              const isSelected = selectedRole === roleKey;
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setSelectedRole(roleKey)}
                  className={`flex items-center gap-2.5 p-2 px-3 rounded-2xl transition-all duration-200 border text-left cursor-pointer ${
                    isSelected
                      ? `${meta.activeBg} ${meta.activeBorder} ${meta.activeInnerShadow}`
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      isSelected
                        ? `bg-gradient-to-br ${meta.accentColor} text-white shadow-md`
                        : `${meta.iconBg} ${meta.iconColor}`
                    }`}
                  >
                    <i className={`bi ${meta.icon} text-base`}></i>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-bold text-xs sm:text-[13px] truncate ${
                          isSelected ? meta.activeText : "text-slate-700"
                        }`}
                      >
                        {meta.label}
                      </span>
                      {isSelected && (
                        <i className={`bi bi-check2 text-xs font-bold ${meta.activeCheckmark}`}></i>
                      )}
                    </div>
                    <p
                      className={`text-[8.5px] font-extrabold tracking-wider uppercase mt-0.5 truncate mb-0 ${
                        isSelected ? meta.activeBadge : "text-slate-400"
                      }`}
                    >
                      {meta.badge}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ACTION BUTTONS & SEARCH / FILTER TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleGrantAll}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <i className="bi bi-check-lg text-xs"></i> Grant All
              </button>

              <button
                type="button"
                onClick={handleRevokeAll}
                className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <i className="bi bi-slash-circle text-xs"></i> Revoke All
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <i className="bi bi-arrow-counterclockwise text-xs"></i> Reset Defaults
              </button>
            </div>

            {/* Search Bar & Category Dropdown Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search modules, scopes..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-400 shadow-xs"
                />
              </div>

              <div className="relative shrink-0">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none text-xs font-semibold py-1.5 pl-7 pr-7 bg-white border border-slate-200 rounded-xl outline-none text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                >
                  <option value="ALL">All Categories</option>
                  <option value="CORE">Core System</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="HR">HR & Organization</option>
                  <option value="FINANCE">Finance & Reporting</option>
                  <option value="SECURITY">Security & Compliance</option>
                  <option value="INTEGRATIONS">Integrations & API</option>
                </select>
                <i className="bi bi-funnel absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500 text-xs pointer-events-none"></i>
                <i className="bi bi-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
              </div>
            </div>
          </div>

          {/* ACTIVE ROLE SUMMARY & METRICS STAT CARDS */}
          <div className="p-3 px-3.5 bg-gradient-to-r from-[#eff6ff] via-[#eef2ff] to-[#faf5ff] border border-indigo-100 rounded-2xl flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shadow-sm relative overflow-hidden">
            {/* Left Role Details */}
            <div className="flex items-center gap-3 relative z-10 min-w-0">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${currentRoleMeta.accentColor} p-0.5 shadow-md shrink-0`}>
                <div className={`w-full h-full ${currentRoleMeta.iconBg} rounded-full flex items-center justify-center`}>
                  <i className={`bi ${currentRoleMeta.icon} ${currentRoleMeta.iconColor} text-base`}></i>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800 mb-0 truncate">
                    {currentRoleMeta.label}
                  </h3>
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${currentRoleMeta.tierBadgeColor}`}>
                    {currentRoleMeta.badge}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] shrink-0"></span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 max-w-xl leading-snug truncate mb-0">
                  {currentRoleMeta.desc}
                </p>
              </div>
            </div>

            {/* Right Metrics Stat Cards & Wireframe Globe */}
            <div className="flex items-center gap-2 relative z-10 w-full md:w-auto justify-end">
              {/* Stat 1: Modules */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 px-3 flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 text-xs">
                  <i className="bi bi-box"></i>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-800 leading-tight">
                    {filteredModules.length}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Modules</div>
                </div>
              </div>

              {/* Stat 2: Granted Permissions */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 px-3 flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 text-xs">
                  <i className="bi bi-key"></i>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-800 leading-tight">
                    {roleStats.grantedCount} / {roleStats.totalPossible}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Permissions</div>
                </div>
              </div>

              {/* Stat 3: Categories */}
              <div className="bg-white border border-slate-200 rounded-xl p-2 px-3 flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 text-xs">
                  <i className="bi bi-folder"></i>
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-800 leading-tight">
                    {roleStats.categoriesCount}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Categories</div>
                </div>
              </div>

              {/* Wireframe Globe Graphic Overlay */}
              <div className="hidden xl:block w-12 h-12 relative opacity-85 pointer-events-none ml-1">
                <svg viewBox="0 0 100 100" className="w-full h-full text-blue-500 animate-[spin_25s_linear_infinite]">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                  <ellipse cx="50" cy="50" rx="45" ry="18" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <ellipse cx="50" cy="50" rx="18" ry="45" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>
            </div>
          </div>

          {/* MAIN SPLIT VIEW (Sidebar Categories + Accordion Matrix Table) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            {/* Left Sidebar Navigation (Fully wired and working!) */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-2 space-y-1 shadow-sm">
              {categoriesList.map((catItem) => {
                const isActive = categoryFilter === catItem.key;
                const count =
                  catItem.key === "ALL"
                    ? MODULE_DEFINITIONS.length
                    : MODULE_DEFINITIONS.filter((m) => m.category === catItem.key).length;

                return (
                  <button
                    key={catItem.key}
                    type="button"
                    onClick={() => setCategoryFilter(catItem.key)}
                    className={`w-full flex items-center justify-between p-2 px-2.5 rounded-xl transition-all text-xs font-bold text-left cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <i className={`bi ${catItem.icon} ${isActive ? "text-white" : "text-slate-400"} text-xs`}></i>
                      <span className="truncate">{catItem.label}</span>
                    </div>
                    <span
                      className={`text-[9.5px] px-2 py-0.5 rounded-full font-extrabold shrink-0 ml-1.5 ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Main Permissions Accordion Table */}
            <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto matrix-scrollbar">
                <table className="w-full text-left border-collapse min-w-[680px] bg-white">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-[#0b0e22] text-white text-[10.5px] select-none border-b border-slate-800">
                      <th className="p-3 pl-4 font-extrabold tracking-wider w-5/12">System Module & Scope</th>

                      <th className="p-2.5 text-center w-20">
                        <div className="flex flex-col items-center">
                          <i className="bi bi-eye text-slate-400 mb-0.5 text-xs"></i>
                          <span className="font-bold">View</span>
                          <span className="text-[8.5px] text-slate-400 uppercase font-normal">Read</span>
                        </div>
                      </th>

                      <th className="p-2.5 text-center w-20">
                        <div className="flex flex-col items-center">
                          <i className="bi bi-plus-circle text-slate-400 mb-0.5 text-xs"></i>
                          <span className="font-bold">Create</span>
                          <span className="text-[8.5px] text-slate-400 uppercase font-normal">Add</span>
                        </div>
                      </th>

                      <th className="p-2.5 text-center w-20">
                        <div className="flex flex-col items-center">
                          <i className="bi bi-pencil-square text-slate-400 mb-0.5 text-xs"></i>
                          <span className="font-bold">Edit</span>
                          <span className="text-[8.5px] text-slate-400 uppercase font-normal">Update</span>
                        </div>
                      </th>

                      <th className="p-2.5 text-center w-20">
                        <div className="flex flex-col items-center">
                          <i className="bi bi-trash3 text-slate-400 mb-0.5 text-xs"></i>
                          <span className="font-bold">Delete</span>
                          <span className="text-[8.5px] text-slate-400 uppercase font-normal">Remove</span>
                        </div>
                      </th>

                      <th className="p-2.5 text-center w-24">
                        <div className="flex flex-col items-center">
                          <i className="bi bi-download text-slate-400 mb-0.5 text-xs"></i>
                          <span className="font-bold">Export</span>
                          <span className="text-[8.5px] text-slate-400 uppercase font-normal">CSV/PDF</span>
                        </div>
                      </th>

                      <th className="p-2.5 pr-4 text-center font-bold w-28">Quick Action</th>
                    </tr>
                  </thead>

                  {/* Table Body with Accordion Groups */}
                  <tbody className="divide-y divide-slate-100 text-xs bg-white">
                    {(Object.keys(groupedModules) as ModuleCategory[]).map((catKey) => {
                      const modulesInCat = groupedModules[catKey] || [];
                      const isCollapsed = collapsedSections[catKey];
                      const catTitle =
                        catKey === "CORE"
                          ? "Core System Modules"
                          : catKey === "OPERATIONS"
                          ? "Operational Modules"
                          : catKey === "HR"
                          ? "HR & Organization Modules"
                          : catKey === "FINANCE"
                          ? "Finance & Reporting"
                          : catKey === "SECURITY"
                          ? "Security & Compliance"
                          : "Integrations & Enterprise API";

                      const catBadgeColor =
                        catKey === "CORE"
                          ? "bg-indigo-100 text-indigo-700"
                          : catKey === "OPERATIONS"
                          ? "bg-blue-100 text-blue-700"
                          : catKey === "HR"
                          ? "bg-purple-100 text-purple-700"
                          : catKey === "FINANCE"
                          ? "bg-emerald-100 text-emerald-700"
                          : catKey === "SECURITY"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-cyan-100 text-cyan-800";

                      return (
                        <React.Fragment key={catKey}>
                          {/* Section Header Accordion Bar */}
                          <tr className="bg-[#f8fafc] border-y border-slate-200">
                            <td colSpan={7} className="p-2.5 px-3.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection(catKey)}
                                    className="text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                                    title="Toggle section"
                                  >
                                    <i
                                      className={`bi ${
                                        isCollapsed ? "bi-chevron-right" : "bi-chevron-down"
                                      } text-xs`}
                                    ></i>
                                  </button>
                                  <span className="font-extrabold text-slate-800 text-xs sm:text-[13px]">
                                    {catTitle}
                                  </span>
                                </div>
                                <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full ${catBadgeColor}`}>
                                  {modulesInCat.length} {modulesInCat.length === 1 ? "module" : "modules"}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Rows for Category */}
                          {!isCollapsed &&
                            modulesInCat.map((mod) => {
                              const modPerms = rolePermMap[mod.id] || {
                                view: false,
                                create: false,
                                edit: false,
                                delete: false,
                                export: false
                              };
                              const allActive =
                                modPerms.view &&
                                modPerms.create &&
                                modPerms.edit &&
                                modPerms.delete &&
                                modPerms.export;

                              return (
                                <tr key={mod.id} className="bg-white hover:bg-slate-50 transition-colors">
                                  <td className="p-2.5 pl-4">
                                    <div className="flex items-start gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                        <i className={`bi ${mod.icon} text-xs`}></i>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-extrabold text-slate-800 text-xs mb-0 truncate">
                                          {mod.name}
                                        </p>
                                        <p className="text-[10.5px] text-slate-500 mt-0.5 mb-0 leading-tight">
                                          {mod.description}
                                        </p>
                                      </div>
                                    </div>
                                  </td>

                                  {(Object.keys(ACTION_LABELS) as ActionType[]).map((actKey) => {
                                    const isGranted = modPerms[actKey];
                                    const isAdminView = selectedRole === "admin" && actKey === "view";
                                    return (
                                      <td key={actKey} className="text-center p-2 align-middle">
                                        <input
                                          type="checkbox"
                                          checked={isGranted}
                                          disabled={isAdminView}
                                          onChange={() => handleToggle(selectedRole, mod.id, actKey)}
                                          className="matrix-custom-checkbox"
                                          title={`${actKey} for ${mod.name}`}
                                        />
                                      </td>
                                    );
                                  })}

                                  <td className="text-center pr-4 p-2 align-middle">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleRow(selectedRole, mod.id)}
                                      className={`text-[10.5px] font-semibold px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                                        allActive
                                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                                      }`}
                                    >
                                      {allActive ? "Revoke Row" : "Grant Row"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </React.Fragment>
                      );
                    })}

                    {filteredModules.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          <i className="bi bi-search text-2xl block mb-1"></i>
                          <span>No modules match your search query or filter.</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS & STATUS */}
        <footer className="relative z-10 px-5 sm:px-6 py-3 bg-[#f8fafc] border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <div className="w-4.5 h-4.5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[10px]">
              <i className="bi bi-info-lg"></i>
            </div>
            <span>Changes saved will be immediately persisted and applied to authorized sessions.</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Policy...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle-fill text-xs"></i>
                  <span>Save Permission Policy</span>
                </>
              )}
            </button>
          </div>
        </footer>

        {/* TOAST ALERT */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-[#07091c] text-white text-xs px-3.5 py-2.5 rounded-xl shadow-2xl border border-indigo-500/50 flex items-center gap-2.5 z-50 animate-bounce">
            <i className="bi bi-check-circle-fill text-emerald-400 text-sm"></i>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default RolePermissionMatrixModal;
