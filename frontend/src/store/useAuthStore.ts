import { create } from 'zustand';
import { authService, User } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login({ email, password });
      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register({ name, email, password });
      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
  },

  loadUser: async () => {
    const token = authService.getToken();
    const storedUser = authService.getStoredUser();

    // If no token, don't try to load
    if (!token) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      return;
    }

    // If we have a stored user, use it immediately (optimistic)
    if (storedUser) {
      set({
        user: storedUser,
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      set({ isLoading: true });
    }

    // Then verify in background
    try {
      const user = await authService.getCurrentUser();
      set({
        user,
        isAuthenticated: true,
        isLoading: false
      });
      // Update stored user with fresh data
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error: any) {
      // Only logout if it's actually an auth error
      if (error.response?.status === 401) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        authService.logout();
      } else {
        // For other errors (network, etc), keep the stored user
        set({ isLoading: false });
      }
    }
  },

  clearError: () => set({ error: null })
}));
