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

export interface PaletteSlot {
  id: string;
  name: string;
  c1: string;
  c2: string;
}

export const DEFAULT_PALETTES: PaletteSlot[] = [
  { id: "p1", name: "Cyber Neon", c1: "#6366f1", c2: "#06b6d4" },
  { id: "p2", name: "Executive Gold", c1: "#f59e0b", c2: "#d97706" },
  { id: "p3", name: "Emerald Mint", c1: "#059669", c2: "#10b981" },
  { id: "p4", name: "Royal Purple", c1: "#8b5cf6", c2: "#ec4899" },
];

export type ThemeKey = "p1" | "p2" | "p3" | "p4" | "custom";
export type HoloKey = "holo-prism" | "holo-grid" | "holo-cyber" | "holo-waves" | "none";
export type AvatarPreset = "photo" | "initials" | "user" | "shield";
export type BarcodeType = "linear" | "qr";
export type StatusType = "ACTIVE" | "ON-SITE" | "RESTRICTED" | "VIP ACCESS";

export type CardBackgroundType =
  | "obsidian"
  | "ceramic"
  | "frosted"
  | "guilloche"
  | "aurora"
  | "titanium";

export interface CardBackgroundPreset {
  id: CardBackgroundType;
  name: string;
  subtitle: string;
  description: string;
  isLight: boolean;
  previewClass: string;
}

