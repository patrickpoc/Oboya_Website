"use client";

import type { CmsAction, CmsModule } from "@/lib/cms/types";
import { usePermission } from "@/contexts/AdminContext";

export function Can({
  module,
  action = "view",
  children,
  fallback = null,
}: {
  module: CmsModule;
  action?: CmsAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const allowed = usePermission(module, action);
  return allowed ? children : fallback;
}
