import { AdminLoadingOverlay } from "@/components/admin/layout/AdminLoadingOverlay";

export default function AdminDashboardLoading() {
  return (
    <div className="relative min-h-[50vh]">
      <AdminLoadingOverlay active />
    </div>
  );
}
