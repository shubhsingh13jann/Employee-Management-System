import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';

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
  
  // Track x and y explicitly so we can read their exact values at any time
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    // Idle animation: simple hover float 
    if (state === 'idle') {
      controls.start({
        y: [0, -8, 0],
        transition: { duration: 7, repeat: Infinity, ease: "easeInOut" }
      });
    } else if (state === 'anchored') {
      // In anchored state, we want a gentle hover around its CURRENT dragged position!
      // We read the current exact y, and animate around it so it doesn't "stick" motionless.
      const currentY = y.get();
      controls.start({
        y: [currentY, currentY - 8, currentY],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
      });
    }
  }, [state, controls, y]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (floatLoopRef.current) clearTimeout(floatLoopRef.current);
    };
  }, []);

  const getRandomSafeCoords = () => {
    if (!pillRef.current) return { x: 0, y: 0 };

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    
    // Calculate exact Home position based on current DOM rect and current transform
    const rect = pillRef.current.getBoundingClientRect();
    const currentX = x.get();
    const currentY = y.get();
    
    // The true CSS origin of the element (if transform was 0)
    const absoluteHomeX = rect.left - currentX;
    const absoluteHomeY = rect.top - currentY;
    
    let safe = false;
    let targetAbsX = 0;
    let targetAbsY = 0;
    
    // Try up to 50 times to find a safe coordinate
    for (let i = 0; i < 50; i++) {
      targetAbsX = Math.random() * (screenW - 150); // 150px padding for pill width
      targetAbsY = Math.random() * (screenH - 50); // 50px padding for pill height
      
      const inLogoZone = targetAbsX < 350 && targetAbsY < 120;
      // Card is roughly center right. Safe margin: avoid middle width
      const inCardZone = targetAbsX > (screenW / 2 - 450) && targetAbsX < (screenW / 2 + 450) && targetAbsY > (screenH / 2 - 350) && targetAbsY < (screenH / 2 + 350);
      
      if (!inLogoZone && !inCardZone) {
        safe = true;
        break;
      }
    }
    
    // Return relative coordinates needed to reach the target absolute position
    return { 
      x: targetAbsX - absoluteHomeX, 
      y: targetAbsY - absoluteHomeY 
    };
  };

  const floatAround = async () => {
    const jumps = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < jumps; i++) {
      if (pillRef.current?.getAttribute('data-state') !== 'floating') return;
      
      const nextPos = getRandomSafeCoords();
      await controls.start({
        x: nextPos.x,
        y: nextPos.y,
        transition: { duration: Math.random() * 4 + 4, ease: "easeInOut" }
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
    controls.stop(); 
  };

  const handleDragEnd = () => {
    setState('anchored');
    const delay = Math.random() * 5000 + 5000;
    timerRef.current = setTimeout(() => {
      setState('floating');
    }, delay);
  };

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
        x, // Bind x and y explicitly
        y,
        cursor: state === 'dragged' ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        zIndex: state === 'dragged' || state === 'anchored' || state === 'floating' ? 50 : 5
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
