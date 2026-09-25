"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AccessRoleDefinition } from "@/lib/cms/permissions/access-types";
import { cn } from "@/lib/utils";

type RoleListProps = {
  roles: AccessRoleDefinition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (id: string, label: string) => void;
  onRename: (id: string, label: string) => void;
  onToggleActive: (id: string) => void;
};

export function RoleList({
  roles,
  selectedId,
  onSelect,
  onCreate,
  onRename,
  onToggleActive,
}: RoleListProps) {
  const t = useTranslations("admin.accessControl");

  const handleCreate = () => {
    const id = window.prompt(t("promptRoleId"));
    if (!id?.trim()) return;
    const label = window.prompt(t("promptRoleLabel"), id.trim()) ?? id.trim();
    onCreate(id.trim().toLowerCase(), label.trim());
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-oboya-blue-dark">
          {t("rolesTitle")}
        </h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={handleCreate}
        >
          <Plus className="size-3.5" />
          {t("createRole")}
        </Button>
      </div>
      <ul className="space-y-1 overflow-y-auto">
        {roles
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((role) => {
            const selected = role.id === selectedId;
            return (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => onSelect(role.id)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-oboya-blue/40 bg-oboya-blue/5"
                      : "border-transparent hover:bg-muted/60",
                    !role.active && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-oboya-blue-dark">
                      {role.label}
                    </span>
                    {role.system ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {t("systemBadge")}
                      </Badge>
                    ) : null}
                    {!role.active ? (
                      <Badge variant="outline" className="text-[10px]">
                        {t("inactive")}
                      </Badge>
                    ) : null}
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {role.id}
                  </span>
                </button>
                {selected ? (
                  <div className="mt-1 space-y-2 rounded-lg bg-muted/40 p-2">
                    <Input
                      value={role.label}
                      onChange={(e) => onRename(role.id, e.target.value)}
                      className="h-8 text-sm"
                      aria-label={t("renameRole")}
                    />
                    {role.id !== "super_admin" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-full text-xs"
                        onClick={() => onToggleActive(role.id)}
                      >
                        {role.active ? t("deactivate") : t("activate")}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
