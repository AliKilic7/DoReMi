"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PlayIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  href: string;
  title: string;
  subtitle: string;
  gradient: string;
  /** Round artwork (artists) instead of the default rounded square. */
  round?: boolean;
  onPlay?: () => void;
}

/** Album / artist / playlist tile with hover play affordance. */
export function MediaCard({ href, title, subtitle, gradient, round = false, onPlay }: MediaCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="group relative rounded-2xl p-3 transition-colors hover:bg-white/5"
    >
      <Link href={href} className="focus-ring block rounded-xl" aria-label={`${title} — ${subtitle}`}>
        <div
          className={cn(
            "relative aspect-square w-full overflow-hidden shadow-lg",
            round ? "rounded-full" : "rounded-xl",
          )}
          style={{ background: gradient }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <p className="mt-3 truncate text-sm font-semibold">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
      </Link>

      {onPlay && (
        <button
          onClick={onPlay}
          aria-label={`Play ${title}`}
          className={cn(
            "focus-ring absolute right-5 bottom-16 flex size-11 items-center justify-center rounded-full",
            "bg-gradient-to-br from-primary to-accent-pink text-white shadow-[0_10px_24px_-6px_rgba(139,92,246,0.7)]",
            "translate-y-2 opacity-0 transition-all duration-300",
            "group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100",
            "hover:scale-105 active:scale-95",
          )}
        >
          <PlayIcon className="size-4.5 translate-x-px" />
        </button>
      )}
    </motion.div>
  );
}
