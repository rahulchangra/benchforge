"use client";

import React, { useRef, useEffect } from "react";

export function KineticWaveCanvas({
  className = "w-full h-full",
}: {
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse coordinates
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Motion parameters - Warm amber, solar orange, and golden embers
    let step = 0;
    const lines = [
      { color: "rgba(245, 158, 11, 0.5)", speed: 0.015, amplitude: 42, wavelength: 0.008 },
      { color: "rgba(249, 115, 22, 0.45)", speed: 0.02, amplitude: 52, wavelength: 0.006 },
      { color: "rgba(234, 179, 8, 0.35)", speed: 0.012, amplitude: 36, wavelength: 0.01 },
      { color: "rgba(251, 146, 60, 0.3)", speed: 0.018, amplitude: 60, wavelength: 0.005 },
    ];

    // Floating kinetic particles (Warm golden sparks & ember flares)
    const particleCount = 45;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      color: Math.random() > 0.5 ? "rgba(245, 158, 11, 0.65)" : "rgba(249, 115, 22, 0.65)",
    }));

    const render = () => {
      step++;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Draw undulating kinetic wave ribbons
      lines.forEach((line, index) => {
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 1.5;

        for (let x = 0; x <= width; x += 6) {
          // Distance to mouse for interactive ripple displacement
          const dx = x - mouse.x;
          const mouseDist = Math.max(0, 200 - Math.abs(dx));
          const mouseFactor = (mouseDist / 200) * 40 * Math.sin(step * 0.05);

          const y =
            height / 2 +
            Math.sin(x * line.wavelength + step * line.speed + index) * line.amplitude +
            Math.cos(x * 0.003 - step * 0.01) * 20 +
            mouseFactor;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Draw and update kinetic particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={`block ${className}`} />;
}
