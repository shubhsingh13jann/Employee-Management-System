import React, { useState } from "react";
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
 * RadialRevealTransition
 * 
 * 100% Coded Native React & Framer Motion Liquid Radial Reveal:
 * - Expands an organic liquid gradient circle from the exact clicked button coordinates (x, y)
 * - Uses hardware-accelerated CSS clip-path & fluid SVG gradient blobs
 * - Matches the exact Enterprise EMS theme: Deep Slate, Royal Indigo & Electric Violet
 * - Handles reverse contraction on Close / Back, shrinking directly back into the button
 */
export const RadialRevealTransition: React.FC<RadialRevealTransitionProps> = ({
  children,
  origin,
  onClose
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Default to top-right navbar position if accessed directly
  const originX = origin?.x ?? (typeof window !== "undefined" ? window.innerWidth - 80 : 800);
  const originY = origin?.y ?? 36;

  const handleTriggerClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    // Allow reverse animation to contract back into button before unmounting/navigating
    setTimeout(() => {
      onClose();
    }, 550);
  };

  return (
    <div className="radial-reveal-viewport">
      {/* Expanding Liquid Radial Mask */}
      <motion.div
        className="radial-reveal-container"
        initial={{
          clipPath: `circle(0px at ${originX}px ${originY}px)`
        }}
        animate={{
          clipPath: isClosing
            ? `circle(0px at ${originX}px ${originY}px)`
            : `circle(160vmax at ${originX}px ${originY}px)`
        }}
        transition={{
          duration: isClosing ? 0.55 : 0.75,
          ease: isClosing ? [0.4, 0, 0.2, 1] : [0.16, 1, 0.3, 1]
        }}
      >
        {/* Multi-Layered Liquid Theme Gradient & Organic Floating Blobs */}
        <div className="radial-reveal-backdrop">
          <div
            className="radial-blob radial-blob-1"
            style={{
              left: `${originX - 180}px`,
              top: `${originY - 180}px`
            }}
          />
          <div className="radial-blob radial-blob-2" />
          <div className="radial-blob radial-blob-3" />
          <div className="radial-reveal-mesh-grid" />
        </div>

        {/* Top Floating Close / Return Control */}
        <div className="radial-reveal-header">
          <button
            type="button"
            onClick={handleTriggerClose}
            className="radial-reveal-close-btn"
            title="Return to Home (Contract View)"
          >
            <span className="close-text">Back to Home</span>
            <div className="close-icon-circle">
              <i className="bi bi-x-lg"></i>
            </div>
          </button>
        </div>

        {/* Child Content (Auth Card) with Synchronized Float-In */}
        <motion.div
          className="radial-reveal-content"
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{
            opacity: isClosing ? 0 : 1,
            scale: isClosing ? 0.94 : 1,
            y: isClosing ? 16 : 0
          }}
          transition={{
            duration: isClosing ? 0.35 : 0.5,
            delay: isClosing ? 0 : 0.18,
            ease: [0.16, 1, 0.3, 1]
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RadialRevealTransition;

