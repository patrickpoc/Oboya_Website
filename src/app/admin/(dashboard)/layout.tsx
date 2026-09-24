import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { requireCmsAuth } from "@/lib/cms/server/require-cms-auth";
import { moduleForAdminPath } from "@/lib/cms/admin-path-module";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-admin-pathname") ?? "/admin/dashboard";
  const module = moduleForAdminPath(pathname) ?? "dashboard";
  const auth = await requireCmsAuth({ module, action: "view" });
  if (!auth.ok) {
    if (auth.status === 401) {
      redirect(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
    if (auth.status === 503) {
      return (
        <div className="flex min-h-screen items-center justify-center p-8 text-sm text-muted-foreground">
          Admin is unavailable.
        </div>
      );
    }
    return (
      <div className="flex min-h-screen items-center justify-center p-8 text-sm text-muted-foreground">
        You do not have access to this section.
      </div>
    );
  }

  return <AdminShell user={auth.user}>{children}</AdminShell>;
}
