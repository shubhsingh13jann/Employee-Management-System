import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./EnterpriseIdBadgeModal.css";

export interface EnterpriseIdBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    email: string;
    role?: string;
    department_name?: string;
    department_code?: string;
    phone?: string;
    image_url?: string;
    created_at?: string;
    is_hod?: boolean;
    status?: string;
  } | null;
}

type ThemeKey = "cyber" | "gold" | "frost" | "emerald" | "violet";
type HoloKey = "holo-prism" | "holo-grid" | "holo-cyber" | "holo-waves" | "none";
type AvatarPreset = "photo" | "initials" | "user" | "shield";
type BarcodeType = "linear" | "qr";
type StatusType = "ACTIVE" | "ON-SITE" | "RESTRICTED" | "VIP ACCESS";

interface ThemeConfig {
  name: string;
  badgeBg: string;
  logoBg: string;
  avatarRing: string;
  topBar: string;
  glow1: string;
  glow2: string;
  accentText: string;
  roleBadge: string;
  previewGradient: string;
}

const THEMES: Record<ThemeKey, ThemeConfig> = {
  cyber: {
    name: "Cyber Neon",
    badgeBg: "bg-slate-950",
    logoBg: "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-indigo-500/30",
    avatarRing: "bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-indigo-500/25",
    topBar: "bg-gradient-to-r from-cyan-400 via-indigo-500 to-fuchsia-500",
    glow1: "bg-indigo-500/25",
    glow2: "bg-fuchsia-500/20",
    accentText: "text-indigo-400",
    roleBadge: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300",
    previewGradient: "from-cyan-500 via-indigo-500 to-fuchsia-500",
  },
  gold: {
    name: "Executive Gold",
    badgeBg: "bg-slate-950",
    logoBg: "bg-gradient-to-tr from-amber-600 via-yellow-500 to-amber-400 text-slate-950 shadow-amber-500/30",
    avatarRing: "bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 shadow-amber-500/20",
    topBar: "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-600",
    glow1: "bg-amber-500/20",
    glow2: "bg-yellow-600/15",
    accentText: "text-amber-400",
    roleBadge: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    previewGradient: "from-amber-400 via-yellow-500 to-amber-700",
  },
  frost: {
    name: "Pearl Light",
    badgeBg: "bg-[#0b1021]",
    logoBg: "bg-gradient-to-tr from-slate-200 via-sky-300 to-indigo-400 text-slate-900 shadow-indigo-200/30",
    avatarRing: "bg-gradient-to-br from-slate-100 via-indigo-300 to-sky-400 shadow-indigo-300/20",
    topBar: "bg-gradient-to-r from-slate-100 via-indigo-300 to-sky-300",
    glow1: "bg-slate-300/20",
    glow2: "bg-indigo-400/20",
    accentText: "text-sky-300",
    roleBadge: "bg-sky-500/15 border-sky-500/30 text-sky-200",
    previewGradient: "from-slate-200 via-sky-300 to-indigo-400",
  },
  emerald: {
    name: "Security Emerald",
    badgeBg: "bg-slate-950",
    logoBg: "bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-emerald-500/30",
    avatarRing: "bg-gradient-to-br from-emerald-300 via-teal-500 to-emerald-700 shadow-emerald-500/20",
    topBar: "bg-gradient-to-r from-emerald-300 via-teal-400 to-emerald-600",
    glow1: "bg-emerald-500/20",
    glow2: "bg-teal-600/20",
    accentText: "text-emerald-400",
    roleBadge: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    previewGradient: "from-emerald-400 via-teal-500 to-emerald-700",
  },
  violet: {
    name: "Deep Ultraviolet",
    badgeBg: "bg-slate-950",
    logoBg: "bg-gradient-to-tr from-purple-700 via-violet-600 to-indigo-500 text-white shadow-purple-500/30",
    avatarRing: "bg-gradient-to-br from-purple-400 via-indigo-500 to-purple-800 shadow-purple-500/20",
    topBar: "bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-700",
    glow1: "bg-purple-600/25",
    glow2: "bg-indigo-600/20",
    accentText: "text-purple-400",
    roleBadge: "bg-purple-500/15 border-purple-500/30 text-purple-300",
    previewGradient: "from-purple-500 via-violet-600 to-indigo-700",
  },
};

