"use client";

import { motion } from "framer-motion";
import { HeartIcon } from "@/components/icons";
import { useLikedIds, useToggleLike } from "@/hooks/use-likes";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  songId: string;
  songTitle?: string;
  className?: string;
  /** Always visible; otherwise only liked hearts stay visible (rows reveal on hover). */
  alwaysVisible?: boolean;
}

/** Animated heart bound to the shared liked-ids cache. */
export function LikeButton({ songId, songTitle, className, alwaysVisible = false }: LikeButtonProps) {
  const liked = useLikedIds().has(songId);
  const toggle = useToggleLike();

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.stopPropagation();
        toggle(songId, liked, songTitle);
      }}
      aria-label={liked ? "Remove from Liked Songs" : "Add to Liked Songs"}
      aria-pressed={liked}
      className={cn(
        "focus-ring rounded-full p-1.5 transition-all hover:scale-110",
        liked
          ? "text-accent-pink"
          : cn(
              "text-muted-foreground hover:text-foreground",
              !alwaysVisible && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            ),
        className,
      )}
    >
      <motion.span
        key={String(liked)}
        initial={{ scale: liked ? 0.5 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
        className="block"
      >
        <HeartIcon filled={liked} className="size-4.5" />
      </motion.span>
    </motion.button>
  );
}
