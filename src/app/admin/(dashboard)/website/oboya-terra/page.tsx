"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/layout/AdminPageHeader";
import { EditorGuard, ErrorState, FormSkeleton } from "@/components/admin/common";
import { LocaleFieldTabs } from "@/components/admin/forms/LocaleFieldTabs";
import { ImageField } from "@/components/admin/media/ImageField";
import { Can } from "@/components/admin/permissions/Can";
import { AccessDenied } from "@/components/admin/permissions/AccessDenied";
import { usePendingApprovalNotice } from "@/components/admin/approvals/use-pending-approval-notice";
import { PendingChangeBanner } from "@/components/admin/approvals/PendingChangeBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { withoutApprovalMeta } from "@/lib/cms/approvals/client";
import type {
  OboyaTerraBlock,
  OboyaTerraSettings,
  OboyaTerraShopTarget,
} from "@/lib/cms/repositories/oboya-terra-repository";
import type { CmsLocale } from "@/lib/cms/types";
import type { ShopCategory } from "@/lib/shop/types";
import { normalizeCategories } from "@/lib/shop/filter-groups";

const MAX_BLOCKS = 12;
const SELECT_CLASS = "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm";

function ShopTargetFields({
  value,
  onChange,
  categories,
}: {
  value: OboyaTerraShopTarget;
  onChange: (next: OboyaTerraShopTarget) => void;
  categories: ShopCategory[];
}) {
  const t = useTranslations("admin.website.oboyaTerra");
  const subcategories = categories.find((c) => c.id === value.categoryId)?.subcategories ?? [];
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{t("category")}</Label>
        <select
          className={SELECT_CLASS}
          value={value.categoryId ?? ""}
          onChange={(e) => onChange(e.target.value ? { categoryId: e.target.value } : {})}
        >
          <option value="">{t("anyCategory")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label>{t("subcategory")}</Label>
        <select
          className={SELECT_CLASS}
          value={value.subcategoryId ?? ""}
          disabled={!value.categoryId}
          onChange={(e) =>
            onChange({
              categoryId: value.categoryId,
              ...(e.target.value ? { subcategoryId: e.target.value } : {}),
            })
          }
        >
          <option value="">{t("anySubcategory")}</option>
          {subcategories.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function OboyaTerraAdmin() {
  const t = useTranslations("admin.website.oboyaTerra");
  const tCommon = useTranslations("admin.common");
  const [settings, setSettings] = useState<OboyaTerraSettings | null>(null);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [locale, setLocale] = useState<CmsLocale>("en");
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const notifyPending = usePendingApprovalNotice();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const [res, filtersRes] = await Promise.all([
        fetch("/api/cms/oboya-terra?forEdit=1", { cache: "no-store" }),
        fetch("/api/cms/marketplace/filters", { cache: "no-store" }),
      ]);
      if (!res.ok) throw new Error(tCommon("loadFailed"));
      setSettings(await res.json());
      if (filtersRes.ok) {
        const filters = (await filtersRes.json()) as { categories?: ShopCategory[] };
        setCategories(normalizeCategories(filters.categories ?? []));
      }
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

  const handleSave = async () => {
    if (!settings) return;
    try {
      const res = await fetch("/api/cms/oboya-terra", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(tCommon("saveFailed"));
      if (data) setSettings(withoutApprovalMeta(data));
      if (!notifyPending(data)) toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  };

  if (loading) return <FormSkeleton />;
  if (loadFailed || !settings) {
    return <ErrorState message={tCommon("editorLoadFailed")} onRetry={() => void load()} />;
  }

  const updateBlock = (index: number, patch: Partial<OboyaTerraBlock>) =>
    setSettings({
      ...settings,
      blocks: settings.blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    });

  const move = (index: number, delta: number) => {
    const blocks = [...settings.blocks];
    const [item] = blocks.splice(index, 1);
    blocks.splice(index + delta, 0, item);
    setSettings({ ...settings, blocks });
  };

  const addBlock = () => {
    const empty = { "en": "", "pt-BR": "", "es": "", "zh-CN": "" };
    setSettings({
      ...settings,
      blocks: [
        ...settings.blocks,
        {
          id: `block-${Date.now().toString(36)}`,
          title: { ...empty },
          description: { ...empty },
          image: "",
          shop: {},
        },
      ],
    });
  };

  return (
    <Can module="website" action="edit" fallback={<AccessDenied />}>
      <div>
        <AdminPageHeader title={t("title")} description={t("description")} />

        <PendingChangeBanner entityType="oboya_terra" entityId="oboya-terra-page" />

        <div className="grid max-w-3xl gap-6">
          {settings.blocks.map((block, index) => (
            <Card key={block.id}>
              <CardHeader className="flex-row items-center justify-between gap-2">
                <CardTitle>{t("block", { index: index + 1 })}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("moveUp")}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("moveDown")}
                    disabled={index === settings.blocks.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("removeBlock")}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        blocks: settings.blocks.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <LocaleFieldTabs value={locale} onChange={setLocale}>
                  {(loc) => (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>{t("titleLabel")}</Label>
                        <Input
                          value={block.title[loc]}
                          onChange={(e) =>
                            updateBlock(index, { title: { ...block.title, [loc]: e.target.value } })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("descriptionLabel")}</Label>
                        <Textarea
                          rows={3}
                          value={block.description[loc]}
                          onChange={(e) =>
                            updateBlock(index, {
                              description: { ...block.description, [loc]: e.target.value },
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </LocaleFieldTabs>
                <ImageField
                  label={t("imageLabel")}
                  value={block.image}
                  onChange={(url) => updateBlock(index, { image: url })}
                />
                <div className="space-y-1.5">
                  <Label>{t("shopTarget")}</Label>
                  <p className="text-xs text-muted-foreground">{t("shopTargetHint")}</p>
                  <ShopTargetFields
                    value={block.shop}
                    categories={categories}
                    onChange={(shop) => updateBlock(index, { shop })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={settings.blocks.length >= MAX_BLOCKS}
              onClick={addBlock}
            >
              <Plus className="size-4" />
              {t("addBlock")}
            </Button>
            {settings.blocks.length >= MAX_BLOCKS && (
              <span className="text-xs text-muted-foreground">{t("maxBlocks")}</span>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("exploreSection")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ShopTargetFields
                value={settings.exploreShop}
                categories={categories}
                onChange={(exploreShop) => setSettings({ ...settings, exploreShop })}
              />
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-fit rounded-full bg-oboya-green">
            {t("save")}
          </Button>
          <EditorGuard dirty onSave={() => void handleSave()} />
        </div>
      </div>
    </Can>
  );
}
