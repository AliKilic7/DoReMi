import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Friendly glass panel for zero-result / zero-content situations. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-strong px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white/5 text-muted-foreground [&_svg]:size-7">
        {icon}
      </span>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
