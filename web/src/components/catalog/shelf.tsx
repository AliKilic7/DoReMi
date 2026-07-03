import Link from "next/link";
import type { ReactNode } from "react";

interface ShelfProps {
  title: string;
  href?: string;
  children: ReactNode;
}

/** Horizontal-scrolling section with a title and optional "Show all" link. */
export function Shelf({ title, href, children }: ShelfProps) {
  return (
    <section aria-label={title} className="mt-8 first:mt-0">
      <div className="mb-2 flex items-baseline justify-between px-3">
        <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
        {href && (
          <Link
            href={href}
            className="focus-ring rounded text-xs font-medium text-subtle transition-colors hover:text-foreground"
          >
            Show all
          </Link>
        )}
      </div>
      <div className="grid grid-flow-col auto-cols-[minmax(150px,1fr)] gap-1 overflow-x-auto pb-2 sm:auto-cols-[minmax(170px,1fr)] lg:auto-cols-[minmax(0,1fr)] lg:grid-cols-6 lg:overflow-visible">
        {children}
      </div>
    </section>
  );
}
