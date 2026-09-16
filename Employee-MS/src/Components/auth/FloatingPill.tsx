import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue, MotionValue } from 'framer-motion';

export type FloatingPillProps = {
  id: string;
  iconClass: string;
  label: string;
  className: string;
};

type PillState = 'idle' | 'dragged' | 'anchored' | 'floating' | 'returning' | 'bouncing';

// ==========================================
// CENTRALIZED COLLISION PHYSICS
// ==========================================
type PillInstance = {
  id: string;
  element: HTMLDivElement;
  x: MotionValue<number>;
  y: MotionValue<number>;
  triggerBounce: (nx: number, ny: number) => void;
};

export const pillRegistry = new Map<string, PillInstance>();
const collisionCooldowns = new Map<string, number>();
let collisionLoopRunning = false;

const startCollisionLoop = () => {
  if (collisionLoopRunning) return;
  collisionLoopRunning = true;
  
  const loop = () => {
    const pills = Array.from(pillRegistry.values());
    
    for (let i = 0; i < pills.length; i++) {
      for (let j = i + 1; j < pills.length; j++) {
        const p1 = pills[i];
        const p2 = pills[j];
        
        if (!p1.element || !p2.element) continue;
        
        const r1 = p1.element.getBoundingClientRect();
        const r2 = p2.element.getBoundingClientRect();
        
        // AABB Collision Detection with a tiny padding (so they physically look like they are touching)
        const pad = 8;
        const overlapX = (r1.right - pad) > (r2.left + pad) && (r1.left + pad) < (r2.right - pad);
        const overlapY = (r1.bottom - pad) > (r2.top + pad) && (r1.top + pad) < (r2.bottom - pad);
        
        if (overlapX && overlapY) {
          const pairId = p1.id < p2.id ? `${p1.id}-${p2.id}` : `${p2.id}-${p1.id}`;
          
          // Enforce a 1-second cooldown per pair to prevent infinite jittering
          if (Date.now() - (collisionCooldowns.get(pairId) || 0) < 1000) {
            continue; 
          }
          collisionCooldowns.set(pairId, Date.now());
          
          // Calculate center points to find the collision normal vector
          const c1x = r1.left + r1.width / 2;
          const c1y = r1.top + r1.height / 2;
          const c2x = r2.left + r2.width / 2;
          const c2y = r2.top + r2.height / 2;
          
          let dx = c2x - c1x;
          let dy = c2y - c1y;
          
          if (dx === 0 && dy === 0) { dx = 1; dy = 1; } // fallback if perfectly overlapping
          
          const dist = Math.sqrt(dx * dx + dy * dy);
          dx /= dist;
          dy /= dist;
          
          // p1 bounces away from p2 (negative direction)
          p1.triggerBounce(-dx, -dy);
          // p2 bounces away from p1 (positive direction)
          p2.triggerBounce(dx, dy);
        }
      }
    }
    
    if (pillRegistry.size > 0) {
      requestAnimationFrame(loop);
    } else {
      collisionLoopRunning = false;
    }
  };
  
  requestAnimationFrame(loop);
};
// ==========================================

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

  // Use a ref to always have the latest state without triggering re-renders in the registry
  const triggerBounceRef = useRef((nx: number, ny: number) => {});

  triggerBounceRef.current = async (nx: number, ny: number) => {
    // If the user is currently holding/dragging THIS pill, DO NOT bounce it!
    // It should have "infinite mass" while held. The OTHER pill will bounce away.
    const currentState = pillRef.current?.getAttribute('data-state');
    if (currentState === 'dragged' || currentState === 'bouncing') return;
    
    // Stop whatever it was doing (floating, returning, etc)
    controls.stop();
    setState('bouncing');
    if (timerRef.current) clearTimeout(timerRef.current);
    if (floatLoopRef.current) clearTimeout(floatLoopRef.current);
    
    const currentX = x.get();
    const currentY = y.get();
    
    // Watery bounce: Gentle, slow push away (like two bubbles touching)
    await controls.start({
      x: currentX + nx * 45,
      y: currentY + ny * 45,
      transition: { 
        duration: 2.5, 
        ease: "easeOut" // Start with a bump, but glide to a halt slowly as if in water
      }
    });
    
    // After bouncing, resume floating
    setState('floating');
  };

  useEffect(() => {
    // Register this pill for global collision detection
    pillRegistry.set(id, {
      id,
      element: pillRef.current!,
      x,
      y,
      triggerBounce: (nx, ny) => triggerBounceRef.current(nx, ny)
    });
    
    startCollisionLoop();
    
    return () => {
      pillRegistry.delete(id);
    };
  }, [id, x, y]);

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
    // 3 to 5 jumps
    const jumps = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < jumps; i++) {
      // If state changed (e.g. user grabbed it again), abort
      if (pillRef.current?.getAttribute('data-state') !== 'floating') return;
      
      const nextPos = getRandomSafeCoords();
      
      // Calculate pixel distance to the next point
      const currentX = x.get();
      const currentY = y.get();
      const dist = Math.sqrt(Math.pow(nextPos.x - currentX, 2) + Math.pow(nextPos.y - currentY, 2));
      
      // Calculate a very slow, organic duration (roughly 30px per second)
      // Clamped between 10s and 25s per jump so it always feels graceful
      const baseDuration = Math.max(10, Math.min(25, dist / 30));
      
      // MAGIC TRICK: Desync X and Y durations slightly.
      // By making X and Y arrive at slightly different times, Framer Motion
      // draws a beautiful, organic curved arc instead of a rigid straight diagonal line!
      const durationX = baseDuration * (0.85 + Math.random() * 0.3);
      const durationY = baseDuration * (0.85 + Math.random() * 0.3);

      await controls.start({
        x: nextPos.x,
        y: nextPos.y,
        transition: { 
          x: { duration: durationX, ease: "easeInOut" },
          y: { duration: durationY, ease: "easeInOut" }
        }
      });
    }
    
    // After floating, return home
    setState('returning');
  };

  useEffect(() => {
    if (state === 'floating') {
      floatAround();
    } else if (state === 'returning') {
      // Slow, sweeping curved return home
      const dist = Math.sqrt(Math.pow(x.get(), 2) + Math.pow(y.get(), 2));
      const duration = Math.max(8, Math.min(18, dist / 40)); 
      
      controls.start({
        x: 0,
        y: 0,
        transition: { 
          // Desync returning arcs too
          x: { duration: duration * 1.1, ease: "easeInOut" },
          y: { duration: duration * 0.9, ease: "easeInOut" }
        }
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
