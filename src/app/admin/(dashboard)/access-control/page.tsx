"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { RoleList } from "@/components/admin/access-control/RoleList";
import { MatrixEditor } from "@/components/admin/access-control/MatrixEditor";
import { Button } from "@/components/ui/button";
import { hydrateAccessControl } from "@/lib/cms/permissions/access-store";
import type {
  AccessControlDoc,
  AccessRoleDefinition,
} from "@/lib/cms/permissions/access-types";
import { isSystemRoleId, isValidRoleId } from "@/lib/cms/permissions/access-types";
import type { CmsModule, PermissionLevel } from "@/lib/cms/types";

export default function AccessControlPage() {
  const t = useTranslations("admin.accessControl");
  const [doc, setDoc] = useState<AccessControlDoc | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cms/access-control", { cache: "no-store" });
      const data = (await res.json()) as AccessControlDoc & { error?: string };
      if (!res.ok) throw new Error(data.error || t("loadFailed"));
      setDoc({ roles: data.roles, matrix: data.matrix });
      hydrateAccessControl({ roles: data.roles, matrix: data.matrix });
      setSelectedId((prev) => prev ?? data.roles[0]?.id ?? null);
      setDirty(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateRoles = (roles: AccessRoleDefinition[]) => {
    setDoc((prev) => (prev ? { ...prev, roles } : prev));
    setDirty(true);
  };

  const handleCreate = (id: string, label: string) => {
    if (!doc) return;
    if (!isValidRoleId(id)) {
      toast.error(t("invalidRoleId"));
      return;
    }
    if (doc.roles.some((r) => r.id === id)) {
      toast.error(t("roleExists"));
      return;
    }
    const sortOrder =
      Math.max(0, ...doc.roles.map((r) => r.sortOrder)) + 1;
    setDoc({
      roles: [
        ...doc.roles,
        {
          id,
          label,
          system: isSystemRoleId(id),
          active: true,
          sortOrder,
        },
      ],
      matrix: {
        ...doc.matrix,
        [id]: structuredClone(doc.matrix.viewer ?? {}),
      },
    });
    setSelectedId(id);
    setDirty(true);
  };

  const handleRename = (id: string, label: string) => {
    if (!doc) return;
    updateRoles(
      doc.roles.map((r) => (r.id === id ? { ...r, label } : r))
    );
  };

  const handleToggleActive = (id: string) => {
    if (!doc) return;
    if (id === "super_admin") {
      toast.error(t("cannotDeactivateSuper"));
      return;
    }
    updateRoles(
      doc.roles.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r
      )
    );
  };

  const handleMatrixChange = (module: CmsModule, level: PermissionLevel) => {
    if (!doc || !selectedId) return;
    if (selectedId === "super_admin") return;
    setDoc({
      ...doc,
      matrix: {
        ...doc.matrix,
        [selectedId]: {
          ...(doc.matrix[selectedId] ?? {}),
          [module]: level,
        },
      },
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const res = await fetch("/api/cms/access-control", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });
      const data = (await res.json()) as AccessControlDoc & { error?: string };
      if (!res.ok) throw new Error(data.error || t("saveFailed"));
      setDoc({ roles: data.roles, matrix: data.matrix });
      hydrateAccessControl({ roles: data.roles, matrix: data.matrix });
      setDirty(false);
      toast.success(t("saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading || !doc) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  return (
    <div>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button
            type="button"
            className="rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90"
            disabled={!dirty || saving}
            onClick={() => void handleSave()}
          >
            {saving ? t("saving") : t("save")}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="rounded-xl border border-border/60 bg-white p-4">
          <RoleList
            roles={doc.roles}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={handleCreate}
            onRename={handleRename}
            onToggleActive={handleToggleActive}
          />
        </div>
        <div className="rounded-xl border border-border/60 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-oboya-blue-dark">
            {t("matrixTitle", {
              role:
                doc.roles.find((r) => r.id === selectedId)?.label ??
                selectedId ??
                "",
            })}
          </h2>
          {selectedId ? (
            <MatrixEditor
              roleId={selectedId}
              locked={selectedId === "super_admin"}
              matrix={doc.matrix}
              onChange={handleMatrixChange}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("selectRole")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
