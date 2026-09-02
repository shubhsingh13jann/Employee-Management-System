import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BriefcaseLoaderProps {
  onComplete: () => void;
}

/**
 * BriefcaseLoader - [3D Stylized Executive Character & Briefcase Opening]
 * 
 * Inspired directly by modern 3D Blender/Spline animations:
 * - 3D Stylized Executive: Blond sculpted hair, tailored light grey blazer, white shirt, slim black trousers, white sneakers
 * - True human walk cycle: Alternating knee flex, hip bob, counter arm swing, holding the brown leather briefcase
 * - Stoop & Place: Slows to center, bends knees and hips, places the brown leather briefcase on the ground
 * - 3D Lid Open: Gold latch clicks, lid flips open with 3D perspective rotation (rotateX)
 * - Portal Burst: Radiant light beams & sparkles emerge from inside, expanding into the auth card
 */
export const BriefcaseLoader: React.FC<BriefcaseLoaderProps> = ({ onComplete }) => {
  // Phase 0: Walking across stage from left to center (0s -> 2.0s)
  // Phase 1: Deceleration, stooping down, placing briefcase on floor (2.0s -> 3.2s)
  // Phase 2: Stands back up, golden latch clicks, 3D lid swings open (3.2s -> 4.2s)
  // Phase 3: Radiant portal beam bursts & expands to reveal auth hub (4.2s -> 4.8s)
  const [phase, setPhase] = useState<number>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2000);
    const t2 = setTimeout(() => setPhase(2), 3200);
    const t3 = setTimeout(() => setPhase(3), 4200);
    const t4 = setTimeout(() => onComplete(), 4800);

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
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(circle at 50% 35%, #1e293b 0%, #070a13 100%)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        perspective: "1000px"
      }}
    >
      {/* Frosted Glass Instant Skip Button */}
      <button
        type="button"
        onClick={onComplete}
        className="btn btn-sm btn-outline-light rounded-pill position-absolute top-0 end-0 m-4 px-3 py-1.5 d-flex align-items-center gap-2 shadow-sm"
        style={{
          zIndex: 1000,
          fontSize: "11.5px",
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.18)"
        }}
      >
        <span>Skip Intro</span>
        <i className="bi bi-fast-forward-fill"></i>
      </button>

      {/* Atmospheric Overhead Spotlight */}
      <div
        className="position-absolute"
        style={{
          top: "-60px",
          width: "360px",
          height: "440px",
          background: "radial-gradient(ellipse at top, rgba(99, 102, 241, 0.28) 0%, rgba(99, 102, 241, 0) 70%)",
          pointerEvents: "none",
          zIndex: 1
        }}
      />

      {/* Main 3D Stage Arena */}
      <div
        className="position-relative d-flex align-items-center justify-content-center"
        style={{ width: "560px", height: "400px" }}
      >
        {/* Soft Floor Shadow Plane */}
        <motion.div
          animate={
            phase === 0
              ? { x: [-160, -30], scaleX: [0.85, 1.1, 0.85] }
              : phase === 1
              ? { x: -30, scaleX: [1, 1.3, 1.25] }
              : { x: -30, scaleX: 1.35, opacity: 0.9 }
          }
          transition={
            phase === 0
              ? { x: { duration: 2.0, ease: "easeInOut" }, scaleX: { repeat: Infinity, duration: 0.55 } }
              : { duration: 0.6 }
          }
          className="position-absolute rounded-pill"
          style={{
            bottom: "40px",
            width: "300px",
            height: "26px",
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 72%)",
            zIndex: 2,
            filter: "blur(4px)"
          }}
        />

        {/* ============================================================
            3D STYLIZED EXECUTIVE CHARACTER (Gray Blazer, White Shirt,
            Slim Trousers, White Sneakers, Blond Hair & Stubble)
            ============================================================ */}
        <motion.div
          initial={{ x: -280, opacity: 0 }}
          animate={
            phase === 0
              ? { x: -70, opacity: 1 }
              : phase === 1
              ? { x: -70, y: [0, 18, 14] } // Stooping down to place the suitcase
              : phase >= 2
              ? { x: -90, y: 0 } // Straightens up and steps back slightly
              : { x: -70, opacity: 1 }
          }
          transition={{
            duration: phase === 0 ? 2.0 : phase === 1 ? 1.0 : 0.6,
            ease: "easeInOut"
          }}
          className="position-absolute"
          style={{ bottom: "50px", zIndex: 6 }}
        >
          {/* Walking Rhythmic Vertical Bob */}
          <motion.div
            animate={
              phase === 0
                ? { y: [0, -6, 0, -6, 0] }
                : phase === 1
                ? { y: 0 }
                : { y: 0 }
            }
            transition={
              phase === 0
                ? { repeat: Infinity, duration: 0.55, ease: "easeInOut" }
                : { duration: 0.3 }
            }
            style={{ width: "130px", height: "230px" }}
          >
            <svg
              width="130"
              height="230"
              viewBox="0 0 130 230"
              fill="none"
              style={{ overflow: "visible" }}
            >
              <defs>
                {/* 3D Volumetric Shaders */}
                {/* Skin Shading */}
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fed7aa" />
                  <stop offset="60%" stopColor="#fba76a" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>

                {/* Blond Hair Shading */}
                <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>

                {/* Gray Suit Blazer Shading */}
                <linearGradient id="blazerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="45%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
                <linearGradient id="blazerShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>

                {/* Slim Charcoal Trousers */}
                <linearGradient id="trousersGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                {/* White Sneakers */}
                <linearGradient id="sneakerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="70%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>

                {/* Leather Briefcase 3D Gradients */}
                <linearGradient id="leatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9a3412" />
                  <stop offset="40%" stopColor="#7c2d12" />
                  <stop offset="100%" stopColor="#451a03" />
                </linearGradient>
                <linearGradient id="leatherHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c2410c" />
                  <stop offset="100%" stopColor="#7c2d12" />
                </linearGradient>
                <linearGradient id="goldBrass" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>
              </defs>

              {/* -------------------------------------------------------------
                  1. BACK LEG (Right Leg - swings counter to front leg)
                  ------------------------------------------------------------- */}
              <motion.g
                animate={
                  phase === 0
                    ? { rotate: [26, -24, 26] }
                    : phase === 1
                    ? { rotate: 18 } // Knee bent stooping
                    : { rotate: 2 }
                }
                transition={
                  phase === 0
                    ? { repeat: Infinity, duration: 0.55, ease: "linear" }
                    : { duration: 0.4 }
                }
                style={{ transformOrigin: "66px 128px" }}
              >
                {/* Thigh */}
                <rect x="61" y="128" width="11" height="42" rx="5.5" fill="url(#trousersGrad)" />
                {/* Shin */}
                <rect x="62" y="164" width="9.5" height="38" rx="4.5" fill="#0f172a" />
                {/* White Sneaker */}
                <path
                  d="M60 198C60 196 66 194 72 194C77 194 81 197 83 201C83 203 76 205 60 205V198Z"
                  fill="url(#sneakerGrad)"
                />
                <rect x="59" y="202" width="25" height="3.5" rx="1.5" fill="#e2e8f0" />
              </motion.g>

              {/* -------------------------------------------------------------
                  2. BACK ARM (Right Arm - swings freely)
                  ------------------------------------------------------------- */}
              <motion.g
                animate={
                  phase === 0
                    ? { rotate: [-24, 26, -24] }
                    : phase === 1
                    ? { rotate: -15 }
                    : { rotate: 0 }
                }
                transition={
                  phase === 0
                    ? { repeat: Infinity, duration: 0.55, ease: "linear" }
                    : { duration: 0.4 }
                }
                style={{ transformOrigin: "74px 68px" }}
              >
                <rect x="70" y="66" width="10" height="42" rx="5" fill="url(#blazerShadow)" />
                <circle cx="75" cy="112" r="5" fill="url(#skinGrad)" />
              </motion.g>

              {/* -------------------------------------------------------------
                  3. TORSO & 3D LIGHT GREY BLAZER + WHITE SHIRT
                  ------------------------------------------------------------- */}
              <motion.g
                animate={
                  phase === 1
                    ? { rotate: 14 } // Leaning forward to place suitcase
                    : { rotate: 0 }
                }
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ transformOrigin: "65px 125px" }}
              >
                {/* Tailored Light Grey Blazer Torso */}
                <path
                  d="M48 64C53 61 77 61 82 64L88 122C88 127 82 130 78 130H52C48 130 42 127 42 122L48 64Z"
                  fill="url(#blazerGrad)"
                />
                {/* White Crisp Dress Shirt (V-Opening) */}
                <path d="M60 63L65 84L70 63H60Z" fill="#ffffff" />
                {/* Blazer Left & Right Lapels */}
                <path d="M52 64L64 88L58 114L49 76Z" fill="#cbd5e1" opacity="0.6" />
                <path d="M78 64L66 88L72 114L81 76Z" fill="#94a3b8" opacity="0.6" />
                {/* Center Button Accent */}
                <circle cx="65" cy="98" r="1.5" fill="#475569" />

                {/* -------------------------------------------------------------
                    4. 3D STYLIZED HEAD, BLOND HAIR & EXPRESSION
                    ------------------------------------------------------------- */}
                <g>
                  {/* Neck */}
                  <rect x="61" y="48" width="8" height="16" rx="4" fill="url(#skinGrad)" />
                  {/* 3D Sculpted Head Base */}
                  <circle cx="65" cy="40" r="15" fill="url(#skinGrad)" />

                  {/* Stylized Blond Hair (Volumetric Flow) */}
                  <path
                    d="M50 36C49 24 60 18 74 19C82 19 83 26 81 32C76 27 65 27 54 36Z"
                    fill="url(#hairGrad)"
                  />
                  <path
                    d="M74 19C79 23 83 29 82 36C80 34 78 30 74 27Z"
                    fill="#ca8a04"
                  />
                  {/* Stylized Sideburns & Beard Trim */}
                  <path
                    d="M78 40C77 47 72 52 65 53C61 53 58 50 56 46C56 46 62 48 69 46C76 44 78 40 78 40Z"
                    fill="url(#hairGrad)"
                    opacity="0.85"
                  />

                  {/* Facial Features (Stylized 3D Eyes & Smile) */}
                  <ellipse cx="73" cy="38" rx="1.8" ry="2.2" fill="#0f172a" />
                  <circle cx="73.6" cy="37.3" r="0.7" fill="#ffffff" />
                  {/* Friendly Confident Smile */}
                  <path
                    d="M71 44C73 45.5 75 45.5 77 44"
                    stroke="#7c2d12"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </g>

                {/* -------------------------------------------------------------
                    5. FRONT ARM (Left Arm - Holds Briefcase Handle in Phase 0 & 1)
                    ------------------------------------------------------------- */}
                <motion.g
                  animate={
                    phase === 0
                      ? { rotate: [-10, 12, -10] } // Natural arm sway holding handle
                      : phase === 1
                      ? { rotate: 36, y: 12 } // Extends down to gently place briefcase on floor
                      : { rotate: -12, y: 0 } // Pulls back after setting down
                  }
                  transition={
                    phase === 0
                      ? { repeat: Infinity, duration: 0.55, ease: "linear" }
                      : { duration: 0.5 }
                  }
                  style={{ transformOrigin: "56px 68px" }}
                >
                  {/* Blazer Sleeve */}
                  <rect x="52" y="66" width="10.5" height="42" rx="5" fill="url(#blazerGrad)" />
                  {/* Forearm & Hand Gripping Handle */}
                  <rect x="53" y="104" width="8.5" height="14" rx="4" fill="url(#skinGrad)" />
                  <circle cx="57" cy="118" r="5" fill="url(#skinGrad)" />
                </motion.g>
              </motion.g>

              {/* -------------------------------------------------------------
                  6. FRONT LEG (Left Leg)
                  ------------------------------------------------------------- */}
              <motion.g
                animate={
                  phase === 0
                    ? { rotate: [-24, 26, -24] }
                    : phase === 1
                    ? { rotate: 26 } // Squat / bend knees
                    : { rotate: 0 }
                }
                transition={
                  phase === 0
                    ? { repeat: Infinity, duration: 0.55, ease: "linear" }
                    : { duration: 0.4 }
                }
                style={{ transformOrigin: "58px 128px" }}
              >
                {/* Thigh */}
                <rect x="53" y="128" width="11" height="42" rx="5.5" fill="url(#trousersGrad)" />
                {/* Shin */}
                <rect x="54" y="164" width="9.5" height="38" rx="4.5" fill="#1e293b" />
                {/* White Sneaker */}
                <path
                  d="M52 198C52 196 58 194 64 194C69 194 73 197 75 201C75 203 68 205 52 205V198Z"
                  fill="url(#sneakerGrad)"
                />
                <rect x="51" y="202" width="25" height="3.5" rx="1.5" fill="#e2e8f0" />
              </motion.g>
            </svg>
          </motion.div>
        </motion.div>

        {/* ============================================================
            3D LEATHER BRIEFCASE & GOLD HARDWARE
            - In Phase 0: Carried along synchronously with character
            - In Phase 1: Lowered down and planted firmly on the floor
            - In Phase 2: Golden latch clicks, lid flips open in 3D
            - In Phase 3: Radiant beam bursts forth and morphs into Auth
            ============================================================ */}
        <motion.div
          animate={
            phase === 0
              ? { x: -28, y: [0, -4, 0, -4, 0] } // Carried by character hand
              : phase === 1
              ? { x: 20, y: 16 } // Planted firmly on the ground
              : { x: 20, y: 16, scale: [1, 1.03, 1] } // Grounded center stage
          }
          transition={
            phase === 0
              ? { x: { duration: 2.0, ease: "easeInOut" }, y: { repeat: Infinity, duration: 0.55 } }
              : { duration: 0.6, ease: "easeOut" }
          }
          className="position-absolute"
          style={{
            bottom: "52px",
            zIndex: 8,
            transformStyle: "preserve-3d"
          }}
        >
          {/* Contact Shadow under briefcase once planted */}
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0.4 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4 }}
              className="position-absolute rounded-pill"
              style={{
                bottom: "-8px",
                left: "-10px",
                width: "110px",
                height: "14px",
                background: "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 70%)",
                filter: "blur(2px)",
                zIndex: -1
              }}
            />
          )}

          {/* 3D Briefcase Body Container */}
          <div style={{ position: "relative", width: "90px", height: "72px" }}>
            
            {/* Leather Handle with Golden Brass Brackets */}
            <div
              className="position-absolute d-flex justify-content-center"
              style={{ top: "-14px", left: "0", width: "100%", zIndex: 3 }}
            >
              <svg width="34" height="16" viewBox="0 0 34 16">
                {/* Brass Mounting Plates */}
                <rect x="4" y="11" width="5" height="5" rx="1.5" fill="#eab308" />
                <rect x="25" y="11" width="5" height="5" rx="1.5" fill="#eab308" />
                {/* Curved Leather Grip Handle */}
                <path
                  d="M6 13C6 4 12 2 17 2C22 2 28 4 28 13"
                  stroke="#7c2d12"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>

            {/* Briefcase Base Hull */}
            <div
              className="position-absolute w-100 h-100 rounded-3 shadow-lg"
              style={{
                background: "linear-gradient(145deg, #9a3412 0%, #7c2d12 40%, #451a03 100%)",
                border: "1.5px solid #c2410c",
                boxShadow: "0 14px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.25)"
              }}
            >
              {/* Perimeter Saddle Stitching Details */}
              <div
                className="position-absolute"
                style={{
                  inset: "3px",
                  border: "1px dashed rgba(254, 215, 170, 0.35)",
                  borderRadius: "6px"
                }}
              />

              {/* Corner Brass Protectors */}
              <div
                className="position-absolute top-0 start-0"
                style={{ width: "8px", height: "8px", borderTop: "2px solid #eab308", borderLeft: "2px solid #eab308", borderTopLeftRadius: "5px" }}
              />
              <div
                className="position-absolute top-0 end-0"
                style={{ width: "8px", height: "8px", borderTop: "2px solid #eab308", borderRight: "2px solid #eab308", borderTopRightRadius: "5px" }}
              />
              <div
                className="position-absolute bottom-0 start-0"
                style={{ width: "8px", height: "8px", borderBottom: "2px solid #eab308", borderLeft: "2px solid #eab308", borderBottomLeftRadius: "5px" }}
              />
              <div
                className="position-absolute bottom-0 end-0"
                style={{ width: "8px", height: "8px", borderBottom: "2px solid #eab308", borderRight: "2px solid #eab308", borderBottomRightRadius: "5px" }}
              />

              {/* Central Golden Brass Lock Mechanism */}
              <div
                className="position-absolute start-50 translate-middle-x d-flex flex-column align-items-center"
                style={{ top: "18px", zIndex: 4 }}
              >
                <motion.div
                  animate={
                    phase >= 2
                      ? { scale: [1, 1.4, 1], filter: ["drop-shadow(0 0 0px transparent)", "drop-shadow(0 0 8px #fef08a)", "drop-shadow(0 0 0px transparent)"] }
                      : {}
                  }
                  transition={{ duration: 0.35 }}
                  className="rounded-1 d-flex align-items-center justify-content-center shadow-xs"
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "linear-gradient(135deg, #fef08a 0%, #eab308 50%, #ca8a04 100%)",
                    border: "0.5px solid #ffffff"
                  }}
                >
                  {/* Keyhole */}
                  <div style={{ width: "2px", height: "5px", background: "#451a03", borderRadius: "1px" }} />
                </motion.div>
              </div>
            </div>

            {/* -------------------------------------------------------------
                3D PERSPECTIVE LID (Flips Open on X-Axis in Phase >= 2)
                ------------------------------------------------------------- */}
            <motion.div
              initial={{ rotateX: 0 }}
              animate={
                phase >= 2
                  ? { rotateX: -115 }
                  : { rotateX: 0 }
              }
              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
              className="position-absolute w-100 rounded-top-3"
              style={{
                top: 0,
                left: 0,
                height: "36px",
                background: "linear-gradient(180deg, #c2410c 0%, #9a3412 100%)",
                borderTop: "1.5px solid #ea580c",
                borderLeft: "1.5px solid #9a3412",
                borderRight: "1.5px solid #9a3412",
                transformOrigin: "top center",
                transformStyle: "preserve-3d",
                zIndex: 5,
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
              }}
            >
              {/* Golden Top Accent Strap */}
              <div
                className="position-absolute start-50 translate-middle-x"
                style={{
                  top: 0,
                  width: "12px",
                  height: "100%",
                  background: "linear-gradient(90deg, #ca8a04 0%, #eab308 50%, #ca8a04 100%)"
                }}
              />
            </motion.div>

            {/* -------------------------------------------------------------
                RADIANT PORTAL BEAM & MAGICAL GOLDEN SPARKLES
                (Bursts out from inside the briefcase upon opening)
                ------------------------------------------------------------- */}
            <AnimatePresence>
              {phase >= 2 && (
                <>
                  {/* Rising Volumetric Light Pillar */}
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0, height: 0 }}
                    animate={{ opacity: [0.4, 0.9, 0.7], scaleY: 1, height: "300px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="position-absolute start-50 translate-middle-x"
                    style={{
                      bottom: "36px",
                      width: "180px",
                      background: "linear-gradient(to top, rgba(99, 102, 241, 0.85) 0%, rgba(168, 85, 247, 0.5) 40%, rgba(254, 240, 138, 0) 100%)",
                      transformOrigin: "bottom center",
                      filter: "blur(14px)",
                      pointerEvents: "none",
                      zIndex: 10
                    }}
                  />

                  {/* Golden Sparkles Rising */}
                  {[
                    { x: -30, delay: 0.1, size: 8 },
                    { x: 0, delay: 0.2, size: 12 },
                    { x: 30, delay: 0.15, size: 9 },
                    { x: -15, delay: 0.3, size: 10 },
                    { x: 20, delay: 0.25, size: 7 }
                  ].map((sparkle, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 0, x: sparkle.x, scale: 0.2 }}
                      animate={{
                        opacity: [0, 1, 0],
                        y: -140,
                        x: sparkle.x + (i % 2 === 0 ? 15 : -15),
                        scale: [0.2, 1.2, 0.4]
                      }}
                      transition={{ duration: 0.9, delay: sparkle.delay, ease: "easeOut" }}
                      className="position-absolute start-50 translate-middle-x rounded-circle"
                      style={{
                        bottom: "38px",
                        width: `${sparkle.size}px`,
                        height: `${sparkle.size}px`,
                        background: "radial-gradient(circle, #fef08a 0%, #eab308 100%)",
                        boxShadow: "0 0 10px #fef08a",
                        zIndex: 12
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Phase 3 Morph Expansion Pulse */}
        <AnimatePresence>
          {phase === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0.2, 0.8, 0], scale: [0.2, 1.8, 2.6] }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="position-absolute rounded-4"
              style={{
                width: "480px",
                height: "360px",
                border: "2px solid rgba(129, 140, 248, 0.6)",
                boxShadow: "0 0 60px rgba(99, 102, 241, 0.5)",
                pointerEvents: "none",
                zIndex: 20
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Narrative Subtitle */}
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="position-relative mt-2 text-center"
        style={{ zIndex: 10 }}
      >
        <span
          className="badge px-3 py-1.5 rounded-pill text-white fw-semibold"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontSize: "12px",
            letterSpacing: "0.5px"
          }}
        >
          {phase < 1 && "💼 Executive arriving with Enterprise EMS..."}
          {phase === 1 && "📦 Preparing executive workspace..."}
          {phase >= 2 && "✨ Opening Enterprise Portal..."}
        </span>
      </motion.div>
    </motion.div>
  );
};

export default BriefcaseLoader;
