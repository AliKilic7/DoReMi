"use client";

import type { ComponentProps } from "react";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<ComponentProps<"button">, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** Minimal glass checkbox with an animated check mark. */
export function Checkbox({ checked, onCheckedChange, className, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-slot="checkbox"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "focus-ring inline-flex size-5 shrink-0 items-center justify-center rounded-md border transition-all duration-200",
        checked
          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_12px_rgba(139,92,246,0.5)]"
          : "border-border-strong bg-input hover:border-primary/50",
        className,
      )}
      {...props}
    >
      <CheckIcon
        className={cn(
          "size-3.5 transition-all duration-200",
          checked ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
        strokeWidth={2.6}
      />
    </button>
  );
}
