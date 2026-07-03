"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types";

/** Restores the session from the httpOnly cookie pair on first load. */
function useSessionBootstrap(): void {
  const { setUser, clearUser } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    api<{ user: User }>("/api/auth/me")
      .then(({ user }) => !cancelled && setUser(user))
      .catch(() => !cancelled && clearUser());
    return () => {
      cancelled = true;
    };
  }, [setUser, clearUser]);
}

function SessionBootstrap({ children }: { children: ReactNode }) {
  useSessionBootstrap();
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionBootstrap>{children}</SessionBootstrap>
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(21, 21, 35, 0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            color: "var(--foreground)",
            borderRadius: "0.875rem",
          },
        }}
      />
    </QueryClientProvider>
  );
}
