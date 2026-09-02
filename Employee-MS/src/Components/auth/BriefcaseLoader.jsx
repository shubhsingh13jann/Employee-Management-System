import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * BriefcaseLoader - [Link 3 Inspiration]
 * Cinematic opening where a professional figure walks in, places down a sleek briefcase,
 * clicks open the metallic latches, and the glowing interior unfolds into the login card.
 */
const BriefcaseLoader = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); 
  // Phase 0: Character walks in with briefcase (0s - 1.4s)
  // Phase 1: Places briefcase down on pedestal (1.4s - 2.2s)
  // Phase 2: Latches click open & lid swings open (2.2s - 3.2s)
  // Phase 3: Radiant glow & card expansion (3.2s -> finish)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1300);
    const t2 = setTimeout(() => setPhase(2), 2100);
    const t3 = setTimeout(() => setPhase(3), 3000);
    const t4 = setTimeout(() => onComplete(), 3600);

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
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Skip Button */}
      <button
        onClick={onComplete}
        className="btn btn-sm btn-outline-light rounded-pill position-absolute top-0 end-0 m-4 px-3 py-1 d-flex align-items-center gap-1.5 shadow-sm"
        style={{ zIndex: 1000, fontSize: '11.5px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
      >
        <span>Skip Intro</span>
        <i className="bi bi-fast-forward-fill"></i>
      </button>

      {/* Main Animation Stage */}
      <div className="position-relative d-flex flex-column align-items-center justify-content-center" style={{ width: '420px', height: '360px' }}>
        
        {/* Animated Walking Professional Silhouette */}
        <motion.div
          initial={{ x: -280, opacity: 0 }}
          animate={
            phase === 0
              ? { x: -30, opacity: 1 }
              : phase === 1
              ? { x: -35, y: [0, 8, 0], opacity: 1 }
              : { x: -60, opacity: 0.85 }
          }
          transition={{ duration: phase === 0 ? 1.3 : 0.6, ease: 'easeOut' }}
          className="position-absolute"
          style={{ bottom: '105px', left: '120px', zIndex: 5 }}
        >
          {/* Stylized Executive Character SVG */}
          <svg width="72" height="140" viewBox="0 0 72 140" fill="none">
            {/* Head */}
            <circle cx="36" cy="20" r="13" fill="#e2e8f0" />
            {/* Professional Hair */}
            <path d="M23 18C23 10 30 7 42 7C49 7 49 13 47 17C43 14 31 14 23 18Z" fill="#1e293b" />
            {/* Torso / Suit Blazer */}
            <path d="M18 36C22 34 50 34 54 36L58 75C58 78 54 82 50 82H22C18 82 14 78 14 75L18 36Z" fill="#334155" />
            {/* Collar & Tie */}
            <path d="M31 35L36 48L41 35H31Z" fill="#ffffff" />
            <path d="M34.5 45L36 65L37.5 45H34.5Z" fill="#6366f1" />
            {/* Legs */}
            <rect x="23" y="82" width="10" height="52" rx="5" fill="#1e293b" />
            <rect x="39" y="82" width="10" height="52" rx="5" fill="#1e293b" />
            {/* Shoes */}
            <path d="M19 130C19 127 34 127 34 134H19V130Z" fill="#0f172a" />
            <path d="M38 130C38 127 53 127 53 134H38V130Z" fill="#0f172a" />

            {/* Arm & Hand carrying briefcase in Phase 0 */}
            {phase === 0 && (
              <motion.g animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                <path d="M48 40L58 72" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                <circle cx="59" cy="74" r="4" fill="#e2e8f0" />
              </motion.g>
            )}

            {/* Arm placing down briefcase in Phase 1 & 2 */}
            {phase >= 1 && (
              <motion.g initial={{ rotate: -15 }} animate={{ rotate: 10 }} transition={{ duration: 0.4 }}>
                <path d="M48 40L56 70" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
                <circle cx="57" cy="72" r="4" fill="#e2e8f0" />
              </motion.g>
            )}
          </svg>
        </motion.div>

        {/* Floor Shadow / Pedestal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="position-absolute rounded-pill"
          style={{
            bottom: '78px',
            width: '260px',
            height: '24px',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)',
            zIndex: 1
          }}
        />

        {/* The Executive Briefcase */}
        <motion.div
          initial={{ x: -220, y: -20, opacity: 0 }}
          animate={
            phase === 0
              ? { x: 25, y: -15, opacity: 1 }
              : phase === 1
              ? { x: 45, y: 35, opacity: 1, scale: 1 }
              : phase === 2
              ? { x: 45, y: 35, opacity: 1, scale: 1.05 }
              : { x: 0, y: 0, scale: 2.2, opacity: [1, 0] }
          }
          transition={{
            duration: phase === 0 ? 1.3 : phase === 1 ? 0.7 : 0.6,
            ease: 'easeOut'
          }}
          className="position-relative briefcase-glow"
          style={{ zIndex: 10 }}
        >
          <svg width="120" height="85" viewBox="0 0 120 85" fill="none">
            {/* Handle */}
            <path
              d="M46 22V12C46 8.7 48.7 6 52 6H68C71.3 6 74 8.7 74 12V22"
              stroke="#475569"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Metallic Handle Connectors */}
            <rect x="44" y="18" width="5" height="6" rx="1" fill="#e2e8f0" />
            <rect x="71" y="18" width="5" height="6" rx="1" fill="#e2e8f0" />

            {/* Main Suitcase Body (Base) */}
            <rect x="10" y="22" width="100" height="58" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
            {/* Premium Leather Texture Gradient Accent */}
            <rect x="14" y="26" width="92" height="50" rx="5" fill="#0f172a" />

            {/* Suitcase Lid (Swings Open in Phase 2 & 3) */}
            <motion.path
              d="M10 22C10 17.5 13.5 14 18 14H102C106.5 14 110 17.5 110 22V32H10V22Z"
              fill="#334155"
              animate={phase >= 2 ? { rotateX: -95, y: -18 } : { rotateX: 0, y: 0 }}
              style={{ transformOrigin: 'top center' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />

            {/* Gold / Chrome Metal Latches */}
            <motion.rect
              x="30"
              y="32"
              width="9"
              height="12"
              rx="2"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="1"
              animate={phase >= 2 ? { y: 26, scaleY: 0.8 } : { y: 32 }}
            />
            <motion.rect
              x="81"
              y="32"
              width="9"
              height="12"
              rx="2"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="1"
              animate={phase >= 2 ? { y: 26, scaleY: 0.8 } : { y: 32 }}
            />

            {/* Center Lock Badge */}
            <rect x="55" y="34" width="10" height="8" rx="1" fill="#e2e8f0" />

            {/* Radiant Opening Light Burst (Phase 2 & 3) */}
            {phase >= 2 && (
              <motion.g
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 1, 0.8], scale: [0.2, 1.4, 2] }}
                transition={{ duration: 0.8 }}
              >
                <circle cx="60" cy="28" r="35" fill="url(#briefcaseGlowGrad)" />
              </motion.g>
            )}

            <defs>
              <radialGradient id="briefcaseGlowGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Status Text / Step Indicator */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-center position-absolute"
          style={{ bottom: '20px' }}
        >
          <span className="text-white-50 small fw-semibold tracking-wider text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>
            {phase === 0 && 'Arriving at Headquarters...'}
            {phase === 1 && 'Unpacking Enterprise EMS Portal...'}
            {phase >= 2 && 'Opening Workforce Portal...'}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BriefcaseLoader;
