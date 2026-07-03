"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { useCallback, type ComponentProps, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "focus-ring relative inline-flex shrink-0 select-none items-center justify-center gap-2",
    "overflow-hidden whitespace-nowrap rounded-full font-medium",
    "transition-[transform,background-color,border-color,box-shadow] duration-200",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-primary-strong via-primary to-accent-pink text-primary-foreground",
          "shadow-[0_8px_24px_-8px_rgba(139,92,246,0.55)]",
          "hover:shadow-[0_10px_32px_-8px_rgba(139,92,246,0.75)] hover:brightness-110",
        ],
        secondary: "glass text-foreground hover:bg-white/8 hover:border-border-strong",
        ghost: "text-muted-foreground hover:bg-white/6 hover:text-foreground",
        outline: "border border-border-strong text-foreground hover:bg-white/6",
        destructive: "bg-destructive/15 text-destructive hover:bg-destructive/25",
      },
      size: {
        sm: "h-8 px-4 text-xs [&_svg]:size-3.5",
        md: "h-10 px-5 text-sm [&_svg]:size-4",
        lg: "h-12 px-7 text-base [&_svg]:size-5",
        icon: "size-10 [&_svg]:size-4.5",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Disable the material-style ripple on press. */
  noRipple?: boolean;
}

/** Spawns a one-shot ripple element at the click position. */
function spawnRipple(event: MouseEvent<HTMLElement>): void {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const ripple = document.createElement("span");
  ripple.style.cssText = `
    position:absolute;border-radius:9999px;pointer-events:none;
    width:${size}px;height:${size}px;
    left:${event.clientX - rect.left - size / 2}px;
    top:${event.clientY - rect.top - size / 2}px;
    background:radial-gradient(circle,rgba(255,255,255,0.35) 0%,transparent 65%);
    transform:scale(0);opacity:1;
    transition:transform 550ms ease-out,opacity 600ms ease-out;
  `;
  el.appendChild(ripple);
  requestAnimationFrame(() => {
    ripple.style.transform = "scale(1)";
    ripple.style.opacity = "0";
  });
  setTimeout(() => ripple.remove(), 650);
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  noRipple = false,
  onClick,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!noRipple) spawnRipple(event);
      onClick?.(event);
    },
    [noRipple, onClick],
  );

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={handleClick}
      {...props}
    />
  );
}

export { buttonVariants };
