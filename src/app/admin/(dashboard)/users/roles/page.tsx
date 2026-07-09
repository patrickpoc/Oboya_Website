"use client";

import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, getPermissions } from "@/lib/cms/permissions/matrix";
import type { CmsModule, CmsRole } from "@/lib/cms/types";

const MODULES: CmsModule[] = [
  "dashboard",
  "website",
  "marketplace",
  "global_presence",
  "blog",
  "case_studies",
  "careers",
  "media",
  "forms",
  "users",
  "settings",
  "audit_logs",
];

const ROLES = Object.keys(ROLE_LABELS) as CmsRole[];

export default function RolesPage() {
  return (
    <div>
      <AdminPageHeader
        title="Roles & Permissions"
        description="Permission matrix by role and module. Custom roles can be added in future releases."
      />

      <Card>
        <CardHeader>
          <CardTitle>Permission matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-2 text-left">Module</th>
                {ROLES.map((role) => (
                  <th key={role} className="px-2 py-2 text-left font-normal text-muted-foreground">
                    {ROLE_LABELS[role].split(" ")[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((mod) => (
                <tr key={mod} className="border-b border-border/40">
                  <td className="px-2 py-2 font-medium">{mod.replace(/_/g, " ")}</td>
                  {ROLES.map((role) => {
                    const perms = getPermissions(role, mod);
                    return (
                      <td key={role} className="px-2 py-2 text-muted-foreground">
                        {perms.length === 0
                          ? "—"
                          : perms.length >= 5
                            ? "full"
                            : perms.join(", ")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
