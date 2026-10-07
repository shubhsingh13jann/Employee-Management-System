import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./ConfirmOffboardModal.css";

export interface ConfirmOffboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  memberName: string;
  memberRole?: string;
  memberId?: number | string;
  memberDepartment?: string;
  memberImage?: string | null;
  isDeleting: boolean;
}

export const ConfirmOffboardModal: React.FC<ConfirmOffboardModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  memberRole,
  memberId,
  memberDepartment,
  memberImage,
  isDeleting,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  // Cosmic Constellation Interactive Background Canvas Engine
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = {
      x: width / 2,
      y: height / 2,
      radius: 170,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    const colors = [
      "rgba(99, 102, 241, ", // Indigo
      "rgba(14, 165, 233, ", // Cyan
      "rgba(236, 72, 153, ", // Pink
      "rgba(168, 85, 247, ", // Purple
    ];

    class Node {
      x!: number;
      y!: number;
      vx!: number;
      vy!: number;
      radius!: number;
      colorBase!: string;
      alpha!: number;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.75;
        this.vy = (Math.random() - 0.5) * 0.75;
        this.radius = Math.random() * 2 + 1.2;
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.6 + 0.3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 2;
          this.y -= (dy / dist) * force * 2;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.colorBase + this.alpha + ")";
        c.shadowBlur = 10;
        c.shadowColor = this.colorBase + "0.8)";
        c.fill();
        c.shadowBlur = 0;
      }
    }

    let nodes: Node[] = [];
    const initNodes = () => {
      nodes = [];
      const nodeCount = Math.min(85, Math.max(35, Math.floor((width * height) / 11000)));
      for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node());
      }
    };

    initNodes();

    const animateCosmic = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      // Render connecting laser constellation lines
      const maxDist = 140;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.28;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(147, 51, 234, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        node.update();
        node.draw(ctx);
      });

      animId = requestAnimationFrame(animateCosmic);
    };

    animId = requestAnimationFrame(animateCosmic);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Format initials from employee name
  const getInitials = (name: string) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(memberName);

  // Formatted Employee ID
  const formattedId = memberId
    ? typeof memberId === "number"
      ? `EMP-${String(memberId).padStart(4, "0")}`
      : String(memberId)
    : "EMP-0176";

  const displayDepartment = memberDepartment || "Engineering";
  const displayRole = memberRole
    ? memberRole.charAt(0).toUpperCase() + memberRole.slice(1).toLowerCase()
    : "Employee";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-[4px] overscroll-contain animate-in fade-in duration-200"
      onClick={!isDeleting ? onClose : undefined}
    >
      {/* 6th Background Effect: Cosmic Constellation Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* MAIN MODAL DIALOG CARD */}
      <div
        className="relative w-full max-w-[540px] bg-white rounded-[28px] p-6 sm:p-8 modal-card-shadow overflow-hidden z-10 animate-in zoom-in-95 duration-150 transform scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Right Corner Wave SVG */}
        <svg className="top-right-wave" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M40 0C80 40 140 30 180 15C200 7.5 210 0 220 0V180C190 140 150 110 100 130C50 150 20 110 0 80V0H40Z" fill="url(#pinkGradTop)" opacity="0.12" />
          <path d="M100 0C140 25 180 35 220 10V120C190 90 160 80 120 100C80 120 40 80 0 50V0H100Z" fill="url(#pinkGradTop)" opacity="0.18" />
          <path d="M150 0C180 20 200 15 220 5V60C200 40 180 45 160 30C140 15 100 20 60 0H150Z" fill="url(#pinkGradTop)" opacity="0.25" />
          <defs>
            <linearGradient id="pinkGradTop" x1="0" y1="0" x2="220" y2="180" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#fb7185" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bottom Left Corner Wave SVG */}
        <svg className="bottom-left-wave" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 160V60C30 80 70 90 110 70C150 50 180 90 200 120V160H0Z" fill="url(#pinkGradBot)" opacity="0.15" />
          <path d="M0 160V100C20 115 50 120 80 105C120 90 150 120 170 140V160H0Z" fill="url(#pinkGradBot)" opacity="0.22" />
          <defs>
            <linearGradient id="pinkGradBot" x1="0" y1="160" x2="200" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f43f5e" />
              <stop offset="1" stopColor="#fda4af" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Close (X) Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header Section */}
        <div className="relative z-10 flex items-start gap-4 sm:gap-5 mb-5">
          {/* Soft Pink Circular Avatar Badge */}
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-red-50/90 border border-red-100/80 flex items-center justify-center shrink-0 relative mt-0.5 shadow-sm">
            <svg className="w-9 h-9 text-crimson" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 11a4 4 0 100-8 4 4 0 000 8zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z" />
            </svg>
            <div className="absolute top-[21px] right-[13px] text-crimson font-extrabold text-xs">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
          </div>

          {/* Title and Subtitle Text */}
          <div className="pt-0.5">
            <h2 className="text-2xl sm:text-[27px] font-bold text-slate-900 leading-[1.15] tracking-tight mb-0">
              Confirm Personnel<br />
              <span className="text-crimson">Offboarding</span>
            </h2>
            <p className="text-[13px] sm:text-[14px] text-slate-500 mt-2.5 leading-snug mb-0">
              Are you sure you want to offboard and remove{" "}
              <span className="font-bold text-slate-800">{memberName || "this employee"}</span>{" "}
              ({memberRole ? memberRole.toLowerCase() : "employee"}) from the active directory?
            </p>
          </div>
        </div>

        {/* Warning Box Alert */}
        <div className="relative z-10 mb-4 p-4 sm:p-4.5 rounded-2xl bg-[#fff7f7] alert-box-border flex items-start gap-3.5 shadow-sm">
          {/* Warning Triangle Icon Badge */}
          <div className="w-10 h-10 rounded-full bg-orange-100/90 border border-orange-200/50 flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>

          {/* Vertical Red Divider */}
          <div className="w-[1px] bg-red-200/80 self-stretch my-0.5 shrink-0"></div>

          {/* Warning Text Content */}
          <div className="text-[12.5px] sm:text-[13px] leading-snug">
            <h4 className="font-bold text-crimson mb-1 text-[13.5px]">This action cannot be undone</h4>
            <p className="text-slate-600 font-normal leading-relaxed mb-0">
              This action immediately revokes authentication tokens, clears reporting hierarchy bindings, and archives their personnel history.
            </p>
          </div>
        </div>

        {/* Employee Profile Summary Card */}
        <div className="relative z-10 mb-6 p-3.5 sm:p-4 rounded-2xl bg-[#f5f7fc] border border-slate-200/70 flex items-center gap-3.5 shadow-sm">
          {/* Avatar Badge */}
          {memberImage ? (
            <img
              src={memberImage}
              alt={memberName}
              className="w-11 h-11 rounded-full object-cover shrink-0 shadow-sm border border-slate-200"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm tracking-wide shrink-0 shadow-sm">
              {initials}
            </div>
          )}

          {/* Employee Info Metadata */}
          <div>
            <div className="text-[14px] sm:text-[15px] font-bold text-slate-900 leading-tight">
              {memberName || "Alex Mercer"}
            </div>
            <div className="text-[12px] sm:text-[12.5px] text-slate-400 font-medium mt-0.5 flex items-center gap-2">
              <span>{formattedId}</span>
              <span className="text-slate-300">|</span>
              <span>{displayDepartment}</span>
              <span className="text-slate-300">|</span>
              <span>{displayRole}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="relative z-10 flex items-center justify-end gap-3 pt-1">
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-50"
          >
            Cancel
          </button>

          {/* Confirm Offboarding Red Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-2.5 sm:py-3 rounded-2xl bg-crimson hover:bg-rose-700 text-white font-bold text-sm flex items-center gap-2 btn-crimson-glow transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Offboarding...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span>Confirm Offboarding</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmOffboardModal;
