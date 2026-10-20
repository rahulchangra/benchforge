"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Zap,
  CheckCircle,
  Clock,
  Award,
} from "lucide-react";

interface EnhancedMetricsProps {
  data: {
    totalSubmissions: number;
    readySubmissions: number;
    avgQualityScore: number;
    completionRate: number;
    submissionsThisWeek: number;
    lastWeekSubmissions: number;
    topCategory: string;
    topLanguage: string;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  trend = "neutral",
  subtitle,
}: MetricCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900/80 to-neutral-950 p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <Icon size={12} />
            {title}
          </div>
          <div className="mt-3 text-3xl font-bold text-neutral-100">
            {value}
          </div>
          {subtitle && (
            <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>
          )}
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <TrendIcon
                size={12}
                className={
                  trend === "up"
                    ? "text-emerald-400"
                    : trend === "down"
                    ? "text-red-400"
                    : "text-neutral-500"
                }
              />
              <span
                className={`text-xs font-medium ${
                  trend === "up"
                    ? "text-emerald-400"
                    : trend === "down"
                    ? "text-red-400"
                    : "text-neutral-500"
                }`}
              >
                {change > 0 ? "+" : ""}
                {change}% vs last week
              </span>
            </div>
          )}
        </div>
        <div
          className={`rounded-lg p-2.5`}
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}

export function EnhancedMetrics({ data }: EnhancedMetricsProps) {
  const weekChange = data.lastWeekSubmissions
    ? ((data.submissionsThisWeek - data.lastWeekSubmissions) /
        data.lastWeekSubmissions) *
      100
    : 0;

  const qualityTrend =
    data.avgQualityScore >= 0.8
      ? "up"
      : data.avgQualityScore >= 0.6
      ? "neutral"
      : "down";

  const completionTrend =
    data.completionRate >= 70
      ? "up"
      : data.completionRate >= 50
      ? "neutral"
      : "down";

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Submissions"
          value={data.totalSubmissions}
          change={weekChange}
          trend={weekChange > 0 ? "up" : weekChange < 0 ? "down" : "neutral"}
          icon={Target}
          color="#f59e0b"
        />

        <MetricCard
          title="Ready to Export"
          value={data.readySubmissions}
          subtitle={`${((data.readySubmissions / Math.max(data.totalSubmissions, 1)) * 100).toFixed(0)}% of total`}
          icon={CheckCircle}
          color="#10b981"
        />

        <MetricCard
          title="Avg Quality Score"
          value={`${(data.avgQualityScore * 100).toFixed(0)}%`}
          trend={qualityTrend}
          icon={Award}
          color="#06b6d4"
        />

        <MetricCard
          title="Completion Rate"
          value={`${data.completionRate.toFixed(0)}%`}
          trend={completionTrend}
          icon={Zap}
          color="#8b5cf6"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
            <Clock size={12} />
            This Week
          </div>
          <div className="mt-2 text-2xl font-bold text-neutral-100">
            {data.submissionsThisWeek}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            {weekChange > 0 ? "+" : ""}
            {weekChange.toFixed(0)}% from last week
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <div className="text-xs font-medium text-neutral-400">
            Top Category
          </div>
          <div className="mt-2 text-xl font-bold text-neutral-100">
            {data.topCategory || "N/A"}
          </div>
          <div className="mt-1 text-xs text-neutral-500">Most generated</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
        >
          <div className="text-xs font-medium text-neutral-400">
            Top Language
          </div>
          <div className="mt-2 text-xl font-bold text-neutral-100">
            {data.topLanguage || "N/A"}
          </div>
          <div className="mt-1 text-xs text-neutral-500">Most used</div>
        </motion.div>
      </div>
    </div>
  );
}
