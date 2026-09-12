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
  if (baseR <= 0) return "";

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
 * - Direct SVG filled liquid blob rendering (immune to browser clip-path bugs)
 * - True fluid water expansion with organic 5-lobe morphing and aquatic sheen waves
 * - Automatically cleanly terminates once opened so no ripple lines linger
 * - Auth card floats cleanly in front with z-index
 * - Reverse contraction on Close / Back pulls all water back into the button
 */
export const RadialRevealTransition: React.FC<RadialRevealTransitionProps> = ({
  children,
  origin,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isSettled, setIsSettled] = useState(false);

  // Viewport dimensions for SVG canvas
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Default origin to top-right navbar location if accessed directly
  const originX = origin?.x ?? (dimensions.width > 0 ? dimensions.width - 85 : 800);
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
    const corners = [
      Math.hypot(originX, originY),
      Math.hypot(dimensions.width - originX, originY),
      Math.hypot(originX, dimensions.height - originY),
      Math.hypot(dimensions.width - originX, dimensions.height - originY)
    ];
    maxRadiusRef.current = Math.max(...corners) * 1.35;
  }, [originX, originY, dimensions]);

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
      const wobble = isClosing ? 0.9 : Math.max(0.05, 1.2 * (1 - progress * 0.9));
      const phase = elapsed * 0.0035;

      const currentRadius = maxRadiusRef.current * eased;

      // Primary liquid blob
      const mainD = getLiquidBlobPath(originX, originY, currentRadius, phase, wobble);
      setBlobPath(mainD);

      // Wave crest and ripple are only drawn during active motion, cleared once expanding completes
      if (progress < 0.96) {
        const crestD = getLiquidBlobPath(originX, originY, currentRadius * 1.03, phase + 0.5, wobble * 0.9);
        const rippleD = getLiquidBlobPath(originX, originY, currentRadius * 0.92, phase - 0.4, wobble * 1.1);
        setCrestPath(crestD);
        setRipplePath(rippleD);
      } else {
        setCrestPath("");
        setRipplePath("");
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateLoop);
      } else {
        // Animation loop finished: settle background and stop CPU usage
        if (!isClosing) {
          setIsSettled(true);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isClosing, originX, originY]);

  const handleTriggerClose = () => {
    if (isClosing) return;
    setIsSettled(false);
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, CLOSE_DURATION - 50);
  };

  const gradCx = dimensions.width > 0 ? `${((originX / dimensions.width) * 100).toFixed(1)}%` : "50%";
  const gradCy = dimensions.height > 0 ? `${((originY / dimensions.height) * 100).toFixed(1)}%` : "20%";

  return (
    <div className="radial-reveal-viewport">
      {/* Master Liquid SVG Canvas Rendering True Fluid Water Blob & Ripples */}
      <svg
        className="liquid-reveal-svg-canvas"
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        aria-hidden="true"
      >
        <defs>
          {/* Dynamic Radial Gradient Centered at Clicked Button Origin */}
          <radialGradient
            id="liquid-theme-gradient"
            cx={gradCx}
            cy={gradCy}
            r="80%"
            fx={gradCx}
            fy={gradCy}
          >
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.98" />
            <stop offset="25%" stopColor="#6366f1" stopOpacity="0.96" />
            <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.96" />
            <stop offset="78%" stopColor="#1e1b4b" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="1" />
          </radialGradient>

          {/* Leading Crest Rim Gradient */}
          <linearGradient id="aquatic-sheen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.7" />
          </linearGradient>

          {/* Water Surface Wave Turbulence Filter */}
          <filter id="water-turbulence-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.014 0.018"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="24"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* If settled, render a clean solid gradient background without GPU overhead or stroke lines */}
        {isSettled && !isClosing ? (
          <rect width="100%" height="100%" fill="url(#liquid-theme-gradient)" />
        ) : (
          <>
            {/* The Solid Fluid Water Blob Body (Visible & Expanding!) */}
            {blobPath && (
              <path
                d={blobPath}
                fill="url(#liquid-theme-gradient)"
                filter="url(#water-turbulence-filter)"
              />
            )}

            {/* Leading Aquatic Sheen Wave (Wet Rim) */}
            {crestPath && (
              <path
                d={crestPath}
                fill="none"
                stroke="url(#aquatic-sheen-grad)"
                strokeWidth="8"
                strokeOpacity="0.85"
                filter="url(#water-turbulence-filter)"
              />
            )}

            {/* Lagging Depth Wave (Secondary Ripple) */}
            {ripplePath && (
              <path
                d={ripplePath}
                fill="none"
                stroke="rgba(56, 189, 248, 0.45)"
                strokeWidth="4"
                strokeDasharray="16 10"
              />
            )}
          </>
        )}
      </svg>

      {/* Satellite Fluid Splash Droplets Bursting from Button (Only active during opening transition) */}
      {!isSettled && (
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
      )}

      {/* Subtle Geometric Mesh Overlay */}
      <div className="radial-reveal-mesh-grid" />

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

      {/* Auth Card Content Container (Always Visible, Paced Float-In) */}
      <motion.div
        className="radial-reveal-content"
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{
          opacity: isClosing ? 0 : 1,
          scale: isClosing ? 0.94 : 1,
          y: isClosing ? 18 : 0
        }}
        transition={{
          duration: isClosing ? 0.35 : 0.65,
          delay: isClosing ? 0 : 0.35, // Floats in as the water floods
          ease: [0.16, 1, 0.3, 1]
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default RadialRevealTransition;
