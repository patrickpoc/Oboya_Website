"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PRODUCT_EDITOR_SELECT_CLASS } from "@/components/admin/marketplace/product-editor.constants";
import type { CmsStatus } from "@/lib/cms/types";
import { requiresReplacement, type RemovalTarget } from "@/lib/cms/taxonomy-removal";

type AffectedProduct = {
  id: string;
  name: string;
  sku: string;
  status: CmsStatus;
  deleted: boolean;
};

export type PendingRemoval = { target: RemovalTarget; label: string; usage: number };

type Props = {
  removal: PendingRemoval | null;
  /** Saved items products can move to; only used for required references. */
  replacements: Array<{ value: string; label: string }>;
  onClose: () => void;
  onRemoved: (target: RemovalTarget) => void;
};

class RemovalError extends Error {}

type BodyProps = Omit<Props, "removal"> & { removal: PendingRemoval };

/** Remounted per removal (see `key`), so state starts fresh without reset effects. */
export function FilterRemovalDialog(props: Props) {
  const { removal } = props;
  if (!removal) return null;
  return (
    <RemovalDialogBody
      key={`${removal.target.kind}:${removal.target.id}`}
      {...props}
      removal={removal}
    />
  );
}

function RemovalDialogBody({ removal, replacements, onClose, onRemoved }: BodyProps) {
  const t = useTranslations("admin.filters.removal");
  const tCommon = useTranslations("admin.common");
  const [products, setProducts] = useState<AffectedProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [replacementId, setReplacementId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const target = removal.target;
  const statusLabels: Record<CmsStatus, string> = {
    draft: t("status.draft"),
    scheduled: t("status.scheduled"),
    published: t("status.published"),
    archived: t("status.archived"),
  };
  const needsReplacement = requiresReplacement(target);

  const loadProducts = useCallback(
    async (signal?: AbortSignal) => {
      const params = new URLSearchParams({ kind: target.kind, id: target.id });
      if (target.kind === "option") params.set("groupId", target.groupId);
      try {
        const response = await fetch(`/api/cms/marketplace/filters/usage/products?${params}`, {
          cache: "no-store",
          signal,
        });
        if (!response.ok) throw new Error("load");
        const data = (await response.json()) as { total: number; products: AffectedProduct[] };
        setProducts(data.products);
        setTotal(data.total);
        setLoadFailed(false);
      } catch {
        if (!signal?.aborted) setLoadFailed(true);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [target]
  );

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state updates happen after the awaited request
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  const confirm = async () => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/cms/marketplace/filters/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, replacementId: needsReplacement ? replacementId : undefined }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        updated?: number;
        failed?: unknown[];
      } | null;
      if (!response.ok) {
        throw new RemovalError(
          payload?.failed?.length
            ? t("partialFailure", { updated: payload.updated ?? 0, failed: payload.failed.length })
            : (payload?.error ?? t("failed"))
        );
      }
      toast.success(t("success", { name: removal.label, count: payload?.updated ?? 0 }));
      onRemoved(target);
    } catch (error) {
      // Network errors carry browser text ("Failed to fetch"); only server messages are shown as is.
      toast.error(error instanceof RemovalError ? error.message : t("failed"));
      // Some products may have been moved already: show the list as it is now.
      setLoading(true);
      void loadProducts();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { name: removal.label })}</DialogTitle>
          <DialogDescription>
            {t("usedBy", { count: loading || loadFailed ? removal.usage : total })}{" "}
            {needsReplacement ? t("descriptionReplace") : t("descriptionRemove")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border/60 p-2 text-sm">
          {loading && <p className="text-muted-foreground">{tCommon("loading")}</p>}
          {loadFailed && <p className="text-destructive">{t("productsFailed")}</p>}
          {products.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-2">
              <a
                href={`/admin/marketplace/products/${product.id}`}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:underline"
              >
                {product.name} <span className="text-muted-foreground">({product.sku})</span>
              </a>
              <span className="flex shrink-0 gap-1">
                {product.deleted && <Badge variant="destructive">{t("trash")}</Badge>}
                <Badge variant="outline">{statusLabels[product.status]}</Badge>
              </span>
            </div>
          ))}
          {total > products.length && (
            <p className="text-muted-foreground">{t("moreProducts", { count: total - products.length })}</p>
          )}
        </div>

        {needsReplacement && (
          <div className="space-y-1">
            <Label htmlFor="filter-removal-replacement">{t("replacementLabel")}</Label>
            {replacements.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noReplacements")}</p>
            ) : (
              <select
                id="filter-removal-replacement"
                className={PRODUCT_EDITOR_SELECT_CLASS}
                value={replacementId}
                onChange={(event) => setReplacementId(event.target.value)}
              >
                <option value="">{t("replacementPlaceholder")}</option>
                {replacements.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={submitting} onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={submitting || loading || loadFailed || (needsReplacement && !replacementId)}
            onClick={() => void confirm()}
          >
            {submitting
              ? t("working")
              : needsReplacement
                ? t("confirmReplace")
                : t("confirmRemove")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
