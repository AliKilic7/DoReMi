"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

/** Shared glassmorphism shell for the login / register forms. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong rounded-3xl p-8 shadow-[0_40px_100px_-30px_rgba(124,58,237,0.4)]"
    >
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

      <div className="mt-7">{children}</div>

      <div className="mt-7 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        {footer}
      </div>
    </motion.div>
  );
}
