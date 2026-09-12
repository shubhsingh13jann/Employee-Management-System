import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./radialReveal.css";

export interface RevealOrigin {
  x: number;
  y: number;
}

interface RadialRevealTransitionProps {
  children: React.ReactNode;
  origin?: RevealOrigin | null;
  isOpen?: boolean;
  onClose: () => void;
}

/**
 * Generates an organic, multi-lobed fluid blob SVG path.
 * Uses 32 harmonic control points with quadratic bezier smoothing
 * to emulate real water surface tension, fluid lobes, and ripples.
 */
function getLiquidBlobPath(
  cx: number,
  cy: number,
  baseR: number,
  phase: number,
  wobbleIntensity = 1
): string {
  if (baseR <= 0) return `M ${cx} ${cy} Z`;

  const numPoints = 32;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    // 5 primary fluid lobes with secondary ripple harmonics (matches video reference)
    const wobble =
      wobbleIntensity *
      (0.16 * Math.sin(5 * angle + phase * 2.2) +
        0.09 * Math.cos(3 * angle - phase * 1.5) +
        0.05 * Math.sin(7 * angle + phase * 3.1) +
        0.03 * Math.cos(11 * angle - phase * 2.0));

    const r = Math.max(0, baseR * (1.0 + wobble));
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    });
  }

  // Smooth quadratic bezier closed curve
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length; i++) {
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    d += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  d += " Z";
  return d;
}

/**
 * RadialRevealTransition
 * 
 * 100% Coded Native Fluid Water / Liquid Blob Page Transition:
 * - Emulates real water dynamics: 5-lobed fluid wave, surface tension wobbles, and ripples
 * - Paced at 1.45s so the watery expansion is clearly visible and luscious
 * - Uses SVG fluid paths and turbulent displacement filters matching EMS theme
 * - On Close / Back: contracts the liquid wave in reverse right back into the button
 */
