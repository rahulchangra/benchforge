"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardTilt3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function CardTilt3D({
  children,
  className,
  glowColor = "rgba(16, 185, 129, 0.2)",
  ...props
}: CardTilt3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for 3D rotation
  const mouseXSpring = useSpring(x, { stiffness: 260, damping: 24 });
  const mouseYSpring = useSpring(y, { stiffness: 260, damping: 24 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);

    setGlarePos({ x: (mouseX / width) * 100, y: (mouseY / height) * 100 });
  }, [x, y]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: "1000px" }}
      className="h-full w-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "apple-glass-card relative h-full w-full rounded-[28px] p-8",
          "border border-white/[0.1] bg-[#09090e]/70 backdrop-blur-3xl",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_25px_50px_-12px_rgba(0,0,0,0.85)]",
          "transition-shadow duration-300",
          className
        )}
        {...(props as any)}
      >
        {/* Specular glare follower */}
        {isHovered && (
          <div
            className="pointer-events-none absolute -inset-px rounded-[28px] opacity-100 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 350px at ${glarePos.x}% ${glarePos.y}%, ${glowColor}, transparent 80%)`,
            }}
          />
        )}
        <div style={{ transform: "translateZ(30px)" }} className="relative z-10">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
