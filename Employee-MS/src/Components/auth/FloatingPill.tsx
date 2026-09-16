import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export type FloatingPillProps = {
  id: string;
  iconClass: string;
  label: string;
  className: string;
};

type PillState = 'idle' | 'dragged' | 'anchored' | 'floating' | 'returning';

export const FloatingPill: React.FC<FloatingPillProps> = ({
  id,
  iconClass,
  label,
  className,
}) => {
  const [state, setState] = useState<PillState>('idle');
  const controls = useAnimation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const floatLoopRef = useRef<NodeJS.Timeout | null>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const homePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Record initial absolute position so we know where "home" is relative to the screen
    if (pillRef.current) {
      const rect = pillRef.current.getBoundingClientRect();
      homePos.current = { x: rect.left, y: rect.top };
    }
    
    // Idle animation: simple hover float (simulating the original CSS animation)
    if (state === 'idle') {
      controls.start({
        y: [0, -8, 0],
        transition: {
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }
      });
    }
  }, [state, controls]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (floatLoopRef.current) clearTimeout(floatLoopRef.current);
    };
  }, []);

  const getRandomSafeCoords = () => {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    
    // Define No-Go Zones (approximate based on standard layout)
    // Logo: Top Left (~ 0 to 300px X, 0 to 100px Y)
    // Card: Center/Right (assuming it's on the right half or center)
    // Let's create a safe zone logic
    
    let safe = false;
    let targetAbsX = 0;
    let targetAbsY = 0;
    
    // Try up to 50 times to find a safe coordinate
    for (let i = 0; i < 50; i++) {
      targetAbsX = Math.random() * (screenW - 150); // 150px padding for pill width
      targetAbsY = Math.random() * (screenH - 50); // 50px padding for pill height
      
      const inLogoZone = targetAbsX < 350 && targetAbsY < 120;
      // Assume Auth Card is roughly center to right, let's say width 450px, height 600px
      // For safety, let's just avoid the middle-right area
      const inCardZone = targetAbsX > (screenW / 2 - 100) && targetAbsX < (screenW - 50) && targetAbsY > (screenH / 2 - 350) && targetAbsY < (screenH / 2 + 350);
      
      if (!inLogoZone && !inCardZone) {
        safe = true;
        break;
      }
    }
    
    // Convert absolute target to relative (framer-motion x/y are relative to initial layout position)
    const relX = targetAbsX - homePos.current.x;
    const relY = targetAbsY - homePos.current.y;
    
    return { x: relX, y: relY };
  };

  const floatAround = async () => {
    // 3 to 5 random jumps around the screen
    const jumps = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < jumps; i++) {
      // If state changed (e.g. user grabbed it again), abort
      if (pillRef.current?.getAttribute('data-state') !== 'floating') return;
      
      const nextPos = getRandomSafeCoords();
      await controls.start({
        x: nextPos.x,
        y: nextPos.y,
        transition: { duration: Math.random() * 4 + 4, ease: "easeInOut" } // 4 to 8 seconds per move
      });
    }
    
    // After floating, return home
    setState('returning');
  };

  useEffect(() => {
    if (state === 'floating') {
      floatAround();
    } else if (state === 'returning') {
      controls.start({
        x: 0,
        y: 0,
        transition: { duration: 3, ease: "easeInOut" }
      }).then(() => {
        setState('idle');
      });
    }
  }, [state]);

  const handleDragStart = () => {
    setState('dragged');
    if (timerRef.current) clearTimeout(timerRef.current);
    if (floatLoopRef.current) clearTimeout(floatLoopRef.current);
    controls.stop(); // Stop any current animations
  };

  const handleDragEnd = () => {
    setState('anchored');
    // Start the 5-10 second anchor timer
    const delay = Math.random() * 5000 + 5000;
    timerRef.current = setTimeout(() => {
      setState('floating');
    }, delay);
  };

  // We temporarily disable pointer-events in CSS, so we must override it inline to allow drag
  return (
    <motion.div
      ref={pillRef}
      className={`floating-label ${className}`}
      data-state={state}
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ 
        cursor: state === 'dragged' ? 'grabbing' : 'grab',
        pointerEvents: 'auto', // Override CSS pointer-events: none
        zIndex: state === 'dragged' || state === 'anchored' || state === 'floating' ? 50 : 5 // bring to front when active
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="label-icon">
        <i className={iconClass}></i>
      </span>
      <span>{label}</span>
    </motion.div>
  );
};
