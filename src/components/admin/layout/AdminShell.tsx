"use client";

import { AdminProvider } from "@/contexts/AdminContext";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminTopbar } from "@/components/admin/layout/AdminTopbar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-oboya-soft-white">
        <AdminSidebar />
        <div className="pl-64">
          <AdminTopbar />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AdminProvider>
  );
}
