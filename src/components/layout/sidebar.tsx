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
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/[0.08] bg-[#07070b]/80 backdrop-blur-3xl shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.06)]"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-4">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-xs font-black text-black shadow-lg shadow-amber-500/25">
                BF
              </div>
              <span className="text-sm font-bold tracking-tight text-white">BenchForge</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-xs font-black text-black shadow-lg shadow-amber-500/25">
            BF
          </div>
        )}
        <button
          onClick={toggle}
          className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5">
        {navItems.map((item, i) => {
          if ("type" in item && item.type === "separator") {
            return collapsed ? (
              <div key={i} className="my-2 border-t border-white/[0.06]" />
            ) : (
              <div key={i} className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
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
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.1]"
                  : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-200"
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* Active gradient accent pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-amber-400 to-orange-500 shadow-[0_0_8px_#f59e0b]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon size={16} className={cn("shrink-0 transition-colors", isActive ? "text-amber-400" : "text-neutral-400 group-hover:text-neutral-200")} />
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

      {/* Bottom gradient hairline */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />
    </motion.aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={collapsed}>
      <div className="flex min-h-screen bg-[#040407]">
        <Sidebar onCollapse={setCollapsed} />
        <motion.main
          animate={{ marginLeft: collapsed ? 68 : 260 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 p-6 md:p-10 min-h-screen relative"
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
