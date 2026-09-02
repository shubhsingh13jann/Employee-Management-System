import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * CharacterStage - [Link 1 + Link 2 + Uploaded Image Composition]
 * 
 * Features:
 * - 4 Iconic Companion Bots: Purple Leader, Pink Column, Yellow Gumdrop, Orange Blob
 * - 360° Mouse Cursor Tracking across the entire screen
 * - Periodic natural eye blinking
 * - Real-time Caret Tracking (reading each letter typed into email)
 * - Privacy Reaction (hands cover eyes when password is focused)
 * - Peek Mode (lifts one hand to peek through fingers when password eye is toggled)
 * - Role-Adaptive Executive Badge (color switches with selected role)
 * - Celebratory and sympathetic feedback on auth result
 */
const CharacterStage = ({
  mousePos = { x: 0, y: 0 },
  activeField = null,
  caretProgress = 0,
  showPassword = false,
  selectedRole = 'admin',
  authStatus = 'idle'
}) => {
  // Blinking cycle
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Eye pupil offset calculation
  const getPupilOffset = (baseR = 4) => {
    if (activeField === 'email') {
      // Looking down-right at the email input caret
      return {
        x: 2 + caretProgress * 4.5,
        y: 2.5
      };
    }
    if (activeField === 'password') {
      if (showPassword) {
        // Peeking right at the revealed password!
        return { x: 5, y: 2 };
      }
      // Looking away / closed
      return { x: -3, y: -2 };
    }
    // Idle 360° mouse tracking
    return {
      x: Math.max(-baseR, Math.min(baseR, mousePos.x * baseR * 1.3)),
      y: Math.max(-baseR, Math.min(baseR, mousePos.y * baseR * 1.3))
    };
  };

  const purplePupils = getPupilOffset(4);
  const pinkPupils = getPupilOffset(3.5);
  const yellowPupil = getPupilOffset(3);
  const orangePupils = getPupilOffset(3.5);

  // Role Badge Configuration
  const roleBadgeColors = {
    admin: { bg: '#8b5cf6', label: 'HR ADMIN', icon: '👑' },
    manager: { bg: '#3b82f6', label: 'MANAGER', icon: '👔' },
    supervisor: { bg: '#10b981', label: 'SUPERVISOR', icon: '👷' },
    employee: { bg: '#f59e0b', label: 'EMPLOYEE', icon: '💼' }
  };
  const currentBadge = roleBadgeColors[selectedRole] || roleBadgeColors.admin;

  return (
    <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center position-relative">
      
      {/* Role Badge Indicator hanging above */}
      <motion.div
        key={selectedRole}
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 24 }}
        className="position-absolute top-0 start-50 translate-middle-x mt-3 px-3 py-1 rounded-pill shadow-xs d-flex align-items-center gap-1.5"
        style={{
          background: '#ffffff',
          border: `1.5px solid ${currentBadge.bg}`,
          zIndex: 20
        }}
      >
        <span style={{ fontSize: '11px' }}>{currentBadge.icon}</span>
        <span className="fw-bold" style={{ fontSize: '10px', color: currentBadge.bg, letterSpacing: '0.5px' }}>
          {currentBadge.label} ACCESS
        </span>
      </motion.div>

      {/* The Master SVG Character Rig */}
      <motion.svg
        viewBox="0 0 340 310"
        className="w-100"
        style={{ maxWidth: '380px', height: 'auto', overflow: 'visible' }}
        animate={
          authStatus === 'success'
            ? { y: [0, -14, 0] }
            : authStatus === 'error'
            ? { x: [-5, 5, -5, 5, 0] }
            : { y: 0, x: 0 }
        }
        transition={{ duration: 0.5 }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="40%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>

          <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="60%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>

          {/* Soft Clay Dropshadows */}
          <filter id="softShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#0f172a" floodOpacity="0.14" />
          </filter>
          
          <filter id="floorShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Ambient Ground Shadow */}
        <ellipse cx="170" cy="275" rx="145" ry="18" fill="#cbd5e1" filter="url(#floorShadow)" opacity="0.65" />

        {/* ============================================================
            1. PURPLE BOT (TALL LEADER)
            ============================================================ */}
        <motion.g
          animate={
            activeField === 'email'
              ? { rotate: 2.5, originX: '150px', originY: '240px' }
              : { rotate: 0 }
          }
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Main Body */}
          <rect
            x="108"
            y="60"
            width="84"
            height="185"
            rx="20"
            fill="url(#purpleGrad)"
            filter="url(#softShadow)"
          />

          {/* Executive Collar / Lapel Detail */}
          <path d="M136 185L150 205L164 185H136Z" fill="#ffffff" opacity="0.9" />
          <path d="M148 198L150 230L152 198H148Z" fill={currentBadge.bg} />

          {/* Face Area */}
          <g>
            {/* Left Eye */}
            <circle cx="138" cy="100" r="5" fill="#ffffff" />
            <motion.circle
              cx="138"
              cy="100"
              r="2.5"
              fill="#0f172a"
              animate={purplePupils}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            />

            {/* Right Eye */}
            <circle cx="162" cy="100" r="5" fill="#ffffff" />
            <motion.circle
              cx="162"
              cy="100"
              r="2.5"
              fill="#0f172a"
              animate={purplePupils}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            />

            {/* Eyelids (Blink & Password Hide) */}
            <motion.rect
              x="131"
              y="93"
              width="14"
              height="14"
              rx="2"
              fill="#7e22ce"
              initial={{ scaleY: 0 }}
              animate={
                isBlinking || (activeField === 'password' && !showPassword)
                  ? { scaleY: 1 }
                  : { scaleY: 0 }
              }
              style={{ transformOrigin: 'top center' }}
              transition={{ duration: 0.12 }}
            />
            <motion.rect
              x="155"
              y="93"
              width="14"
              height="14"
              rx="2"
              fill="#7e22ce"
              initial={{ scaleY: 0 }}
              animate={
                isBlinking || (activeField === 'password' && !showPassword)
                  ? { scaleY: 1 }
                  : { scaleY: 0 }
              }
              style={{ transformOrigin: 'top center' }}
              transition={{ duration: 0.12 }}
            />

            {/* Minimalist Vertical Nose */}
            <line x1="150" y1="102" x2="150" y2="114" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* ============================================================
              LINK 1: ANIMATED HANDS (COVER EYES / PEEK THROUGH FINGERS)
              ============================================================ */}
          {/* Left Hand */}
          <motion.g
            animate={
              activeField === 'password'
                ? { y: -58, x: 18, rotate: -15, opacity: 1 }
                : { y: 0, x: 0, rotate: 0, opacity: 0 }
            }
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            style={{ transformOrigin: '120px 160px' }}
          >
            {/* Left Arm & Glove Hand */}
            <rect x="116" y="152" width="18" height="26" rx="9" fill="#9333ea" stroke="#581c87" strokeWidth="1" />
            <circle cx="125" cy="154" r="7.5" fill="#a855f7" />
            <line x1="122" y1="150" x2="122" y2="157" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="125" y1="149" x2="125" y2="158" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="128" y1="150" x2="128" y2="157" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>

          {/* Right Hand (With Peek-through-fingers logic) */}
          <motion.g
            animate={
              activeField === 'password'
                ? showPassword
                  ? { y: -38, x: 4, rotate: 18, opacity: 1 } // Peek position! Hand lowers slightly
                  : { y: -58, x: -18, rotate: 15, opacity: 1 } // Covering eye completely!
                : { y: 0, x: 0, rotate: 0, opacity: 0 }
            }
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            style={{ transformOrigin: '180px 160px' }}
          >
            {/* Right Arm & Glove Hand */}
            <rect x="166" y="152" width="18" height="26" rx="9" fill="#9333ea" stroke="#581c87" strokeWidth="1" />
            <circle cx="175" cy="154" r="7.5" fill="#a855f7" />
            <line x1="172" y1="150" x2="172" y2="157" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="175" y1="149" x2="175" y2="158" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="178" y1="150" x2="178" y2="157" stroke="#7e22ce" strokeWidth="1.5" strokeLinecap="round" />
          </motion.g>
        </motion.g>

        {/* ============================================================
            2. PINK BOT (MID-HEIGHT COLUMN)
            ============================================================ */}
        <motion.g
          animate={
            activeField === 'password'
              ? { rotate: -8, originX: '215px', originY: '240px' }
              : activeField === 'email'
              ? { rotate: 4, originX: '215px', originY: '240px' }
              : { rotate: 0 }
          }
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <rect
            x="178"
            y="115"
            width="56"
            height="130"
            rx="16"
            fill="url(#pinkGrad)"
            filter="url(#softShadow)"
          />

          {/* Eyes */}
          <circle cx="208" cy="138" r="4.5" fill="#ffffff" />
          <motion.circle
            cx="208"
            cy="138"
            r="2.2"
            fill="#0f172a"
            animate={pinkPupils}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />

          <circle cx="222" cy="138" r="4.5" fill="#ffffff" />
          <motion.circle
            cx="222"
            cy="138"
            r="2.2"
            fill="#0f172a"
            animate={pinkPupils}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />

          {/* Eyelids */}
          <motion.rect
            x="202"
            y="132"
            width="12"
            height="12"
            rx="2"
            fill="#be123c"
            animate={isBlinking ? { scaleY: 1 } : { scaleY: 0 }}
            style={{ transformOrigin: 'top center' }}
            transition={{ duration: 0.12 }}
          />
          <motion.rect
            x="216"
            y="132"
            width="12"
            height="12"
            rx="2"
            fill="#be123c"
            animate={isBlinking ? { scaleY: 1 } : { scaleY: 0 }}
            style={{ transformOrigin: 'top center' }}
            transition={{ duration: 0.12 }}
          />
        </motion.g>

        {/* ============================================================
            3. YELLOW BOT (CURVED GUMDROP)
            ============================================================ */}
        <motion.g
          animate={
            activeField === 'password'
              ? { x: 4, rotate: 6, originX: '250px', originY: '250px' }
              : { x: 0, rotate: 0 }
          }
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        >
          {/* Gumdrop Arch */}
          <path
            d="M214 245V180C214 162 228 148 248 148C268 148 282 162 282 180V245H214Z"
            fill="url(#yellowGrad)"
            filter="url(#softShadow)"
          />

          {/* Single Dot Eye */}
          <circle cx="238" cy="172" r="3.8" fill="#0f172a" />
          <motion.circle
            cx="238"
            cy="172"
            r="1.8"
            fill="#ffffff"
            animate={yellowPupil}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />

          {/* Distinctive Horizontal Line Mouth */}
          <line x1="250" y1="182" x2="276" y2="182" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />

          {/* Blush circles in password mode */}
          {activeField === 'password' && (
            <circle cx="235" cy="184" r="4.5" fill="#f43f5e" opacity="0.4" />
          )}
        </motion.g>

        {/* ============================================================
            4. ORANGE BLOB (WIDE HAPPY BEAN)
            ============================================================ */}
        <motion.g
          animate={
            activeField === 'password'
              ? { y: 4, scaleY: 0.96 }
              : { y: 0, scaleY: 1 }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          style={{ transformOrigin: '115px 245px' }}
        >
          {/* Asymmetric Organic Blob */}
          <path
            d="M50 245C48 200 80 166 125 166C165 166 188 198 186 245H50Z"
            fill="url(#orangeGrad)"
            filter="url(#softShadow)"
          />

          {/* Left Eye */}
          <circle cx="118" cy="198" r="3.5" fill="#0f172a" />
          <motion.circle
            cx="118"
            cy="198"
            r="1.5"
            fill="#ffffff"
            animate={orangePupils}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />

          {/* Right Eye */}
          <circle cx="148" cy="190" r="3.5" fill="#0f172a" />
          <motion.circle
            cx="148"
            cy="190"
            r="1.5"
            fill="#ffffff"
            animate={orangePupils}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          />

          {/* Joyful Tilted Curved Smile */}
          <path
            d="M130 205C136 211 144 207 146 202"
            fill="none"
            stroke="#0f172a"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </motion.g>
      </motion.svg>

      {/* Interactive Micro Label */}
      <div className="text-center mt-2">
        <span className="text-muted fw-semibold" style={{ fontSize: '11px', letterSpacing: '0.3px' }}>
          {activeField === 'email' && '👀 Watching you enter your credentials...'}
          {activeField === 'password' && !showPassword && '🙈 Shh! Covering eyes for your privacy...'}
          {activeField === 'password' && showPassword && '🫣 Peeking through fingers!'}
          {!activeField && '✨ Move your cursor around to interact'}
        </span>
      </div>
    </div>
  );
};

export default CharacterStage;
