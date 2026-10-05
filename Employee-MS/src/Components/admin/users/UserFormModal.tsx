import React, { useState, useEffect, useRef } from "react";
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

interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  label: string;
  required?: boolean;
  value: string;
  options: CustomSelectOption[];
  placeholder: string;
  icon: string;
  fieldName: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (val: string) => void;
  isDocked: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  required,
  value,
  options,
  placeholder,
  icon,
  fieldName,
  isOpen,
  onToggle,
  onSelect,
  isDocked
}) => {
  const selectedOption = options.find((o) => o.value === value && o.value !== "");

  return (
    <div className="relative pt-[20px]" data-custom-dropdown={fieldName}>
      <label
        className={`absolute left-2.5 transition-all duration-200 ease-out pointer-events-none select-none z-10 px-2 leading-none ${
          isDocked
            ? `top-[12px] text-xs font-bold bg-white rounded-xs py-0.5 shadow-2xs ${
                isOpen ? "text-[#4f46e5]" : "text-slate-700"
              }`
            : "top-0 text-[11.5px] font-bold text-slate-800 bg-transparent"
        }`}
      >
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full relative flex items-center rounded-lg bg-white border transition-all duration-200 ease-out px-2.5 shadow-2xs text-left cursor-pointer outline-none ${
          isDocked ? "h-11" : "h-9"
        } ${
          isOpen
            ? "border-[#4f46e5] ring-2 ring-indigo-100"
            : "border-slate-200 hover:border-indigo-400"
        }`}
      >
        <i
          className={`${icon} mr-2 shrink-0 transition-all duration-200 ${
            isDocked ? "text-sm text-indigo-500" : "text-xs text-slate-400"
          }`}
        ></i>

        <span
          className={`w-full font-semibold truncate pt-0.5 transition-all duration-200 ${
            isDocked ? "text-[13.5px]" : "text-xs"
          } ${selectedOption ? "text-slate-900" : "text-slate-400"}`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <i
          className={`bi bi-chevron-down text-xs transition-transform duration-200 ml-2 shrink-0 ${
            isOpen ? "rotate-180 text-indigo-600" : "text-slate-400"
          }`}
        ></i>
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white rounded-xl border border-slate-200/90 shadow-2xl z-50 py-1.5 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-0.5">
            {options.map((opt) => {
              const isSelected = value === opt.value && opt.value !== "";
              return (
                <button
                  key={opt.value || "__unassigned__"}
                  type="button"
                  onClick={() => onSelect(opt.value)}
                  className={`w-full px-3 py-2 rounded-lg text-xs sm:text-[13px] flex items-center justify-between text-left cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? "bg-indigo-50 text-[#4f46e5] font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span
                        className={`text-[10.5px] truncate ${
                          isSelected ? "text-indigo-400" : "text-slate-400"
                        }`}
                      >
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <i className="bi bi-check2 text-base text-[#4f46e5] shrink-0 font-bold ml-1"></i>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  departments,
  supervisors,
  editUser
}) => {
  const isEditMode = Boolean(editUser);
  const [activeStep, setActiveStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Section Refs for scroll tracking
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    department_id: "",
    supervisor_id: "",
    is_hod: false,
    salary: "",
    phone: "",
    address: "",
    status: "",
    image_url: ""
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check mime type and file extension for robust format validation (.jpeg, .jpg, .png, .webp, .jfif)
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".jfif"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const isImageMime = file.type.startsWith("image/") || ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/pjpeg"].includes(file.type.toLowerCase());
    const isValidFormat = isImageMime || validExtensions.includes(ext);

    if (!isValidFormat) {
      setErrorMsg("Please select a valid image file (.jpg, .jpeg, .png, .webp).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image size should be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image_url: reader.result as string }));
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  // Helper to determine if a field's label should dock into its top border:
  // ONLY when the field is actively focused/opened (typing/selection) OR when user has entered/typed non-empty text.
  // By default (empty & unfocused), the label sits in its natural heading position above the input box (Image 1 style).
  const isFieldDocked = (fieldName: keyof typeof formData) => {
    if (focusedField === fieldName || openDropdown === fieldName) return true;
    const val = formData[fieldName];
    return typeof val === "string" && val.trim().length > 0;
  };

  // Populate data when editUser changes
  useEffect(() => {
    if (!isOpen) return;
    setActiveStep(1);

    if (editUser) {
      setFormData({
        name: editUser.name || "",
        email: editUser.email || "",
        password: "", // blank password on edit retains current hash
        role: editUser.role || "",
        department_id: editUser.department_id ? String(editUser.department_id) : "",
        supervisor_id: editUser.supervisor_id ? String(editUser.supervisor_id) : "",
        is_hod: Boolean(editUser.is_hod),
        salary: editUser.salary !== undefined && editUser.salary !== null ? String(editUser.salary) : "",
        phone: editUser.phone || "",
        address: editUser.address || "",
        status: editUser.status || "",
        image_url: editUser.image_url || ""
      });
    } else {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "",
        department_id: "",
        supervisor_id: "",
        is_hod: false,
        salary: "",
        phone: "",
        address: "",
        status: "",
        image_url: ""
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

  // Close custom dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("[data-custom-dropdown]")) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  // Scroll smoothly to section when clicking a stage
  const scrollToSection = (stepNum: number) => {
    setActiveStep(stepNum);
    const targetRef = stepNum === 1 ? section1Ref : stepNum === 2 ? section2Ref : section3Ref;
    if (targetRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: targetRef.current.offsetTop - 12,
        behavior: "smooth"
      });
    }
  };

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
      scrollToSection(1);
      return;
    }
    if (!formData.email.trim()) {
      setErrorMsg("Work email is required.");
      scrollToSection(1);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMsg("Please enter a valid work email address.");
      scrollToSection(1);
      return;
    }
    if (!isEditMode && !formData.password.trim()) {
      setErrorMsg("Temporary password is required for onboarding.");
      scrollToSection(1);
      return;
    }
    if (formData.password.trim() && formData.password.trim().length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      scrollToSection(1);
      return;
    }
    if (!formData.role) {
      setErrorMsg("Please select a governance role tier.");
      scrollToSection(2);
      return;
    }
    if (!formData.status) {
      setErrorMsg("Please select an account status.");
      scrollToSection(3);
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
        status: formData.status,
        image_url: formData.image_url || ""
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

  const steps = [
    {
      id: 1,
      title: "Core Identity",
      subtitle: "Basic information and credentials"
    },
    {
      id: 2,
      title: "Organization Setup",
      subtitle: "Role, department and hierarchy"
    },
    {
      id: 3,
      title: "Compensation",
      subtitle: "Salary, contact and account status"
    }
  ];

  const stepTips: Record<
    number,
    {
      title: string;
      badge: string;
      badgeColor: string;
      icon: string;
      tip: React.ReactNode;
      borderColor: string;
    }
  > = {
    1: {
      title: "Core Identity Tip",
      badge: "Identity",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/60",
      icon: "💡",
      borderColor: "border-indigo-200/70 shadow-indigo-500/5",
      tip: (
        <span>
          All fields with <span className="text-rose-500 font-bold">*</span> are required. Use corporate email to configure enterprise access.
        </span>
      )
    },
    2: {
      title: "Organization Setup Tip",
      badge: "Hierarchy",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
      icon: "💡",
      borderColor: "border-emerald-200/70 shadow-emerald-500/5",
      tip: (
        <span>
          Assigning a <strong className="font-semibold text-slate-700">Supervisor</strong> configures automatic routing for leave approvals and reviews.
        </span>
      )
    },
    3: {
      title: "Compensation & Status Tip",
      badge: "Profile",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200/60",
      icon: "💡",
      borderColor: "border-amber-200/70 shadow-amber-500/5",
      tip: (
        <span>
          Set gross annual salary. Choose <strong className="font-semibold text-slate-700">Inactive</strong> if the member starts at a future date.
        </span>
      )
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/65 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="w-full max-w-4xl lg:max-w-[1010px] max-h-[92vh] bg-white rounded-2xl sm:rounded-[22px] border border-slate-200/90 shadow-2xl flex flex-col my-auto overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. FULL-WIDTH TOP HEADER BAR (Matching Image 1)           */}
        {/* ========================================================= */}
        <div className="shrink-0 px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base shadow-xs shrink-0">
              <i className={`bi ${isEditMode ? "bi-pencil-square" : "bi-person-plus-fill"}`}></i>
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-base text-slate-900 tracking-tight leading-tight mb-0 truncate">
                {isEditMode ? `Edit Profile: ${editUser.name}` : "Add New Employee"}
              </h4>
              <p className="text-[11px] text-slate-500 mb-0 font-normal mt-0.5 truncate">
                Create a new staff member and assign their role, department, and reporting structure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7.5 h-7.5 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer text-xs font-bold shrink-0"
            title="Close modal"
          >
            <i className="bi bi-x-lg text-[11px]"></i>
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. SPLIT BODY: Left Sidebar + Right Form Content          */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* ========================================================= */}
          {/* LEFT COLUMN: 3D Art, Title, Stepper & Quick Tip (Clean)    */}
          {/* ========================================================= */}
          <div className="w-full md:w-[260px] lg:w-[280px] shrink-0 bg-gradient-to-b from-[#f4f7fe] via-[#f8faff] to-[#eff3fe] p-4 sm:p-4.5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-indigo-100/70 relative overflow-hidden select-none">
            {/* Subtle Ambient Pastel Blobs */}
            <div className="absolute top-[-10%] left-[-15%] w-[130%] h-[50%] bg-gradient-to-br from-indigo-200/35 via-purple-200/25 to-transparent blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[110%] h-[40%] bg-gradient-to-tl from-sky-200/35 via-blue-100/20 to-transparent blur-3xl pointer-events-none" />

            {/* Top Section: 3D Art & Header */}
            <div className="relative z-10 w-full">
              {/* 3D Tilted Card Art with Floating Badges */}
              <div className="relative w-full h-28 flex items-center justify-center mb-2">
                {/* Soft purple glow shadow */}
                <div className="absolute w-20 h-24 bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 blur-lg rounded-2xl transform rotate-12 pointer-events-none" />

                {/* Central 3D Tilted Glass Card */}
                <div className="relative w-18 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/25 transform -rotate-6 central-hero-card">
                  <div className="w-full h-full rounded-2xl bg-gradient-to-b from-indigo-600/90 to-purple-700/95 backdrop-blur-md flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white mb-1.5 shadow-inner">
                      <i className="bi bi-person-fill text-base"></i>
                    </div>
                    <div className="w-9 h-1 bg-white/40 rounded-full mb-1"></div>
                    <div className="w-5 h-1 bg-white/25 rounded-full"></div>
                  </div>
                </div>

                {/* Floating Orbit Badge 1 (Left: User Avatar) */}
                <div className="absolute top-2 left-2 w-7.5 h-7.5 rounded-xl bg-white/95 backdrop-blur-md border border-purple-200/80 shadow-md shadow-purple-500/15 flex items-center justify-center text-purple-600 transform -rotate-12 orbit-badge-1">
                  <i className="bi bi-person-badge-fill text-xs"></i>
                </div>

                {/* Floating Orbit Badge 2 (Right: Tree Node) */}
                <div className="absolute top-6 right-3 w-7.5 h-7.5 rounded-xl bg-white/95 backdrop-blur-md border border-emerald-200/80 shadow-md shadow-emerald-500/15 flex items-center justify-center text-emerald-600 transform rotate-12 orbit-badge-2">
                  <i className="bi bi-diagram-3-fill text-xs"></i>
                </div>

                {/* Floating Orbit Badge 3 (Bottom: Analytics Bars) */}
                <div className="absolute -bottom-1 right-8 w-7 h-7 rounded-xl bg-white/95 backdrop-blur-md border border-amber-200/80 shadow-md shadow-amber-500/15 flex items-center justify-center text-amber-500 transform -rotate-6 orbit-badge-3">
                  <i className="bi bi-bar-chart-fill text-[10px]"></i>
                </div>
              </div>

              {/* Sidebar Title */}
              <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight mb-0">
                {isEditMode ? "Update Member" : "Onboard a"}
              </h3>
              <div className="text-base font-bold text-[#4f46e5] tracking-tight leading-tight mb-1">
                {isEditMode ? "Profile" : "New Employee"}
              </div>
              <p className="text-[10.5px] text-slate-500 leading-normal mb-4 font-normal">
                Add a new staff member, assign their role, department, reporting line, and compensation details.
              </p>

              {/* Vertical Stepper List */}
              <div className="relative w-full">
                {/* Stepper Vertical Connector Line with Smooth Dynamic Fill */}
                <div className="absolute left-[13px] top-[22px] h-[104px] w-0.5 bg-slate-200/80 rounded-full z-0 overflow-hidden">
                  <div
                    className="w-full bg-gradient-to-b from-indigo-500 via-indigo-600 to-[#4f46e5] transition-all duration-400 ease-out rounded-full"
                    style={{
                      height: activeStep === 1 ? "0%" : activeStep === 2 ? "50%" : "100%"
                    }}
                  />
                </div>

                {/* Smooth Sliding Active Capsule Track */}
                <div className="relative w-full">
                  <div
                    className="absolute left-0 right-0 h-[44px] rounded-xl bg-indigo-100/70 border border-indigo-200/80 shadow-2xs pointer-events-none transition-all duration-300 ease-out z-0"
                    style={{
                      top: activeStep === 1 ? "0px" : activeStep === 2 ? "52px" : "104px"
                    }}
                  />

                  <div className="flex flex-col gap-2 relative z-10 w-full">
                    {steps.map((step) => {
                      const isActive = activeStep === step.id;
                      const isCompleted = activeStep > step.id;

                      return (
                        <div
                          key={step.id}
                          onClick={() => scrollToSection(step.id)}
                          className={`h-[44px] flex items-center gap-2.5 px-2.5 rounded-xl transition-all cursor-pointer select-none w-full ${
                            isActive
                              ? "text-indigo-950 font-bold"
                              : "hover:bg-white/40 text-slate-600"
                          }`}
                        >
                          {/* Step Indicator Node */}
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 transition-all duration-200 ${
                              isActive
                                ? "bg-[#4f46e5] text-white shadow-xs scale-105 ring-2 ring-indigo-200/70"
                                : isCompleted
                                ? "bg-indigo-600 text-white"
                                : "bg-white border border-slate-300 text-slate-500"
                            }`}
                          >
                            {isCompleted ? (
                              <i className="bi bi-check2 text-xs font-bold leading-none"></i>
                            ) : (
                              step.id
                            )}
                          </div>

                          {/* Step Text Info */}
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-[11.5px] leading-tight truncate transition-colors ${
                                isActive ? "text-indigo-950 font-extrabold" : "text-slate-800 font-bold"
                              }`}
                            >
                              {step.title}
                            </div>
                            <div className="text-[9.5px] text-slate-400 leading-tight truncate mt-0.5">
                              {step.subtitle}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: Dynamic Quick Tip Callout Box (Full Width, Animated Step Sync) */}
            <div className="relative z-10 mt-4 pt-3 border-t border-indigo-100/60 w-full">
              {(() => {
                const currentTip = stepTips[activeStep] || stepTips[1];
                return (
                  <div
                    key={activeStep}
                    className={`bg-white/90 border rounded-xl p-2.5 flex items-start gap-2 shadow-2xs w-full transition-all duration-300 animate-in fade-in slide-in-from-bottom-1.5 ${currentTip.borderColor}`}
                  >
                    <span className="text-sm leading-none shrink-0 mt-0.5 select-none transform transition-transform hover:scale-125 duration-200 cursor-default">
                      {currentTip.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10.5px] font-bold text-slate-900 leading-tight">
                          {currentTip.title}
                        </span>
                        <span
                          className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded-full border leading-tight ${currentTip.badgeColor}`}
                        >
                          Step {activeStep}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-500 font-normal leading-snug">
                        {currentTip.tip}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Form Body & Footer                          */}
          {/* ========================================================= */}
          <div className="flex-1 flex flex-col min-w-0 bg-white">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 [scrollbar-width:thin]"
              >
                {/* Error Message Alert */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                    <i className="bi bi-exclamation-triangle-fill shrink-0 text-sm"></i>
                    <span className="font-medium">{errorMsg}</span>
                  </div>
                )}

                {/* ========================================================= */}
                {/* SECTION 1: CORE IDENTITY & CREDENTIALS                   */}
                {/* ========================================================= */}
                <div
                  ref={section1Ref}
                  onClick={() => setActiveStep(1)}
                  className="bg-slate-50/50 border border-slate-200/70 rounded-xl p-3.5 relative z-10 overflow-hidden"
                >
                  {/* Top-Right Luminous Pastel Blue/Indigo Wave Glow */}
                  <div className="absolute top-0 right-0 w-48 h-20 pointer-events-none overflow-hidden">
                    <svg className="w-full h-full opacity-80" viewBox="0 0 200 80" preserveAspectRatio="none" fill="none">
                      <path d="M 0,0 C 70,50 130,65 200,15 L 200,0 Z" fill="url(#waveBlueGrad)" />
                      <defs>
                        <linearGradient id="waveBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.3" />
                          <stop offset="60%" stopColor="#c7d2fe" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#e0e7ff" stopOpacity="0.65" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Section Header */}
                  <div className="relative z-10 flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4f46e5] flex items-center justify-center text-white text-sm shrink-0 shadow-2xs">
                      <i className="bi bi-person-badge-fill"></i>
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-0">
                        1. Core Identity & Credentials
                      </h5>
                      <p className="text-[10px] text-slate-500 font-normal mb-0">
                        Basic information and login credentials for the employee.
                      </p>
                    </div>
                  </div>

                  {/* Avatar Upload & Realtime Preview */}
                  <div className="relative z-10 flex items-center gap-3.5 p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs mb-3">
                    <div className="relative w-14 h-14 rounded-2xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-lg overflow-hidden shrink-0 shadow-inner group">
                      {formData.image_url ? (
                        <img src={formData.image_url} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span>{formData.name ? formData.name.charAt(0).toUpperCase() : <i className="bi bi-person text-2xl text-slate-400"></i>}</span>
                      )}
                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: "" })}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-xs cursor-pointer"
                          title="Remove Photo"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 px-3 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <i className="bi bi-camera text-xs"></i>
                          <span>{formData.image_url ? "Change Photo" : "Upload Avatar"}</span>
                        </button>
                        {formData.image_url && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: "" })}
                            className="h-7 px-2.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.webp"
                          onChange={handleImageFileChange}
                          className="hidden"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mb-0 leading-tight">
                        PNG, JPG, JPEG or WebP up to 10MB. Square ratio recommended.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Full Name (Normal Heading by Default, Smoothly Docks to Border when Typing/Filled) */}
                    <div className="relative pt-[20px]">
                      <label
                        className={`absolute left-2.5 transition-all duration-200 ease-out pointer-events-none select-none z-10 px-2 leading-none ${
                          isFieldDocked("name")
                            ? `top-[12px] text-xs font-bold bg-white rounded-xs py-0.5 shadow-2xs ${focusedField === "name" ? "text-[#4f46e5]" : "text-slate-700"}`
                            : "top-0 text-[11.5px] font-bold text-slate-800 bg-transparent"
                        }`}
                      >
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`relative flex items-center rounded-lg bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 ease-out px-2.5 shadow-2xs ${
                          isFieldDocked("name") ? "h-11" : "h-9"
                        }`}
                      >
                        <i
                          className={`bi bi-person mr-2 shrink-0 transition-all duration-200 ${
                            isFieldDocked("name") ? "text-sm text-indigo-500" : "text-xs text-slate-400"
                          }`}
                        ></i>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onFocus={() => {
                            setFocusedField("name");
                            setActiveStep(1);
                          }}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={isFieldDocked("name") ? "" : "Kamlesh Singh"}
                          className={`w-full bg-transparent outline-none font-medium pt-0.5 transition-all duration-200 ${
                            isFieldDocked("name") ? "text-[13.5px] text-slate-900" : "text-xs text-slate-800 placeholder:text-slate-300"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Work Email (Normal Heading by Default, Smoothly Docks to Border when Typing/Filled) */}
                    <div className="relative pt-[20px]">
                      <label
                        className={`absolute left-2.5 transition-all duration-200 ease-out pointer-events-none select-none z-10 px-2 leading-none ${
                          isFieldDocked("email")
                            ? `top-[12px] text-xs font-bold bg-white rounded-xs py-0.5 shadow-2xs ${focusedField === "email" ? "text-[#4f46e5]" : "text-slate-700"}`
                            : "top-0 text-[11.5px] font-bold text-slate-800 bg-transparent"
                        }`}
                      >
                        Work Email <span className="text-rose-500">*</span>
                      </label>
                      <div
                        className={`relative flex items-center rounded-lg bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 ease-out px-2.5 shadow-2xs ${
                          isFieldDocked("email") ? "h-11" : "h-9"
                        }`}
                      >
                        <i
                          className={`bi bi-envelope mr-2 shrink-0 transition-all duration-200 ${
                            isFieldDocked("email") ? "text-sm text-indigo-500" : "text-xs text-slate-400"
                          }`}
                        ></i>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onFocus={() => {
                            setFocusedField("email");
                            setActiveStep(1);
                          }}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={isFieldDocked("email") ? "" : "lucas.vance@company.com"}
                          className={`w-full bg-transparent outline-none font-medium pt-0.5 transition-all duration-200 ${
                            isFieldDocked("email") ? "text-[13.5px] text-slate-900" : "text-xs text-slate-800 placeholder:text-slate-300"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password (Normal Heading by Default, Smoothly Docks to Border when Typing/Filled) */}
                    <div className="md:col-span-2 relative pt-[20px]">
                      <label
                        className={`absolute left-2.5 transition-all duration-200 ease-out pointer-events-none select-none z-10 px-2 leading-none ${
                          isFieldDocked("password")
                            ? `top-[12px] text-xs font-bold bg-white rounded-xs py-0.5 shadow-2xs ${focusedField === "password" ? "text-[#4f46e5]" : "text-slate-700"}`
                            : "top-0 text-[11.5px] font-bold text-slate-800 bg-transparent"
                        }`}
                      >
                        {isEditMode ? "Update Password (Optional)" : "Initial Login Password"}{" "}
                        {!isEditMode && <span className="text-rose-500">*</span>}
                      </label>
                      <div
                        className={`relative flex items-center rounded-lg bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 ease-out px-2.5 shadow-2xs ${
                          isFieldDocked("password") ? "h-11" : "h-9"
                        }`}
                      >
                        <i
                          className={`bi bi-lock mr-2 shrink-0 transition-all duration-200 ${
                            isFieldDocked("password") ? "text-sm text-indigo-500" : "text-xs text-slate-400"
                          }`}
                        ></i>
                        <input
                          type={showPassword ? "text" : "password"}
                          required={!isEditMode}
                          value={formData.password}
                          onFocus={() => {
                            setFocusedField("password");
                            setActiveStep(1);
                          }}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder={isFieldDocked("password") ? "" : "Leave blank to preserve current password"}
                          className={`w-full bg-transparent outline-none font-medium pt-0.5 transition-all duration-200 ${
                            isFieldDocked("password") ? "text-[13.5px] text-slate-900 placeholder:text-slate-400" : "text-xs text-slate-800 placeholder:text-slate-400"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-400 hover:text-slate-600 text-sm ml-2 cursor-pointer shrink-0"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-normal mt-1 mb-0 flex items-center gap-1">
                        <i className="bi bi-info-circle text-[9px] text-[#4f46e5]"></i>
                        <span>Leave empty unless you wish to reset or change this member's password.</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* SECTION 2: ORGANIZATIONAL TOPOLOGY & HIERARCHY           */}
                {/* ========================================================= */}
                <div
                  ref={section2Ref}
                  onClick={() => setActiveStep(2)}
                  className={`bg-slate-50/50 border border-slate-200/70 rounded-xl p-3.5 relative transition-all ${
                    openDropdown && ["role", "department_id", "supervisor_id"].includes(openDropdown)
                      ? "z-40"
                      : "z-20"
                  }`}
                >
                  {/* Top-Right Luminous Pastel Emerald/Mint Wave Glow */}
                  <div className="absolute top-0 right-0 w-48 h-20 pointer-events-none overflow-hidden rounded-tr-xl">
                    <svg className="w-full h-full opacity-80" viewBox="0 0 200 80" preserveAspectRatio="none" fill="none">
                      <path d="M 0,0 C 70,50 130,65 200,15 L 200,0 Z" fill="url(#waveGreenGrad)" />
                      <defs>
                        <linearGradient id="waveGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.35" />
                          <stop offset="60%" stopColor="#6ee7b7" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#d1fae5" stopOpacity="0.65" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Section Header */}
                  <div className="relative z-10 flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#10b981] flex items-center justify-center text-white text-sm shrink-0 shadow-2xs">
                      <i className="bi bi-diagram-3-fill"></i>
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-0">
                        2. Organizational Topology & Hierarchy
                      </h5>
                      <p className="text-[10px] text-slate-500 font-normal mb-0">
                        Define role, department, and reporting structure.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Governance Role Tier (Modern Custom Dropdown) */}
                    <CustomSelect
                      label="Governance Role Tier"
                      required
                      value={formData.role}
                      options={[
                        { value: "employee", label: "Employee (Staff Member)" },
                        { value: "supervisor", label: "Supervisor (Pod Lead / Team Lead)" },
                        { value: "manager", label: "Manager (Department Management)" },
                        { value: "admin", label: "HR Admin (Full Governance)" }
                      ]}
                      placeholder="Select Governance Role Tier..."
                      icon="bi bi-briefcase"
                      fieldName="role"
                      isOpen={openDropdown === "role"}
                      onToggle={() => {
                        setActiveStep(2);
                        setOpenDropdown(openDropdown === "role" ? null : "role");
                        setFocusedField(openDropdown === "role" ? null : "role");
                      }}
                      onSelect={(val) => {
                        setFormData({ ...formData, role: val });
                        setOpenDropdown(null);
                        setFocusedField(null);
                      }}
                      isDocked={isFieldDocked("role")}
                    />

                    {/* Assigned Department (Modern Custom Dropdown) */}
                    <CustomSelect
                      label="Assigned Department"
                      value={formData.department_id}
                      options={[
                        ...(formData.department_id ? [{ value: "", label: "None (Unassigned)" }] : []),
                        ...departments.map((dept) => ({
                          value: String(dept.id),
                          label: `${dept.name} ${dept.code ? `(${dept.code})` : ""}`
                        }))
                      ]}
                      placeholder="Select Assigned Department..."
                      icon="bi bi-building"
                      fieldName="department_id"
                      isOpen={openDropdown === "department_id"}
                      onToggle={() => {
                        setActiveStep(2);
                        setOpenDropdown(openDropdown === "department_id" ? null : "department_id");
                        setFocusedField(openDropdown === "department_id" ? null : "department_id");
                      }}
                      onSelect={(val) => {
                        setFormData({ ...formData, department_id: val, supervisor_id: "" });
                        setOpenDropdown(null);
                        setFocusedField(null);
                      }}
                      isDocked={isFieldDocked("department_id")}
                    />

                    {/* Direct Supervisor (Reporting Line) (Modern Custom Dropdown) */}
                    <div className="md:col-span-2">
                      <CustomSelect
                        label="Direct Supervisor (Reporting Line)"
                        value={formData.supervisor_id}
                        options={[
                          ...(formData.supervisor_id ? [{ value: "", label: "None (Direct to HOD)" }] : []),
                          ...filteredSupervisors.map((sup) => ({
                            value: String(sup.id),
                            label: `${sup.name} (${sup.role === "manager" ? "Manager" : "Supervisor"} • ${sup.direct_reports_count || 0} reports)`
                          }))
                        ]}
                        placeholder="Select Direct Supervisor (or leave unassigned)..."
                        icon="bi bi-people"
                        fieldName="supervisor_id"
                        isOpen={openDropdown === "supervisor_id"}
                        onToggle={() => {
                          setActiveStep(2);
                          setOpenDropdown(openDropdown === "supervisor_id" ? null : "supervisor_id");
                          setFocusedField(openDropdown === "supervisor_id" ? null : "supervisor_id");
                        }}
                        onSelect={(val) => {
                          setFormData({ ...formData, supervisor_id: val });
                          setOpenDropdown(null);
                          setFocusedField(null);
                        }}
                        isDocked={isFieldDocked("supervisor_id")}
                      />
                      <p className="text-[10px] text-slate-400 font-normal mt-1 mb-0">
                        Establishes who approves leaves, reviews performance, and receives operational check-ins.
                      </p>
                    </div>

                    {/* HOD Checkbox Banner */}
                    <div className="md:col-span-2 bg-[#f0f6ff] p-2.5 rounded-xl border border-blue-200/70 flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id="is_hod_checkbox"
                        checked={formData.is_hod}
                        onChange={(e) => setFormData({ ...formData, is_hod: e.target.checked })}
                        className="rounded text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer h-3.5 w-3.5"
                      />
                      <label htmlFor="is_hod_checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-[11.5px]">
                          <span>👑</span>
                          <span>Designate as Apex Head of Department (HOD)</span>
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Appoints this member as the apex institutional authority for the selected department.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* SECTION 3: COMPENSATION & OPERATIONAL PROFILE             */}
                {/* ========================================================= */}
                <div
                  ref={section3Ref}
                  onClick={() => setActiveStep(3)}
                  className={`bg-slate-50/50 border border-slate-200/70 rounded-xl p-3.5 relative transition-all ${
                    openDropdown === "status" ? "z-40" : "z-10"
                  }`}
                >
                  {/* Top-Right Luminous Pastel Amber/Gold Wave Glow */}
                  <div className="absolute top-0 right-0 w-48 h-20 pointer-events-none overflow-hidden rounded-tr-xl">
                    <svg className="w-full h-full opacity-80" viewBox="0 0 200 80" preserveAspectRatio="none" fill="none">
                      <path d="M 0,0 C 70,50 130,65 200,15 L 200,0 Z" fill="url(#waveAmberGrad)" />
                      <defs>
                        <linearGradient id="waveAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.45" />
                          <stop offset="60%" stopColor="#fde68a" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#ffedd5" stopOpacity="0.65" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Section Header */}
                  <div className="relative z-10 flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#f59e0b] flex items-center justify-center text-white text-sm shrink-0 shadow-2xs">
                      <i className="bi bi-stack"></i>
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-0">
                        3. Compensation & Operational Profile
                      </h5>
                      <p className="text-[10px] text-slate-500 font-normal mb-0">
                        Salary, contact details, and account status.
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {/* Annual Salary (Normal Heading by Default, Smoothly Docks to Border when Typing/Filled) */}
                    <div className="relative pt-[20px]">
                      <label
                        className={`absolute left-2.5 transition-all duration-200 ease-out pointer-events-none select-none z-10 px-2 leading-none ${
                          isFieldDocked("salary")
                            ? `top-[12px] text-xs font-bold bg-white rounded-xs py-0.5 shadow-2xs ${focusedField === "salary" ? "text-[#4f46e5]" : "text-slate-700"}`
                            : "top-0 text-[11.5px] font-bold text-slate-800 bg-transparent"
                        }`}
                      >
                        Annual Salary ($)
                      </label>
                      <div
                        className={`relative flex items-center rounded-lg bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 ease-out px-2.5 shadow-2xs ${
                          isFieldDocked("salary") ? "h-11" : "h-9"
                        }`}
                      >
                        <span
                          className={`font-bold mr-2 shrink-0 transition-all duration-200 ${
                            isFieldDocked("salary") ? "text-sm text-indigo-500" : "text-xs text-slate-400"
                          }`}
                        >
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={formData.salary}
                          onFocus={() => {
                            setFocusedField("salary");
                            setActiveStep(3);
                          }}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          placeholder={isFieldDocked("salary") ? "" : "500.00"}
                          className={`w-full bg-transparent outline-none font-medium pt-0.5 transition-all duration-200 ${
                            isFieldDocked("salary") ? "text-[13.5px] text-slate-900" : "text-xs text-slate-800 placeholder:text-slate-300"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Contact Phone (Normal Heading by Default, Smoothly Docks to Border when Typing/Filled) */}
                    <div className="relative pt-[20px]">
                      <label
                        className={`absolute left-2.5 transition-all duration-200 ease-out pointer-events-none select-none z-10 px-2 leading-none ${
                          isFieldDocked("phone")
                            ? `top-[12px] text-xs font-bold bg-white rounded-xs py-0.5 shadow-2xs ${focusedField === "phone" ? "text-[#4f46e5]" : "text-slate-700"}`
                            : "top-0 text-[11.5px] font-bold text-slate-800 bg-transparent"
                        }`}
                      >
                        Contact Phone
                      </label>
                      <div
                        className={`relative flex items-center rounded-lg bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 ease-out px-2.5 shadow-2xs ${
                          isFieldDocked("phone") ? "h-11" : "h-9"
                        }`}
                      >
                        <i
                          className={`bi bi-telephone mr-2 shrink-0 transition-all duration-200 ${
                            isFieldDocked("phone") ? "text-sm text-indigo-500" : "text-xs text-slate-400"
                          }`}
                        ></i>
                        <input
                          type="tel"
                          value={formData.phone}
                          onFocus={() => {
                            setFocusedField("phone");
                            setActiveStep(3);
                          }}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={isFieldDocked("phone") ? "" : "+1 (555) 000-0000"}
                          className={`w-full bg-transparent outline-none font-medium pt-0.5 transition-all duration-200 ${
                            isFieldDocked("phone") ? "text-[13.5px] text-slate-900" : "text-xs text-slate-800 placeholder:text-slate-300"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Account Status (Modern Custom Dropdown) */}
                    <CustomSelect
                      label="Account Status"
                      required
                      value={formData.status}
                      options={[
                        { value: "active", label: "Active" },
                        { value: "inactive", label: "Inactive (Suspend)" }
                      ]}
                      placeholder="Select Account Status..."
                      icon="bi bi-key"
                      fieldName="status"
                      isOpen={openDropdown === "status"}
                      onToggle={() => {
                        setActiveStep(3);
                        setOpenDropdown(openDropdown === "status" ? null : "status");
                        setFocusedField(openDropdown === "status" ? null : "status");
                      }}
                      onSelect={(val) => {
                        setFormData({ ...formData, status: val });
                        setOpenDropdown(null);
                        setFocusedField(null);
                      }}
                      isDocked={isFieldDocked("status")}
                    />

                    {/* Office / Work Address (Normal Heading by Default, Smoothly Docks to Border when Typing/Filled) */}
                    <div className="md:col-span-3 relative pt-[20px]">
                      <label
                        className={`absolute left-2.5 transition-all duration-200 ease-out pointer-events-none select-none z-10 px-2 leading-none ${
                          isFieldDocked("address")
                            ? `top-[12px] text-xs font-bold bg-white rounded-xs py-0.5 shadow-2xs ${focusedField === "address" ? "text-[#4f46e5]" : "text-slate-700"}`
                            : "top-0 text-[11.5px] font-bold text-slate-800 bg-transparent"
                        }`}
                      >
                        Office / Work Address
                      </label>
                      <div
                        className={`relative flex items-center rounded-lg bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 ease-out px-2.5 shadow-2xs ${
                          isFieldDocked("address") ? "h-11" : "h-9"
                        }`}
                      >
                        <i
                          className={`bi bi-geo-alt mr-2 shrink-0 transition-all duration-200 ${
                            isFieldDocked("address") ? "text-sm text-indigo-500" : "text-xs text-slate-400"
                          }`}
                        ></i>
                        <input
                          type="text"
                          value={formData.address}
                          onFocus={() => {
                            setFocusedField("address");
                            setActiveStep(3);
                          }}
                          onBlur={() => setFocusedField(null)}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder={isFieldDocked("address") ? "" : "e.g. Building 4, Floor 3, Suite 302, San Francisco, CA"}
                          className={`w-full bg-transparent outline-none font-medium pt-0.5 transition-all duration-200 ${
                            isFieldDocked("address") ? "text-[13.5px] text-slate-900" : "text-xs text-slate-800 placeholder:text-slate-300"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* MODAL FOOTER CONTROLS: Cancel & Save Changes             */}
              {/* ========================================================= */}
              <div className="shrink-0 px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-white">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#6366f1] hover:bg-indigo-600 transition-all flex items-center gap-1.5 shadow-xs shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2 text-sm font-bold"></i>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
