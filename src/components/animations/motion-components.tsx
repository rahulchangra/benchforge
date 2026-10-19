"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  animate,
  type HTMLMotionProps,
} from "framer-motion";

/** Animated metric card with count-up effect */
export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-400">{title}</p>
          <motion.p
            className="mt-2 text-3xl font-bold text-neutral-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-neutral-800 p-2.5 text-neutral-400">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "text-xs font-medium",
              trend.value >= 0 ? "text-green-400" : "text-red-400",
            )}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-neutral-500">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
}

/** Animated section that fades in on scroll */
export function FadeInSection({
  children,
  className,
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Staggered list animation container */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggered list item */
export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Pulse animation for live indicators */
export function PulseIndicator({
  active = true,
  className,
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative flex h-2.5 w-2.5", className)}>
      {active && (
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
          animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          active ? "bg-green-500" : "bg-neutral-600",
        )}
      />
    </span>
  );
}

/** Progress bar with animation */
export function AnimatedProgress({
  value,
  max = 100,
  className,
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-neutral-400">{label}</span>
          <span className="text-neutral-500">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <motion.div
          className="h-full rounded-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NEW EXPORTS                                                        */
/* ------------------------------------------------------------------ */

/** Card with animated gradient border glow on hover + glassmorphism */
export function GlowCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn("group relative rounded-2xl p-px", className)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative rounded-2xl border border-white/[0.06] bg-neutral-900/60 p-6 backdrop-blur-xl transition-colors duration-300 group-hover:border-white/[0.1] group-hover:bg-neutral-900/80">
        {children}
      </div>
    </motion.div>
  );
}

/** Animate a number from 0 to target */
export function AnimatedCounter({
  target,
  duration = 2,
  prefix = "",
  suffix = "",
  className,
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { duration: duration * 1000 });
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (isInView) {
      animate(motionVal, target, { duration });
    }
  }, [isInView, motionVal, target, duration]);

  useEffect(() => {
    const unsub = springVal.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
      }
    });
    return unsub;
  }, [springVal, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}

/** Scroll-driven parallax wrapper */
export function ParallaxSection({
  children,
  className,
  speed = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [80 * speed, -80 * speed]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Gentle floating animation */
export function FloatingElement({
  children,
  className,
  amplitude = 12,
  duration = 4,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Typewriter text effect */
export function TypewriterText({
  text,
  className,
  speed = 0.04,
  delay = 0,
}: {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || started) return;
    const timeout = setTimeout(() => {
      setStarted(true);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(interval);
      }, speed * 1000);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [isInView, text, speed, delay, started]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      {started && displayed.length < text.length && (
        <motion.span
          className="inline-block w-[2px] bg-current"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          &nbsp;
        </motion.span>
      )}
    </span>
  );
}

/** Animated gradient text with shimmer */
export function GradientText({
  children,
  className,
  from = "from-emerald-400",
  via = "via-cyan-400",
  to = "to-blue-500",
}: {
  children: React.ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}) {
  return (
    <motion.span
      className={cn(
        "inline-block bg-gradient-to-r bg-clip-text text-transparent",
        from,
        via,
        to,
        className,
      )}
      initial={{ backgroundPosition: "0% 50%" }}
      animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
      style={{ backgroundSize: "200% 200%" }}
    >
      {children}
    </motion.span>
  );
}

/** Reveal animation triggered on scroll */
export function RevealOnScroll({
  children,
  className,
  direction = "up",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
}) {
  const offsets = {
    up: { x: 0, y: 40 },
    down: { x: 0, y: -40 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };
  const offset = offsets[direction];
  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Button with animated shimmer/shine effect */
export function ShimmerButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3 text-sm font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-emerald-500/25",
        className,
      )}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
        style={{ skewX: "-12deg" }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
