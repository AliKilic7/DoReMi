"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { authErrorMessage, useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/** 0–3 heuristic used purely for the visual strength meter. */
function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_LABELS = ["Too short", "Getting there", "Good", "Strong"] as const;
const STRENGTH_COLORS = ["bg-destructive", "bg-accent-amber", "bg-primary", "bg-success"] as const;

export function RegisterForm() {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const strength = useMemo(() => passwordStrength(password), [password]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (register.isPending) return;
    register.mutate({ displayName, email, password, remember: true });
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="A world of music, three fields away."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="focus-ring rounded font-medium text-primary-soft hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            autoComplete="name"
            placeholder="How should we call you?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {password.length > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <div className="flex flex-1 gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      i < strength ? STRENGTH_COLORS[strength] : "bg-white/10",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-subtle">{STRENGTH_LABELS[strength]}</span>
            </div>
          )}
        </div>

        {register.isError && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {authErrorMessage(register.error)}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
          {register.isPending ? <Spinner /> : "Create account"}
        </Button>

        <p className="text-center text-xs text-subtle">
          By continuing you agree to DoReMi&apos;s Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthCard>
  );
}