export const CARD_BACKGROUNDS: CardBackgroundPreset[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    subtitle: "Stealth Dark",
    description: "Executive Matte Carbon Obsidian",
    isLight: false,
    previewClass: "badge-bg-obsidian border-slate-700",
  },
  {
    id: "ceramic",
    name: "Ceramic",
    subtitle: "Alpine White",
    description: "Clean Minimalist Porcelain White",
    isLight: true,
    previewClass: "badge-bg-ceramic border-slate-300",
  },
  {
    id: "frosted",
    name: "Frosted",
    subtitle: "Glassmorphic",
    description: "Translucent Polycarbonate Glass",
    isLight: false,
    previewClass: "badge-bg-frosted border-cyan-400/40",
  },
  {
    id: "guilloche",
    name: "Guilloché",
    subtitle: "Security Wave",
    description: "Geometric Anti-Counterfeit Matrix",
    isLight: false,
    previewClass: "badge-preview-guilloche border-indigo-700",
  },
  {
    id: "aurora",
    name: "Aurora",
    subtitle: "Mesh Flow",
    description: "Vibrant Dynamic Prismatic Mesh",
    isLight: false,
    previewClass: "badge-preview-aurora border-slate-600",
  },
  {
    id: "titanium",
    name: "Titanium",
    subtitle: "Brushed Metal",
    description: "Executive Brushed Platinum Metallic",
    isLight: false,
    previewClass: "badge-preview-titanium border-slate-500",
  },
];

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form & Badge State
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [personnelId, setPersonnelId] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [validity, setValidity] = useState<string>("");
  const [status, setStatus] = useState<StatusType>("ACTIVE");
  const [barcodeType, setBarcodeType] = useState<BarcodeType>("linear");
  const [holoEffect, setHoloEffect] = useState<HoloKey>("holo-prism");
  const [cardBg, setCardBg] = useState<CardBackgroundType>("obsidian");
  const [palettes, setPalettes] = useState<PaletteSlot[]>(() => {
    try {
      const saved = localStorage.getItem("ems_id_badge_palettes");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      }
    } catch {}
    return DEFAULT_PALETTES;
  });
  const [theme, setTheme] = useState<ThemeKey>("p1");
  const [customColor1, setCustomColor1] = useState<string>("#6366f1");
  const [customColor2, setCustomColor2] = useState<string>("#06b6d4");
  const [avatarType, setAvatarType] = useState<AvatarPreset>("photo");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  // Interaction State
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const isFlippedRef = useRef<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(true);
  const [nfcActive, setNfcActive] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null);

  // Active gradient colors
  const activeColors = React.useMemo(() => {
    if (theme === "custom") {
      return { c1: customColor1, c2: customColor2, name: "Custom Blend" };
    }
    const found = palettes.find((p) => p.id === theme);
    return found
      ? { c1: found.c1, c2: found.c2, name: found.name }
      : { c1: palettes[0].c1, c2: palettes[0].c2, name: palettes[0].name };
  }, [theme, customColor1, customColor2, palettes]);

  // Click outside to close triple-dots menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        menuDropdownRef.current &&
        !menuDropdownRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  // Reset or initialize state whenever modal opens or user prop changes
  useEffect(() => {
    if (user && isOpen) {
      const formattedId = `EMS-${String(user.id).padStart(4, "0")}`;
      const joinYear = user.created_at
        ? new Date(user.created_at).getFullYear()
        : new Date().getFullYear();
      const validPeriod = `${joinYear} - ${joinYear + 3}`;

      // Check if user has previously saved badge config
      let savedConfig: any = null;
      try {
        const raw = localStorage.getItem(`ems_badge_saved_${user.id}`);
        if (raw) savedConfig = JSON.parse(raw);
      } catch {}

      if (savedConfig) {
        setName(savedConfig.name || user.name || "Employee Name");
        setRole(savedConfig.role || (user.role ? user.role.toUpperCase() : "EMPLOYEE"));
        setPersonnelId(savedConfig.personnelId || formattedId);
        setDepartment(savedConfig.department || user.department_name || "Operations");
        setValidity(savedConfig.validity || validPeriod);
        setStatus(savedConfig.status || "ACTIVE");
        setBarcodeType(savedConfig.barcodeType || "linear");
        setHoloEffect(savedConfig.holoEffect || "holo-prism");
        setCardBg(savedConfig.cardBg || "obsidian");
        setTheme(savedConfig.theme || "p1");
        if (savedConfig.customColor1) setCustomColor1(savedConfig.customColor1);
        if (savedConfig.customColor2) setCustomColor2(savedConfig.customColor2);
        setAvatarType(savedConfig.avatarType || (user.image_url ? "photo" : "initials"));
        setCustomAvatar(savedConfig.customAvatar || user.image_url || null);
      } else {
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
        setCardBg("obsidian");
        setTheme("p1");
        setCustomColor1(palettes[0].c1);
        setCustomColor2(palettes[0].c2);

        if (user.image_url) {
          setCustomAvatar(user.image_url);
          setAvatarType("photo");
        } else {
          setCustomAvatar(null);
          setAvatarType("initials");
        }
      }
      setIsFlipped(false);
      isFlippedRef.current = false;
      setIsMenuOpen(false);
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

  // Interactive Cosmic Constellation Background Animation
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const mouse = {
      x: null as number | null,
      y: null as number | null,
      radius: 175,
    };

    const particleCount = 75;
    const maxDistance = 145;

    // Color palette for nodes and connecting lines
    const colors = [
      "rgba(99, 102, 241, ", // Indigo
      "rgba(6, 182, 212, ",  // Cyan
      "rgba(168, 85, 247, ", // Purple
      "rgba(236, 72, 153, ", // Pink
    ];

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseColor: string;
      pulseSpeed: number;
      pulseAngle: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * (w || 400);
        this.y = Math.random() * (h || 600);
        this.vx = (Math.random() - 0.5) * 0.75;
        this.vy = (Math.random() - 0.5) * 0.75;
        this.radius = Math.random() * 2 + 1.3;
        this.baseColor = colors[Math.floor(Math.random() * colors.length)];
        this.pulseSpeed = Math.random() * 0.03 + 0.01;
        this.pulseAngle = Math.random() * Math.PI * 2;
      }

      update(w: number, h: number) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off canvas edges
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;

        // Keep inside bounds if container shrinks
        if (this.x > w) this.x = Math.random() * w;
        if (this.y > h) this.y = Math.random() * h;
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;

        // Gentle pulse size oscillation
        this.pulseAngle += this.pulseSpeed;

        // Mouse reaction (smooth push away)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius && dist > 0) {
            const angle = Math.atan2(dy, dx);
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= Math.cos(angle) * force * 2.2;
            this.y -= Math.sin(angle) * force * 2.2;
          }
        }
      }

      draw(c: CanvasRenderingContext2D) {
        const currentRadius = Math.max(0.6, this.radius + Math.sin(this.pulseAngle) * 0.75);

        c.save();
        // Glow effect around particle
        c.beginPath();
        c.arc(this.x, this.y, currentRadius * 2.6, 0, Math.PI * 2);
        c.fillStyle = this.baseColor + "0.15)";
        c.fill();

        // Core particle dot
        c.beginPath();
        c.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
        c.fillStyle = this.baseColor + "0.95)";
        c.shadowColor = this.baseColor + "1)";
        c.shadowBlur = 10;
        c.fill();
        c.restore();
      }
    }

    let particles: Particle[] = [];

    const resize = () => {
      const container = canvas.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;

      // Fill background
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, width, height);

      if (particles.length === 0) {
        for (let i = 0; i < particleCount; i++) {
          particles.push(new Particle(width, height));
        }
      }
    };

    resize();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.35;

            // Gradient line between connected nodes
            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            grad.addColorStop(0, p1.baseColor + alpha + ")");
            grad.addColorStop(1, p2.baseColor + alpha + ")");

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    };

    const animate = () => {
      // Clear with soft trails
      ctx.fillStyle = "rgba(3, 7, 18, 0.25)";
      ctx.fillRect(0, 0, width, height);

      // Draw lines between nodes
      drawConnections();

      // Update and draw nodes
      particles.forEach((p) => {
        p.update(width, height);
        p.draw(ctx);
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      } else {
        mouse.x = null;
        mouse.y = null;
      }
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isOpen]);

  // Auto-dismiss toast helper
  const showToast = (message: string, type: "info" | "success" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  if (!isOpen || !user) return null;

  const isLightBg = cardBg === "ceramic";

  const currentTheme = {
    name: activeColors.name,
    badgeBg: `badge-bg-${cardBg}`,
    logoBg: "text-white shadow-lg",
    avatarRing: "shadow-xl",
    topBar: "",
    glow1: "",
    glow2: "",
    accentText: isLightBg ? "text-indigo-600" : "text-indigo-400",
    roleBadge: "border font-mono font-bold tracking-widest uppercase",
    previewGradient: "",
  };

  const cardDynamicStyle: React.CSSProperties =
    cardBg === "aurora"
      ? {
          background: `radial-gradient(ellipse at 15% 15%, ${activeColors.c1}85 0%, transparent 60%), radial-gradient(ellipse at 85% 85%, ${activeColors.c2}85 0%, transparent 60%), radial-gradient(circle at 50% 50%, #1e1b4b 0%, #030712 100%)`,
        }
      : {};

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

    if (isFlippedRef.current) {
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
    cardInnerRef.current.style.transform = isFlippedRef.current ? "rotateY(180deg)" : "rotateX(0deg) rotateY(0deg)";
    if (holoLayerRef.current) {
      holoLayerRef.current.style.opacity = "0.45";
    }
  };

  // Flip Card Action
  const toggleFlip = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const nextFlipped = !isFlippedRef.current;
    isFlippedRef.current = nextFlipped;
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

  // Remove Custom Avatar
  const handleRemoveAvatar = () => {
    setCustomAvatar(null);
    setAvatarType("initials");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast("Uploaded photo removed", "info");
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

  // Save current gradient into one of the 4 palette slots
  const handleSaveToPalette = (paletteId: string) => {
    const updated = palettes.map((p) =>
      p.id === paletteId ? { ...p, c1: customColor1, c2: customColor2 } : p
    );
    setPalettes(updated);
    try {
      localStorage.setItem("ems_id_badge_palettes", JSON.stringify(updated));
    } catch {}
    setTheme(paletteId as ThemeKey);
    const slotIdx = updated.findIndex((p) => p.id === paletteId) + 1;
    showToast(`Saved gradient combination to Palette Slot ${slotIdx}!`, "success");
  };

  // Save current badge configuration
  const handleSaveBadge = () => {
    try {
      const config = {
        name,
        role,
        personnelId,
        department,
        validity,
        status,
        barcodeType,
        holoEffect,
        cardBg,
        avatarType,
        customAvatar,
        theme,
        customColor1,
        customColor2,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(
        `ems_badge_saved_${user?.id || personnelId || "default"}`,
        JSON.stringify(config)
      );
      showToast("Badge configuration saved successfully!", "success");
    } catch {
      showToast("Failed to save badge configuration", "error");
    }
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
    setCardBg("obsidian");
    setTheme("p1");
    setPalettes(DEFAULT_PALETTES);
    try {
      localStorage.removeItem("ems_id_badge_palettes");
    } catch {}
    setCustomColor1(DEFAULT_PALETTES[0].c1);
    setCustomColor2(DEFAULT_PALETTES[0].c2);
    setIsFlipped(false);
    isFlippedRef.current = false;

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

    showToast("Reset to default credential details & palettes", "info");
  };

  // Status Styling Badge
  const getStatusBadgeClasses = () => {
    if (isLightBg) {
      switch (status) {
        case "ACTIVE":
        case "ON-SITE":
          return {
            pill: "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold",
            dot: "bg-emerald-600",
          };
        case "RESTRICTED":
          return {
            pill: "bg-amber-50 border-amber-300 text-amber-800 font-bold",
            dot: "bg-amber-600",
          };
        case "VIP ACCESS":
          return {
            pill: "bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800 font-bold",
            dot: "bg-fuchsia-600",
          };
        default:
          return {
            pill: "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold",
            dot: "bg-emerald-600",
          };
      }
    }
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
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/65 backdrop-blur-xs p-3 sm:p-5 overscroll-y-contain animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center py-4 sm:py-6">
        {/* MAIN CONTAINER MODAL */}
        <div
          className={`w-full ${
            isEditorOpen ? "max-w-[760px]" : "max-w-[340px] sm:max-w-[350px]"
          } bg-[#030712] rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(99,102,241,0.2)] border border-slate-800/90 flex flex-col my-auto transition-all duration-300 text-slate-100 relative overflow-hidden animate-in zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* MODAL HEADER */}
          <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-slate-800/80 flex items-center justify-between bg-[#060D1E]/95 backdrop-blur-md text-white gap-2.5 relative z-20">
            {/* Left: Enterprise Pass Badge */}
            <div className="flex items-center justify-start shrink-0">
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-mono text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-2xs whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0"></span>
                ENTERPRISE PASS
              </span>
            </div>

            {/* Center: Security ID Portal Heading (Centered) */}
            <div className="flex-1 flex items-center justify-center text-center">
              <div
                style={{ fontSize: "14px", lineHeight: "1.25" }}
                className="security-id-portal-heading font-extrabold tracking-normal text-white flex items-center justify-center gap-1.5 mb-0 whitespace-nowrap"
              >
                <i className="bi bi-shield-check text-indigo-400 text-sm shrink-0"></i>
                <span>Security ID Portal</span>
              </div>
            </div>

            {/* Right: Actions with Triple Dots Menu on Left of Cross Button */}
            <div className="relative flex items-center gap-1.5 shrink-0 justify-end" ref={menuDropdownRef}>
              {/* Triple Dots Options Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-1 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0 ${
                  isMenuOpen ? "bg-white/10 text-indigo-300" : ""
                }`}
                title="More Options"
              >
                <i className="bi bi-three-dots-vertical text-base"></i>
              </button>

              {/* Triple Dots Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-8 top-full mt-1.5 w-52 bg-white rounded-2xl border border-slate-200 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs text-slate-700">
                  {/* Customize Badge Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditorOpen(!isEditorOpen);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition cursor-pointer text-left font-semibold"
                  >
                    <i className="bi bi-sliders text-indigo-600 text-sm"></i>
                    <span>{isEditorOpen ? "Hide Customizer" : "Customize Badge"}</span>
                  </button>

                  {/* Save Badge */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveBadge();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition cursor-pointer text-left font-semibold"
                  >
                    <i className="bi bi-floppy-fill text-indigo-600 text-sm"></i>
                    <span>Save Badge</span>
                  </button>

                  {/* Print Badge */}
                  <button
                    type="button"
                    onClick={() => {
                      handlePrint();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition cursor-pointer text-left font-semibold"
                  >
                    <i className="bi bi-printer-fill text-indigo-600 text-sm"></i>
                    <span>Print Badge</span>
                  </button>

                  {/* Add to Mobile Wallet */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadWalletPass();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 transition cursor-pointer text-left font-semibold"
                  >
                    <i className="bi bi-wallet2 text-indigo-600 text-sm"></i>
                    <span>Add to Mobile Wallet</span>
                  </button>

                  <div className="my-1 border-t border-slate-100"></div>

                  {/* Reset Defaults */}
                  <button
                    type="button"
                    onClick={() => {
                      resetBadgeData();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer text-left font-semibold"
                  >
                    <i className="bi bi-arrow-counterclockwise text-rose-500 text-sm"></i>
                    <span>Reset Defaults</span>
                  </button>
                </div>
              )}

              {/* Close Cross Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0"
                title="Close modal"
              >
                <i className="bi bi-x-lg text-sm"></i>
              </button>
            </div>
          </div>

          {/* MAIN CONTENT SPLIT LAYOUT */}
          <div className={`${
            isEditorOpen ? "p-4 sm:p-5" : "px-3.5 pt-3.5 pb-4.5 sm:px-4 sm:pt-4 sm:pb-5"
          } flex flex-col lg:flex-row items-stretch justify-center gap-5 sm:gap-6 relative bg-[#030712] overflow-hidden`}>
            {/* Cosmic Constellation Canvas Background */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
            />
            {/* Ambient Nebula Glow Behind Cosmic Canvas */}
            <div className="badge-ambient-orb badge-orb-1 opacity-20"></div>
            <div className="badge-ambient-orb badge-orb-2 opacity-20"></div>

            {/* LEFT CUSTOMIZATION DRAWER PANEL */}
            {isEditorOpen && (
              <div className="w-full lg:w-[380px] flex flex-col justify-between bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-200/90 text-xs transition-all duration-300 shadow-sm space-y-3.5 max-h-[78vh] overflow-y-auto badge-custom-scrollbar relative z-10">
                <div className="space-y-3.5 flex-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                    <div
                      style={{ fontSize: "14.5px", lineHeight: "1.25" }}
                      className="badge-customizer-heading font-extrabold tracking-normal text-slate-900 flex items-center gap-1.5 mb-0 whitespace-nowrap shrink-0"
                    >
                      <i className="bi bi-magic text-indigo-600 text-sm shrink-0"></i>
                      <span>Badge Customizer</span>
                    </div>
                    <button
                      type="button"
                      onClick={resetBadgeData}
                      className="text-[10px] sm:text-[10.5px] text-indigo-600 hover:text-indigo-700 font-semibold hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Reset Defaults
                    </button>
                  </div>

                  {/* Theme Presets & Custom Gradient Studio */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-0">
                        Color Theme & Palette
                      </label>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {theme === "custom" ? "Custom Blend" : activeColors.name}
                      </span>
                    </div>

                    {/* Exactly 4 Palettes + 1 Customizer Palette Button (5 Total) */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {palettes.map((p, idx) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setTheme(p.id as ThemeKey);
                            setCustomColor1(p.c1);
                            setCustomColor2(p.c2);
                            showToast(`Selected Palette ${idx + 1} (${p.name})`, "info");
                          }}
                          title={`Palette ${idx + 1}: ${p.name}`}
                          style={{
                            background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`,
                          }}
                          className={`badge-theme-preset ${
                            theme === p.id ? "is-active" : "is-inactive"
                          }`}
                        />
                      ))}

                      {/* 5th: Custom Palette Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setTheme("custom");
                          showToast("Custom Gradient Studio active", "info");
                        }}
                        title="Custom Gradient Studio"
                        style={{
                          background: `linear-gradient(135deg, ${customColor1}, ${customColor2})`,
                        }}
                        className={`badge-theme-preset ${
                          theme === "custom" ? "is-active" : "is-inactive"
                        } flex items-center justify-center text-white shadow-xs`}
                      >
                        <i className="bi bi-palette-fill text-[11px] drop-shadow-xs"></i>
                      </button>
                    </div>

                    {/* Custom Color Palette & Gradient Studio */}
                    {theme === "custom" && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                            <i className="bi bi-palette-fill text-indigo-600 text-xs"></i>
                            HR Custom Gradient Studio
                          </span>
                          <span className="text-[10px] font-mono text-indigo-600 uppercase font-semibold">
                            {customColor1} → {customColor2}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {/* Start Color Picker */}
                          <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition cursor-pointer shadow-2xs">
                            <input
                              type="color"
                              value={customColor1}
                              onChange={(e) => setCustomColor1(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9.5px] text-slate-500 uppercase font-medium leading-none mb-0.5">Start Color</span>
                              <span className="text-[10.5px] font-mono font-bold text-slate-800 uppercase truncate">
                                {customColor1}
                              </span>
                            </div>
                          </label>

                          {/* End Color Picker */}
                          <label className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition cursor-pointer shadow-2xs">
                            <input
                              type="color"
                              value={customColor2}
                              onChange={(e) => setCustomColor2(e.target.value)}
                              className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9.5px] text-slate-500 uppercase font-medium leading-none mb-0.5">End Color</span>
                              <span className="text-[10.5px] font-mono font-bold text-slate-800 uppercase truncate">
                                {customColor2}
                              </span>
                            </div>
                          </label>
                        </div>

                        {/* Quick Harmonious Palettes */}
                        <div>
                          <div className="text-[9.5px] text-slate-500 font-medium mb-1">Quick Gradient Combinations:</div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { c1: "#6366f1", c2: "#06b6d4", name: "Cyber Cyan" },
                              { c1: "#f43f5e", c2: "#fb923c", name: "Sunset Coral" },
                              { c1: "#059669", c2: "#10b981", name: "Emerald Mint" },
                              { c1: "#2563eb", c2: "#9333ea", name: "Royal Purple" },
                              { c1: "#d946ef", c2: "#f59e0b", name: "Amber Fusion" },
                              { c1: "#3b82f6", c2: "#ec4899", name: "Neon Rose" },
                            ].map((combo) => (
                              <button
                                key={combo.name}
                                type="button"
                                onClick={() => {
                                  setCustomColor1(combo.c1);
                                  setCustomColor2(combo.c2);
                                  showToast(`Applied ${combo.name} gradient`, "success");
                                }}
                                title={combo.name}
                                className="h-4.5 w-7 rounded-md border border-slate-200 hover:border-indigo-500 shadow-2xs transition cursor-pointer"
                                style={{
                                  background: `linear-gradient(90deg, ${combo.c1}, ${combo.c2})`,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Save Current Combination into any of the 4 Palettes */}
                        <div className="pt-2 border-t border-slate-200/80">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                              <i className="bi bi-bookmark-check-fill text-indigo-600 text-xs"></i>
                              Save Combination to Palette:
                            </span>
                            <span className="text-[9px] text-slate-500">Click a slot to save</span>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            {palettes.map((p, idx) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSaveToPalette(p.id)}
                                className="px-1.5 py-1.5 rounded-lg bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-400 transition flex flex-col items-center gap-1 group cursor-pointer text-center shadow-2xs"
                                title={`Save current gradient into Palette Slot ${idx + 1}`}
                              >
                                <span className="text-[9.5px] font-bold text-slate-700 group-hover:text-indigo-600">
                                  Slot {idx + 1}
                                </span>
                                <span
                                  className="w-3.5 h-3.5 rounded-md border border-slate-200 shadow-2xs group-hover:scale-110 transition"
                                  style={{ background: `linear-gradient(135deg, ${p.c1}, ${p.c2})` }}
                                />
                                <span className="text-[9px] font-semibold text-indigo-600 flex items-center gap-0.5">
                                  <i className="bi bi-download text-[8.5px]"></i> Save
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Card Base Material / Surface Theme */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-0">
                        Card Base Material
                      </label>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {CARD_BACKGROUNDS.find((b) => b.id === cardBg)?.name || "Obsidian"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {CARD_BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => {
                            setCardBg(bg.id);
                            showToast(`Applied ${bg.name} card material`, "info");
                          }}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center text-center transition cursor-pointer ${
                            cardBg === bg.id
                              ? "border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                          }`}
                          title={bg.description}
                        >
                          <div className={`w-full h-5 rounded-md mb-1 border shadow-2xs ${bg.previewClass}`}></div>
                          <span
                            className={`text-[10.5px] font-bold leading-tight truncate w-full ${
                              cardBg === bg.id ? "text-indigo-700" : "text-slate-800"
                            }`}
                          >
                            {bg.name}
                          </span>
                          <span className="text-[8.5px] text-slate-400 leading-none mt-0.5 truncate w-full">
                            {bg.subtitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                {/* Avatar Photo & Presets */}
                <div>
                  <label className="text-slate-700 font-semibold block mb-1.5">Profile Avatar / Photo</label>
                  <div className="flex items-center gap-2">
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
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition shrink-0"
                    >
                      <i className="bi bi-upload text-indigo-600"></i>
                      <span>{customAvatar ? "Change Photo" : "Upload Photo"}</span>
                    </button>
                    {customAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        title="Remove uploaded photo"
                        className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 flex items-center gap-1 text-xs font-semibold cursor-pointer transition shrink-0"
                      >
                        <i className="bi bi-trash3 text-xs"></i>
                        <span>Remove</span>
                      </button>
                    )}
                    <div className="flex gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => setAvatarType("initials")}
                        title="Initial Letter"
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border cursor-pointer transition ${
                          avatarType === "initials"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {name ? name.charAt(0).toUpperCase() : "A"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarType("user")}
                        title="User Icon"
                        className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center border cursor-pointer transition ${
                          avatarType === "user"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        <i className="bi bi-person-fill"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarType("shield")}
                        title="Security Shield"
                        className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center border cursor-pointer transition ${
                          avatarType === "shield"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        <i className="bi bi-shield-lock-fill"></i>
                      </button>
                    </div>
                  </div>
                </div>

              {/* Holographic Overlay Effect */}
              <div>
                <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-1.5">Holographic Effect Overlay</label>
                <select
                  value={holoEffect}
                  onChange={(e) => {
                    const val = e.target.value as HoloKey;
                    setHoloEffect(val);
                    showToast(`Hologram effect: ${val}`, "info");
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-[12px] sm:text-[12.5px] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-2xs"
                >
                  <option value="holo-prism">Prism Light Reflex (Default)</option>
                  <option value="holo-grid">Security Micro Grid</option>
                  <option value="holo-cyber">Cyber Scan Stripe</option>
                  <option value="holo-waves">Quantum Waves</option>
                  <option value="none">None (Clean Glass)</option>
                </select>
              </div>

              {/* Personal Info Input Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-semibold text-[12.5px] sm:text-[13px] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-1.5">Role Title</label>
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 uppercase focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono text-[12px] shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-1.5">Personnel ID</label>
                    <input
                      type="text"
                      value={personnelId}
                      onChange={(e) => setPersonnelId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-[12px] shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-1.5">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium text-[12.5px] sm:text-[13px] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-1.5">Validity</label>
                    <input
                      type="text"
                      value={validity}
                      onChange={(e) => setValidity(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-[12px] shadow-2xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-1.5">Status Badge</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as StatusType)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer text-[12px] shadow-2xs"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ON-SITE">ON-SITE</option>
                      <option value="RESTRICTED">RESTRICTED</option>
                      <option value="VIP ACCESS">VIP ACCESS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] sm:text-[12.5px] font-semibold text-slate-700 block mb-1.5">Barcode Type</label>
                    <select
                      value={barcodeType}
                      onChange={(e) => setBarcodeType(e.target.value as BarcodeType)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer text-[12px] shadow-2xs"
                    >
                      <option value="linear">Linear Barcode</option>
                      <option value="qr">Scannable QR</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Sync Indicator */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Real-time Live Sync</span>
                </span>
                <span className="font-mono text-indigo-600 text-[10px] uppercase font-bold tracking-wider">
                  256-BIT ENCRYPTED
                </span>
              </div>
            </div>
          )}

          {/* CENTER DISPLAY: 3D DIGITAL ID BADGE CARD */}
          <div className="flex flex-col items-center justify-center relative z-10">
            
            {/* CARD PERSPECTIVE CONTAINER */}
            <div
              ref={badgeContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="badge-perspective-viewport w-[275px] sm:w-[285px] h-[480px] relative select-none"
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
                  style={cardDynamicStyle}
                  className={`badge-card-face absolute inset-0 ${currentTheme.badgeBg} flex flex-col justify-between p-4 sm:p-4.5 shadow-2xl cursor-pointer border ${
                    isLightBg ? "border-slate-300" : "border-slate-800"
                  }`}
                >
                  {/* Guilloché Geometric Spirograph Security Layer */}
                  {cardBg === "guilloche" && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
                      <svg className="w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 480">
                        <defs>
                          <pattern id="guilloche-grid-front" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 0,30 Q 15,0 30,30 T 60,30" fill="none" stroke="currentColor" strokeWidth="0.75" />
                            <path d="M 0,15 Q 15,45 30,15 T 60,15" fill="none" stroke="currentColor" strokeWidth="0.75" />
                            <circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#guilloche-grid-front)" className="text-cyan-300" />
                        <g transform="translate(150, 240)" className="text-indigo-400" stroke="currentColor" fill="none" strokeWidth="0.6">
                          {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165].map((angle) => (
                            <ellipse key={angle} cx="0" cy="0" rx="95" ry="32" transform={`rotate(${angle})`} opacity="0.35" />
                          ))}
                        </g>
                      </svg>
                      {/* Positioned safely near bottom so it NEVER overlaps header */}
                      <div className="absolute bottom-12 left-0 right-0 overflow-hidden opacity-25">
                        <div className="text-[6px] font-mono uppercase tracking-[0.25em] text-cyan-300 whitespace-nowrap">
                          AUTHENTICATED ENTERPRISE CREDENTIAL • 256-BIT CRYPTOGRAPHIC TAMPER SEAL • SECURE ACCESS VERIFIED •
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ambient Glow Overlay */}
                  <div
                    style={{ backgroundColor: activeColors.c1, opacity: isLightBg ? 0.08 : 0.24 }}
                    className="absolute -top-24 -left-24 w-52 h-52 rounded-full blur-3xl pointer-events-none"
                  ></div>
                  <div
                    style={{ backgroundColor: activeColors.c2, opacity: isLightBg ? 0.06 : 0.2 }}
                    className="absolute -bottom-24 -right-24 w-52 h-52 rounded-full blur-3xl pointer-events-none"
                  ></div>

                  {/* Top Gradient Line Accent */}
                  <div
                    style={{ background: `linear-gradient(90deg, ${activeColors.c1}, ${activeColors.c2})` }}
                    className="absolute top-0 left-0 right-0 h-1.5"
                  ></div>

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
                        <div
                          style={{ background: `linear-gradient(135deg, ${activeColors.c1}, ${activeColors.c2})` }}
                          className="w-8 h-8 rounded-xl text-white shadow-lg flex items-center justify-center font-black text-base shrink-0"
                        >
                          E
                        </div>
                        <div>
                          <div
                            style={{ color: isLightBg ? "#0f172a" : "#ffffff" }}
                            className={`text-[10.5px] font-extrabold tracking-wider uppercase leading-none ${
                              isLightBg ? "text-slate-900" : "text-white"
                            }`}
                          >
                            ENTERPRISE EMS
                          </div>
                          <div
                            style={{ color: isLightBg ? "#64748b" : "#94a3b8" }}
                            className={`text-[8px] font-semibold tracking-widest uppercase mt-0.5 ${
                              isLightBg ? "text-slate-500" : "text-slate-300"
                            }`}
                          >
                            SECURITY CREDENTIAL
                          </div>
                        </div>
                      </div>

                      <div className={`px-2 py-0.5 rounded-full border font-mono text-[8.5px] font-bold tracking-wider flex items-center gap-1 shadow-2xs shrink-0 ${statusStyle.pill}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot} animate-pulse`}></span>
                        <span>{status}</span>
                      </div>
                    </div>

                    <div
                      className={`w-full h-px bg-gradient-to-r from-transparent ${
                        isLightBg ? "via-slate-300" : "via-slate-700/60"
                      } to-transparent mt-2 relative z-10`}
                    ></div>
                  </div>

                  {/* AVATAR SECTION */}
                  <div className="relative z-10 flex flex-col items-center my-0.5">
                    <div className="relative">
                      {/* Dynamic Avatar Outer Ring */}
                      <div
                        style={{ background: `linear-gradient(135deg, ${activeColors.c1}, ${activeColors.c2})` }}
                        className="w-20 h-20 rounded-2xl p-[2px] shadow-xl"
                      >
                        <div
                          className={`w-full h-full ${
                            isLightBg ? "bg-white" : "bg-slate-950/90"
                          } rounded-[14px] flex items-center justify-center backdrop-blur-sm overflow-hidden relative`}
                        >
                          {avatarType === "photo" && customAvatar ? (
                            <img
                              src={customAvatar}
                              alt={name}
                              className="w-full h-full object-cover rounded-[14px]"
                            />
                          ) : avatarType === "user" ? (
                            <i className={`bi bi-person-fill text-2xl ${isLightBg ? "text-indigo-600" : "text-indigo-300"}`}></i>
                          ) : avatarType === "shield" ? (
                            <i className={`bi bi-shield-fill-check text-2xl ${isLightBg ? "text-teal-600" : "text-cyan-300"}`}></i>
                          ) : (
                            <span
                              className={`text-2xl font-extrabold ${
                                isLightBg
                                  ? "text-indigo-600"
                                  : "text-white"
                              }`}
                            >
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
                      <h2
                        style={{ color: isLightBg ? "#0f172a" : "#ffffff" }}
                        className={`badge-employee-name text-lg font-extrabold tracking-tight leading-snug mb-0 max-w-[240px] truncate ${
                          isLightBg ? "text-slate-900 font-black" : "text-white"
                        }`}
                      >
                        {name}
                      </h2>
                      <div className="mt-1">
                        <span
                          style={{
                            backgroundColor: isLightBg ? `${activeColors.c1}15` : `${activeColors.c1}25`,
                            borderColor: isLightBg ? `${activeColors.c1}50` : `${activeColors.c1}70`,
                            color: isLightBg ? activeColors.c1 : "#ffffff",
                          }}
                          className="px-2.5 py-0.5 rounded-md border text-[9.5px] font-mono font-bold tracking-widest uppercase shadow-2xs"
                        >
                          {role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DETAILS TABLE */}
                  <div
                    className={`relative z-10 ${
                      isLightBg ? "bg-white/85 border-slate-200/90 shadow-2xs" : "bg-slate-900/90 border-slate-700/60 shadow-md"
                    } rounded-xl border p-2.5 space-y-1.5 text-xs backdrop-blur-md`}
                  >
                    <div className="flex justify-between items-center">
                      <span style={{ color: isLightBg ? "#64748b" : "#cbd5e1" }} className="text-[10.5px] font-medium">Personnel ID:</span>
                      <span style={{ color: isLightBg ? "#0f172a" : "#ffffff" }} className="font-mono font-bold text-[10.5px] tracking-wide">
                        {personnelId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: isLightBg ? "#64748b" : "#cbd5e1" }} className="text-[10.5px] font-medium">Department:</span>
                      <span style={{ color: isLightBg ? "#0f172a" : "#ffffff" }} className="font-bold text-[10.5px] truncate max-w-[140px]">
                        {department}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span style={{ color: isLightBg ? "#64748b" : "#cbd5e1" }} className="text-[10.5px] font-medium">Validity:</span>
                      <span style={{ color: isLightBg ? "#0f172a" : "#ffffff" }} className="font-mono text-[10.5px] font-semibold">{validity}</span>
                    </div>
                  </div>

                  {/* SCANNABLE BARCODE / QR FOOTER */}
                  <div className="relative z-10 flex flex-col items-center pt-1.5">
                    {barcodeType === "linear" ? (
                      <div className="w-full flex flex-col items-center">
                        <div
                          className={`w-full h-7 ${
                            isLightBg ? "barcode-lines-pattern-dark opacity-95" : "barcode-lines-pattern opacity-90"
                          } rounded`}
                        ></div>
                        <div
                          style={{ color: isLightBg ? "#475569" : "#cbd5e1" }}
                          className="text-[8.5px] font-mono tracking-widest mt-0.5 font-semibold"
                        >
                          *{personnelId}*
                        </div>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center">
                        <div className="p-1 bg-white rounded-lg shadow-sm border border-slate-200">
                          <svg className="w-8 h-8 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                            <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,10 h10 v10 h-10 z M40,40 h20 v20 h-20 z M70,40 h10 v10 h-10 z M10,40 h10 v20 h-10 z M40,70 h20 v10 h-20 z M70,70 h20 v20 h-20 z M80,80 h10 v10 h-10 z"/>
                          </svg>
                        </div>
                        <div
                          style={{ color: isLightBg ? "#475569" : "#cbd5e1" }}
                          className="text-[8px] font-mono tracking-widest mt-0.5 font-semibold"
                        >
                          *{personnelId}*
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FLIP TIP HINT */}
                  <div className="text-center pointer-events-none z-10 pb-0.5">
                    <span style={{ color: isLightBg ? "#64748b" : "#94a3b8" }} className="text-[7.5px] uppercase tracking-widest flex items-center justify-center gap-1 font-medium">
                      <i className="bi bi-arrow-repeat text-[7.5px]"></i> Click card to flip
                    </span>
                  </div>
                </div>

                {/* ================= CARD BACK ================= */}
                <div
                  style={cardDynamicStyle}
                  className={`badge-card-face badge-card-face-back absolute inset-0 ${currentTheme.badgeBg} flex flex-col justify-between p-4 sm:p-4.5 shadow-2xl cursor-pointer border ${
                    isLightBg ? "border-slate-300" : "border-slate-800"
                  }`}
                >
                  {/* Guilloché pattern for back if active */}
                  {cardBg === "guilloche" && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
                      <svg className="w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 480">
                        <defs>
                          <pattern id="guilloche-grid-back" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 0,30 Q 15,0 30,30 T 60,30" fill="none" stroke="currentColor" strokeWidth="0.75" />
                            <path d="M 0,15 Q 15,45 30,15 T 60,15" fill="none" stroke="currentColor" strokeWidth="0.75" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#guilloche-grid-back)" className="text-cyan-300" />
                      </svg>
                    </div>
                  )}

                  {/* Magnetic Stripe Simulation */}
                  <div className="absolute top-4 left-0 right-0 h-8 bg-slate-900 border-y border-slate-800 flex items-center px-4">
                    <div className="h-1.5 w-full bg-gradient-to-r from-amber-700/40 via-amber-500/20 to-amber-700/40 rounded-xs"></div>
                  </div>

                  {/* Back Content */}
                  <div className="pt-11 space-y-2.5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div
                          style={{ color: isLightBg ? "#1e293b" : "#f1f5f9" }}
                          className="text-[9.5px] font-bold uppercase tracking-wider mb-1"
                        >
                          Encrypted Security QR
                        </div>
                        <div className="p-2 bg-white rounded-xl inline-block shadow-lg border border-slate-200">
                          <svg className="w-14 h-14 text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                            <path d="M0,0 h30 v30 h-30 z M10,10 h10 v10 h-10 z M70,0 h30 v30 h-30 z M80,10 h10 v10 h-10 z M0,70 h30 v30 h-30 z M10,80 h10 v10 h-10 z M40,10 h10 v10 h-10 z M40,40 h20 v20 h-20 z M70,40 h10 v10 h-10 z M10,40 h10 v20 h-10 z M40,70 h20 v10 h-20 z M70,70 h20 v20 h-20 z M80,80 h10 v10 h-10 z"/>
                          </svg>
                        </div>
                      </div>

                      {/* Interactive RFID / NFC Tap Chip */}
                      <div
                        onClick={handleNfcTap}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-2xl ${
                          isLightBg
                            ? "bg-slate-100 border-slate-200 hover:border-indigo-400"
                            : "bg-slate-900 border-slate-800 hover:border-indigo-500/50"
                        } border transition cursor-pointer group shadow-2xs`}
                      >
                        <div
                          style={{
                            borderColor: `${activeColors.c1}50`,
                            backgroundColor: `${activeColors.c1}15`,
                            color: activeColors.c2,
                          }}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center group-hover:scale-110 transition ${
                            nfcActive ? "animate-ping" : ""
                          }`}
                        >
                          <i className="bi bi-wifi text-sm rotate-90"></i>
                        </div>
                        <span
                          style={{ color: isLightBg ? "#475569" : "#cbd5e1" }}
                          className="text-[7.5px] font-mono mt-1 uppercase tracking-wider font-semibold"
                        >
                          Tap NFC Scan
                        </span>
                      </div>
                    </div>

                    <div
                      className={`text-[9.5px] space-y-1 leading-snug border-t pt-2.5 ${
                        isLightBg ? "text-slate-600 border-slate-200" : "text-slate-400 border-slate-800"
                      }`}
                    >
                      <p style={{ color: isLightBg ? "#0f172a" : "#ffffff" }} className="font-bold mb-0 text-[9.5px]">
                        Property of Enterprise EMS Security
                      </p>
                      <p style={{ color: isLightBg ? "#475569" : "#cbd5e1" }} className="mb-0 text-[8.5px]">
                        If found, please return to any EMS Security Desk or mail to Headquarters.
                      </p>
                      <p style={{ color: isLightBg ? "#64748b" : "#94a3b8" }} className="font-mono text-[8px] mb-0">
                        24/7 Hotline: +1 (800) 555-0199
                      </p>
                    </div>
                  </div>

                  {/* Digital Signature Line */}
                  <div
                    className={`relative z-10 border-t pt-1.5 flex items-center justify-between ${
                      isLightBg ? "border-slate-200" : "border-slate-800"
                    }`}
                  >
                    <div>
                      <div
                        style={{ color: isLightBg ? activeColors.c1 : activeColors.c2 }}
                        className="font-mono text-[8.5px] italic tracking-wider font-bold"
                      >
                        {name} (Signed)
                      </div>
                      <div style={{ color: isLightBg ? "#64748b" : "#94a3b8" }} className="text-[7px] uppercase tracking-widest font-medium">
                        Authorized Signature
                      </div>
                    </div>
                    <i className="bi bi-patch-check-fill text-indigo-500 text-xs"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD CONTROL BUTTONS */}
            <div className="flex items-center gap-2.5 mt-3 z-20">
              <button
                type="button"
                onClick={toggleFlip}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <i className="bi bi-arrow-repeat text-indigo-600"></i>
                <span>Flip Badge</span>
              </button>
              <button
                type="button"
                onClick={handleCopyId}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 text-xs font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <i className="bi bi-clipboard text-indigo-600"></i>
                <span>Copy ID</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-2.5 shadow-2xl z-[10000] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200">
          <i
            className={`bi ${
              toast.type === "success"
                ? "bi-check-circle-fill text-emerald-400"
                : toast.type === "error"
                ? "bi-exclamation-circle-fill text-rose-400"
                : "bi-info-circle-fill text-indigo-400"
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
