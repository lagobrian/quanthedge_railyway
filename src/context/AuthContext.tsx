"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name?: string;
  is_premium?: boolean;
  is_author?: boolean;
  // Add other user fields as needed
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile if token exists
  const refreshUser = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (e) {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshUser();
    // Listen for storage changes (e.g., login/logout in other tabs)
    const handleStorage = () => refreshUser();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const loginResponse = await fetch(`${API_BASE}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!loginResponse.ok) {
        setLoading(false);
        return false;
      }
      const loginData = await loginResponse.json();
      localStorage.setItem("access_token", loginData.access);
      localStorage.setItem("refresh_token", loginData.refresh);
      await refreshUser();
      setLoading(false);
      return true;
    } catch (e) {
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
