import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BriefcaseLoader - [Upgraded Articulated Walking Rig & Briefcase Morph]
 * 
 * Features:
 * - True human walk cycle: alternating swinging legs, rhythmic torso bobbing, swinging arms
 * - Realistic deceleration to center, stooping down to place briefcase on the floor
 * - Metallic latch unclick, 3D lid swing, and expanding radiant morph into the auth card
 * - Instant Skip button for fast access
 */
interface BriefcaseLoaderProps {
  onComplete: () => void;
}

const BriefcaseLoader: React.FC<BriefcaseLoaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  // Phase 0: Walking across stage from left to center carrying briefcase (0s -> 1.7s)
  // Phase 1: Halting, bending down, and planting briefcase on floor (1.7s -> 2.5s)
  // Phase 2: Latches click open & lid swings open in 3D (2.5s -> 3.3s)
  // Phase 3: Radiant beam bursts & expands to reveal auth hub (3.3s -> 3.8s)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1700);
    const t2 = setTimeout(() => setPhase(2), 2500);
    const t3 = setTimeout(() => setPhase(3), 3300);
    const t4 = setTimeout(() => onComplete(), 3900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="briefcase-loader-backdrop"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Instant Skip Button */}
      <button
        onClick={onComplete}
        className="btn btn-sm btn-outline-light rounded-pill position-absolute top-0 end-0 m-4 px-3 py-1.5 d-flex align-items-center gap-2 shadow-sm"
        style={{
          zIndex: 1000,
          fontSize: '11.5px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.18)'
        }}
      >
        <span>Skip Intro</span>
        <i className="bi bi-fast-forward-fill"></i>
      </button>

      {/* Main Walking & Briefcase Arena */}
      <div
        className="position-relative d-flex flex-column align-items-center justify-content-center"
        style={{ width: '500px', height: '380px' }}
      >
        {/* Spotlight Beam */}
        <div
          className="position-absolute"
          style={{
            top: '-50px',
            width: '280px',
            height: '340px',
            background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0) 70%)',
            pointerEvents: 'none',
            zIndex: 1
          }}
        />

        {/* Ambient Floor Shadow under character & briefcase */}
        <motion.div
          animate={
            phase === 0
              ? { x: [-140, 20], scaleX: [0.8, 1.1, 0.8] }
              : { x: 20, scaleX: 1.2 }
          }
          transition={
            phase === 0
              ? { x: { duration: 1.7, ease: 'easeOut' }, scaleX: { repeat: Infinity, duration: 0.5 } }
              : { duration: 0.4 }
          }
          className="position-absolute rounded-pill"
          style={{
            bottom: '72px',
            width: '200px',
            height: '20px',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 70%)',
            zIndex: 2
          }}
        />

        {/* ============================================================
            ARTICULATED WALKING EXECUTIVE CHARACTER RIG
            ============================================================ */}
        <motion.div
          initial={{ x: -280 }}
          animate={
            phase === 0
              ? { x: 0 }
              : phase === 1
              ? { x: 0, y: [0, 8, 4] }
              : { x: -45, opacity: 0.85 }
          }
          transition={{
            duration: phase === 0 ? 1.7 : phase === 1 ? 0.7 : 0.6,
            ease: 'easeOut'
          }}
          className="position-absolute"
          style={{ bottom: '82px', left: '150px', zIndex: 6 }}
        >
          {/* Torso & Head with Walking Rhythmic Bobbing */}
          <motion.svg
            width="90"
            height="150"
            viewBox="0 0 90 150"
            fill="none"
            animate={
              phase === 0
                ? { y: [0, -7, 0, -7, 0] }
                : phase === 1
                ? { y: 6 }
                : { y: 0 }
            }
            transition={
              phase === 0
                ? { repeat: Infinity, duration: 0.52, ease: 'easeInOut' }
                : { duration: 0.3 }
            }
          >
            {/* =======================
                1. BACK LEG (Right Leg)
                ======================= */}
            <motion.g
              animate={
                phase === 0
                  ? { rotate: [24, -24, 24] }
                  : { rotate: 0 }
              }
              transition={
                phase === 0
                  ? { repeat: Infinity, duration: 0.52, ease: 'linear' }
                  : { duration: 0.25 }
              }
              style={{ transformOrigin: '48px 84px' }}
            >
              {/* Thigh & Shin */}
              <rect x="43" y="84" width="10" height="50" rx="5" fill="#1e293b" />
              {/* Executive Shoe */}
              <path d="M43 130C43 126 56 126 56 134H43V130Z" fill="#0f172a" />
            </motion.g>

            {/* =======================
                2. HEAD & NECK
                ======================= */}
            {/* Head Silhouette */}
            <circle cx="44" cy="22" r="14" fill="#e2e8f0" />
            {/* Modern Executive Styled Hair */}
            <path
              d="M30 20C30 11 37 7 50 7C58 7 59 14 57 18C52 14 39 14 30 20Z"
              fill="#0f172a"
            />
            {/* Profile Nose & Chin */}
            <path d="M57 21L61 24L57 27" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

            {/* =======================
                3. TORSO & SUIT BLAZER
                ======================= */}
            {/* Navy/Slate Blazer */}
            <path
              d="M26 38C30 36 58 36 62 38L66 78C66 82 62 86 58 86H30C26 86 22 82 22 78L26 38Z"
              fill="#334155"
            />
            {/* White Dress Shirt V-Collar */}
            <path d="M38 37L44 52L50 37H38Z" fill="#ffffff" />
            {/* Royal Indigo Silk Tie */}
            <path d="M42 48L44 70L46 48H42Z" fill="#6366f1" />

            {/* =======================
                4. FRONT LEG (Left Leg)
                ======================= */}
            <motion.g
              animate={
                phase === 0
                  ? { rotate: [-24, 24, -24] }
                  : { rotate: 0 }
              }
              transition={
                phase === 0
                  ? { repeat: Infinity, duration: 0.52, ease: 'linear' }
                  : { duration: 0.25 }
              }
              style={{ transformOrigin: '36px 84px' }}
            >
              {/* Thigh & Shin */}
              <rect x="31" y="84" width="10" height="50" rx="5" fill="#334155" />
              {/* Executive Shoe */}
              <path d="M31 130C31 126 44 126 44 134H31V130Z" fill="#0f172a" />
            </motion.g>

            {/* =======================
                5. RIGHT ARM (Swings opposite to left leg)
                ======================= */}
            <motion.g
              animate={
                phase === 0
                  ? { rotate: [20, -20, 20] }
                  : { rotate: -5 }
              }
              transition={
                phase === 0
                  ? { repeat: Infinity, duration: 0.52, ease: 'linear' }
                  : { duration: 0.3 }
              }
              style={{ transformOrigin: '32px 42px' }}
            >
              <path d="M32 42L25 72" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
              <circle cx="24" cy="74" r="4.5" fill="#e2e8f0" />
            </motion.g>

            {/* =======================
                6. LEFT ARM (Carries Briefcase during walk)
                ======================= */}
            <motion.g
              animate={
                phase === 0
                  ? { rotate: [-15, 15, -15] }
                  : phase === 1
                  ? { rotate: 25, y: 8 }
                  : { rotate: 0 }
              }
              transition={
                phase === 0
                  ? { repeat: Infinity, duration: 0.52, ease: 'linear' }
                  : { duration: 0.4 }
              }
              style={{ transformOrigin: '56px 42px' }}
            >
              <path d="M56 42L66 74" stroke="#475569" strokeWidth="8" strokeLinecap="round" />
              <circle cx="67" cy="76" r="4.5" fill="#e2e8f0" />
            </motion.g>
          </motion.svg>
        </motion.div>

        {/* ============================================================
            THE EXECUTIVE BRIEFCASE (CARRIED -> SET DOWN -> UNFOLDS)
            ============================================================ */}
        <motion.div
          animate={
            phase === 0
              ? { x: -65, y: [0, -6, 0, -6, 0] }
              : phase === 1
              ? { x: 50, y: 65, scale: 1 }
              : phase === 2
              ? { x: 50, y: 65, scale: 1.08 }
              : { x: 0, y: 0, scale: 2.8, opacity: [1, 0.4, 0] }
          }
          transition={
            phase === 0
              ? { x: { duration: 1.7, ease: 'easeOut' }, y: { repeat: Infinity, duration: 0.52, ease: 'easeInOut' } }
              : phase === 1
              ? { duration: 0.6, ease: 'easeOut' }
              : { duration: 0.6 }
          }
          className="position-relative briefcase-glow"
          style={{ zIndex: 12, transformOrigin: 'center center' }}
        >
          <svg width="130" height="92" viewBox="0 0 130 92" fill="none">
            {/* Handle */}
            <path
              d="M50 24V14C50 10.5 53 7.5 56.5 7.5H73.5C77 7.5 80 10.5 80 14V24"
              stroke="#64748b"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <rect x="47" y="20" width="6" height="7" rx="1" fill="#cbd5e1" />
            <rect x="77" y="20" width="6" height="7" rx="1" fill="#cbd5e1" />

            {/* Main Suitcase Outer Shell */}
            <rect
              x="12"
              y="24"
              width="106"
              height="62"
              rx="10"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2"
            />
            {/* Textured Leather Panel */}
            <rect x="16" y="28" width="98" height="54" rx="6" fill="#0f172a" />

            {/* Suitcase Lid (Flips open upwards in 3D in Phase 2 & 3) */}
            <motion.path
              d="M12 24C12 19 16 15 21 15H109C114 15 118 19 118 24V35H12V24Z"
              fill="#334155"
              animate={phase >= 2 ? { rotateX: -105, y: -22 } : { rotateX: 0, y: 0 }}
              style={{ transformOrigin: 'top center' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Gold / Chrome Metal Latches (Pop open in Phase 2) */}
            <motion.rect
              x="32"
              y="35"
              width="10"
              height="14"
              rx="2"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="1"
              animate={phase >= 2 ? { y: 28, scaleY: 0.7 } : { y: 35 }}
            />
            <motion.rect
              x="88"
              y="35"
              width="10"
              height="14"
              rx="2"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="1"
              animate={phase >= 2 ? { y: 28, scaleY: 0.7 } : { y: 35 }}
            />

            {/* Center Chrome Lock */}
            <rect x="60" y="37" width="10" height="9" rx="2" fill="#e2e8f0" />

            {/* Radiant Beam Morph Burst inside the opening suitcase */}
            {phase >= 2 && (
              <motion.g
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 1, 0.9], scale: [0.2, 1.8, 2.6] }}
                transition={{ duration: 0.7 }}
              >
                <circle cx="65" cy="32" r="40" fill="url(#portalMorphGrad)" />
              </motion.g>
            )}

            <defs>
              <radialGradient id="portalMorphGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="35%" stopColor="#818cf8" stopOpacity="0.85" />
                <stop offset="70%" stopColor="#6366f1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Phase Action Micro-Text */}
        <div className="position-absolute text-center" style={{ bottom: '15px' }}>
          <span
            className="text-white-50 small fw-semibold tracking-wider text-uppercase"
            style={{ fontSize: '11px', letterSpacing: '1px' }}
          >
            {phase === 0 && '🚶 Executive arriving with Enterprise EMS...'}
            {phase === 1 && '💼 Setting down portal briefcase...'}
            {phase >= 2 && '✨ Unlatching & expanding workforce stage...'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BriefcaseLoader;
