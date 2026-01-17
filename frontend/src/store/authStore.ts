import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

interface User {
  id: number;
  email: string;
  username: string;
  role: string;
  language: string;
  dark_mode: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, username: string, password: string) => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, access_token } = response.data.data;

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Store token for API calls
          localStorage.setItem('token', access_token);
          return user;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Login failed',
          });
          throw error;
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', {
            email,
            username,
            password,
          });
          const { user, access_token } = response.data.data;

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
          });

          localStorage.setItem('token', access_token);
          return user;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({
            user: response.data.data.user,
            token,
            isAuthenticated: true,
          });
        } catch {
          localStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
    }
  )
);
