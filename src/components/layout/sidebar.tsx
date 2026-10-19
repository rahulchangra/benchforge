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
  FolderKanban,
} from "lucide-react";
import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SidebarContext = createContext(false);

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { type: "separator" as const, label: "Olympus" },
  { href: "/projects", label: "Projects", icon: FolderKanban },
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

export function Sidebar({ onCollapse }: { onCollapse?: (collapsed: boolean) => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-neutral-800/50 px-4">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
                BF
              </div>
              <span className="text-sm font-semibold text-neutral-100">BenchForge</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/20">
            BF
          </div>
        )}
        <button
          onClick={toggle}
          className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
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
              <div key={i} className="my-2 border-t border-neutral-800/50" />
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
                "group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active gradient accent line */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-gradient-to-b from-emerald-400 to-cyan-400"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                />
              )}
              <Icon size={18} className={cn("shrink-0 transition-colors", isActive && "text-emerald-400")} />
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

      {/* Bottom gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
    </motion.aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={collapsed}>
      <div className="flex min-h-screen">
        <Sidebar onCollapse={setCollapsed} />
        <motion.main
          animate={{ marginLeft: collapsed ? 64 : 256 }}
          transition={{ duration: 0.2 }}
          className="flex-1 p-8"
        >
          {children}
        </motion.main>
      </div>
    </SidebarContext.Provider>
  );
}

export function useSidebarCollapsed() {
  return useContext(SidebarContext);
}

export { SidebarContext };
