"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogoIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export function LandingNavbar() {
  const status = useAuthStore((s) => s.status);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        aria-label="Main"
        className="glass-strong flex w-full max-w-5xl items-center justify-between rounded-2xl px-5 py-3"
      >
        <Link href="/" className="focus-ring flex items-center gap-2.5 rounded-lg">
          <LogoIcon className="size-7" />
          <span className="font-display text-lg font-semibold tracking-tight">DoReMi</span>
        </Link>

        <div className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <a href="#features" className="focus-ring rounded-full px-4 py-2 transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#discover" className="focus-ring rounded-full px-4 py-2 transition-colors hover:text-foreground">
            Discover
          </a>
        </div>

        <div className="flex items-center gap-2">
          {status === "authenticated" ? (
            <Button asChild size="sm">
              <Link href="/home">Open DoReMi</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
