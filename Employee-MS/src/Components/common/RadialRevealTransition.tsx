import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import BrandLogo from "./BrandLogo";
import VolumetricAtmosphere from "../auth/VolumetricAtmosphere";
import { UserRole } from "../auth/auth.types";
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
  role?: UserRole;
  alreadyCovered?: boolean;
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

export const RadialRevealTransition: React.FC<RadialRevealTransitionProps> = ({
  children,
  origin,
  onClose,
  role = "admin",
  alreadyCovered = false,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isSettled, setIsSettled] = useState(alreadyCovered);
  const [isVisible, setIsVisible] = useState(alreadyCovered);

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
    const corners = [
      Math.hypot(originX, originY),
      Math.hypot(dimensions.width - originX, originY),
      Math.hypot(originX, dimensions.height - originY),
      Math.hypot(dimensions.width - originX, dimensions.height - originY)
    ];
    maxRadiusRef.current = Math.max(...corners) * 1.35;
  }, [originX, originY, dimensions]);

  const [isFullyClosed, setIsFullyClosed] = useState(false);

  // Silky fluid timing (550ms opening, 580ms closing)
  const OPEN_DURATION = 550;
  const CLOSE_DURATION = 580;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (alreadyCovered && !isClosing) return;

    startTimeRef.current = performance.now();

    const animateLoop = (now: number) => {
      setIsVisible(true);

      const elapsed = now - startTimeRef.current;
      const duration = isClosing ? CLOSE_DURATION : OPEN_DURATION;
      let progress = Math.min(elapsed / duration, 1);

      // Custom fluid easing
      let eased = isClosing
        ? 1 - Math.pow(progress, 2.5) // accelerating suction into button
        : 1 - Math.pow(1 - progress, 3.2); // luscious organic splash expansion

      const wobble = isClosing ? 0.9 : Math.max(0.04, 1.15 * (1 - progress * 0.9));
      const phase = elapsed * 0.005;

      const currentRadius = maxRadiusRef.current * eased;

      // Primary liquid blob
      const mainD = getLiquidBlobPath(originX, originY, currentRadius, phase, wobble);
      setBlobPath(mainD);

      // Wave crest and ripple are only drawn during active motion
      if (progress < 0.96) {
        const crestD = getLiquidBlobPath(originX, originY, currentRadius * 1.025, phase + 0.4, wobble * 0.9);
        const rippleD = getLiquidBlobPath(originX, originY, currentRadius * 0.94, phase - 0.4, wobble * 1.1);
        setCrestPath(crestD);
        setRipplePath(rippleD);
      } else {
        setCrestPath("");
        setRipplePath("");
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateLoop);
      } else {
        if (isClosing) {
          setIsFullyClosed(true);
          setIsVisible(false);
          onCloseRef.current();
        } else {
          setIsSettled(true);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isClosing, originX, originY, alreadyCovered]);

  const handleTriggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
  };

  const gradCx = dimensions.width > 0 ? `${((originX / dimensions.width) * 100).toFixed(1)}%` : "50%";
  const gradCy = dimensions.height > 0 ? `${((originY / dimensions.height) * 100).toFixed(1)}%` : "20%";

  return (
    <div
      className="radial-reveal-viewport"
      style={{
        opacity: isFullyClosed ? 0 : (isVisible ? 1 : 0),
        display: isFullyClosed ? "none" : undefined,
        pointerEvents: isClosing ? "none" : (isVisible ? "auto" : "none"),
        clipPath: isClosing ? "url(#login-liquid-clip)" : undefined,
        WebkitClipPath: isClosing ? "url(#login-liquid-clip)" : undefined,
      }}
    >
      {/* Master Liquid SVG Canvas Rendering True Fluid Water Blob & Ripples */}
      <svg
        className="liquid-reveal-svg-canvas"
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        aria-hidden="true"
      >
        <defs>
          {/* SVG ClipPath used to physically clip the entire login viewport during closing */}
          <clipPath id="login-liquid-clip" clipPathUnits="userSpaceOnUse">
            <path d={blobPath || "M 0 0"} />
          </clipPath>

          {/* Dynamic Radial Gradient Centered at Clicked Button Origin */}
          <radialGradient
            id="liquid-theme-gradient"
            cx={gradCx}
            cy={gradCy}
            r="80%"
            fx={gradCx}
            fy={gradCy}
          >
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#0f172a" stopOpacity="0.98" />
            <stop offset="70%" stopColor="#0b1120" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="1" />
          </radialGradient>

          {/* Leading Crest Rim Gradient */}
          <linearGradient id="aquatic-sheen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.7" />
          </linearGradient>

          {/* Soft outer glow for the fluid surface tension edge */}
          <filter id="liquid-edge-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* During closing or when not settled, render fluid crest & ripples along boundary */}
        {(!isSettled || isClosing) && (
          <>
            {/* When not already covered and opening, render blob body */}
            {!alreadyCovered && !isSettled && blobPath && (
              <path
                d={blobPath}
                fill="url(#liquid-theme-gradient)"
              />
            )}

            {/* Leading Aquatic Sheen Wave (Wet Rim) */}
            {crestPath && (
              <path
                d={crestPath}
                fill="none"
                stroke="url(#aquatic-sheen-grad)"
                strokeWidth="6"
                filter="url(#liquid-edge-glow)"
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

      {/* Satellite Fluid Splash Droplets (Only active during initial direct opening if not already covered) */}
      {!isSettled && !alreadyCovered && (
        <div
          className="water-satellite-droplets"
          style={{ left: originX, top: originY }}
        >
          <span className="drop drop-1" />
          <span className="drop drop-2" />
          <span className="drop drop-3" />
          <span className="drop drop-4" />
          <span className="drop drop-5" />
        </div>
      )}

      {/* Concept 3: Executive Volumetric Spotlight — visible during settled & closing */}
      {(isSettled || isClosing) && <VolumetricAtmosphere role={role} />}

      {/* Subtle Geometric Mesh Overlay */}
      {(isSettled || isClosing) && <div className="radial-reveal-mesh-grid" />}

      {/* Top Floating Header — stays visible during closing so it contracts with the background */}
      <div className="radial-reveal-header">
        <BrandLogo theme="dark" />
        <button
          type="button"
          onClick={handleTriggerClose}
          className="radial-reveal-close-btn"
          title="Return to Home"
        >
          <span className="close-text">Back to Home</span>
          <div className="close-icon-circle">
            <i className="bi bi-x-lg"></i>
          </div>
        </button>
      </div>

      {/* Auth Card — stays visible during closing so it contracts with the background */}
      <div className="radial-reveal-content">
        {children}
      </div>
    </div>
  );
};

export default RadialRevealTransition;
