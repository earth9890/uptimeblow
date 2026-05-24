"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "./api";

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  if (accessToken && refreshToken) return { accessToken, refreshToken };
  return null;
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api<{ success: boolean; data: User }>("/api/auth/me", {
        token: tokens.accessToken,
      });
      setUser(res.data);
    } catch {
      // Try refresh token
      try {
        const res = await api<{
          success: boolean;
          data: { user: User; accessToken: string; refreshToken: string };
        }>("/api/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
        storeTokens({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });
        setUser(res.data.user);
      } catch {
        clearTokens();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    const res = await api<{
      success: boolean;
      data: { user: User; accessToken: string; refreshToken: string };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    storeTokens({
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    });
    setUser(res.data.user);
  };

  const register = async (email: string, name: string, password: string) => {
    const res = await api<{
      success: boolean;
      data: { user: User; accessToken: string; refreshToken: string };
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, name, password }),
    });

    storeTokens({
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
    });
    setUser(res.data.user);
  };

  const logout = async () => {
    const tokens = getStoredTokens();
    if (tokens) {
      await api("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      }).catch(() => {});
    }
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
