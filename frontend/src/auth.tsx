import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, TOKEN_KEY, formatApiError } from "./api";

export type User = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
    } catch {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (phone: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { phone, password });
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  };

  const register = async (name: string, phone: string, password: string) => {
    try {
      const { data } = await api.post("/auth/register", { name, phone, password });
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
    } catch (e) {
      throw new Error(formatApiError(e));
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
