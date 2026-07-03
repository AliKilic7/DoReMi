"use client";

import { useRef, useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useProfileMutations } from "@/hooks/use-user";
import { useAuthStore } from "@/stores/auth-store";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProfileForm() {
  const user = useAuthStore((s) => s.user)!;
  const { updateProfile, uploadAvatar } = useProfileMutations();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateProfile.mutate({
      displayName: displayName.trim(),
      username: username.trim(),
      bio: bio.trim() || null,
    });
  }

  return (
    <section className="glass rounded-3xl p-7">
      <h2 className="font-display text-lg font-bold">Profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">How you appear across DoReMi.</p>

      <div className="mt-6 flex items-center gap-5">
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Upload avatar"
          className="focus-ring group relative rounded-full"
        >
          <Avatar className="size-20">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="text-xl">{initials(user.displayName)}</AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            {uploadAvatar.isPending ? <Spinner /> : "Change"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAvatar.mutate(file);
            e.target.value = "";
          }}
        />
        <div>
          <p className="font-medium">{user.displayName}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="mt-1 text-xs text-subtle">
            Member since{" "}
            {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            pattern="[a-z0-9_]{3,24}"
            title="3–24 lowercase letters, numbers or underscores"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Input
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell listeners a little about yourself"
            maxLength={200}
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Spinner /> : "Save changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const { changePassword } = useProfileMutations();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
        },
      },
    );
  }

  return (
    <section className="glass rounded-3xl p-7">
      <h2 className="font-display text-lg font-bold">Password</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Changing your password signs you out everywhere else.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            type="submit"
            variant="secondary"
            disabled={changePassword.isPending || newPassword.length < 8 || !currentPassword}
          >
            {changePassword.isPending ? <Spinner /> : "Change password"}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 px-3">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-3 pb-4">
      <h1 className="font-display text-3xl font-bold tracking-tight">Your account</h1>
      <div className="mt-6 space-y-5">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
}
