"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { EntityAvatar } from "@/components/admin/common/EntityAvatar";
import { EmptyState } from "@/components/admin/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormPiiActions } from "@/components/admin/forms/FormPiiActions";
import { LeadPriorityPill, LeadStatusPill } from "@/components/admin/leads/pills";
import { emitLeadsChanged } from "@/components/admin/leads/use-lead-counts";
import {
  FORM_PRIORITIES,
  FORM_SUBMISSION_STATUSES,
  type CmsUser,
  type FormActivity,
  type FormPriority,
  type FormSubmission,
  type FormSubmissionPatch,
  type FormSubmissionStatus,
} from "@/lib/cms/types";
import {
  isRedacted,
  leadCompany,
  leadCountry,
  leadEmail,
  leadName,
} from "@/lib/cms/forms/crm";
import { formatShopPrice } from "@/lib/shop/format-price";
import { cn } from "@/lib/utils";

export type StaffOption = Pick<CmsUser, "id" | "name">;

type QuoteLineItem = {
  productId?: string;
  variantId?: string | null;
  variantName?: string | null;
  variantColor?: string | null;
  image?: string;
  sku?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number | null;
  lineTotal?: number | null;
};

function QuoteLineRow({ item, currency }: { item: QuoteLineItem; currency: string }) {
  const t = useTranslations("admin.leads.detail");
  const quantity = Number(item.quantity ?? 1);
  const onRequest = item.unitPrice === null && item.lineTotal === null;
  const unitPrice = Number(item.unitPrice ?? 0);
  const lineTotal = Number(item.lineTotal ?? unitPrice * quantity);
  const unitLabel = onRequest ? t("onRequest") : formatShopPrice(unitPrice, currency);
  const lineLabel = onRequest ? t("onRequest") : formatShopPrice(lineTotal, currency);
  const variantSuffix = item.variantName ? ` (${item.variantName})` : "";
  const title =
    item.name && variantSuffix && item.name.endsWith(variantSuffix)
      ? item.name.slice(0, -variantSuffix.length)
      : (item.name ?? item.sku ?? "—");

  return (
    <li className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 bg-white p-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto]">
      <div className="relative size-16 overflow-hidden rounded-md bg-oboya-soft-white sm:size-[4.5rem]">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- catalog URLs from CMS storage
          <img src={item.image} alt={title} className="size-full object-contain p-1" loading="lazy" />
        ) : null}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-semibold text-oboya-blue-dark">{title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.sku ? (
            <span>
              {t("sku")}: <span className="font-medium text-oboya-blue-dark">{item.sku}</span>
            </span>
          ) : null}
          {item.variantName ? (
            <span className="inline-flex items-center gap-1.5">
              {t("color")}:
              {item.variantColor ? (
                <span
                  className="size-3 rounded-full ring-1 ring-border"
                  style={{ backgroundColor: item.variantColor }}
                  aria-hidden
                />
              ) : null}
              <span className="font-medium text-oboya-blue-dark">{item.variantName}</span>
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground sm:hidden">
          {onRequest ? (
            <>
              {quantity.toLocaleString()} ×{" "}
              <span className="font-semibold text-oboya-blue-dark">{lineLabel}</span>
            </>
          ) : (
            <>
              {quantity.toLocaleString()} × {unitLabel} ={" "}
              <span className="font-semibold text-oboya-blue-dark">{lineLabel}</span>
            </>
          )}
        </p>
      </div>
      <dl className="hidden grid-cols-3 gap-5 text-right text-xs sm:grid">
        <div>
          <dt className="text-muted-foreground">{t("quantity")}</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-oboya-blue-dark">
            {quantity.toLocaleString()}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("unitPrice")}</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-oboya-blue-dark">
            {unitLabel}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("lineTotal")}</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-oboya-blue-dark">
            {lineLabel}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function leadMeta(row: FormSubmission) {
  const raw = row.data.meta;
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

export function LeadDetail({
  submission,
  related = [],
  activities = [],
  staff,
  canEdit,
  canDelete,
  onUpdated,
  compact,
}: {
  submission: FormSubmission;
  related?: FormSubmission[];
  activities?: FormActivity[];
  staff: StaffOption[];
  canEdit: boolean;
  canDelete: boolean;
  onUpdated: (next: FormSubmission) => void;
  compact?: boolean;
}) {
  const t = useTranslations("admin.leads");
  const tCommon = useTranslations("admin.common");
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [extraActivities, setExtraActivities] = useState<FormActivity[]>([]);
  const [tagInput, setTagInput] = useState("");

  const timeline = useMemo(
    () =>
      [...extraActivities, ...activities].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [activities, extraActivities]
  );

  const name = leadName(submission);
  const email = leadEmail(submission);
  const phone = String(submission.data.phone ?? "");
  const redacted = isRedacted(submission);
  const meta = leadMeta(submission);
  const utm = meta.utm && typeof meta.utm === "object" ? (meta.utm as Record<string, string>) : {};
  const items = Array.isArray(submission.data.items) ? (submission.data.items as QuoteLineItem[]) : [];
  const currency = String(submission.data.currency ?? "USD");
  const baseHref = submission.type === "quote" ? "/admin/forms/quotes" : "/admin/forms/contact";

  const patch = async (body: FormSubmissionPatch & { mergeInto?: string[] }) => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms/forms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submission.id, ...body }),
      });
      const data = (await res.json()) as FormSubmission & { item?: FormSubmission; error?: string };
      if (!res.ok) throw new Error(data.error ?? tCommon("updateFailed"));
      const next = data.item ?? data;
      onUpdated(next);
      emitLeadsChanged();
      toast.success(body.mergeInto ? t("merged") : t("updated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    const body = noteDraft.trim();
    if (!body) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/forms/${submission.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = (await res.json()) as { activity?: FormActivity; error?: string };
      if (!res.ok) throw new Error(data.error ?? tCommon("updateFailed"));
      if (data.activity) setExtraActivities((prev) => [data.activity!, ...prev]);
      setNoteDraft("");
      toast.success(t("noteAdded"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon("updateFailed"));
    } finally {
      setSaving(false);
    }
  };

  const reply = async () => {
    const subject = String(submission.data.subject ?? submission.data.referenceId ?? name);
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}`;
    await fetch(`/api/cms/forms/${submission.id}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "reply", body: "mailto" }),
    }).catch(() => undefined);
    await patch({ status: "replied" });
  };

  const tags = submission.tags ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start gap-3">
        <EntityAvatar name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-oboya-blue-dark">{name}</h2>
            <LeadStatusPill status={submission.status} label={t(`status.${submission.status}`)} />
            <LeadPriorityPill
              priority={submission.priority ?? "normal"}
              label={t(`priority.${submission.priority ?? "normal"}`)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {leadCompany(submission) || leadCountry(submission) || email}
          </p>
          {submission.type === "quote" && submission.data.referenceId ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("detail.reference")}:{" "}
              <span className="font-mono font-semibold text-oboya-blue-dark">
                {String(submission.data.referenceId)}
              </span>
            </p>
          ) : null}
        </div>
        {compact ? (
          <Link href={`${baseHref}/${submission.id}`} className="text-xs font-medium text-oboya-blue-light hover:underline">
            {t("detail.openFull")}
          </Link>
        ) : null}
      </header>

      {canEdit ? (
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {t("detail.assignTo")}
            <select
              value={submission.assigneeId ?? ""}
              disabled={saving}
              onChange={(e) => {
                const user = staff.find((s) => s.id === e.target.value);
                void patch({ assigneeId: user?.id ?? null, assigneeName: user?.name ?? null });
              }}
              className="h-8 rounded-md border border-border/70 bg-white px-2 text-xs text-oboya-blue-dark"
            >
              <option value="">{t("filters.unassigned")}</option>
              {staff.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {tCommon("status")}
            <select
              value={submission.status}
              disabled={saving}
              onChange={(e) => void patch({ status: e.target.value as FormSubmissionStatus })}
              className="h-8 rounded-md border border-border/70 bg-white px-2 text-xs text-oboya-blue-dark"
            >
              {FORM_SUBMISSION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {t("filters.priority")}
            <select
              value={submission.priority ?? "normal"}
              disabled={saving}
              onChange={(e) => void patch({ priority: e.target.value as FormPriority })}
              className="h-8 rounded-md border border-border/70 bg-white px-2 text-xs text-oboya-blue-dark"
            >
              {FORM_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {t(`priority.${priority}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-oboya-blue-dark">{t("detail.contact")}</h3>
        {redacted ? (
          <p className="text-sm text-muted-foreground">{t("detail.redacted")}</p>
        ) : (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">{tCommon("email")}</dt>
              <dd>{email || "—"}</dd>
            </div>
            {phone ? (
              <div>
                <dt className="text-xs text-muted-foreground">{tCommon("phone")}</dt>
                <dd>{phone}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs text-muted-foreground">{t("filters.country")}</dt>
              <dd>{leadCountry(submission) || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("columns.company")}</dt>
              <dd>{leadCompany(submission) || "—"}</dd>
            </div>
          </dl>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-oboya-blue-dark">{t("detail.message")}</h3>
        <p className="whitespace-pre-wrap rounded-lg bg-oboya-soft-white p-3 text-sm text-oboya-blue-dark">
          {String(submission.data.message || submission.data.subject || "—")}
        </p>
      </section>

      {items.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-oboya-blue-dark">{t("detail.lineItems")}</h3>
            <span className="text-xs text-muted-foreground">
              {t("detail.itemsCount", { count: items.length })}
            </span>
          </div>
          <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
            {items.map((item, i) => (
              <QuoteLineRow
                key={`${item.sku ?? item.productId ?? i}-${item.variantId ?? i}`}
                item={item}
                currency={currency}
              />
            ))}
          </ul>
          <div className="flex items-center justify-between rounded-lg bg-oboya-soft-white px-4 py-3">
            <span className="text-sm font-medium text-oboya-blue-dark">
              {Number(submission.data.pendingItemCount ?? 0) > 0
                ? t("detail.partialEstimate")
                : t("detail.estimatedTotal")}
            </span>
            <span className="text-base font-semibold text-oboya-green">
              {submission.data.total === null
                ? t("detail.onRequest")
                : formatShopPrice(Number(submission.data.total ?? 0), currency)}
            </span>
          </div>
        </section>
      ) : null}

      <section className="space-y-2 text-sm">
        <h3 className="text-sm font-semibold text-oboya-blue-dark">{t("detail.meta")}</h3>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">{t("detail.page")}</dt>
            <dd>{String(meta.page ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("detail.locale")}</dt>
            <dd>{String(meta.locale ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("detail.referrer")}</dt>
            <dd className="truncate">{String(meta.referrer ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("detail.campaign")}</dt>
            <dd>{Object.values(utm).filter(Boolean).join(" / ") || "—"}</dd>
          </div>
        </dl>
      </section>

      {canEdit ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-oboya-blue-dark">{t("detail.tags")}</h3>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="rounded-full bg-oboya-soft-white px-2 py-0.5 text-[11px]"
                onClick={() => void patch({ tags: tags.filter((x) => x !== tag) })}
              >
                {tag} ×
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const next = tagInput.trim().toLowerCase();
              if (!next) return;
              void patch({ tags: [...tags, next] });
              setTagInput("");
            }}
          >
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder={t("detail.addTag")} />
            <Button type="submit" size="sm" variant="outline">{t("detail.addTag")}</Button>
          </form>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-oboya-blue-dark">{t("detail.history")}</h3>
          <ul className="space-y-1 text-sm">
            {related.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-2">
                <Link href={`${row.type === "quote" ? "/admin/forms/quotes" : "/admin/forms/contact"}/${row.id}`} className="text-oboya-blue-light hover:underline">
                  {leadName(row)} · {new Date(row.createdAt).toLocaleDateString()}
                </Link>
                {canEdit ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => void patch({ mergeInto: [row.id] })}>
                    {t("detail.merge")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-oboya-blue-dark">{t("detail.timeline")}</h3>
        {canEdit ? (
          <div className="flex gap-2">
            <Input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder={t("detail.notePlaceholder")} />
            <Button type="button" size="sm" disabled={saving || !noteDraft.trim()} onClick={() => void addNote()}>
              {t("detail.saveNote")}
            </Button>
          </div>
        ) : null}
        {timeline.length === 0 ? (
          <EmptyState title={t("detail.noActivities")} className="p-6 md:p-6" />
        ) : (
          <ol className="space-y-2">
            {timeline.map((activity) => (
              <li key={activity.id} className="rounded-lg border border-border/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{t(`detail.activity.${activity.kind}`)}</span>
                  <span>{new Date(activity.createdAt).toLocaleString()}</span>
                </div>
                {activity.body ? <p className="mt-1 whitespace-pre-wrap">{activity.body}</p> : null}
                {activity.actorName ? <p className="mt-1 text-xs text-muted-foreground">{activity.actorName}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        {email && !redacted ? (
          <Button type="button" className="rounded-full bg-oboya-blue text-white hover:bg-oboya-blue/90" onClick={() => void reply()}>
            {t("detail.reply")}
          </Button>
        ) : null}
        {canEdit && submission.status !== "replied" ? (
          <Button type="button" variant="outline" className="rounded-full" onClick={() => void patch({ status: "replied" })}>
            {t("detail.markReplied")}
          </Button>
        ) : null}
      </div>

      {canDelete ? (
        <section className={cn("rounded-lg border border-oboya-orange/30 p-4", compact && "mt-2")}>
          <h3 className="mb-3 text-sm font-semibold text-oboya-orange">{t("detail.danger")}</h3>
          <div className="flex flex-wrap gap-2">
            <FormPiiActions id={submission.id} onDone={() => onUpdated({ ...submission, data: { redacted: true } })} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