export const EnterpriseIdBadgeModal: React.FC<EnterpriseIdBadgeModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  // References for 3D gyro tilt and interactive holography
  const badgeContainerRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const holoLayerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form & Badge State
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [personnelId, setPersonnelId] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [validity, setValidity] = useState<string>("");
  const [status, setStatus] = useState<StatusType>("ACTIVE");
  const [barcodeType, setBarcodeType] = useState<BarcodeType>("linear");
  const [holoEffect, setHoloEffect] = useState<HoloKey>("holo-prism");
  const [theme, setTheme] = useState<ThemeKey>("cyber");
  const [avatarType, setAvatarType] = useState<AvatarPreset>("photo");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Interaction State
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(true);
  const [nfcActive, setNfcActive] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" } | null>(null);

  // Reset or initialize state whenever modal opens or user prop changes
  useEffect(() => {
    if (user && isOpen) {
      const formattedId = `EMS-${String(user.id).padStart(4, "0")}`;
      const joinYear = user.created_at
        ? new Date(user.created_at).getFullYear()
        : new Date().getFullYear();
      const validPeriod = `${joinYear} - ${joinYear + 3}`;

      setName(user.name || "Employee Name");
      setRole(user.role ? user.role.toUpperCase() : "EMPLOYEE");
      setPersonnelId(formattedId);
      setDepartment(user.department_name || "Operations");
      setValidity(validPeriod);
      setStatus(
        user.status?.toUpperCase() === "SUSPENDED" || user.status?.toUpperCase() === "RESTRICTED"
          ? "RESTRICTED"
          : "ACTIVE"
      );
      setBarcodeType("linear");
      setHoloEffect("holo-prism");
      setTheme("cyber");
      setIsFlipped(false);

      if (user.image_url) {
        setCustomAvatar(user.image_url);
        setAvatarType("photo");
      } else {
        setCustomAvatar(null);
        setAvatarType("initials");
      }
    }
  }, [user, isOpen]);

  // Escape key listener for clean closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Auto-dismiss toast helper
  const showToast = (message: string, type: "info" | "success" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  if (!isOpen || !user) return null;

  const currentTheme = THEMES[theme];

  // 3D Gyroscope Mouse Movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!badgeContainerRef.current || !cardInnerRef.current) return;
    const rect = badgeContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -9;
    const rotateY = ((x - centerX) / centerX) * 9;

    if (isFlipped) {
      cardInnerRef.current.style.transform = `rotateY(180deg) rotateX(${rotateX}deg) rotateY(${-rotateY}deg)`;
    } else {
      cardInnerRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    }

    if (holoLayerRef.current) {
      const moveX = (x / rect.width) * 100;
      const moveY = (y / rect.height) * 100;
      holoLayerRef.current.style.backgroundPosition = `${moveX}% ${moveY}%`;
      holoLayerRef.current.style.opacity = "0.75";
    }
  };

  const handleMouseLeave = () => {
    if (!cardInnerRef.current) return;
    cardInnerRef.current.style.transform = isFlipped ? "rotateY(180deg)" : "rotateX(0deg) rotateY(0deg)";
    if (holoLayerRef.current) {
      holoLayerRef.current.style.opacity = "0.45";
    }
  };

  // Flip Card Action
  const toggleFlip = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    if (cardInnerRef.current) {
      cardInnerRef.current.style.transform = nextFlipped ? "rotateY(180deg)" : "rotateX(0deg) rotateY(0deg)";
    }
    showToast(nextFlipped ? "Flipped to Back Side" : "Flipped to Front Side", "info");
  };

  // Custom Avatar Upload
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomAvatar(reader.result as string);
        setAvatarType("photo");
        showToast("Custom photo uploaded successfully", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  // NFC Tap Simulation
  const handleNfcTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNfcActive(true);
    showToast("NFC Scan Signal Transmitted (UID: " + personnelId + ")", "success");
    setTimeout(() => {
      setNfcActive(false);
    }, 1200);
  };

  // Copy ID
  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(personnelId);
      showToast(`Personnel ID (${personnelId}) copied to clipboard`, "success");
    }
  };

  // Print Badge
  const handlePrint = () => {
    showToast("Opening system print dialog...", "info");
    setTimeout(() => {
      window.print();
    }, 400);
  };

  // Add to Mobile Wallet (.pkpass simulation)
  const handleDownloadWalletPass = () => {
    const passData = {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.enterprise.ems.identity",
      serialNumber: personnelId,
      teamIdentifier: "ENTEMS",
      organizationName: "Enterprise EMS Security",
      description: "Digital Employee Identity Credential",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(15, 23, 42)",
      employeeDetails: {
        name,
        role,
        personnelId,
        department,
        validity,
        status,
      },
    };

    const blob = new Blob([JSON.stringify(passData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${personnelId}-identity-credential.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Mobile Pass metadata (.pkpass) exported successfully", "success");
  };

  // Reset to Defaults
  const resetBadgeData = () => {
    const formattedId = `EMS-${String(user.id).padStart(4, "0")}`;
    const joinYear = user.created_at
      ? new Date(user.created_at).getFullYear()
      : new Date().getFullYear();

    setName(user.name || "Employee Name");
    setRole(user.role ? user.role.toUpperCase() : "EMPLOYEE");
    setPersonnelId(formattedId);
    setDepartment(user.department_name || "Operations");
    setValidity(`${joinYear} - ${joinYear + 3}`);
    setStatus("ACTIVE");
    setBarcodeType("linear");
    setHoloEffect("holo-prism");
    setTheme("cyber");
    setIsFlipped(false);

    if (user.image_url) {
      setCustomAvatar(user.image_url);
      setAvatarType("photo");
    } else {
      setCustomAvatar(null);
      setAvatarType("initials");
    }

    if (cardInnerRef.current) {
      cardInnerRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
    }

    showToast("Reset to default credential details", "info");
  };

  // Status Styling Badge
  const getStatusBadgeClasses = () => {
    switch (status) {
      case "ACTIVE":
      case "ON-SITE":
        return {
          pill: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
          dot: "bg-emerald-400",
        };
      case "RESTRICTED":
        return {
          pill: "bg-amber-500/10 border-amber-500/40 text-amber-400",
          dot: "bg-amber-400",
        };
      case "VIP ACCESS":
        return {
          pill: "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-400",
          dot: "bg-fuchsia-400",
        };
      default:
        return {
          pill: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
          dot: "bg-emerald-400",
        };
    }
  };

  const statusStyle = getStatusBadgeClasses();

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overscroll-contain transition-all"
      onClick={onClose}
    >
      {/* MAIN CONTAINER MODAL */}
      <div
        className={`w-full ${
          isEditorOpen ? "max-w-[760px]" : "max-w-[360px]"
        } badge-glass-panel rounded-3xl shadow-2xl border border-slate-700/60 flex flex-col my-auto transition-all duration-300 overflow-hidden text-slate-100`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 gap-2">
          {/* Left: Enterprise Pass Badge */}
          <div className="flex items-center justify-start shrink-0">
            <span className={`${isEditorOpen ? "inline-flex" : "hidden sm:inline-flex"} px-2 py-0.5 sm:py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider items-center gap-1 shadow-2xs whitespace-nowrap`}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0"></span>
              ENTERPRISE PASS
            </span>
          </div>

          {/* Center: Security ID Portal Heading (Centered) */}
          <div className="flex-1 flex items-center justify-center text-center">
            <div
              style={{ fontSize: "14.5px", lineHeight: "1.25" }}
              className="security-id-portal-heading font-extrabold tracking-normal text-slate-100 flex items-center justify-center gap-1.5 mb-0 whitespace-nowrap"
            >
              <i className="bi bi-shield-check text-indigo-400 text-sm shrink-0"></i>
              <span>Security ID Portal</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 justify-end">
            {/* Toggle Customizer Drawer */}
            <button
              type="button"
              onClick={() => setIsEditorOpen(!isEditorOpen)}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-200 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-xl transition flex items-center gap-1 shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <i className="bi bi-sliders text-indigo-400 shrink-0 text-xs"></i>
              <span className="whitespace-nowrap">{isEditorOpen ? "Hide Customizer" : "Customize"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 sm:p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Close modal"
            >
              <i className="bi bi-x-lg text-sm sm:text-base"></i>
            </button>
          </div>
        </div>

        {/* MAIN CONTENT SPLIT LAYOUT */}
        <div className="p-3.5 sm:p-5 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 sm:gap-5 relative bg-slate-950/70 overflow-hidden">
          
          {/* LEFT CUSTOMIZATION DRAWER PANEL */}
          {isEditorOpen && (
            <div className="w-full lg:w-[340px] h-fit self-start badge-glass-panel rounded-2xl p-3.5 sm:p-4 border border-slate-800/90 space-y-3.5 text-xs max-h-[580px] overflow-y-auto badge-custom-scrollbar transition-all duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
                <div
                  style={{ fontSize: "14.5px", lineHeight: "1.25" }}
                  className="badge-customizer-heading font-extrabold tracking-normal text-slate-100 flex items-center gap-1.5 mb-0 whitespace-nowrap shrink-0"
                >
                  <i className="bi bi-magic text-indigo-400 text-sm shrink-0"></i>
                  <span>Badge Customizer</span>
                </div>
                <button
                  type="button"
                  onClick={resetBadgeData}
                  className="text-[10px] sm:text-[10.5px] text-indigo-400 hover:text-indigo-300 font-medium hover:underline cursor-pointer whitespace-nowrap shrink-0"
                >
                  Reset Defaults
                </button>
              </div>

              {/* Theme Presets */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Color Theme Preset</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(THEMES) as ThemeKey[]).map((tKey) => (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => {
                        setTheme(tKey);
                        showToast(`Theme changed to ${THEMES[tKey].name}`, "success");
                      }}
                      title={THEMES[tKey].name}
                      className={`h-8 rounded-lg bg-gradient-to-r ${THEMES[tKey].previewGradient} border ${
                        theme === tKey ? "ring-2 ring-white border-white scale-105" : "border-white/20"
                      } hover:scale-105 transition cursor-pointer`}
                    />
                  ))}
                </div>
              </div>

              {/* Avatar Photo & Presets */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Profile Avatar / Photo</label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <i className="bi bi-upload text-indigo-400"></i>
                    Upload Photo
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAvatarType("initials")}
                      title="Initial Letter"
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border cursor-pointer ${
                        avatarType === "initials"
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {name ? name.charAt(0).toUpperCase() : "A"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarType("user")}
                      title="User Icon"
                      className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center border cursor-pointer ${
                        avatarType === "user"
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <i className="bi bi-person-fill"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarType("shield")}
                      title="Security Shield"
                      className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center border cursor-pointer ${
                        avatarType === "shield"
                          ? "bg-indigo-600 text-white border-indigo-400"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <i className="bi bi-shield-lock-fill"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Holographic Overlay Effect */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Holographic Effect Overlay</label>
                <select
                  value={holoEffect}
                  onChange={(e) => {
                    const val = e.target.value as HoloKey;
                    setHoloEffect(val);
                    showToast(`Hologram effect: ${val}`, "info");
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="holo-prism">Prism Light Reflex (Default)</option>
                  <option value="holo-grid">Security Micro Grid</option>
                  <option value="holo-cyber">Cyber Scan Stripe</option>
                  <option value="holo-waves">Quantum Waves</option>
                  <option value="none">None (Clean Glass)</option>
                </select>
              </div>

              {/* Personal Info Input Fields */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-semibold focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Role Title</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 uppercase focus:outline-hidden focus:border-indigo-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Personnel ID</label>
                    <input
                      type="text"
                      value={personnelId}
                      onChange={(e) => setPersonnelId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-hidden focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Validity</label>
                    <input
                      type="text"
                      value={validity}
                      onChange={(e) => setValidity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-hidden focus:border-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Status Badge</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StatusType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer text-xs"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ON-SITE">ON-SITE</option>
                      <option value="RESTRICTED">RESTRICTED</option>
                      <option value="VIP ACCESS">VIP ACCESS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Barcode Type</label>
                    <select
                      value={barcodeType}
                      onChange={(e) => setBarcodeType(e.target.value as BarcodeType)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-indigo-500 cursor-pointer text-xs"
                    >
                      <option value="linear">Linear Barcode</option>
                      <option value="qr">Scannable QR</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CENTER DISPLAY: 3D DIGITAL ID BADGE CARD */}
          <div className="flex-initial flex flex-col items-center justify-center relative">
            
            {/* CARD PERSPECTIVE CONTAINER */}
            <div
              ref={badgeContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="badge-perspective-viewport w-[265px] sm:w-[280px] h-[470px] relative select-none"
            >
              {/* 3D FLIPPABLE WRAPPER */}
              <div
                ref={cardInnerRef}
                onClick={toggleFlip}
                className={`badge-3d-wrapper shadow-2xl rounded-3xl ${isFlipped ? "is-flipped" : ""}`}
              >
                {/* ================= CARD FRONT ================= */}
                <div
                  id="printable-badge-area"
                  className={`badge-card-face ${currentTheme.badgeBg} border border-slate-800 flex flex-col justify-between p-4 sm:p-4.5 shadow-2xl relative cursor-pointer`}
                >
                  {/* Ambient Glow Overlay */}
                  <div className={`absolute -top-24 -left-24 w-52 h-52 ${currentTheme.glow1} rounded-full blur-3xl pointer-events-none`}></div>
                  <div className={`absolute -bottom-24 -right-24 w-52 h-52 ${currentTheme.glow2} rounded-full blur-3xl pointer-events-none`}></div>

                  {/* Top Gradient Line Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${currentTheme.topBar}`}></div>

                  {/* Holographic Reflective Effect Layer */}
                  <div
                    ref={holoLayerRef}
                    className={`absolute inset-0 rounded-3xl opacity-45 z-20 pointer-events-none ${
                      holoEffect === "none" ? "" : holoEffect
                    }`}
                  ></div>

                  {/* HEADER: LOGO, STATUS & ACCENT LINE */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-xl ${currentTheme.logoBg} flex items-center justify-center font-black text-base shadow-lg shrink-0`}>
                          E
                        </div>
                        <div>
                          <div className="text-[10.5px] font-extrabold tracking-wider text-slate-100 uppercase leading-none">
                            ENTERPRISE EMS
                          </div>
                          <div className="text-[8px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5">
                            SECURITY CREDENTIAL
                          </div>
                        </div>
                      </div>

                      <div className={`px-2 py-0.5 rounded-full border font-mono text-[8.5px] font-bold tracking-wider flex items-center gap-1 shadow-2xs shrink-0 ${statusStyle.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} animate-pulse`}></span>
                        <span>{status}</span>
                      </div>
                    </div>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent mt-2 relative z-10"></div>
                  </div>

                  {/* AVATAR SECTION */}
                  <div className="relative z-10 flex flex-col items-center my-0.5">
                    <div className="relative">
                      {/* Dynamic Avatar Outer Ring */}
                      <div className={`w-20 h-20 rounded-2xl p-[2px] ${currentTheme.avatarRing} shadow-xl`}>
                        <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center backdrop-blur-sm overflow-hidden relative">
                          {avatarType === "photo" && customAvatar ? (
                            <img
                              src={customAvatar}
                              alt={name}
                              className="w-full h-full object-cover rounded-[14px]"
                            />
                          ) : avatarType === "user" ? (
                            <i className="bi bi-person-fill text-2xl text-indigo-300"></i>
                          ) : avatarType === "shield" ? (
                            <i className="bi bi-shield-fill-check text-2xl text-cyan-300"></i>
                          ) : (
                            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-cyan-300 via-slate-100 to-fuchsia-300">
                              {name ? name.charAt(0).toUpperCase() : "A"}
                            </span>
                          )}
                        </div>
                      </div>

                      {Boolean(user.is_hod) && (
                        <div className="absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-black bg-amber-400 text-slate-950 shadow-md flex items-center gap-0.5">
                          <span>👑</span> HOD
                        </div>
                      )}
                    </div>

                    {/* Employee Name & Role */}
                    <div className="text-center mt-2.5">
                      <h2 className="text-lg font-extrabold text-slate-100 tracking-tight leading-snug mb-0 max-w-[240px] truncate">
                        {name}
                      </h2>
                      <div className="mt-1">
                        <span className={`px-2.5 py-0.5 rounded-md border text-[9.5px] font-mono font-bold tracking-widest uppercase ${currentTheme.roleBadge}`}>
                          {role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DETAILS TABLE */}
                  <div className="relative z-10 bg-slate-900/85 rounded-xl border border-slate-800/90 p-2.5 space-y-1.5 text-xs backdrop-blur-md">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10.5px] font-medium">Personnel ID:</span>
                      <span className="font-mono font-bold text-slate-100 text-[10.5px] tracking-wide">
                        {personnelId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10.5px] font-medium">Department:</span>
                      <span className="font-bold text-slate-200 text-[10.5px] truncate max-w-[140px]">
                        {department}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10.5px] font-medium">Validity:</span>
                      <span className="font-mono text-slate-300 text-[10.5px]">{validity}</span>
                    </div>
                  </div>

                  {/* SCANNABLE BARCODE / QR FOOTER */}
                  <div className="relative z-10 flex flex-col items-center pt-1.5">
                    {barcodeType === "linear" ? (
                      <div className="w-full flex flex-col items-center">
                        <div className="w-full h-7 barcode-lines-pattern rounded opacity-85"></div>
                        <div className="text-[8.5px] font-mono text-slate-400 tracking-widest mt-0.5">
                          *{personnelId}*
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="p-1 bg-white rounded-lg shadow-sm">
                          <svg className="w-8 h-8 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                            <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,10 h10 v10 h-10 z M40,40 h20 v20 h-20 z M70,40 h10 v10 h-10 z M10,40 h10 v20 h-10 z M40,70 h20 v10 h-20 z M70,70 h20 v20 h-20 z M80,80 h10 v10 h-10 z"/>
                          </svg>
                        </div>
                        <div className="text-[8px] font-mono text-slate-400 tracking-widest mt-0.5">
                          *{personnelId}*
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FLIP TIP HINT */}
                  <div className="text-center pointer-events-none z-10 pb-0.5">
                    <span className="text-[7.5px] text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
                      <i className="bi bi-arrow-repeat text-[7.5px]"></i> Click card to flip
                    </span>
                  </div>
                </div>

                {/* ================= CARD BACK ================= */}
                <div
                  className="badge-card-face badge-card-face-back bg-slate-950 border border-slate-800 flex flex-col justify-between p-4 sm:p-4.5 shadow-2xl relative cursor-pointer"
                  onClick={toggleFlip}
                >
                  {/* Magnetic Stripe Simulation */}
                  <div className="absolute top-4 left-0 right-0 h-8 bg-slate-900 border-y border-slate-800 flex items-center px-4">
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-700/40 via-amber-500/20 to-amber-700/40 rounded-xs"></div>
                  </div>

                  {/* Back Content */}
                  <div className="pt-11 space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Encrypted Security QR
                        </h4>
                        <div className="p-2 bg-white rounded-xl inline-block shadow-lg">
                          <svg className="w-14 h-14 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                            <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,10 h10 v10 h-10 z M40,40 h20 v20 h-20 z M70,40 h10 v10 h-10 z M10,40 h10 v20 h-10 z M40,70 h20 v10 h-20 z M70,70 h20 v20 h-20 z M80,80 h10 v10 h-10 z"/>
                          </svg>
                        </div>
                      </div>

                      {/* Interactive RFID / NFC Tap Chip */}
                      <div
                        onClick={handleNfcTap}
                        className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group"
                      >
                        <div
                          className={`w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition ${
                            nfcActive ? "animate-ping" : ""
                          }`}
                        >
                          <i className="bi bi-wifi text-sm rotate-90"></i>
                        </div>
                        <span className="text-[7.5px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                          Tap NFC Scan
                        </span>
                      </div>
                    </div>

                    <div className="text-[9.5px] text-slate-400 space-y-1 leading-snug border-t border-slate-800 pt-2.5">
                      <p className="font-semibold text-slate-300 mb-0">
                        Property of Enterprise EMS Security
                      </p>
                      <p className="mb-0 text-[8.5px]">
                        If found, please return to any EMS Security Desk or mail to Headquarters.
                      </p>
                      <p className="font-mono text-slate-500 text-[8px] mb-0">
                        24/7 Hotline: +1 (800) 555-0199
                      </p>
                    </div>
                  </div>

                  {/* Digital Signature Line */}
                  <div className="relative z-10 border-t border-slate-800 pt-1.5 flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[8.5px] italic text-indigo-300 tracking-wider">
                        {name} (Signed)
                      </div>
                      <div className="text-[7px] text-slate-500 uppercase tracking-widest">
                        Authorized Signature
                      </div>
                    </div>
                    <i className="bi bi-patch-check-fill text-indigo-400 text-xs"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD CONTROL BUTTONS */}
            <div className="flex items-center gap-2.5 mt-3 z-20">
              <button
                type="button"
                onClick={toggleFlip}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <i className="bi bi-arrow-repeat text-indigo-400"></i>
                <span>Flip Badge</span>
              </button>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700/80 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <i className="bi bi-clipboard text-indigo-400"></i>
                <span>Copy ID</span>
              </button>
            </div>

          </div>

        </div>

        {/* MODAL FOOTER BAR */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-800/80 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400">
            <i className="bi bi-check-circle-fill text-emerald-400"></i>
            <span>Ready for printer output (PDF / Physical Badge)</span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700/60 shadow-2xs cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownloadWalletPass}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 text-xs font-bold transition border border-slate-600/50 flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <i className="bi bi-wallet2 text-indigo-400 text-sm"></i>
              <span>Add to Mobile Wallet</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
            >
              <i className="bi bi-printer-fill text-sm"></i>
              <span>Print Badge</span>
            </button>
          </div>
        </div>

      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 badge-glass-panel px-4 py-3 rounded-xl border border-indigo-500/30 text-xs font-semibold text-slate-100 flex items-center gap-2.5 shadow-2xl z-[10000] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200">
          <i
            className={`bi ${
              toast.type === "success" ? "bi-check-circle-fill text-emerald-400" : "bi-info-circle-fill text-indigo-400"
            } text-sm`}
          ></i>
          <span>{toast.message}</span>
        </div>
      )}
    </div>,
    document.body
  );
};

export default EnterpriseIdBadgeModal;
