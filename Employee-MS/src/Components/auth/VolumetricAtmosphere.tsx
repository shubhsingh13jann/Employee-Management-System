import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserRole } from "./auth.types";
import "./volumetricAtmosphere.css";

export interface VolumetricAtmosphereProps {
  role?: UserRole;
}

interface AtmospherePalette {
  name: string;
  primary: string;         // Core spotlight glow color
  secondary: string;       // Mid-falloff color
  ambientHalo: string;     // Outer rim aura
  ringStrokeStart: string; // Harmonic ripple stroke gradient start
  ringStrokeEnd: string;   // Harmonic ripple stroke gradient end
  ringGlow: string;        // Soft halo filter
  gridLine: string;        // Floor wireframe grid color
}

const ATMOSPHERE_PALETTES: Record<UserRole, AtmospherePalette> = {
  admin: {
    name: "HR Admin Imperial Amethyst",
    primary: "rgba(147, 51, 234, 0.42)",       // Deep Amethyst Violet
    secondary: "rgba(88, 28, 135, 0.38)",      // Velvet Royal Purple
    ambientHalo: "rgba(245, 158, 11, 0.22)",   // Imperial Gold Rim
    ringStrokeStart: "#c084fc",                // Vivid Purple
    ringStrokeEnd: "#f59e0b",                  // Warm Gold
    ringGlow: "rgba(192, 132, 252, 0.35)",
    gridLine: "rgba(168, 85, 247, 0.14)"
  },
  manager: {
    name: "Department Manager Executive Sapphire",
    primary: "rgba(37, 99, 235, 0.42)",        // Executive Sapphire
    secondary: "rgba(30, 58, 138, 0.38)",      // Corporate Ocean Navy
    ambientHalo: "rgba(56, 189, 248, 0.22)",   // Electric Azure Halo
    ringStrokeStart: "#60a5fa",                // Cobalt Blue
    ringStrokeEnd: "#38bdf8",                  // Sky Cyan
    ringGlow: "rgba(56, 189, 248, 0.35)",
    gridLine: "rgba(59, 130, 246, 0.14)"
  },
  supervisor: {
    name: "Shift Supervisor Jade Emerald",
    primary: "rgba(5, 150, 105, 0.42)",        // Jade Forest
    secondary: "rgba(6, 78, 59, 0.38)",        // Deep Emerald
    ambientHalo: "rgba(45, 212, 191, 0.22)",   // Crystalline Seafoam / Mint
    ringStrokeStart: "#34d399",                // Emerald Mint
    ringStrokeEnd: "#2dd4bf",                  // Seafoam Teal
    ringGlow: "rgba(45, 212, 191, 0.35)",
    gridLine: "rgba(16, 185, 129, 0.14)"
  },
  employee: {
    name: "Enterprise Employee Morning Indigo",
    primary: "rgba(79, 70, 229, 0.42)",        // Morning Indigo
    secondary: "rgba(49, 46, 129, 0.38)",      // Midnight Sky
    ambientHalo: "rgba(14, 165, 233, 0.22)",   // Vibrant Sky Blue
    ringStrokeStart: "#818cf8",                // Periwinkle Indigo
    ringStrokeEnd: "#38bdf8",                  // Azure Cyan
    ringGlow: "rgba(129, 140, 248, 0.35)",
    gridLine: "rgba(99, 102, 241, 0.14)"
  }
};

/**
 * Concept 3: Executive Volumetric Spotlight & Concentric Harmonic Ripples
 * 
 * - Minimalist luxury & architectural focus centered directly behind the auth card.
 * - Faint breathing concentric harmonic wave rings expanding slowly outward.
 * - Perspective architectural digital grid on the floor plane.
 * - Dynamic color transitions morphing smoothly when switching Role Tiers.
 */
