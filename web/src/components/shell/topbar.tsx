"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MenuIcon, SearchIcon, SettingsIcon, UserIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="glass sticky top-0 z-30 flex items-center gap-3 rounded-2xl px-4 py-2.5">
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="focus-ring rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
      >
        <MenuIcon className="size-5" />
      </button>

      {/* Search affordance routes to the dedicated page, which autofocuses. */}
      <button
        onClick={() => router.push("/search")}
        className="focus-ring hidden h-9 w-72 items-center gap-2.5 rounded-full border border-border bg-input px-4 text-sm text-subtle transition-colors hover:border-border-strong hover:text-muted-foreground md:flex"
      >
        <SearchIcon className="size-4" />
        Search songs, artists, albums…
        <kbd className="ml-auto rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus-ring rounded-full transition-transform hover:scale-105">
              <Avatar>
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <span className="block text-sm font-semibold text-foreground">{user.displayName}</span>
                <span className="mt-0.5 block truncate">@{user.username}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <SettingsIcon /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => logout.mutate()}
                className="text-destructive data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
