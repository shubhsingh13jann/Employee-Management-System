import React, { useEffect, useRef } from "react";
import { FloatingPill } from "../FloatingPill/FloatingPill";
import { UserRole } from "../auth.types";
import { ShootingStars } from "./ShootingStars/ShootingStars";
import "./enterprise-background.css";

export interface EnterpriseBackgroundProps {
  role?: UserRole;
}

/**
 * EnterpriseBackground Component
 * 
 * High-performance 2D Canvas + CSS hardware-accelerated spatial background
 * featuring:
 * - Dynamic role-tier chromatic adaptation (Admin, Manager, Supervisor, Employee)
 * - Ambient volumetric lighting & dark vignette
 * - Technical perspective floor with glowing grid intersections
 * - Constellation network nodes with travelling data pulses & micro-particles
 * - Rotating digital wireframe globe with orbital rings & stipple matrix
 * - Glassmorphic floating business labels
 * - Large EMS watermark with subtle mouse parallax
 * - System metadata micro-codes & branded bottom telemetry
 */
const EnterpriseBackground: React.FC<EnterpriseBackgroundProps> = ({ role = "admin" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const roleRef = useRef<UserRole>(role);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let animationFrame: number;
    let mouseX = 0;
    let mouseY = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;
    let time = 0;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* =========================================================
       ROLE COLOR PALETTES & CHROMATIC THEMES
    ========================================================= */
    interface RoleColorSet {
      r: number;
      g: number;
      b: number;
    }

    interface RolePalette {
      primary: RoleColorSet;
      deep: RoleColorSet;
      light: RoleColorSet;
      glow: RoleColorSet;
      highlight: RoleColorSet;
      tint: RoleColorSet;
    }

    const ROLE_PALETTES: Record<UserRole, RolePalette> = {
      admin: {
        // Royal Amethyst Velvet / Electric Violet
        primary: { r: 139, g: 92, b: 246 },    // #8b5cf6
        deep: { r: 124, g: 58, b: 237 },       // #7c3aed
        light: { r: 192, g: 132, b: 252 },     // #c084fc
        glow: { r: 168, g: 85, b: 247 },      // #a855f7
        highlight: { r: 216, g: 180, b: 254 }, // #d8b4fe
        tint: { r: 35, g: 22, b: 65 },
      },
      manager: {
        // Corporate Ocean Azure / Electric Sky
        primary: { r: 37, g: 99, b: 235 },     // #2563eb
        deep: { r: 29, g: 78, b: 216 },        // #1d4ed8
        light: { r: 56, g: 189, b: 248 },      // #38bdf8
        glow: { r: 96, g: 165, b: 250 },      // #60a5fa
        highlight: { r: 186, g: 230, b: 253 }, // #bae6fd
        tint: { r: 15, g: 30, b: 65 },
      },
      supervisor: {
        // Jade Forest / Emerald Seafoam
        primary: { r: 5, g: 150, b: 105 },     // #059669
        deep: { r: 4, g: 120, b: 87 },         // #047857
        light: { r: 52, g: 211, b: 153 },      // #34d399
        glow: { r: 16, g: 185, b: 129 },      // #10b981
        highlight: { r: 167, g: 243, b: 208 }, // #a7f3d0
        tint: { r: 10, g: 45, b: 35 },
      },
      employee: {
        // Solar Amber / Warm Golden Honey
        primary: { r: 245, g: 158, b: 11 },    // #f59e0b
        deep: { r: 217, g: 119, b: 6 },        // #d97706
        light: { r: 253, g: 224, b: 71 },      // #fde047
        glow: { r: 250, g: 204, b: 21 },       // #facc15
        highlight: { r: 254, g: 240, b: 138 }, // #fef08a
        tint: { r: 42, g: 30, b: 12 },
      },
    };

    const initialPalette = ROLE_PALETTES[roleRef.current] || ROLE_PALETTES.admin;
    const currentColors: RolePalette = {
      primary: { ...initialPalette.primary },
      deep: { ...initialPalette.deep },
      light: { ...initialPalette.light },
      glow: { ...initialPalette.glow },
      highlight: { ...initialPalette.highlight },
      tint: { ...initialPalette.tint },
    };

    /* =========================================================
       CONFIGURATION
    ========================================================= */
    const CONFIG = {
      background: "#070b13",
      maxNetworkDistance: 240,
      networkNodeCount: 38,
      particleCount: 50,
      starCount: 80,
      gridSize: 44,
    };

    /* =========================================================
       DATA STRUCTURES
    ========================================================= */
    interface NetworkNode {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      z: number;
      vx: number;
      vy: number;
      baseVx: number;
      baseVy: number;
      driftVx: number;
      driftVy: number;
      repelVx: number;
      repelVy: number;
      radius: number;
      pulse: number;
      pulseSpeed: number;
      opacity: number;
      drift: number;
      colorOffset: number;
      state: 'appearing' | 'alive' | 'disappearing' | 'dead';
      stateStartTime: number;
      lifespan: number;
      deadspan: number;
      isBlasting?: boolean;
      blastRadius?: number;
    }

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      phase: number;
      speed: number;
    }

    interface Star {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      twinkle: number;
      phase: number;
    }

    let nodes: NetworkNode[] = [];
    let particles: Particle[] = [];
    let stars: Star[] = [];

    const random = (min: number, max: number) => Math.random() * (max - min) + min;
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    /* =========================================================
       RESIZE
    ========================================================= */
    const resize = () => {
      if (!wrapper || !canvas) return;
      width = wrapper.clientWidth;
      height = wrapper.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createScene();
    };

    /* =========================================================
       SCENE INITIALIZATION
    ========================================================= */
    const createNetworkNodes = () => {
      nodes = [];
      for (let i = 0; i < CONFIG.networkNodeCount; i++) {
        // Keep nodes away from center so the login card stays clean
        let x: number;
        let y: number;
        const region = Math.random();

        if (region < 0.40) {
          // 40% Top Right (Above buttons, large empty dark space)
          x = random(width * 0.55, width * 0.98);
          y = random(height * 0.05, height * 0.35);
        } else if (region < 0.70) {
          // 30% Far Right & Bottom Right (Around buttons & EMS watermark)
          x = random(width * 0.70, width * 0.98);
          y = random(height * 0.35, height * 0.95);
        } else if (region < 0.85) {
          // 15% Top Left (Above the globe)
          x = random(width * 0.02, width * 0.45);
          y = random(height * 0.05, height * 0.25);
        } else {
          // 15% Mid/Bottom Left (Sparse on the globe to avoid clutter)
          x = random(width * 0.02, width * 0.30);
          y = random(height * 0.25, height * 0.90);
        }

        const initialVx = random(-0.25, 0.25);
        const initialVy = random(-0.25, 0.25);

        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          z: random(0.2, 2.0),
          driftVx: random(-0.15, 0.15),
          driftVy: random(-0.15, 0.15),
          repelVx: 0,
          repelVy: 0,
          radius: Math.random() < 0.15 ? random(4, 6) : random(1, 3.5),
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: random(0.6, 1.4),
          opacity: Math.random() < 0.15 ? random(0.7, 1) : random(0.3, 0.7),
          drift: random(0.3, 1),
          colorOffset: random(-40, 40),
          state: 'appearing',
          stateStartTime: random(-60000, 0), // Start them at random points in their lifecycle so they don't all sync
          lifespan: random(30000, 60000), // 30-60 seconds alive
          deadspan: random(10000, 30000), // 10-30 seconds dead
        });
      }
    };

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < CONFIG.particleCount; i++) {
        particles.push({
          x: random(0, width),
          y: random(0, height),
          vx: random(-0.06, 0.06),
          vy: random(-0.04, 0.04),
          size: random(0.6, 1.8),
          alpha: random(0.15, 0.65),
          phase: random(0, Math.PI * 2),
          speed: random(0.3, 1.1),
        });
      }
    };

    const createStars = () => {
      stars = [];
      for (let i = 0; i < CONFIG.starCount; i++) {
        stars.push({
          x: random(0, width),
          y: random(0, height * 0.85),
          radius: random(0.3, 1.1),
          alpha: random(0.1, 0.4),
          twinkle: random(0.4, 1.4),
          phase: random(0, Math.PI * 2),
        });
      }
    };

    const createScene = () => {
      createNetworkNodes();
      createParticles();
      createStars();
    };

    /* =========================================================
       LAYER: RADIAL BACKGROUND
    ========================================================= */
    const drawBackground = () => {
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.38,
        0,
        width * 0.5,
        height * 0.38,
        Math.max(width, height) * 0.78
      );
      const t = currentColors.tint;
      const tr = Math.round(t.r), tg = Math.round(t.g), tb = Math.round(t.b);
      gradient.addColorStop(0, `rgba(${tr}, ${tg}, ${tb}, 0.35)`);
      gradient.addColorStop(0.35, "rgba(15, 17, 32, 0.35)");
      gradient.addColorStop(1, "rgba(7, 11, 19, 0.95)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    /* =========================================================
       LAYER: TECHNICAL GRID
    ========================================================= */
    const drawGrid = () => {
      ctx.save();
      const p = currentColors.primary;
      ctx.strokeStyle = `rgba(${Math.round(p.r)}, ${Math.round(p.g)}, ${Math.round(p.b)}, 0.05)`;
      ctx.lineWidth = 1;
      const gridSize = CONFIG.gridSize;
      const offset = prefersReducedMotion ? 0 : (time * 0.12) % gridSize;

      for (let x = -gridSize + offset; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = -gridSize + offset; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    };

    /* =========================================================
       LAYER: 3D HOLOGRAPHIC VALLEY TERRAIN FLOOR
       — Exact 3D wave curvature matching reference image
       — Elevated left hill (0.22h) sweeping into centered depth (0.84h)
       — 18 exponential perspective rows & 42 rays forming diamonds
    ========================================================= */
    const drawPerspectiveFloor = () => {
      // Center valley trough sits right below the login card
      
      // Valley trough dips downside directly under the card area
      const horizonBase = height * 0.855;
      const floorBottom = height + 40;
      const centerX = width * 0.5;

      ctx.save();

      const p = currentColors.primary;
      const d = currentColors.deep;
      const l = currentColors.light;
      const g = currentColors.glow;

      const pr = Math.round(p.r), pg = Math.round(p.g), pb = Math.round(p.b);
      const dr = Math.round(d.r), dg = Math.round(d.g), db = Math.round(d.b);
      const lr = Math.round(l.r), lg = Math.round(l.g), lb = Math.round(l.b);
      const gr = Math.round(g.r), gg = Math.round(g.g), gb = Math.round(g.b);

      // Mesh resolution calibrated to reference image density:
      // 18 transverse rows with exponential bunching near horizon
      // 42 longitudinal rays fanning down the slopes
      // Mesh resolution:
      // 18 transverse contour rows with perspective compression
      // 44 longitudinal rays fanning down the valley walls
      const NUM_ROWS = 22; // Increased slightly for better depth borders
      const NUM_COLS = 54; // Increased for smoother hills

      interface GridVertex {
        x: number;
        y: number;
        colFrac: number;
        rowT: number;
      }

      // Compute 3D valley terrain vertices
      const grid: GridVertex[][] = [];

      for (let r = 0; r < NUM_ROWS; r++) {
        const rowT = r / (NUM_ROWS - 1); // 0 at horizon, 1 at foreground
        const depth = Math.pow(rowT, 1.8); // exponential perspective compression
        const baseY = horizonBase + depth * (floorBottom - horizonBase);

        const rowVertices: GridVertex[] = [];

        for (let c = 0; c < NUM_COLS; c++) {
          const colFrac = (c / (NUM_COLS - 1)) * 2 - 1; // -1 (left) to +1 (right)

          // 3D Valley Topography:
          // 1. Left-most curve: Bell-shaped hill (Gaussian curve) so it slopes down on both sides.
          // 2. Under the card & mid-right: Flattened valley trough.
          // 3. Right-most side: Hill peaking near or beyond the right edge.
          
          // Gaussian curve for the left hill (peaks around -0.65)
          // Lowered the height from 0.28 to 0.22 as requested
          const leftHill = Math.exp(-Math.pow(colFrac + 0.65, 2) * 8) * (height * 0.22);
          
          // Right hill: Gaussian curve peaking exactly at the right edge (colFrac = 1.0)
          // This makes the left 50% of the curve visible as it smoothly rounds off at the edge
          const rightHill = Math.exp(-Math.pow(colFrac - 1.0, 2) * 6) * (height * 0.18);
          
          // Combine lifts
          let lift = leftHill + rightHill;
          
          // Natural organic landscape wave to add micro-details
          const wave = Math.sin(colFrac * Math.PI * 2.5) * (height * 0.015);
          lift += wave;

          // Elevation diminishes smoothly into the foreground
          const elevation = lift * (1.0 - depth * 0.45);
          const py = baseY - elevation;

          // Horizontal perspective spread:
          // Fans out MUCH wider in the foreground to create the deep diamond effect
          // At rowT=1 (depth=1), spread is width * 1.6, pulling the side lines out of the frame
          const spread = width * 0.5 + depth * (width * 1.8);
          const px = centerX + colFrac * spread;

          rowVertices.push({ x: px, y: py, colFrac, rowT });
        }
        grid.push(rowVertices);
      }

      // ─────────────────────────────────────────────────────
      // 1. ATMOSPHERIC TERRAIN FILL
      //    Follows the curved ridge silhouette down to bottom
      // ─────────────────────────────────────────────────────
      ctx.beginPath();
      ctx.moveTo(-60, height + 60);
      for (let c = 0; c < NUM_COLS; c++) {
        ctx.lineTo(grid[0][c].x, grid[0][c].y);
      }
      ctx.lineTo(width + 60, height + 60);
      ctx.closePath();

      const floorFill = ctx.createLinearGradient(0, height * 0.60, 0, floorBottom);
      floorFill.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.20)`);
      floorFill.addColorStop(0.35, `rgba(${dr}, ${dg}, ${db}, 0.12)`);
      floorFill.addColorStop(0.72, `rgba(${dr}, ${dg}, ${db}, 0.05)`);
      floorFill.addColorStop(1, `rgba(4, 6, 20, 0.98)`);
      ctx.fillStyle = floorFill;
      ctx.fill();

      // ─────────────────────────────────────────────────────      // 
      // 2. LONGITUDINAL RAYS (Down the valley walls)
      //    Radiate down the slopes, crossing contour lines at
      //    slanted angles to form distinct PARALLELOGRAM cells
      // 
      // Create a vertical gradient to fade out the longitudinal rays near the horizon
      const rayGrad = ctx.createLinearGradient(0, horizonBase - 40, 0, height);
      rayGrad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0)`);       // Invisible near horizon
      rayGrad.addColorStop(0.3, `rgba(${pr}, ${pg}, ${pb}, 0.08)`);  // Very subtle
      rayGrad.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0.15)`);    // Subtly visible in foreground

      ctx.beginPath();
      for (let c = 0; c < NUM_COLS; c++) {
        for (let r = 0; r < NUM_ROWS; r++) {
          const pt = grid[r][c];
          if (r === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
      }
      ctx.strokeStyle = rayGrad;
      ctx.lineWidth = 0.85;
      ctx.stroke();

      // 
      // 3. TRANSVERSE CONTOUR LINES (Across the valley)
      //    Follow the concave valley curves
      // 
      for (let r = 1; r < NUM_ROWS; r++) {
        const rowT = grid[r][0].rowT;
        // Fade out completely near the horizon (rowT = 0) for the infinite carpet effect
        // and brighter in the foreground (rowT = 1)
        const alpha = 0.20 * Math.pow(rowT, 0.7);

        ctx.beginPath();
        for (let c = 0; c < NUM_COLS; c++) {
          const pt = grid[r][c];
          if (c === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${Math.min(alpha, 0.20)})`;
        ctx.lineWidth = rowT < 0.20 ? 0.50 : 1.0;
        ctx.stroke();
      }

      // 
      // 4. TOP RIDGE CREST - GLOWING LUMINOUS HORIZON (Mountain Cliffs)
      // 
      // Wide bloom pass for the line
      ctx.beginPath();
      for (let c = 0; c < NUM_COLS; c++) {
        const pt = grid[0][c];
        if (c === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      
      const bloomGrad = ctx.createLinearGradient(0, 0, width, 0);
      bloomGrad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.8)`); // Bright left hill
      bloomGrad.addColorStop(0.25, `rgba(${pr}, ${pg}, ${pb}, 0.6)`);
      bloomGrad.addColorStop(0.45, `rgba(${pr}, ${pg}, ${pb}, 0)`);  // Invisible in center
      bloomGrad.addColorStop(0.75, `rgba(${pr}, ${pg}, ${pb}, 0)`);
      bloomGrad.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0.5)`);   // Subtle right hill
      
      ctx.strokeStyle = bloomGrad;
      ctx.lineWidth = 8;
      ctx.filter = "blur(6px)";
      ctx.stroke();
      ctx.filter = "none";

      // Sharp specular crest line connecting everything clearly
      ctx.beginPath();
      for (let c = 0; c < NUM_COLS; c++) {
        const pt = grid[0][c];
        if (c === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      
      const specularGrad = ctx.createLinearGradient(0, 0, width, 0);
      specularGrad.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, 0.95)`); // Very bright left cliff
      specularGrad.addColorStop(0.28, `rgba(${lr}, ${lg}, ${lb}, 0.8)`);
      specularGrad.addColorStop(0.42, `rgba(${lr}, ${lg}, ${lb}, 0)`);   // Fades out into the valley carpet
      specularGrad.addColorStop(0.78, `rgba(${lr}, ${lg}, ${lb}, 0)`);
      specularGrad.addColorStop(1, `rgba(${lr}, ${lg}, ${lb}, 0.7)`);    // Right cliff outline
      
      ctx.strokeStyle = specularGrad;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      // ─────────────────────────────────────────────────────
      // 6. ATMOSPHERIC VALLEY BASIN BLOOM
      // ─────────────────────────────────────────────────────
      const hBand = ctx.createRadialGradient(
        centerX,
        horizonBase - 30,
        0,
        centerX,
        horizonBase - 30,
        width * 0.75
      );
      hBand.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.24)`);
      hBand.addColorStop(0.25, `rgba(${pr}, ${pg}, ${pb}, 0.11)`);
      hBand.addColorStop(0.55, `rgba(${dr}, ${dg}, ${db}, 0.04)`);
      hBand.addColorStop(1, `rgba(${dr}, ${dg}, ${db}, 0)`);
      ctx.fillStyle = hBand;
      ctx.fillRect(0, height * 0.55, width, height * 0.45);

      ctx.restore();
    };

    /* =========================================================
       LAYER: AMBIENT VOLUMETRIC LIGHTS
    ========================================================= */
    const drawAmbientLights = () => {
      const p = currentColors.primary;
      const d = currentColors.deep;
      const l = currentColors.light;

      const lights = [
        // Top-center luminous role nebula (frames top of screen and login card)
        {
          x: width * 0.5,
          y: height * 0.04,
          radius: 460,
          alpha: 0.18,
          r: Math.round(p.r), g: Math.round(p.g), b: Math.round(p.b),
        },
        // Left globe aura
        {
          x: width * 0.14,
          y: height * 0.52,
          radius: 320,
          alpha: 0.14,
          r: Math.round(d.r), g: Math.round(d.g), b: Math.round(d.b),
        },
        // Right watermark aura
        {
          x: width * 0.88,
          y: height * 0.70,
          radius: 340,
          alpha: 0.11,
          r: Math.round(l.r), g: Math.round(l.g), b: Math.round(l.b),
        },
        // Bottom-center horizon upwelling (floor atmospheric glow)
        {
          x: width * 0.5,
          y: height * 0.88,
          radius: Math.max(width * 0.52, 560),
          alpha: 0.13,
          r: Math.round(p.r), g: Math.round(p.g), b: Math.round(p.b),
        },
      ];

      lights.forEach((light, index) => {
        const pulse =
          1 + Math.sin(time * (0.0006 + index * 0.0002)) * 0.08;
        const gradient = ctx.createRadialGradient(
          light.x,
          light.y,
          0,
          light.x,
          light.y,
          light.radius * pulse
        );
        gradient.addColorStop(0, `rgba(${light.r}, ${light.g}, ${light.b}, ${light.alpha})`);
        gradient.addColorStop(0.6, `rgba(${light.r}, ${light.g}, ${light.b}, ${light.alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(${light.r}, ${light.g}, ${light.b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          light.x - light.radius,
          light.y - light.radius,
          light.radius * 2,
          light.radius * 2
        );
      });
    };

    /* =========================================================
       LAYER: STARS & SPARKLES
    ========================================================= */
    const drawStars = () => {
      const l = currentColors.light;
      const lr = Math.round(l.r), lg = Math.round(l.g), lb = Math.round(l.b);
      stars.forEach((star) => {
        const blinkBase = Math.sin(time * 0.001 * star.twinkle + star.phase);
        const currentAlpha = star.alpha * (0.5 + blinkBase * 0.5);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${lr}, ${lg}, ${lb}, ${clamp(currentAlpha, 0.02, 1)})`;
        ctx.fill();
      });
    };

    /* =========================================================
       LAYER: NETWORK NODES & CONNECTIONS
    ========================================================= */
    const updateNodes = () => {
      nodes.forEach((node) => {
        // Handle lifecycle
        const timeInState = time - node.stateStartTime;
        switch (node.state) {
          case 'dead':
            if (timeInState > node.deadspan) {
              node.state = 'appearing';
              node.stateStartTime = time;
              node.baseX = random(0, width);
              node.baseY = random(0, height);
              node.driftVx = random(-0.15, 0.15);
              node.driftVy = random(-0.15, 0.15);
              node.repelVx = 0;
              node.repelVy = 0;
            }
            break;
          case 'appearing':
            if (timeInState > 2000) {
              node.state = 'alive';
              node.stateStartTime = time;
            }
            break;
          case 'alive':
            if (timeInState > node.lifespan) {
              node.state = 'disappearing';
              node.stateStartTime = time;
            }
            break;
          case 'disappearing':
            if (timeInState > 2000) {
              node.state = 'dead';
              node.stateStartTime = time;
              node.isBlasting = false;
            }
            break;
        }

        if (node.state === 'dead') return;

        if (!prefersReducedMotion) {
          // Physical magnetic repulsion
          const dx = node.baseX - mouseX; // Use absolute mouseX so it doesn't lag and rotate
          const dy = node.baseY - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200 && dist > 1) {
            const force = (1 - dist / 200) * 0.4;
            node.repelVx += (dx / dist) * force;
            node.repelVy += (dy / dist) * force;
          }

          // Friction only applies to the repulsion force, making it decay naturally
          node.repelVx *= 0.94;
          node.repelVy *= 0.94;

          node.baseX += node.driftVx + node.repelVx;
          node.baseY += node.driftVy + node.repelVy;
          
          if (node.baseX < -50) node.baseX = width + 50;
          if (node.baseX > width + 50) node.baseX = -50;
          if (node.baseY < -50) node.baseY = height + 50;
          if (node.baseY > height + 50) node.baseY = -50;

          // Pure 1:1 mapping (no ropes or sin/cos orbits)
          node.x = node.baseX;
          node.y = node.baseY;
        }
      });

      // Handle collisions (Supernova blast)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          if (a.state === 'dead' || b.state === 'dead') continue;
          if (a.isBlasting || b.isBlasting) continue;
          
          const dist = distance(a, b);
          if (dist < 4.0) { // Close enough to blast
            a.isBlasting = true;
            a.blastRadius = 0;
            b.isBlasting = true;
            b.blastRadius = 0;
          }
        }
      }
    };

    const drawConnections = () => {
      const p = currentColors.primary;
      const pr = Math.round(p.r), pg = Math.round(p.g), pb = Math.round(p.b);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dist = distance(a, b);

          if (dist < CONFIG.maxNetworkDistance) {
            const opacity =
              (1 - dist / CONFIG.maxNetworkDistance) * 0.28;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${opacity})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }
    };

    const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      let step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    };

    const drawNodes = () => {
      const g = currentColors.glow;
      const d = currentColors.deep;
      const h = currentColors.highlight;
      const baseGr = Math.round(g.r), baseGg = Math.round(g.g), baseGb = Math.round(g.b);
      const baseDr = Math.round(d.r), baseDg = Math.round(d.g), baseDb = Math.round(d.b);
      const hr = Math.round(h.r), hg = Math.round(h.g), hb = Math.round(h.b);

      nodes.forEach((node) => {
        if (node.state === 'dead') return;

        // Lifecycle opacity calculation
        const timeInState = time - node.stateStartTime;
        let lifecycleOpacity = node.opacity;
        if (node.state === 'appearing') {
          lifecycleOpacity = Math.min(1, timeInState / 2000) * node.opacity;
        } else if (node.state === 'disappearing') {
          lifecycleOpacity = Math.max(0, 1 - (timeInState / 2000)) * node.opacity;
        }

        // Feature 5: Temperature Color Variance
        const gr = clamp(baseGr + node.colorOffset, 0, 255);
        const gg = clamp(baseGg + node.colorOffset * 0.5, 0, 255);
        const gb = clamp(baseGb - node.colorOffset, 0, 255);

        const dr = clamp(baseDr + node.colorOffset, 0, 255);
        const dg = clamp(baseDg + node.colorOffset * 0.5, 0, 255);
        const db = clamp(baseDb - node.colorOffset, 0, 255);

        // Feature 1: Deep Random Blinking Effect
        const blinkBase = Math.sin(time * 0.001 * node.pulseSpeed + node.pulse);
        const deepBlink = Math.pow(blinkBase, 4);
        let currentOpacity = lifecycleOpacity * deepBlink * 1.5;
        const pulse = 1 + blinkBase * 0.4;
        
        // Remove global parallax jelly effect, keep local position
        let px = node.x;
        let py = node.y;

        // Save computed position for links and collisions
        (node as any).px = px;
        (node as any).py = py;

        // Handle Supernova Blast animation
        if (node.isBlasting) {
          node.blastRadius = (node.blastRadius || 0) + 2.5;
          const blastAlpha = Math.max(0, 1 - (node.blastRadius / 100));
          if (blastAlpha <= 0) {
            // Respawn
            node.isBlasting = false;
            node.baseX = random(0, width);
            node.baseY = random(0, height);
            node.state = 'dead';
            node.stateStartTime = time;
            node.blastRadius = 0;
          } else {
            ctx.beginPath();
            ctx.arc(px, py, node.blastRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${blastAlpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();
            // Core flash
            ctx.beginPath();
            ctx.arc(px, py, node.radius * 6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${blastAlpha})`;
            ctx.fill();
          }
          return; // Skip drawing normal star
        }

        // Feature 3: Cursor Illumination & Magnetic Repulsion
        // Feature 3: Cursor Illumination
        const dx = px - smoothMouseX;
        const dy = py - smoothMouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 200;

        let finalOpacity = currentOpacity;
        if (dist < interactionRadius) {
          const intensity = 1 - dist / interactionRadius;
          finalOpacity = Math.max(currentOpacity, intensity * 0.9);
          // Magnetic repulsion
          // Magnetic repulsion (push away from cursor)
          px += (dx / dist) * intensity * 20;
          py += (dy / dist) * intensity * 20;
        }

        // Save computed position for links and collisions
        (node as any).px = px;
        (node as any).py = py;

        // Draw star
        const glowRadius = node.radius * 6 * pulse;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
        glow.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${clamp(finalOpacity * 0.8, 0.01, 1)})`);
        glow.addColorStop(1, `rgba(${dr}, ${dg}, ${db}, 0)`);

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Solid star core (4 spikes)
        drawStar(ctx, px, py, 4, node.radius * 2.5 * pulse, node.radius * 0.6 * pulse);
        ctx.fillStyle = `rgba(${hr}, ${hg}, ${hb}, ${clamp(finalOpacity, 0.01, 1)})`;
        ctx.fill();
      });

      // Feature 4: Dynamic Constellation Links
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i] as any;
          const b = nodes[j] as any;
          if (a.state === 'dead' || b.state === 'dead') continue;
          if (a.isBlasting || b.isBlasting) continue;

          // Only use px/py if they are defined (not dead)
          if (a.px === undefined || b.px === undefined) continue;

          const dist = distance({ x: a.px, y: a.py }, { x: b.px, y: b.py });
          
          if (dist < 60 && dist > 4.0) { // Limit to 60px so they don't link when far
            const linkAlpha = (1 - dist / 60) * 0.4;
            ctx.beginPath();
            ctx.moveTo(a.px, a.py);
            ctx.lineTo(b.px, b.py);
            ctx.strokeStyle = `rgba(${hr}, ${hg}, ${hb}, ${linkAlpha})`;
            ctx.stroke();
          }
        }
      }
    };

    /* =========================================================
       LAYER: TRAVELLING DATA PULSES
    ========================================================= */
    const drawDataPulses = () => {
      const pulseIndex = Math.floor(time * 0.0008) % nodes.length;
      const a = nodes[pulseIndex];
      const b = nodes[(pulseIndex + 1) % nodes.length];
      if (!a || !b) return;

      const dist = distance(a, b);
      if (dist > CONFIG.maxNetworkDistance) return;

      const progress = (time * 0.00022) % 1;
      const px = a.x + (b.x - a.x) * progress;
      const py = a.y + (b.y - a.y) * progress;

      const l = currentColors.light;
      const d = currentColors.deep;

      const glow = ctx.createRadialGradient(px, py, 0, px, py, 14);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      glow.addColorStop(0.2, `rgba(${Math.round(l.r)}, ${Math.round(l.g)}, ${Math.round(l.b)}, 0.85)`);
      glow.addColorStop(1, `rgba(${Math.round(d.r)}, ${Math.round(d.g)}, ${Math.round(d.b)}, 0)`);

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      ctx.fill();
    };

    /* =========================================================
       LAYER: PARTICLES
    ========================================================= */
    const updateParticles = () => {
      particles.forEach((p) => {
        if (prefersReducedMotion) return;
        p.x += p.vx * p.speed;
        p.y += p.vy * p.speed;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
      });
    };

    const drawParticles = () => {
      const l = currentColors.light;
      const lr = Math.round(l.r), lg = Math.round(l.g), lb = Math.round(l.b);
      particles.forEach((p) => {
        const alpha =
          p.alpha *
          (0.75 + Math.sin(time * 0.001 * p.speed + p.phase) * 0.25);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha})`;
        ctx.fill();
      });
    };

    /* =========================================================
       LAYER: CORNER VIGNETTE
    ========================================================= */
    const drawVignette = () => {
      // Side + top corner darkening
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.42,
        Math.min(width, height) * 0.20,
        width * 0.5,
        height * 0.42,
        Math.max(width, height) * 0.78
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.6, "rgba(0,0,0,0.08)");
      gradient.addColorStop(1, "rgba(3, 6, 12, 0.62)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    /* =========================================================
       MASTER RENDER LOOP
    ========================================================= */
    const render = () => {
      time += prefersReducedMotion ? 0 : 16;

      // Smooth mouse interpolation
      smoothMouseX += (mouseX - smoothMouseX) * 0.04;
      smoothMouseY += (mouseY - smoothMouseY) * 0.04;

      // Smoothly morph canvas chromatic colors to active role tier palette
      const targetPalette = ROLE_PALETTES[roleRef.current] || ROLE_PALETTES.admin;
      const LERP_RATE = 0.06;
      const lerpChannel = (c: RoleColorSet, t: RoleColorSet) => {
        c.r += (t.r - c.r) * LERP_RATE;
        c.g += (t.g - c.g) * LERP_RATE;
        c.b += (t.b - c.b) * LERP_RATE;
      };

      lerpChannel(currentColors.primary, targetPalette.primary);
      lerpChannel(currentColors.deep, targetPalette.deep);
      lerpChannel(currentColors.light, targetPalette.light);
      lerpChannel(currentColors.glow, targetPalette.glow);
      lerpChannel(currentColors.highlight, targetPalette.highlight);
      lerpChannel(currentColors.tint, targetPalette.tint);

      ctx.clearRect(0, 0, width, height);

      // 1. Base Dark Solid
      ctx.fillStyle = CONFIG.background;
      ctx.fillRect(0, 0, width, height);

      // 2. Radial Depth
      drawBackground();

      // 3. Volumetric Atmosphere
      drawAmbientLights();

      // 4. Subtle Grid (REMOVED per user request)
      // drawGrid();

      // 5. Ambient Stars
      drawStars();

      // 6. Perspective Cyber Floor
      drawPerspectiveFloor();

      // 7. Constellation Connections (Disabled)
      updateNodes();
      // drawConnections();

      // 8. Dynamic Data Beacons (Disabled)
      // drawDataPulses();

      // 9. Floating Sparkles
      updateParticles();
      drawParticles();

      // 10. Constellation Stars
      drawNodes();

      // 11. Dark Vignette
      drawVignette();

      // Expose smooth mouse parallax offset to CSS
      const normX = smoothMouseX / width - 0.5;
      const normY = smoothMouseY / height - 0.5;

      wrapper.style.setProperty("--mouse-x", `${normX * 18}px`);
      wrapper.style.setProperty("--mouse-y", `${normY * 14}px`);

      animationFrame = requestAnimationFrame(render);
    };

    /* =========================================================
       EVENT LISTENERS
    ========================================================= */
    const handleMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseX = width / 2;
      mouseY = height / 2;
    };

    wrapper.addEventListener("mousemove", handleMouseMove);
    wrapper.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", resize);

    resize();
    mouseX = width / 2;
    mouseY = height / 2;
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      wrapper.removeEventListener("mousemove", handleMouseMove);
      wrapper.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="enterprise-background"
      data-role={role}
      aria-hidden="true"
    >
      {/* Hardware-accelerated dynamic canvas */}
      <canvas ref={canvasRef} className="enterprise-canvas" />

      {/* Continuous falling shooting stars */}
      <ShootingStars />

      {/* ===================================================
          LARGE EMS WATERMARK (Bottom Right)
      =================================================== */}
      <div className="ems-watermark">
        <div className="ems-watermark-title">EMS</div>
        <div className="ems-watermark-subtitle">WORKFORCE EXCELLENCE</div>
      </div>

      {/* ===================================================
          LEFT DIGITAL GLOBE (Wireframe, Lat/Long, Orbit Rings)
      =================================================== */}
      <div className="digital-globe">
        <div className="globe-core">
          <div className="globe-meridian m1" />
          <div className="globe-meridian m2" />
          <div className="globe-meridian m3" />

          <div className="globe-latitude l1" />
          <div className="globe-latitude l2" />
          <div className="globe-latitude l3" />
          <div className="globe-latitude l4" />

          <div className="globe-dots" />
        </div>

        {/* Stationary orbit path (front glowing, back transparent) */}
        <div className="globe-orbit orbit-path" />
        
        {/* Invisible base that holds the 3D squished space */}
        <div className="globe-orbit orbit-base">
          {/* Runner that revolves around the squished space */}
          <div className="moon-runner">
            {/* Unsquish container that counter-rotates and un-scales */}
            <div className="moon-unsquish">
              <div className="moon-visual"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          FLOATING ENTERPRISE PILLS (Exact matches to reference)
      =================================================== */}
      {/* Left Side Pills */}
      <FloatingPill id="people" className="people" iconClass="bi bi-people-fill" label="People" />
      <FloatingPill id="teams" className="teams" iconClass="bi bi-people" label="Teams" />
      <FloatingPill id="growth" className="growth" iconClass="bi bi-bar-chart-fill" label="Growth" />

      {/* Right Side Pills */}
      <FloatingPill id="productivity" className="productivity" iconClass="bi bi-lightning-charge-fill" label="Productivity" />
      <FloatingPill id="security" className="security" iconClass="bi bi-shield-shaded" label="Security" />
      <FloatingPill id="collaboration" className="collaboration" iconClass="bi bi-diagram-3-fill" label="Collaboration" />

      {/* ===================================================
          MICRO-DATA CODES
      =================================================== */}
      <div className="data-code code-one">EMS / CORE / 01</div>
      <div className="data-code code-two">SECURE_NODE</div>
      <div className="data-code code-three">WORKFORCE_NETWORK</div>

      {/* ===================================================
          BOTTOM MESSAGES
      =================================================== */}
      <div className="bottom-message left">
        <span className="vertical-line" />
        <div>
          <strong>Empowering People</strong>
          <small>Building Better Workplaces</small>
        </div>
      </div>

      <div className="bottom-message right">
        <div>
          <strong>A Smarter Workforce</strong>
          <small>A Brighter Tomorrow</small>
        </div>
        <span className="vertical-line" />
      </div>
    </div>
  );
};

export default EnterpriseBackground;

