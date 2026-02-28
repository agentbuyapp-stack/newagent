"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiClient, User } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, email: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiClient.setToken(token);
      // Validate token by fetching user
      apiClient
        .getMe()
        .then((user) => {
          setState({ user, token, isLoading: false, isAuthenticated: true });
        })
        .catch(() => {
          // Token invalid/expired — clean up (expected for old sessions)
          console.log("Session expired, please login again");
          localStorage.removeItem("token");
          apiClient.setToken(null);
          setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
        });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    // Clear any stale token before login
    apiClient.setToken(null);
    localStorage.removeItem("token");
    const result = await apiClient.login(phone, password);
    localStorage.setItem("token", result.token);
    apiClient.setToken(result.token);
    setState({
      user: result.user,
      token: result.token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const register = useCallback(async (phone: string, password: string, email: string, name: string) => {
    // Clear any stale token before register
    apiClient.setToken(null);
    localStorage.removeItem("token");
    const result = await apiClient.registerUser(phone, password, email, name);
    localStorage.setItem("token", result.token);
    apiClient.setToken(result.token);
    setState({
      user: result.user,
      token: result.token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    apiClient.setToken(null);
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await apiClient.getMe();
      setState((s) => ({ ...s, user }));
    } catch {
      // Token might be invalid
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
