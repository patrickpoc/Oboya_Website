"use client";

import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { QuickAccessGrid } from "@/components/admin/dashboard/QuickAccessGrid";
import { useAdmin } from "@/contexts/AdminContext";

export default function DashboardPage() {
  const { user } = useAdmin();
  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Use the shortcuts below to navigate quickly.`}
      />
      <QuickAccessGrid />
    </div>
  );
}
