"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  Bug,
  FlaskConical,
  BookOpen,
  Brain,
  Network,
  FileEdit,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/repositories", label: "Repositories", icon: GitBranch },
  { href: "/issues", label: "Issues", icon: Bug },
  { href: "/benchmarks", label: "Benchmarks", icon: FlaskConical },
  { type: "separator" as const, label: "Learning Studio" },
  { href: "/learning", label: "Task Library", icon: BookOpen },
  { href: "/learning/knowledge", label: "Knowledge Tree", icon: Brain },
  { href: "/learning/graph", label: "Concept Graph", icon: Network },
  { href: "/learning/composer", label: "Task Composer", icon: FileEdit },
  { type: "separator" as const, label: "System" },
  { href: "/jobs", label: "Jobs", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-neutral-800 bg-neutral-950"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-4">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
                BF
              </div>
              <span className="text-sm font-semibold">BenchForge</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navItems.map((item, i) => {
          if ("type" in item && item.type === "separator") {
            return collapsed ? (
              <div key={i} className="my-2 border-t border-neutral-800" />
            ) : (
              <div key={i} className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                {item.label}
              </div>
            );
          }

          if (!("href" in item)) return null;
          const Icon = item.icon!;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-blue-600/10 text-blue-400"
                  : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
