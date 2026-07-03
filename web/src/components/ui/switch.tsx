"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "focus-ring inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border transition-colors",
        "data-[state=checked]:border-primary/50 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary-strong data-[state=checked]:to-primary",
        "data-[state=unchecked]:bg-white/8",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block size-4.5 rounded-full bg-white shadow-md transition-transform",
          "data-[state=checked]:translate-x-[1.35rem] data-[state=unchecked]:translate-x-0.5",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
