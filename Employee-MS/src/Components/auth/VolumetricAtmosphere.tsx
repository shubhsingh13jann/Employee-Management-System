import React, { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { UserRole } from "./auth.types";
import "./volumetricAtmosphere.css";

export interface VolumetricAtmosphereProps {
  role?: UserRole;
}

/* ─── Role palettes ─────────────────────────────────────────────────────── */
const PALETTES: Record<
  UserRole,
  {
    spotlightR: number; spotlightG: number; spotlightB: number;
    nodeR: number; nodeG: number; nodeB: number;
    haloCSS: string; spotlightCSS: string; ambientCSS: string;
  }
> = {
  admin: {
    // Amethyst Velvet + Imperial Gold
    spotlightR: 147, spotlightG: 51, spotlightB: 234,
    nodeR: 192,      nodeG: 132,    nodeB: 252,
    spotlightCSS:
      "radial-gradient(ellipse 46% 36% at 50% 50%, rgba(147,51,234,0.70) 0%, rgba(88,28,135,0.30) 55%, transparent 100%)",
    ambientCSS:
      "radial-gradient(ellipse 80% 65% at 50% 50%, rgba(245,158,11,0.10) 0%, transparent 100%)",
    haloCSS: "rgba(192,132,252,0.70)",
  },
  manager: {
    // Corporate Ocean Navy + Electric Azure
    spotlightR: 37,  spotlightG: 99,  spotlightB: 235,
    nodeR: 56,       nodeG: 189,      nodeB: 248,
    spotlightCSS:
      "radial-gradient(ellipse 46% 36% at 50% 50%, rgba(37,99,235,0.70) 0%, rgba(30,58,138,0.30) 55%, transparent 100%)",
    ambientCSS:
      "radial-gradient(ellipse 80% 65% at 50% 50%, rgba(56,189,248,0.10) 0%, transparent 100%)",
    haloCSS: "rgba(56,189,248,0.70)",
  },
  supervisor: {
    // Jade Forest + Crystalline Seafoam
    spotlightR: 5,   spotlightG: 150, spotlightB: 105,
    nodeR: 52,       nodeG: 211,      nodeB: 153,
    spotlightCSS:
      "radial-gradient(ellipse 46% 36% at 50% 50%, rgba(5,150,105,0.70) 0%, rgba(6,78,59,0.30) 55%, transparent 100%)",
    ambientCSS:
      "radial-gradient(ellipse 80% 65% at 50% 50%, rgba(45,212,191,0.10) 0%, transparent 100%)",
    haloCSS: "rgba(52,211,153,0.70)",
  },
  employee: {
    // Morning Indigo + Sky Blue
    spotlightR: 79,  spotlightG: 70,  spotlightB: 229,
    nodeR: 129,      nodeG: 140,      nodeB: 248,
    spotlightCSS:
      "radial-gradient(ellipse 46% 36% at 50% 50%, rgba(79,70,229,0.70) 0%, rgba(49,46,129,0.30) 55%, transparent 100%)",
    ambientCSS:
      "radial-gradient(ellipse 80% 65% at 50% 50%, rgba(14,165,233,0.10) 0%, transparent 100%)",
    haloCSS: "rgba(129,140,248,0.70)",
  },
};

/* ─── Deterministic node layout ─────────────────────────────────────────── */
// Nodes are in [0,1] normalised space
const NODES_NX: number[] = [
  // Corner accent nodes (bright)
  0.04, 0.96, 0.04, 0.96,
  // Edge mid-point accents
  0.50, 0.04, 0.96, 0.50,
  // Inner scattered
  0.14, 0.82, 0.28, 0.70, 0.18, 0.72,
  0.36, 0.60, 0.44, 0.54, 0.30, 0.68,
  0.08, 0.90, 0.22, 0.78, 0.12, 0.88,
  0.40, 0.64, 0.50, 0.50, 0.46, 0.52,
  0.16, 0.80, 0.32, 0.62, 0.24, 0.74,
  0.06, 0.92, 0.58, 0.42,
];
const NODES_NY: number[] = [
  // Corner accent nodes (bright)
  0.05, 0.05, 0.95, 0.95,
  // Edge mid-point accents
  0.04, 0.50, 0.50, 0.96,
  // Inner scattered
  0.12, 0.88, 0.20, 0.78, 0.32, 0.68,
  0.16, 0.82, 0.25, 0.72, 0.42, 0.58,
  0.38, 0.60, 0.45, 0.55, 0.62, 0.38,
  0.72, 0.28, 0.50, 0.50, 0.84, 0.16,
  0.90, 0.10, 0.08, 0.90, 0.75, 0.22,
  0.65, 0.35, 0.48, 0.54,
];
// First 8 nodes are bright accent nodes
const BRIGHT_COUNT = 8;
const NODE_COUNT = NODES_NX.length;

// Pre-compute edge list (connect nodes within distance threshold)
const EDGES: [number, number][] = (() => {
  const edges: [number, number][] = [];
  const MAX_D = 0.28; // normalised distance
  for (let i = 0; i < NODE_COUNT; i++) {
    let conn = 0;
    for (let j = i + 1; j < NODE_COUNT && conn < 5; j++) {
      const dx = NODES_NX[i] - NODES_NX[j];
      const dy = NODES_NY[i] - NODES_NY[j];
      if (Math.sqrt(dx * dx + dy * dy) < MAX_D) {
        edges.push([i, j]);
        conn++;
      }
    }
  }
  return edges;
})();

/* ─── Component ─────────────────────────────────────────────────────────── */
export const VolumetricAtmosphere: React.FC<VolumetricAtmosphereProps> = ({
  role = "admin",
}) => {
  const pal = useMemo(() => PALETTES[role] ?? PALETTES.admin, [role]);
  const palRef = useRef(pal);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // Keep palRef current whenever role changes
  useEffect(() => {
    palRef.current = pal;
  }, [pal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let W = 0, H = 0;
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      frame++;
      const p = palRef.current;
      const t = frame * 0.012; // time

      ctx.clearRect(0, 0, W, H);

      /* ── draw edges ────────────────────────────────────────────────── */
      for (const [i, j] of EDGES) {
        const ax = NODES_NX[i] * W, ay = NODES_NY[i] * H;
        const bx = NODES_NX[j] * W, by = NODES_NY[j] * H;

        // Shimmer: each edge has unique phase
        const phase = (i * 0.61 + j * 0.37);
        const shimmer = 0.5 + 0.5 * Math.sin(t + phase);

        // Lines are clearly visible: base 0.20, shimmer up to 0.42
        const alpha = 0.20 + 0.22 * shimmer;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(${p.nodeR},${p.nodeG},${p.nodeB},${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();
      }

      /* ── draw nodes ────────────────────────────────────────────────── */
      for (let i = 0; i < NODE_COUNT; i++) {
        const nx = NODES_NX[i] * W;
        const ny = NODES_NY[i] * H;
        const breathe = 0.6 + 0.4 * Math.sin(t * 1.1 + i * 0.83);
        const isBright = i < BRIGHT_COUNT;

        if (isBright) {
          // Large glow halo
          const haloR = 22 * breathe;
          const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, haloR);
          grd.addColorStop(0, `rgba(${p.nodeR},${p.nodeG},${p.nodeB},0.80)`);
          grd.addColorStop(0.35, `rgba(${p.nodeR},${p.nodeG},${p.nodeB},0.35)`);
          grd.addColorStop(1,   `rgba(${p.nodeR},${p.nodeG},${p.nodeB},0.00)`);
          ctx.beginPath();
          ctx.arc(nx, ny, haloR, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();

          // Core dot
          ctx.beginPath();
          ctx.arc(nx, ny, 3.5 * breathe, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.nodeR},${p.nodeG},${p.nodeB},0.95)`;
          ctx.fill();
        } else {
          // Small dim node
          const dotA = 0.25 + 0.25 * breathe;
          ctx.beginPath();
          ctx.arc(nx, ny, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.nodeR},${p.nodeG},${p.nodeB},${dotA.toFixed(2)})`;
          ctx.fill();
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []); // runs once; palette changes reach canvas via palRef

  return (
    <div className="volumetric-atmosphere-root" aria-hidden="true">

      {/* 1. Canvas — angular wireframe constellation mesh */}
      <canvas ref={canvasRef} className="constellation-canvas" />

      {/* 2. Tight card-centered spotlight bloom */}
      <motion.div
        className="card-spotlight-bloom"
        animate={{ background: pal.spotlightCSS }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* 3. Very faint ambient outer halo */}
      <motion.div
        className="ambient-outer-halo"
        animate={{ background: pal.ambientCSS }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* 4. SVG: card perimeter halo ring */}
      <svg
        className="atmosphere-svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="halo-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer ring — tight around card */}
        <motion.ellipse
          cx={720} cy={450} rx={330} ry={225}
          fill="none"
          animate={{ stroke: pal.haloCSS }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          strokeWidth="1.2"
          filter="url(#halo-glow)"
          className="card-halo-ring"
        />

        {/* Inner ring */}
        <motion.ellipse
          cx={720} cy={450} rx={250} ry={168}
          fill="none"
          animate={{ stroke: pal.haloCSS }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          strokeWidth="0.6"
          filter="url(#halo-glow)"
          className="card-halo-ring card-halo-ring-inner"
        />
      </svg>

      {/* 5. Edge vignette — darkens corners, keeps card area bright */}
      <div className="volumetric-vignette-overlay" />
    </div>
  );
};

export default VolumetricAtmosphere;
