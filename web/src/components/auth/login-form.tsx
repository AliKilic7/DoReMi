"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { authErrorMessage, useAuth } from "@/hooks/use-auth";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (login.isPending) return;
    login.mutate({ email, password, remember });
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Pick up right where the music left off."
      footer={
        <>
          New to DoReMi?{" "}
          <Link
            href="/register"
            className="focus-ring rounded font-medium text-primary-soft hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-2.5">
          <Checkbox id="remember" checked={remember} onCheckedChange={setRemember} />
          <Label htmlFor="remember" className="cursor-pointer">
            Keep me signed in
          </Label>
        </div>

        {login.isError && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {authErrorMessage(login.error)}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
          {login.isPending ? <Spinner /> : "Log in"}
        </Button>
      </form>
    </AuthCard>
  );
}
