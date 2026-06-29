import { create } from "zustand";
import { zui } from "@z-ui/core";

type User = {
  id: string;
  name: string;
  role: "admin" | "user";
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (name: string, role: User["role"]) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>(
  zui({ name: "authStore" })((set) => ({
    user: null,
    isLoading: false,
    error: null,
    login: async (name, role) => {
      set({ isLoading: true, error: null });
      // 네트워크 딜레이 시뮬레이션
      await new Promise((r) => setTimeout(r, 800));
      set({
        user: { id: crypto.randomUUID(), name, role },
        isLoading: false,
      });
    },
    logout: () => set({ user: null, error: null }),
  }))
);
