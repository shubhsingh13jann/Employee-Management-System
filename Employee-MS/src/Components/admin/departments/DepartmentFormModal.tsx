import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

interface DepartmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  department?: any | null; // If provided, edit mode; otherwise creation mode
  departments: any[];
  eligibleHeads: any[];
  onSuccess: (message: string) => void;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  isOpen,
  onClose,
  department = null,
  departments = [],
  eligibleHeads = [],
  onSuccess
}) => {
  const isEditMode = Boolean(department && department.id);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [headId, setHeadId] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (department && department.id) {
      setName(department.name || "");
      setCode(department.code || "");
      setDescription(department.description || "");
      setHeadId(department.head_id ? String(department.head_id) : "");
      setParentId(department.parent_id ? String(department.parent_id) : "");
    } else {
      setName("");
      setCode("");
      setDescription("");
      setHeadId("");
      setParentId("");
    }
    setError("");
  }, [isOpen, department]);

  // Lock background window and main workspace scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const mainEl = document.querySelector("main");
    const originalMainOverflow = mainEl ? mainEl.style.overflow : "";

    document.body.style.overflow = "hidden";
    if (mainEl) {
      mainEl.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      if (mainEl) {
        mainEl.style.overflow = originalMainOverflow;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Department name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        head_id: headId ? Number(headId) : null,
        parent_id: parentId ? Number(parentId) : null
      };

      if (isEditMode) {
        const res = await api.put(`/api/admin/departments/${department.id}`, payload);
        if (res.data.status) {
          onSuccess("Department charter updated successfully!");
          onClose();
        }
      } else {
        const res = await api.post("/api/admin/departments", payload);
        if (res.data.status) {
          onSuccess("New department created successfully!");
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save department details");
    } finally {
      setSaving(false);
    }
  };

  const selectedHead = eligibleHeads.find((h) => String(h.id) === String(headId));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overscroll-contain animate-fadeIn"
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-xl flex flex-col max-h-[88vh] sm:max-h-[90vh] my-auto overflow-hidden transition-all">
        {/* Pinned Executive Header Banner */}
        <div className="shrink-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center text-lg shadow-2xs shrink-0">
              <i className={`bi ${isEditMode ? "bi-pencil-square" : "bi-buildings"}`}></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-white mb-0">
                  {isEditMode ? "Edit Department Charter" : "Create New Department"}
                </h4>
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                    Edit Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200/70 mb-0 font-medium">
                {isEditMode
                  ? `Update corporate topology and assignments for ${department?.name || "department"}`
                  : "Establish an enterprise business unit and leadership hierarchy"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ borderRadius: "0.5rem" }}
            className="w-8 h-8 !rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Modal Form Body with Native Scrollbar & Overscroll Containment */}
        <form id="department-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 shadow-2xs">
              <i className="bi bi-exclamation-triangle-fill text-rose-500 text-sm"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Department Name */}
            <div className="sm:col-span-8">
              <label className="block mb-1.5 font-semibold text-slate-700 text-xs">
                Department Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">
                  <i className="bi bi-building"></i>
                </span>
                <input
                  type="text"
                  style={{ borderRadius: "0.75rem" }}
                  className="w-full pl-8 pr-4 py-2.5 text-xs bg-slate-50/70 border border-slate-200 !rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 font-medium"
                  placeholder="e.g., Engineering, Marketing, Finance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Department Code */}
            <div className="sm:col-span-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-semibold text-slate-700 text-xs">Code</label>
                <span className="text-[10px] text-slate-400">3-4 chars</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">
                  <i className="bi bi-upc-scan"></i>
                </span>
                <input
                  type="text"
                  maxLength={6}
                  style={{ borderRadius: "0.75rem" }}
                  className="w-full pl-8 pr-3 py-2.5 text-xs bg-slate-50/70 border border-slate-200 !rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 font-bold uppercase tracking-wider"
                  placeholder="ENG"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-slate-700 text-xs">Department Charter & Description</label>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  description.length > 220 ? "text-amber-600" : "text-slate-400"
                }`}
              >
                {description.length}/250 characters
              </span>
            </div>
            <textarea
              style={{ borderRadius: "0.75rem" }}
              className="w-full p-3 text-xs bg-slate-50/70 border border-slate-200 !rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400 font-medium resize-none leading-relaxed"
              rows={3}
              maxLength={250}
              placeholder="Detail the department's mandate, operational responsibilities, and corporate objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          {/* Department Head (HOD) Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-slate-700 text-xs">Department Head (HOD)</label>
              <span className="text-[10px] text-slate-400">Executive Leader</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">
                <i className="bi bi-person-badge"></i>
              </span>
              <select
                style={{ borderRadius: "0.75rem" }}
                className="w-full pl-8 pr-8 py-2.5 text-xs bg-slate-50/70 border border-slate-200 !rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all font-medium appearance-none cursor-pointer"
                value={headId}
                onChange={(e) => setHeadId(e.target.value)}
              >
                <option value="">— Unassigned / Vacant —</option>
                {eligibleHeads.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.name} ({head.role?.toUpperCase() || "MANAGER"}) {head.department_name ? `• ${head.department_name}` : ""}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 text-slate-400 text-xs pointer-events-none">
                <i className="bi bi-chevron-down text-[10px]"></i>
              </span>
            </div>

            {/* Selected HOD Preview Badge */}
            {selectedHead && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0">
                    {selectedHead.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-[11px] leading-tight">{selectedHead.name}</div>
                    <div className="text-[10px] text-slate-400">{selectedHead.email}</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                  {selectedHead.role}
                </span>
              </div>
            )}
          </div>

          {/* Parent Department Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-semibold text-slate-700 text-xs">Parent Department</label>
              <span className="text-[10px] text-slate-400">Optional Tree Hierarchy</span>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-xs pointer-events-none">
                <i className="bi bi-diagram-3"></i>
              </span>
              <select
                style={{ borderRadius: "0.75rem" }}
                className="w-full pl-8 pr-8 py-2.5 text-xs bg-slate-50/70 border border-slate-200 !rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white text-slate-800 transition-all font-medium appearance-none cursor-pointer"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">— None (Top-Level Department) —</option>
                {departments
                  .filter((d) => !isEditMode || d.id !== department.id)
                  .map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} {dept.code ? `(${dept.code})` : ""}
                    </option>
                  ))}
              </select>
              <span className="absolute right-3 text-slate-400 text-xs pointer-events-none">
                <i className="bi bi-chevron-down text-[10px]"></i>
              </span>
            </div>
          </div>
        </form>

        {/* Pinned Modal Actions Footer - Always Visible */}
        <div className="shrink-0 px-6 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            style={{ borderRadius: "0.75rem" }}
            className="px-4 py-2 !rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="department-form"
            disabled={saving}
            style={{ borderRadius: "0.75rem" }}
            className={`px-5 py-2 !rounded-xl font-semibold text-xs tracking-wide transition-all duration-200 cursor-pointer inline-flex items-center gap-2 shadow-2xs ${
              isEditMode
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            } disabled:opacity-60`}
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <i className={`bi ${isEditMode ? "bi-check-lg" : "bi-plus-lg"} text-xs font-bold`}></i>
            )}
            <span>{isEditMode ? "Save Charter Changes" : "Create Department"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
