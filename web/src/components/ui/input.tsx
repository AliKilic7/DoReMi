import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "focus-ring h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground",
        "placeholder:text-subtle",
        "transition-colors duration-200 hover:border-border-strong",
        "focus-visible:border-primary/60 focus-visible:bg-white/8",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive/60",
        className,
      )}
      {...props}
    />
  );
}
