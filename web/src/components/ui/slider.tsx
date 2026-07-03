"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Slim slider whose thumb appears on hover — used for seek and volume. */
export function Slider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "group relative flex w-full touch-none items-center select-none",
        "data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/12 transition-[height] group-hover:h-1.5">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-white transition-colors group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent-pink" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={props["aria-label"] ?? "Slider"}
        className={cn(
          "focus-ring block size-3 rounded-full bg-white shadow-md",
          "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
        )}
      />
    </SliderPrimitive.Root>
  );
}
