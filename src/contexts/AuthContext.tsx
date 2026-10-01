import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { AuthResponse, User } from "../lib/types";

interface AuthContextValue { user: User | null; token: string | null; loading: boolean; login(email: string, password: string): Promise<User>; register(displayName: string, email: string, password: string): Promise<User>; loginGoogle(idToken: string): Promise<User>; logout(): void }
const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "ma-cuisine-session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(Boolean(session));

  const persist = useCallback((next: AuthResponse | null) => {
    setSession(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    api<User>("/auth/me", {}, session.accessToken)
      .then((user) => persist({ ...session, user }))
      .catch(() => persist(null))
      .finally(() => setLoading(false));
  }, []); // intentional one-time session validation

  const authenticate = async (path: string, payload: object) => {
    const next = await api<AuthResponse>(path, { method: "POST", body: JSON.stringify(payload) });
    persist(next);
    return next.user;
  };
  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    token: session?.accessToken ?? null,
    loading,
    login: (email, password) => authenticate("/auth/login", { email, password }),
    register: (displayName, email, password) => authenticate("/auth/register", { displayName, email, password }),
    loginGoogle: (idToken) => authenticate("/auth/google", { idToken }),
    logout: () => persist(null),
  }), [session, loading, persist]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("AuthProvider manquant"); return value; }
