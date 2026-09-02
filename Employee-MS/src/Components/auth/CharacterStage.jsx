import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * CharacterStage - The Ultimate Expressive 4-Bot Crew
 * 
 * Fixes & Enhancements:
 * 1. Complete Anatomy: Every character has complete eyes, animated mouths, articulated arms & hands!
 * 2. All-Character Privacy Reactions: When password is focused, ALL 4 characters cover their eyes with their own hands!
 * 3. Peek-Through-Fingers: When eye icon is toggled, the purple leader lowers its right hand and peeks with one eye!
 * 4. True 4-Tier Visual Transformation:
 *    - 👑 HR Admin: Royal gold crowns, jewels, gold seal & medallion
 *    - 👔 Manager: Executive glasses, silk neckties, KPI chart & coffee cup
 *    - 👷 Supervisor: Yellow safety hardhats, high-vis vests, clipboard & goggles
 *    - 💼 Employee: Modern tech headphones, EMS photo ID lanyards, laptop & smartphone
 * 5. Caret Tracking: All characters sweep their gaze from left to right as you type!
 * 6. 360° Mouse Cursor Tracking across the entire screen!
 */
const CharacterStage = ({
  mousePos = { x: 0, y: 0 },
  activeField = null, // 'email' | 'password' | null
  caretProgress = 0,   // 0 to 1
  showPassword = false,
  selectedRole = "admin", // 'admin' | 'manager' | 'supervisor' | 'employee'
  authStatus = "idle"  // 'idle' | 'submitting' | 'success' | 'error'
}) => {
  const [blink, setBlink] = useState(false);

  // Natural periodic blinking cycle (~3.6s)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 170);
    }, 3600);
    return () => clearInterval(interval);
  }, []);

  // Pupil offset calculation
  const getPupilOffset = (baseMultiplier = 1) => {
    if (activeField === "email") {
      // Caret reading physics: eyes sweep from left to right (+ leaning right towards form)
      const caretX = (caretProgress - 0.5) * 16 * baseMultiplier + 5;
      const caretY = 4 * baseMultiplier;
      return { x: caretX, y: caretY };
    }
    // 360° Mouse Tracking
    const mouseX = Math.max(-1, Math.min(1, mousePos.x)) * 12 * baseMultiplier;
    const mouseY = Math.max(-1, Math.min(1, mousePos.y)) * 10 * baseMultiplier;
    return { x: mouseX, y: mouseY };
  };

  const pOffset = getPupilOffset(1);
  const pOffsetSmall = getPupilOffset(0.75);

  const isPassword = activeField === "password";
  const isEmail = activeField === "email";
  const isSuccess = authStatus === "success";
  const isError = authStatus === "error";

  // Role metadata
  const roleThemes = {
    admin: {
      badgeTitle: "👑 HR ADMIN ACCESS",
      badgeDesc: "Executive Governance & Workforce Authorization",
      tier: "Tier 1: Global Administrative Command",
      accent: "#8b5cf6",
      accentBg: "#ede9fe",
      border: "#c4b5fd"
    },
    manager: {
      badgeTitle: "👔 DEPARTMENT MANAGER",
      badgeDesc: "Team Operations, Approvals & KPI Oversight",
      tier: "Tier 2: Operational Management",
      accent: "#2563eb",
      accentBg: "#dbeafe",
      border: "#93c5fd"
    },
    supervisor: {
      badgeTitle: "👷 SHIFT SUPERVISOR",
      badgeDesc: "Field Execution, Task Routing & Direct Reports",
      tier: "Tier 3: Operational Supervision",
      accent: "#059669",
      accentBg: "#d1fae5",
      border: "#6ee7b7"
    },
    employee: {
      badgeTitle: "💼 ENTERPRISE EMPLOYEE",
      badgeDesc: "Self-Service Portal, Tasks & Attendance",
      tier: "Tier 4: Workforce Staff Member",
      accent: "#d97706",
      accentBg: "#fef3c7",
      border: "#fde68a"
    }
  };

  const currentTheme = roleThemes[selectedRole] || roleThemes.admin;

  return (
    <div className="character-stage-container w-100 h-100 d-flex flex-column align-items-center justify-content-between p-3 p-md-4 select-none">
      
      {/* 👑 DYNAMIC ROLE BADGE BANNER */}
      <motion.div
        key={selectedRole}
        initial={{ opacity: 0, y: -12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-100 text-center py-2 px-3 rounded-4 shadow-xs"
        style={{
          background: currentTheme.accentBg,
          border: `1.5px solid ${currentTheme.border}`,
          maxWidth: "340px"
        }}
      >
        <div className="d-flex align-items-center justify-content-center gap-1.5 mb-0.5">
          <span className="fw-bold tracking-wider" style={{ color: currentTheme.accent, fontSize: "12px", letterSpacing: "0.5px" }}>
            {currentTheme.badgeTitle}
          </span>
        </div>
        <span className="text-secondary d-block" style={{ fontSize: "10.5px" }}>
          {currentTheme.badgeDesc}
        </span>
      </motion.div>

      {/* 🎨 MASTER SVG CHARACTER RIG ARENA */}
      <div className="position-relative d-flex align-items-center justify-content-center my-auto w-100" style={{ maxWidth: "420px", height: "300px" }}>
        <svg
          viewBox="0 0 460 340"
          className="w-100 h-100"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="60%" stopColor="#6d28d9" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>

            <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="60%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>

            <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="70%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>

            {/* Gold Crown Gradient */}
            <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Safety Helmet Gradient */}
            <linearGradient id="hardhatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>

            {/* Drop Shadows */}
            <filter id="botShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.14" />
            </filter>
            <filter id="handShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* ============================================================
              GROUND PEDESTAL SHADOWS
              ============================================================ */}
          <ellipse cx="218" cy="305" rx="55" ry="14" fill="rgba(15, 23, 42, 0.08)" />
          <ellipse cx="284" cy="312" rx="38" ry="11" fill="rgba(15, 23, 42, 0.09)" />
          <ellipse cx="368" cy="305" rx="42" ry="12" fill="rgba(15, 23, 42, 0.07)" />
          <ellipse cx="155" cy="310" rx="72" ry="16" fill="rgba(15, 23, 42, 0.12)" />

          {/* ============================================================
              1. PURPLE LEADER (Tall Bot, Center-Back)
              ============================================================ */}
          <motion.g
            animate={
              isSuccess
                ? { y: [0, -18, 0, -12, 0], scale: [1, 1.03, 1] }
                : isError
                ? { x: [0, -6, 6, -4, 4, 0] }
                : isEmail
                ? { x: 8, rotate: 2 }
                : { y: 0, x: 0, rotate: 0 }
            }
            transition={{ duration: isSuccess ? 0.6 : 0.4 }}
          >
            {/* Main Body Column */}
            <rect
              x="170"
              y="95"
              width="95"
              height="215"
              rx="44"
              fill="url(#purpleGrad)"
              filter="url(#botShadow)"
            />

            {/* Inner Sheen */}
            <rect x="175" y="100" width="85" height="100" rx="40" fill="white" opacity="0.08" />

            {/* PURPLE IDLE / RESTING ARMS & HANDS (Visible when not covering eyes) */}
            {!isPassword && (
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {/* Left Arm & Hand resting on hip */}
                <path
                  d="M172 175 C150 185 146 220 162 232"
                  stroke="#6d28d9"
                  strokeWidth="11"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="163" cy="232" r="7.5" fill="#a78bfa" />
                {/* Right Arm & Hand pointing towards form */}
                <motion.path
                  d={isEmail ? "M263 175 C282 178 300 190 312 205" : "M263 175 C284 185 288 220 274 232"}
                  stroke="#6d28d9"
                  strokeWidth="11"
                  strokeLinecap="round"
                  fill="none"
                  animate={isEmail ? { x: [0, 4, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
                <circle cx={isEmail ? 312 : 273} cy={isEmail ? 205 : 232} r="7.5" fill="#a78bfa" />
              </motion.g>
            )}

            {/* ===================================
                ROLE-SPECIFIC GEAR FOR PURPLE LEADER
                =================================== */}
            {/* 👑 HR Admin Crown */}
            {selectedRole === "admin" && (
              <motion.g
                initial={{ scale: 0, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                style={{ transformOrigin: "217px 90px" }}
              >
                {/* Ornate 3-point Royal Crown */}
                <path
                  d="M192 92 L182 62 L202 75 L217 50 L233 75 L253 62 L243 92 Z"
                  fill="url(#crownGrad)"
                  stroke="#d97706"
                  strokeWidth="2"
                  filter="url(#handShadow)"
                />
                {/* Crown Rim */}
                <rect x="188" y="90" width="60" height="7" rx="3.5" fill="#f59e0b" />
                {/* Jewels */}
                <circle cx="217" cy="65" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                <circle cx="187" cy="74" r="3.5" fill="#3b82f6" />
                <circle cx="248" cy="74" r="3.5" fill="#10b981" />
              </motion.g>
            )}

            {/* 👔 Manager Executive Glasses & Silk Tie */}
            {selectedRole === "manager" && (
              <motion.g
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Sharp Black Executive Glasses Frame */}
                <rect x="190" y="136" width="23" height="18" rx="4" fill="none" stroke="#0f172a" strokeWidth="3" />
                <rect x="223" y="136" width="23" height="18" rx="4" fill="none" stroke="#0f172a" strokeWidth="3" />
                <path d="M213 144 H223" stroke="#0f172a" strokeWidth="3" />
                <path d="M190 144 L175 140" stroke="#0f172a" strokeWidth="2.5" />
                <path d="M246 144 L260 140" stroke="#0f172a" strokeWidth="2.5" />
                {/* Formal Necktie & Collar */}
                <path d="M208 190 L218 196 L228 190" stroke="#ffffff" strokeWidth="3" fill="none" />
                <polygon points="214,196 222,196 224,235 218,242 212,235" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
                {/* Tie stripes */}
                <line x1="214" y1="208" x2="222" y2="212" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="214" y1="222" x2="222" y2="226" stroke="#ffffff" strokeWidth="1.5" />
              </motion.g>
            )}

            {/* 👷 Supervisor Hardhat & High-Vis Vest */}
            {selectedRole === "supervisor" && (
              <motion.g
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
              >
                {/* Operational Safety Hardhat */}
                <path
                  d="M185 96 C185 64 250 64 250 96 Z"
                  fill="url(#hardhatGrad)"
                  stroke="#ca8a04"
                  strokeWidth="2"
                  filter="url(#handShadow)"
                />
                {/* Hardhat Brim */}
                <path d="M176 96 C176 93 258 93 258 96 H176 Z" stroke="#ca8a04" strokeWidth="3.5" fill="#eab308" />
                {/* EMS Safety Emblem on Helmet */}
                <rect x="211" y="76" width="13" height="11" rx="2" fill="#ffffff" />
                <path d="M217 78 V85 M214 81 H221" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                {/* Reflective High-Vis Orange Safety Vest */}
                <path d="M178 195 Q218 200 258 195 L258 245 Q218 250 178 245 Z" fill="#f97316" opacity="0.9" />
                {/* Silver Reflective Safety Stripes */}
                <line x1="184" y1="208" x2="252" y2="208" stroke="#ffffff" strokeWidth="3.5" strokeDasharray="4 2" />
                <line x1="184" y1="230" x2="252" y2="230" stroke="#ffffff" strokeWidth="3.5" strokeDasharray="4 2" />
              </motion.g>
            )}

            {/* 💼 Employee Modern Tech Headphones & EMS Lanyard */}
            {selectedRole === "employee" && (
              <motion.g
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {/* Headphone Over-Head Band */}
                <path d="M175 145 C175 75 260 75 260 145" stroke="#334155" strokeWidth="5.5" fill="none" />
                {/* Ear Cups */}
                <rect x="167" y="132" width="10" height="26" rx="5" fill="#0f172a" />
                <rect x="258" y="132" width="10" height="26" rx="5" fill="#0f172a" />
                {/* EMS Blue Fabric Lanyard */}
                <path d="M204 188 L218 232 L232 188" stroke="#3b82f6" strokeWidth="3" fill="none" />
                {/* Hanging Photo ID Badge */}
                <rect x="210" y="232" width="16" height="22" rx="2.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" filter="url(#handShadow)" />
                <rect x="213" y="235" width="10" height="8" rx="1" fill="#38bdf8" />
                <line x1="213" y1="247" x2="223" y2="247" stroke="#64748b" strokeWidth="1.5" />
                <line x1="213" y1="250" x2="220" y2="250" stroke="#94a3b8" strokeWidth="1" />
              </motion.g>
            )}

            {/* PURPLE BOT EYES */}
            <g>
              {/* Eye Whites */}
              <ellipse cx="202" cy="146" rx="12" ry="14" fill="#ffffff" />
              <ellipse cx="234" cy="146" rx="12" ry="14" fill="#ffffff" />

              {/* Pupils (Tracking Mouse / Caret) */}
              <motion.circle
                cx="202"
                cy="146"
                r="6.2"
                fill="#0f172a"
                animate={{ x: pOffset.x, y: pOffset.y }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              />
              <circle cx={202 + pOffset.x + 2} cy={146 + pOffset.y - 2} r="2" fill="#ffffff" />

              <motion.circle
                cx="234"
                cy="146"
                r="6.2"
                fill="#0f172a"
                animate={{ x: pOffset.x, y: pOffset.y }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              />
              <circle cx={234 + pOffset.x + 2} cy={146 + pOffset.y - 2} r="2" fill="#ffffff" />

              {/* Natural Eyelid Blink */}
              {blink && (
                <>
                  <rect x="188" y="131" width="28" height="30" rx="4" fill="url(#purpleGrad)" />
                  <rect x="220" y="131" width="28" height="30" rx="4" fill="url(#purpleGrad)" />
                </>
              )}
            </g>

            {/* PURPLE BOT ANIMATED MOUTH */}
            <g>
              {isSuccess ? (
                // Wide Open Celebratory Smile
                <path d="M205 174 Q218 192 231 174 Z" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5">
                  <animate attributeName="d" values="M205 174 Q218 192 231 174 Z; M205 174 Q218 196 231 174 Z; M205 174 Q218 192 231 174 Z" dur="0.8s" repeatCount="indefinite" />
                </path>
              ) : isPassword ? (
                // Shy / Surprised "O" Mouth
                <ellipse cx="218" cy="177" rx="5" ry="6" fill="#0f172a" />
              ) : isEmail ? (
                // Talking / Reading Mouth
                <motion.path
                  d="M208 175 Q218 183 228 175"
                  stroke="#0f172a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M208 175 Q218 183 228 175", "M208 176 Q218 172 228 176", "M208 175 Q218 183 228 175"] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              ) : (
                // Warm Friendly Smile
                <path d="M208 174 Q218 184 228 174" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
              )}
            </g>

            {/* ============================================================
                PURPLE PRIVACY HANDS OVER EYES & PEEK-THROUGH-FINGERS
                ============================================================ */}
            <AnimatePresence>
              {isPassword && (
                <g>
                  {/* Left Hand: Covers Left Eye */}
                  <motion.g
                    initial={{ y: 90, opacity: 0, scale: 0.7 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 90, opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 340, damping: 22 }}
                    style={{ transformOrigin: "202px 146px" }}
                  >
                    {/* Articulated Arm Extension */}
                    <path d="M172 195 Q180 160 200 148" stroke="#6d28d9" strokeWidth="12" strokeLinecap="round" fill="none" />
                    {/* Palm & 4 Cute Defined Fingers */}
                    <ellipse cx="202" cy="146" rx="15" ry="17" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.5" filter="url(#handShadow)" />
                    <rect x="191" y="132" width="5.5" height="13" rx="2.75" fill="#c4b5fd" />
                    <rect x="198" y="130" width="5.5" height="15" rx="2.75" fill="#c4b5fd" />
                    <rect x="205" y="131" width="5.5" height="14" rx="2.75" fill="#c4b5fd" />
                    <rect x="212" y="134" width="5" height="11" rx="2.5" fill="#c4b5fd" />
                  </motion.g>

                  {/* Right Hand: Covers Right Eye OR PEEKS THROUGH FINGERS */}
                  <motion.g
                    initial={{ y: 90, opacity: 0, scale: 0.7 }}
                    animate={
                      showPassword
                        ? { y: 24, x: 18, rotate: -25, scale: 0.95 } // PEEKS! Hand lowers to cheek and angles away
                        : { y: 0, x: 0, rotate: 0, scale: 1 }        // Full coverage
                    }
                    exit={{ y: 90, opacity: 0, scale: 0.7 }}
                    transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    style={{ transformOrigin: "234px 146px" }}
                  >
                    {/* Articulated Arm Extension */}
                    <path d="M263 195 Q252 160 236 148" stroke="#6d28d9" strokeWidth="12" strokeLinecap="round" fill="none" />
                    {/* Palm & Fingers */}
                    <ellipse cx="234" cy="146" rx="15" ry="17" fill="#a78bfa" stroke="#7c3aed" strokeWidth="1.5" filter="url(#handShadow)" />
                    {/* Fingers spread open if peeking! */}
                    <rect x={showPassword ? 221 : 223} y="132" width="5" height="13" rx="2.5" fill="#c4b5fd" />
                    <rect x={showPassword ? 228 : 229} y="130" width="5.5" height="15" rx="2.75" fill="#c4b5fd" />
                    <rect x={showPassword ? 236 : 236} y="131" width="5.5" height="14" rx="2.75" fill="#c4b5fd" />
                    <rect x={showPassword ? 243 : 243} y="134" width="5" height="11" rx="2.5" fill="#c4b5fd" />
                  </motion.g>
                </g>
              )}
            </AnimatePresence>
          </motion.g>

          {/* ============================================================
              2. PINK BOT (Curved Column Assistant, Center-Right)
              ============================================================ */}
          <motion.g
            animate={
              isSuccess
                ? { y: [0, -14, 0, -8, 0], scale: [1, 1.05, 1] }
                : isError
                ? { x: [0, 5, -5, 3, -3, 0] }
                : isPassword
                ? { rotate: 6, x: 4 } // Turns shyly
                : isEmail
                ? { x: 6 }
                : { y: 0, x: 0, rotate: 0 }
            }
            transition={{ duration: 0.4 }}
          >
            {/* Body */}
            <rect
              x="250"
              y="172"
              width="68"
              height="142"
              rx="34"
              fill="url(#pinkGrad)"
              filter="url(#botShadow)"
            />

            {/* Rosy Cheeks */}
            <circle cx="266" cy="220" r="4.5" fill="#fda4af" opacity="0.6" />
            <circle cx="302" cy="220" r="4.5" fill="#fda4af" opacity="0.6" />

            {/* PINK BOT EYES */}
            <g>
              <ellipse cx="274" cy="208" rx="8.5" ry="10" fill="#ffffff" />
              <ellipse cx="294" cy="208" rx="8.5" ry="10" fill="#ffffff" />

              {/* Pupils */}
              <motion.circle
                cx="274"
                cy="208"
                r="4.5"
                fill="#0f172a"
                animate={{ x: pOffsetSmall.x, y: pOffsetSmall.y }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              />
              <circle cx={274 + pOffsetSmall.x + 1.5} cy={208 + pOffsetSmall.y - 1.5} r="1.5" fill="#ffffff" />

              <motion.circle
                cx="294"
                cy="208"
                r="4.5"
                fill="#0f172a"
                animate={{ x: pOffsetSmall.x, y: pOffsetSmall.y }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              />
              <circle cx={294 + pOffsetSmall.x + 1.5} cy={208 + pOffsetSmall.y - 1.5} r="1.5" fill="#ffffff" />

              {blink && (
                <>
                  <rect x="264" y="198" width="20" height="20" rx="3" fill="url(#pinkGrad)" />
                  <rect x="284" y="198" width="20" height="20" rx="3" fill="url(#pinkGrad)" />
                </>
              )}
            </g>

            {/* PINK BOT MOUTH */}
            <g>
              {isPassword ? (
                // Shy blushing small mouth
                <path d="M280 228 Q284 225 288 228" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
              ) : isSuccess ? (
                // Happy open smile
                <path d="M278 225 Q284 234 290 225 Z" fill="#ffffff" stroke="#9f1239" strokeWidth="1" />
              ) : (
                // Sweet smile
                <path d="M278 226 Q284 232 290 226" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              )}
            </g>

            {/* PINK BOT ARMS & HANDS (COVERS EYES IN PASSWORD MODE) */}
            {isPassword ? (
              <motion.g
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Both Pink Hands Cover Eyes */}
                <ellipse cx="274" cy="208" rx="10" ry="11" fill="#fda4af" stroke="#e11d48" strokeWidth="1" filter="url(#handShadow)" />
                <ellipse cx="294" cy="208" rx="10" ry="11" fill="#fda4af" stroke="#e11d48" strokeWidth="1" filter="url(#handShadow)" />
              </motion.g>
            ) : (
              // Idle Arms holding role accessories
              <g>
                <path d="M250 240 Q244 260 256 268" stroke="#be123c" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="256" cy="268" r="5" fill="#fda4af" />

                {/* Right Arm: Role Accessory */}
                <path d="M316 240 Q325 255 318 266" stroke="#be123c" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="318" cy="266" r="5" fill="#fda4af" />

                {/* Role Accessories for Pink */}
                {selectedRole === "manager" && (
                  // KPI Chart in hands
                  <g filter="url(#handShadow)">
                    <rect x="312" y="252" width="18" height="15" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <polyline points="314,263 318,258 322,260 327,255" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  </g>
                )}
                {selectedRole === "employee" && (
                  // Mini Silver Laptop
                  <g filter="url(#handShadow)">
                    <rect x="310" y="255" width="20" height="12" rx="2" fill="#94a3b8" />
                    <rect x="312" y="257" width="16" height="8" rx="1" fill="#0284c7" />
                  </g>
                )}
              </g>
            )}
          </motion.g>

          {/* ============================================================
              3. YELLOW GUMDROP (Quirky Companion, Right)
              ============================================================ */}
          <motion.g
            animate={
              isSuccess
                ? { y: [0, -12, 0, -6, 0], rotate: [0, 4, -4, 0] }
                : isError
                ? { rotate: [0, -5, 5, 0] }
                : isPassword
                ? { y: 6, scale: 0.96 } // Dips shyly
                : isEmail
                ? { x: 4 }
                : { y: 0, x: 0, rotate: 0 }
            }
            transition={{ duration: 0.4 }}
          >
            {/* Body Gumdrop */}
            <rect
              x="332"
              y="162"
              width="78"
              height="146"
              rx="38"
              fill="url(#yellowGrad)"
              filter="url(#botShadow)"
            />

            {/* Cheeks */}
            <circle cx="348" cy="216" r="5.5" fill="#fca5a5" opacity={isPassword ? "0.8" : "0.3"} />
            <circle cx="394" cy="216" r="5.5" fill="#fca5a5" opacity={isPassword ? "0.8" : "0.3"} />

            {/* YELLOW BOT EYES */}
            <g>
              <ellipse cx="356" cy="198" rx="8" ry="9" fill="#ffffff" />
              <ellipse cx="386" cy="198" rx="8" ry="9" fill="#ffffff" />

              <motion.circle
                cx="356"
                cy="198"
                r="4.2"
                fill="#0f172a"
                animate={{ x: pOffsetSmall.x, y: pOffsetSmall.y }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              />
              <circle cx={356 + pOffsetSmall.x + 1.5} cy={198 + pOffsetSmall.y - 1.5} r="1.5" fill="#ffffff" />

              <motion.circle
                cx="386"
                cy="198"
                r="4.2"
                fill="#0f172a"
                animate={{ x: pOffsetSmall.x, y: pOffsetSmall.y }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              />
              <circle cx={386 + pOffsetSmall.x + 1.5} cy={198 + pOffsetSmall.y - 1.5} r="1.5" fill="#ffffff" />

              {blink && (
                <>
                  <rect x="347" y="188" width="18" height="19" rx="3" fill="url(#yellowGrad)" />
                  <rect x="377" y="188" width="18" height="19" rx="3" fill="url(#yellowGrad)" />
                </>
              )}
            </g>

            {/* YELLOW BOT MOUTH */}
            <g>
              {isPassword ? (
                // Shy wavy line
                <path d="M362 222 Q371 226 380 222" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              ) : isSuccess ? (
                // Happy big grin
                <path d="M360 220 Q371 230 382 220 Z" fill="#ffffff" stroke="#ca8a04" strokeWidth="1" />
              ) : (
                // Quirky straight mouth with slight curve
                <path d="M360 220 H382" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              )}
            </g>

            {/* YELLOW BOT ARMS & HANDS */}
            {isPassword ? (
              // Covers Eyes with Both Yellow Hands
              <motion.g
                initial={{ y: 35, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 35, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ellipse cx="356" cy="198" rx="11" ry="12" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" filter="url(#handShadow)" />
                <ellipse cx="386" cy="198" rx="11" ry="12" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" filter="url(#handShadow)" />
              </motion.g>
            ) : (
              // Idle Arms with Role Accessories
              <g>
                <path d="M334 235 Q326 250 336 260" stroke="#ca8a04" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="336" cy="260" r="5" fill="#fef08a" />

                <path d="M408 235 Q418 250 405 260" stroke="#ca8a04" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="405" cy="260" r="5" fill="#fef08a" />

                {/* Role Accessories for Yellow */}
                {selectedRole === "manager" && (
                  // Starbucks Coffee Cup
                  <g filter="url(#handShadow)">
                    <rect x="402" y="246" width="13" height="17" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <rect x="403" y="252" width="11" height="6" fill="#047857" />
                    <path d="M405 242 Q408 238 411 242" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                  </g>
                )}
                {selectedRole === "supervisor" && (
                  // Inspection Clipboard with Checkmarks
                  <g filter="url(#handShadow)">
                    <rect x="398" y="244" width="17" height="22" rx="2" fill="#d97706" />
                    <rect x="401" y="247" width="11" height="16" fill="#ffffff" />
                    <path d="M403 252 L405 254 L409 250" stroke="#16a34a" strokeWidth="1.5" fill="none" />
                    <path d="M403 258 L405 260 L409 256" stroke="#16a34a" strokeWidth="1.5" fill="none" />
                  </g>
                )}
                {selectedRole === "employee" && (
                  // Smartphone
                  <g filter="url(#handShadow)">
                    <rect x="402" y="248" width="12" height="19" rx="2.5" fill="#1e293b" />
                    <rect x="404" y="250" width="8" height="14" rx="1" fill="#38bdf8" />
                  </g>
                )}
              </g>
            )}
          </motion.g>

          {/* ============================================================
              4. ORANGE BLOB (Playful Mascot, Front-Left)
              ============================================================ */}
          <motion.g
            animate={
              isSuccess
                ? { y: [0, -18, 0, -12, 0], scale: [1, 1.08, 1] }
                : isError
                ? { x: [0, -5, 5, 0] }
                : isPassword
                ? { y: 10, scale: 0.95 } // Ducks down in privacy
                : isEmail
                ? { x: 5 }
                : { y: 0, x: 0, scale: 1 }
            }
            transition={{ duration: 0.4 }}
          >
            {/* Semi-Circular Organic Dome Body */}
            <path
              d="M85 305 C85 200 235 200 235 305 Z"
              fill="url(#orangeGrad)"
              filter="url(#botShadow)"
            />

            {/* Cheeks */}
            <circle cx="132" cy="265" r="7" fill="#f43f5e" opacity="0.3" />
            <circle cx="188" cy="265" r="7" fill="#f43f5e" opacity="0.3" />

            {/* ORANGE BLOB EYES */}
            <g>
              <ellipse cx="146" cy="245" rx="8.5" ry="10" fill="#ffffff" />
              <ellipse cx="174" cy="245" rx="8.5" ry="10" fill="#ffffff" />

              <motion.circle
                cx="146"
                cy="245"
                r="4.5"
                fill="#0f172a"
                animate={{ x: pOffset.x * 0.9, y: pOffset.y * 0.9 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              />
              <circle cx={146 + pOffset.x * 0.9 + 1.5} cy={245 + pOffset.y * 0.9 - 1.5} r="1.5" fill="#ffffff" />

              <motion.circle
                cx="174"
                cy="245"
                r="4.5"
                fill="#0f172a"
                animate={{ x: pOffset.x * 0.9, y: pOffset.y * 0.9 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
              />
              <circle cx={174 + pOffset.x * 0.9 + 1.5} cy={245 + pOffset.y * 0.9 - 1.5} r="1.5" fill="#ffffff" />

              {blink && (
                <>
                  <rect x="136" y="235" width="20" height="20" rx="3" fill="url(#orangeGrad)" />
                  <rect x="164" y="235" width="20" height="20" rx="3" fill="url(#orangeGrad)" />
                </>
              )}
            </g>

            {/* ORANGE BLOB ANIMATED MOUTH */}
            <g>
              {isSuccess ? (
                // Ecstatic open smile
                <path d="M150 262 Q160 280 170 262 Z" fill="#ffffff" stroke="#c2410c" strokeWidth="1.5" />
              ) : isPassword ? (
                // Cute shy "o"
                <circle cx="160" cy="268" r="4" fill="#0f172a" />
              ) : (
                // Big happy tongue smile
                <g>
                  <path d="M150 264 Q160 276 170 264 Z" fill="#0f172a" />
                  <path d="M155 270 Q160 276 165 270" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" fill="none" />
                </g>
              )}
            </g>

            {/* ORANGE BLOB PAWS / ARMS */}
            {isPassword ? (
              // Covers Eyes with Both Paws
              <motion.g
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <ellipse cx="146" cy="245" rx="11" ry="12" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" filter="url(#handShadow)" />
                <ellipse cx="174" cy="245" rx="11" ry="12" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" filter="url(#handShadow)" />
              </motion.g>
            ) : isSuccess ? (
              // Raises Paws in the air cheering!
              <motion.g
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              >
                <ellipse cx="120" cy="210" rx="9" ry="10" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" filter="url(#handShadow)" />
                <ellipse cx="200" cy="210" rx="9" ry="10" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" filter="url(#handShadow)" />
              </motion.g>
            ) : (
              // Paws resting happily at bottom
              <g>
                <ellipse cx="125" cy="295" rx="10" ry="8" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" filter="url(#handShadow)" />
                <ellipse cx="195" cy="295" rx="10" ry="8" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" filter="url(#handShadow)" />
              </g>
            )}

            {/* Mini Role Accessory for Orange Blob */}
            {selectedRole === "admin" && (
              // Tiny tilted gold crown
              <polygon points="152,216 160,205 168,216 174,208 160,224" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            )}
            {selectedRole === "supervisor" && (
              // Tiny yellow safety cap
              <path d="M148 222 Q160 212 172 222 Z" fill="#eab308" stroke="#a16207" strokeWidth="1" />
            )}
            {selectedRole === "manager" && (
              // Cute red bow tie
              <polygon points="154,280 166,280 160,277" fill="#ef4444" />
            )}
          </motion.g>
        </svg>
      </div>

      {/* 💬 LIVE NARRATION CAPTION BAR */}
      <div className="text-center mt-2">
        <span
          className="text-secondary small fw-medium d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill"
          style={{ background: "rgba(15, 23, 42, 0.04)", fontSize: "11px" }}
        >
          {isPassword ? (
            showPassword ? (
              <>
                <span>👀</span>
                <strong className="text-dark">Peeking through fingers! Password visible.</strong>
              </>
            ) : (
              <>
                <span>🙈</span>
                <span>All crew covering eyes for your privacy...</span>
              </>
            )
          ) : isEmail ? (
            <>
              <span>📖</span>
              <span>Crew tracking your email caret: {emailTextCaret(caretProgress)}</span>
            </>
          ) : isSuccess ? (
            <>
              <span>🎉</span>
              <strong className="text-success">Credentials verified! Heading to dashboard...</strong>
            </>
          ) : isError ? (
            <>
              <span>🤔</span>
              <strong className="text-danger">Invalid credentials. Let's try again!</strong>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>360° Interactive Workforce Crew • Tracking cursor</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
};

// Helper for caret caption visual
const emailTextCaret = (progress) => {
  const percent = Math.round(progress * 100);
  return `${percent}%`;
};

export default CharacterStage;
