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

    // Force animations on regardless of OS settings, since the user wants to see the physics
    const prefersReducedMotion = false;

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
      maxNetworkDistance: 100, // Reduced from 240 so lines aren't drawn when stars are far apart
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
      vx?: number;
      vy?: number;
      baseVx?: number;
      baseVy?: number;
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

    interface BlastParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      decay: number;
      size: number;
      sides: number;
      rotation: number;
      rotSpeed: number;
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
    let blastParticles: BlastParticle[] = [];
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
          vx: initialVx,
          vy: initialVy,
          baseVx: initialVx,
          baseVy: initialVy,
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
          deadspan: random(5000, 7000), // 5-7 seconds dead
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

      const floorFill = ctx.createLinearGradient(0, horizonBase - height * 0.25, 0, floorBottom);
      floorFill.addColorStop(0, `rgba(${Math.round(dr * 0.25 + 6)}, ${Math.round(dg * 0.25 + 8)}, ${Math.round(db * 0.25 + 20)}, 0.88)`);
      floorFill.addColorStop(0.35, `rgba(${Math.round(dr * 0.15 + 4)}, ${Math.round(dg * 0.15 + 6)}, ${Math.round(db * 0.15 + 15)}, 0.94)`);
      floorFill.addColorStop(0.70, `rgba(4, 6, 16, 0.98)`);
      floorFill.addColorStop(1, `rgba(2, 4, 10, 1.0)`);
      ctx.fillStyle = floorFill;
      ctx.fill();

      // ─────────────────────────────────────────────────────
      // 2. LONGITUDINAL RAYS (Down the valley walls)
      //    Radiate down the slopes, crossing contour lines at
      //    slanted angles to form distinct PARALLELOGRAM cells
      // ─────────────────────────────────────────────────────
      const rayGrad = ctx.createLinearGradient(0, horizonBase - 30, 0, height);
      rayGrad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0)`);       // Invisible at distant horizon for infinite depth
      rayGrad.addColorStop(0.20, `rgba(${pr}, ${pg}, ${pb}, 0.10)`); // Gently emerges as rays approach
      rayGrad.addColorStop(0.55, `rgba(${pr}, ${pg}, ${pb}, 0.24)`); // Visible in mid-valley
      rayGrad.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0.38)`);    // Crisp and bright in foreground

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
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // ─────────────────────────────────────────────────────
      // 3. TRANSVERSE CONTOUR LINES (Across the valley)
      //    Follow the concave valley curves, smoothly fading
      //    towards the horizon to create the infinite carpet effect
      // ─────────────────────────────────────────────────────
      for (let r = 1; r < NUM_ROWS; r++) {
        const rowT = grid[r][0].rowT;
        // Smooth perspective fade towards horizon so the flat valley feels infinite
        const alpha = Math.min(0.38 * Math.pow(rowT, 1.25), 0.42);

        ctx.beginPath();
        for (let c = 0; c < NUM_COLS; c++) {
          const pt = grid[r][c];
          if (c === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = rowT < 0.25 ? 0.75 : 1.15;
        ctx.stroke();
      }

      // ─────────────────────────────────────────────────────
      // 4. TOP RIDGE CREST - GLOWING LUMINOUS HILL CURVE
      //    Only the curve (hill) areas glow; the flat central
      //    valley has 0 glow so it feels like it is infinitely
      //    going into deep space. The glow slowly disappears
      //    as the hill slope descends to the valley floor.
      // ─────────────────────────────────────────────────────
      // Wide bloom pass for the glowing mountain crest
      ctx.beginPath();
      for (let c = 0; c < NUM_COLS; c++) {
        const pt = grid[0][c];
        if (c === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }

      const bloomGrad = ctx.createLinearGradient(0, 0, width, 0);
      // Left hill curve: glowing crest slowly and smoothly disappearing down the slope
      bloomGrad.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0.85)`);
      bloomGrad.addColorStop(0.18, `rgba(${pr}, ${pg}, ${pb}, 0.95)`); // Peak of left hill
      bloomGrad.addColorStop(0.28, `rgba(${pr}, ${pg}, ${pb}, 0.60)`); // Descending left slope
      bloomGrad.addColorStop(0.35, `rgba(${pr}, ${pg}, ${pb}, 0.22)`); // Slowly fading
      bloomGrad.addColorStop(0.40, `rgba(${pr}, ${pg}, ${pb}, 0.05)`); // Almost reached valley floor
      bloomGrad.addColorStop(0.43, `rgba(${pr}, ${pg}, ${pb}, 0)`);    // Completely 0 before flat valley

      // Flat valley area: ABSOLUTELY ZERO GLOW (infinitely receding expanse)
      bloomGrad.addColorStop(0.60, `rgba(${pr}, ${pg}, ${pb}, 0)`);    // Zero throughout flat valley

      // Right hill curve: slowly emerges and glows up the right slope
      bloomGrad.addColorStop(0.63, `rgba(${pr}, ${pg}, ${pb}, 0.05)`); // Gently begins rising
      bloomGrad.addColorStop(0.68, `rgba(${pr}, ${pg}, ${pb}, 0.22)`); // Ascending right slope
      bloomGrad.addColorStop(0.78, `rgba(${pr}, ${pg}, ${pb}, 0.55)`); // Mid-right hill
      bloomGrad.addColorStop(0.90, `rgba(${pr}, ${pg}, ${pb}, 0.80)`); // Approaching peak
      bloomGrad.addColorStop(1.0, `rgba(${pr}, ${pg}, ${pb}, 0.90)`);  // Peak of right hill

      ctx.strokeStyle = bloomGrad;
      ctx.lineWidth = 6;
      ctx.filter = "blur(4px)";
      ctx.stroke();
      ctx.filter = "none";

      // Sharp glowing specular wire along the curve
      ctx.beginPath();
      for (let c = 0; c < NUM_COLS; c++) {
        const pt = grid[0][c];
        if (c === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }

      const specularGrad = ctx.createLinearGradient(0, 0, width, 0);
      // Left hill specular crest
      specularGrad.addColorStop(0, `rgba(${lr}, ${lg}, ${lb}, 0.90)`);
      specularGrad.addColorStop(0.18, `rgba(${lr}, ${lg}, ${lb}, 0.98)`); // Crisp peak
      specularGrad.addColorStop(0.28, `rgba(${lr}, ${lg}, ${lb}, 0.65)`);
      specularGrad.addColorStop(0.35, `rgba(${lr}, ${lg}, ${lb}, 0.25)`); // Slowly fading
      specularGrad.addColorStop(0.40, `rgba(${lr}, ${lg}, ${lb}, 0.06)`);
      specularGrad.addColorStop(0.43, `rgba(${lr}, ${lg}, ${lb}, 0)`);    // Zero at flat area

      // Flat valley area: ZERO GLOW
      specularGrad.addColorStop(0.60, `rgba(${lr}, ${lg}, ${lb}, 0)`);

      // Right hill specular crest
      specularGrad.addColorStop(0.63, `rgba(${lr}, ${lg}, ${lb}, 0.06)`);
      specularGrad.addColorStop(0.68, `rgba(${lr}, ${lg}, ${lb}, 0.25)`);
      specularGrad.addColorStop(0.78, `rgba(${lr}, ${lg}, ${lb}, 0.60)`);
      specularGrad.addColorStop(0.90, `rgba(${lr}, ${lg}, ${lb}, 0.85)`);
      specularGrad.addColorStop(1.0, `rgba(${lr}, ${lg}, ${lb}, 0.95)`);

      ctx.strokeStyle = specularGrad;
      ctx.lineWidth = 1.8;
      ctx.stroke();

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
              node.driftVx = random(-0.25, 0.25);
              node.driftVy = random(-0.25, 0.25);
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
          if (node !== draggedNode) {
            // Smooth glide friction for when they are thrown
            node.repelVx *= 0.98;
            node.repelVy *= 0.98;
            
            // Higher speed cap so they can fly smoothly across the screen
            const speed = Math.sqrt(node.repelVx * node.repelVx + node.repelVy * node.repelVy);
            if (speed > 12) {
              node.repelVx = (node.repelVx / speed) * 12;
              node.repelVy = (node.repelVy / speed) * 12;
            }
  
            node.baseX += node.driftVx + node.repelVx;
            node.baseY += node.driftVy + node.repelVy;
          }
          
          // Bounce off edges smoothly like the floating pills do
          if (node.baseX < 0) {
            node.baseX = 0;
            node.driftVx *= -1;
            node.repelVx *= -0.8; // Bounce dampening
          }
          if (node.baseX > width) {
            node.baseX = width;
            node.driftVx *= -1;
            node.repelVx *= -0.8;
          }
          if (node.baseY < 0) {
            node.baseY = 0;
            node.driftVy *= -1;
            node.repelVy *= -0.8;
          }
          if (node.baseY > height) {
            node.baseY = height;
            node.driftVy *= -1;
            node.repelVy *= -0.8;
          }

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
          // Increased collision radius so they easily blast when pushed into each other
          if (dist < 15.0) { 
            a.isBlasting = true;
            a.blastRadius = 0;
            b.isBlasting = true;
            b.blastRadius = 0;

            // Spawn split particles drifting in space
            const cx = (a.baseX + b.baseX) / 2;
            const cy = (a.baseY + b.baseY) / 2;
            for (let k = 0; k < 12; k++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 2 + 0.5; // Slightly slower initial burst
              blastParticles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: Math.random() * 0.005 + 0.003, // Very slow decay
                size: Math.random() * 3 + 1,
                sides: Math.floor(Math.random() * 3) + 3, // 3 to 5 sides (triangle, square, pentagon)
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.1
              });
            }

            if (draggedNode === a || draggedNode === b) {
              draggedNode = null;
            }
          }
        }
      }
    };

    // drawConnections removed as requested

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
            // Supernova bright central flash
            const glowGrad = ctx.createRadialGradient(px, py, 0, px, py, 40);
            glowGrad.addColorStop(0, `rgba(255, 255, 255, ${blastAlpha})`);
            glowGrad.addColorStop(0.3, `rgba(${hr}, ${hg}, ${hb}, ${blastAlpha * 0.8})`);
            glowGrad.addColorStop(1, `rgba(${baseDr}, ${baseDg}, ${baseDb}, 0)`);
            
            ctx.beginPath();
            ctx.arc(px, py, 40, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();

            // Quick sparkle core
            drawStar(ctx, px, py, 4, node.radius * 4 * blastAlpha, node.radius * blastAlpha);
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
        // Feature 3: Cursor Illumination
        // Make stars glow brightly when near cursor
        let finalOpacity = currentOpacity;
        if (dist < interactionRadius) {
          const intensity = 1 - dist / interactionRadius;
          finalOpacity = Math.max(currentOpacity, intensity * 0.9);
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

      // Feature 4: Dynamic Constellation Links removed as requested

        // Draw and update blast particles
        for (let i = blastParticles.length - 1; i >= 0; i--) {
          const p = blastParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          
          // Less friction so they float for longer
          p.vx *= 0.99;
          p.vy *= 0.99;
          
          p.rotation += p.rotSpeed;
          p.life -= p.decay;

          if (p.life <= 0) {
            blastParticles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          
          ctx.beginPath();
          for (let j = 0; j < p.sides; j++) {
            const a = (Math.PI * 2 * j) / p.sides;
            // Add a little randomness to the radius to make them jagged shapes
            const r = p.size;
            if (j === 0) {
              ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            } else {
              ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
          }
          ctx.closePath();
          ctx.fillStyle = `rgba(${hr}, ${hg}, ${hb}, ${p.life})`;
          ctx.fill();
          ctx.restore();
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

      // 7. Constellation Connections
      updateNodes();

      // 8. Dynamic Data Beacons
      drawDataPulses();

      // 9. Constellation Stars
      drawNodes();

      // 10. Dark Vignette
      drawVignette();

      // Expose smooth mouse parallax offset to CSS
      const normX = smoothMouseX / width - 0.5;
      const normY = smoothMouseY / height - 0.5;

      wrapper.style.setProperty("--mouse-x", `${normX * 18}px`);
      wrapper.style.setProperty("--mouse-y", `${normY * 14}px`);

      animationFrame = requestAnimationFrame(render);
    };

    /* =========================================================
       EVENT LISTENERS & DRAG PHYSICS
    ========================================================= */
    let draggedNode: NetworkNode | null = null;
    let lastDragX = 0;
    let lastDragY = 0;
    let dragVelocityX = 0;
    let dragVelocityY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseX = mx;
      mouseY = my;

      // Find if we clicked on a node
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        if (node.state === 'dead' || node.isBlasting) continue;
        const dx = node.baseX - mx;
        const dy = node.baseY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < node.radius + 20) { // 20px padding for easy grabbing
          draggedNode = node;
          lastDragX = mx;
          lastDragY = my;
          dragVelocityX = 0;
          dragVelocityY = 0;
          try { wrapper.setPointerCapture(e.pointerId); } catch(e) {}
          break;
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseX = mx;
      mouseY = my;

      if (draggedNode) {
        dragVelocityX = mx - lastDragX;
        dragVelocityY = my - lastDragY;
        lastDragX = mx;
        lastDragY = my;

        draggedNode.baseX = mx;
        draggedNode.baseY = my;
        draggedNode.x = mx;
        draggedNode.y = my;
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (draggedNode) {
        try { wrapper.releasePointerCapture(e.pointerId); } catch(e) {}
        // Throw the node with recent velocity
        draggedNode.repelVx = dragVelocityX * 0.9;
        draggedNode.repelVy = dragVelocityY * 0.9;
        draggedNode = null;
      }
    };

    const handlePointerLeave = (e: PointerEvent) => {
      if (!draggedNode) {
        mouseX = width / 2;
        mouseY = height / 2;
      }
    };

    wrapper.addEventListener("pointerdown", handlePointerDown as any);
    wrapper.addEventListener("pointermove", handlePointerMove as any);
    wrapper.addEventListener("pointerup", handlePointerUp as any);
    wrapper.addEventListener("pointercancel", handlePointerUp as any);
    wrapper.addEventListener("pointerleave", handlePointerLeave as any);
    window.addEventListener("resize", resize);

    resize();
    mouseX = width / 2;
    mouseY = height / 2;
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      wrapper.removeEventListener("pointerdown", handlePointerDown as any);
      wrapper.removeEventListener("pointermove", handlePointerMove as any);
      wrapper.removeEventListener("pointerup", handlePointerUp as any);
      wrapper.removeEventListener("pointercancel", handlePointerUp as any);
      wrapper.removeEventListener("pointerleave", handlePointerLeave as any);
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

