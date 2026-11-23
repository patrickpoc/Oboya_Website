"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { EditorGuard, ErrorState, FormSkeleton } from "@/components/admin/common";
import { ImageField } from "@/components/admin/media/ImageField";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { usePendingApprovalNotice } from "@/components/admin/approvals/use-pending-approval-notice";
import { PendingChangeBanner } from "@/components/admin/approvals/PendingChangeBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountryFlag } from "@/components/ui/country-flag";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CONTACT_REGION_IDS,
  normalizeContactTeam,
  type ContactPerson,
  type ContactRegionId,
} from "@/lib/cms/repositories/contact-team-repository";

export default function ContactTeamAdmin() {
  const t = useTranslations("admin.website.contactTeam");
  const tCommon = useTranslations("admin.common");
  const [people, setPeople] = useState<ContactPerson[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const notifyPending = usePendingApprovalNotice();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await fetch("/api/cms/contact-team?forEdit=1", { cache: "no-store" });
      if (!res.ok) throw new Error(tCommon("loadFailed"));
      setPeople(normalizeContactTeam(await res.json()));
    } catch {
      setLoadFailed(true);
      toast.error(t("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; the loader sets loading state before awaiting the API
    void load();
  }, [load]);

  const update = (id: string, patch: Partial<ContactPerson>) =>
    setPeople((prev) => prev && prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const add = (region: ContactRegionId) =>
    setPeople((prev) => {
      const list = prev ?? [];
      const sortOrder = list.filter((p) => p.region === region).length;
      return [
        ...list,
        {
          id: `person-${Date.now().toString(36)}`,
          name: t("newPerson"),
          email: "",
          phone: "",
          countryCode: "",
          region,
          enabled: true,
          sortOrder,
        },
      ];
    });

  const remove = (id: string) => setPeople((prev) => prev && prev.filter((p) => p.id !== id));

  /** Swap with the neighbour in the same region and renumber that region. */
  const move = (region: ContactRegionId, index: number, dir: -1 | 1) =>
    setPeople((prev) => {
      if (!prev) return prev;
      const group = prev.filter((p) => p.region === region);
      const target = index + dir;
      if (target < 0 || target >= group.length) return prev;
      [group[index], group[target]] = [group[target], group[index]];
      const order = new Map(group.map((p, i) => [p.id, i]));
      return prev.map((p) => (order.has(p.id) ? { ...p, sortOrder: order.get(p.id)! } : p));
    });

  const handleSave = async () => {
    if (!people) return;
    if (people.some((p) => !p.name.trim())) {
      toast.error(t("invalid"));
      return;
    }
    try {
      const res = await fetch("/api/cms/contact-team", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(people),
      });
      if (!res.ok) throw new Error(tCommon("saveFailed"));
      const body = await res.json().catch(() => null);
      if (!notifyPending(body)) {
        if (Array.isArray(body)) setPeople(normalizeContactTeam(body));
        toast.success(t("saved"));
      }
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  if (loading) return <FormSkeleton />;
  if (loadFailed || !people) {
    return <ErrorState message={tCommon("editorLoadFailed")} onRetry={() => void load()} />;
  }

  return (
    <Can module="website" action="edit" fallback={<AccessDenied />}>
      <div>
        <AdminPageHeader title={t("title")} description={t("description")} />
        <PendingChangeBanner entityType="contact_team" entityId="contact-team" />

        <div className="grid max-w-3xl gap-6">
          {CONTACT_REGION_IDS.map((region) => {
            const group = people
              .filter((p) => p.region === region)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            return (
              <Card key={region}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{t(`regions.${region}`)}</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => add(region)}
                  >
                    <Plus className="size-4" /> {t("addPerson")}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.length === 0 && (
                    <p className="text-sm text-muted-foreground">{t("emptyRegion")}</p>
                  )}
                  {group.map((person, index) => (
                    <div key={person.id} className="space-y-3 rounded-lg border p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>{t("name")}</Label>
                          <Input
                            value={person.name}
                            onChange={(e) => update(person.id, { name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t("email")}</Label>
                          <Input
                            type="email"
                            value={person.email}
                            onChange={(e) => update(person.id, { email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t("phone")}</Label>
                          <Input
                            value={person.phone}
                            onChange={(e) => update(person.id, { phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t("country")}</Label>
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm border">
                              <CountryFlag code={person.countryCode} />
                            </span>
                            <Input
                              maxLength={2}
                              value={person.countryCode}
                              className="uppercase"
                              onChange={(e) =>
                                update(person.id, { countryCode: e.target.value.toUpperCase() })
                              }
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{t("countryHint")}</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label>{t("region")}</Label>
                          <Select
                            value={person.region}
                            onValueChange={(next) =>
                              next && update(person.id, { region: next as ContactRegionId })
                            }
                          >
                            <SelectTrigger className="h-9 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONTACT_REGION_IDS.map((id) => (
                                <SelectItem key={id} value={id}>
                                  {t(`regions.${id}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <ImageField
                        label={t("photo")}
                        value={person.photo ?? ""}
                        optional
                        onChange={(url) => update(person.id, { photo: url || undefined })}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <Switch
                            checked={person.enabled}
                            onCheckedChange={(on) => update(person.id, { enabled: on })}
                          />
                          {t("enabled")}
                        </label>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("moveUp")}
                            disabled={index === 0}
                            onClick={() => move(region, index, -1)}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("moveDown")}
                            disabled={index === group.length - 1}
                            onClick={() => move(region, index, 1)}
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={t("delete")}
                            onClick={() => remove(person.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          <Button onClick={handleSave} className="w-fit rounded-full bg-oboya-green">
            {t("save")}
          </Button>
          <EditorGuard dirty onSave={() => void handleSave()} />
        </div>
      </div>
    </Can>
  );
}
