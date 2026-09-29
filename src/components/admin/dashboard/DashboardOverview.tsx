"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, ClipboardCheck, Inbox, Package, Timer } from "lucide-react";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { EntityAvatar } from "@/components/admin/common/EntityAvatar";
import { FilterTabs } from "@/components/admin/common/FilterBar";
import { ListSkeleton } from "@/components/admin/common/states";
import { LeadStatusPill } from "@/components/admin/leads/pills";
import { useAdmin } from "@/contexts/AdminContext";
import type { FormSubmission } from "@/lib/cms/types";
import { leadCompany, leadName, leadSlaState } from "@/lib/cms/forms/crm";
import { formatShopPrice } from "@/lib/shop/format-price";

type RecentKind = "contact" | "quote";
type RecentList = { items: FormSubmission[]; total: number };

const RECENT_LIMIT = 5;
const INBOX_HREF: Record<RecentKind, string> = {
  contact: "/admin/forms/contact",
  quote: "/admin/forms/quotes",
};

// Quiet requests fill the cards in place instead of blocking the page with the global overlay.
async function getJson<T>(url: string, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", signal, headers: { "x-admin-quiet": "1" } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

async function fetchRecent(kind: RecentKind, signal: AbortSignal): Promise<RecentList> {
  const data = await getJson<{ items?: FormSubmission[]; total?: number }>(
    `/api/cms/forms?type=${kind}&status=open&limit=${RECENT_LIMIT}&page=1`,
    signal
  );
  return { items: data?.items ?? [], total: data?.total ?? 0 };
}

const PLACEHOLDER = "—";

export function DashboardOverview() {
  const t = useTranslations("admin.dashboard");
  const tLeads = useTranslations("admin.leads");
  const { can } = useAdmin();
  const canForms = can("forms", "view");
  const canApprovals = can("dashboard", "view");
  const canMarketplace = can("marketplace", "view");
  const [leadCounts, setLeadCounts] = useState<{ unread: number; open: number } | null>(null);
  const [review, setReview] = useState<number | null>(null);
  const [products, setProducts] = useState<number | null>(null);
  const [recent, setRecent] = useState<Record<RecentKind, RecentList> | null>(null);
  const [tab, setTab] = useState<RecentKind>("contact");

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    if (canForms) {
      void getJson<{ unread?: number; open?: number }>("/api/cms/forms/count", signal).then((data) => {
        if (!signal.aborted) setLeadCounts({ unread: data?.unread ?? 0, open: data?.open ?? 0 });
      });
      void Promise.all([fetchRecent("contact", signal), fetchRecent("quote", signal)]).then(
        ([contact, quote]) => {
          if (!signal.aborted) setRecent({ contact, quote });
        }
      );
    }
    if (canApprovals) {
      void getJson<{ review?: number }>("/api/cms/change-requests/count", signal).then((data) => {
        if (!signal.aborted) setReview(data?.review ?? 0);
      });
    }
    if (canMarketplace) {
      void getJson<{ unitStats?: { active?: number } }>(
        "/api/cms/products?fields=table&tab=active&limit=1&page=1",
        signal
      ).then((data) => {
        if (!signal.aborted) setProducts(data?.unitStats?.active ?? 0);
      });
    }
    return () => controller.abort();
  }, [canForms, canApprovals, canMarketplace]);

  const recentItems = recent ?? { contact: { items: [], total: 0 }, quote: { items: [], total: 0 } };
  const overdue = [...recentItems.contact.items, ...recentItems.quote.items].filter(
    (row) => leadSlaState(row) === "overdue"
  ).length;
  const current = recentItems[tab];

  return (
    <div className="mb-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canForms ? (
          <>
            <StatCard title={t("statNewLeads")} value={leadCounts?.unread ?? PLACEHOLDER} icon={Inbox} />
            <StatCard
              title={t("statOverdueLeads")}
              value={leadCounts ? overdue || leadCounts.open : PLACEHOLDER}
              icon={Timer}
            />
          </>
        ) : null}
        {canApprovals ? (
          <StatCard title={t("statPendingApprovals")} value={review ?? PLACEHOLDER} icon={ClipboardCheck} />
        ) : null}
        {canMarketplace ? (
          <StatCard title={t("statPublishedProducts")} value={products ?? PLACEHOLDER} icon={Package} />
        ) : null}
      </div>
      {canForms ? (
        <section className="rounded-xl border border-border/60 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <FilterTabs
              value={tab}
              onChange={(value) => setTab(value as RecentKind)}
              options={[
                { value: "contact", label: t("recentLeads"), count: recent?.contact.total },
                { value: "quote", label: t("recentQuotes"), count: recent?.quote.total },
              ]}
            />
            <Link href={INBOX_HREF[tab]} className="text-xs font-medium text-oboya-blue-light hover:underline">
              {t("viewInbox")}
            </Link>
          </div>
          {!recent ? (
            <ListSkeleton rows={3} />
          ) : current.items.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              {tab === "contact" ? t("noRecentLeads") : t("noRecentQuotes")}
            </p>
          ) : (
            <ul className="divide-y">
              {current.items.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`${INBOX_HREF[tab]}/${row.id}`}
                    className="flex items-center gap-3 rounded-md py-2 transition-colors hover:bg-oboya-soft-white"
                  >
                    <EntityAvatar name={leadName(row)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{leadName(row)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {tab === "quote"
                          ? [
                              leadCompany(row),
                              formatShopPrice(Number(row.data.total ?? 0), String(row.data.currency ?? "USD")),
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : String(row.data.subject ?? leadCompany(row) ?? "")}
                      </p>
                    </div>
                    <LeadStatusPill status={row.status} label={tLeads(`status.${row.status}`)} />
                    <ChevronRight className="size-4 shrink-0 text-oboya-blue-dark/40" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
