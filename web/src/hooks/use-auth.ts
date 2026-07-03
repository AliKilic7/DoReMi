"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginInput, RegisterInput, User } from "@/types";

interface UserResponse {
  user: User;
}

/** Auth actions + current session state, shared across the app. */
export function useAuth() {
  const { user, status, setUser, clearUser } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const login = useMutation({
    mutationFn: (input: LoginInput) =>
      api<UserResponse>("/api/auth/login", { method: "POST", body: input, skipRefresh: true }),
    onSuccess: ({ user }) => {
      setUser(user);
      toast.success(`Welcome back, ${user.displayName}`);
      router.push("/home");
    },
  });

  const register = useMutation({
    mutationFn: (input: RegisterInput) =>
      api<UserResponse>("/api/auth/register", { method: "POST", body: input, skipRefresh: true }),
    onSuccess: ({ user }) => {
      setUser(user);
      toast.success(`Welcome to DoReMi, ${user.displayName}`);
      router.push("/home");
    },
  });

  const logout = useMutation({
    mutationFn: () => api<{ ok: true }>("/api/auth/logout", { method: "POST", skipRefresh: true }),
    onSettled: () => {
      queryClient.clear();
      // Full navigation: deterministically resets all client state and avoids
      // racing route guards that redirect signed-out users to /login.
      window.location.assign("/");
    },
  });

  return { user, status, login, register, logout };
}

/** Human-friendly message for auth form errors. */
export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Could not reach the server. Please try again.";
}
