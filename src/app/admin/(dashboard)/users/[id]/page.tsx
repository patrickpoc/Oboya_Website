"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCmsUserById } from "@/lib/cms/repositories/users-repository";
import { ROLE_LABELS } from "@/lib/cms/permissions/matrix";

export default function UserDetailPage() {
  const params = useParams();
  const user = getCmsUserById(params.id as string);

  if (!user) {
    return <p className="text-muted-foreground">User not found.</p>;
  }

  return (
    <div>
      <AdminPageHeader
        title={user.name}
        description={user.email}
        actions={
          <Link
            href="/admin/users"
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            Back to users
          </Link>
        }
      />
      <Card className="max-w-md">
        <CardContent className="space-y-3 pt-6">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Role</span>
            <Badge>{ROLE_LABELS[user.role]}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={user.status === "active" ? "default" : "secondary"}>
              {user.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Locale</span>
            <span className="text-sm">{user.locale}</span>
          </div>
          {user.jobTitle && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Job title</span>
              <span className="text-sm">{user.jobTitle}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
