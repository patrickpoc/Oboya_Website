"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { AdminPageTransition } from "@/components/admin/layout/AdminPageTransition";
import { AdminLoadingProvider } from "@/components/admin/layout/AdminLoadingContext";
import { AdminLoadingOverlay } from "@/components/admin/layout/AdminLoadingOverlay";
import type { CmsUser } from "@/lib/cms/types";

function AdminShellFrame({ children }: { children: React.ReactNode }) {
  const { loading } = useAdmin();
  const t = useTranslations("admin.common");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-oboya-soft-white" aria-live="polite">
        <AdminLoadingOverlay
          active
          variant="fullscreen"
          label={t("loadingAccount")}
        />
      </div>
    );
  }

  return (
    <AdminLoadingProvider>
      <div className="min-h-screen bg-oboya-soft-white">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label={t("closeNav")}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <AdminSidebar
          mobileOpen={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
        />
        <div className="lg:pl-64">
          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-4 sm:p-6">
            <AdminPageTransition>{children}</AdminPageTransition>
          </main>
        </div>
      </div>
    </AdminLoadingProvider>
  );
}

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: CmsUser | null;
}) {
  return (
    <AdminProvider initialUser={user}>
      <AdminShellFrame>{children}</AdminShellFrame>
    </AdminProvider>
  );
}
