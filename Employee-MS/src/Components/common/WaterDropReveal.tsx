import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";

interface WaterDropRevealProps {
  /** Viewport coordinates of the click origin */
  origin: { x: number; y: number };
  /** Called once the blob has fully covered the screen — navigate here */
  onCovered: () => void;
}

function getLiquidBlobPath(
  cx: number,
  cy: number,
  baseR: number,
  phase: number,
  wobble = 1
): string {
  if (baseR <= 0) return "";
  const N = 32;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const w =
      wobble *
      (0.16 * Math.sin(5 * a + phase * 2.2) +
        0.09 * Math.cos(3 * a - phase * 1.5) +
        0.05 * Math.sin(7 * a + phase * 3.1) +
        0.03 * Math.cos(11 * a - phase * 2.0));
    const r = Math.max(0, baseR * (1 + w));
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const c = pts[i];
    const n = pts[(i + 1) % pts.length];
    d += ` Q ${c.x.toFixed(1)} ${c.y.toFixed(1)}, ${((c.x + n.x) / 2).toFixed(1)} ${((c.y + n.y) / 2).toFixed(1)}`;
  }
  return d + " Z";
}

/**
 * WaterDropReveal — Portal that renders a liquid blob on document.body,
 * growing from `origin` over whatever page is currently visible.
 * Once the blob fully covers the screen, `onCovered` is called so the
 * caller can navigate. The portal is unmounted automatically after that.
 */
export const WaterDropReveal: React.FC<WaterDropRevealProps> = ({
  origin,
  onCovered,
}) => {
  const W = window.innerWidth;
  const H = window.innerHeight;

  const maxR = Math.max(
    Math.hypot(origin.x, origin.y),
    Math.hypot(W - origin.x, origin.y),
    Math.hypot(origin.x, H - origin.y),
    Math.hypot(W - origin.x, H - origin.y)
  ) * 1.35;

  const DURATION = 1450; // ms

  const [blobPath, setBlobPath] = useState("");
  const [crestPath, setCrestPath] = useState("");
  const [ripplePath, setRipplePath] = useState("");

  const rafRef = useRef<number>(0);
  const startRef = useRef(performance.now());
  const coveredRef = useRef(false);

  const gradCx = `${((origin.x / W) * 100).toFixed(1)}%`;
  const gradCy = `${((origin.y / H) * 100).toFixed(1)}%`;

  useEffect(() => {
    startRef.current = performance.now();

    const loop = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3.2);
      const wobble = Math.max(0.05, 1.2 * (1 - progress * 0.9));
      const phase = elapsed * 0.0035;
      const r = maxR * eased;

      setBlobPath(getLiquidBlobPath(origin.x, origin.y, r, phase, wobble));

      if (progress < 0.96) {
        setCrestPath(getLiquidBlobPath(origin.x, origin.y, r * 1.03, phase + 0.5, wobble * 0.9));
        setRipplePath(getLiquidBlobPath(origin.x, origin.y, r * 0.92, phase - 0.4, wobble * 1.1));
      } else {
        setCrestPath("");
        setRipplePath("");
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        // Blob has fully covered — navigate
        if (!coveredRef.current) {
          coveredRef.current = true;
          onCovered();
        }
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ReactDOM.createPortal(
    <svg
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id="wdr-fill"
          cx={gradCx}
          cy={gradCy}
          r="80%"
          fx={gradCx}
          fy={gradCy}
        >
          <stop offset="0%"   stopColor="#1e1b4b" stopOpacity="0.97" />
          <stop offset="35%"  stopColor="#0f172a" stopOpacity="0.98" />
          <stop offset="70%"  stopColor="#0b1120" stopOpacity="0.99" />
          <stop offset="100%" stopColor="#090d16" stopOpacity="1" />
        </radialGradient>

        <linearGradient id="wdr-crest" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#38bdf8" stopOpacity="0.95" />
          <stop offset="50%"  stopColor="#818cf8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.70" />
        </linearGradient>

        <filter id="wdr-turbulence" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.018" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {/* Solid liquid blob body */}
      {blobPath && (
        <path
          d={blobPath}
          fill="url(#wdr-fill)"
          filter="url(#wdr-turbulence)"
        />
      )}

      {/* Leading wet rim crest */}
      {crestPath && (
        <path
          d={crestPath}
          fill="none"
          stroke="url(#wdr-crest)"
          strokeWidth="8"
          strokeOpacity="0.85"
          filter="url(#wdr-turbulence)"
        />
      )}

      {/* Lagging ripple wave */}
      {ripplePath && (
        <path
          d={ripplePath}
          fill="none"
          stroke="rgba(56,189,248,0.45)"
          strokeWidth="4"
          strokeDasharray="16 10"
        />
      )}
    </svg>,
    document.body
  );
};

export default WaterDropReveal;
