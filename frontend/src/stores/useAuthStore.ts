import { create } from 'zustand';
import client from '../api/client';

interface User {
  uuid: string;
  name: string;
  email: string;
  roles: string[];
  email_verified_at: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setTokens: (token: string, refreshToken: string) => void;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,

  setUser: (user: User) => {
    set({
      user,
      isAuthenticated: true,
      isAdmin: user.roles.includes('admin'),
    });
  },

  setTokens: (token: string, refreshToken: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    set({ token, refreshToken });
  },

  login: (token: string, refreshToken: string, user: User) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
      isAdmin: user.roles.includes('admin'),
      isLoading: false,
    });
  },

  logout: () => {
    const token = get().token;
    if (token) {
      client.post('/v1/auth/logout').catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    });
  },

  initialize: async () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!token) {
      set({ isLoading: false });
      return;
    }

    set({ token, refreshToken });

    try {
      const response = await client.get('/v1/auth/me');
      const user = response.data.data;
      set({
        user,
        isAuthenticated: true,
        isAdmin: user.roles.includes('admin'),
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
      });
    }
  },
}));
