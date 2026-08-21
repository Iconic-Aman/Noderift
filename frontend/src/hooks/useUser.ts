import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  first_name: string;
  picture?: string;
  created_at?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("noderift_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch("/auth/me");
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(() => {
    localStorage.removeItem("noderift_token");
    setUser(null);
    window.location.href = "/";
  }, []);

  const firstName = user?.first_name || (user?.name ? user.name.split(" ")[0] : (user?.email ? user.email.split("@")[0] : "User"));

  return { user, firstName, loading, logout, refreshUser: fetchUser };
}
