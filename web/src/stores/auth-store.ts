import { create } from "zustand";
import type { User } from "@/types";

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: "authenticated" }),
  clearUser: () => set({ user: null, status: "guest" }),
}));
