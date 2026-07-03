"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AudioEngine } from "@/components/player/audio-engine";
import { PlayerBar } from "@/components/player/player-bar";
import { QueuePanel } from "@/components/player/queue-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { MobileSidebar, Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

function ShellSkeleton() {
  return (
    <div className="flex h-screen gap-3 p-3">
      <Skeleton className="hidden w-60 rounded-2xl lg:block" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="flex-1 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Authenticated application frame: sidebar + topbar + scrollable content.
 * Redirects guests to /login once the session bootstrap resolves.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  // "/" focuses search from anywhere in the app
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(target.tagName)) {
        event.preventDefault();
        router.push("/search");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  if (status !== "authenticated") return <ShellSkeleton />;

  return (
    <div className="bg-mesh flex h-screen flex-col gap-3 p-3">
      <div className="flex min-h-0 flex-1 gap-3">
        <Sidebar />
        <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Topbar onMenuClick={() => setMenuOpen(true)} />
          <main className="glass min-h-0 flex-1 overflow-y-auto rounded-2xl">
            <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">{children}</div>
          </main>
        </div>
      </div>

      <AudioEngine />
      <PlayerBar />
      <QueuePanel />
    </div>
  );
}
