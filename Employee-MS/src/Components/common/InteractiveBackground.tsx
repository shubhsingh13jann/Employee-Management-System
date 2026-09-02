import React, { useEffect, useRef } from "react";

const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse coordinates
    const mouse = {
      x: null,
      y: null,
      radius: 175
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const parent = canvas.parentElement;
    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseleave", handleMouseLeave);

    // Vibrant SaaS Color Palette
    const palette = [
      { r: 99, g: 102, b: 241 },  // Indigo (#6366f1)
      { r: 168, g: 85, b: 247 },  // Vibrant Violet (#a855f7)
      { r: 236, g: 72, b: 153 },  // Neon Pink (#ec4899)
      { r: 6, g: 182, b: 212 },   // Electric Cyan (#06b6d4)
      { r: 59, g: 130, b: 246 },  // Sky Blue (#3b82f6)
      { r: 16, g: 185, b: 129 }   // Emerald (#10b981)
    ];

    // Particles setup
    const particleCount = Math.min(Math.floor((width * height) / 14500), 65);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        color: color,
        vx: (Math.random() - 0.5) * 0.95,
        vy: (Math.random() - 0.5) * 0.95,
        connections: 0
      });
    }

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Update positions & reset connection counts
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.connections = 0;
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on canvas edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Mouse interaction (gentle attraction / flare)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            p.x -= Math.cos(angle) * force * 1.8;
            p.y -= Math.sin(angle) * force * 1.8;
          }
        }
      }

      // 2. Draw COLORFUL CONNECTING LINES & Count Junctions
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 145) {
            // Count junction connection
            p1.connections++;
            p2.connections++;

            const alpha = (1 - dist / 145) * 0.5; // Vibrant line visibility

            // Gradient line blending between the two node colors
            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            grad.addColorStop(0, `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${alpha})`);
            grad.addColorStop(1, `rgba(${p2.color.r}, ${p2.color.g}, ${p2.color.b}, ${alpha})`);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.4;
            ctx.stroke();
          }
        }

        // Connect to mouse with neon gradient lines
        if (mouse.x !== null && mouse.y !== null) {
          const mdx = p1.x - mouse.x;
          const mdy = p1.y - mouse.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

          if (mdist < mouse.radius) {
            p1.connections += 2; // Extra emphasis when connected to mouse

            const mAlpha = (1 - mdist / mouse.radius) * 0.75;
            const mouseGrad = ctx.createLinearGradient(p1.x, p1.y, mouse.x, mouse.y);
            mouseGrad.addColorStop(0, `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${mAlpha})`);
            mouseGrad.addColorStop(1, `rgba(168, 85, 247, ${mAlpha * 0.9})`);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = mouseGrad;
            ctx.lineWidth = 1.7;
            ctx.stroke();
          }
        }
      }

      // 3. HIGHLIGHT THE BULLETS WHERE THE POINTS ARE JOINED!
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // ONLY HIGHLIGHT BULLETS AT ACTIVE JOINED JUNCTIONS
        if (p.connections > 0) {
          const bulletRadius = Math.min(2.8 + p.connections * 0.35, 5.0);
          const glowColor = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;

          // Outer soft glow halo
          ctx.beginPath();
          ctx.arc(p.x, p.y, bulletRadius + 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.22)`;
          ctx.fill();

          // Main highlighted bullet with neon glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, bulletRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowColor;
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 12;
          ctx.fill();

          // Bright illuminated white center spark (crystalline bullet core)
          ctx.beginPath();
          ctx.arc(p.x, p.y, bulletRadius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="position-absolute top-0 start-0 w-100 h-100"
      style={{ zIndex: 0, pointerEvents: "none" }}
    />
  );
};

export default InteractiveBackground;
