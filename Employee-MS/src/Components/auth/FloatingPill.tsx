import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

export type FloatingPillProps = {
  id: string;
  iconClass: string;
  label: string;
  className: string;
  initialX?: number | string;
  initialY?: number | string;
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

  // We will build out the complex states in the next steps.
  // For now, let's just make it a draggable framer-motion component.

  const handleDragStart = () => {
    setState('dragged');
    if (timerRef.current) clearTimeout(timerRef.current);
    controls.stop();
  };

  const handleDragEnd = () => {
    setState('anchored');
    // Start the 5-10 second anchor timer
    const delay = Math.random() * 5000 + 5000; // 5 to 10 seconds
    timerRef.current = setTimeout(() => {
      setState('floating');
    }, delay);
  };

  return (
    <motion.div
      className={`floating-label ${className}`}
      drag
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ cursor: state === 'dragged' ? 'grabbing' : 'grab' }}
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
