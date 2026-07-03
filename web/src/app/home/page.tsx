"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

/**
 * Placeholder for the authenticated app shell (arrives with the next feature).
 * Verifies the session and offers logout so the auth loop is fully testable.
 */
export default function HomePage() {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="bg-mesh flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
    );
  }

  return (
    <div className="bg-mesh flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <LogoIcon className="size-14" />
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Hey {user.displayName}, you&apos;re in 🎧
        </h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Your library, player and discovery feed land here in the next feature. For now, your
          account and session are fully wired up.
        </p>
      </div>
      <Button variant="secondary" onClick={() => logout.mutate()} disabled={logout.isPending}>
        Sign out
      </Button>
    </div>
  );
}
