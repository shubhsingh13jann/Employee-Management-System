import React, { useEffect, useRef } from "react";
import "./enterprise-background.css";

/**
 * EnterpriseBackground Component
 * 
 * High-performance 2D Canvas + CSS hardware-accelerated spatial background
 * featuring:
 * - Ambient volumetric violet/navy lighting & dark vignette
 * - Technical perspective floor with glowing grid intersections
 * - Constellation network nodes with travelling data pulses & micro-particles
 * - Rotating digital wireframe globe with orbital rings & stipple matrix
 * - Glassmorphic floating business labels (People, Teams, Growth, Productivity, Security, Collaboration)
 * - Large EMS watermark with subtle mouse parallax
 * - System metadata micro-codes & branded bottom telemetry
 */
const EnterpriseBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

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
       CONFIGURATION
    ========================================================= */
    const CONFIG = {
      background: "#070b13",
      gridColor: "rgba(111, 91, 190, 0.05)",
      networkLine: "rgba(139, 92, 246, 0.22)",
      networkGlow: "rgba(168, 85, 247, 0.5)",
      nodeColor: "rgba(192, 132, 252, 0.95)",
      particleColor: "rgba(216, 180, 254, 0.85)",
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
      radius: number;
      pulse: number;
      pulseSpeed: number;
      opacity: number;
      drift: number;
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
        const side = Math.random();

        if (side < 0.52) {
          // Left and right peripheral columns
          x =
            Math.random() < 0.5
              ? random(width * 0.02, width * 0.32)
              : random(width * 0.68, width * 0.98);
          y = random(height * 0.08, height * 0.88);
        } else {
          // Upper and lower bands
          x = random(width * 0.05, width * 0.95);
          y =
            Math.random() < 0.5
              ? random(height * 0.04, height * 0.22)
              : random(height * 0.74, height * 0.92);
        }

        nodes.push({
          x,
          y,
          baseX: x,
          baseY: y,
          radius: random(1.3, 2.7),
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: random(0.6, 1.4),
          opacity: random(0.4, 0.85),
          drift: random(0.3, 1),
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
      gradient.addColorStop(0, "rgba(35, 22, 65, 0.30)");
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
      ctx.strokeStyle = CONFIG.gridColor;
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
       LAYER: PERSPECTIVE CYBER FLOOR WITH GLOWING INTERSECTIONS
    ========================================================= */
    const drawPerspectiveFloor = () => {
      const horizon = height * 0.74;
      const centerX = width * 0.5;

      ctx.save();

      // Horizontal perspective rings / grid lines
      const horizontalLines = 15;
      const hPoints: number[] = [];

      for (let i = 0; i < horizontalLines; i++) {
        const norm = i / horizontalLines;
        // Exponential spacing: close at horizon, wider near bottom
        const y = horizon + Math.pow(norm, 2.2) * (height - horizon + 60);
        hPoints.push(y);

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.03 + norm * 0.08})`;
        ctx.lineWidth = norm > 0.6 ? 1.2 : 0.8;
        ctx.stroke();
      }

      // Vertical perspective lines converging toward center vanishing point
      const vSegments = 26;
      const vBottoms: number[] = [];

      for (let i = -vSegments; i <= vSegments; i++) {
        const bottomX = centerX + i * (width / (vSegments * 0.95));
        vBottoms.push(bottomX);

        ctx.beginPath();
        ctx.moveTo(centerX, horizon);
        ctx.lineTo(bottomX, height + 60);
        ctx.strokeStyle = "rgba(124, 58, 237, 0.045)";
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // Glowing grid intersection dots across the floor
      for (let row = 2; row < hPoints.length; row++) {
        const y = hPoints[row];
        const rowNorm = (y - horizon) / (height - horizon);
        if (rowNorm < 0.1) continue;

        for (let col = 0; col < vBottoms.length; col += 2) {
          const bottomX = vBottoms[col];
          // Calculate intersection x at current y
          const t = (y - horizon) / (height + 60 - horizon);
          const ix = centerX + (bottomX - centerX) * t;

          if (ix >= -20 && ix <= width + 20) {
            const dotAlpha = rowNorm * 0.38;
            const dotR = 1.0 + rowNorm * 1.4;

            ctx.beginPath();
            ctx.arc(ix, y, dotR, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(192, 132, 252, ${dotAlpha})`;
            ctx.fill();
          }
        }
      }

      // Horizon line glow
      const horizonGlow = ctx.createRadialGradient(
        centerX,
        horizon,
        0,
        centerX,
        horizon,
        width * 0.55
      );
      horizonGlow.addColorStop(0, "rgba(139, 92, 246, 0.16)");
      horizonGlow.addColorStop(0.5, "rgba(124, 58, 237, 0.06)");
      horizonGlow.addColorStop(1, "rgba(124, 58, 237, 0)");

      ctx.fillStyle = horizonGlow;
      ctx.fillRect(0, horizon - 80, width, 180);

      // Sharp horizon beam
      ctx.beginPath();
      ctx.moveTo(width * 0.1, horizon);
      ctx.lineTo(width * 0.9, horizon);
      ctx.strokeStyle = "rgba(168, 85, 247, 0.18)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    };

    /* =========================================================
       LAYER: AMBIENT VOLUMETRIC LIGHTS
    ========================================================= */
    const drawAmbientLights = () => {
      const lights = [
        // Top-center luminous purple nebula (frames top of screen and login card)
        {
          x: width * 0.5,
          y: height * 0.04,
          radius: 460,
          alpha: 0.18,
          r: 139, g: 92, b: 246,
        },
        // Left globe aura
        {
          x: width * 0.14,
          y: height * 0.52,
          radius: 320,
          alpha: 0.14,
          r: 124, g: 58, b: 237,
        },
        // Right watermark aura
        {
          x: width * 0.88,
          y: height * 0.70,
          radius: 340,
          alpha: 0.11,
          r: 99, g: 102, b: 241,
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
      stars.forEach((star) => {
        const twinkle =
          star.alpha +
          Math.sin(time * 0.001 * star.twinkle + star.phase) * 0.12;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 132, 252, ${clamp(twinkle, 0.05, 0.65)})`;
        ctx.fill();
      });
    };

    /* =========================================================
       LAYER: NETWORK NODES & CONNECTIONS
    ========================================================= */
    const updateNodes = () => {
      nodes.forEach((node) => {
        if (!prefersReducedMotion) {
          node.x =
            node.baseX +
            Math.sin(time * 0.0003 * node.drift + node.pulse) * 7;
          node.y =
            node.baseY +
            Math.cos(time * 0.00025 * node.drift + node.pulse) * 5;
        }
      });
    };

    const drawConnections = () => {
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
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }
    };

    const drawNodes = () => {
      nodes.forEach((node) => {
        const pulse =
          1 + Math.sin(time * 0.002 * node.pulseSpeed + node.pulse) * 0.4;
        const glowRadius = node.radius * 7 * pulse;

        // Outer halo
        const glow = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          glowRadius
        );
        glow.addColorStop(0, `rgba(168, 85, 247, ${node.opacity * 0.75})`);
        glow.addColorStop(1, "rgba(124, 58, 237, 0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Solid core
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216, 180, 254, ${node.opacity})`;
        ctx.fill();
      });
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

      const glow = ctx.createRadialGradient(px, py, 0, px, py, 14);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      glow.addColorStop(0.2, "rgba(192, 132, 252, 0.85)");
      glow.addColorStop(1, "rgba(124, 58, 237, 0)");

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
      particles.forEach((p) => {
        const alpha =
          p.alpha *
          (0.75 + Math.sin(time * 0.001 * p.speed + p.phase) * 0.25);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
        ctx.fill();
      });
    };

    /* =========================================================
       LAYER: CORNER VIGNETTE
    ========================================================= */
    const drawVignette = () => {
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.48,
        Math.min(width, height) * 0.22,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.78
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.65, "rgba(0,0,0,0.12)");
      gradient.addColorStop(1, "rgba(3, 6, 12, 0.75)");

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

      ctx.clearRect(0, 0, width, height);

      // 1. Base Dark Solid
      ctx.fillStyle = CONFIG.background;
      ctx.fillRect(0, 0, width, height);

      // 2. Radial Depth
      drawBackground();

      // 3. Volumetric Atmosphere
      drawAmbientLights();

      // 4. Subtle Grid
      drawGrid();

      // 5. Ambient Stars
      drawStars();

      // 6. Perspective Cyber Floor
      drawPerspectiveFloor();

      // 7. Constellation Connections
      updateNodes();
      drawConnections();

      // 8. Dynamic Data Beacons
      drawDataPulses();

      // 9. Floating Sparkles
      updateParticles();
      drawParticles();

      // 10. Constellation Nodes
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
    <div ref={wrapperRef} className="enterprise-background" aria-hidden="true">
      {/* Hardware-accelerated dynamic canvas */}
      <canvas ref={canvasRef} className="enterprise-canvas" />

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

        <div className="globe-orbit orbit-one" />
        <div className="globe-orbit orbit-two" />
      </div>

      {/* ===================================================
          FLOATING ENTERPRISE PILLS (Exact matches to reference)
      =================================================== */}
      {/* Left Side Pills */}
      <div className="floating-label people">
        <span className="label-icon">
          <i className="bi bi-people-fill"></i>
        </span>
        <span>People</span>
      </div>

      <div className="floating-label teams">
        <span className="label-icon">
          <i className="bi bi-people"></i>
        </span>
        <span>Teams</span>
      </div>

      <div className="floating-label growth">
        <span className="label-icon">
          <i className="bi bi-bar-chart-fill"></i>
        </span>
        <span>Growth</span>
      </div>

      {/* Right Side Pills */}
      <div className="floating-label productivity">
        <span className="label-icon">
          <i className="bi bi-lightning-charge-fill"></i>
        </span>
        <span>Productivity</span>
      </div>

      <div className="floating-label security">
        <span className="label-icon">
          <i className="bi bi-shield-shaded"></i>
        </span>
        <span>Security</span>
      </div>

      <div className="floating-label collaboration">
        <span className="label-icon">
          <i className="bi bi-diagram-3-fill"></i>
        </span>
        <span>Collaboration</span>
      </div>

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

