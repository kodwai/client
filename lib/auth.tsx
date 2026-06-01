"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  user_type: "developer" | "company";
  username?: string;
  organization_id?: string;
  company_name?: string;
  has_claude_api_key: boolean;
  // Free-submission entitlement. can_submit is false once a developer has spent
  // their free submissions and has not connected their own key.
  can_submit: boolean;
  free_submissions_used: number;
  free_submissions_limit: number;
  free_submissions_remaining: number;
  // First-login welcome intro: false until the developer has seen /dev/welcome.
  welcomed: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getHomeRoute(userType: string): string {
  return userType === "developer" ? "/dev/challenges" : "/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setLoading(false);
      router.push("/login");
      return;
    }

    setToken(storedToken);

    api
      .get("/api/auth/me")
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [logout, router]);

  const refreshUser = useCallback(async () => {
    const fresh = await api.get("/api/auth/me");
    setUser(fresh);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      const me = await api.get("/api/auth/me");
      setUser(me);
      // Developers go straight in — the in-app gate handles the API key once
      // their free submissions run out.
      router.push(getHomeRoute(me.user_type));
    },
    [router]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
