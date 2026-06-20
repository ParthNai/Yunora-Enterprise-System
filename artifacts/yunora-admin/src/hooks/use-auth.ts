import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

async function fetchMe(): Promise<AdminUser | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export function useAuth() {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<AdminUser | null>({
    queryKey: ["auth-me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const login = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login failed");
      }
      return res.json() as Promise<AdminUser>;
    },
    onSuccess: (user) => {
      qc.setQueryData(["auth-me"], user);
      setLocation("/dashboard");
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    },
    onSuccess: () => {
      qc.setQueryData(["auth-me"], null);
      qc.clear();
      setLocation("/");
    },
  });

  return { user, isLoading, login, logout };
}
