import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export interface WaterDropRevealProps {
  /** Viewport coordinates of the clicked button (fluid epicenter) */
  origin: { x: number; y: number };
  /** "expand" = water spreads over page (opening); "contract" = water sucks back into button (closing) */
  mode?: "expand" | "contract";
  /** Triggered when the expansion covers the screen (or alias onCovered) */
  onCovered?: () => void;
  /** Triggered when the animation cycle completes */
  onComplete?: () => void;
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
  wobble = 1
): string {
  if (baseR <= 0) return "";
  const N = 32;
  const ptsX: number[] = new Array(N);
  const ptsY: number[] = new Array(N);

  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const w =
      wobble *
      (0.16 * Math.sin(5 * a + phase * 2.2) +
        0.09 * Math.cos(3 * a - phase * 1.5) +
        0.05 * Math.sin(7 * a + phase * 3.1) +
        0.03 * Math.cos(11 * a - phase * 2.0));
    const r = Math.max(0, baseR * (1 + w));
    ptsX[i] = cx + r * Math.cos(a);
    ptsY[i] = cy + r * Math.sin(a);
  }

  let d = `M ${ptsX[0].toFixed(1)} ${ptsY[0].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const next = (i + 1) % N;
    const midX = (ptsX[i] + ptsX[next]) / 2;
    const midY = (ptsY[i] + ptsY[next]) / 2;
    d += ` Q ${ptsX[i].toFixed(1)} ${ptsY[i].toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  return d + " Z";
}

/**
 * High-performance WaterDropReveal Portal:
 * - Direct DOM manipulation on SVG path refs (zero React re-renders during 60/120fps animation)
 * - Fast, snappy duration: 580ms expand, 480ms contract
 * - Dual-mode:
 *     - "expand": grows from button to cover screen, revealing Login
 *     - "contract": starts full-screen, shrinks into button, revealing LandingPage underneath
 */
export const WaterDropReveal: React.FC<WaterDropRevealProps> = ({
  origin,
  mode = "expand",
  onCovered,
  onComplete,
}) => {
  const isExpand = mode === "expand";

  const W = typeof window !== "undefined" ? window.innerWidth : 1920;
  const H = typeof window !== "undefined" ? window.innerHeight : 1080;

  // Maximum radius needed to flood comfortably past all 4 corners
  const maxR =
    Math.max(
      Math.hypot(origin.x, origin.y),
      Math.hypot(W - origin.x, origin.y),
      Math.hypot(origin.x, H - origin.y),
      Math.hypot(W - origin.x, H - origin.y)
    ) * 1.38;

  // Snappy, energetic fluid timing
  const DURATION = isExpand ? 580 : 480; // ms

  const blobPathRef = useRef<SVGPathElement>(null);
  const crestPathRef = useRef<SVGPathElement>(null);
  const ripplePathRef = useRef<SVGPathElement>(null);

  const rafRef = useRef<number>(0);
  const triggeredRef = useRef(false);

  const gradCx = `${((origin.x / W) * 100).toFixed(1)}%`;
  const gradCy = `${((origin.y / H) * 100).toFixed(1)}%`;

  useEffect(() => {
    const startTime = performance.now();

    // Initial frame render
    if (!isExpand && blobPathRef.current) {
      // For contraction, start at maximum radius covering whole screen
      const initPath = getLiquidBlobPath(origin.x, origin.y, maxR, 0, 0.2);
      blobPathRef.current.setAttribute("d", initPath);
    }

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(elapsed / DURATION, 1);

      // Fluid easing
      const eased = isExpand
        ? 1 - Math.pow(1 - rawProgress, 3.2)
        : Math.pow(1 - rawProgress, 2.5);

      const wobble = isExpand
        ? Math.max(0.04, 1.15 * (1 - rawProgress * 0.9))
        : Math.max(0.04, 0.95 * (1 - (1 - rawProgress) * 0.6));

      const phase = elapsed * 0.006;
      const currentR = maxR * eased;

      const mainD = getLiquidBlobPath(origin.x, origin.y, currentR, phase, wobble);
      if (blobPathRef.current) {
        blobPathRef.current.setAttribute("d", mainD);
      }

      // Leading wet crest & lagging ripple
      if (
        (isExpand && rawProgress < 0.96) ||
        (!isExpand && rawProgress > 0.04 && rawProgress < 0.96)
      ) {
        const crestD = getLiquidBlobPath(
          origin.x,
          origin.y,
          currentR * (isExpand ? 1.025 : 1.015),
          phase + 0.4,
          wobble * 0.9
        );
        const rippleD = getLiquidBlobPath(
          origin.x,
          origin.y,
          currentR * (isExpand ? 0.94 : 0.96),
          phase - 0.4,
          wobble * 1.1
        );

        if (crestPathRef.current) crestPathRef.current.setAttribute("d", crestD);
        if (ripplePathRef.current) ripplePathRef.current.setAttribute("d", rippleD);
      } else {
        if (crestPathRef.current) crestPathRef.current.setAttribute("d", "");
        if (ripplePathRef.current) ripplePathRef.current.setAttribute("d", "");
      }

      if (rawProgress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (!triggeredRef.current) {
          triggeredRef.current = true;
          if (onCovered) onCovered();
          if (onComplete) onComplete();
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isExpand, origin.x, origin.y, maxR, DURATION, onCovered, onComplete]);

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      <svg
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <defs>
          {/* Dynamic Radial Gradient Centered at Clicked Button Origin */}
          <radialGradient
            id="wdr-fill"
            cx={gradCx}
            cy={gradCy}
            r="85%"
            fx={gradCx}
            fy={gradCy}
          >
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.98" />
            <stop offset="35%" stopColor="#0f172a" stopOpacity="0.99" />
            <stop offset="70%" stopColor="#0b1120" stopOpacity="1" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="1" />
          </radialGradient>

          {/* Wet Edge Sheen Rim Gradient */}
          <linearGradient id="wdr-crest" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.75" />
          </linearGradient>

          {/* Soft outer glow for the fluid surface tension edge */}
          <filter id="wdr-edge-glow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Master Solid Fluid Body */}
        <path
          ref={blobPathRef}
          d={!isExpand ? getLiquidBlobPath(origin.x, origin.y, maxR, 0, 0.2) : ""}
          fill="url(#wdr-fill)"
        />

        {/* 2. Leading Aquatic Sheen Wave (Wet Rim with glow) */}
        <path
          ref={crestPathRef}
          fill="none"
          stroke="url(#wdr-crest)"
          strokeWidth="6"
          filter="url(#wdr-edge-glow)"
        />

        {/* 3. Lagging Ripple Wave */}
        <path
          ref={ripplePathRef}
          fill="none"
          stroke="rgba(56, 189, 248, 0.40)"
          strokeWidth="3"
          strokeDasharray="12 8"
        />
      </svg>
    </div>,
    document.body
  );
};

export default WaterDropReveal;

