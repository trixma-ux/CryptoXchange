import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  role: string;
  kycStatus: string;
  twoFactorEnabled?: boolean;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      updateUser: (partialUser) => set((state) => ({
        user: state.user ? { ...state.user, ...partialUser } : null,
      })),
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-store' }
  )
);

// Prices store
interface PricesState {
  prices: Record<string, any>;
  lastUpdated: Date | null;
  setPrices: (prices: Record<string, any>) => void;
}

export const usePricesStore = create<PricesState>((set) => ({
  prices: {},
  lastUpdated: null,
  setPrices: (prices) => set({ prices, lastUpdated: new Date() }),
}));
