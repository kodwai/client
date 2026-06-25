"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "./admin-api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_superadmin: boolean;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("kodwai_admin_token");
    setToken(null);
    setAdmin(null);
    router.push("/admin/login");
  }, [router]);

  useEffect(() => {
    const stored = localStorage.getItem("kodwai_admin_token");
    if (!stored) {
      setLoading(false);
      router.push("/admin/login");
      return;
    }
    setToken(stored);
    adminApi.get("/api/admin/me")
      .then(setAdmin)
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout, router]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await adminApi.post("/api/admin/login", { email, password });
    localStorage.setItem("kodwai_admin_token", data.access_token);
    setToken(data.access_token);
    setAdmin(data.user);
    router.push("/admin/dashboard");
  }, [router]);

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
