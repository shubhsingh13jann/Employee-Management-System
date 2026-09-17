import React from 'react';
import './shooting-stars.css';

/**
 * A highly performant, CSS-only shooting star effect.
 * Uses 3 hardware-accelerated divs that cycle independently
 * to create a random meteor shower effect without JS overhead.
 */
export const ShootingStars: React.FC = () => {
  return (
    <div className="shooting-stars-container">
      <div className="shooting-star star-1"></div>
      <div className="shooting-star star-2"></div>
      <div className="shooting-star star-3"></div>
      <div className="shooting-star star-4"></div>
    </div>
  );
};

