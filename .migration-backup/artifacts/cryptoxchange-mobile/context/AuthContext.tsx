import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { authAPI } from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  kycStatus: string;
  twoFactorEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  accessToken: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const userData = await AsyncStorage.getItem("user");
      if (token && userData) {
        setAccessToken(token);
        setUser(JSON.parse(userData));
      }
    } catch {}
    finally { setIsLoading(false); }
  }

  async function login(email: string, password: string, totpCode?: string) {
    const res = await authAPI.login({ email, password, ...(totpCode ? { totpCode } : {}) });
    const { accessToken: at, refreshToken: rt, user: u } = res.data.data;
    await AsyncStorage.setItem("accessToken", at);
    await AsyncStorage.setItem("refreshToken", rt);
    await AsyncStorage.setItem("user", JSON.stringify(u));
    setAccessToken(at);
    setUser(u);
  }

  async function register(data: RegisterData) {
    const res = await authAPI.register(data);
    const { accessToken: at, refreshToken: rt, user: u } = res.data.data;
    await AsyncStorage.setItem("accessToken", at);
    await AsyncStorage.setItem("refreshToken", rt);
    await AsyncStorage.setItem("user", JSON.stringify(u));
    setAccessToken(at);
    setUser(u);
  }

  async function logout() {
    try {
      const rt = await AsyncStorage.getItem("refreshToken");
      if (rt) await authAPI.logout(rt).catch(() => {});
    } catch {}
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    setAccessToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
