"use client";

import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Can } from "@/components/admin/permissions/Can";

export default function Page() {
  return (
    <Can module="settings" action="view" fallback={<p className="text-sm text-muted-foreground">Access denied.</p>}>
      <AdminPageHeader title="Email Templates" description="Manage email templates." />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Email Templates module — mock data ready for API integration.
        </CardContent>
      </Card>
    </Can>
  );
}
