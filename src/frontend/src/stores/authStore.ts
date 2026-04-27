import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';
import type { User } from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.login(email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          set({
            error: err.response?.data?.message || 'Login failed',
            isLoading: false,
          });
          throw err;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authApi.register(username, email, password);
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          set({
            error: err.response?.data?.message || 'Registration failed',
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        try {
          const data = await authApi.me();
          set({
            user: data,
            isAuthenticated: true,
          });
        } catch {
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
