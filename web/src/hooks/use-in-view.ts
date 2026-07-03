"use client";

import { useEffect, useRef, useState } from "react";

/** Observes a sentinel element — used to trigger infinite-scroll loads. */
export function useInView<T extends HTMLElement>(rootMargin = "600px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
