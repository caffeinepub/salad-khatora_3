import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const AUTH_KEY = "sk_auth";
const VALID_EMAIL = "admin@saladkhatora.com";
const VALID_PASSWORD = "admin123";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEY);
    setIsAuthenticated(token === "authenticated");
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
      localStorage.setItem(AUTH_KEY, "authenticated");
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: "Invalid email or password." };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