export const RadialRevealTransition: React.FC<RadialRevealTransitionProps> = ({
  children,
  origin,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Default origin to top-right navbar location if accessed directly
  const originX = origin?.x ?? (typeof window !== "undefined" ? window.innerWidth - 85 : 800);
  const originY = origin?.y ?? 38;

  // Real-time animation states for liquid blob math
  const [blobPath, setBlobPath] = useState("");
  const [ripplePath, setRipplePath] = useState("");
  const [crestPath, setCrestPath] = useState("");

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const maxRadiusRef = useRef<number>(2000);

  useEffect(() => {
    // Calculate max radius needed to flood past all 4 screen corners
    if (typeof window !== "undefined") {
      const corners = [
        Math.hypot(originX, originY),
        Math.hypot(window.innerWidth - originX, originY),
        Math.hypot(originX, window.innerHeight - originY),
        Math.hypot(window.innerWidth - originX, window.innerHeight - originY)
      ];
      maxRadiusRef.current = Math.max(...corners) * 1.35;
    }
  }, [originX, originY]);

  // Liquid expansion duration (1.45s opening, 0.85s reverse contraction)
  const OPEN_DURATION = 1450;
  const CLOSE_DURATION = 850;

  useEffect(() => {
    startTimeRef.current = performance.now();

    const animateLoop = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const duration = isClosing ? CLOSE_DURATION : OPEN_DURATION;
      let progress = Math.min(elapsed / duration, 1);

      // Custom fluid easing: fast burst followed by viscous liquid deceleration
      let eased = isClosing
        ? 1 - Math.pow(progress, 2.5) // accelerating suction into button
        : 1 - Math.pow(1 - progress, 3.2); // luscious organic splash expansion

      // Wobble intensity decreases as the fluid floods the entire screen
      const wobble = isClosing ? 0.9 : Math.max(0.1, 1.2 * (1 - progress * 0.75));
      const phase = elapsed * 0.0035;

      const currentRadius = maxRadiusRef.current * eased;

      // Primary liquid blob
      const mainD = getLiquidBlobPath(originX, originY, currentRadius, phase, wobble);
      // Secondary leading ripple (sheen)
      const crestD = getLiquidBlobPath(originX, originY, currentRadius * 1.04, phase + 0.5, wobble * 0.9);
      // Inner lagging viscous depth
      const rippleD = getLiquidBlobPath(originX, originY, currentRadius * 0.92, phase - 0.4, wobble * 1.1);

      setBlobPath(mainD);
      setCrestPath(crestD);
      setRipplePath(rippleD);

      if (progress < 1 || !isClosing) {
        animFrameRef.current = requestAnimationFrame(animateLoop);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isClosing, originX, originY]);

  const handleTriggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, CLOSE_DURATION - 50);
  };

  return (
    <div className="radial-reveal-viewport">
      {/* SVG Liquid Filters and Clipping Masks */}
      <svg className="liquid-svg-engine" aria-hidden="true">
        <defs>
          {/* Water Surface Wave Turbulence Filter */}
          <filter id="water-turbulence-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.02"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="22"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Liquid Blob Clip Path */}
          <clipPath id="liquid-blob-mask">
            <path d={blobPath || `M ${originX} ${originY} Z`} />
          </clipPath>
        </defs>
      </svg>

      {/* Water Ripple Visual Overlays (Rendered outside the clip for the wet leading rim) */}
      <svg className="liquid-water-ripples-canvas" aria-hidden="true">
        {/* Leading Aquatic Sheen Wave */}
        <path
          d={crestPath}
          fill="none"
          stroke="url(#aquatic-sheen-grad)"
          strokeWidth="6"
          strokeOpacity="0.75"
          filter="url(#water-turbulence-filter)"
        />
        {/* Lagging Depth Wave */}
        <path
          d={ripplePath}
          fill="none"
          stroke="rgba(129, 140, 248, 0.4)"
          strokeWidth="4"
          strokeDasharray="16 8"
        />
        <defs>
          <linearGradient id="aquatic-sheen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Satellite Fluid Splash Droplets */}
      <div
        className={`water-satellite-droplets ${isClosing ? "closing" : ""}`}
        style={{ left: originX, top: originY }}
      >
        <span className="drop drop-1" />
        <span className="drop drop-2" />
        <span className="drop drop-3" />
        <span className="drop drop-4" />
        <span className="drop drop-5" />
      </div>

      {/* The Master Container Cloaked by the Liquid Blob Mask */}
      <div
        className="radial-reveal-container"
        style={{
          clipPath: "url(#liquid-blob-mask)",
          WebkitClipPath: "url(#liquid-blob-mask)"
        }}
      >
        {/* Multi-Layered Liquid Theme Gradient Backdrop */}
        <div className="radial-reveal-backdrop">
          <div
            className="radial-blob radial-blob-1"
            style={{
              left: `${originX - 220}px`,
              top: `${originY - 220}px`
            }}
          />
          <div className="radial-blob radial-blob-2" />
          <div className="radial-blob radial-blob-3" />
          <div className="radial-reveal-mesh-grid" />
          <div className="water-caustics-layer" />
        </div>

        {/* Top Floating Close / Return Control */}
        <div className="radial-reveal-header">
          <button
            type="button"
            onClick={handleTriggerClose}
            className="radial-reveal-close-btn"
            title="Return to Home (Contract Liquid View)"
          >
            <span className="close-text">Back to Home</span>
            <div className="close-icon-circle">
              <i className="bi bi-x-lg"></i>
            </div>
          </button>
        </div>

        {/* Child Content (Auth Card) with Paced Float-In after water floods */}
        <motion.div
          className="radial-reveal-content"
          initial={{ opacity: 0, scale: 0.91, y: 35 }}
          animate={{
            opacity: isClosing ? 0 : 1,
            scale: isClosing ? 0.93 : 1,
            y: isClosing ? 20 : 0
          }}
          transition={{
            duration: isClosing ? 0.4 : 0.65,
            delay: isClosing ? 0 : 0.6, // Wait for the luscious water wave to flood
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default RadialRevealTransition;
