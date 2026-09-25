import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue, MotionValue } from 'framer-motion';

export type FloatingPillProps = {
  id: string;
  iconClass: string;
  label: string;
  className: string;
};

type PillState = 'idle' | 'dragged' | 'anchored' | 'floating' | 'returning' | 'bouncing' | 'thrown';

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
        
        // AABB Collision Detection with NO padding so they repel exactly when borders touch
        const pad = -1; // -1 means they repel just 1px before perfectly touching
        const overlapX = (r1.right - pad) > (r2.left + pad) && (r1.left + pad) < (r2.right - pad);
        const overlapY = (r1.bottom - pad) > (r2.top + pad) && (r1.top + pad) < (r2.bottom - pad);
        
        if (overlapX && overlapY) {
          const pairId = p1.id < p2.id ? `${p1.id}-${p2.id}` : `${p2.id}-${p1.id}`;
          
          if (Date.now() - (collisionCooldowns.get(pairId) || 0) < 1000) {
            continue; 
          }
          collisionCooldowns.set(pairId, Date.now());
          
          const c1x = r1.left + r1.width / 2;
          const c1y = r1.top + r1.height / 2;
          const c2x = r2.left + r2.width / 2;
          const c2y = r2.top + r2.height / 2;
          
          let dx = c2x - c1x;
          let dy = c2y - c1y;
          if (dx === 0 && dy === 0) { dx = 1; dy = 1; } 
          
          const dist = Math.sqrt(dx * dx + dy * dy);
          dx /= dist;
          dy /= dist;
          
          p1.triggerBounce(-dx, -dy);
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
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Core movement behaviors
  const resumeHover = () => {
    if (state === 'idle') {
      controls.start({ y: [0, -8, 0], transition: { duration: 7, repeat: Infinity, ease: "easeInOut" } });
    } else if (state === 'anchored') {
      const cy = y.get();
      controls.start({ y: [cy, cy - 8, cy], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } });
    }
  };

  const returnHome = () => {
    const dist = Math.sqrt(Math.pow(x.get(), 2) + Math.pow(y.get(), 2));
    const duration = Math.max(8, Math.min(18, dist / 40)); 
    controls.start({
      x: 0,
      y: 0,
      transition: { x: { duration: duration * 1.1, ease: "easeInOut" }, y: { duration: duration * 0.9, ease: "easeInOut" } }
    }).then(() => {
      // Only set idle if we haven't been dragged again
      if (pillRef.current?.getAttribute('data-state') === 'returning') {
        setState('idle');
      }
    });
  };

  const getRandomSafeCoords = () => {
    if (!pillRef.current) return { x: 0, y: 0 };
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const rect = pillRef.current.getBoundingClientRect();
    const absHomeX = rect.left - x.get();
    const absHomeY = rect.top - y.get();
    
    let targetAbsX = 0; let targetAbsY = 0;
    for (let i = 0; i < 50; i++) {
      targetAbsX = Math.random() * (screenW - 150);
      targetAbsY = Math.random() * (screenH - 50);
      const inLogoZone = targetAbsX < 350 && targetAbsY < 120;
      const inCardZone = targetAbsX > (screenW / 2 - 450) && targetAbsX < (screenW / 2 + 450) && targetAbsY > (screenH / 2 - 350) && targetAbsY < (screenH / 2 + 350);
      if (!inLogoZone && !inCardZone) break;
    }
    return { x: targetAbsX - absHomeX, y: targetAbsY - absHomeY };
  };

  const goToNextPoint = () => {
    if (pillRef.current?.getAttribute('data-state') !== 'floating') return;
    const nextPos = getRandomSafeCoords();
    const dist = Math.sqrt(Math.pow(nextPos.x - x.get(), 2) + Math.pow(nextPos.y - y.get(), 2));
    const baseDuration = Math.max(10, Math.min(25, dist / 30));
    
    controls.start({
      x: nextPos.x,
      y: nextPos.y,
      transition: { 
        x: { duration: baseDuration * (0.85 + Math.random() * 0.3), ease: "easeInOut" },
        y: { duration: baseDuration * (0.85 + Math.random() * 0.3), ease: "easeInOut" }
      }
    }).then(() => {
      // Once reached, if still floating, go to another point
      if (pillRef.current?.getAttribute('data-state') === 'floating') {
        goToNextPoint();
      }
    });
  };

  const triggerBounceRef = useRef((nx: number, ny: number) => {});
  triggerBounceRef.current = async (nx: number, ny: number) => {
    const currentState = pillRef.current?.getAttribute('data-state');
    if (currentState === 'dragged' || currentState === 'bouncing') return;
    
    controls.stop();
    const currentX = x.get();
    const currentY = y.get();
    
    await controls.start({
      x: currentX + nx * 45,
      y: currentY + ny * 45,
      transition: { duration: 2.5, ease: "easeOut" }
    });
    
    // Resume previous behavior
    if (currentState === 'floating' || currentState === 'thrown') goToNextPoint();
    else if (currentState === 'returning') returnHome();
    else if (currentState === 'idle' || currentState === 'anchored') resumeHover();
  };

  useEffect(() => {
    pillRegistry.set(id, { id, element: pillRef.current!, x, y, triggerBounce: (nx, ny) => triggerBounceRef.current(nx, ny) });
    startCollisionLoop();
    return () => {
      pillRegistry.delete(id);
      if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    };
  }, [id, x, y]);

  // State Machine Driver
  useEffect(() => {
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);

    if (state === 'idle' || state === 'anchored') {
      resumeHover();
      if (state === 'anchored') {
        // Wait 5-10s before floating
        stateTimerRef.current = setTimeout(() => setState('floating'), Math.random() * 5000 + 5000);
      }
    } else if (state === 'floating') {
      goToNextPoint();
      // Float around for 25-35 seconds, then return home!
      stateTimerRef.current = setTimeout(() => setState('returning'), Math.random() * 10000 + 25000);
    } else if (state === 'returning') {
      returnHome();
    }
  }, [state]);

  const handleDragStart = () => {
    setState('dragged');
    controls.stop(); 
  };

  const handleDragEnd = (e: any, info: any) => {
    const vx = info.velocity.x;
    const vy = info.velocity.y;
    const speed = Math.sqrt(vx * vx + vy * vy);
    
    // Clear timers
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
    
    if (speed > 150) {
      // User threw it!
      setState('thrown');
      controls.stop();
      
      const currentX = x.get();
      const currentY = y.get();
      
      // Calculate a friction-decay slide distance
      const dist = Math.min(speed * 0.4, 600); // Throw up to 600px
      const nx = vx / speed;
      const ny = vy / speed;
      
      let targetX = currentX + nx * dist;
      let targetY = currentY + ny * dist;
      
      // Clamp exactly to screen bounds so it doesn't get lost
      if (pillRef.current) {
        const rect = pillRef.current.getBoundingClientRect();
        const absHomeX = rect.left - currentX;
        const absHomeY = rect.top - currentY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        let absTargetX = absHomeX + targetX;
        let absTargetY = absHomeY + targetY;
        
        absTargetX = Math.max(20, Math.min(absTargetX, screenW - 150));
        absTargetY = Math.max(20, Math.min(absTargetY, screenH - 60));
        
        targetX = absTargetX - absHomeX;
        targetY = absTargetY - absHomeY;
      }
      
      // Calculate true duration based on clamped distance
      const finalDist = Math.sqrt(Math.pow(targetX - currentX, 2) + Math.pow(targetY - currentY, 2));
      const duration = Math.max(0.8, Math.min(2.5, finalDist / 250));
      
      controls.start({
        x: targetX,
        y: targetY,
        transition: { duration, ease: "easeOut" } // Slide like ice
      }).then(() => {
        // After sliding, it enters the floating cycle seamlessly
        if (pillRef.current?.getAttribute('data-state') === 'thrown') {
          setState('floating');
        }
      });
    } else {
      setState('anchored');
    }
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
        x, y,
        cursor: state === 'dragged' ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        zIndex: state === 'dragged' || state === 'anchored' || state === 'floating' ? 50 : 5
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="label-icon"><i className={iconClass}></i></span>
      <span>{label}</span>
    </motion.div>
  );
};
