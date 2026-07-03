"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import { CloseIcon, HeartIcon, HomeIcon, LibraryIcon, LogoIcon, SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
  { href: "/library", label: "Library", icon: LibraryIcon },
  { href: "/liked", label: "Liked Songs", icon: HeartIcon },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="space-y-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring group relative flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-xl bg-white/8 ring-1 ring-white/10"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <Icon className={cn("relative size-5", active && "text-primary-soft")} />
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Desktop sidebar — fixed column inside the shell grid. */
export function Sidebar() {
  return (
    <aside className="glass hidden w-60 shrink-0 flex-col rounded-2xl p-4 lg:flex">
      <Link href="/home" className="focus-ring mb-6 flex items-center gap-2.5 rounded-lg px-2 pt-1">
        <LogoIcon className="size-7" />
        <span className="font-display text-lg font-semibold tracking-tight">DoReMi</span>
      </Link>
      <NavLinks />

      <div className="mt-auto rounded-xl border border-border p-4 text-xs leading-relaxed text-subtle">
        Playlists live here soon — create, pin and reorder them in an upcoming update.
      </div>
    </aside>
  );
}

/** Mobile drawer variant, toggled from the topbar. */
export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            aria-hidden
          />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="glass-strong fixed inset-y-3 left-3 z-50 flex w-64 flex-col rounded-2xl p-4 lg:hidden"
            aria-label="Menu"
          >
            <div className="mb-6 flex items-center justify-between px-2 pt-1">
              <Link href="/home" onClick={onClose} className="focus-ring flex items-center gap-2.5 rounded-lg">
                <LogoIcon className="size-7" />
                <span className="font-display text-lg font-semibold tracking-tight">DoReMi</span>
              </Link>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="focus-ring rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>
            <NavLinks onNavigate={onClose} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
