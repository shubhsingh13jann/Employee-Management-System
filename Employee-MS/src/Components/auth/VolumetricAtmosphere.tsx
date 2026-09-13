import React, { useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { UserRole } from "./auth.types";
import "./volumetricAtmosphere.css";

export interface VolumetricAtmosphereProps {
  role?: UserRole;
}

// Role-reactive color palettes
const PALETTES: Record<
  UserRole,
  { primary: string; secondary: string; node: string; halo: string; mesh: string }
> = {
  admin: {
    primary: "rgba(147, 51, 234, 0.55)",     // amethyst velvet core
    secondary: "rgba(245, 158, 11, 0.18)",   // imperial gold rim
    node: "#c084fc",
    halo: "rgba(192, 132, 252, 0.55)",
    mesh: "rgba(167, 139, 250, 0.18)",
  },
  manager: {
    primary: "rgba(37, 99, 235, 0.55)",      // executive sapphire core
    secondary: "rgba(56, 189, 248, 0.18)",   // electric azure rim
    node: "#38bdf8",
    halo: "rgba(56, 189, 248, 0.55)",
    mesh: "rgba(96, 165, 250, 0.18)",
  },
  supervisor: {
    primary: "rgba(5, 150, 105, 0.55)",      // jade forest core
    secondary: "rgba(45, 212, 191, 0.18)",   // seafoam rim
    node: "#34d399",
    halo: "rgba(45, 212, 191, 0.55)",
    mesh: "rgba(52, 211, 153, 0.18)",
  },
  employee: {
    primary: "rgba(79, 70, 229, 0.55)",      // morning indigo core
    secondary: "rgba(14, 165, 233, 0.18)",   // sky blue rim
    node: "#818cf8",
    halo: "rgba(129, 140, 248, 0.55)",
    mesh: "rgba(129, 140, 248, 0.18)",
  },
};

// Deterministic pseudo-random node positions (seeded so they never change layout on re-render)
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };
}

interface Node { x: number; y: number; size: number; bright: boolean }

function generateNodes(): Node[] {
  const rand = seededRand(42);
  const nodes: Node[] = [];

  // Corner / edge accent nodes (bright)
  const cornerNodes: Node[] = [
    { x: 0.05, y: 0.06, size: 4.5, bright: true },
    { x: 0.94, y: 0.05, size: 4, bright: true },
    { x: 0.03, y: 0.93, size: 4.5, bright: true },
    { x: 0.95, y: 0.94, size: 3.5, bright: true },
    { x: 0.50, y: 0.04, size: 3.5, bright: true },
    { x: 0.14, y: 0.50, size: 3, bright: true },
    { x: 0.86, y: 0.50, size: 3, bright: true },
  ];
  nodes.push(...cornerNodes);

  // Scattered mid-density nodes
  for (let i = 0; i < 36; i++) {
    nodes.push({
      x: rand(),
      y: rand(),
      size: 1.2 + rand() * 2,
      bright: rand() > 0.78,
    });
  }
  return nodes;
}

function generateEdges(nodes: Node[]): [number, number][] {
  const edges: [number, number][] = [];
  const W = 1440, H = 900;
  const MAX_DIST = 340; // max connection distance in px

  for (let i = 0; i < nodes.length; i++) {
    let connections = 0;
    for (let j = i + 1; j < nodes.length; j++) {
      if (connections >= 4) break;
      const dx = (nodes[i].x - nodes[j].x) * W;
      const dy = (nodes[i].y - nodes[j].y) * H;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) {
        edges.push([i, j]);
        connections++;
      }
    }
  }
  return edges;
}

const NODES = generateNodes();
const EDGES = generateEdges(NODES);

