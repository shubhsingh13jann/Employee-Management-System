import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * CharacterStage - All 4 Crew Members Sneak Peek Together!
 * 
 * When Password is Masked (showPassword=false):
 * - ALL 4 characters (Purple, Pink, Yellow, Orange) firmly cover BOTH eyes with both hands/paws!
 * 
 * When Password is Unmasked (showPassword=true / Sneak Peek):
 * - ALL 4 characters sneak peek together!
 * - Purple lowers right hand to cheek, right eye peeks at password!
 * - Pink lowers right hand to cheek, right eye peeks at password!
 * - Yellow lowers right hand to cheek, right eye peeks at password!
 * - Orange lowers right paw to cheek, right eye peeks at password!
 * - All 4 characters look directly at the password with their black & white glossy glint eyes!
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
  const [winMouse, setWinMouse] = useState({ x: 0, y: 0 });

  // 360° Global Window Mouse Tracking
  useEffect(() => {
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      setWinMouse({ x, y });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  // Periodic blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3600);
    return () => clearInterval(interval);
  }, []);

  const isPassword = activeField === "password";
  const isEmail = activeField === "email";
  const isSuccess = authStatus === "success";
  const isError = authStatus === "error";

  // Calculate Pupil Direction
  const getPupilOffset = (baseMultiplier = 1) => {
    if (isEmail) {
      // Email input is on the RIGHT panel (+X, +Y)
      const caretX = (7 + caretProgress * 7) * baseMultiplier;
      const caretY = 4.5 * baseMultiplier;
      return { x: caretX, y: caretY };
    }
    if (isPassword) {
      if (showPassword) {
        // Peek mode: ALL characters look down-right directly at password!
        return { x: 8 * baseMultiplier, y: 3.5 * baseMultiplier };
      }
      // Masked: eyes covered
      return { x: 0, y: 0 };
    }
    // 360° Global Cursor Tracking
    const mx = Math.max(-1, Math.min(1, winMouse.x || mousePos.x)) * 8 * baseMultiplier;
    const my = Math.max(-1, Math.min(1, winMouse.y || mousePos.y)) * 7 * baseMultiplier;
    return { x: mx, y: my };
  };

  const pOffset = getPupilOffset(1);
  const pOffsetSmall = getPupilOffset(0.8);

  // Role Metadata
  const roleThemes = {
    admin: {
      badgeTitle: "👑 HR ADMIN ACCESS",
      badgeDesc: "Executive Governance & Workforce Authorization",
      accent: "#8b5cf6",
      accentBg: "#ede9fe",
      border: "#c4b5fd"
    },
    manager: {
      badgeTitle: "👔 DEPARTMENT MANAGER",
      badgeDesc: "Team Operations, Approvals & KPI Oversight",
      accent: "#2563eb",
      accentBg: "#dbeafe",
      border: "#93c5fd"
    },
    supervisor: {
      badgeTitle: "👷 SHIFT SUPERVISOR",
      badgeDesc: "Field Execution, Task Routing & Direct Reports",
      accent: "#059669",
      accentBg: "#d1fae5",
      border: "#6ee7b7"
    },
    employee: {
      badgeTitle: "💼 ENTERPRISE EMPLOYEE",
      badgeDesc: "Self-Service Portal, Tasks & Attendance",
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
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
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

      {/* 🎨 MASTER SVG RIG */}
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

            <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <linearGradient id="hardhatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>

            {/* Hand Fill Gradients for Contrast */}
            <linearGradient id="purpleHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f3ff" />
              <stop offset="35%" stopColor="#ddd6fe" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>

            <linearGradient id="pinkHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff1f2" />
              <stop offset="35%" stopColor="#fecdd3" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>

            <linearGradient id="yellowHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fefce8" />
              <stop offset="35%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#facc15" />
            </linearGradient>

            <linearGradient id="orangeHandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff7ed" />
              <stop offset="35%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>

            {/* Shadows */}
            <filter id="botShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.14" />
            </filter>
            <filter id="handShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.38" />
            </filter>
          </defs>

          {/* Ground Shadows */}
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
                ? { x: 8, rotate: 2.5 }
                : { y: 0, x: 0, rotate: 0 }
            }
            transition={{ duration: isSuccess ? 0.6 : 0.4 }}
          >
            {/* Body */}
            <rect
              x="170"
              y="95"
              width="95"
              height="215"
              rx="44"
              fill="url(#purpleGrad)"
              filter="url(#botShadow)"
            />

            {/* Resting Idle Arms (Only when NOT in password mode) */}
            {!isPassword && (
              <g>
                <path d="M172 175 C150 185 146 220 162 232" stroke="#6d28d9" strokeWidth="11" strokeLinecap="round" fill="none" />
                <circle cx="163" cy="232" r="7.5" fill="#a78bfa" />
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
              </g>
            )}

            {/* Role Equipment */}
            {selectedRole === "admin" && (
              <g>
                <path d="M192 92 L182 62 L202 75 L217 50 L233 75 L253 62 L243 92 Z" fill="url(#crownGrad)" stroke="#d97706" strokeWidth="2" filter="url(#handShadow)" />
                <rect x="188" y="90" width="60" height="7" rx="3.5" fill="#f59e0b" />
                <circle cx="217" cy="65" r="4.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                <circle cx="187" cy="74" r="3.5" fill="#3b82f6" />
                <circle cx="248" cy="74" r="3.5" fill="#10b981" />
              </g>
            )}
            {selectedRole === "manager" && (
              <g>
                <rect x="190" y="136" width="23" height="18" rx="4" fill="none" stroke="#0f172a" strokeWidth="3" />
                <rect x="223" y="136" width="23" height="18" rx="4" fill="none" stroke="#0f172a" strokeWidth="3" />
                <path d="M213 144 H223" stroke="#0f172a" strokeWidth="3" />
                <path d="M190 144 L175 140" stroke="#0f172a" strokeWidth="2.5" />
                <path d="M246 144 L260 140" stroke="#0f172a" strokeWidth="2.5" />
                <path d="M208 190 L218 196 L228 190" stroke="#ffffff" strokeWidth="3" fill="none" />
                <polygon points="214,196 222,196 224,235 218,242 212,235" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
              </g>
            )}
            {selectedRole === "supervisor" && (
              <g>
                <path d="M185 96 C185 64 250 64 250 96 Z" fill="url(#hardhatGrad)" stroke="#ca8a04" strokeWidth="2" filter="url(#handShadow)" />
                <path d="M176 96 C176 93 258 93 258 96 H176 Z" stroke="#ca8a04" strokeWidth="3.5" fill="#eab308" />
                <rect x="211" y="76" width="13" height="11" rx="2" fill="#ffffff" />
                <path d="M217 78 V85 M214 81 H221" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                <path d="M178 195 Q218 200 258 195 L258 245 Q218 250 178 245 Z" fill="#f97316" opacity="0.9" />
                <line x1="184" y1="208" x2="252" y2="208" stroke="#ffffff" strokeWidth="3.5" strokeDasharray="4 2" />
                <line x1="184" y1="230" x2="252" y2="230" stroke="#ffffff" strokeWidth="3.5" strokeDasharray="4 2" />
              </g>
            )}
            {selectedRole === "employee" && (
              <g>
                <path d="M175 145 C175 75 260 75 260 145" stroke="#334155" strokeWidth="5.5" fill="none" />
                <rect x="167" y="132" width="10" height="26" rx="5" fill="#0f172a" />
                <rect x="258" y="132" width="10" height="26" rx="5" fill="#0f172a" />
                <path d="M204 188 L218 232 L232 188" stroke="#3b82f6" strokeWidth="3" fill="none" />
                <rect x="210" y="232" width="16" height="22" rx="2.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" filter="url(#handShadow)" />
                <rect x="213" y="235" width="10" height="8" rx="1" fill="#38bdf8" />
              </g>
            )}

            {/* PURPLE EYES */}
            <g>
              {/* Left Eye */}
              <ellipse cx="202" cy="146" rx="12" ry="14" fill="#ffffff" />
              <motion.g
                animate={{ x: pOffset.x, y: pOffset.y }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <circle cx="202" cy="146" r="6.2" fill="#0f172a" />
                <circle cx="204.2" cy="143.8" r="2.2" fill="#ffffff" />
              </motion.g>

              {/* Right Eye */}
              <ellipse cx="234" cy="146" rx="12" ry="14" fill="#ffffff" />
              <motion.g
                animate={{ x: pOffset.x, y: pOffset.y }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <circle cx="234" cy="146" r="6.2" fill="#0f172a" />
                <circle cx="236.2" cy="143.8" r="2.2" fill="#ffffff" />
              </motion.g>

              {/* Blink */}
              {blink && !isPassword && (
                <>
                  <rect x="188" y="131" width="28" height="30" rx="4" fill="url(#purpleGrad)" />
                  <rect x="220" y="131" width="28" height="30" rx="4" fill="url(#purpleGrad)" />
                </>
              )}
            </g>

            {/* PURPLE MOUTH */}
            <g>
              {isSuccess ? (
                <path d="M205 174 Q218 194 231 174 Z" fill="#ffffff" stroke="#e11d48" strokeWidth="1.5" />
              ) : isPassword ? (
                showPassword ? (
                  // Mischievous smirk when peeking!
                  <path d="M208 175 Q218 184 228 175" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
                ) : (
                  // Shy "o" mouth
                  <ellipse cx="218" cy="177" rx="5" ry="6" fill="#0f172a" />
                )
              ) : isEmail ? (
                <motion.path
                  d="M208 175 Q218 183 228 175"
                  stroke="#0f172a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  animate={{ d: ["M208 175 Q218 183 228 175", "M208 177 Q218 173 228 177", "M208 175 Q218 183 228 175"] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              ) : (
                <path d="M208 174 Q218 184 228 174" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" fill="none" />
              )}
            </g>
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
                : isEmail
                ? { x: 6 }
                : { y: 0, x: 0 }
            }
            transition={{ duration: 0.4 }}
          >
            <rect
              x="250"
              y="172"
              width="68"
              height="142"
              rx="34"
              fill="url(#pinkGrad)"
              filter="url(#botShadow)"
            />

            {/* Cheeks */}
            <circle cx="266" cy="220" r="4.5" fill="#fda4af" opacity="0.6" />
            <circle cx="302" cy="220" r="4.5" fill="#fda4af" opacity="0.6" />

            {/* PINK EYES */}
            <g>
              <ellipse cx="274" cy="208" rx="8.5" ry="10" fill="#ffffff" />
              <motion.g
                animate={{ x: pOffsetSmall.x, y: pOffsetSmall.y }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <circle cx="274" cy="208" r="4.5" fill="#0f172a" />
                <circle cx="275.6" cy="206.4" r="1.6" fill="#ffffff" />
              </motion.g>

              <ellipse cx="294" cy="208" rx="8.5" ry="10" fill="#ffffff" />
              <motion.g
                animate={{ x: pOffsetSmall.x, y: pOffsetSmall.y }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <circle cx="294" cy="208" r="4.5" fill="#0f172a" />
                <circle cx="295.6" cy="206.4" r="1.6" fill="#ffffff" />
              </motion.g>
            </g>

            {/* Mouth */}
            {isPassword ? (
              showPassword ? (
                // Happy smile when peeking!
                <path d="M280 227 Q285 233 290 227" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              ) : (
                <path d="M280 228 Q284 225 288 228" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
              )
            ) : (
              <path d="M278 226 Q284 232 290 226" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}

            {/* Idle Accessories */}
            {!isPassword && (
              <g>
                <path d="M250 240 Q244 260 256 268" stroke="#be123c" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="256" cy="268" r="5" fill="#fda4af" />
                <path d="M316 240 Q325 255 318 266" stroke="#be123c" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="318" cy="266" r="5" fill="#fda4af" />

                {selectedRole === "manager" && (
                  <g filter="url(#handShadow)">
                    <rect x="312" y="252" width="18" height="15" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <polyline points="314,263 318,258 322,260 327,255" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  </g>
                )}
                {selectedRole === "employee" && (
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
                : isEmail
                ? { x: 4 }
                : { y: 0, x: 0 }
            }
            transition={{ duration: 0.4 }}
          >
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

            {/* YELLOW EYES */}
            <g>
              <ellipse cx="356" cy="198" rx="8" ry="9" fill="#ffffff" />
              <motion.g
                animate={{ x: pOffsetSmall.x, y: pOffsetSmall.y }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <circle cx="356" cy="198" r="4.2" fill="#0f172a" />
                <circle cx="357.5" cy="196.5" r="1.5" fill="#ffffff" />
              </motion.g>

              <ellipse cx="386" cy="198" rx="8" ry="9" fill="#ffffff" />
              <motion.g
                animate={{ x: pOffsetSmall.x, y: pOffsetSmall.y }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <circle cx="386" cy="198" r="4.2" fill="#0f172a" />
                <circle cx="387.5" cy="196.5" r="1.5" fill="#ffffff" />
              </motion.g>
            </g>

            {/* Mouth */}
            {isPassword && showPassword ? (
              // Amused "o" when peeking!
              <circle cx="371" cy="222" r="3.5" fill="#0f172a" />
            ) : (
              <path d="M360 220 H382" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            )}

            {/* Idle Accessories */}
            {!isPassword && (
              <g>
                <path d="M334 235 Q326 250 336 260" stroke="#ca8a04" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="336" cy="260" r="5" fill="#fef08a" />
                <path d="M408 235 Q418 250 405 260" stroke="#ca8a04" strokeWidth="7" strokeLinecap="round" fill="none" />
                <circle cx="405" cy="260" r="5" fill="#fef08a" />

                {selectedRole === "manager" && (
                  <g filter="url(#handShadow)">
                    <rect x="402" y="246" width="13" height="17" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                    <rect x="403" y="252" width="11" height="6" fill="#047857" />
                    <path d="M405 242 Q408 238 411 242" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                  </g>
                )}
                {selectedRole === "supervisor" && (
                  <g filter="url(#handShadow)">
                    <rect x="398" y="244" width="17" height="22" rx="2" fill="#d97706" />
                    <rect x="401" y="247" width="11" height="16" fill="#ffffff" />
                    <path d="M403 252 L405 254 L409 250" stroke="#16a34a" strokeWidth="1.5" fill="none" />
                    <path d="M403 258 L405 260 L409 256" stroke="#16a34a" strokeWidth="1.5" fill="none" />
                  </g>
                )}
                {selectedRole === "employee" && (
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
                : isEmail
                ? { x: 5 }
                : { y: 0, x: 0 }
            }
            transition={{ duration: 0.4 }}
          >
            <path d="M85 305 C85 200 235 200 235 305 Z" fill="url(#orangeGrad)" filter="url(#botShadow)" />

            {/* Cheeks */}
            <circle cx="132" cy="265" r="7" fill="#f43f5e" opacity="0.3" />
            <circle cx="188" cy="265" r="7" fill="#f43f5e" opacity="0.3" />

            {/* ORANGE EYES */}
            <g>
              <ellipse cx="146" cy="245" rx="8.5" ry="10" fill="#ffffff" />
              <motion.g
                animate={{ x: pOffset.x * 0.9, y: pOffset.y * 0.9 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <circle cx="146" cy="245" r="4.5" fill="#0f172a" />
                <circle cx="147.6" cy="243.4" r="1.6" fill="#ffffff" />
              </motion.g>

              <ellipse cx="174" cy="245" rx="8.5" ry="10" fill="#ffffff" />
              <motion.g
                animate={{ x: pOffset.x * 0.9, y: pOffset.y * 0.9 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <circle cx="174" cy="245" r="4.5" fill="#0f172a" />
                <circle cx="175.6" cy="243.4" r="1.6" fill="#ffffff" />
              </motion.g>
            </g>

            {/* Mouth */}
            {isSuccess ? (
              <path d="M150 262 Q160 280 170 262 Z" fill="#ffffff" stroke="#c2410c" strokeWidth="1.5" />
            ) : isPassword ? (
              showPassword ? (
                // Happy smile when peeking!
                <path d="M152 265 Q160 274 168 265" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              ) : (
                <circle cx="160" cy="268" r="4" fill="#0f172a" />
              )
            ) : (
              <g>
                <path d="M150 264 Q160 276 170 264 Z" fill="#0f172a" />
                <path d="M155 270 Q160 276 165 270" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* Idle Paws */}
            {!isPassword && (
              <g>
                <ellipse cx="125" cy="295" rx="10" ry="8" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" filter="url(#handShadow)" />
                <ellipse cx="195" cy="295" rx="10" ry="8" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" filter="url(#handShadow)" />
              </g>
            )}

            {/* Accessories */}
            {selectedRole === "admin" && (
              <polygon points="152,216 160,205 168,216 174,208 160,224" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            )}
            {selectedRole === "supervisor" && (
              <path d="M148 222 Q160 212 172 222 Z" fill="#eab308" stroke="#a16207" strokeWidth="1" />
            )}
            {selectedRole === "manager" && (
              <polygon points="154,280 166,280 160,277" fill="#ef4444" />
            )}
          </motion.g>

          {/* ============================================================
              MASTER PRIVACY HANDS OVERLAY - ALL 4 BOTS SNEAK PEEK!
              ============================================================ */}
          <AnimatePresence>
            {isPassword && (
              <motion.g
                key="masterHands"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {/* 1. PURPLE LEADER HANDS */}
                {/* Purple Left Hand: Always firmly covering Left Eye (cx: 202, cy: 146) */}
                <g>
                  <path d="M168 200 Q182 170 198 148" stroke="#6d28d9" strokeWidth="12" strokeLinecap="round" fill="none" />
                  <g filter="url(#handShadow)">
                    <ellipse cx="202" cy="146" rx="16" ry="17" fill="url(#purpleHandGrad)" stroke="#7c3aed" strokeWidth="1.5" />
                    <rect x="190" y="132" width="5.5" height="14" rx="2.75" fill="#ffffff" stroke="#a78bfa" strokeWidth="1" />
                    <rect x="197" y="130" width="5.5" height="16" rx="2.75" fill="#ffffff" stroke="#a78bfa" strokeWidth="1" />
                    <rect x="204" y="131" width="5.5" height="15" rx="2.75" fill="#ffffff" stroke="#a78bfa" strokeWidth="1" />
                    <rect x="211" y="134" width="5" height="12" rx="2.5" fill="#ffffff" stroke="#a78bfa" strokeWidth="1" />
                  </g>
                </g>

                {/* Purple Right Hand: Firmly covers Right Eye (cx: 234, cy: 146) OR Slides to Cheek to PEEK! */}
                <motion.g
                  animate={
                    showPassword
                      ? { y: 34, x: 6 } // PEEK MODE: Right hand slides down to cheek, uncovering right eye!
                      : { y: 0, x: 0 }  // FULL PRIVACY: Right hand firmly covers right eye!
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                  <path
                    d="M260 200 Q246 170 234 148"
                    stroke="#6d28d9"
                    strokeWidth="12"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <g filter="url(#handShadow)">
                    <ellipse cx="234" cy="146" rx="16" ry="17" fill="url(#purpleHandGrad)" stroke="#7c3aed" strokeWidth="1.5" />
                    <rect x="222" y="132" width="5.5" height="14" rx="2.75" fill="#ffffff" stroke="#a78bfa" strokeWidth="1" />
                    <rect x="229" y="130" width="5.5" height="16" rx="2.75" fill="#ffffff" stroke="#a78bfa" strokeWidth="1" />
                    <rect x="236" y="131" width="5.5" height="15" rx="2.75" fill="#ffffff" stroke="#a78bfa" strokeWidth="1" />
                    <rect x="243" y="134" width="5" height="12" rx="2.5" fill="#ffffff" stroke="#a78bfa" strokeWidth="1" />
                  </g>
                </motion.g>

                {/* 2. PINK BOT HANDS */}
                {/* Pink Left Hand: Always covers Pink's Left Eye (cx: 274, cy: 208) */}
                <g>
                  <path d="M252 245 Q258 220 272 210" stroke="#be123c" strokeWidth="9" strokeLinecap="round" fill="none" />
                  <g filter="url(#handShadow)">
                    <ellipse cx="274" cy="208" rx="12" ry="13" fill="url(#pinkHandGrad)" stroke="#e11d48" strokeWidth="1.5" />
                    <circle cx="269" cy="200" r="3" fill="#ffffff" />
                    <circle cx="274" cy="198" r="3.2" fill="#ffffff" />
                    <circle cx="279" cy="200" r="3" fill="#ffffff" />
                  </g>
                </g>

                {/* Pink Right Hand: Firmly covers Right Eye (cx: 294, cy: 208) OR Slides to Cheek to PEEK! */}
                <motion.g
                  animate={
                    showPassword
                      ? { y: 24, x: 5 } // PEEK MODE: Right hand slides down to cheek, uncovering Pink's right eye!
                      : { y: 0, x: 0 }  // FULL PRIVACY: Covers right eye!
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                  <path d="M316 245 Q310 220 296 210" stroke="#be123c" strokeWidth="9" strokeLinecap="round" fill="none" />
                  <g filter="url(#handShadow)">
                    <ellipse cx="294" cy="208" rx="12" ry="13" fill="url(#pinkHandGrad)" stroke="#e11d48" strokeWidth="1.5" />
                    <circle cx="289" cy="200" r="3" fill="#ffffff" />
                    <circle cx="294" cy="198" r="3.2" fill="#ffffff" />
                    <circle cx="299" cy="200" r="3" fill="#ffffff" />
                  </g>
                </motion.g>

                {/* 3. YELLOW BOT HANDS */}
                {/* Yellow Left Hand: Always covers Yellow's Left Eye (cx: 356, cy: 198) */}
                <g>
                  <path d="M336 245 Q342 215 354 200" stroke="#ca8a04" strokeWidth="9" strokeLinecap="round" fill="none" />
                  <g filter="url(#handShadow)">
                    <ellipse cx="356" cy="198" rx="13" ry="14" fill="url(#yellowHandGrad)" stroke="#ca8a04" strokeWidth="1.5" />
                    <rect x="349" y="186" width="4.5" height="10" rx="2.25" fill="#ffffff" stroke="#eab308" strokeWidth="0.8" />
                    <rect x="355" y="184" width="4.5" height="12" rx="2.25" fill="#ffffff" stroke="#eab308" strokeWidth="0.8" />
                    <rect x="361" y="186" width="4.5" height="10" rx="2.25" fill="#ffffff" stroke="#eab308" strokeWidth="0.8" />
                  </g>
                </g>

                {/* Yellow Right Hand: Firmly covers Right Eye (cx: 386, cy: 198) OR Slides to Cheek to PEEK! */}
                <motion.g
                  animate={
                    showPassword
                      ? { y: 24, x: 5 } // PEEK MODE: Right hand slides down to cheek, uncovering Yellow's right eye!
                      : { y: 0, x: 0 }  // FULL PRIVACY: Covers right eye!
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                  <path d="M406 245 Q398 215 388 200" stroke="#ca8a04" strokeWidth="9" strokeLinecap="round" fill="none" />
                  <g filter="url(#handShadow)">
                    <ellipse cx="386" cy="198" rx="13" ry="14" fill="url(#yellowHandGrad)" stroke="#ca8a04" strokeWidth="1.5" />
                    <rect x="379" y="186" width="4.5" height="10" rx="2.25" fill="#ffffff" stroke="#eab308" strokeWidth="0.8" />
                    <rect x="385" y="184" width="4.5" height="12" rx="2.25" fill="#ffffff" stroke="#eab308" strokeWidth="0.8" />
                    <rect x="391" y="186" width="4.5" height="10" rx="2.25" fill="#ffffff" stroke="#eab308" strokeWidth="0.8" />
                  </g>
                </motion.g>

                {/* 4. ORANGE BLOB PAWS */}
                {/* Orange Left Paw: Always covers Orange's Left Eye (cx: 146, cy: 245) */}
                <g>
                  <path d="M118 285 Q130 260 144 248" stroke="#c2410c" strokeWidth="8" strokeLinecap="round" fill="none" />
                  <g filter="url(#handShadow)">
                    <ellipse cx="146" cy="245" rx="13" ry="14" fill="url(#orangeHandGrad)" stroke="#c2410c" strokeWidth="1.5" />
                    <circle cx="141" cy="238" r="3.2" fill="#ffffff" />
                    <circle cx="146" cy="235" r="3.5" fill="#ffffff" />
                    <circle cx="151" cy="238" r="3.2" fill="#ffffff" />
                  </g>
                </g>

                {/* Orange Right Paw: Firmly covers Right Eye (cx: 174, cy: 245) OR Slides to Cheek to PEEK! */}
                <motion.g
                  animate={
                    showPassword
                      ? { y: 20, x: 4 } // PEEK MODE: Right paw slides down to cheek, uncovering Orange's right eye!
                      : { y: 0, x: 0 }  // FULL PRIVACY: Covers right eye!
                  }
                  transition={{ type: "spring", stiffness: 420, damping: 26 }}
                >
                  <path d="M202 285 Q190 260 176 248" stroke="#c2410c" strokeWidth="8" strokeLinecap="round" fill="none" />
                  <g filter="url(#handShadow)">
                    <ellipse cx="174" cy="245" rx="13" ry="14" fill="url(#orangeHandGrad)" stroke="#c2410c" strokeWidth="1.5" />
                    <circle cx="169" cy="238" r="3.2" fill="#ffffff" />
                    <circle cx="174" cy="235" r="3.5" fill="#ffffff" />
                    <circle cx="179" cy="238" r="3.2" fill="#ffffff" />
                  </g>
                </motion.g>
              </motion.g>
            )}
          </AnimatePresence>
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
                <strong className="text-primary">All 4 crew members peeking through their fingers!</strong>
              </>
            ) : (
              <>
                <span>🙈</span>
                <span>All 4 crew members covering eyes for your privacy...</span>
              </>
            )
          ) : isEmail ? (
            <>
              <span>📖</span>
              <span>Crew tracking your email typing: {Math.round(caretProgress * 100)}%</span>
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

export default CharacterStage;