export const VolumetricAtmosphere: React.FC<VolumetricAtmosphereProps> = ({
  role = "admin"
}) => {
  const palette = useMemo(() => ATMOSPHERE_PALETTES[role] || ATMOSPHERE_PALETTES.admin, [role]);

  return (
    <div
      className="volumetric-atmosphere-root"
      style={{
        // Expose dynamic grid line color to CSS variable
        ["--grid-line" as string]: palette.gridLine
      }}
      aria-hidden="true"
    >
      {/* 1. Volumetric Halo (Deep ambient falloff aura) */}
      <motion.div
        className="volumetric-spotlight-halo"
        animate={{
          background: `radial-gradient(circle at 50% 50%, ${palette.ambientHalo} 0%, ${palette.secondary} 45%, transparent 75%)`
        }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* 2. Volumetric Core Spotlight (Radiates directly behind the central card) */}
      <motion.div
        className="volumetric-spotlight-core"
        animate={{
          background: `radial-gradient(ellipse at 50% 50%, ${palette.primary} 0%, ${palette.secondary} 50%, transparent 80%)`
        }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* 3. Concentric Harmonic Wave Rings (Breathing slowly from behind the card) */}
      <svg className="harmonic-rings-svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <motion.linearGradient
            id="harmonic-ring-grad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <motion.stop
              offset="0%"
              animate={{ stopColor: palette.ringStrokeStart }}
              transition={{ duration: 0.75 }}
              stopOpacity={0.75}
            />
            <motion.stop
              offset="50%"
              animate={{ stopColor: palette.ringStrokeEnd }}
              transition={{ duration: 0.75 }}
              stopOpacity={0.45}
            />
            <motion.stop
              offset="100%"
              animate={{ stopColor: palette.ringStrokeStart }}
              transition={{ duration: 0.75 }}
              stopOpacity={0.15}
            />
          </motion.linearGradient>

          <filter id="harmonic-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 5 Concentric Harmonic Breathing Rings centered at (960, 540) */}
        {/* Ring 1 - Outer perimeter of card */}
        <circle
          cx="960"
          cy="540"
          r="380"
          fill="none"
          stroke="url(#harmonic-ring-grad)"
          strokeWidth="1.25"
          filter="url(#harmonic-glow)"
          strokeDasharray="8 6"
          className="harmonic-ring harmonic-ring-1"
        />

        {/* Ring 2 - Intermediate harmonic expansion */}
        <circle
          cx="960"
          cy="540"
          r="520"
          fill="none"
          stroke="url(#harmonic-ring-grad)"
          strokeWidth="1.2"
          filter="url(#harmonic-glow)"
          className="harmonic-ring harmonic-ring-2"
        />

        {/* Ring 3 - Mid-range breathing ring */}
        <circle
          cx="960"
          cy="540"
          r="680"
          fill="none"
          stroke="url(#harmonic-ring-grad)"
          strokeWidth="1"
          strokeDasharray="14 10"
          className="harmonic-ring harmonic-ring-3"
        />

        {/* Ring 4 - Deep spatial expansion */}
        <circle
          cx="960"
          cy="540"
          r="860"
          fill="none"
          stroke="url(#harmonic-ring-grad)"
          strokeWidth="1"
          className="harmonic-ring harmonic-ring-4"
        />

        {/* Ring 5 - Horizon boundary wave */}
        <circle
          cx="960"
          cy="540"
          r="1060"
          fill="none"
          stroke="url(#harmonic-ring-grad)"
          strokeWidth="0.75"
          strokeDasharray="20 16"
          className="harmonic-ring harmonic-ring-5"
        />
      </svg>

      {/* 4. Executive Architectural Perspective Grid Floor */}
      <div className="architectural-perspective-grid">
        <div className="perspective-plane" />
      </div>

      {/* 5. Subtle Vignette Overlay for Crisp Foreground Contrast */}
      <div className="volumetric-vignette-overlay" />
    </div>
  );
};

export default VolumetricAtmosphere;