// Canvas-based animated wireframe for performance
export const VolumetricAtmosphere: React.FC<VolumetricAtmosphereProps> = ({
  role = "admin",
}) => {
  const palette = useMemo(() => PALETTES[role] || PALETTES.admin, [role]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const paletteRef = useRef(palette);

  useEffect(() => {
    paletteRef.current = palette;
  }, [palette]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const pal = paletteRef.current;
      t += 0.005;

      // --- Draw mesh edges ---
      EDGES.forEach(([i, j]) => {
        const a = NODES[i];
        const b = NODES[j];
        const ax = a.x * W, ay = a.y * H;
        const bx = b.x * W, by = b.y * H;

        // Fade lines near center (the spotlight is bright there; lines fade so card stands out)
        const midX = (ax + bx) / 2;
        const midY = (ay + by) / 2;
        const distFromCenter = Math.sqrt(
          Math.pow((midX - W / 2) / W, 2) + Math.pow((midY - H / 2) / H, 2)
        );
        const centerFade = Math.min(1, distFromCenter * 3.5);

        // Gentle shimmer per edge using t
        const shimmer = 0.5 + 0.5 * Math.sin(t + i * 0.7 + j * 0.3);
        const alpha = 0.08 + 0.14 * shimmer * centerFade;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = pal.mesh.replace(
          /[\d.]+\)$/,
          `${alpha.toFixed(3)})`
        );
        ctx.lineWidth = 0.75;
        ctx.stroke();
      });

      // --- Draw nodes ---
      NODES.forEach((node, i) => {
        const nx = node.x * W;
        const ny = node.y * H;

        // Distance from screen center for edge brightening
        const dx = (nx - W / 2) / W;
        const dy = (ny - H / 2) / H;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        const edgeBrightness = Math.min(1, distFromCenter * 2.8);

        const breathe = 0.6 + 0.4 * Math.sin(t * 1.3 + i * 0.9);

        if (node.bright) {
          // Outer glow halo
          const grd = ctx.createRadialGradient(nx, ny, 0, nx, ny, node.size * 5);
          grd.addColorStop(0, pal.node + "cc");
          grd.addColorStop(0.4, pal.node + "55");
          grd.addColorStop(1, pal.node + "00");
          ctx.beginPath();
          ctx.arc(nx, ny, node.size * 5 * breathe, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.globalAlpha = 0.7 * edgeBrightness;
          ctx.fill();

          // Core dot
          ctx.beginPath();
          ctx.arc(nx, ny, node.size * breathe, 0, Math.PI * 2);
          ctx.fillStyle = pal.node;
          ctx.globalAlpha = 0.9 * edgeBrightness;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else {
          // Small dim node
          const alpha = (0.2 + 0.3 * breathe) * edgeBrightness;
          ctx.beginPath();
          ctx.arc(nx, ny, node.size * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = pal.mesh.replace(/[\d.]+\)$/, `${alpha.toFixed(3)})`);
          ctx.globalAlpha = 1;
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []); // only run once — palette changes reflected via ref

  return (
    <div className="volumetric-atmosphere-root" aria-hidden="true">
      {/* === 1. Angular Wireframe Constellation Canvas === */}
      <canvas ref={canvasRef} className="constellation-canvas" />

      {/* === 2. Tight Card-Centered Spotlight Bloom === */}
      <motion.div
        className="card-spotlight-bloom"
        animate={{
          background: `radial-gradient(ellipse 48% 38% at 50% 50%, ${palette.primary} 0%, rgba(9,13,22,0) 100%)`,
        }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* === 3. Outer ambient halo (very faint, role colored) === */}
      <motion.div
        className="ambient-outer-halo"
        animate={{
          background: `radial-gradient(ellipse 75% 60% at 50% 50%, ${palette.secondary} 0%, rgba(9,13,22,0) 100%)`,
        }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* === 4. SVG: Card Perimeter Halo Ring + subtle breathing rings === */}
      <svg
        className="atmosphere-svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glow filter for halo ring */}
          <filter id="halo-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Node glow filter */}
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Card perimeter halo ring — tightly hugging the card area */}
        <motion.ellipse
          cx="720"
          cy="450"
          rx="320"
          ry="220"
          fill="none"
          animate={{ stroke: palette.halo }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          strokeWidth="1.5"
          filter="url(#halo-glow)"
          className="card-halo-ring"
        />

        {/* Second tighter inner ring */}
        <motion.ellipse
          cx="720"
          cy="450"
          rx="240"
          ry="160"
          fill="none"
          animate={{ stroke: palette.halo }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          strokeWidth="0.75"
          filter="url(#halo-glow)"
          className="card-halo-ring card-halo-ring-inner"
        />
      </svg>

      {/* === 5. Subtle dark vignette to keep edges deep === */}
      <div className="volumetric-vignette-overlay" />
    </div>
  );
};

export default VolumetricAtmosphere;
