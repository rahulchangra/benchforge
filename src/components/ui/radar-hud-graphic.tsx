"use client";

import React, { useRef, useEffect } from "react";

export function RadarHudGraphic({ className = "w-full h-full" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const size = Math.min(canvas.parentElement?.clientWidth || 300, 320);
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.42;

    let angle = 0;

    // Simulated benchmark repository blips
    const blips = [
      { r: radius * 0.35, theta: 0.8, name: "flask/blueprints", life: 1 },
      { r: radius * 0.65, theta: 2.1, name: "express/router", life: 0.8 },
      { r: radius * 0.82, theta: 4.2, name: "tokio/timer", life: 0.9 },
      { r: radius * 0.5, theta: 5.1, name: "requests/gzip", life: 0.7 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      angle += 0.025;

      // Concentric Radar Rings
      ctx.strokeStyle = "rgba(16, 185, 129, 0.18)";
      ctx.lineWidth = 1;

      [0.25, 0.5, 0.75, 1].forEach((fraction) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * fraction, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Rotating Radar Sweep Beam
      const gradient = ctx.createConicGradient(angle, cx, cy);
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.35)");
      gradient.addColorStop(0.12, "rgba(6, 182, 212, 0.08)");
      gradient.addColorStop(0.25, "transparent");
      gradient.addColorStop(1, "transparent");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw blips
      blips.forEach((b) => {
        const bx = cx + Math.cos(b.theta) * b.r;
        const by = cy + Math.sin(b.theta) * b.r;

        // Angle difference with radar sweep
        const diff = Math.abs((angle % (Math.PI * 2)) - (b.theta % (Math.PI * 2)));
        const intensity = diff < 0.3 ? 1 : 0.4;

        ctx.fillStyle = `rgba(52, 211, 153, ${intensity})`;
        ctx.beginPath();
        ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing halo when sweep passes
        if (diff < 0.2) {
          ctx.strokeStyle = "rgba(52, 211, 153, 0.6)";
          ctx.beginPath();
          ctx.arc(bx, by, 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className={`block mx-auto ${className}`} />;
}
