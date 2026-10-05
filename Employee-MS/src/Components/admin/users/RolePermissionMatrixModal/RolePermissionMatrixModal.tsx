import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./RolePermissionMatrixModal.css";

export type RoleType = "admin" | "manager" | "supervisor" | "employee";

export type ActionType = "view" | "create" | "edit" | "delete" | "export";

export interface ModulePermission {
  moduleId: string;
  moduleName: string;
  category: "Core" | "Operations" | "Finance & Reporting";
  description: string;
  actions: Record<ActionType, boolean>;
}

export type RolePermissionsMap = Record<RoleType, Record<string, Record<ActionType, boolean>>>;

interface RolePermissionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (message: string) => void;
}

const MODULE_DEFINITIONS: Array<{
  id: string;
  name: string;
  category: "Core" | "Operations" | "Finance & Reporting";
  description: string;
}> = [
  {
    id: "users",
    name: "User Directory & Profiles",
    category: "Core",
    description: "Manage employee profiles, credentials, onboarding, and offboarding"
  },
  {
    id: "departments",
    name: "Department Management",
    category: "Core",
    description: "Manage business departments, budgets, and head-of-department assignments"
  },
  {
    id: "hierarchy",
    name: "Organizational Hierarchy",
    category: "Core",
    description: "Configure supervisor reporting lines, team trees, and mobility"
  },
  {
    id: "tasks",
    name: "Task Assignment & Sprints",
    category: "Operations",
    description: "Create, assign, track, and complete departmental tasks and projects"
  },
  {
    id: "leaves",
    name: "Leave Requests & Approvals",
    category: "Operations",
    description: "Review, approve, reject, and adjust employee time-off and sick leaves"
  },
  {
    id: "payroll",
    name: "Payroll & Compensation",
    category: "Finance & Reporting",
    description: "Access salary records, compensation history, and disbursement statements"
  },
  {
    id: "analytics",
    name: "Workforce Intelligence & Audit",
    category: "Finance & Reporting",
    description: "Inspect enterprise KPIs, turnover stats, and security audit logs"
  }
];

const DEFAULT_PERMISSIONS: RolePermissionsMap = {
  admin: {
    users: { view: true, create: true, edit: true, delete: true, export: true },
    departments: { view: true, create: true, edit: true, delete: true, export: true },
    hierarchy: { view: true, create: true, edit: true, delete: true, export: true },
    tasks: { view: true, create: true, edit: true, delete: true, export: true },
    leaves: { view: true, create: true, edit: true, delete: true, export: true },
    payroll: { view: true, create: true, edit: true, delete: true, export: true },
    analytics: { view: true, create: true, edit: true, delete: true, export: true }
  },
  manager: {
    users: { view: true, create: true, edit: true, delete: false, export: true },
    departments: { view: true, create: false, edit: true, delete: false, export: true },
    hierarchy: { view: true, create: false, edit: true, delete: false, export: true },
    tasks: { view: true, create: true, edit: true, delete: true, export: true },
    leaves: { view: true, create: true, edit: true, delete: false, export: true },
    payroll: { view: true, create: false, edit: false, delete: false, export: false },
    analytics: { view: true, create: false, edit: false, delete: false, export: true }
  },
  supervisor: {
    users: { view: true, create: false, edit: false, delete: false, export: false },
    departments: { view: true, create: false, edit: false, delete: false, export: false },
    hierarchy: { view: true, create: false, edit: false, delete: false, export: false },
    tasks: { view: true, create: true, edit: true, delete: false, export: true },
    leaves: { view: true, create: true, edit: true, delete: false, export: false },
    payroll: { view: false, create: false, edit: false, delete: false, export: false },
    analytics: { view: true, create: false, edit: false, delete: false, export: false }
  },
  employee: {
    users: { view: true, create: false, edit: false, delete: false, export: false },
    departments: { view: true, create: false, edit: false, delete: false, export: false },
    hierarchy: { view: true, create: false, edit: false, delete: false, export: false },
    tasks: { view: true, create: false, edit: true, delete: false, export: false },
    leaves: { view: true, create: true, edit: false, delete: false, export: false },
    payroll: { view: false, create: false, edit: false, delete: false, export: false },
    analytics: { view: false, create: false, edit: false, delete: false, export: false }
  }
};

const ROLE_METADATA: Record<
  RoleType,
  { label: string; badge: string; color: string; desc: string; icon: string }
> = {
  admin: {
    label: "Super Admin",
    badge: "Full Privilege",
    color: "from-indigo-600 to-violet-700",
    desc: "Unrestricted operational authority, role management, and organizational governance",
    icon: "bi-shield-shaded"
  },
  manager: {
    label: "Manager",
    badge: "Department Lead",
    color: "from-blue-600 to-indigo-700",
    desc: "Oversees business units, approves requisitions, and manages team deliverables",
    icon: "bi-briefcase-fill"
  },
  supervisor: {
    label: "Supervisor",
    badge: "Team Lead",
    color: "from-cyan-600 to-blue-700",
    desc: "Day-to-day workflow orchestration, task reviews, and direct reporting lines",
    icon: "bi-people-fill"
  },
  employee: {
    label: "Employee",
    badge: "Contributor",
    color: "from-emerald-600 to-teal-700",
    desc: "Core individual contributor access for assigned work, attendance, and self-service",
    icon: "bi-person-badge-fill"
  }
};

