"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CmsUser, CmsLocale } from "@/lib/cms/types";
import { canAccess } from "@/lib/cms/permissions/matrix";
import type { CmsAction, CmsModule } from "@/lib/cms/types";
import mockUsers from "@/../data/cms/users.json";

interface AdminContextValue {
  user: CmsUser;
  setUser: (user: CmsUser) => void;
  can: (module: CmsModule, action?: CmsAction) => boolean;
}

const AdminContext = createContext<AdminContextValue | null>(null);

const DEFAULT_USER = mockUsers[0] as CmsUser;

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CmsUser>(DEFAULT_USER);

  useEffect(() => {
    const stored = localStorage.getItem("oboya-admin-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored) as CmsUser);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const handleSetUser = (next: CmsUser) => {
    setUser(next);
    localStorage.setItem("oboya-admin-user", JSON.stringify(next));
  };

  const can = (module: CmsModule, action: CmsAction = "view") =>
    canAccess(user.role, module, action);

  return (
    <AdminContext.Provider
      value={{ user, setUser: handleSetUser, can }}
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
