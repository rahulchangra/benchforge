"use client";

import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

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
        className
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
              trend.value >= 0 ? "text-green-400" : "text-red-400"
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
      animate="visible"
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
          active ? "bg-green-500" : "bg-neutral-600"
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
