"use client";

import { useState } from "react";
import { AdminProvider, useAdmin } from "@/contexts/AdminContext";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";
import { AdminPageTransition } from "@/components/admin/layout/AdminPageTransition";

function AdminShellFrame({ children }: { children: React.ReactNode }) {
  const { loading } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-oboya-soft-white"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="size-8 animate-spin rounded-full border-2 border-oboya-green/25 border-t-oboya-green" />
        <p className="text-sm text-muted-foreground">Loading your account…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oboya-soft-white">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close navigation"
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
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShellFrame>{children}</AdminShellFrame>
    </AdminProvider>
  );
}
