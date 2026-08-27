"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CmsUser, CmsLocale } from "@/lib/cms/types";
import { canAccess } from "@/lib/cms/permissions/matrix";
import type { CmsAction, CmsModule } from "@/lib/cms/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import mockUsers from "@/../data/cms/users.json";

interface AdminContextValue {
  user: CmsUser;
  setUser: (user: CmsUser) => void;
  can: (module: CmsModule, action?: CmsAction) => boolean;
  loading: boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const MOCK_FALLBACK = mockUsers[0] as CmsUser;
const STORAGE_KEY = "oboya-admin-user";

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CmsUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      try {
        if (!isSupabaseConfigured()) {
          if (!cancelled) {
            setUser(MOCK_FALLBACK);
            setLoading(false);
          }
          return;
        }

        const res = await fetch("/api/cms/me", { cache: "no-store" });
        const data = (await res.json()) as { user?: CmsUser; error?: string };

        if (!res.ok || !data.user) {
          localStorage.removeItem(STORAGE_KEY);
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          // Never reuse a stale localStorage identity from another login.
          localStorage.removeItem(STORAGE_KEY);
          setUser(null);
          setLoading(false);
        }
      }
    }

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSetUser = (next: CmsUser) => {
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const effectiveUser = user ?? MOCK_FALLBACK;

  const can = (module: CmsModule, action: CmsAction = "view") => {
    if (!user) return false;
    return canAccess(user.role, module, action);
  };

  return (
    <AdminContext.Provider
      value={{
        user: effectiveUser,
        setUser: handleSetUser,
        can,
        loading: loading || !user,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export function usePermission(module: CmsModule, action: CmsAction = "view") {
  const { can } = useAdmin();
  return can(module, action);
}

export const CMS_LOCALES: { value: CmsLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "pt-BR", label: "Português" },
  { value: "es", label: "Español" },
  { value: "zh-CN", label: "中文" },
];
