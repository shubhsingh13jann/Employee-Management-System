import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  departments: any[];
  supervisors: any[];
  editUser?: any | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments,
  supervisors,
  editUser
}) => {
  const isEditMode = Boolean(editUser);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department_id: "",
    supervisor_id: "",
    is_hod: false,
    salary: "",
    phone: "",
    address: "",
    status: "active"
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Populate data when editUser changes
  useEffect(() => {
    if (!isOpen) return;

    if (editUser) {
      setFormData({
        name: editUser.name || "",
        email: editUser.email || "",
        password: "", // blank password on edit retains current hash
        role: editUser.role || "employee",
        department_id: editUser.department_id ? String(editUser.department_id) : "",
        supervisor_id: editUser.supervisor_id ? String(editUser.supervisor_id) : "",
        is_hod: Boolean(editUser.is_hod),
        salary: editUser.salary !== undefined && editUser.salary !== null ? String(editUser.salary) : "",
        phone: editUser.phone || "",
        address: editUser.address || "",
        status: editUser.status || "active"
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        department_id: departments.length > 0 ? String(departments[0].id) : "",
        supervisor_id: "",
        is_hod: false,
        salary: "",
        phone: "",
        address: "",
        status: "active"
      });
    }
    setErrorMsg("");
  }, [isOpen, editUser, departments]);

  // Prevent background scrolling while modal is active
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

  // Filter supervisors matching selected department, excluding current user if in edit mode
  const filteredSupervisors = supervisors.filter((sup) => {
    if (isEditMode && editUser && sup.id === editUser.id) return false;
    if (!formData.department_id) return true;
    return String(sup.department_id) === String(formData.department_id);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg("Work email is required.");
      return;
    }
    if (!isEditMode && !formData.password.trim()) {
      setErrorMsg("Temporary password is required for onboarding.");
      return;
    }
    if (formData.password.trim() && formData.password.trim().length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password.trim() || undefined,
        role: formData.role,
        department_id: formData.department_id ? Number(formData.department_id) : null,
        supervisor_id: formData.role === "employee" && formData.supervisor_id ? Number(formData.supervisor_id) : null,
        is_hod: formData.is_hod,
        salary: formData.salary ? Number(formData.salary) : 0,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        status: formData.status
      };

      if (isEditMode && editUser) {
        const res = await api.put(`/api/admin/users/${editUser.id}`, payload);
        if (res.data.status) {
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.post("/api/admin/users", payload);
        if (res.data.status) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      console.error("Save user error:", err);
      setErrorMsg(err.response?.data?.error || "Failed to save member details. Please verify your inputs.");
    } finally {
      setSaving(false);
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
        className="w-full max-w-4xl lg:max-w-5xl max-h-[92vh] bg-white rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Executive Header Banner */}
        <div className="shrink-0 px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-indigo-900/40">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 text-base sm:text-lg font-bold shadow-inner shrink-0">
              <i className={`bi ${isEditMode ? "bi-pencil-square" : "bi-person-plus-fill"}`}></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-white tracking-tight mb-0 truncate">
                  {isEditMode ? `Edit Profile: ${editUser.name}` : "Onboard Team Member"}
                </h3>
                <span
                  className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs whitespace-nowrap ${
                    isEditMode
                      ? "bg-indigo-500/20 text-indigo-200 border-indigo-400/30"
                      : "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                  }`}
                >
                  {isEditMode ? "Profile Update" : "Workforce Onboarding"}
                </span>
              </div>
              <p className="text-xs text-indigo-200/70 mt-0.5 mb-0 font-normal truncate">
                {isEditMode
                  ? "Update member designation, reporting lines, compensation, and governance status"
                  : "Provision identity, assign role tier, establish reporting hierarchy, and allocate department"}
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

        {/* Modal Form Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
              <i className="bi bi-exclamation-triangle-fill shrink-0 text-sm"></i>
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Core Identity */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0">
                Core Identity & Access Credentials
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Full Name */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Work Email */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="s.jenkins@enterprise.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  {isEditMode ? "Password (Optional)" : "Initial Password"} {!isEditMode && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!isEditMode}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isEditMode ? "Leave blank to preserve" : "Min. 6 characters"}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
            {isEditMode && (
              <p className="text-[11px] text-slate-400 font-normal px-1">
                Leave password blank to preserve the member's current credentials.
              </p>
            )}
          </div>

          {/* Section 2: Organizational Topology */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0">
                Organizational Topology & Hierarchy
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Governance Role Tier */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  Governance Role Tier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 font-medium cursor-pointer"
                >
                  <option value="employee">💼 Employee (Staff Member)</option>
                  <option value="supervisor">👷 Supervisor (Pod Lead / Team Lead)</option>
                  <option value="manager">👔 Manager (Department Management)</option>
                  <option value="admin">👑 HR Admin (Full Enterprise Governance)</option>
                </select>
              </div>

              {/* Assigned Department */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  Assigned Department
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value, supervisor_id: "" })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 font-medium cursor-pointer"
                >
                  <option value="">Unassigned / Floating Pool</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} {dept.code ? `(${dept.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Direct Supervisor (if employee) */}
              {formData.role === "employee" && (
                <div className="relative group md:col-span-2">
                  <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                    Direct Supervisor (Reporting Line)
                  </label>
                  <select
                    value={formData.supervisor_id}
                    onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 font-medium cursor-pointer"
                  >
                    <option value="">Direct to HOD / Unassigned Supervisor</option>
                    {filteredSupervisors.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.role === "manager" ? "Manager" : "Supervisor"} • {sup.direct_reports_count || 0} reports)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* HOD Checkbox Banner */}
              {formData.department_id && (
                <div className="md:col-span-2 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="is_hod_checkbox"
                    checked={formData.is_hod}
                    onChange={(e) => setFormData({ ...formData, is_hod: e.target.checked })}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="is_hod_checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                    <strong className="font-semibold text-indigo-950 block">
                      Designate as Apex Head of Department (HOD)
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Appoints this member as the apex institutional authority for the selected department.
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Compensation & Operational Details */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-0">
                Compensation & Operational Profile
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Annual Salary */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  Annual Salary ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="75,000"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Contact Phone */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Account Status */}
              <div className="relative group">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  Account Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 font-medium cursor-pointer"
                >
                  <option value="active">Active (Full Access)</option>
                  <option value="inactive">Inactive (Suspended)</option>
                </select>
              </div>

              {/* Office / Work Address */}
              <div className="relative group md:col-span-3">
                <label className="absolute -top-2.5 left-3.5 px-1.5 bg-white text-[11px] font-semibold text-slate-500 group-focus-within:text-indigo-600 transition-colors z-10 pointer-events-none">
                  Office / Work Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Building 4, Floor 3, Suite 302, San Francisco, CA"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-sm shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Member...</span>
                </>
              ) : (
                <>
                  <i className={`bi ${isEditMode ? "bi-check2" : "bi-check2-circle"}`}></i>
                  <span>{isEditMode ? "Save Changes" : "Save & Onboard Member"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