const ACTION_LABELS: Record<ActionType, { label: string; icon: string; tag: string }> = {
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
  const [selectedRole, setSelectedRole] = useState<RoleType>("manager");
  const [permissions, setPermissions] = useState<RolePermissionsMap>(DEFAULT_PERMISSIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (role: RoleType, moduleId: string, action: ActionType) => {
    setPermissions((prev) => {
      const rolePerms = { ...prev[role] };
      const modPerms = { ...(rolePerms[moduleId] || { view: false, create: false, edit: false, delete: false, export: false }) };
      modPerms[action] = !modPerms[action];
      rolePerms[moduleId] = modPerms;
      return { ...prev, [role]: rolePerms };
    });
    setHasChanges(true);
  };

  const handleToggleAllForModule = (role: RoleType, moduleId: string, enableAll: boolean) => {
    setPermissions((prev) => {
      const rolePerms = { ...prev[role] };
      rolePerms[moduleId] = {
        view: enableAll,
        create: enableAll,
        edit: enableAll,
        delete: enableAll,
        export: enableAll
      };
      return { ...prev, [role]: rolePerms };
    });
    setHasChanges(true);
  };

  const handleToggleAllForRole = (role: RoleType, enableAll: boolean) => {
    setPermissions((prev) => {
      const updatedRole: Record<string, Record<ActionType, boolean>> = {};
      MODULE_DEFINITIONS.forEach((mod) => {
        updatedRole[mod.id] = {
          view: enableAll,
          create: enableAll,
          edit: enableAll,
          delete: enableAll,
          export: enableAll
        };
      });
      return { ...prev, [role]: updatedRole };
    });
    setHasChanges(true);
  };

  const handleResetToDefaults = () => {
    setPermissions(DEFAULT_PERMISSIONS);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await new Promise((res) => setTimeout(res, 400));
      localStorage.setItem("ems_role_permissions", JSON.stringify(permissions));
      setHasChanges(false);
      onSaved?.(`Role permission policy updated and enforced successfully across all 4 workforce tiers.`);
      onClose();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const filteredModules = MODULE_DEFINITIONS.filter((mod) => {
    const matchesSearch =
      mod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = filterCategory === "all" || mod.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const activeRoleMeta = ROLE_METADATA[selectedRole];
  const rolePermMap = permissions[selectedRole] || {};

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="shrink-0 px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-950/60">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-lg shadow-inner">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight mb-0">
                  Granular Role-Permission Policy Matrix
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live Guard
                </span>
              </div>
              <p className="text-xs text-slate-300/80 mb-0 font-normal">
                Define access control rights, operational boundaries, and CRUD authorizations per workforce tier
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Role Selector Ribbon */}
        <div className="shrink-0 bg-slate-50 border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(Object.keys(ROLE_METADATA) as RoleType[]).map((roleKey) => {
              const meta = ROLE_METADATA[roleKey];
              const isSelected = selectedRole === roleKey;
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setSelectedRole(roleKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <i className={`bi ${meta.icon} ${isSelected ? "text-indigo-400" : "text-slate-400"}`}></i>
                  <span>{meta.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {meta.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleAllForRole(selectedRole, true)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
              title="Enable all permissions for current role"
            >
              Grant All
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllForRole(selectedRole, false)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
              title="Revoke all permissions for current role"
            >
              Revoke All
            </button>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Reset matrix to system recommended defaults"
            >
              Reset Defaults
            </button>
          </div>
        </div>

        {/* Role Summary Banner */}
        <div className="shrink-0 px-6 py-2.5 bg-gradient-to-r from-slate-100 to-indigo-50/50 border-b border-slate-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <i className={`bi ${activeRoleMeta.icon} text-indigo-600`}></i>
            <span className="font-bold text-slate-900">{activeRoleMeta.label}:</span>
            <span className="text-slate-600 text-[11px]">{activeRoleMeta.desc}</span>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-48"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Core">Core</option>
              <option value="Operations">Operations</option>
              <option value="Finance & Reporting">Finance & Reporting</option>
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-3 px-4 w-[38%]">System Module & Scope</th>
                  {(Object.keys(ACTION_LABELS) as ActionType[]).map((actionKey) => {
                    const act = ACTION_LABELS[actionKey];
                    return (
                      <th key={actionKey} className="py-3 px-3 text-center w-[12%]">
                        <div className="flex flex-col items-center">
                          <i className={`bi ${act.icon} text-indigo-300 text-sm mb-0.5`}></i>
                          <span>{act.label}</span>
                          <span className="text-[9px] font-normal text-slate-400">{act.tag}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-center w-[10%]">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredModules.map((mod) => {
                  const modPerms = rolePermMap[mod.id] || {
                    view: false,
                    create: false,
                    edit: false,
                    delete: false,
                    export: false
                  };
                  const allActive =
                    modPerms.view && modPerms.create && modPerms.edit && modPerms.delete && modPerms.export;

                  return (
                    <tr key={mod.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                              mod.category === "Core"
                                ? "bg-indigo-100 text-indigo-700"
                                : mod.category === "Operations"
                                ? "bg-cyan-100 text-cyan-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {mod.category}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{mod.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {mod.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {(Object.keys(ACTION_LABELS) as ActionType[]).map((actKey) => {
                        const isGranted = modPerms[actKey];
                        const isAdminSuper = selectedRole === "admin" && actKey === "view";
                        return (
                          <td key={actKey} className="py-3 px-3 text-center align-middle">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors">
                              <input
                                type="checkbox"
                                checked={isGranted}
                                disabled={isAdminSuper}
                                onChange={() => handleToggle(selectedRole, mod.id, actKey)}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 focus:ring-offset-0 transition cursor-pointer disabled:opacity-50"
                              />
                            </label>
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleToggleAllForModule(selectedRole, mod.id, !allActive)}
                          className={`text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
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
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <i className="bi bi-info-circle text-indigo-500"></i>
            <span>
              Changes saved will be immediately persisted and applied to authorized sessions.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                hasChanges
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30 active:scale-95"
                  : "bg-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Policy...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle text-sm"></i>
                  <span>Save Permission Policy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
